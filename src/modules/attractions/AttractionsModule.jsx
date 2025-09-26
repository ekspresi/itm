import React, { useState, useEffect, useMemo, useRef } from 'react';
import { firebaseApi } from '../../lib/firebase';

// Importy reużywalnych komponentów
import LoadingSpinner from '../../components/LoadingSpinner';
import MessageBox from '../../components/MessageBox';
import Modal from '../../components/Modal';
import { SHARED_STYLES } from '../../lib/helpers';
import AttractionFluentCard from './AttractionFluentCard';


import {
    Button,
    Tooltip,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    MenuPopover,
    MenuTrigger,
    TabList,
    Tab,
    makeStyles,
    tokens,
} from "@fluentui/react-components";
import {
    Add24Regular,
    Filter24Regular,
    Clock24Regular,
    Archive24Regular,
    Settings24Regular,
    Options24Regular,
    Code24Regular,
} from "@fluentui/react-icons";

// Importy komponentów tego modułu
import AttractionModal from './AttractionModal';
import AttractionSettingsModal from './AttractionSettingsModal';
import AttractionDetailsModal from './AttractionDetailsModal';
import SortAndFilterPanel from './SortAndFilterPanel';
import AttractionTile from './AttractionTile';

const useStyles = makeStyles({
    // Nowy, hybrydowy styl wyrównania
    hybridButton: {
        // Celujemy w wewnętrzny kontener przycisku
        '> span': {
            display: 'flex',
            alignItems: 'baseline', // Domyślnie wyrównaj wszystko do linii bazowej (naprawia tekst)
        },
        // A teraz celujemy specyficznie w kontener z ikoną...
        '& span[class*="Button__icon"]': { // <-- DODAJ & ORAZ SPACJĘ
    alignSelf: 'center',
},
    },
});

export default function AttractionsModule({ db, user, appId }) {
    const styles = useStyles();
    const [isLoading, setIsLoading] = useState(true);
    const [attractions, setAttractions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [editingAttraction, setEditingAttraction] = useState(null);
    const [message, setMessage] = useState({ text: '', type: 'info' });
    const [config, setConfig] = useState({ tags: { type: [] }, municipalities: [], collections: [] });
    
    const [activeMainTab, setActiveMainTab] = useState('atrakcje');
    // FIX: Usunięto 'accessibility' z początkowego stanu filtrów
    const [activeFilters, setActiveFilters] = useState({ municipalities: [], types: [], collections: [], direction: null });
    const [showOpenNow, setShowOpenNow] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [viewMode, setViewMode] = useState('tiles');
    const [sortConfig, setSortConfig] = useState({ key: 'distance', direction: 'asc' });
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

    const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
    const settingsMenuRef = React.useRef(null);
    
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedAttraction, setSelectedAttraction] = useState(null);

    const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(false);
    const [generatedHtml, setGeneratedHtml] = useState('');

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
                setIsSettingsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [settingsMenuRef]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [attractionsData, configData, collectionsData] = await Promise.all([
                firebaseApi.fetchCollection('attractions_entries', { orderBy: { field: 'createdAt', direction: 'desc' } }),
                firebaseApi.fetchDocument('attractions_config', '--main--'),
                firebaseApi.fetchCollection('attractions_collections')
            ]);
            setAttractions(attractionsData);
            const baseConfig = configData || { tags: { type: [] }, municipalities: [] };
            setConfig({ ...baseConfig, collections: collectionsData || [] });

        } catch (error) {
            console.error("Błąd podczas ładowania danych AttractionsModule:", error);
            setMessage({ text: 'Błąd ładowania danych.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

     useEffect(() => { fetchData(); }, []);
    
    const isAttractionOpenNow = (attraction) => {
        try {
            const now = new Date();
            const dayIndex = (now.getDay() + 6) % 7; 
            const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const currentDayKey = dayKeys[dayIndex];
            const hoursToday = attraction.opening_hours?.[currentDayKey];

            if (!hoursToday || hoursToday.length === 0) return false;
            if (hoursToday.some(range => range.toLowerCase().includes('24h'))) return true;
            
            const nowInMinutes = now.getHours() * 60 + now.getMinutes();

            for (const range of hoursToday) {
                const match = range.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
                if (match) {
                    const [, startHour, startMin, endHour, endMin] = match.map(Number);
                    const startInMinutes = startHour * 60 + startMin;
                    const endInMinutes = endHour * 60 + endMin;
                    if (nowInMinutes >= startInMinutes && nowInMinutes < endInMinutes) return true;
                }
            }
            return false;
        } catch (error) {
            console.error("Błąd podczas sprawdzania godzin otwarcia dla:", attraction.name_pl, error);
            return false;
        }
    };
    
    const displayedAttractions = useMemo(() => {
    const parseDistance = (distanceStr) => {
        if (!distanceStr && distanceStr !== 0) return Infinity;
        const match = String(distanceStr).match(/(\d+[\.,]?\d*)/);
        return match ? parseFloat(match[1].replace(',', '.')) : Infinity;
    };
    
    // Definiujemy ID gminy Mikołajki na początku
    const mikolajkiId = (config.municipalities || []).find(m => m.name.toLowerCase().includes('mikołajki'))?.id;

    const getSortDistance = (attraction) => {
    // Logika dla atrakcji w Gminie Mikołajki
    if (attraction.municipality_id === mikolajkiId) {
        // PRIORYTET 1: Sprawdź dedykowane pole "Odległość od IT"
        const distFromIT = parseDistance(attraction.distance_mikolajki);
        if (isFinite(distFromIT)) {
            return distFromIT;
        }
        
        // PRIORYTET 2 (fallback): Jeśli pole powyżej jest puste, sprawdź kierunki jazdy
        if (attraction.directions_data && attraction.directions_data.length > 0) {
            const distances = attraction.directions_data.map(d => parseDistance(d.distance));
            return Math.min(...distances);
        }

        return Infinity; // Jeśli oba są puste
    }
    
    // Logika dla atrakcji spoza Gminy Mikołajki (bez zmian)
    if (!attraction.directions_data || attraction.directions_data.length === 0) {
        return Infinity;
    }
    const distances = attraction.directions_data.map(d => parseDistance(d.distance));
    return Math.min(...distances);
};

    let filtered = [...attractions];
    
    filtered = filtered.filter(att => (showArchived ? att.verification_status === 'Zarchiwizowane' : att.verification_status !== 'Zarchiwizowane'));

    if (activeFilters.municipalities.length > 0) {
        filtered = filtered.filter(att => activeFilters.municipalities.includes(att.municipality_id));
    }
    if (activeFilters.types.length > 0) {
        filtered = filtered.filter(att => (att.tag_ids?.type || []).some(tag => activeFilters.types.includes(tag)));
    }
    if (activeFilters.collections.length > 0) {
         filtered = filtered.filter(att => (att.collection_ids || []).some(id => activeFilters.collections.includes(id)));
    }
    if (activeFilters.direction) {
        filtered = filtered.filter(att => (att.directions_data || []).some(dir => dir.direction_id === activeFilters.direction));
    }
    if (showOpenNow) {
        filtered = filtered.filter(isAttractionOpenNow);
    }

    filtered.sort((a, b) => {
        const dir = sortConfig.direction === 'asc' ? 1 : -1;
        let valA, valB;

        switch (sortConfig.key) {
            case 'name':
                valA = a.name_pl || ''; valB = b.name_pl || '';
                return valA.localeCompare(valB, 'pl') * dir;
            case 'distance':
                // Jeśli jest aktywny filtr kierunku, sortuj tylko wg niego
                if (activeFilters.direction) {
                    valA = parseDistance(a.directions_data?.find(d => d.direction_id === activeFilters.direction)?.distance);
                    valB = parseDistance(b.directions_data?.find(d => d.direction_id === activeFilters.direction)?.distance);
                } else {
                // W przeciwnym razie, użyj nowej, uniwersalnej funkcji
                    valA = getSortDistance(a);
                    valB = getSortDistance(b);
                }
                return (valA - valB) * dir;
            case 'verification_date':
                valA = a.last_verified_date ? new Date(a.last_verified_date).getTime() : 0;
                valB = b.last_verified_date ? new Date(b.last_verified_date).getTime() : 0;
                return (valA - valB) * dir;
            case 'creation_date':
                valA = a.createdAt?.toMillis() || 0;
                valB = b.createdAt?.toMillis() || 0;
                return (valA - valB) * dir;
            default: return 0;
        }
    });
    
    return filtered;
}, [attractions, activeFilters, showOpenNow, showArchived, sortConfig, config.municipalities]);
    
const handleFilterToggle = (category, value, isMultiSelect = false) => {
     setActiveFilters(prevFilters => {
        if (isMultiSelect) {
            // Dla Combobox, 'value' to cała nowa tablica wybranych ID
            return { ...prevFilters, [category]: value };
        }
        // Logika dla pojedynczych przełączników (np. Kierunek jazdy)
        const currentValue = prevFilters[category];
        const newValue = currentValue === value ? null : value;
        return { ...prevFilters, [category]: newValue };
    });
};
    
    const handleOpenAddModal = () => { setEditingAttraction(null); setIsModalOpen(true); };
    const handleOpenEditModal = (attraction) => { setEditingAttraction(attraction); setIsModalOpen(true); };
    const handleOpenDetailsModal = (attraction) => {
        setSelectedAttraction(attraction);
        setIsDetailsModalOpen(true);
    };

    const handleSaveAttraction = async (attractionData) => {
        setIsLoading(true);
        try {
            let dataToSave = { ...attractionData };
            if (!dataToSave.id) {
                dataToSave.createdAt = new Date();
            }
            await firebaseApi.saveDocument('attractions_entries', dataToSave);
            setMessage({ text: dataToSave.id ? 'Atrakcja zaktualizowana.' : 'Atrakcja dodana.', type: 'success' });
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error("Błąd zapisu atrakcji:", error);
            setMessage({ text: 'Wystąpił błąd podczas zapisu.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDeleteAttraction = async (attractionId) => { 
        if (window.confirm('Czy na pewno chcesz usunąć tę atrakcję?')) { 
            setIsLoading(true); 
            try { 
                await firebaseApi.deleteDocument('attractions_entries', attractionId); 
                setMessage({ text: 'Atrakcja usunięta.', type: 'success' }); 
                fetchData(); 
            } catch (error) { 
                setMessage({ text: 'Wystąpił błąd podczas usuwania.', type: 'error' }); 
            } finally { 
                setIsLoading(false); 
            } 
        } 
    };

    const handleArchiveAttraction = async (attraction) => {
        if (window.confirm(`Czy na pewno chcesz zarchiwizować "${attraction.name_pl}"?`)) {
            setIsLoading(true);
            try {
                const updatedAttraction = { ...attraction, verification_status: 'Zarchiwizowane' };
                await firebaseApi.saveDocument('attractions_entries', updatedAttraction);
                setMessage({ text: 'Atrakcja została zarchiwizowana.', type: 'success' });
                fetchData();
            } catch (error) {
                setMessage({ text: 'Wystąpił błąd podczas archiwizacji.', type: 'error' });
            } finally {
                setIsLoading(false);
            }
        }
    };
    
    const handleSaveConfig = async (newConfig) => {
        setIsLoading(true);
        try {
            const { collections, ...configToSave } = newConfig;
            const promises = [];
            promises.push(
                firebaseApi.saveDocument('attractions_config', { ...configToSave, id: '--main--' })
            );
            const oldCollections = await firebaseApi.fetchCollection('attractions_collections');
            oldCollections.forEach(oldCol => {
                promises.push(firebaseApi.deleteDocument('attractions_collections', oldCol.id));
            });
            (collections || []).forEach(newCol => {
                promises.push(firebaseApi.saveDocument('attractions_collections', newCol));
            });
            await Promise.all(promises);
            setMessage({ text: 'Ustawienia zapisane pomyślnie.', type: 'success' });
            fetchData();
            setIsSettingsOpen(false);
        } catch (e) {
            console.error("Błąd zapisu konfiguracji:", e);
            setMessage({ text: 'Wystąpił krytyczny błąd zapisu ustawień.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const generateAttractionsHTML = (attractions, config) => {
    // Krok 1: Definicja stałych i funkcji pomocniczych
    const directionOrder = ['luknajno', 'prom-wierzba', 'ruciane-nida', 'piecki', 'mragowo', 'ryn', 'gizycko', 'orzysz'];
    const directionNames = {
        'luknajno': 'ŁUKNAJNO',
        'prom-wierzba': 'PROM BEŁDANY',
        'ruciane-nida': 'RUCIANE-NIDA',
        'piecki': 'PIECKI',
        'mragowo': 'MRĄGOWO',
        'ryn': 'RYN',
        'gizycko': 'GIŻYCKO',
        'orzysz': 'ORZYSZ'
    };
    
    const getSortDistance = (attraction, mikolajkiId) => {
    const parseDist = (distStr) => parseFloat(String(distStr || Infinity).replace(',', '.'));

    // Logika dla atrakcji w Gminie Mikołajki
    if (attraction.municipality_id === mikolajkiId) {
        // PRIORYTET 1: Sprawdź dedykowane pole "Odległość od IT"
        const distFromIT = parseDist(attraction.distance_mikolajki);
        if (isFinite(distFromIT)) {
            return distFromIT;
        }

        // PRIORYTET 2 (fallback): Jeśli pole powyżej jest puste, sprawdź kierunki jazdy
        if (attraction.directions_data && attraction.directions_data.length > 0) {
            const distances = attraction.directions_data.map(d => parseDist(d.distance));
            return Math.min(...distances);
        }

        return Infinity;
    }

    // Logika dla atrakcji spoza Gminy Mikołajki (bez zmian)
    if (!attraction.directions_data || attraction.directions_data.length === 0) {
        return Infinity;
    }
    const distances = attraction.directions_data.map(d => parseDist(d.distance));
    return Math.min(...distances);
};

    const getPrimaryDirection = (attraction) => {
        if (!attraction.directions_data) return null;
        for (const dirId of directionOrder) {
            if (attraction.directions_data.some(d => d.direction_id === dirId)) return dirId;
        }
        return null;
    };

    // Krok 2: Przygotowanie i posortowanie danych
    const activeAttractions = attractions.filter(att => att.verification_status !== 'Zarchiwizowane');
    const mikolajkiMunicipality = (config.municipalities || []).find(m => m.name.toLowerCase().includes('mikołajki'));
    const mikolajkiId = mikolajkiMunicipality ? mikolajkiMunicipality.id : null;

    const mikolajkiAttractions = activeAttractions
        .filter(att => att.municipality_id === mikolajkiId)
        .sort((a, b) => getSortDistance(a, mikolajkiId) - getSortDistance(b, mikolajkiId));

    const okoliceAttractions = activeAttractions
        .filter(att => att.municipality_id !== mikolajkiId)
        .sort((a, b) => {
            const dirA = getPrimaryDirection(a);
            const dirB = getPrimaryDirection(b);
            const indexA = dirA ? directionOrder.indexOf(dirA) : Infinity;
            const indexB = dirB ? directionOrder.indexOf(dirB) : Infinity;
            if (indexA !== indexB) return indexA - indexB;
            return getSortDistance(a, mikolajkiId) - getSortDistance(b, mikolajkiId);
        });

    // Krok 3: Generowanie szablonów
    const generateSingleAttractionHTML = (attraction, isMikolajkiAttraction = false) => {
        const categories = attraction.tag_ids?.type?.join(' ') || '';
        const collections = attraction.collection_ids?.join(' ') || '';
        
        const imageUrl = attraction.thumbnailUrl || attraction.squareThumbnailUrl;
        let imageHTML;
        if (imageUrl) {
            imageHTML = attraction.website ? `<a href="${attraction.website}" target="_blank"><img src="${imageUrl}"></a>` : `<img src="${imageUrl}">`;
        } else {
            imageHTML = `<div class="sh8x-placeholder-image"><i class="fas fa-image"></i></div>`;
        }

        const primaryDirectionId = isMikolajkiAttraction ? null : getPrimaryDirection(attraction);
        const directionName = primaryDirectionId ? directionNames[primaryDirectionId] : null;
        const directionHTML = directionName ? `<span><i class="fas fa-directions"></i> ${directionName}</span>` : '';

        const websiteLink = attraction.website ? `<h3><a href="${attraction.website}" target="_blank">${attraction.name_pl}</a></h3>` : `<h3>${attraction.name_pl}</h3>`;
        const addressHTML = attraction.address ? `<a href="${attraction.google_maps_url || '#'}" target="_blank"><i class="fas fa-map-marker-alt"></i> ${attraction.address}</a>` : '';
        const phoneHTML = attraction.phone ? `<a href="tel:${attraction.phone.replace(/\s/g, '')}"><i class="fas fa-phone-alt"></i> ${attraction.phone}</a>` : '';
        const descriptionHTML = `<p>${attraction.info_snippet_pl || 'Brak opisu.'}</p>`;

        return `
    <div class="sh8x-entry-extended" data-categories="${categories}" data-collections="${collections}">
        ${imageHTML}
        <div>
            ${directionHTML}
            ${websiteLink}
            ${addressHTML}
            ${phoneHTML}
        </div>
        ${descriptionHTML}
    </div>`;
    };
    
    const generateFilterBlockHTML = (idPrefix) => {
        const allCategories = config.tags?.type || [];
        const allCollections = config.collections || [];
        if (allCategories.length === 0 && allCollections.length === 0) return '';
        
        let filtersHTML = `<div id="${idPrefix}-filters-container">`;
        if (allCategories.length > 0) {
            const categoryButtons = allCategories.map(cat => `<button class="sh8x-filter-btn" data-filter-type="category" data-filter-value="${cat.id}">${cat.name}</button>`).join('');
            filtersHTML += `<div class="sh8x-filter-group" data-filter-group="category">
                <button class="sh8x-filter-btn active" data-filter-type="category" data-filter-value="all">Wszystkie kategorie</button>
                ${categoryButtons}
            </div>`;
        }
        if (allCollections.length > 0) {
            const collectionButtons = allCollections.map(col => `<button class="sh8x-filter-btn" data-filter-type="collection" data-filter-value="${col.id}">${col.name}</button>`).join('');
            filtersHTML += `<div class="sh8x-filter-group" data-filter-group="collection">
                <button class="sh8x-filter-btn active" data-filter-type="collection" data-filter-value="all">Wszystkie kolekcje</button>
                ${collectionButtons}
            </div>`;
        }
        filtersHTML += '</div>';
        return filtersHTML;
    };


    // Krok 4: Składanie całego kodu HTML w całość
    let finalHTML = `
<section class="sh8x-translate">
    <a href="https://mikolajki-eu.translate.goog/dla-turysty/atrakcje-turystyczne?_x_tr_sl=pl&_x_tr_tl=en&_x_tr_hl=pl&_x_tr_pto=wapp"><i class="fas fa-language"></i> Translate to English</a>
    <a href="https://mikolajki-eu.translate.goog/dla-turysty/atrakcje-turystyczne?_x_tr_sl=pl&_x_tr_tl=de&_x_tr_hl=pl&_x_tr_pto=wapp"><i class="fas fa-language"></i> Übersetzen Sie ins Deutsche</a>
</section>
<div id="titles">
	<div id="nulled">
		&nbsp;</div>
</div>
<script>document.getElementById('titles').appendChild(document.getElementsByTagName('h1')[0]);document.getElementById('titles').appendChild(document.getElementsByClassName('article-info')[0]);document.getElementById('nulled').remove();<\/script>
<style type="text/css">
.item-page{margin-top:1em;}.item-image img{padding: 0; height: 250px; border-top-left-radius: .5em; border-top-right-radius: .5em; width: 100%; object-fit: cover; object-position: 0 68%;}.pull-left.item-image{margin-bottom: 0;}h1{font: 700 24px/32px 'Open Sans', sans-serif;margin: 15px 0;text-align: center; text-decoration: underline;text-decoration-color: #0b78dd30;text-decoration-thickness: .2em;text-underline-offset: .1em;}.page-header{display: none;}.article-info.muted{text-align: center;padding-bottom: 0;}dd{display: inline-block; float:none !important;}.search-query.input-medium{display: none;}.item-image{width: 100%;}.top .container{border-bottom: 0;}.item-page p{text-align: justify;}#titles{font-size:0;}.content_page .content{margin: 0;}
.sh8x-translate{margin:0 auto 2em auto;background-color:#0b78dd0f;border-bottom-left-radius: .5em; border-bottom-right-radius: .5em;text-align:center;}
.sh8x-translate a{display:inline-block;border:1px solid transparent;border-radius:5px;font-family:'Open Sans', sans-serif;font-size:.8em;outline:none;padding:0em 1em;background-color:#ffffff;margin:.5em .25em;transition:color .2s !important;text-decoration:none;color:black;}
.sh8x-translate a:hover{color:#0c7198;}
.sh8x-intro{line-height: 2em; text-align: justify; font-size: .9em;}
h2.sh8x-h2{font-size: 1.1em;line-height: 1.7em;text-transform: uppercase;text-align: center;margin: 5em auto 3em auto;font-weight: 600;text-decoration: underline;text-decoration-color: #0b78dd30;text-decoration-thickness: .2em;text-underline-offset: .5em;}
.sh8x-grid{display:grid;margin:0 auto;width:100%;}
.sh8x-grid img{aspect-ratio : 4 / 3;width: 100%;border-radius: 10px;object-fit: cover;}
.sh8x-placeholder-image { aspect-ratio: 4 / 3; width: 100%; border-radius: 10px; background-color: #e5e7eb; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 3em; }
.sh8x-entry-extended{display: grid; grid-template-rows: auto auto;grid-template-columns: 3fr 5fr;gap: .5em 1em;user-select: none;border-radius: 10px;}
.sh8x-entry-extended > div{display: flex;flex-direction: column;justify-content: center;align-items: flex-start;}
.sh8x-entry-extended > div a{display: inline-block; font-size: 0.7em; line-height: 1.7em; font-weight: 600; color: #777;text-decoration: none;transition: color .2s !important;}
.sh8x-entry-extended > div a:hover{color: black;}
.sh8x-entry-extended span{font-size: 0.7em; line-height: 1.7em; font-weight: 600; color: #777;}
.sh8x-entry-extended span:first-child{margin-right: 2em;}
.sh8x-entry-extended h3{font-size: 0.8em;line-height: 1.7em;margin: 0;color: #0c7198;}
.sh8x-entry-extended h3 a{display: inherit;font-size: inherit;line-height: inherit;text-decoration: none;color: inherit;font-weight: inherit;transition: color .2s !important;}
.sh8x-entry-extended h3 a:hover{color: #11b1ee;}
.sh8x-entry-extended > p{grid-column: span 2; font-size: .85em; line-height: 2em; text-align: justify; margin: .5em 0 0 0;}
#mikolajki-filters-container, #okolice-filters-container { margin-bottom: 2em; border-top: 1px solid #eee; padding-top: 2em; }
.sh8x-filter-group { display: flex; flex-wrap: wrap; justify-content: center; gap: .5em; margin-bottom: 1.5em; }
.sh8x-filter-btn { background-color: #fff; border: 1px solid #ddd; border-radius: 20px; padding: .5em 1em; font-size: .8em; cursor: pointer; transition: all .2s; }
.sh8x-filter-btn.active { background-color: #0b78dd; color: white; border-color: #0b78dd; }
@media only screen and (min-width: 1199px){ .sh8x-grid{grid-template-columns: 1fr 1fr 1fr; gap: 3em 2em;} }
@media only screen and (min-width: 875px) and (max-width: 1199px){ .sh8x-grid{grid-template-columns: 1fr 1fr; gap: 3em 2em;} }
@media only screen and (max-width: 874px){ .sh8x-grid{grid-template-columns:1fr; gap: 2em 2em;} }
</style>

<p class="sh8x-intro">Mikołajki i ich okolice oferują mnogość atrakcji turystycznych, które warto zwiedzić w trakcie wypoczynku. Każdy znajdzie tutaj coś dla siebie - czy to zabytki sakralne, zamki, muzea historyczne, bunkry z II wojny światowej, parki rozrywki, punkty widokowe na jeziora, czy też miejsca, w których zobaczyć można zwierzęta - wszystko to i wiele więcej zebraliśmy w poniższej liście atrakcji turystycznych w Mikołajkach i okolicy.</p>
`;

    if (mikolajkiAttractions.length > 0) {
        finalHTML += `
<h2 class="sh8x-h2">Atrakcje turystyczne w Mikołajkach</h2>
${generateFilterBlockHTML('mikolajki')}
<div class="sh8x-grid" id="mikolajki-grid">
    ${mikolajkiAttractions.map(att => generateSingleAttractionHTML(att, true)).join('\n')}
</div>`;
    }

    if (okoliceAttractions.length > 0) {
        finalHTML += `
<h2 class="sh8x-h2">Atrakcje turystyczne w okolicy Mikołajek</h2>
${generateFilterBlockHTML('okolice')}
<div class="sh8x-grid" id="okolice-grid">
    ${okoliceAttractions.map(att => generateSingleAttractionHTML(att, false)).join('\n')}
</div>`;
    }

    finalHTML += `
<script>
(function() {
    function initializeFilters(containerId, gridId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const grid = document.getElementById(gridId);
        const attractionItems = grid ? Array.from(grid.querySelectorAll('.sh8x-entry-extended')) : [];
        if (attractionItems.length === 0) return;

        const filterGroups = container.querySelectorAll('.sh8x-filter-group');
        let activeFilters = {};
        filterGroups.forEach(group => {
            const groupType = group.dataset.filterGroup;
            activeFilters[groupType] = new Set(['all']);
        });

        function applyFilters() {
            attractionItems.forEach(item => {
                let isVisible = true;
                for (const groupType in activeFilters) {
                    const datasetKey = groupType === 'category' ? 'categories' : 'collections';
                    const itemValues = new Set((item.dataset[datasetKey] || '').split(' '));
                    
                    const activeGroupFilters = activeFilters[groupType];
                    
                    const groupMatch = activeGroupFilters.has('all') || [...activeGroupFilters].some(filter => itemValues.has(filter));

                    if (!groupMatch) {
                        isVisible = false;
                        break;
                    }
                }
                item.style.display = isVisible ? 'grid' : 'none';
            });
        }

        container.addEventListener('click', function(event) {
            const button = event.target.closest('.sh8x-filter-btn');
            if (!button) return;

            const filterType = button.dataset.filterType;
            const filterValue = button.dataset.filterValue;
            const filterGroup = button.parentElement;
            
            if (filterValue === 'all') {
                activeFilters[filterType].clear();
                activeFilters[filterType].add('all');
                filterGroup.querySelectorAll('.sh8x-filter-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            } else {
                activeFilters[filterType].delete('all');
                filterGroup.querySelector('[data-filter-value="all"]').classList.remove('active');
                
                if (activeFilters[filterType].has(filterValue)) {
                    activeFilters[filterType].delete(filterValue);
                    button.classList.remove('active');
                } else {
                    activeFilters[filterType].add(filterValue);
                    button.classList.add('active');
                }

                if (activeFilters[filterType].size === 0) {
                    activeFilters[filterType].add('all');
                    filterGroup.querySelector('[data-filter-value="all"]').classList.add('active');
                }
            }
            applyFilters();
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        initializeFilters('mikolajki-filters-container', 'mikolajki-grid');
        initializeFilters('okolice-filters-container', 'okolice-grid');
    });
})();
<\/script>
`;
    return finalHTML;
  };

    return (
        <div className="max-w-7xl mx-auto">
            <AttractionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveAttraction} isLoading={isLoading} editingAttraction={editingAttraction} config={config} />
            <AttractionSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} config={config} onSave={handleSaveConfig} isLoading={isLoading} />
            <AttractionDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} attraction={selectedAttraction} config={config} />
            
             <Modal 
                isOpen={isHtmlModalOpen} 
                onClose={() => setIsHtmlModalOpen(false)}
                title="Wygenerowany Kod HTML dla Atrakcji"
                maxWidth="max-w-4xl"
                footer={
                    <div className="w-full flex justify-between items-center">
                        <p className="text-xs text-gray-500">Zaznacz cały tekst i skopiuj go do swojego artykułu w Joomla.</p>
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(generatedHtml);
                                alert('Kod skopiowany do schowka!');
                            }}
                            className={SHARED_STYLES.buttons.primary}
                        >
                            <i className="fa-solid fa-copy mr-2"></i>Kopiuj kod
                        </button>
                    </div>
                }
            >
                <textarea 
                    readOnly 
                    value={generatedHtml}
                    className="w-full h-96 p-2 border border-gray-300 rounded-md font-mono text-xs bg-gray-50"
                ></textarea>
            </Modal>

<div className="flex flex-col md:flex-row items-center md:justify-between gap-4 mb-6">
    {/* LEWA STRONA PASKA */}
    <div className="flex items-center gap-2 flex-wrap">
        {activeMainTab === 'atrakcje' && (
            <>
                {/* Przełącznik widoku (pozostaje bez zmian, bo to niestandardowy komponent) */}
                <div className="flex items-center p-1 bg-gray-200 rounded-lg h-10">
                    <button onClick={() => setViewMode('list')} className={`px-3 h-full rounded-md text-sm font-semibold flex items-center gap-2 ${viewMode === 'list' ? 'bg-white shadow' : 'bg-transparent text-gray-600'}`}>
                        <i className="fa-solid fa-list"></i> Lista
                    </button>
                    <button onClick={() => setViewMode('tiles')} className={`px-3 h-full rounded-md text-sm font-semibold flex items-center gap-2 ${viewMode === 'tiles' ? 'bg-white shadow' : 'bg-transparent text-gray-600'}`}>
                        <i className="fa-solid fa-grip"></i> Kafelki
                    </button>
                        <button onClick={() => setViewMode('card')} className={`px-3 h-full rounded-md text-sm font-semibold flex items-center gap-2 ${viewMode === 'card' ? 'bg-white shadow' : 'bg-transparent text-gray-600'}`}>
        <i className="fa-solid fa-id-card"></i> Karta
    </button>
                </div>

                {/* NOWE PRZYCISKI FLUENT UI */}
                <Button icon={<Filter24Regular />} className={styles.hybridButton} onClick={() => setIsFilterPanelOpen(prev => !prev)}>
                    Sortuj i filtruj
                </Button>
                <Button 
                    icon={<Clock24Regular />} 
                    className={styles.hybridButton}
                    onClick={() => setShowOpenNow(prev => !prev)}
                    appearance={showOpenNow ? "primary" : "default"} // Zmienia wygląd, gdy aktywny
                >
                    Otwarte
                </Button>
                <Tooltip content="Pokaż zarchiwizowane" relationship="label">
                    <Button 
                        icon={<Archive24Regular />} 
                        className={styles.hybridButton}
                        onClick={() => setShowArchived(prev => !prev)}
                        appearance={showArchived ? "primary" : "default"}
                    />
                </Tooltip>
            </>
        )}
    </div>

    {/* PRAWA STRONA PASKA */}
    <div className="flex items-center gap-2">
         {activeMainTab !== 'podglad' && (
            <>
                {/* NOWE MENU NARZĘDZI */}
                <Menu>
                    <MenuTrigger disableButtonEnhancement>

                            <MenuButton className={styles.hybridButton} icon={<Settings24Regular />}>Narzędzia</MenuButton>

                    </MenuTrigger>
                    <MenuPopover>
                        <MenuList>
                            <MenuItem icon={<Options24Regular />} onClick={() => setIsSettingsOpen(true)}>
                                Ustawienia
                            </MenuItem>
                            <MenuItem icon={<Code24Regular />} onClick={() => {
                                const html = generateAttractionsHTML(attractions, config);
                                setGeneratedHtml(html);
                                setIsHtmlModalOpen(true);
                            }}>
                                Generator HTML
                            </MenuItem>
                        </MenuList>
                    </MenuPopover>
                </Menu>

                {/* NOWY PRZYCISK GŁÓWNY */}
                <Button appearance="primary" icon={<Add24Regular />} className={styles.hybridButton} onClick={handleOpenAddModal}>
                    Atrakcja
                </Button>
            </>
         )}
    </div>
</div>

<TabList 
    selectedValue={activeMainTab} 
    onTabSelect={(_, data) => setActiveMainTab(data.value)}
    className="mb-6"
>
    <Tab value="podglad">Podgląd</Tab>
    <Tab value="atrakcje">Atrakcje</Tab>
</TabList>
            
            {isFilterPanelOpen && (
                <SortAndFilterPanel 
                    config={config}
                    activeFilters={activeFilters}
                    sortConfig={sortConfig}
                    onFilterToggle={handleFilterToggle}
                    onSortChange={(key, direction) => setSortConfig({ key, direction })}
                />
            )}

            <MessageBox message={message.text} type={message.type} onDismiss={() => setMessage({ text: '', type: 'info' })} />
            
            {activeMainTab === 'podglad' && ( <div className="text-center text-gray-500 py-16"><i className="fa-solid fa-chart-pie fa-3x text-gray-300 mb-4"></i><p className="font-semibold">Dashboard (Podgląd) - w budowie</p></div> )}
            
            {activeMainTab === 'atrakcje' && (
                <div>
                    {isLoading ? <LoadingSpinner /> : (
                        <div>
                            {displayedAttractions.length === 0 ? (
                                <div className="text-center text-gray-500 py-16"><i className="fa-solid fa-map-location-dot fa-3x text-gray-300 mb-4"></i><p className="font-semibold">Brak atrakcji spełniających wybrane kryteria.</p></div>
                            ) : (
                                <>
                                    {viewMode === 'list' && (
    <div className="space-y-2">
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 text-left text-xs font-bold text-gray-500 uppercase">
            <div className="col-span-5">Nazwa</div>
            <div className="col-span-3">Adres</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Odległość</div>
            <div className="col-span-2 text-right">Akcje</div>
        </div>
        {displayedAttractions.map(att => {
    const statusStyle = att.verification_status === 'Do weryfikacji' ? 'bg-yellow-400' : (att.verification_status === 'Zarchiwizowane' ? 'bg-gray-400' : 'bg-green-500');
    
    // NOWA, POPRAWIONA LOGIKA POBIERANIA ODLEGŁOŚCI DO WYŚWIETLENIA
    const mikolajkiId = (config.municipalities || []).find(m => m.name.toLowerCase().includes('mikołajki'))?.id;
    let distanceToDisplay = Infinity;

    // Logika priorytetowa, tak jak w kafelkach i sortowaniu
    const distMkl = parseFloat(String(att.distance_mikolajki).replace(',', '.')) || Infinity;
    if (att.municipality_id === mikolajkiId && isFinite(distMkl)) {
        distanceToDisplay = distMkl;
    } else if (att.directions_data && att.directions_data.length > 0) {
        // Jeśli nie ma dystansu z Mikołajek, bierzemy najkrótszy z kierunków
        distanceToDisplay = Math.min(...(att.directions_data).map(d => parseFloat(String(d.distance).replace(',', '.')) || Infinity));
    }
    
    const distanceFormatted = isFinite(distanceToDisplay) ? `${String(distanceToDisplay).replace('.', ',')} km` : '-';

    return (
        <div key={att.id} onClick={() => handleOpenDetailsModal(att)} className="bg-white p-4 rounded-lg shadow-sm grid grid-cols-2 md:grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="col-span-2 md:col-span-5"><p className="font-semibold text-blue-800">{att.name_pl}</p></div>
            <div className="md:col-span-3"><p className="md:hidden text-xs font-bold text-gray-500 uppercase">Adres</p><p>{att.address || 'Brak'}</p></div>
            <div className="md:col-span-1"><p className="md:hidden text-xs font-bold text-gray-500 uppercase">Status</p><span title={att.verification_status} className={`w-3 h-3 block rounded-full ${statusStyle}`}></span></div>
            <div className="md:col-span-1"><p className="md:hidden text-xs font-bold text-gray-500 uppercase">Odległość</p><p>{distanceFormatted}</p></div>
            <div className="flex items-center justify-start md:justify-end gap-2 col-span-2">
                <button onClick={(e) => { e.stopPropagation(); handleOpenEditModal(att); }} className={SHARED_STYLES.toolbar.iconButton} style={{height: '32px', width: '32px'}} title="Edytuj"><i className="fa-solid fa-pencil text-sm"></i></button>
                <button onClick={(e) => { e.stopPropagation(); handleArchiveAttraction(att); }} className={SHARED_STYLES.toolbar.iconButton} style={{height: '32px', width: '32px'}} title="Archiwizuj"><i className="fa-solid fa-box-archive text-sm"></i></button>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteAttraction(att.id); }} className={`${SHARED_STYLES.toolbar.iconButton} hover:text-red-600`} style={{height: '32px', width: '32px'}} title="Usuń"><i className="fa-solid fa-trash-can text-sm"></i></button>
            </div>
        </div>
    )
})}
    </div>
)}

                                    {viewMode === 'tiles' && (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedAttractions.map(att => (
            <AttractionTile 
                key={att.id} 
                attraction={att} 
                onDetailsClick={handleOpenDetailsModal}
                onEdit={handleOpenEditModal}
                onArchive={handleArchiveAttraction}
                onDelete={handleDeleteAttraction}
                activeDirectionFilter={activeFilters.direction}
                config={config}
            />
        ))}
    </div>
)}


{viewMode === 'card' && (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedAttractions.map(att => (
            <AttractionFluentCard 
                key={att.id}
                attraction={att}
                onDetailsClick={() => handleOpenDetailsModal(att)}
                onEdit={handleOpenEditModal}
                onArchive={handleArchiveAttraction}
                onDelete={handleDeleteAttraction}
            />
        ))}
    </div>
)}


                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
import React, { useState, useEffect, useMemo } from 'react';
import { firebaseApi } from '../../lib/firebase';
import { SHARED_STYLES } from '../../lib/helpers';
import { DIRECTIONS_LIST, formatPhoneNumber } from '../../lib/helpers';
import FormField from '../../components/FormField';
import ButtonSelectGroup from '../../components/ButtonSelectGroup';

function LeafletPreview({ leafletData, attractions }) {
    
    // Funkcja pomocnicza do pobierania nazwy kierunku
    const getDirectionName = (directionId) => {
        const direction = DIRECTIONS_LIST.find(d => d.id === directionId);
        return direction ? direction.name.toUpperCase() : '';
    };

    // NOWOŚĆ: Funkcja do formatowania godzin otwarcia
    const formatOpeningHours = (hours) => {
        if (!hours || Object.keys(hours).length === 0) return null;

        const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayNamesPL = { monday: 'poniedziałek', tuesday: 'wtorek', wednesday: 'środa', thursday: 'czwartek', friday: 'piątek', saturday: 'sobota', sunday: 'niedziela' };
        
        const stringifiedHours = {};
        dayOrder.forEach(day => {
            stringifiedHours[day] = (hours[day] || []).join(', ');
        });

        const grouped = [];
        let i = 0;
        while (i < dayOrder.length) {
            const currentDay = dayOrder[i];
            const currentHours = stringifiedHours[currentDay];
            if (!currentHours) { i++; continue; }

            let j = i + 1;
            while (j < dayOrder.length && stringifiedHours[dayOrder[j]] === currentHours) {
                j++;
            }
            
            const startDay = dayNamesPL[currentDay];
            if (j > i + 1) {
                const endDay = dayNamesPL[dayOrder[j - 1]];
                grouped.push(`${startDay}-${endDay}: ${currentHours}`);
            } else {
                grouped.push(`${startDay}: ${currentHours}`);
            }
            i = j;
        }
        return grouped;
    };
    
    const previewStyle = { '--accent-color': leafletData.accentColor || '#0b78dd' };
    
    const Page1 = () => (
        <div className="leaflet-a5-panel">
            <div className="leaflet-cover-contact-bar">
                Informacja Turystyczna w Mikołajkach | 11-730 Mikołajki, plac Wolności 7 | tel. 87 421 68 50
            </div>
            <div className="flex-grow flex flex-col justify-between">
                <div 
                    className="leaflet-cover-header" 
                    style={{backgroundImage: leafletData.headerImageUrl ? `url(${leafletData.headerImageUrl})` : 'none'}}>
                     <h1 className="leaflet-cover-title">{leafletData.title || '[Tytuł Ulotki]'}</h1>
                </div>
                {/* Można dodać dolny blok kontaktowy jak w PDF */}
            </div>
        </div>
    );

    const Page4 = () => (
         <div className="leaflet-a5-panel">
             <div className="leaflet-page-inner leaflet-back-content">
                <div className="leaflet-back-contact-block">
                    <h4 style={{color: leafletData.accentColor}}>Informacja Turystyczna w Mikołajkach</h4>
                    <p>11-730 Mikołajki, plac Wolności 7</p>
                    <p>tel. 87 421 68 50</p>
                    <p>it@mikolajki.pl | mikolajki.eu</p>
                    <div className="leaflet-back-socials mt-2">
                        <i className="fab fa-facebook-square"></i> miastomikolajki
                        <i className="fab fa-instagram"></i> miasto_mikolajki
                    </div>
                </div>
                 <div className="leaflet-back-more-info">
                     więcej na/more on/mehr dazu
                     <div className="font-bold text-black text-sm">infomikolajki.pl</div>
                     <div className="font-bold text-black text-sm">mikolajki.eu/przewodnik</div>
                 </div>
                 <div className="h-24 w-24 bg-gray-200 self-center flex items-center justify-center text-gray-500">QR</div>
             </div>
         </div>
    );
    
    const ContentPages = () => {
        const midpoint = Math.ceil(attractions.length / 2);
        const page2Attractions = attractions.slice(0, midpoint);
        const page3Attractions = attractions.slice(midpoint);

        const renderAttraction = (att) => {
            const direction = att.directions_data && att.directions_data.find(d => d.distance);
            const formattedHours = formatOpeningHours(att.opening_hours);
            return (
                <div key={att.id} className="leaflet-attraction-entry">
                    <h5 className="leaflet-attraction-title">{att.name_pl}</h5>
                    <div className="leaflet-attraction-line">
                        <span>{att.address}</span>
                        <span className="font-semibold">{direction ? `${String(direction.distance).replace('.',',')} km` : ''}</span>
                    </div>
                     <div className="leaflet-attraction-line">
                        <span><i className="leaflet-attraction-icon fa-solid fa-phone"></i>{formatPhoneNumber(att.phone)}</span>
                        <span className="font-bold uppercase" style={{color: leafletData.accentColor}}>{direction ? getDirectionName(direction.direction_id) : ''}</span>
                    </div>
                    <p className="leaflet-attraction-description">{att.info_snippet_pl}</p>
                    {formattedHours && (
                        <div className="leaflet-attraction-hours">
                            <b>Godziny otwarcia:</b>
                            {formattedHours.map((line, index) => <div key={index}>{line}</div>)}
                        </div>
                    )}
                </div>
            );
        };

        return (
            <div className="leaflet-a4-side">
                <div className="leaflet-a5-panel">
                    <div className="leaflet-page-inner">{page2Attractions.map(renderAttraction)}</div>
                </div>
                 <div className="leaflet-a5-panel">
                    <div className="leaflet-page-inner">{page3Attractions.map(renderAttraction)}</div>
                </div>
            </div>
        );
    };

    return (
        <div className="leaflet-preview-container" style={previewStyle}>
             <p className="text-xs text-center font-semibold text-gray-600 mb-2">Strona Zewnętrzna (Tył i Przód)</p>
             <div className="leaflet-a4-side">
                <Page4 />
                <Page1 />
             </div>
             <p className="text-xs text-center font-semibold text-gray-600 mt-4 mb-2">Strona Wewnętrzna (Środek)</p>
             <ContentPages />
        </div>
    );
}

export default function LeafletEditor({ initialLeaflet, onSaveSuccess, onCancel }) {
    const [isLoading, setIsLoading] = useState(false);
    const [allAttractions, setAllAttractions] = useState([]);
    const [leafletData, setLeafletData] = useState(initialLeaflet || {
        name: '',
        title: '',
        accentColor: '#0b78dd',
        headerImageUrl: '',
        selectedAttractionIds: [],
    });

    useEffect(() => {
        // Pobieramy wszystkie atrakcje, aby użytkownik mógł je wybrać
        const fetchAttractions = async () => {
            const attractions = await firebaseApi.fetchCollection('attractions_entries');
            setAllAttractions(attractions);
        };
        fetchAttractions();
    }, []);
    
    const handleDataChange = (field, value) => {
        setLeafletData(prev => ({ ...prev, [field]: value }));
    };

    const handleToggleAttraction = (attractionId) => {
        setLeafletData(prev => {
            const selectedIds = new Set(prev.selectedAttractionIds || []);
            if (selectedIds.has(attractionId)) {
                selectedIds.delete(attractionId);
            } else {
                selectedIds.add(attractionId);
            }
            return { ...prev, selectedAttractionIds: Array.from(selectedIds) };
        });
    };
    
    const handleSave = async () => {
        if (!leafletData.name.trim()) {
            alert('Nazwa ulotki jest wymagana.');
            return;
        }
        setIsLoading(true);
        try {
            await firebaseApi.saveDocument('leaflets_entries', leafletData);
            onSaveSuccess();
        } catch (error) {
            alert('Błąd zapisu ulotki.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const selectedAttractions = useMemo(() => {
        return allAttractions.filter(att => (leafletData.selectedAttractionIds || []).includes(att.id));
    }, [leafletData.selectedAttractionIds, allAttractions]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{initialLeaflet ? 'Edytuj ulotkę' : 'Tworzenie nowej ulotki'}</h2>
                <div className="flex gap-2">
                    <button onClick={onCancel} className={SHARED_STYLES.buttons.secondary}>Anuluj</button>
                    <button onClick={handleSave} disabled={isLoading} className={SHARED_STYLES.buttons.primary}>
                        {isLoading ? 'Zapisywanie...' : 'Zapisz ulotkę'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel Konfiguracji */}
                <div className="lg:col-span-1 space-y-4">
                    <FormField label="Nazwa robocza ulotki (np. Atrakcje Majówka 2026)">
                        <input type="text" value={leafletData.name} onChange={e => handleDataChange('name', e.target.value)} className="w-full p-2 border rounded-md"/>
                    </FormField>
                    <FormField label="Tytuł na okładce (np. MAJOWE ATRAKCJE)">
                        <input type="text" value={leafletData.title} onChange={e => handleDataChange('title', e.target.value)} className="w-full p-2 border rounded-md"/>
                    </FormField>
                    <FormField label="Kolor akcentu">
                        <input type="color" value={leafletData.accentColor} onChange={e => handleDataChange('accentColor', e.target.value)} className="w-full h-10 p-1 border rounded-md"/>
                    </FormField>
                    <FormField label="URL do grafiki nagłówkowej">
                         <input type="text" value={leafletData.headerImageUrl} onChange={e => handleDataChange('headerImageUrl', e.target.value)} className="w-full p-2 border rounded-md"/>
                    </FormField>
                    
                    {/* Lista wyboru atrakcji */}
                    <ButtonSelectGroup 
                        title={`Wybrane atrakcje (${selectedAttractions.length})`}
                        items={allAttractions}
                        selectedIds={leafletData.selectedAttractionIds || []}
                        onToggle={handleToggleAttraction}
                    />
                </div>
                
                {/* Podgląd Ulotki */}
                <div className="lg:col-span-2">
                    <h3 className="text-center font-semibold mb-2">Podgląd na żywo</h3>
                    // Wewnątrz LeafletEditor, w sekcji "Podgląd Ulotki"
<div className="lg:col-span-2">
    <h3 className="text-center font-semibold mb-2">Podgląd na żywo</h3>
    <LeafletPreview 
        leafletData={leafletData}
        attractions={selectedAttractions}
    />
</div>
                    <div className="bg-gray-300 p-4 rounded-lg">
                        <p className="text-center">Podgląd ulotki (do zaimplementowania w Kroku 4)</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
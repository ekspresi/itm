import React, { useState, useEffect, useMemo } from 'react';
import { firebaseApi } from '../../lib/firebase';
import { formatPhoneNumber, SHARED_STYLES } from '../../lib/helpers';

// Import reużywalnych komponentów
import LoadingSpinner from '../../components/LoadingSpinner';
import MessageBox from '../../components/MessageBox';
import AccommodationCard from '../../components/AccommodationCard';
import Toolbar from '../../components/Toolbar';

// Import modali specyficznych dla tego modułu
import AccommodationModal from './AccommodationModal';
import AccommodationFilterModal from './AccommodationFilterModal';
import AccommodationSettingsModal from './AccommodationSettingsModal';
import AccommodationSortModal from './AccommodationSortModal';

export default function AccommodationModule() {
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: 'info' });
    const [accommodations, setAccommodations] = useState([]);
    const [config, setConfig] = useState({ categories: [], attributes: [], languages: [] });
    const [location, setLocation] = useState('city');
    const [activeFilters, setActiveFilters] = useState({ categoryIds: [], attributeIds: [], languageIds: [] });
    const [isAccommodationModalOpen, setIsAccommodationModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isSortModalOpen, setIsSortModalOpen] = useState(false);
    const [sortKey, setSortKey] = useState('name_asc');
    const [editingAccommodation, setEditingAccommodation] = useState(null);
    const [viewMode, setViewMode] = useState('list');

    const displayedAccommodations = useMemo(() => {
        let filtered = [...accommodations];
        if (activeFilters.categoryIds.length > 0) { filtered = filtered.filter(acc => (acc.categoryIds || []).some(id => activeFilters.categoryIds.includes(id))); }
        if (activeFilters.attributeIds.length > 0) { filtered = filtered.filter(acc => (acc.attributeIds || []).some(id => activeFilters.attributeIds.includes(id))); }
        if (activeFilters.languageIds.length > 0) { filtered = filtered.filter(acc => (acc.languageIds || []).some(id => activeFilters.languageIds.includes(id))); }
        
        filtered.sort((a, b) => {
            if (a.isFeatured && !b.isFeatured) return -1;
            if (!a.isFeatured && b.isFeatured) return 1;
            switch (sortKey) {
                case 'name_asc': return (a.name || '').localeCompare(b.name || '', 'pl', { sensitivity: 'base' });
                case 'name_desc': return (b.name || '').localeCompare(a.name || '', 'pl', { sensitivity: 'base' });
                case 'date_asc': return (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0);
                case 'date_desc': return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
                case 'capacity_asc': return (parseInt(a.capacity, 10) || 0) - (parseInt(b.capacity, 10) || 0);
                case 'capacity_desc': return (parseInt(b.capacity, 10) || 0) - (parseInt(a.capacity, 10) || 0);
                default: return 0;
            }
        });
        return filtered;
    }, [accommodations, activeFilters, sortKey]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [accommodationsList, configData] = await Promise.all([
                    firebaseApi.fetchCollection('accommodations', { filter: { field: 'location', operator: '==', value: location } }, true),
                    firebaseApi.fetchDocument('accommodations_config', '--main--', true)
                ]);
                setAccommodations(accommodationsList);
                if (configData) { setConfig(configData); }
            } catch (error) { 
                console.error("Błąd ładowania danych modułu Noclegi:", error); 
                setMessage({ text: 'Błąd ładowania danych.', type: 'error' });
            } finally { 
                setIsLoading(false); 
            }
        };
        fetchData();
    }, [location]);

    const handleOpenAddModal = () => { setEditingAccommodation(null); setIsAccommodationModalOpen(true); };
    const handleOpenEditModal = (accommodation) => { setEditingAccommodation(accommodation); setIsAccommodationModalOpen(true); };
    const handleOpenSettingsModal = () => setIsSettingsModalOpen(true);
    const handleOpenFilterModal = () => setIsFilterModalOpen(true);
    const handleOpenSortModal = () => setIsSortModalOpen(true);
    const handleApplySort = (key) => { setSortKey(key); setIsSortModalOpen(false); };
    const handleCloseModals = () => { setIsAccommodationModalOpen(false); setIsFilterModalOpen(false); setIsSettingsModalOpen(false); setIsSortModalOpen(false); setEditingAccommodation(null); };
    
    const handleSaveConfig = async (newConfig) => {
        setIsLoading(true);
        try {
            const dataToSave = { id: '--main--', ...newConfig };
            await firebaseApi.saveDocument('accommodations_config', dataToSave, true);
            setConfig(newConfig);
            setMessage({ text: 'Ustawienia zapisane.', type: 'success' });
        } catch (error) { setMessage({ text: 'Błąd zapisu ustawień.', type: 'error' }); } finally { setIsLoading(false); handleCloseModals(); }
    };
    
    const handleSaveAccommodation = async (accommodationData) => {
        setIsLoading(true);
        try {
            let dataToSave = { ...accommodationData };
            if (!dataToSave.id) { dataToSave.createdAt = new Date(); }
            await firebaseApi.saveDocument('accommodations', dataToSave, true);
            setMessage({ text: accommodationData.id ? 'Obiekt zaktualizowany.' : 'Obiekt dodany.', type: 'success' });
            const updatedList = await firebaseApi.fetchCollection('accommodations', { filter: { field: 'location', operator: '==', value: location } }, true);
            setAccommodations(updatedList);
        } catch (error) { console.error("Błąd zapisu obiektu:", error); setMessage({ text: 'Wystąpił błąd podczas zapisu obiektu.', type: 'error' }); } finally { setIsLoading(false); handleCloseModals(); }
    };

    const handleDeleteAccommodation = async (accommodationId) => {
        if (window.confirm('Czy na pewno chcesz usunąć ten obiekt? Tej operacji nie można cofnąć.')) {
            setIsLoading(true);
            try {
                await firebaseApi.deleteDocument('accommodations', accommodationId, true);
                setMessage({ text: 'Obiekt usunięty.', type: 'success' });
                const updatedList = await firebaseApi.fetchCollection('accommodations', { filter: { field: 'location', operator: '==', value: location } }, true);
                setAccommodations(updatedList);
            } catch (error) { console.error("Błąd usuwania obiektu:", error); setMessage({ text: 'Błąd usuwania.', type: 'error' }); } finally { setIsLoading(false); }
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <AccommodationModal isOpen={isAccommodationModalOpen} onClose={handleCloseModals} onSave={handleSaveAccommodation} editingAccommodation={editingAccommodation} config={config} isLoading={isLoading} onDelete={handleDeleteAccommodation} />
            <AccommodationFilterModal isOpen={isFilterModalOpen} onClose={handleCloseModals} config={config} activeFilters={activeFilters} onApplyFilters={setActiveFilters} />
            <AccommodationSettingsModal isOpen={isSettingsModalOpen} onClose={handleCloseModals} config={config} onSave={handleSaveConfig} isLoading={isLoading} />
            <AccommodationSortModal isOpen={isSortModalOpen} onClose={handleCloseModals} onSort={handleApplySort} currentSort={sortKey} />
            
            {/* === AKTUALIZACJA: Przekazujemy nowe propy do Toolbaru === */}
<Toolbar 
    viewMode={viewMode}
    setViewMode={setViewMode}
    onSortClick={handleOpenSortModal} 
    onFilterClick={handleOpenFilterModal} 
    onSettingsClick={handleOpenSettingsModal} 
    onAddClick={handleOpenAddModal} 
/>
{/* Nowy przełącznik lokalizacji w formie zakładek */}
<div className="flex border-b mb-6">
    <button onClick={() => setLocation('city')} className={`${SHARED_STYLES.tabs.base} ${location === 'city' ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>
        Miasto Mikołajki
    </button>
    <button onClick={() => setLocation('municipality')} className={`${SHARED_STYLES.tabs.base} ${location === 'municipality' ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>
        Gmina Mikołajki
    </button>
</div>
            <MessageBox 
                message={message.text} 
                type={message.type}
                onDismiss={() => setMessage({ text: '', type: 'info' })}
            />
            
            {isLoading ? <LoadingSpinner /> : displayedAccommodations.length === 0 ? (
                <div className="text-center text-gray-500 py-16">
                    <i className="fa-solid fa-bed fa-3x text-gray-300 mb-4"></i>
                    <p className="font-semibold">Brak obiektów do wyświetlenia.</p>
                    <p className="text-sm">Spróbuj zmienić filtry lub dodać nowy obiekt.</p>
                </div>
            ) : (
                <>
                    {/* === NOWA LOGIKA RENDEROWANIA: Widok kafelków === */}
                    {viewMode === 'tiles' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {displayedAccommodations.map(accommodation => (<AccommodationCard key={accommodation.id} accommodation={accommodation} onEdit={handleOpenEditModal} onDelete={handleDeleteAccommodation} />))}
                        </div>
                    )}
                    
                    {/* === NOWA LOGIKA RENDEROWANIA: Widok listy === */}
                    {viewMode === 'list' && (
                        <div className="space-y-4">
                            {/* Nagłówek listy (widoczny na większych ekranach) */}
                            <div className="hidden md:grid grid-cols-12 gap-4 px-4 text-left text-xs font-bold text-gray-500 uppercase">
                                <div className="col-span-4">Nazwa</div>
                                <div className="col-span-3">Adres</div>
                                <div className="col-span-2">Telefon</div>
                                <div className="col-span-1 text-center">Miejsca</div>
                                <div className="col-span-2 text-right">Akcje</div>
                            </div>
                            
                            {/* Kontener na wiersze listy */}
<div className="space-y-2">
    {displayedAccommodations.map(accommodation => (
        <div key={accommodation.id} className="bg-white p-4 rounded-lg shadow-sm grid grid-cols-2 md:grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors">
            {/* Kolumna: Nazwa */}
            <div className="col-span-2 md:col-span-4">
                <p className="font-semibold text-blue-800">{accommodation.name}</p>
            </div>
            
            {/* Kolumna: Adres */}
            <div className="md:col-span-3">
                <p className="md:hidden text-xs font-bold text-gray-500 uppercase">Adres</p>
                <p>{accommodation.address || 'Brak'}</p>
            </div>
            
            {/* Kolumna: Telefon */}
            <div className="md:col-span-2">
                    <p className="md:hidden text-xs font-bold text-gray-500 uppercase">Telefon</p>
                    <p>{formatPhoneNumber(accommodation.phone)}</p>
            </div>

            {/* Kolumna: Miejsca */}
            <div className="text-left md:text-center md:col-span-1">
                    <p className="md:hidden text-xs font-bold text-gray-500 uppercase">Miejsca</p>
                    <p className="font-semibold">{accommodation.capacity || '-'}</p>
            </div>
            
            {/* Kolumna: Akcje */}
            <div className="flex items-center justify-start md:justify-end gap-2 col-span-2">
                <button onClick={() => handleOpenEditModal(accommodation)} className={SHARED_STYLES.toolbar.iconButton} style={{height: '32px', width: '32px'}} title="Edytuj">
                    <i className="fa-solid fa-pencil text-sm"></i>
                </button>
                <button onClick={() => handleDeleteAccommodation(accommodation.id)} className={`${SHARED_STYLES.toolbar.iconButton} hover:text-red-600`} style={{height: '32px', width: '32px'}} title="Usuń">
                    <i className="fa-solid fa-trash-can text-sm"></i>
                </button>
            </div>
        </div>
    ))}
</div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
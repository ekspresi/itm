import React, { useState, useEffect, useMemo, useRef } from 'react';
import { firebaseApi, callCloudFunction } from '../../lib/firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/functions';

// Importy komponentów reużywalnych
import LoadingSpinner from '../../components/LoadingSpinner';
import MessageBox from '../../components/MessageBox';
import { SHARED_STYLES } from '../../lib/helpers';

// Importy komponentów tego modułu
import GastronomyTile from './GastronomyTile';
import GastronomyDetailsModal from './GastronomyDetailsModal';
import GastronomyPreviewModal from './GastronomyPreviewModal';
import SuggestionTile from './SuggestionTile';
import GastronomySettingsModal from './GastronomySettingsModal';
import GastronomyModal from './GastronomyModal';
import GastronomySortAndFilterPanel from './GastronomySortAndFilterPanel';

export default function GastronomyModule({ db, user, appId }) {
            const [isLoading, setIsLoading] = useState(false);
            const [message, setMessage] = useState({ text: '', type: 'info' });
            const [activeTab, setActiveTab] = useState('list');
            const [gastronomyList, setGastronomyList] = useState([]);
            const [config, setConfig] = useState({ categories: [], cuisines: [], rejected_place_ids: [] });
            const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
            const [activeFilters, setActiveFilters] = useState({ outdoorSeating: false, servesBreakfast: false, delivery: false, wheelchairAccessibleEntrance: false });
            const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
            const [isModalOpen, setIsModalOpen] = useState(false);
            const [isSettingsOpen, setIsSettingsOpen] = useState(false);
            const [editingPlace, setEditingPlace] = useState(null);
            const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
            const [selectedPlace, setSelectedPlace] = useState(null);
            const [suggestions, setSuggestions] = useState(null);
            const [isDiscovering, setIsDiscovering] = useState(false);
            const [addingId, setAddingId] = useState(null);
            const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
            const [previewData, setPreviewData] = useState(null);
            const [isLoadingPreview, setIsLoadingPreview] = useState(false);
            const [rejectingId, setRejectingId] = useState(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [data, configData] = await Promise.all([
                firebaseApi.fetchCollection('gastronomy_entries', { orderBy: { field: 'createdAt', direction: 'desc' } }),
                firebaseApi.fetchDocument('gastronomy_config', '--main--')
            ]);
            setGastronomyList(data);
            if(configData) setConfig(configData);
        } catch (error) {
            setMessage({ text: "Nie udało się wczytać danych.", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

            const displayedPlaces = useMemo(() => {
                let filtered = [...gastronomyList];
                if (activeFilters.outdoorSeating) filtered = filtered.filter(p => p.outdoorSeating);
                if (activeFilters.servesBreakfast) filtered = filtered.filter(p => p.servesBreakfast);
                if (activeFilters.delivery) filtered = filtered.filter(p => p.delivery);
                if (activeFilters.wheelchairAccessibleEntrance) filtered = filtered.filter(p => p.wheelchairAccessibleEntrance);
                filtered.sort((a, b) => {
                    const dir = sortConfig.direction === 'asc' ? 1 : -1;
                    if (sortConfig.key === 'name') return (a.name || '').localeCompare(b.name || '', 'pl') * dir;
                    if (sortConfig.key === 'createdAt') return ((a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0)) * dir;
                    return 0;
                });
                return filtered;
            }, [gastronomyList, activeFilters, sortConfig]);

    const handleFilterToggle = (key, value) => {
        setActiveFilters(prev => ({ ...prev, [key]: value }));
    };

const handleMassUpdate = async () => {
        const placesToUpdate = gastronomyList.filter(p => p.managed_by_google);
        if (placesToUpdate.length === 0) {
            alert("Brak obiektów do zaktualizowania (dla żadnego nie jest włączona synchronizacja).");
            return;
        }
        if (window.confirm(`Czy chcesz zaktualizować godziny i status dla ${placesToUpdate.length} obiektów?`)) {
            setIsLoading(true);
            let successCount = 0;
            try {
                // ZMIANA: Używamy nowej, lżejszej funkcji
                const updateFunction = firebase.app().functions('europe-central2').httpsCallable('updateGastronomyHours');
                for (const place of placesToUpdate) {
                    const result = await updateFunction({ placeId: place.google_place_id });
                    if (result.data.success) {
                        // Zapisujemy tylko zaktualizowane pola, reszta zostaje bez zmian
                        await firebaseApi.saveDocument('gastronomy_entries', { 
                            id: place.id,
                            opening_hours: result.data.data.opening_hours,
                            status: result.data.data.status
                        });
                        successCount++;
                    }
                }
                setMessage({ text: `Pomyślnie zaktualizowano ${successCount} z ${placesToUpdate.length} obiektów.`, type: 'success' });
            } catch (error) {
                setMessage({ text: `Wystąpił błąd podczas aktualizacji: ${error.message}`, type: 'error' });
            } finally {
                fetchData();
                setIsLoading(false);
            }
        }
    };

    const handleDiscover = async () => {
        setIsDiscovering(true);
        setSuggestions(null);
        setMessage({ text: '', type: 'info' });
        try {
            const existingIds = gastronomyList.map(p => p.google_place_id);
            const rejectedIds = config.rejected_place_ids || [];
            const allExcludedIds = [...new Set([...existingIds, ...rejectedIds])];
            
            const discoverFunction = firebase.app().functions('europe-central2').httpsCallable('discoverGastronomyPlaces');
            const result = await discoverFunction({ excludedPlaceIds: allExcludedIds });

            if (result.data.success) {
                setSuggestions(result.data.data);
                if (result.data.data.length === 0) {
                    setMessage({ text: 'Nie znaleziono żadnych nowych miejsc w okolicy.', type: 'info' });
                }
            } else {
                throw new Error(result.data.error || 'Nieznany błąd funkcji.');
            }
        } catch (error) {
            setMessage({ text: `Wystąpił błąd: ${error.message}`, type: 'error' });
        } finally {
            setIsDiscovering(false);
        }
    };
    
    const handleAddFromSuggestion = async (placeId) => {
        setAddingId(placeId);
        try {
            const getDetailsFunction = firebase.app().functions('europe-central2').httpsCallable('getGastronomyPlaceDetails');
            const result = await getDetailsFunction({ placeId: placeId });
            if (!result.data.success) { throw new Error(result.data.error || 'Nie udało się pobrać szczegółów miejsca.'); }
            
            const placeData = result.data.data;
            const dataToSave = {
                ...placeData,
                custom_description_pl: '', category_ids: [], cuisine_ids: [],
                is_seasonal: false, imageUrl: '', thumbnailUrl: '', squareThumbnailUrl: '',
                image_alt_text: '', is_active: true, managed_by_google: true,
                createdAt: new Date(),
            };
            
            const newDocRef = await firebaseApi.saveDocument('gastronomy_entries', dataToSave);
            const newPlace = { id: newDocRef.id, ...dataToSave };

            setSuggestions(prev => prev.filter(s => s.google_place_id !== placeId));
            setGastronomyList(prev => [newPlace, ...prev]);

            setMessage({ text: `Dodano "${placeData.name}" do bazy!`, type: 'success' });
        } catch (error) {
            setMessage({ text: `Wystąpił błąd: ${error.message}`, type: 'error' });
        } finally {
            setAddingId(null);
        }
    };

    const handlePreview = async (placeId) => {
        setIsLoadingPreview(true);
        setIsPreviewModalOpen(true);
        setPreviewData(null);
        try {
            const getDetailsFunction = firebase.app().functions('europe-central2').httpsCallable('getGastronomyPlaceDetails');
            const result = await getDetailsFunction({ placeId: placeId });
            if (result.data.success) {
                setPreviewData(result.data.data);
            } else {
                throw new Error(result.data.error);
            }
        } catch (error) {
            setMessage({ text: `Błąd podglądu: ${error.message}`, type: 'error' });
            setIsPreviewModalOpen(false);
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handleReject = async (placeId) => {
        if (!window.confirm("Odrzucić sugestię? Nie pojawi się więcej.")) return;
        setRejectingId(placeId);
        try {
            const rejectFunction = firebase.app().functions('europe-central2').httpsCallable('rejectGastronomySuggestion');
            await rejectFunction({ placeId });
            setSuggestions(prev => prev.filter(s => s.google_place_id !== placeId));
            setMessage({ text: "Sugestia została odrzucona.", type: 'success' });
        } catch (error) {
            setMessage({ text: `Błąd: ${error.message}`, type: 'error' });
        } finally {
            setRejectingId(null);
        }
    };

            const handleOpenAddModal = () => { setEditingPlace(null); setIsModalOpen(true); };
            const handleOpenEditModal = (place) => { setEditingPlace(place); setIsModalOpen(true); };
            const handleOpenDetailsModal = (place) => { setSelectedPlace(place); setIsDetailsModalOpen(true); };

    const handleSavePlace = async (placeData) => {
        setIsLoading(true);
        try {
            let dataToSave = { ...placeData };
            if (!dataToSave.id) { dataToSave.createdAt = new Date(); }
            await firebaseApi.saveDocument('gastronomy_entries', dataToSave);
            setMessage({ text: dataToSave.id ? 'Obiekt zaktualizowany.' : 'Obiekt dodany.', type: 'success' });
            fetchData(); // Odśwież listę
        } catch (error) {
            setMessage({ text: 'Błąd zapisu.', type: 'error' });
        } finally {
            setIsLoading(false);
            setIsModalOpen(false);
        }
    };
    
    const handleDeletePlace = async (placeId) => {
        if (window.confirm("Czy na pewno chcesz usunąć ten obiekt?")) {
            setIsLoading(true);
            try {
                await firebaseApi.deleteDocument('gastronomy_entries', placeId);
                setMessage({ text: 'Obiekt usunięty.', type: 'success' });
                fetchData();
            } catch (error) {
                setMessage({ text: 'Błąd usuwania.', type: 'error' });
            } finally {
                setIsLoading(false);
            }
        }
    };
    
    const handleSaveConfig = async (newConfig) => {
        setIsLoading(true);
        try {
            await firebaseApi.saveDocument('gastronomy_config', { ...newConfig, id: '--main--' });
            setConfig(newConfig);
            setMessage({ text: 'Ustawienia zapisane.', type: 'success' });
        } catch(e) {
            setMessage({ text: 'Błąd zapisu ustawień.', type: 'error' });
        } finally {
            setIsLoading(false);
            setIsSettingsOpen(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
                    <GastronomyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSavePlace} isLoading={isLoading} editingPlace={editingPlace} config={config} setMessage={setMessage} />
                    <GastronomySettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} config={config} onSave={handleSaveConfig} isLoading={isLoading} />
                    <GastronomyPreviewModal isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} previewData={previewData} isLoading={isLoadingPreview} />
                    <GastronomyDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} place={selectedPlace} />

                    <div className="flex flex-col md:flex-row items-center md:justify-between gap-4 mb-6">
                        <div className="flex items-center gap-2 flex-wrap">
                            <button onClick={() => setIsFilterPanelOpen(p => !p)} className="bg-white hover:bg-gray-100 text-gray-800 border font-semibold text-sm h-10 px-4 rounded-lg flex items-center justify-center shadow-sm transition-colors"><i className="fa-solid fa-sort mr-2"></i>Sortuj i filtruj</button>
                            <button onClick={handleMassUpdate} className="bg-white hover:bg-gray-100 text-gray-800 border font-semibold text-sm h-10 px-4 rounded-lg" title="Aktualizuj dane z Google"><i className="fa-solid fa-sync mr-2"></i>Aktualizuj z Google</button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsSettingsOpen(true)} className={SHARED_STYLES.toolbar.iconButton} title="Ustawienia"><i className="fa-solid fa-cog"></i></button>
                            <button onClick={handleOpenAddModal} className={SHARED_STYLES.toolbar.primaryButton}><i className="fa-solid fa-plus mr-2"></i>Dodaj Obiekt</button>
                        </div>
                    </div>

                    {isFilterPanelOpen && <GastronomySortAndFilterPanel activeFilters={activeFilters} onFilterToggle={handleFilterToggle} sortConfig={sortConfig} onSortChange={(key, dir) => setSortConfig({ key, dir })} />}
                    
                    <div className="flex border-b mb-6">
                        <button onClick={() => setActiveTab('list')} className={`${SHARED_STYLES.tabs.base} ${activeTab === 'list' ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>Lista Gastronomii</button>
                        <button onClick={() => setActiveTab('suggestions')} className={`${SHARED_STYLES.tabs.base} ${activeTab === 'suggestions' ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>Sugestie</button>
                    </div>

                    <MessageBox message={message.text} type={message.type} onDismiss={() => setMessage({ text: '', type: 'info' })}/>

                    <div>
                        {activeTab === 'list' && (
                            <div>
                                {isLoading ? <LoadingSpinner /> : displayedPlaces.length === 0 ? (
                                    <div className="text-center text-gray-500 py-16">
                                        <i className="fa-solid fa-utensils fa-3x text-gray-300 mb-4"></i>
                                        <p className="font-semibold">{gastronomyList.length > 0 ? 'Brak obiektów spełniających kryteria' : 'Brak obiektów w bazie'}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {displayedPlaces.map(place => (
                                            <GastronomyTile key={place.id} place={place} onEdit={handleOpenEditModal} onDelete={handleDeletePlace} onDetailsClick={handleOpenDetailsModal} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                {activeTab === 'suggestions' && (
                    <>
                        {!suggestions && !isDiscovering && (
                            <div className="text-center text-gray-500 py-16">
                                <i className="fa-solid fa-lightbulb fa-4x text-gray-300 mb-4"></i>
                                <h3 className="text-xl font-semibold text-gray-700">Odkrywaj nowe miejsca</h3>
                                <p className="text-sm mt-2 max-w-md mx-auto">Użyj przycisku "Wyszukaj obiekty", aby przeszukać Mapy Google w poszukiwaniu restauracji, barów i kawiarni w okolicy, których nie masz jeszcze w swojej bazie.</p>
                                <div className="mt-6">
                                    <button onClick={handleDiscover} className={SHARED_STYLES.buttons.primary + " px-6 py-3 text-base"}>
                                        <i className="fa-solid fa-search mr-2"></i> Wyszukaj obiekty
                                    </button>
                                </div>
                            </div>
                        )}
                        {(suggestions || isDiscovering) && (
                            <div className="space-y-6">
                                <div className="bg-white p-4 rounded-lg shadow-md">
                                    <button onClick={handleDiscover} disabled={isDiscovering} className="flex items-center gap-3 p-4 -m-4 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-blue-800">
                                        {isDiscovering ? (
                                            <><i className="fa-solid fa-spinner fa-spin"></i> Przeszukuję...</>
                                        ) : (
                                            <><i className="fa-solid fa-search"></i> Wyszukaj ponownie</>
                                        )}
                                    </button>
                                </div>
                                {isDiscovering && <LoadingSpinner />}
                                {suggestions && (
                                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {suggestions.map(s => (
                                            <SuggestionTile 
                                                key={s.google_place_id} 
                                                suggestion={s}
                                                onAdd={() => handleAddFromSuggestion(s.google_place_id)}
                                                onEditAndAdd={() => alert("Ta funkcja zostanie podłączona w następnym kroku!")}
                                                onPreview={() => handlePreview(s.google_place_id)}
                                                onReject={() => handleReject(s.google_place_id)}
                                                isAdding={addingId === s.google_place_id}
                                                isRejecting={rejectingId === s.google_place_id}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
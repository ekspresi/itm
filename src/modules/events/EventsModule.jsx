import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

// Importy globalne
import { firebaseApi } from '../../lib/firebase';
import firebase from 'firebase/compat/app'; // Potrzebne do wywołania funkcji scrapera
import 'firebase/compat/functions';
import { SHARED_STYLES } from '../../lib/helpers';

// Importy komponentów reużywalnych
import LoadingSpinner from '../../components/LoadingSpinner';
import MessageBox from '../../components/MessageBox';

// Importy komponentów i modali tego modułu
import EventModal from './EventModal';
import EventDetailsModal from './EventDetailsModal';
import EventSettingsModal from './EventSettingsModal';
import EventSortAndFilterPanel from './EventSortAndFilterPanel';
import EventDashboardTab from './EventDashboardTab';
import EventListTab from './EventListTab';

export default function EventsModule() {
    // === GŁÓWNE STANY MODUŁU ===
    const [isLoading, setIsLoading] = useState(true);
    const [events, setEvents] = useState([]);
    const [config, setConfig] = useState({ categories: [], sources: { localFacebookPages: [], nearbyFacebookPages: [] } });
    const [message, setMessage] = useState({ text: '', type: 'info' });
    const [activeMainTab, setActiveMainTab] = useState('list');
    const [isScraping, setIsScraping] = useState(false);

    // === STANY DLA ZAKŁADEK I FILTROWANIA ===
    const [viewMode, setViewMode] = useState('list');
    const [calendarMonth, setCalendarMonth] = useState(new Date().toISOString().slice(0, 7));
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [activeFilters, setActiveFilters] = useState({ categoryIds: [], scope: null });
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [filterDate, setFilterDate] = useState(null);

    // === STANY DLA MODALI ===
    const [isEventModalOpen, setEventModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventData, setEventData] = useState({});

    const categories = config.categories || [];

    // === POBIERANIE DANYCH ===
    const fetchConfig = async () => {
        try {
            const configData = await firebaseApi.fetchDocument('events_config', '--main--');
            if (configData) {
                setConfig({
                    categories: configData.categories || [],
                    sources: configData.sources || { localFacebookPages: [], nearbyFacebookPages: [] }
                });
            }
        } catch (error) { console.error("Błąd pobierania konfiguracji:", error); }
    };

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const [localEvents, nearbyEvents] = await Promise.all([
                firebaseApi.fetchCollection('local_events'),
                firebaseApi.fetchCollection('nearby_events')
            ]);
            const processedLocal = localEvents.map(event => ({ ...event, scope: 'local' }));
            const processedNearby = nearbyEvents.map(event => ({ ...event, scope: 'nearby' }));
            setEvents([...processedLocal, ...processedNearby]);
        } catch (error) {
            setMessage({ text: 'Nie udało się pobrać listy wydarzeń.', type: 'error' });
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchConfig();
        fetchEvents();
    }, []);

    // === CENTRALNA LISTA WYSTĄPIEŃ Z UNIKALNYMI KLUCZAMI ===
    const allOccurrences = useMemo(() => {
        return events.flatMap(event => 
            (event.occurrences || []).map(occurrence => ({
                ...event,
                originalId: event.id,
                id: `${event.id}_${occurrence.eventDate}_${occurrence.startTime || 'allday'}`, // Poprawiony, unikalny klucz
                occurrenceDetails: occurrence
            }))
        );
    }, [events]);

    // === PRZYWRÓCONE FUNKCJE OBSŁUGI FILTRÓW ===
    const handleSortChange = (key, direction) => {
        setSortConfig({ key, direction });
    };

    const handleFilterToggle = (category, value, isSingleSelect = false) => {
        if (isSingleSelect) {
            setActiveFilters(prev => ({ ...prev, [category]: prev[category] === value ? null : value }));
        } else {
            setActiveFilters(prev => {
                const currentValues = new Set(prev[category] || []);
                if (currentValues.has(value)) {
                    currentValues.delete(value);
                } else {
                    currentValues.add(value);
                }
                return { ...prev, [category]: Array.from(currentValues) };
            });
        }
    };

    const handleTriggerScraper = async () => {
    if (!window.confirm("Czy na pewno chcesz uruchomić ręczny import wydarzeń z Facebooka? Może to potrwać kilka minut.")) {
        return;
    }
    setIsScraping(true);
    setMessage({ text: 'Uruchamianie importu... 🚀', type: 'info' });

    try {
        const functions = firebase.app().functions('europe-central2');
        const triggerScraper = functions.httpsCallable('triggerScraperManually');
        const result = await triggerScraper();

        if (result.data.success) {
            setMessage({ text: `Import zakończony! Znaleziono ${result.data.eventsFound} nowych wydarzeń. Odświeżam listę...`, type: 'success' });
            fetchEvents(); // Odśwież dane w aplikacji
        } else {
            throw new Error(result.data.error || 'Nieznany błąd funkcji.');
        }
    } catch (error) {
        console.error("Błąd ręcznego uruchamiania funkcji:", error);
        setMessage({ text: `Wystąpił błąd: ${error.message}`, type: 'error' });
    } finally {
        setIsScraping(false);
    }
};

    // === GŁÓWNE FUNKCJE OBSŁUGI ===
    const handleAddNewEventClick = () => {
        const initialEventState = {
            eventName_pl: '', categoryIds: [], organizer: '',
            occurrences: [{ eventDate: new Date().toISOString().slice(0, 10), startTime: '', endTime: '', schedule: [] }],
            location: '', description_pl: '', priceInfo_pl: 'Wstęp wolny',
            facebookUrl: '', imageUrl: '', thumbnailUrl: '', isFeatured: false, source: 'manual', status: 'confirmed'
        };
        setEditingEvent(null);
        setEventData(initialEventState);
        setEventModalOpen(true);
    };
    
    const handleEditEventClick = (eventToEdit) => {
        setEditingEvent(eventToEdit);
        setEventData(eventToEdit);
        setEventModalOpen(true);
    };

    const handleDeleteEvent = async (eventId) => {
        if (window.confirm("Czy na pewno chcesz usunąć to wydarzenie?")) {
            setIsLoading(true);
            try {
                const eventToDelete = events.find(e => e.id === eventId);
                const collectionName = eventToDelete.scope === 'local' ? 'local_events' : 'nearby_events';
                await firebaseApi.deleteDocument(collectionName, eventId);
                setMessage({ text: 'Wydarzenie zostało usunięte.', type: 'success' });
                fetchEvents();
            } catch (error) { setMessage({ text: 'Wystąpił błąd podczas usuwania.', type: 'error' });
            } finally { setIsLoading(false); }
        }
    };
    
    const handleSaveEvent = async (dataToSave) => {
        setIsLoading(true);
        try {
            if (!dataToSave.id) dataToSave.createdAt = new Date();
            await firebaseApi.saveDocument('local_events', dataToSave);
            setMessage({ text: dataToSave.id ? 'Wydarzenie zaktualizowane.' : 'Wydarzenie dodane.', type: 'success' });
            fetchEvents();
        } catch (error) { setMessage({ text: 'Wystąpił błąd podczas zapisu.', type: 'error' });
        } finally {
            setIsLoading(false);
            setEventModalOpen(false);
        }
    };
const handleSaveConfig = async (newConfigData) => {
        setIsLoading(true);
        try {
            // Dodajemy ID dokumentu, aby wiedzieć, który dokument zaktualizować
            await firebaseApi.saveDocument('events_config', { ...newConfigData, id: '--main--' });
            setMessage({ text: 'Ustawienia zostały zapisane.', type: 'success' });
            fetchConfig(); // Odświeżamy konfigurację w całej aplikacji
        } catch (error) {
            console.error("Błąd zapisu konfiguracji:", error);
            setMessage({ text: 'Wystąpił błąd podczas zapisu ustawień.', type: 'error' });
        } finally {
            setIsLoading(false);
            setIsSettingsModalOpen(false); // Zamykamy modal po zapisie
        }
    };
    const handleOpenDetailsModal = (event) => {
        setSelectedEvent(event);
        setIsDetailsModalOpen(true);
    };
const handleFileUpload = async (file) => {
        alert("Funkcjonalność uploadu przez PHP zostanie podłączona w następnym kroku.");
        
        // Ta funkcja na razie nic nie robi, ale musi zwrócić obiecany obiekt,
        // aby nie powodować błędów w innych częściach kodu.
        return { fullSizeUrl: '', thumbnailUrl: '' };
    };
    const changeCalendarMonth = (direction) => {
        const d = new Date(calendarMonth + '-02T12:00:00Z');
        d.setUTCMonth(d.getUTCMonth() + direction);
        setCalendarMonth(d.toISOString().slice(0, 7));
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Definicje modali */}
            <EventModal isOpen={isEventModalOpen} onCancel={() => setEventModalOpen(false)} onSave={handleSaveEvent} isLoading={isLoading} eventData={eventData} setEventData={setEventData} editingEvent={editingEvent} handleFileUpload={handleFileUpload} onDelete={handleDeleteEvent} categories={categories} />
            <EventDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} event={selectedEvent} categories={categories} onEdit={handleEditEventClick} onDelete={handleDeleteEvent} onArchive={() => {}} />
            <EventSettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} config={config} onSave={handleSaveConfig} isLoading={isLoading} />
            <MessageBox message={message.text} type={message.type} onDismiss={() => setMessage({ text: '', type: 'info' })} />

            {/* Główny pasek narzędziowy */}
            <div className="flex flex-col md:flex-row items-center md:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4 flex-wrap">
                    {activeMainTab === 'list' && (
                        <>
                            <div className="flex items-center p-1 bg-gray-200 rounded-lg h-10">
                                <button onClick={() => setViewMode('list')} className={`px-3 h-full rounded-md text-sm font-semibold flex items-center gap-2 ${viewMode === 'list' ? 'bg-white shadow' : 'bg-transparent text-gray-600'}`}>Kafelki</button>
                                <button onClick={() => setViewMode('calendar')} className={`px-3 h-full rounded-md text-sm font-semibold flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-white shadow' : 'bg-transparent text-gray-600'}`}>Kalendarz</button>
                            </div>
                            <div className="flex items-center gap-2">
                                {viewMode === 'list' ? (
                                     <input type="date" value={filterDate || ''} onChange={e => setFilterDate(e.target.value || null)} className="p-2 border border-gray-300 rounded-md shadow-sm h-10 font-semibold" />
                                ) : (
                                    <>
                                    <button onClick={() => changeCalendarMonth(-1)} className={SHARED_STYLES.toolbar.iconButton}><i className="fa-solid fa-chevron-left"></i></button>
                                    <input type="month" value={calendarMonth} onChange={e => setCalendarMonth(e.target.value)} className="p-2 border border-gray-300 rounded-md shadow-sm h-10 font-semibold" />
                                    <button onClick={() => changeCalendarMonth(1)} className={SHARED_STYLES.toolbar.iconButton}><i className="fa-solid fa-chevron-right"></i></button>
                                    </>
                                )}
                            </div>
                            <button onClick={() => setIsFilterPanelOpen(prev => !prev)} className="bg-white hover:bg-gray-100 text-gray-800 border font-semibold text-sm h-10 px-4 rounded-lg flex items-center justify-center shadow-sm transition-colors">
                                <i className="fa-solid fa-sort mr-2"></i>Sortuj i filtruj
                            </button>
                        </>
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                        <button onClick={handleTriggerScraper} disabled={isScraping} className={SHARED_STYLES.toolbar.iconButton} title="Uruchom import z Facebooka">
    <i className={`fa-solid fa-sync ${isScraping ? 'animate-spin' : ''}`}></i>
</button>
                    <button onClick={() => setIsSettingsModalOpen(true)} className={SHARED_STYLES.toolbar.iconButton} title="Ustawienia"><i className="fa-solid fa-cog"></i></button>
                    <button onClick={handleAddNewEventClick} className={SHARED_STYLES.toolbar.primaryButton}><i className="fa-solid fa-plus mr-2"></i>Wydarzenie</button>
                </div>
            </div>

            {/* Nawigacja po zakładkach */}
<div className="flex border-b mb-6">
    <button onClick={() => setActiveMainTab('summary')} className={`${SHARED_STYLES.tabs.base} ${activeMainTab === 'summary' ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>Podsumowanie</button>
    <button onClick={() => setActiveMainTab('list')} className={`${SHARED_STYLES.tabs.base} ${activeMainTab === 'list' ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>Lista wydarzeń</button>
</div>

{/* PRZENIESIONY PANEL FILTROWANIA */}
{activeMainTab === 'list' && isFilterPanelOpen && (
    <EventSortAndFilterPanel 
        categories={categories} 
        activeFilters={activeFilters} 
        sortConfig={sortConfig} 
        onFilterToggle={handleFilterToggle} 
        onSortChange={handleSortChange} 
    />
)}

            {/* Kontener na zawartość */}
            <div>
                {activeMainTab === 'summary' && (
                    <EventDashboardTab events={events} categories={categories} onDetailsClick={handleOpenDetailsModal} onEdit={handleEditEventClick} onDelete={handleDeleteEvent} onArchive={() => {}} />
                )}
                {activeMainTab === 'list' && (
                    <EventListTab
                        isLoading={isLoading}
                        events={events} // Oryginalna lista
                        allOccurrences={allOccurrences} // "Rozpakowana" lista
                        categories={categories}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        calendarMonth={calendarMonth}
                        changeCalendarMonth={changeCalendarMonth}
                        activeFilters={activeFilters}
                        sortConfig={sortConfig}
                        handleFilterToggle={handleFilterToggle} // Teraz jest zdefiniowana
                        handleSortChange={handleSortChange}   // Teraz jest zdefiniowana
                        filterDate={filterDate}
                        setFilterDate={setFilterDate}
                        onDetailsClick={handleOpenDetailsModal}
                        onEdit={handleEditEventClick}
                        onDelete={handleDeleteEvent}
                        onArchive={() => {}}
                    />
                )}
            </div>
        </div>
    );
}
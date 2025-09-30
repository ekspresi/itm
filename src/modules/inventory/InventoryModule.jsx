import React from 'react';
import { useState, useEffect } from 'react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbButton,
    BreadcrumbDivider,
} from "@fluentui/react-components";
import InventoryDashboard from './InventoryDashboard';
import ItemsView from './ItemsView';
import LocationsView from './LocationsView';
import CensusesView from './CensusesView';
import CensusDetailsView from './CensusDetailsView';
import PrintableCensus from './PrintableCensus';
import PrintableSummary from './PrintableSummary';
import CensusModal from './CensusModal';
import { firebaseApi } from '../../lib/firebase';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function InventoryModule({ handlePrint }) {
    const [activeSubPage, setActiveSubPage] = useState('dashboard');
    const [isLoading, setIsLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [locations, setLocations] = useState([]);
    const [censuses, setCensuses] = useState([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [editingCensusId, setEditingCensusId] = useState(null);
    const [currentCensusItems, setCurrentCensusItems] = useState([]);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);
    const [modalState, setModalState] = useState({ type: null, data: null });
    const [printableData, setPrintableData] = useState(null);
    const [summaryPrintableData, setSummaryPrintableData] = useState(null);
    const [isCensusModalOpen, setIsCensusModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [fetchedItems, fetchedLocations, fetchedCensuses] = await Promise.all([
                    firebaseApi.fetchCollection('items'),
                    firebaseApi.fetchCollection('locations'),
                    firebaseApi.fetchCollection('censuses'), // <-- Pobieramy spisy
                ]);
                setItems(fetchedItems || []);
                setLocations(fetchedLocations || []);
                setCensuses(fetchedCensuses || []); // <-- Ustawiamy spisy
            } catch (error) {
                console.error("Błąd pobierania danych inwentaryzacji:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [refreshTrigger]);

    // --- NOWY useEffect DO POBIERANIA POZYCJI DLA AKTYWNEGO SPISU ---
    useEffect(() => {
        if (!editingCensusId) {
            setCurrentCensusItems([]);
            return;
        }
        const fetchCensusItems = async () => {
            setIsDetailsLoading(true);
            const path = `inventory_module/--data--/censuses/${editingCensusId}/census_items`;
            const fetched = await firebaseApi.fetchSubcollection(path);
            setCurrentCensusItems(fetched || []);
            setIsDetailsLoading(false);
        };
        fetchCensusItems();
    }, [editingCensusId, refreshTrigger]);

    // Uproszczony useEffect dla drukowania pojedynczego spisu
    useEffect(() => {
        if (printableData) {
            const timer = setTimeout(() => {
                const { census, location } = printableData;
                const title = `Arkusz Spisu z Natury - ${location.name}`;
                const subtitle = `Rok ${census.year}`;
                handlePrint('printable-census-content', title, subtitle);
                setPrintableData(null);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [printableData, handlePrint]);


    // Funkcje dla Bazy Sprzętu (bez zmian)
    const handleSaveItem = async (itemData) => {
        setIsLoading(true);
        try {
            await firebaseApi.saveDocument('items', itemData);
            setRefreshTrigger(prev => prev + 1); // Uruchom odświeżenie danych
            return true;
        } catch (error) {
            console.error("Błąd zapisu przedmiotu:", error);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // UJEDNOLICONA funkcja usuwania
    const handleDeleteItem = async (itemId) => {
        if (window.confirm('Czy na pewno chcesz usunąć ten przedmiot? Tej operacji nie można cofnąć.')) {
            setIsLoading(true);
            try {
                await firebaseApi.deleteDocument('items', itemId);
                setRefreshTrigger(prev => prev + 1); // Uruchom odświeżenie danych
            } catch (error) {
                console.error("Błąd usuwania przedmiotu:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

// Funkcje dla Lokalizacji (bez zmian)
        const handleSaveLocation = async (locationData) => {
        setIsLoading(true);
        try {
            await firebaseApi.saveDocument('locations', locationData);
            setRefreshTrigger(prev => prev + 1);
            return true;
        } catch (error) {
            console.error("Błąd zapisu lokalizacji:", error);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteLocation = async (locationId) => {
        if (window.confirm('Czy na pewno chcesz usunąć tę lokalizację?')) {
            setIsLoading(true);
            try {
                await firebaseApi.deleteDocument('locations', locationId);
                setRefreshTrigger(prev => prev + 1);
            } catch (error) {
                console.error("Błąd usuwania lokalizacji:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Ta funkcja teraz obsługuje zapis z JEDNEGO modala
    const handleSaveCensus = async (censusData) => {
        setIsLoading(true);
        try {
            const censusIdToSave = censusData.id || await firebaseApi.saveDocument('censuses', censusData);
            
            // Jeśli edytowaliśmy istniejący, zapisujemy tylko jego dane
            if (censusData.id) {
                 await firebaseApi.saveDocument('censuses', censusData);
            }
            
            setRefreshTrigger(prev => prev + 1);
            
            // Jeśli tworzyliśmy nowy spis, przechodzimy do jego edycji
            if (!censusData.id) {
                navigateTo('censusDetails', censusIdToSave);
            }
        } catch (error) {
            console.error("Błąd zapisu spisu:", error);
        } finally {
            setIsLoading(false);
            setModalState({ type: null, data: null }); // Zamknij modal
        }
    };
    
    const handleDeleteCensus = async (censusId) => {
        if (window.confirm('Czy na pewno chcesz usunąć ten spis i wszystkie jego pozycje? Tej operacji nie można cofnąć.')) {
            setIsLoading(true);
            try {
                await firebaseApi.deleteDocument('censuses', censusId);
                setRefreshTrigger(prev => prev + 1);
            } catch (error) {
                console.error("Błąd usuwania spisu:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Ta funkcja będzie teraz aktualizować sumę całego spisu
    const updateCensusTotalValue = async (censusId) => {
        const path = `inventory_module/--data--/censuses/${censusId}/census_items`;
        const items = await firebaseApi.fetchSubcollection(path);
        const totalValue = items.reduce((sum, item) => sum + (item.quantityFound * item.pricePerUnit), 0);
        
        // Zapisujemy zaktualizowaną sumę w głównym dokumencie spisu
        await firebaseApi.saveDocument('censuses', { id: censusId, totalValue: totalValue });
        setRefreshTrigger(p => p + 1); // Odśwież dane, aby zobaczyć nową sumę na liście
    };

    const handleSaveCensusItem = async (itemData) => {
        const path = `inventory_module/--data--/censuses/${editingCensusId}/census_items`;
        await firebaseApi.saveDocumentInSubcollection(path, itemData);
        await updateCensusTotalValue(editingCensusId); // Aktualizuj sumę po zapisie
        return true;
    };

    const handleDeleteCensusItem = async (itemId) => {
        const path = `inventory_module/--data--/censuses/${editingCensusId}/census_items`;
        await firebaseApi.deleteDocumentFromSubcollection(path, itemId);
        await updateCensusTotalValue(editingCensusId); // Aktualizuj sumę po usunięciu
    };

        // Funkcja otwierająca modal do edycji danych spisu
    const openEditCensusModal = () => {
        const censusToEdit = censuses.find(c => c.id === editingCensusId);
        setModalState({ type: 'census', data: censusToEdit });
    };

    // Funkcja otwierająca modal do tworzenia nowego spisu
    const openNewCensusModal = () => {
        setModalState({ type: 'census', data: null });
    };

         const handlePrintFromList = async (censusId) => {
        setIsLoading(true);
        try {
            const censusToPrint = censuses.find(c => c.id === censusId);
            const locationForPrint = locations.find(l => l.id === censusToPrint.locationId);
            const path = `inventory_module/--data--/censuses/${censusId}/census_items`;
            const itemsForPrint = await firebaseApi.fetchSubcollection(path);
            
            setPrintableData({
                census: censusToPrint,
                censusItems: itemsForPrint,
                location: locationForPrint,
            });
        } catch (error) {
            console.error("Błąd przygotowania wydruku:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // --- NOWA, NIEZAWODNA WERSJA FUNKCJI DRUKOWANIA PODSUMOWANIA ---
    const handlePrintSummary = async (year) => {
        const censusesForYear = censuses.filter(c => c.year === year);
        
        // POPRAWIONA WALIDACJA - teraz komunikat jest poprawny
        if (censusesForYear.length === 0) {
            alert(`Brak jakichkolwiek spisów (również tych "w toku") dla roku ${year}.`);
            return;
        }

        // Krok 1: Ustaw dane, aby React mógł rozpocząć renderowanie ukrytego komponentu
        setSummaryPrintableData({
            year: year,
            censuses: censusesForYear,
        });

        // Krok 2: Użyj `await` z `setTimeout`, aby poczekać na zakończenie cyklu renderowania
        // To jest gwarancja, że element będzie w DOM, gdy będziemy go szukać.
        await new Promise(resolve => setTimeout(resolve, 0));

        // Krok 3: Teraz, gdy mamy pewność, że element istnieje, wywołaj drukowanie
        handlePrint('printable-summary-content', `Arkusz Zbiorczy Inwentaryzacji`, `Rok ${year}`);

        // Krok 4: Wyczyść stan, aby ukryć komponent po wydrukowaniu
        setSummaryPrintableData(null);
    };

    const pageTitles = {
        itemsView: 'Baza Sprzętu',
        locationsView: 'Lokalizacje',
        censusesView: 'Spisy z Natury',
                censusDetails: 'Spis z Natury', // Nowy tytuł
    };



    // Zmodyfikowana funkcja nawigacji
    const navigateTo = (page, id = null) => {
        setEditingCensusId(id);
        setActiveSubPage(page);
    };

const renderContent = () => {
    // Krok 1: Zawsze natychmiastowo renderuj pulpit, który nie zależy od danych.
    if (activeSubPage === 'dashboard') {
        return <InventoryDashboard onNavigate={navigateTo} />;
    }

    // Krok 2: DLA WSZYSTKICH INNYCH WIDOKÓW, najpierw sprawdź główny stan ładowania.
    // To gwarantuje, że `items` i `locations` są już dostępne.
    if (isLoading) {
        return <LoadingSpinner />;
    }
    
    // Krok 3: Teraz, gdy mamy pewność, że dane są załadowane, renderuj odpowiedni widok.
    switch (activeSubPage) {
        case 'itemsView':
            return <ItemsView 
                        items={items} 
                        locations={locations} 
                        onSave={handleSaveItem} 
                        onDelete={handleDeleteItem} 
                    />;
        case 'locationsView':
            return <LocationsView 
                        locations={locations}
                        onSave={handleSaveLocation}
                        onDelete={handleDeleteLocation}
                    />;
case 'censusesView':
    return <CensusesView 
                censuses={censuses}
                locations={locations}
                onSave={handleSaveCensus}
                onDelete={handleDeleteCensus}
                onEdit={(id) => navigateTo('censusDetails', id)}
                onPrint={handlePrintFromList}
                onPrintSummary={handlePrintSummary}
                onAddNew={openNewCensusModal} // <-- DODAJ TĘ LINIĘ
            />;
        case 'censusDetails': {
            const currentCensus = censuses.find(c => c.id === editingCensusId);
            // Dodatkowy, wewnętrzny loading na pozycje spisu
            if (isDetailsLoading || !currentCensus) return <LoadingSpinner />;
            
            return <CensusDetailsView 
                census={currentCensus}
                censusItems={currentCensusItems}
                allItems={items}
                locations={locations}
                onSaveItem={handleSaveCensusItem}
                onDeleteItem={handleDeleteCensusItem}
                onBack={() => navigateTo('censusesView')}
                handlePrint={handlePrint}
                onEditCensus={openEditCensusModal}
            />;
        }
        default:
            return <InventoryDashboard onNavigate={navigateTo} />;
    }
};

    return (
        <div className="flex flex-col h-full">
            {/* --- JEDEN CENTRALNY MODAL --- */}
            {modalState.type === 'census' && (
                <CensusModal 
                    isOpen={true}
                    onClose={() => setModalState({ type: null, data: null })}
                    onSave={handleSaveCensus}
                    locations={locations}
                    existingCensuses={censuses}
                    editingCensus={modalState.data}
                />
            )}
            <div className="mb-4">
<Breadcrumb>
    <BreadcrumbItem>
        <BreadcrumbButton>Panel administracyjny</BreadcrumbButton>
    </BreadcrumbItem>
    <BreadcrumbDivider />
    <BreadcrumbItem>
        {activeSubPage === 'dashboard' ? (
            <BreadcrumbButton current>Inwentaryzacja</BreadcrumbButton>
        ) : (
            <BreadcrumbButton onClick={() => setActiveSubPage('dashboard')}>Inwentaryzacja</BreadcrumbButton>
        )}
    </BreadcrumbItem>
    {activeSubPage !== 'dashboard' && (
        <>
            <BreadcrumbDivider />
            <BreadcrumbItem>
                <BreadcrumbButton current>{pageTitles[activeSubPage]}</BreadcrumbButton>
            </BreadcrumbItem>
        </>
    )}
</Breadcrumb>
            </div>
            <div className="flex-grow">
                {renderContent()}
            </div>
                        {printableData && (
            <div style={{ display: 'none' }}>
                {printableData && (
                    <PrintableCensus 
                        census={printableData.census}
                        censusItems={printableData.censusItems}
                        location={printableData.location}
                    />
                )}
                {/* Komponent jest prosty, cała logika jest teraz w handlePrintSummary */}
                {summaryPrintableData && (
                    <PrintableSummary
                        year={summaryPrintableData.year}
                        censuses={summaryPrintableData.censuses}
                        locations={locations}
                    />
                )}
            </div>
            )}
        </div>
    );
}
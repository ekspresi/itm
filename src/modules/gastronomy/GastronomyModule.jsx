import React, { useState, useEffect, useMemo } from 'react';
import { firebaseApi } from '../../lib/firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/functions';
import { convertGoogleHoursToEditorFormat } from '../../lib/helpers';
import { updateAllHoursFromGoogle } from '../../lib/updateAllHoursFromGoogle';

import LoadingSpinner from '../../components/LoadingSpinner';
import MessageBox from '../../components/MessageBox';
import GastronomyDashboard from './GastronomyDashboard';
import GastronomyToolbar from './GastronomyToolbar';
import GastronomyTile from './GastronomyTile';
import GastronomyListItem from './GastronomyListItem'; // Nowy import
import GastronomyListItem2 from './GastronomyListItem2';
import GastronomyModal from './GastronomyModal';
import GastronomySettings from './GastronomySettings';
import GastronomyDetailsPage from './GastronomyDetailsPage';
import Breadcrumbs from '../../components/Breadcrumbs';

export default function GastronomyModule({ user }) {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: 'info' });
    const [view, setView] = useState('dashboard'); // dashboard, restaurants, bakeries, confectioneries, settings
    const [previousView, setPreviousView] = useState(null);
    const [gastronomyList, setGastronomyList] = useState([]);
    const [config, setConfig] = useState({ categories: [], cuisines: [] });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlace, setEditingPlace] = useState(null);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [displayType, setDisplayType] = useState('list2'); // grid or list
    const [searchTerm, setSearchTerm] = useState(''); // Stan dla wyszukiwania

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [data, configData] = await Promise.all([
                firebaseApi.fetchCollection('gastronomy_entries', { orderBy: { field: 'createdAt', direction: 'desc' } }),
                firebaseApi.fetchDocument('gastronomy_config', '--main--')
            ]);
            setGastronomyList(data);
            if (configData) setConfig(configData);
        } catch (error) {
            setMessage({ text: "Nie udało się wczytać danych.", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredPlaces = useMemo(() => {
        let places = [...gastronomyList];

        if (view === 'bakeries') {
            places = places.filter(p => p.category_ids?.includes('piekarnia'));
        } else if (view === 'confectioneries') {
            places = places.filter(p => p.category_ids?.includes('cukiernia') || p.category_ids?.includes('lodziarnia'));
        }

        if (searchTerm) {
            places = places.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        return places;
    }, [gastronomyList, view, searchTerm]);

    const handleUpdateAllHoursFromGoogle = async () => {
        setIsLoading(true);
        setMessage({ text: '', type: 'info' });
        try {
            const summary = await updateAllHoursFromGoogle(
                gastronomyList,
                'gastronomy_entries',
                'updateGastronomyHours',
                convertGoogleHoursToEditorFormat
            );

            if (summary) { // Jeśli użytkownik nie anulował
                setMessage({ text: `Aktualizacja zakończona. Pomyślnie zaktualizowano: ${summary.successCount}, Błędy: ${summary.errorCount}.`, type: summary.errorCount > 0 ? 'warning' : 'success' });
            }
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
        } finally {
            fetchData();
            setIsLoading(false);
        }
    };


    const handleSavePlace = async (placeData) => {
        setIsLoading(true);
        try {
            let dataToSave = { ...placeData };
            if (!dataToSave.id) { dataToSave.createdAt = new Date(); }
            await firebaseApi.saveDocument('gastronomy_entries', dataToSave);
            setMessage({ text: dataToSave.id ? 'Obiekt zaktualizowany.' : 'Obiekt dodany.', type: 'success' });
            fetchData();
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
    
    const handleOpenAddModal = () => { setEditingPlace(null); setIsModalOpen(true); };
    const handleOpenEditModal = (place) => { setEditingPlace(place); setIsModalOpen(true); };
    const handleOpenDetailsModal = (place) => { setSelectedPlace(place); setIsDetailsModalOpen(true); };

        // NOWA FUNKCJA: Eksport do CSV
    const handleExportToCsv = () => {
        if (!filteredPlaces || filteredPlaces.length === 0) {
            alert("Brak danych do wyeksportowania.");
            return;
        }

        let csvContent = "\uFEFF"; // BOM for UTF-8
        csvContent += "Nazwa;Adres;Ocena Google;Synchronizowane\r\n";

        filteredPlaces.forEach(p => {
            const row = [
                `"${p.name}"`,
                `"${p.address_formatted}"`,
                (p.rating || '-').toString().replace('.', ','),
                p.managed_by_google ? 'Tak' : 'Nie'
            ].join(';');
            csvContent += row + "\r\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `eksport_gastronomia_${view}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShowDetailsPage = (place) => {
        setPreviousView(view); // Zapisz bieżący widok listy
        setSelectedPlace(place);
        setView('details');
    };

    const pageTitles = {
        dashboard: 'Pulpit',
        restaurants: 'Restauracje i kawiarnie',
        bakeries: 'Piekarnie',
        confectioneries: 'Cukiernie i lodziarnie',
        settings: 'Ustawienia'
    };
    
    let breadcrumbItems;
    if (view === 'dashboard') {
        breadcrumbItems = [{ name: 'Gastronomia' }];
    } else if (view === 'details') {
        breadcrumbItems = [
            { name: 'Gastronomia', onClick: () => setView('dashboard') },
            { name: pageTitles[previousView], onClick: () => setView(previousView) },
            { name: selectedPlace?.name || 'Szczegóły' }
        ];
    } else {
        breadcrumbItems = [
            { name: 'Gastronomia', onClick: () => setView('dashboard') },
            { name: pageTitles[view] || '' }
        ];
    }

const renderContent = () => {
    if (view === 'dashboard') {
        return <GastronomyDashboard onNavigate={setView} />;
    }
    if (view === 'details') {
            return <GastronomyDetailsPage place={selectedPlace} />;
    }
    if (['restaurants', 'bakeries', 'confectioneries'].includes(view)) {
         return (
            <div>
                <GastronomyToolbar
                    onAdd={handleOpenAddModal}
                    onViewChange={setDisplayType}
                    currentView={displayType}
                    onSearchChange={setSearchTerm}
                    searchTerm={searchTerm}
                    onMassUpdate={handleUpdateAllHoursFromGoogle}
                    onExport={handleExportToCsv}
                />
                {isLoading ? <LoadingSpinner /> : filteredPlaces.length === 0 ? (
                    <div className="text-center text-gray-500 py-16">
                        <i className="fa-solid fa-utensils fa-3x text-gray-300 mb-4"></i>
                        <p className="font-semibold">{searchTerm ? 'Brak obiektów spełniających kryteria' : 'Brak obiektów do wyświetlenia'}</p>
                    </div>
                ) : (
                    // === ZAKTUALIZOWANA LINIA ===
                    <div className={
                        displayType === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                      : displayType === 'list2' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                      : "space-y-2"
                    }>
                        {filteredPlaces.map(place => {
                            const commonProps = {
                                place: place,
                                onEdit: handleOpenEditModal,
                                onDelete: handleDeletePlace,
                                onDetailsClick: handleOpenDetailsModal,
                                onDetailsClick: handleShowDetailsPage
                            };

                            if (displayType === 'grid') return <GastronomyTile key={place.id} {...commonProps} />;
                            if (displayType === 'list') return <GastronomyListItem key={place.id} {...commonProps} />;
                            if (displayType === 'list2') return <GastronomyListItem2 key={place.id} {...commonProps} />;
                            return null;
                        })}
                    </div>
                )}
            </div>
        );
    }
    if (view === 'settings') {
        return <GastronomySettings />;
    }
    return null;
}

    return (
        <div className="max-w-7xl mx-auto">
             <GastronomyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSavePlace} isLoading={isLoading} editingPlace={editingPlace} config={config} setMessage={setMessage} />
             
             <Breadcrumbs items={breadcrumbItems} />
             
             <MessageBox message={message.text} type={message.type} onDismiss={() => setMessage({ text: '', type: 'info' })} />
             
             <div className="mt-6">
                {renderContent()}
             </div>
        </div>
    );
}
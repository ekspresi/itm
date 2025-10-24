import React, { useState, useEffect } from 'react';
import { db, firebaseApi } from '../../lib/firebase';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbButton,
    BreadcrumbDivider,
} from "@fluentui/react-components";
import OrangeLabDashboard from './OrangeLabDashboard';
import LoadingSpinner from '../../components/LoadingSpinner';
import LegoZone from './LegoZone';
import GamerZone from './GamerZone';
// KROK 3: Importujemy nowy komponent.
import StationDetailsView from './views/StationDetailsView';

export default function OrangeLabModule() {
    const [activeSubPage, setActiveSubPage] = useState('dashboard');
    const [currentView, setCurrentView] = useState('stations');
    const [selectedStationId, setSelectedStationId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [scheduleClasses, setScheduleClasses] = useState([]);
    const [allRooms, setAllRooms] = useState([]);

    useEffect(() => {
        const fetchScheduleData = async () => {
            setIsLoading(true);
            try {
                const [allClasses, fetchedRooms] = await Promise.all([
                    firebaseApi.fetchCollection('classes'),
                    firebaseApi.fetchCollection('rooms')
                ]);

                const orangeLabClasses = allClasses.filter(c =>
                    c.organizator === 'Inny' &&
                    c.organizatorInny &&
                    c.organizatorInny.trim().toLowerCase() === 'pracownia orange'
                );
                setScheduleClasses(orangeLabClasses);
                setAllRooms(fetchedRooms || []);
            } catch (error) {
                console.error("Błąd pobierania danych z harmonogramu:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchScheduleData();
    }, []);

    const handleStationClick = (stationId) => {
        setSelectedStationId(stationId);
        setCurrentView('stationDetails');
    };

    // KROK 3: Funkcja do powrotu do listy stanowisk.
    const handleBackToStations = () => {
        setSelectedStationId(null);
        setCurrentView('stations');
    };

    const pageTitles = {
        dashboard: 'Pulpit',
        legoZone: 'Strefa LEGO',
        gamerZone: 'Strefa Gracza',
    };

    const currentPageTitle = pageTitles[activeSubPage] || 'Pracownia Orange';

    return (
        <div className="flex flex-col h-full">
            <div className="mb-4">
                <Breadcrumb>
                    <BreadcrumbItem><BreadcrumbButton>Panel administracyjny</BreadcrumbButton></BreadcrumbItem>
                    <BreadcrumbDivider />
                    <BreadcrumbItem>
                        {activeSubPage === 'dashboard' ? (
                            <BreadcrumbButton current>Pracownia Orange</BreadcrumbButton>
                        ) : (
                            <BreadcrumbButton onClick={() => setActiveSubPage('dashboard')}>Pracownia Orange</BreadcrumbButton>
                        )}
                    </BreadcrumbItem>
                    {activeSubPage !== 'dashboard' && (
                        <>
                            <BreadcrumbDivider />
                            <BreadcrumbItem><BreadcrumbButton current>{currentPageTitle}</BreadcrumbButton></BreadcrumbItem>
                        </>
                    )}
                </Breadcrumb>
            </div>

            <div className="flex-grow">
                {isLoading ? <LoadingSpinner /> : (
                    <>
                        {activeSubPage === 'dashboard' && <OrangeLabDashboard onNavigate={setActiveSubPage} classes={scheduleClasses} allRooms={allRooms} />}
                        {activeSubPage === 'legoZone' && <LegoZone />}
                        {activeSubPage === 'gamerZone' && (
                            <>
                                {currentView === 'stations' && (
                                    <GamerZone onStationClick={handleStationClick} />
                                )}
                                {/* KROK 3: Podmieniamy placeholder na nasz nowy komponent. */}
                                {currentView === 'stationDetails' && (
                                    <StationDetailsView
                                        stationId={selectedStationId}
                                        onBack={handleBackToStations}
                                    />
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
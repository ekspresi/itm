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

export default function OrangeLabModule() {
    const [activeSubPage, setActiveSubPage] = useState('dashboard');
    const [isLoading, setIsLoading] = useState(true);
    const [scheduleClasses, setScheduleClasses] = useState([]);
    const [allRooms, setAllRooms] = useState([]); // <-- NOWY STAN NA SALE

    useEffect(() => {
        const fetchScheduleData = async () => {
            setIsLoading(true);
            try {
                // Pobieramy jednocześnie zajęcia i sale
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
                setAllRooms(fetchedRooms || []); // <-- ZAPISUJEMY SALE W STANIE
            } catch (error) {
                console.error("Błąd pobierania danych z harmonogramu:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchScheduleData();
    }, []);


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
                        {/* Przekazujemy sale jako props do pulpitu */}
                        {activeSubPage === 'dashboard' && <OrangeLabDashboard onNavigate={setActiveSubPage} classes={scheduleClasses} allRooms={allRooms} />}
                        {activeSubPage === 'legoZone' && <LegoZone />}
                        {activeSubPage === 'gamerZone' && <GamerZone />}
                    </>
                )}
            </div>
        </div>
    );
}
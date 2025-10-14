import React, { useState, useEffect } from 'react';
import { firebaseApi } from '../../lib/firebase';
import ScheduleDashboard from './ScheduleDashboard';
import RoomsView from './RoomsView';
import ClassesView from './ClassesView';
import EventsView from './EventsView';
import ScheduleView from './ScheduleView';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbButton,
    BreadcrumbDivider,
} from "@fluentui/react-components";

export default function ScheduleModule() {
    const [activeSubPage, setActiveSubPage] = useState('dashboard');
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: 'info' });
    
    const [allRooms, setAllRooms] = useState([]);
    const [allClasses, setAllClasses] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    const [categoryColors, setCategoryColors] = useState({});
    const [refreshTrigger, setRefreshTrigger] = useState(0);

useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [fetchedRooms, colorConfig, fetchedClasses, fetchedEvents] = await Promise.all([
                firebaseApi.fetchCollection('rooms'),
                firebaseApi.fetchDocument('schedule_config', 'categoryColors'), 
                firebaseApi.fetchCollection('classes'),
                firebaseApi.fetchCollection('events')
            ]);
            setAllRooms(fetchedRooms || []);
            setAllClasses(fetchedClasses || []);
            setAllEvents(fetchedEvents || []);
            if (colorConfig) setCategoryColors(colorConfig.map || {});
        } catch (error) {
            console.error("Błąd pobierania danych:", error);
            setMessage({ text: 'Nie udało się pobrać danych.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
}, [refreshTrigger]);

    const handleSaveRoom = async (roomData) => {
        setIsLoading(true);
        try {
            await firebaseApi.saveDocument('rooms', roomData);
            setMessage({ text: roomData.id ? 'Zmiany w sali zostały zapisane.' : 'Nowa sala została dodana.', type: 'success' });
            setRefreshTrigger(p => p + 1);
        } catch (e) { 
            setMessage({ text: 'Wystąpił błąd podczas zapisu.', type: 'error' }); 
        } finally { 
            setIsLoading(false); 
        }
    };
    
    const handleDeleteRoom = async (roomId) => {
        if (window.confirm('Czy na pewno chcesz usunąć tę salę?')) {
            setIsLoading(true);
            try {
                await firebaseApi.deleteDocument('rooms', roomId);
                setMessage({ text: 'Sala została usunięta.', type: 'success' });
                setRefreshTrigger(p => p + 1);
            } catch (e) { 
                setMessage({ text: 'Wystąpił błąd podczas usuwania.', type: 'error' }); 
            } finally { 
                setIsLoading(false); 
            }
        }
    };

    const handleSaveClass = async (classData) => {
        setIsLoading(true);
        try {
            const { color, ...dataToSave } = classData;
            const classKey = `${dataToSave.nazwa}-${dataToSave.prowadzacy}`;
            const newColors = { ...categoryColors, [classKey]: color };
            await firebaseApi.saveDocument('schedule_config', { id: 'categoryColors', map: newColors });
            await firebaseApi.saveDocument('classes', dataToSave);
            setMessage({ text: dataToSave.id ? 'Zapisano zmiany.' : 'Dodano zajęcia.', type: 'success' });
            setRefreshTrigger(p => p + 1);
        } catch (e) { 
            console.error("Błąd zapisu zajęć:", e);
            setMessage({ text: 'Wystąpił błąd podczas zapisu.', type: 'error' }); 
        } finally { 
            setIsLoading(false); 
        }
    };

    const handleDeleteClass = async (classId) => {
        if (window.confirm('Czy na pewno chcesz usunąć te zajęcia?')) {
            setIsLoading(true);
            try {
                await firebaseApi.deleteDocument('classes', classId);
                setMessage({ text: 'Zajęcia zostały usunięte.', type: 'success' });
                setRefreshTrigger(p => p + 1);
            } catch (e) { 
                setMessage({ text: 'Wystąpił błąd podczas usuwania.', type: 'error' }); 
            } finally { 
                setIsLoading(false); 
            }
        }
    };

    // POPRAWIONA FUNKCJA ZAPISU WYDARZENIA
const handleSaveEvent = async (eventData, conflictingClass) => {
    setIsLoading(true);
    try {
        const promises = [firebaseApi.saveDocument('events', eventData)];
        if (conflictingClass) {
            const cancellationData = { classId: conflictingClass.id, cancellationDate: eventData.data, salaId: eventData.salaId, reason: `Zastąpione przez: ${eventData.nazwa}` };
            const cancellationId = `${conflictingClass.id}_${eventData.data}`;
            promises.push(firebaseApi.saveDocument('cancellations', {id: cancellationId, ...cancellationData}));
        }
        await Promise.all(promises);
        setMessage({ text: eventData.id ? 'Zapisano zmiany.' : 'Dodano wydarzenie.', type: 'success' });
        setRefreshTrigger(p => p + 1);
        return true; // <-- Zwracamy informację o sukcesie
    } catch (e) { 
        console.error("Błąd zapisu wydarzenia:", e);
        setMessage({ text: 'Wystąpił błąd podczas zapisu.', type: 'error' }); 
        return false; // <-- Zwracamy informację o porażce
    } finally { 
        setIsLoading(false); 
    }
};

    const handleDeleteEvent = async (eventId) => {
        if (window.confirm('Czy na pewno chcesz usunąć to wydarzenie?')) {
            setIsLoading(true);
            try {
                await firebaseApi.deleteDocument('events', eventId);
                setMessage({ text: 'Wydarzenie usunięte.', type: 'success' });
                setRefreshTrigger(p => p + 1);
            } catch (e) { 
                setMessage({ text: 'Wystąpił błąd.', type: 'error' }); 
            } finally { 
                setIsLoading(false); 
            }
        }
    };

const checkConflict = (eventData) => {
    const eventDate = new Date(eventData.data);
    const eventDay = (eventDate.getUTCDay() + 6) % 7 + 1;
    const eventStart = eventData.godzinaOd ? eventData.godzinaOd.replace(':', '') : '0000';
    const eventEnd = eventData.godzinaDo ? eventData.godzinaDo.replace(':', '') : '2359';

    for (const cls of allClasses) {
        // Sprawdzamy, czy w ogóle bierzemy pod uwagę te zajęcia cykliczne w danym dniu
        // Jeśli data wydarzenia jest PRZED datą rozpoczęcia zajęć, pomiń
        if (cls.okresOd && eventData.data < cls.okresOd) {
            continue;
        }
        // Jeśli data wydarzenia jest PO dacie zakończenia zajęć, pomiń
        if (cls.okresDo && eventData.data > cls.okresDo) {
            continue;
        }

        // Jeśli data się zgadza, sprawdzamy salę, dzień tygodnia i godziny
        if (cls.salaId === eventData.salaId) {
            for(const termin of (cls.terminy || [])) {
                if (parseInt(termin.dzienTygodnia) === eventDay) {
                    const classStart = termin.godzinaOd.replace(':', '');
                    const classEnd = termin.godzinaDo.replace(':', '');
                    // Sprawdzanie konfliktu godzinowego (bez zmian)
                    if (Math.max(eventStart, classStart) < Math.min(eventEnd, classEnd)) {
                        return cls; // Znaleziono konflikt
                    }
                }
            }
        }
    }
    return null; // Brak konfliktu
};

    // NOWA FUNKCJA do odwoływania zajęć
    const handleCancelClass = async (classItem) => {
        if (window.confirm(`Czy na pewno chcesz odwołać zajęcia "${classItem.nazwa}" w dniu ${classItem.date}?`)) {
            setIsLoading(true);
            try {
                const cancellationData = { classId: classItem.id, cancellationDate: classItem.date, salaId: classItem.salaId, reason: 'Odwołane ręcznie z harmonogramu' };
                const cancellationId = `${classItem.id}_${classItem.date}`;
                await firebaseApi.saveDocument('cancellations', {id: cancellationId, ...cancellationData});
                setMessage({text: 'Zajęcia zostały odwołane w tym terminie.', type: 'success'});
                setRefreshTrigger(p => p + 1);
            } catch(e) { 
                setMessage({text: 'Błąd podczas odwoływania zajęć.', type: 'error'}); 
            } finally { 
                setIsLoading(false); 
            }
        }
    };

    const pageTitles = {
        harmonogram: 'Harmonogram',
        pomieszczenia: 'Pomieszczenia',
        zajecia: 'Zajęcia',
        wydarzenia: 'Wydarzenia',
    };

    return (
        <div className="flex flex-col h-full">
            <div className="mb-4">
                <Breadcrumb>
                    <BreadcrumbItem><BreadcrumbButton>Panel administracyjny</BreadcrumbButton></BreadcrumbItem>
                    <BreadcrumbDivider />
                    <BreadcrumbItem>
                        {activeSubPage === 'dashboard' ? (
                            <BreadcrumbButton current>Harmonogram sal</BreadcrumbButton>
                        ) : (
                            <BreadcrumbButton onClick={() => setActiveSubPage('dashboard')}>Harmonogram sal</BreadcrumbButton>
                        )}
                    </BreadcrumbItem>
                    {activeSubPage !== 'dashboard' && (
                        <>
                            <BreadcrumbDivider />
                            <BreadcrumbItem><BreadcrumbButton current>{pageTitles[activeSubPage]}</BreadcrumbButton></BreadcrumbItem>
                        </>
                    )}
                </Breadcrumb>
            </div>

            <div className="flex-grow">
                {activeSubPage === 'dashboard' && <ScheduleDashboard onNavigate={setActiveSubPage} />}
                {activeSubPage === 'pomieszczenia' && <RoomsView allRooms={allRooms} isLoading={isLoading} onSaveRoom={handleSaveRoom} onDeleteRoom={handleDeleteRoom} />}
                {activeSubPage === 'zajecia' && <ClassesView allClasses={allClasses} allRooms={allRooms} categoryColors={categoryColors} isLoading={isLoading} onSaveClass={handleSaveClass} onDeleteClass={handleDeleteClass} />}
                {activeSubPage === 'wydarzenia' && <EventsView allEvents={allEvents} allRooms={allRooms} isLoading={isLoading} onSaveEvent={handleSaveEvent} onDeleteEvent={handleDeleteEvent} onCheckConflict={checkConflict} />}
                {activeSubPage === 'harmonogram' && (
                    <ScheduleView
                        allRooms={allRooms}
                        allClasses={allClasses}
                        allEvents={allEvents}
                        categoryColors={categoryColors}
                        isLoading={isLoading}
                        onCancelClass={handleCancelClass}
                        onEditEvent={handleSaveEvent} // Przekazujemy ogólną funkcję zapisu
                        onDeleteEvent={handleDeleteEvent}
                        // onPrint={handlePrint} // Można dodać później, jeśli chcemy drukować
                    />
                )}
            </div>
        </div>
    );
}
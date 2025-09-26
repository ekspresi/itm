import React, { useState, useEffect } from 'react';
import { 
    Button, TabList, Tab, makeStyles, tokens, Text,
    Menu, MenuList, MenuTrigger, MenuButton, MenuPopover, MenuItem,
} from '@fluentui/react-components';
import { ChevronLeft24Regular, ChevronRight24Regular, Print24Regular, Edit20Regular, Dismiss20Regular } from '@fluentui/react-icons';
import LoadingSpinner from '../../components/LoadingSpinner';
import { timeToMinutes } from '../../lib/helpers';

const useStyles = makeStyles({
    // Tutaj dodamy style dla siatki w przyszłości, jeśli będą potrzebne
});

export default function ScheduleView({ allRooms, allClasses, allEvents, categoryColors, isLoading, onCancelClass, onEditEvent, onDeleteEvent, onPrint }) {
    const styles = useStyles();
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        const start = new Date();
        start.setDate(start.getDate() - (start.getDay() + 6) % 7);
        start.setHours(0,0,0,0);
        return start;
    });
    const [activeScheduleView, setActiveScheduleView] = useState('all-mikolajki');
    const [schedule, setSchedule] = useState({});
    const [scheduleColumnWidths, setScheduleColumnWidths] = useState(Array(7).fill(100 / 7));

// --- CAŁA LOGIKA GENEROWANIA HARMONOGRAMU ---
    useEffect(() => {
        const getRoomIdsForView = () => {
            if (activeScheduleView === 'all-mikolajki') {
                return allRooms.filter(r => !String(r.numer).toUpperCase().startsWith('W') && !String(r.numer).toUpperCase().startsWith('B')).map(r => r.id);
            }
            if (activeScheduleView === 'all-woznice') {
                return allRooms.filter(r => String(r.numer).toUpperCase().startsWith('W')).map(r => r.id);
            }
            if (activeScheduleView === 'all-baranowo') {
                return allRooms.filter(r => String(r.numer).toUpperCase().startsWith('B')).map(r => r.id);
            }
            return [activeScheduleView];
        };
        
        const roomIdsToDisplay = getRoomIdsForView();
        if (roomIdsToDisplay.length === 0) {
            setSchedule({});
            return;
        }

        const generateSchedule = async () => {
            const startOfWeek = new Date(currentWeekStart);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            const startOfWeekStr = startOfWeek.toISOString().slice(0, 10);
            const endOfWeekStr = endOfWeek.toISOString().slice(0, 10);
            
            try {
                // Ta logika zakłada, że `allClasses` i `allEvents` są już dostępne jako propsy
                const classesInView = (allClasses || []).filter(c => roomIdsToDisplay.includes(c.salaId));
                const eventsInView = (allEvents || []).filter(e => roomIdsToDisplay.includes(e.salaId));
                
                const newSchedule = {};
                const weekDates = Array.from({length: 7}).map((_, i) => {
                    const d = new Date(startOfWeek);
                    d.setDate(d.getDate() + i);
                    return d.toISOString().slice(0, 10);
                });

                // Symulacja pobierania odwołań - w przyszłości można to przenieść do propsów
                const cancellations = []; // Na razie pusta tablica

                const cancelledIdsOnDates = cancellations.reduce((acc, curr) => {
                    acc[`${curr.classId}-${curr.cancellationDate}`] = true;
                    return acc;
                }, {});
                
                weekDates.forEach((dateStr, dayIndex) => {
                    const dateForDay = new Date(dateStr);
                    const dayOfWeek = (dateForDay.getUTCDay() + 6) % 7 + 1;
                    
                    classesInView.forEach(cls => {
                        (cls.terminy || []).forEach(termin => {
                            if (parseInt(termin.dzienTygodnia) === dayOfWeek) {
                                const isCancelled = cancelledIdsOnDates[`${cls.id}-${dateStr}`];
                                if (!isCancelled && (!cls.okresOd || cls.okresOd <= dateStr) && (!cls.okresDo || cls.okresDo >= dateStr)) {
                                    if (!newSchedule[dayIndex]) newSchedule[dayIndex] = [];
                                    newSchedule[dayIndex].push({ ...cls, ...termin, type: 'class', date: dateStr });
                                }
                            }
                        });
                    });
                });

                const filteredEvents = eventsInView.filter(e => e.data >= startOfWeekStr && e.data <= endOfWeekStr);
                filteredEvents.forEach(event => {
                    const eventDate = new Date(event.data);
                    const dayIndex = weekDates.indexOf(eventDate.toISOString().slice(0, 10));

                    if (dayIndex > -1) {
                        if (!newSchedule[dayIndex]) newSchedule[dayIndex] = [];
                        newSchedule[dayIndex].push({ ...event, type: 'event' });
                    }
                });

                Object.keys(newSchedule).forEach(dayIndex => {
                    const dayItems = newSchedule[dayIndex].sort((a,b) => timeToMinutes(a.godzinaOd) - timeToMinutes(b.godzinaOd));
                    const positionedItems = [];

                    dayItems.forEach(item => {
                        const itemStart = timeToMinutes(item.godzinaOd);
                        const itemEnd = timeToMinutes(item.godzinaDo);
                        let columnIndex = 0;

                        while (true) {
                            const hasConflict = positionedItems.some(
                                pItem => pItem.columnIndex === columnIndex &&
                                Math.max(itemStart, timeToMinutes(pItem.godzinaOd)) < Math.min(itemEnd, timeToMinutes(pItem.godzinaDo))
                            );

                            if (!hasConflict) {
                                item.columnIndex = columnIndex;
                                positionedItems.push(item);
                                break;
                            }
                            columnIndex++;
                        }
                    });

                    const totalColumns = positionedItems.reduce((max, item) => Math.max(max, item.columnIndex + 1), 1);
                    positionedItems.forEach(item => { item.totalColumns = totalColumns; });
                    newSchedule[dayIndex] = positionedItems;
                });
                
                const dayWeights = Array.from({ length: 7 }).map((_, dayIndex) => {
                    const dayItems = newSchedule[dayIndex] || [];
                    if (dayItems.length === 0) return 1;
                    return Math.max(1, dayItems.reduce((max, item) => Math.max(max, (item.totalColumns || 1)), 1));
                });

                const totalWeight = dayWeights.reduce((sum, weight) => sum + weight, 0);

                if (totalWeight > 0) {
                    setScheduleColumnWidths(dayWeights.map(weight => (weight / totalWeight) * 100));
                } else {
                    setScheduleColumnWidths(Array(7).fill(100/7));
                }
                
                setSchedule(newSchedule);

            } catch (error) {
                console.error("Błąd generowania harmonogramu:", error);
            }
        };

        generateSchedule();
    }, [activeScheduleView, currentWeekStart, allRooms, allClasses, allEvents]);


    const changeWeek = (direction) => {
        setCurrentWeekStart(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setDate(newDate.getDate() + 7 * direction);
            return newDate;
        });
    };

    const getWeekDisplay = () => {
        const start = new Date(currentWeekStart);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return `${start.toLocaleDateString('pl-PL')} - ${end.toLocaleDateString('pl-PL')}`;
    };

    const formatOrganizerName = (item) => {
        const name = item.prowadzacy || item.organizator || '';
        if (name === 'Centrum Kultury "Kłobuk"') return 'CK';
        if (name === 'Mikołajski Uniwersytet III Wieku') return 'MUTW';
        if (name === 'Jiu-Jitsu MMA Fitness Terlik Team Mikołajki') return 'UKS Terlik Team';
        const parts = name.split(' ');
        if (parts.length > 1 && parts[0].length > 0) {
            return `${parts[0][0]}. ${parts[parts.length - 1]}`;
        }
        return name;
    };
    
    const getCategoryColor = (item) => {
        const key = `${item.nazwa}-${item.prowadzacy}`;
        return categoryColors[key] || 'bg-gray-500';
    };

    // Filtrujemy sale, które mają być pokazane jako przyciski
    const mikolajkiRooms = allRooms.filter(r => !String(r.numer).toUpperCase().startsWith('W') && !String(r.numer).toUpperCase().startsWith('B'));
    const wozniceRooms = allRooms.filter(r => String(r.numer).toUpperCase().startsWith('W'));
    const baranowoRooms = allRooms.filter(r => String(r.numer).toUpperCase().startsWith('B'));

    return (
        <div className="flex flex-col gap-4">
            {/* GÓRNY TOOLBAR */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Button size="small" icon={<ChevronLeft24Regular />} onClick={() => changeWeek(-1)} />
                    <span className="font-semibold text-center w-48">{getWeekDisplay()}</span>
                    <Button size="small" icon={<ChevronRight24Regular />} onClick={() => changeWeek(1)} />
                </div>
                <Button icon={<Print24Regular />}>Drukuj</Button>
            </div>

            {/* FILTRY LOKALIZACJI I SAL */}
            <div>
                <TabList 
                    selectedValue={activeScheduleView.startsWith('all-') ? activeScheduleView : 'custom'}
                    onTabSelect={(_, data) => setActiveScheduleView(data.value)}
                >
                    <Tab value="all-mikolajki">CK Kłobuk</Tab>
                    <Tab value="all-woznice">Filia Woźnice</Tab>
                    <Tab value="all-baranowo">Biblioteka Baranowo</Tab>
                </TabList>

                <div className="flex flex-wrap items-center gap-2 mt-2 p-2 border-t">
                    {activeScheduleView === 'all-mikolajki' && mikolajkiRooms.map(room => (
                         <Button key={room.id} size="small" appearance="subtle" onClick={() => setActiveScheduleView(room.id)}>{room.nazwa}</Button>
                    ))}
                     {activeScheduleView === 'all-woznice' && wozniceRooms.map(room => (
                         <Button key={room.id} size="small" appearance="subtle" onClick={() => setActiveScheduleView(room.id)}>{room.nazwa}</Button>
                    ))}
                     {activeScheduleView === 'all-baranowo' && baranowoRooms.map(room => (
                         <Button key={room.id} size="small" appearance="subtle" onClick={() => setActiveScheduleView(room.id)}>{room.nazwa}</Button>
                    ))}
                </div>
            </div>

            {/* Placeholder na siatkę harmonogramu */}
            <div className="bg-white p-4 rounded-lg shadow-md min-h-[60vh]">
                <div className="flex" style={{minWidth: '1200px'}}>
    <div className="w-24 shrink-0">
        <div className="h-10 border-b"></div>
        {Array.from({ length: 14 }, (_, i) => 8 + i).map(hour => <div key={hour} className="h-14 border-r text-center text-sm text-gray-500 pt-1 font-mono">{`${hour}:00`}</div>)}
    </div>
    <div className="grid grow" style={{ gridTemplateColumns: scheduleColumnWidths.map(w => `${w}fr`).join(' ') }}>
        {Array.from({length: 7}).map((_, dayIndex) => {
            const d = new Date(currentWeekStart);
            d.setDate(d.getDate() + dayIndex);
            return (
                <div key={dayIndex} className="p-2 border-b text-center font-bold">
                    <div>{['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'][dayIndex]}</div>
                    <div className="text-xs font-normal text-gray-500">{d.toLocaleDateString('pl-PL', {day: '2-digit', month: '2-digit'})}</div>
                </div>
            )
        })}
        {Array.from({ length: 7 }).map((_, dayIndex) => (
            <div key={dayIndex} className="relative border-r">
                {Array.from({ length: 14 }, (_, i) => 8 + i).map(hour => <div key={hour} className="h-14 border-b"></div>)}
                {(schedule[dayIndex] || []).map(item => {
                    const top = (timeToMinutes(item.godzinaOd) - (8 * 60)) * (56 / 60);
                    const height = (timeToMinutes(item.godzinaDo) - timeToMinutes(item.godzinaOd)) * (56 / 60);
                    
                    const positionStyle = {
                        top: `${top}px`,
                        height: `${height}px`,
                        left: `${(item.columnIndex / item.totalColumns) * 100}%`,
                        width: `calc(${(1 / item.totalColumns) * 100}% - 4px)`,
                        marginLeft: '2px',
                    };
                    
                    const titleClass = height < 70 ? 'truncate' : (height < 120 ? 'line-clamp-2' : '');
                    const isCollectiveView = activeScheduleView.startsWith('all-');
                    const room = allRooms.find(r => r.id === item.salaId);
                    const roomName = room ? `${room.nazwa} (${room.numer || 'b/n'})` : 'Nieznana sala';
                    const lowerText = isCollectiveView ? roomName : formatOrganizerName(item);
                    
                    return (
                        <div 
                            key={item.id + item.date + item.godzinaOd} 
                            style={positionStyle} 
                            title={`${item.nazwa}\nGodz: ${item.godzinaOd}-${item.godzinaDo}\n${item.type === 'class' ? `Prowadzący: ${item.prowadzacy}` : `Organizator: ${item.organizator}`}`} 
                            className={`absolute p-1 rounded text-white text-[10px] z-10 overflow-hidden flex flex-col justify-center ${item.type === 'event' ? 'bg-green-500' : `bg-${getCategoryColor(item)}`}`}
                        >
                            <p className={`font-bold ${titleClass}`}>{item.nazwa}</p>
                            <p className="truncate text-white/80">{item.godzinaOd}-{item.godzinaDo}</p>
                            <p className={`text-white/80 ${titleClass}`}>{lowerText}</p>
                            
                            {/* Menu Akcji z Fluent UI */}
                            <div className="absolute top-0 right-0" onClick={e => e.stopPropagation()}>
                                <Menu>
                                    <MenuTrigger disableButtonEnhancement>
                                        <MenuButton 
                                            size="small"
                                            appearance="transparent"
                                            className="text-white hover:bg-black/20"
                                            icon={<i className="fa-solid fa-ellipsis-vertical fa-xs"></i>}
                                        />
                                    </MenuTrigger>
                                    <MenuPopover>
                                        <MenuList>
                                            {item.type === 'event' && <MenuItem icon={<Edit20Regular />} onClick={() => onEditEvent(item)}>Edytuj</MenuItem>}
                                            <MenuItem icon={<Dismiss20Regular />} onClick={() => item.type === 'class' ? onCancelClass(item) : onDeleteEvent(item.id)}>
                                                {item.type === 'class' ? 'Odwołaj w tym dniu' : 'Usuń wydarzenie'}
                                            </MenuItem>
                                        </MenuList>
                                    </MenuPopover>
                                </Menu>
                            </div>
                        </div>
                    )
                })}
            </div>
        ))}
    </div>
</div>
                {isLoading && <LoadingSpinner />}
            </div>
        </div>
    );
}
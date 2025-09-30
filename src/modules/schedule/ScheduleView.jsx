import React, { useState, useEffect } from 'react';
import { 
    Button, TabList, Tab, makeStyles, tokens, Text,
    Menu, MenuList, MenuTrigger, MenuButton, MenuPopover, MenuItem,
} from '@fluentui/react-components';
import { CalendarLtr24Regular, AppsListDetail24Regular, ChevronLeft24Regular, ChevronRight24Regular, Print24Regular, Edit20Regular, Dismiss20Regular } from '@fluentui/react-icons';
import ScheduleListItem from './ScheduleListItem';
import LoadingSpinner from '../../components/LoadingSpinner';
import { timeToMinutes } from '../../lib/helpers';

const useStyles = makeStyles({
    separator: {
        borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    },
    gridDayHeader: {
        color: tokens.colorNeutralForeground2,
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    },
    gridDateHeader: {
        color: tokens.colorNeutralForeground3,
    },
    listHeader: {
        color: tokens.colorNeutralForeground2,
        backgroundColor: tokens.colorNeutralBackground1,
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    }
});

export default function ScheduleView({ allRooms, allClasses, allEvents, categoryColors, isLoading, onCancelClass, onEditEvent, onDeleteEvent, onPrint, handlePrint }) {
    const styles = useStyles();
    const [viewMode, setViewMode] = useState('grid');
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
// ZASTĄP CAŁY TEN BLOK KODU
// ZASTĄP CAŁY TEN BLOK KODU
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

    const generateSchedule = () => {
        const startOfWeek = new Date(currentWeekStart);
        
        const newSchedule = {};
        const weekDates = [];
        
        // --- NOWA, BARDZIEJ NIEZAWODNA LOGIKA GENEROWANIA DAT ---
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            weekDates.push(d);
        }
        
        try {
            const classesInView = (allClasses || []).filter(c => roomIdsToDisplay.includes(c.salaId));
            const eventsInView = (allEvents || []).filter(e => {
                const [year, month, day] = e.data.split('-').map(Number);
                const eventDate = new Date(year, month - 1, day);
                return roomIdsToDisplay.includes(e.salaId) && eventDate >= weekDates[0] && eventDate <= new Date(weekDates[6].getTime() + 86399999);
            });
            
            weekDates.forEach((dateForDay, dayIndex) => {
                const dayOfWeek = dateForDay.getDay(); // 0=Niedziela, 1=Poniedziałek, ..., 6=Sobota
                const dateStr = dateForDay.toISOString().slice(0, 10);

                classesInView.forEach(cls => {
                    (cls.terminy || []).forEach(termin => {
                        if (parseInt(termin.dzienTygodnia) === dayOfWeek) {
                            // Poprawiona i kompletna weryfikacja dat
                            if ((!cls.okresOd || cls.okresOd <= dateStr) && (!cls.okresDo || cls.okresDo >= dateStr)) {
                                if (!newSchedule[dayIndex]) newSchedule[dayIndex] = [];
                                newSchedule[dayIndex].push({ ...cls, ...termin, type: 'class', date: dateStr });
                            }
                        }
                    });
                });
            });

            eventsInView.forEach(event => {
                const [year, month, day] = event.data.split('-').map(Number);
                const eventDate = new Date(year, month - 1, day);
                
                // Znajdujemy indeks dnia, porównując tylko daty (bez czasu)
                const dayIndex = weekDates.findIndex(d => d.toDateString() === eventDate.toDateString());

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

const handlePrintClick = () => {
    if (viewMode === 'grid') {
        alert('Drukowanie jest obecnie dostępne tylko dla widoku listy.');
        return;
    }

    const printableNode = document.getElementById('printable-schedule-content');
    if (!printableNode) return;

    // Generowanie prostej tabeli HTML dla widoku listy
    let tableHtml = `
        <style>
            /* ZMIANA NR 1: Ustawiamy idealną szerokość kolumny Godzina */
            table { table-layout: fixed; width: 100%; }
            col.time { width: 86px; } 
            col.details { width: auto; }
            col.organizer { width: 128px; }
            col.roomName { width: 154px; } 
            th { text-align: center; }
                .event-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #0f766e; /* Kolor Teal-700, taki jak w siatce */
        margin-left: 8px;
        vertical-align: middle; /* Dla lepszego wyrównania z tekstem */
    }
        </style>
        <table>
            <colgroup>
                <col class="time">
                <col class="details">
                <col class="organizer">
                <col class="roomName">
            </colgroup>
            <thead>
                <tr>
                    <th>Godzina</th>
                    <th>Zajęcia / Wydarzenie</th>
                    <th>Prowadzący Organizator</th>
                    <th>Sala</th>
                </tr>
            </thead>
            <tbody>
    `;

    Array.from({ length: 7 }).forEach((_, dayIndex) => {
        const dayItems = schedule[dayIndex];
        if (dayItems && dayItems.length > 0) {
            const dayDate = new Date(currentWeekStart);
            dayDate.setDate(dayDate.getDate() + dayIndex);
            const dayName = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'][dayIndex];
            const fullDayName = `${dayName}, ${dayDate.toLocaleDateString('pl-PL')}`;

            tableHtml += `
                <tr>
                    <td colspan="4" style="text-align: center; font-weight: bold; background-color: #f9fafb; padding: 0.5rem;">
                        ${fullDayName}
                    </td>
                </tr>
            `;

            dayItems.forEach(item => {
                const room = allRooms.find(r => r.id === item.salaId);
const roomName = room ? `<strong>${room.numer || ''}</strong>&nbsp;&nbsp;${room.nazwa}` : 'Brak sali';
                let organizer = item.prowadzacy || item.organizatorInny || item.organizator || '-';

                // ZMIANA NR 2: Dodajemy warunek skracający nazwę
                if (organizer === 'Mikołajski Uniwersytet III Wieku') {
                    organizer = 'MUTW';
                }

    // --- POCZĄTEK ZMIANY ---
    // Tworzymy zmienną, która przechowa HTML dla nazwy zajęć/wydarzenia
    let itemNameHtml = item.nazwa;
    // Jeśli typ to 'event', dodajemy kropkę
    if (item.type === 'event') {
        itemNameHtml += `<span class="event-dot"></span>`;
    }
    // --- KONIEC ZMIANY ---

    tableHtml += `
        <tr>
            <td>${item.godzinaOd} - ${item.godzinaDo}</td>
            <td>${itemNameHtml}</td>
            <td>${organizer}</td>
            <td>${roomName}</td>
        </tr>
    `;
});
        }
    });
    tableHtml += '</tbody></table>';
    printableNode.innerHTML = tableHtml;

    const headerDetails = {
        logoUrl: '/ck-logo.jpg', // Poprawiona nazwa pliku z logo
        lines: [
            { text: 'Centrum Kultury "Kłobuk" w Mikołajkach', bold: true },
            { text: '11-730 Mikołajki, ul. Kolejowa 6' },
            { text: 'tel. 87 421 61 46, e-mail: biuro@ckklobuk.pl' }
        ],
        date: new Date().toLocaleDateString('pl-PL')
    };

    handlePrint('printable-schedule-content', 'Harmonogram Sal', getWeekDisplay(), headerDetails);
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

    {/* NOWE PRZYCISKI WIDOKU */}
    <div className="flex items-center gap-2">
        <Button 
            icon={<CalendarLtr24Regular />} 
            appearance={viewMode === 'grid' ? 'primary' : 'outline'} 
            onClick={() => setViewMode('grid')}
        >
            Siatka
        </Button>
        <Button 
            icon={<AppsListDetail24Regular />} 
            appearance={viewMode === 'list' ? 'primary' : 'outline'} 
            onClick={() => setViewMode('list')}
        >
            Lista
        </Button>
    </div>

    <Button icon={<Print24Regular />} onClick={handlePrintClick}>Drukuj</Button>
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

                <div className={`flex flex-wrap items-center gap-2 mt-2 p-2 ${styles.separator}`}>
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

{/* KONTENER WIDOKU HARMONOGRAMU */}
{viewMode === 'grid' ? (
    // ------ POCZĄTEK WIDOKU SIATKI ------
    <div id="schedule-grid-for-print" className="bg-white p-4 rounded-lg shadow-md min-h-[60vh] overflow-x-auto">
        <div className="flex" style={{minWidth: '1100px'}}>
            <div className="w-24 shrink-0">
                <div className="h-10 border-b"></div>
                {Array.from({ length: 14 }, (_, i) => 8 + i).map(hour => <div key={hour} className="h-14 border-r text-center text-sm text-gray-500 pt-1 font-mono">{`${hour}:00`}</div>)}
            </div>
            <div className="grid grow" style={{ gridTemplateColumns: scheduleColumnWidths.map(w => `${w}fr`).join(' ') }}>
                {Array.from({length: 7}).map((_, dayIndex) => {
                    const d = new Date(currentWeekStart);
                    d.setDate(d.getDate() + dayIndex);
                    return (
                        <div key={dayIndex} className={`p-2 text-center font-bold ${styles.gridDayHeader}`}>
                            <div>{['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'][dayIndex]}</div>
                            <div className={`text-xs font-normal ${styles.gridDateHeader}`}>{d.toLocaleDateString('pl-PL', {day: '2-digit', month: '2-digit'})}</div>
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
                                    className={`absolute p-2 rounded text-white text-xs z-10 overflow-hidden flex flex-col ${item.type === 'event' ? 'bg-teal-700' : 'bg-sky-700'}`}
                                >
                                    <p className={`font-bold ${titleClass}`}>{item.nazwa}</p>
                                    <p className="truncate text-white/80">{item.godzinaOd}-{item.godzinaDo}</p>
                                    <p className={`text-white/80 ${titleClass}`}>{lowerText}</p>
                                    
                                    <div className="absolute top-0 right-0 no-print" onClick={e => e.stopPropagation()}>
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
    </div>
    // ------ KONIEC WIDOKU SIATKI ------
) : (
    // ------ POCZĄTEK WIDOKU LISTY ------
    <div id="schedule-list-for-print" className="flex flex-col gap-4">
        {Array.from({ length: 7 }).map((_, dayIndex) => {
            const dayItems = schedule[dayIndex];
            if (!dayItems || dayItems.length === 0) return null;

            const dayDate = new Date(currentWeekStart);
            dayDate.setDate(dayDate.getDate() + dayIndex);
            const dayName = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'][dayIndex];
            
return (
    <div key={dayIndex}>
<h2 className="font-semibold text-base mb-2 border-b pb-1">
    {dayName}, {dayDate.toLocaleDateString('pl-PL')}
</h2>

        {/* NOWY WIERSZ NAGŁÓWKÓW */}
<div 
    className={`grid grid-cols-[120px_2.5fr_1.5fr_1fr] gap-4 py-2 px-4 font-semibold text-sm ${styles.listHeader}`}
    style={{ 
        gridTemplateColumns: '120px 2.5fr 1.5fr 1fr', 
        paddingLeft: '1rem', // Ujednolicony padding
        paddingRight: '1rem' // Ujednolicony padding
    }}
>
    {/* Poprawiona pierwsza kolumna z niewidzialnym elementem */}
    <div className="flex items-center">
        <div className="w-1 mr-2" /> {/* Imitacja paska (4px) i odstępu (8px) */}
        Godzina
    </div>
    <div className="text-left">Zajęcia / Wydarzenie</div>
    <div className="text-left">Prowadzący / Organizator</div>
    <div className="text-left">Sala</div>
</div>

{dayItems.map(item => {
    const room = allRooms.find(r => r.id === item.salaId);
    return (
        <ScheduleListItem 
            key={item.id + item.date + item.godzinaOd}
            item={item}
            roomName={
                room ? (
                    <>
                        <span style={{ fontWeight: 600 }}>{room.numer}</span>
                        <span className="ml-2">{room.nazwa}</span>
                    </>
                ) : 'Brak sali'
            }
        />
    );
})}
    </div>
);
        })}
        {Object.keys(schedule).length === 0 && !isLoading && (
            <p className="text-center text-gray-500 py-8">Brak zajęć i wydarzeń w wybranym tygodniu.</p>
        )}
    </div>
    // ------ KONIEC WIDOKU LISTY ------
)}
        {/* UKRYTY KONTENER DO DRUKOWANIA */}
        <div id="printable-schedule-content" style={{ display: 'none' }}></div>
        </div>
    );
}
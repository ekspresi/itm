import React, { useState, useEffect, useMemo } from 'react';
import {
    Button,
    makeStyles,
    tokens,
    Text,
    Menu,
    MenuList,
    MenuTrigger,
    MenuButton,
    MenuPopover,
    MenuItem,
    Card,
    CardHeader,
    Dropdown,
    Option,
    Combobox,
    Tag,
    useFluent,
} from '@fluentui/react-components';
import {
    ChevronLeft24Regular,
    ChevronRight24Regular,
    Print24Regular,
    Edit20Regular,
    Dismiss20Regular,
    MoreHorizontal20Regular,
} from '@fluentui/react-icons';
import LoadingSpinner from '../../components/LoadingSpinner';
import { timeToMinutes } from '../../lib/helpers';
import { firebaseApi } from '../../lib/firebase';
// Kopiujemy nagłówek z modułu Sprzedaży - upewnij się, że ścieżka jest poprawna
import { PrintableHeader } from '../sales/PrintableReports';

// --- Style dedykowane dla nowego harmonogramu ---
const useStyles = makeStyles({
    wrapper: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalL,
    },
    toolbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: tokens.spacingHorizontalL,
        '@media print': { display: 'none' },
    },
    controlsWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalM,
        flexWrap: 'wrap',
    },
    weekDisplay: {
        fontWeight: tokens.fontWeightSemibold,
        textAlign: 'center',
        minWidth: '180px',
    },
    filterCard: {
        '@media print': { display: 'none' },
    },
    scheduleContainer: {
        overflowX: 'auto',
        backgroundColor: tokens.colorNeutralBackground1,
        borderRadius: tokens.borderRadiusLarge,
        boxShadow: tokens.shadow8,
        padding: tokens.spacingHorizontalM,
        minHeight: '70vh',
        '@media print': {
            boxShadow: 'none',
            border: 'none',
            padding: '0',
            overflow: 'visible',
            minHeight: 'auto',
        }
    },
    scheduleGrid: {
        display: 'grid',
        minWidth: '1000px', // Mniejsza minimalna szerokość dzięki dynamicznym kolumnom
    },
    timeColumn: {
        paddingTop: '48px',
    },
    timeLabel: {
        height: '60px',
        textAlign: 'right',
        paddingRight: tokens.spacingHorizontalM,
        fontSize: '9px', // Mniejsza czcionka dla osi czasu
        color: tokens.colorNeutralForeground2,
    },
    dayColumn: {
        position: 'relative',
        borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    },
    dayHeader: {
        position: 'sticky',
        top: 0,
        zIndex: 20,
        backgroundColor: tokens.colorNeutralBackground1,
        textAlign: 'center',
        padding: `${tokens.spacingVerticalS} 0`,
        height: '48px',
    },
    dayLabel: {
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorNeutralForeground1,
    },
    dateLabel: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground2,
    },
    hourSlot: {
        height: '60px',
        borderTop: `1px dashed ${tokens.colorNeutralStroke2}`,
    },
    scheduleItem: {
        position: 'absolute',
        zIndex: 10,
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorNeutralBackground2, // Ujednolicony kolor
        color: tokens.colorNeutralForeground1, // Ujednolicony kolor tekstu
        padding: tokens.spacingHorizontalS,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        transition: 'all 0.2s ease',
        '&:hover': { zIndex: 15 }
    },
    itemTitle: {
        fontWeight: tokens.fontWeightSemibold,
        fontSize: '10px',
        overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
        '-webkit-box-orient': 'vertical', '-webkit-line-clamp': 2,
    },
    itemText: {
        fontSize: '10px',
        color: tokens.colorNeutralForeground2,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    },
    itemMenu: {
        position: 'absolute',
        top: '2px',
        right: '2px',
    }
});

export default function NewScheduleView({ onEditEvent, onDeleteEvent, onCancelClass }) {
    const styles = useStyles();
    const { theme } = useFluent();

    // --- Stany do zarządzania danymi i interfejsem ---
    const [isLoading, setIsLoading] = useState(true);
    const [allRooms, setAllRooms] = useState([]);
    const [allClasses, setAllClasses] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    
    const [showPrintHeader, setShowPrintHeader] = useState(false);
    const [currentWeekStart, setCurrentWeekStart] = useState(() => new Date(new Date().setDate(new Date().getDate() - (new Date().getDay() + 6) % 7)));
    const [locationFilter, setLocationFilter] = useState('mikolajki');
    const [selectedRoomIds, setSelectedRoomIds] = useState([]);
    const [scheduleData, setScheduleData] = useState({});
    const [columnLayout, setColumnLayout] = useState(Array(7).fill({ show: false, weight: 1 }));

    // --- Logika drukowania (w pełni izolowana) ---
    const handlePrint = () => {
        const sidebar = document.getElementById('app-sidebar');
        if (sidebar) sidebar.style.display = 'none';
        setShowPrintHeader(true);
        setTimeout(() => window.print(), 50);
    };

    useEffect(() => {
        const handleAfterPrint = () => {
            const sidebar = document.getElementById('app-sidebar');
            if (sidebar) sidebar.style.display = 'flex';
            setShowPrintHeader(false);
        };
        window.addEventListener('afterprint', handleAfterPrint);
        return () => window.removeEventListener('afterprint', handleAfterPrint);
    }, []);

    // --- Pobieranie danych (izolowane w komponencie) ---
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [rooms, classes, events] = await Promise.all([
                    firebaseApi.fetchCollection('rooms'),
                    firebaseApi.fetchCollection('classes'),
                    firebaseApi.fetchCollection('events')
                ]);
                setAllRooms(rooms || []);
                setAllClasses(classes || []);
                setAllEvents(events || []);
            } catch (error) {
                console.error("Błąd pobierania danych:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- Filtrowanie i generowanie harmonogramu ---
    const availableRooms = useMemo(() => {
        return allRooms.filter(room => {
            const numerUpper = String(room.numer || '').toUpperCase();
            if (locationFilter === 'woznice') return numerUpper.startsWith('W');
            if (locationFilter === 'baranowo') return numerUpper.startsWith('B');
            return !numerUpper.startsWith('W') && !numerUpper.startsWith('B');
        });
    }, [allRooms, locationFilter]);

    useEffect(() => {
        setSelectedRoomIds([]); // Resetuj wybór sal przy zmianie lokalizacji
    }, [locationFilter]);

    useEffect(() => {
        const roomIdsToDisplay = selectedRoomIds.length > 0 ? selectedRoomIds : availableRooms.map(r => r.id);
        const startOfWeek = new Date(currentWeekStart);
        const weekDates = Array.from({ length: 7 }).map((_, i) => new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i).toISOString().slice(0, 10));
        
        const newSchedule = {};
        const classesInView = (allClasses || []).filter(c => roomIdsToDisplay.includes(c.salaId));
        weekDates.forEach((dateStr, dayIndex) => {
            const dayOfWeek = (new Date(dateStr).getUTCDay() + 6) % 7 + 1;
            classesInView.forEach(cls => {
                (cls.terminy || []).forEach(termin => {
                    if (parseInt(termin.dzienTygodnia) === dayOfWeek && (!cls.okresOd || cls.okresOd <= dateStr) && (!cls.okresDo || cls.okresDo >= dateStr)) {
                        if (!newSchedule[dayIndex]) newSchedule[dayIndex] = [];
                        newSchedule[dayIndex].push({ ...cls, ...termin, type: 'class', date: dateStr });
                    }
                });
            });
        });

        const eventsInView = (allEvents || []).filter(e => roomIdsToDisplay.includes(e.salaId));
        const filteredEvents = eventsInView.filter(e => e.data >= weekDates[0] && e.data <= weekDates[6]);
        filteredEvents.forEach(event => {
            const dayIndex = weekDates.indexOf(new Date(event.data).toISOString().slice(0, 10));
            if (dayIndex > -1) {
                if (!newSchedule[dayIndex]) newSchedule[dayIndex] = [];
                newSchedule[dayIndex].push({ ...event, type: 'event' });
            }
        });

        Object.keys(newSchedule).forEach(dayIndex => {
            const dayItems = newSchedule[dayIndex].sort((a, b) => timeToMinutes(a.godzinaOd) - timeToMinutes(b.godzinaOd));
            const positionedItems = [];
            dayItems.forEach(item => {
                let columnIndex = 0;
                while (true) {
                    const hasConflict = positionedItems.some(
                        pItem => pItem.columnIndex === columnIndex &&
                        Math.max(timeToMinutes(item.godzinaOd), timeToMinutes(pItem.godzinaOd)) < Math.min(timeToMinutes(item.godzinaDo), timeToMinutes(pItem.godzinaDo))
                    );
                    if (!hasConflict) { item.columnIndex = columnIndex; positionedItems.push(item); break; }
                    columnIndex++;
                }
            });
            const totalColumns = positionedItems.reduce((max, item) => Math.max(max, item.columnIndex + 1), 1);
            positionedItems.forEach(item => { item.totalColumns = totalColumns; });
            newSchedule[dayIndex] = positionedItems;
        });

        const newColumnLayout = Array.from({ length: 7 }).map((_, dayIndex) => {
            const dayItems = newSchedule[dayIndex] || [];
            const show = dayItems.length > 0;
            const weight = show ? Math.max(1, dayItems.reduce((max, item) => Math.max(max, (item.totalColumns || 1)), 1)) : 1;
            return { show, weight };
        });

        setColumnLayout(newColumnLayout);
        setScheduleData(newSchedule);

    }, [selectedRoomIds, availableRooms, currentWeekStart, allClasses, allEvents]);

    // --- Funkcje pomocnicze ---
    const changeWeek = (direction) => setCurrentWeekStart(prev => new Date(new Date(prev).setDate(prev.getDate() + 7 * direction)));

    const onRoomSelect = (_, data) => setSelectedRoomIds(data.selectedOptions);
    
    // --- Renderowanie ---
    const visibleColumns = columnLayout.map((col, index) => ({ ...col, index })).filter(col => col.show);
    const gridTemplateColumns = `60px ${visibleColumns.map(c => `${c.weight}fr`).join(' ')}`;

    return (
        <div className={styles.wrapper}>
            {showPrintHeader && (
                <PrintableHeader 
                    title="Tygodniowy harmonogram sal" 
                    subtitle={`Tydzień: ${currentWeekStart.toLocaleDateString('pl-PL')} - ${new Date(new Date(currentWeekStart).setDate(currentWeekStart.getDate() + 6)).toLocaleDateString('pl-PL')}`}
                />
            )}
            <div className={styles.toolbar}>
                <div className={styles.controlsWrapper}>
                    <Button size="small" icon={<ChevronLeft24Regular />} onClick={() => changeWeek(-1)} />
                    <Text as="span" className={styles.weekDisplay}>{`${currentWeekStart.toLocaleDateString('pl-PL')} - ${new Date(new Date(currentWeekStart).setDate(currentWeekStart.getDate() + 6)).toLocaleDateString('pl-PL')}`}</Text>
                    <Button size="small" icon={<ChevronRight24Regular />} onClick={() => changeWeek(1)} />
                </div>
                <div className={styles.controlsWrapper}>
                    <Button icon={<Print24Regular />} onClick={handlePrint} disabled={isLoading}>Drukuj</Button>
                </div>
            </div>

            <Card className={styles.filterCard}>
                <CardHeader header={<Text weight="semibold">Filtry</Text>} />
                <div className={styles.controlsWrapper}>
                    <Dropdown value={locationFilter} onOptionSelect={(_, data) => setLocationFilter(data.optionValue)}>
                        <Option value="mikolajki">CK Kłobuk (Mikołajki)</Option>
                        <Option value="woznice">Filia Woźnice</Option>
                        <Option value="baranowo">Biblioteka Baranowo</Option>
                    </Dropdown>
                    <Combobox
                        multiselect
                        placeholder="Wybierz sale (domyślnie wszystkie)"
                        value={selectedRoomIds.map(id => availableRooms.find(r => r.id === id)?.nazwa).join(', ')}
                        onOptionSelect={onRoomSelect}
                        style={{ minWidth: '300px' }}
                    >
                        {availableRooms.map(room => (
                            <Option key={room.id} value={room.id}>
                                {room.nazwa}
                            </Option>
                        ))}
                    </Combobox>
                </div>
            </Card>

            <div className={styles.scheduleContainer}>
                {isLoading ? <LoadingSpinner /> : (
                    <div className={styles.scheduleGrid} style={{ gridTemplateColumns }}>
                        <div className={styles.timeColumn}>
                            {Array.from({ length: 14 }, (_, i) => 8 + i).map(hour => <div key={hour} className={styles.timeLabel}>{`${hour}:00`}</div>)}
                        </div>
                        {visibleColumns.map(({ index: dayIndex }) => {
                            const d = new Date(new Date(currentWeekStart).setDate(currentWeekStart.getDate() + dayIndex));
                            return (
                                <div key={dayIndex} className={styles.dayHeader}>
                                    <Text block className={styles.dayLabel}>{['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'][dayIndex]}</Text>
                                    <Text block className={styles.dateLabel}>{d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}</Text>
                                </div>
                            )
                        })}
                        <div></div>
                        {visibleColumns.map(({ index: dayIndex }) => (
                            <div key={dayIndex} className={styles.dayColumn}>
                                {Array.from({ length: 14 }, (_, i) => 8 + i).map(hour => <div key={hour} className={styles.hourSlot}></div>)}
                                {(scheduleData[dayIndex] || []).map(item => {
                                    const top = (timeToMinutes(item.godzinaOd) - (8 * 60));
                                    const height = (timeToMinutes(item.godzinaDo) - timeToMinutes(item.godzinaOd));
                                    const room = allRooms.find(r => r.id === item.salaId);
                                    return (
                                        <div key={item.id + (item.date || '') + item.godzinaOd} style={{ top: `${top}px`, height: `${height}px`, left: `${(item.columnIndex / item.totalColumns) * 100}%`, width: `calc(${(1 / item.totalColumns) * 100}% - 4px)`, marginLeft: '2px' }} className={styles.scheduleItem}>
                                            <p className={styles.itemTitle}>{item.nazwa}</p>
                                            <p className={styles.itemText}>{`${item.godzinaOd}-${item.godzinaDo}`}</p>
                                            <p className={styles.itemText}>{room?.nazwa || 'Brak sali'}</p>
                                            <div className={styles.itemMenu}>
                                                <Menu>
                                                    <MenuTrigger disableButtonEnhancement><MenuButton size="small" appearance="transparent" icon={<MoreHorizontal20Regular />} /></MenuTrigger>
                                                    <MenuPopover>
                                                        <MenuList>
                                                            {item.type === 'event' && <MenuItem icon={<Edit20Regular />} onClick={() => onEditEvent(item)}>Edytuj</MenuItem>}
                                                            <MenuItem icon={<Dismiss20Regular />} onClick={() => item.type === 'class' ? onCancelClass(item) : onDeleteEvent(item.id)}>{item.type === 'class' ? 'Odwołaj w tym dniu' : 'Usuń wydarzenie'}</MenuItem>
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
                )}
            </div>
        </div>
    );
}
import React, { useState, useMemo } from 'react';
import { 
    Button, TabList, Tab, makeStyles, tokens, Text,
    Menu, MenuList, MenuTrigger, MenuButton, MenuPopover, MenuItem,
} from '@fluentui/react-components';
import { Add24Regular, Edit20Regular, Delete20Regular, MoreHorizontal20Regular, MegaphoneLoud24Regular } from '@fluentui/react-icons';
import LoadingSpinner from '../../components/LoadingSpinner';
import EventModal from './EventModal';

const useStyles = makeStyles({
    card: {
        height: 'fit-content',
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingHorizontalS,
        padding: tokens.spacingHorizontalL,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorNeutralBackground1,
        cursor: 'pointer',
        ':hover': {
            borderColor: tokens.colorNeutralStroke2Hover,
        }
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardContent: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalL,
        textAlign: 'left',
        flexGrow: 1,
        minWidth: 0,
    },
    icon: {
        fontSize: '32px',
        flexShrink: 0,
        color: tokens.colorPaletteGreenForeground1,
    },
    textContainer: { 
        display: 'flex', 
        flexDirection: 'column',
        minWidth: 0,
    },
    // ZMIANA: Przenosimy style skracania bezpośrednio do tytułu i opisu
    title: { 
        fontSize: tokens.fontSizeBase300, 
        fontWeight: tokens.fontWeightRegular, 
        color: tokens.colorNeutralForeground1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    description: { 
        fontSize: tokens.fontSizeBase200, 
        color: tokens.colorNeutralForeground2,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    footer: {
        borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
        paddingTop: tokens.spacingHorizontalS,
        marginTop: tokens.spacingHorizontalS,
        fontSize: tokens.fontSizeBase200,
    },
    footerText: {
        color: tokens.colorNeutralForeground2,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    }
});
    
const EventItem = ({ event, roomName, onEdit, onDelete }) => {
    const styles = useStyles();

    // OSTATECZNA POPRAWKA: Kolor jest szary TYLKO, gdy 'publiczne' jest jawnie fałszywe.
    // W każdym innym przypadku (true lub brak pola) jest zielony.
    const iconColorClass = event.publiczne === false ? 'text-gray-400' : 'text-green-500';

    return (
        <div className={styles.card} onClick={() => onEdit(event)} title="Edytuj">
            <div className={styles.header}>
                <div className={styles.cardContent}>
                    <div className={styles.icon}>
                        <MegaphoneLoud24Regular className={iconColorClass} />
                    </div>
                    <div className={styles.textContainer}>
                        <Text as="h3" block className={styles.title} title={event.nazwa}>{event.nazwa}</Text>
                        <Text as="p" block className={styles.description} title={event.organizator || 'Brak organizatora'}>{event.organizator || 'Brak organizatora'}</Text>
                    </div>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                    <Menu>
                        <MenuTrigger disableButtonEnhancement>
                            <MenuButton appearance="transparent" icon={<MoreHorizontal20Regular />} aria-label={`Akcje dla ${event.nazwa}`} />
                        </MenuTrigger>
                        <MenuPopover>
                            <MenuList>
                                <MenuItem icon={<Edit20Regular />} onClick={() => onEdit(event)}>Edytuj</MenuItem>
                                <MenuItem icon={<Delete20Regular />} onClick={() => onDelete(event.id)}>Usuń</MenuItem>
                            </MenuList>
                        </MenuPopover>
                    </Menu>
                </div>
            </div>
             <div className={styles.footer}>
                <div className='flex items-center justify-between'>
                    <span className={`font-semibold ${styles.footerText}`} title={`${new Date(event.data  + 'T00:00:00').toLocaleDateString('pl-PL', {day: '2-digit', month: 'long', year: 'numeric'})} o ${event.godzinaOd}`}>
                        {new Date(event.data  + 'T00:00:00').toLocaleDateString('pl-PL', {day: '2-digit', month: 'long', year: 'numeric'})} o {event.godzinaOd}
                    </span>
                    <span className={styles.footerText} title={roomName}>{roomName}</span>
                </div>
            </div>
        </div>
    );
};

export default function EventsView({ allEvents, allRooms, isLoading, onSaveEvent, onDeleteEvent, onCheckConflict }) {
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [eventStatusFilter, setEventStatusFilter] = useState('aktualne');

    const handleOpenEventModal = (event = null) => {
        setEditingEvent(event);
        setIsEventModalOpen(true);
    };

    const getRoomName = (roomId) => allRooms.find(r => r.id === roomId)?.nazwa || 'Brak sali';

const displayedEvents = useMemo(() => {
    const toYYYYMMDD = (date) => new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
    const todayStr = toYYYYMMDD(new Date());

    // Funkcja pomocnicza do sortowania po dacie i godzinie
    const sortByDateTime = (a, b) => {
        const dateTimeA = `${a.data} ${a.godzinaOd || '00:00'}`;
        const dateTimeB = `${b.data} ${b.godzinaOd || '00:00'}`;
        return dateTimeA.localeCompare(dateTimeB);
    };

    if (eventStatusFilter === 'aktualne') {
        return (allEvents || [])
            .filter(event => event.data >= todayStr)
            .sort(sortByDateTime); // Używamy nowej funkcji sortującej
    } else {
        return (allEvents || [])
            .filter(event => event.data < todayStr)
            .sort((a, b) => sortByDateTime(b, a)); // Sortujemy malejąco
    }
}, [allEvents, eventStatusFilter]);

    return (
        <>
            <EventModal 
                isOpen={isEventModalOpen} 
                onClose={() => setIsEventModalOpen(false)}
                onSave={onSaveEvent}
                isLoading={isLoading}
                editingEvent={editingEvent}
                rooms={allRooms}
                onCheckConflict={onCheckConflict}
            />
            <div className="flex justify-between items-center mb-4">
                <TabList selectedValue={eventStatusFilter} onTabSelect={(_, data) => setEventStatusFilter(data.value)}>
                    <Tab value="aktualne">Aktualne</Tab>
                    <Tab value="archiwalne">Archiwalne</Tab>
                </TabList>
                <Button appearance="primary" icon={<Add24Regular />} onClick={() => handleOpenEventModal(null)}>
                    Dodaj wydarzenie
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {isLoading && (allEvents || []).length === 0 ? <LoadingSpinner /> : (
                    displayedEvents.length > 0 ? displayedEvents.map(event => (
                        <EventItem
                            key={event.id}
                            event={event}
                            roomName={getRoomName(event.salaId)}
                            onEdit={handleOpenEventModal}
                            onDelete={onDeleteEvent}
                        />
                    )) : <p className="text-sm text-gray-500 text-center py-8 col-span-full">{eventStatusFilter === 'aktualne' ? 'Brak nadchodzących wydarzeń.' : 'Brak archiwalnych wydarzeń.'}</p>
                )}
            </div>
        </>
    );
}
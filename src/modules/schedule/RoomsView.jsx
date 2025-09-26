import React, { useState, useMemo } from 'react';
import { 
    Button, 
    TabList, 
    Tab, 
    makeStyles, 
    tokens, 
    Text,
    Menu,
    MenuList,
    MenuTrigger,
    MenuButton,
    MenuPopover,
    MenuItem,
} from '@fluentui/react-components';
import { 
    Add24Regular, 
    Edit20Regular,
    Delete20Regular,
    ConferenceRoom24Regular,
    MoreHorizontal20Regular,
} from '@fluentui/react-icons';
import LoadingSpinner from '../../components/LoadingSpinner';
import RoomModal from './RoomModal';

const useStyles = makeStyles({
    itemContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: tokens.spacingHorizontalL,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorNeutralBackground1,
        boxShadow: tokens.shadow4,
        // ZMIANA NR 1: Dodajemy animację i kursor
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
        ':hover': {
            boxShadow: tokens.shadow8,
            transform: 'translateY(-2px)',
        }
    },
    contentWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalL,
        textAlign: 'left',
        minWidth: 0,
    },
    icon: {
        fontSize: '32px',
        color: tokens.colorNeutralForeground2,
        flexShrink: 0,
    },
    textContainer: {
        display: 'flex',
        flexDirection: 'column',
    },
    title: {
        fontSize: tokens.fontSizeBase300,
        fontWeight: tokens.fontWeightRegular,
        color: tokens.colorNeutralForeground1,
    },
    description: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground2,
    },
});

const RoomItem = ({ room, onEdit, onDelete }) => {
    const styles = useStyles();
    return (
        // ZMIANA NR 2: onClick jest teraz na głównym kontenerze
        <div className={styles.itemContainer} onClick={() => onEdit(room)} title="Edytuj">
            <div className={styles.contentWrapper}>
                <div className={styles.icon}>
                    <ConferenceRoom24Regular />
                </div>
                <div className={styles.textContainer}>
                    <Text as="h3" block className={styles.title}>{room.nazwa}</Text>
                    <Text as="p" block className={styles.description}>Numer: {room.numer || 'Brak'}</Text>
                </div>
            </div>
            {/* ZMIANA NR 3: Opakowujemy Menu w div'a, który zatrzymuje klikanie */}
            <div onClick={(e) => e.stopPropagation()}>
                <Menu>
                    <MenuTrigger disableButtonEnhancement>
                        <MenuButton
                            appearance="transparent"
                            icon={<MoreHorizontal20Regular />}
                            aria-label={`Akcje dla ${room.nazwa}`}
                        />
                    </MenuTrigger>
                    <MenuPopover>
                        <MenuList>
                            <MenuItem icon={<Edit20Regular />} onClick={() => onEdit(room)}>Edytuj</MenuItem>
                            <MenuItem icon={<Delete20Regular />} onClick={() => onDelete(room.id)}>Usuń</MenuItem>
                        </MenuList>
                    </MenuPopover>
                </Menu>
            </div>
        </div>
    );
};

export default function RoomsView({ allRooms, isLoading, onSaveRoom, onDeleteRoom }) {
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [roomLocationFilter, setRoomLocationFilter] = useState('mikolajki');

    const handleOpenRoomModal = (room = null) => {
        setEditingRoom(room);
        setIsRoomModalOpen(true);
    };
    
    const filteredRooms = useMemo(() => {
        // Dodajemy `|| []`, aby zapobiec błędowi, gdy `allRooms` jest `undefined`
        return (allRooms || []).filter(room => {
            if (!room.numer) return roomLocationFilter === 'mikolajki';
            const numerUpper = String(room.numer).toUpperCase();
            if (roomLocationFilter === 'woznice') return numerUpper.startsWith('W');
            if (roomLocationFilter === 'baranowo') return numerUpper.startsWith('B');
            return !numerUpper.startsWith('W') && !numerUpper.startsWith('B');
        });
    }, [allRooms, roomLocationFilter]);

    return (
        <>
            <RoomModal 
                isOpen={isRoomModalOpen} 
                onClose={() => setIsRoomModalOpen(false)}
                onSave={onSaveRoom}
                isLoading={isLoading}
                editingRoom={editingRoom}
            />
            <div className="flex justify-between items-center mb-4">
                <TabList selectedValue={roomLocationFilter} onTabSelect={(_, data) => setRoomLocationFilter(data.value)}>
                    <Tab value="mikolajki">Mikołajki</Tab>
                    <Tab value="woznice">Woźnice</Tab>
                    <Tab value="baranowo">Baranowo</Tab>
                </TabList>
                <Button appearance="primary" icon={<Add24Regular />} onClick={() => handleOpenRoomModal(null)}>
                    Dodaj salę
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {/* Dodajemy zabezpieczenie `(allRooms || []).length` */}
                {isLoading && (allRooms || []).length === 0 ? <LoadingSpinner /> : (
                    filteredRooms.length > 0 ? filteredRooms.map(room => (
                        <RoomItem 
                            key={room.id}
                            room={room}
                            onEdit={handleOpenRoomModal}
                            onDelete={onDeleteRoom}
                        />
                    )) : <p className="text-sm text-gray-500 text-center py-4 col-span-full">Brak zdefiniowanych sal dla wybranej lokalizacji.</p>
                )}
            </div>
        </>
    );
}
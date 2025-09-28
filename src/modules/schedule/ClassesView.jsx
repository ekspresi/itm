import React, { useState, useMemo } from 'react';
import { 
    Button, TabList, Tab, makeStyles, tokens, Text,
    Menu, MenuList, MenuTrigger, MenuButton, MenuPopover, MenuItem,
} from '@fluentui/react-components';
import { 
    Add24Regular, ClipboardTextLtr24Regular, Edit20Regular, Delete20Regular, MoreHorizontal20Regular,
    ChevronLeft20Regular, // <-- ZMIANA: Mniejsza ikona
    ChevronRight20Regular, // <-- ZMIANA: Mniejsza ikona
} from '@fluentui/react-icons';
import LoadingSpinner from '../../components/LoadingSpinner';
import ClassModal from './ClassModal';

// ZASTĄP CAŁY TEN BLOK
const useStyles = makeStyles({
    card: {
        height: 'fit-content',
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingHorizontalS,
        padding: tokens.spacingHorizontalL,
        // Poprawka 1: Zamiast 'border', używamy dokładnych właściwości
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: tokens.colorNeutralStroke2,
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorNeutralBackground1,
        cursor: 'pointer',
        ':hover': {
            // Poprawka 2: 'borderColor' jest teraz poprawnie obsługiwane
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
    textContainer: { 
        display: 'flex', 
        flexDirection: 'column',
        minWidth: 0,
    },
    // Poprawka 3: Przenosimy style 'truncate' do definicji, aby uniknąć błędu 'mergeClasses'
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
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        borderTopColor: tokens.colorNeutralStroke2,
        paddingTop: tokens.spacingHorizontalS,
        marginTop: tokens.spacingHorizontalS,
        fontSize: tokens.fontSizeBase200,
    },
    footerText: {
        color: tokens.colorNeutralForeground2,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    terminyText: {
        fontWeight: tokens.fontWeightSemibold,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    }
});

const ClassItem = ({ cls, roomName, onEdit, onDelete }) => {
    const styles = useStyles();
    const getDayName = (dayNumber) => ['Ndz', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'So'][parseInt(dayNumber)] || '';
    const terminyText = (cls.terminy || []).map(t => `${getDayName(t.dzienTygodnia)} ${t.godzinaOd}`).join(', ');

    return (
        <div className={styles.card} onClick={() => onEdit(cls)} title="Edytuj">
            <div className={styles.header}>
                <div className={styles.cardContent}>
                    <div className={styles.icon}>
                        <ClipboardTextLtr24Regular />
                    </div>
                    <div className={styles.textContainer}>
                        <Text as="h3" block className={styles.title} title={cls.nazwa}>{cls.nazwa}</Text>
                        <Text as="p" block className={styles.description} title={cls.prowadzacy || 'Brak prowadzącego'}>{cls.prowadzacy || 'Brak prowadzącego'}</Text>
                    </div>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                    <Menu>
                        <MenuTrigger disableButtonEnhancement>
                            <MenuButton appearance="transparent" icon={<MoreHorizontal20Regular />} aria-label={`Akcje dla ${cls.nazwa}`} />
                        </MenuTrigger>
                        <MenuPopover>
                            <MenuList>
                                <MenuItem icon={<Edit20Regular />} onClick={() => onEdit(cls)}>Edytuj</MenuItem>
                                <MenuItem icon={<Delete20Regular />} onClick={() => onDelete(cls.id)}>Usuń</MenuItem>
                            </MenuList>
                        </MenuPopover>
                    </Menu>
                </div>
            </div>
            <div className={styles.footer}>
                <div className='flex items-center justify-between'>
                    <span className={styles.terminyText} title={terminyText}>
                        {terminyText}
                    </span>
                    <span className={styles.footerText} title={roomName}>{roomName}</span>
                </div>
            </div>
        </div>
    );
};


export default function ClassesView({ allClasses, allRooms, isLoading, onSaveClass, onDeleteClass }) {
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [classLocationFilter, setClassLocationFilter] = useState('mikolajki');

    function getCurrentSchoolYear() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        return month >= 8 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
    }
const [currentSchoolYear, setCurrentSchoolYear] = useState(getCurrentSchoolYear());

// --- DODAJ TĘ FUNKCJĘ ---
const handleSaveAndCloseModal = async (classData) => {
    // --- DODAJ TĘ LINIĘ ---
    console.log("Krok 2 (Widok): Odebrano dane do zapisu:", classData);

    await onSaveClass(classData); 
    setIsClassModalOpen(false);   
};

const handleOpenClassModal = (cls = null) => {
        setEditingClass(cls);
        setIsClassModalOpen(true);
    };

    const getRoomName = (roomId) => allRooms.find(r => r.id === roomId)?.nazwa || 'Brak sali';

    // POPRAWIONA LOGIKA FILTROWANIA
    const filteredClasses = useMemo(() => {
        const sorted = (allClasses || [])
            .filter(cls => cls.rokSzkolny === currentSchoolYear)
            .sort((a,b) => {
                const dayA = a.terminy && a.terminy[0] ? a.terminy[0].dzienTygodnia : '9';
                const dayB = b.terminy && b.terminy[0] ? b.terminy[0].dzienTygodnia : '9';
                const timeA = a.terminy && a.terminy[0] ? a.terminy[0].godzinaOd : '23:59';
                const timeB = b.terminy && b.terminy[0] ? b.terminy[0].godzinaOd : '23:59';
                if (dayA !== dayB) return dayA - dayB;
                return timeA.localeCompare(timeB);
            });

        return sorted.filter(cls => {
            // Używamy `allRooms` zamiast `rooms`
            const room = (allRooms || []).find(r => r.id === cls.salaId);
            if (!room || !room.numer) {
                return classLocationFilter === 'mikolajki';
            }
            const numerUpper = String(room.numer).toUpperCase();

            if (classLocationFilter === 'woznice') return numerUpper.startsWith('W');
            if (classLocationFilter === 'baranowo') return numerUpper.startsWith('B');
            return !numerUpper.startsWith('W') && !numerUpper.startsWith('B');
        });
    }, [allClasses, allRooms, currentSchoolYear, classLocationFilter]);

    const changeSchoolYear = (direction) => {
        const [startYear] = currentSchoolYear.split('/').map(Number);
        const newStartYear = startYear + direction;
        setCurrentSchoolYear(`${newStartYear}/${newStartYear + 1}`);
    };

    return (
        <>
            <ClassModal 
                isOpen={isClassModalOpen} 
                onClose={() => setIsClassModalOpen(false)}
                onSave={handleSaveAndCloseModal}
                isLoading={isLoading}
                editingClass={editingClass}
                rooms={allRooms}
                schoolYear={currentSchoolYear}
            />

            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <TabList selectedValue={classLocationFilter} onTabSelect={(_, data) => setClassLocationFilter(data.value)}>
                        <Tab value="mikolajki">Mikołajki</Tab>
                        <Tab value="woznice">Woźnice</Tab>
                        <Tab value="baranowo">Baranowo</Tab>
                    </TabList>
                    <div className="flex items-center gap-1">
                        {/* ZMIANA NR 2: Używamy mniejszych ikon */}
                        <Button size="small" icon={<ChevronLeft20Regular />} onClick={() => changeSchoolYear(-1)} />
                        <span className="font-semibold text-center w-24">{currentSchoolYear}</span>
                        <Button size="small" icon={<ChevronRight20Regular />} onClick={() => changeSchoolYear(1)} />
                    </div>
                </div>
                <Button appearance="primary" icon={<Add24Regular />} onClick={() => handleOpenClassModal(null)}>
                    Dodaj zajęcia
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {isLoading && (allClasses || []).length === 0 ? <LoadingSpinner /> : (
                    filteredClasses.length > 0 ? filteredClasses.map(cls => (
                        <ClassItem 
                            key={cls.id}
                            cls={cls}
                            roomName={getRoomName(cls.salaId)}
                            onEdit={handleOpenClassModal}
                            onDelete={onDeleteClass}
                        />
                    )) : <p className="text-sm text-gray-500 text-center py-8 col-span-full">Brak zdefiniowanych zajęć w tej lokalizacji dla okresu {currentSchoolYear}.</p>
                )}
            </div>
        </>
    );
}
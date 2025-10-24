import React, { useState, useEffect, useMemo, useRef } from 'react';
import firebase, { db, firebaseApi } from '../../../lib/firebase';
import {
    Button,
    Title1,
    Title3,
    Body1,
    Card,
    CardHeader,
    makeStyles,
    shorthands,
    tokens,
    TagPicker, TagPickerControl, TagPickerGroup, Tag, TagPickerInput, TagPickerList, TagPickerOption,
    Tooltip
} from "@fluentui/react-components";
import { 
    ArrowLeft24Regular,
    XboxConsole20Regular, Laptop20Regular, HeadsetVr20Regular, Games20Regular, Tv20Regular, Headset20Regular,
    Router20Regular, Briefcase20Regular,
    Checkmark16Filled, Cart16Regular, Star16Regular, ClipboardTextLtr16Regular, QuestionCircle16Regular,
} from "@fluentui/react-icons";
import LoadingSpinner from '../../../components/LoadingSpinner';
import CondensedGridCard from '../../../components/CondensedGridCard';
import GameModal from '../modals/GameModal';

const useStyles = makeStyles({
    // Zachowujemy tylko potrzebne style
    cardContent: {
        display: 'flex', flexDirection: 'column', height: '100%',
        padding: tokens.spacingVerticalS, justifyContent: 'space-between',
    },
    imageContainer: {
        width: '100%', aspectRatio: '1 / 1', marginBottom: tokens.spacingVerticalM,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusMedium,
        overflow: 'hidden', position: 'relative',
    },
    image: { width: '100%', height: '100%', objectFit: 'cover' },
    icon: { fontSize: '48px', color: tokens.colorNeutralForeground2 },
    overlayContainer: {
        position: 'absolute', top: tokens.spacingVerticalS, left: tokens.spacingHorizontalS,
        display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXS,
    },
    overlayBox: {
        backgroundColor: tokens.colorNeutralBackground1, color: tokens.colorNeutralForeground2,
        borderRadius: tokens.borderRadiusSmall, padding: '4px', width: '28px', height: '28px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: tokens.shadow8,
    },
    smallIcon: { fontSize: '16px', display: 'flex', alignItems: 'center' },
    numberText: { fontSize: tokens.fontSizeBase200, fontWeight: tokens.fontWeightSemibold, color: tokens.colorNeutralForeground1 },
    title: {
        fontSize: tokens.fontSizeBase200, fontWeight: tokens.fontWeightSemibold,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        textAlign: 'center', display: 'block', marginBottom: tokens.spacingVerticalL,
    },
    detailsList: {
        display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXS,
        fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground2,
        textAlign: 'center', marginBottom: tokens.spacingVerticalL, flexGrow: 1,
    },
    title3: {
        fontSize: tokens.fontSizeBase500,
        fontWeight: tokens.fontWeightSemibold,
        marginRight: tokens.spacingHorizontalL, // Odstęp między tytułem a tagami
    },
    filterSection: {
        display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalL,
        marginTop: tokens.spacingVerticalM, flexWrap: 'wrap',
    },
    tagPicker: { minWidth: '250px', flexGrow: 1 },
    simpleCardList: {
        display: 'flex', flexDirection: 'column', gap: tokens.spacingHorizontalS,
        marginTop: tokens.spacingVerticalM,
    },
    // Nowe style dla filtra tagów
    tagFilterContainer: {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: tokens.spacingHorizontalS,
        flexGrow: 1,
    },
    filterTag: {
        cursor: 'pointer',
    }
});

// KROK 1: Kopiujemy komponent EquipmentCard z EquipmentView.jsx i modyfikujemy go
const EquipmentCard = ({ item }) => {
    const styles = useStyles();
    const titleRef = useRef(null);
    const [isTitleOverflowing, setIsTitleOverflowing] = useState(false);

    useEffect(() => {
        if (titleRef.current && titleRef.current.scrollWidth > titleRef.current.clientWidth) {
            setIsTitleOverflowing(true);
        } else {
            setIsTitleOverflowing(false);
        }
    }, [item.name]);

    const equipmentTypes = {
        console: { text: 'Konsola', icon: <XboxConsole20Regular /> },
        pc: { text: 'Komputer', icon: <Laptop20Regular /> },
        vr: { text: 'VR', icon: <HeadsetVr20Regular /> },
        controller: { text: 'Kontroler', icon: <Games20Regular /> },
        monitor: { text: 'Monitor', icon: <Tv20Regular /> },
        router: { text: 'Router', icon: <Router20Regular /> },
        case: { text: 'Torba, etui, skrzynia', icon: <Briefcase20Regular /> },
        accessory: { text: 'Akcesorium', icon: <Headset20Regular /> },
    };
    
    const typeInfo = equipmentTypes[item.type] || equipmentTypes.accessory;

    return (
        <Card>
            <div className={styles.cardContent}>
                <div>
                    <div className={styles.imageContainer}>
                        {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className={styles.image} />
                        ) : (
                            <span className={styles.icon}>{typeInfo.icon}</span>
                        )}

                        <div className={styles.overlayContainer}>
                            <Tooltip content={typeInfo.text} relationship="label">
                                <div className={styles.overlayBox}>
                                    <span className={styles.smallIcon}>{typeInfo.icon}</span>
                                </div>
                            </Tooltip>
                            {item.number && (
                                <Tooltip content="Numer sprzętu" relationship="label">
                                    <div className={styles.overlayBox}>
                                        <span className={styles.numberText}>#{item.number}</span>
                                    </div>
                                </Tooltip>
                            )}
                            {/* ZMIANA NR 1: Usunięto ikonę własności prywatnej */}
                        </div>
                    </div>
                    <Tooltip content={item.name} relationship="label" disabled={!isTitleOverflowing}>
                        <h3 ref={titleRef} className={styles.title}>{item.name}</h3>
                    </Tooltip>
                    <div className={styles.detailsList}>
                        {item.condition && (
                            <Tooltip content="Stan" relationship="label">
                                <p className={styles.conditionText}>{item.condition.toLowerCase()}</p>
                            </Tooltip>
                        )}
                        {/* ZMIANA NR 1: Usunięto datę i cenę zakupu */}
                    </div>
                </div>
            </div>
        </Card>
    );
};

const equipmentConditionOptions = ['Sprawny', 'Uszkodzony', 'Planowany'];
const gameStatusOptions = ['Zainstalowana', 'Zakupiona', 'W subskrypcji', 'Planowana'];

// ETAP 2: Logika pobierania ikony i tooltipa dla statusu gry
const statusPriority = ['Zainstalowana', 'Zakupiona', 'W subskrypcji', 'Planowana'];
const statusInfoMap = {
    'Zainstalowana': { icon: <Checkmark16Filled />, text: 'Zainstalowana' },
    'Zakupiona': { icon: <Cart16Regular />, text: 'Zakupiona' },
    'W subskrypcji': { icon: <Star16Regular />, text: 'W subskrypcji' },
    'Planowana': { icon: <ClipboardTextLtr16Regular />, text: 'Planowana' },
    'default': { icon: <QuestionCircle16Regular />, text: 'Brak statusu' }
};

const getGameStatusInfo = (game, accountsOnStation) => {
    if (!game.assignments || game.assignments.length === 0) return statusInfoMap.default;
    const relevantAssignments = game.assignments.filter(assign => 
        accountsOnStation.some(acc => acc.id === assign.accountId)
    );
    if (relevantAssignments.length === 0) return statusInfoMap.default;
    let highestPriorityStatus = null;
    for (const status of statusPriority) {
        if (relevantAssignments.some(assign => assign.status === status)) {
            highestPriorityStatus = status;
            break;
        }
    }
    return highestPriorityStatus ? statusInfoMap[highestPriorityStatus] : statusInfoMap.default;
};

export default function StationDetailsView({ stationId, onBack }) {
    const styles = useStyles();
    const [station, setStation] = useState(null);
    const [equipment, setEquipment] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [games, setGames] = useState([]);
    const [allGames, setAllGames] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEquipmentConditions, setSelectedEquipmentConditions] = useState([]);
    
    // ZMIANA: Stan dla filtra jednokrotnego wyboru
    const [selectedGameStatus, setSelectedGameStatus] = useState(null);
    const [allAccounts, setAllAccounts] = useState([]);
    
    const [isGameModalOpen, setIsGameModalOpen] = useState(false);
    const [selectedGame, setSelectedGame] = useState(null);

    useEffect(() => {
        const loadAllData = async () => {
            setIsLoading(true);
            
            // Pobieramy wszystkie konta od razu, bo będą potrzebne
            const allAccountsRef = db.collection(firebaseApi._getFullPath('accounts'));
            const allAccountsSnapshot = await allAccountsRef.get();
            const allAccountsData = allAccountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllAccounts(allAccountsData); // <-- ZAPISUJEMY WSZYSTKIE KONTA

            const stationRef = db.collection(firebaseApi._getFullPath('stations')).doc(stationId);
            const stationDoc = await stationRef.get();
            if (!stationDoc.exists) {
                setStation(null);
                setIsLoading(false);
                return;
            }
            const stationData = { id: stationDoc.id, ...stationDoc.data() };
            setStation(stationData);

            if (!stationData.equipmentIds || stationData.equipmentIds.length === 0) {
                setEquipment([]);
                setAccounts([]);
                setGames([]);
                setIsLoading(false);
                return;
            }
            const equipmentRef = db.collection(firebaseApi._getFullPath('gamingEquipment'))
                .where(firebase.firestore.FieldPath.documentId(), 'in', stationData.equipmentIds);
            const equipmentSnapshot = await equipmentRef.get();
            const equipmentData = equipmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEquipment(equipmentData);
            
            const equipmentIds = equipmentData.map(e => e.id);
            if (equipmentIds.length === 0) {
                setAccounts([]);
                setGames([]);
                setIsLoading(false);
                return;
            }

            // Filtrujemy konta dla stanowiska z już pobranej pełnej listy
            const accountsOnStation = allAccountsData.filter(acc => equipmentIds.includes(acc.assignedEquipmentId));
            setAccounts(accountsOnStation);

            const gamesRef = db.collection(firebaseApi._getFullPath('gameLibrary'));
            const gamesSnapshot = await gamesRef.get();
            const allGamesData = gamesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllGames(allGamesData);

            const accountIdsOnStation = accountsOnStation.map(a => a.id);
            const gamesOnStation = allGamesData.filter(game => 
                game.assignments && game.assignments.some(assign => accountIdsOnStation.includes(assign.accountId))
            );
            setGames(gamesOnStation);

            setIsLoading(false);
        };

        if (stationId) {
            loadAllData().catch(error => {
                console.error("Błąd podczas ładowania danych dla stanowiska:", error);
                setIsLoading(false);
            });
        }
    }, [stationId]);
    
    const filteredEquipment = useMemo(() => {
        if (selectedEquipmentConditions.length === 0) return equipment;
        return equipment.filter(item => selectedEquipmentConditions.includes(item.condition));
    }, [equipment, selectedEquipmentConditions]);

    const sortedAndFilteredGames = useMemo(() => {
        // Tworzymy listę ID kont, które są na tym konkretnym stanowisku
        const accountIdsOnStation = accounts.map(acc => acc.id);

        const filtered = !selectedGameStatus
            ? games
            : games.filter(game => {
                // Sprawdzamy, czy gra ma przypisanie, które spełnia OBA warunki:
                return game.assignments && game.assignments.some(assign => 
                    // 1. Status przypisania jest zgodny z wybranym filtrem
                    assign.status === selectedGameStatus && 
                    // 2. Konto, do którego należy to przypisanie, jest na naszym stanowisku
                    accountIdsOnStation.includes(assign.accountId)
                );
            });

        return filtered.sort((a, b) => {
            const statusA = getGameStatusInfo(a, accounts).text;
            const statusB = getGameStatusInfo(b, accounts).text;
            const priorityA = statusPriority.indexOf(statusA);
            const priorityB = statusPriority.indexOf(statusB);

            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            return a.name.localeCompare(b.name, 'pl', { sensitivity: 'base' });
        });
    }, [games, selectedGameStatus, accounts]);

    const handleEditGame = (game) => {
        setSelectedGame(game);
        setIsGameModalOpen(true);
    };

    // ZMIANA: Handler dla nowego filtra tagów
    const handleStatusTagClick = (status) => {
        if (selectedGameStatus === status) {
            setSelectedGameStatus(null); // Odznacz, jeśli kliknięto ten sam
        } else {
            setSelectedGameStatus(status); // Zaznacz nowy
        }
    };

    if (isLoading) return <LoadingSpinner />;
    
    if (!station) {
        return (
            <div>
                <Button icon={<ArrowLeft24Regular />} onClick={onBack}>
                    Wróć do listy stanowisk
                </Button>
                <Title1 as="h2" className="mt-4">Błąd</Title1>
                <Body1>Nie udało się załadować danych stanowiska lub stanowisko nie istnieje.</Body1>
            </div>
        );
    }

    const getEquipmentNameForAccount = (equipmentId) => {
        const eq = equipment.find(e => e.id === equipmentId);
        return eq ? eq.name : 'Nieznany sprzęt';
    };
    const getAccountNameForGame = (accountId) => {
        const acc = accounts.find(a => a.id === accountId);
        return acc ? (acc.nickname || acc.email) : 'Nieznane konto';
    }
    const getMainAccountForGame = (game) => {
        if (!game.assignments || game.assignments.length === 0) return 'Brak';
        const mainAssignment = game.assignments[0];
        return getAccountNameForGame(mainAssignment.accountId);
    }
    const getStatusesForGame = (game) => {
        if (!game.assignments || game.assignments.length === 0) return '';
        const statuses = game.assignments.map(a => a.status);
        return [...new Set(statuses)].join(', '); // Unikalne statusy
    }

     return (
        <div>
            {isGameModalOpen && (
                <GameModal 
                    isOpen={isGameModalOpen}
                    onClose={() => setIsGameModalOpen(false)}
                    initialData={selectedGame}
                    allGames={allGames}
                    allAccounts={allAccounts}
                />
            )}

            <div className="mb-4">
                <Button icon={<ArrowLeft24Regular />} onClick={onBack}>Wróć do listy stanowisk</Button>
            </div>
            <div>
                <Title1 as="h2">{station.name}</Title1>
                <Body1>{station.description}</Body1>

                <div className="mt-6">
                    <div className={styles.filterSection}>
                         <Title3 as="h3">Sprzęt na stanowisku</Title3>
                         {/* KROK 5a: Komponent TagPicker do filtrowania */}
                         <TagPicker 
                            onOptionSelect={(_, data) => setSelectedEquipmentConditions(data.selectedOptions)} 
                            selectedOptions={selectedEquipmentConditions}
                            className={styles.tagPicker}
                        >
                            <TagPickerControl>
                                <TagPickerGroup>
                                    {selectedEquipmentConditions.map(option => <Tag key={option} value={option}>{option}</Tag>)}
                                </TagPickerGroup>
                                <TagPickerInput placeholder="Filtruj po stanie..." />
                            </TagPickerControl>
                            <TagPickerList>
                                {equipmentConditionOptions
                                    .filter(opt => !selectedEquipmentConditions.includes(opt))
                                    .map(opt => <TagPickerOption value={opt} key={opt}>{opt}</TagPickerOption>)}
                            </TagPickerList>
                        </TagPicker>
                    </div>
                    {/* ZMIANA NR 1: Używamy grida i nowego komponentu EquipmentCard */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8 mt-4">
                        {filteredEquipment.length > 0 ? (
                            filteredEquipment.map(item => (
                                <EquipmentCard key={item.id} item={item} />
                            ))
                        ) : (
                            <div className="col-span-full">
                                <Body1>Brak sprzętu spełniającego wybrane kryteria.</Body1>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6">
                    <Title3 as="h3">Konta na sprzętach</Title3>
                    <div className={styles.list}>
                        {accounts.length > 0 ? (
                            accounts.map(account => (
                                <Card key={account.id} className={styles.card}>
                                    <CardHeader
                                        header={<Body1 weight="semibold">{account.nickname || account.email}</Body1>}
                                        description={<Body1>Sprzęt: {getEquipmentNameForAccount(account.assignedEquipmentId)}</Body1>}
                                    />
                                </Card>
                            ))
                        ) : (
                            <Body1>Brak przypisanych kont do sprzętów na tym stanowisku.</Body1>
                        )}
                    </div>
                </div>

                <div className="mt-6 mb-8">
                    {/* ZMIANA: Nowy układ sekcji gier */}
                    <div className={styles.filterSection}>
                        <Title3 as="h3" className={styles.title3}>Gry na kontach</Title3>
                        <div className={styles.tagFilterContainer}>
                            {gameStatusOptions.map(status => (
                                <Tag
                                    key={status}
                                    shape="rounded"
                                    appearance={selectedGameStatus === status ? "brand" : "outline"}
                                    className={styles.filterTag}
                                    onClick={() => handleStatusTagClick(status)}
                                >
                                    {status}
                                </Tag>
                            ))}
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                        {sortedAndFilteredGames.length > 0 ? (
                            sortedAndFilteredGames.map(game => (
                                <CondensedGridCard
                                    key={game.id}
                                    imageUrl={game.imageUrl}
                                    title={game.name}
                                    onEditClick={() => handleEditGame(game)}
                                />
                            ))
                        ) : (
                           <div className="col-span-full">
                                <Body1>Brak gier spełniających wybrane kryteria.</Body1>
                           </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
import React, { useState, useEffect, useMemo } from 'react';
import { db, firebaseApi } from '../../../lib/firebase';
import { 
    Button, Card, makeStyles, tokens,
    Menu, MenuTrigger, MenuPopover, MenuList, MenuItem,
    Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, Body1,
    Tooltip,
    TagPicker, TagPickerControl, TagPickerGroup, Tag, TagPickerInput, TagPickerList, TagPickerOption
} from "@fluentui/react-components";
import { 
    Add24Regular, MoreHorizontal24Regular, 
    XboxConsole20Regular, Laptop20Regular, HeadsetVr20Regular, Games20Regular, Tv20Regular, Headset20Regular,
    Router20Regular, Briefcase20Regular, // <-- Dodajemy nowe ikony
    NumberSymbol20Regular, Calendar20Regular, Money20Regular,
    Cart20Regular
} from "@fluentui/react-icons";
import LoadingSpinner from '../../../components/LoadingSpinner';
import EquipmentModal from '../modals/EquipmentModal';
import ManageEquipmentModal from '../modals/ManageEquipmentModal';

const useStyles = makeStyles({
    // ... (style bez zmian)
    cardContent: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: tokens.spacingVerticalS,
        justifyContent: 'space-between',
    },
    imageContainer: {
        width: '100%',
        aspectRatio: '1 / 1',
        marginBottom: tokens.spacingVerticalM,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tokens.colorNeutralBackground2,
        borderRadius: tokens.borderRadiusMedium,
        overflow: 'hidden',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    icon: {
        fontSize: '48px',
        color: tokens.colorNeutralForeground2,
    },
    overlayContainer: {
        position: 'absolute',
        top: tokens.spacingVerticalS,
        left: tokens.spacingHorizontalS,
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalXS,
    },
    overlayBox: {
        backgroundColor: tokens.colorNeutralBackground1,
        color: tokens.colorNeutralForeground2,
        borderRadius: tokens.borderRadiusSmall,
        padding: '4px',
        width: '28px',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: tokens.shadow8,
    },
    smallIcon: {
        fontSize: '16px',
        display: 'flex',
        alignItems: 'center',
    },
    numberText: {
        fontSize: tokens.fontSizeBase200,
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorNeutralForeground1,
    },
    title: {
        fontSize: tokens.fontSizeBase200,
        fontWeight: tokens.fontWeightSemibold,
        height: '40px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        marginBottom: tokens.spacingVerticalL,
    },
    detailsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalXS,
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground2,
        textAlign: 'center',
        marginBottom: tokens.spacingVerticalL,
        flexGrow: 1,
    },
    conditionText: {
        fontStyle: 'italic',
    },
    metaLine: {
        display: 'flex',
        justifyContent: 'center',
        gap: tokens.spacingHorizontalXS,
    },
    menuContainer: {
        display: 'flex',
        justifyContent: 'center',
    },
    toolbar: {
        display: 'flex',
        gap: tokens.spacingHorizontalL,
        marginBottom: tokens.spacingVerticalL,
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    filters: {
        display: 'flex',
        gap: tokens.spacingHorizontalL,
        flexGrow: 1,
        flexWrap: 'wrap',
    },
    tagPicker: {
        minWidth: '200px',
        flexGrow: 1,
    }
});

const EquipmentCard = ({ item, onManage, onEdit, onDelete }) => {
    const styles = useStyles();

    // ZMIANA: Dodajemy nowe typy do mapy ikon
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
                            {item.owner === 'Prywatny' && (
                                <Tooltip content="Własność prywatna" relationship="label">
                                    <div className={styles.overlayBox}>
                                        <span className={styles.smallIcon}><Cart20Regular /></span>
                                    </div>
                                </Tooltip>
                            )}
                        </div>
                    </div>
                    <h3 className={styles.title}>{item.name}</h3>
                    <div className={styles.detailsList}>
                        {item.condition && (
                            <Tooltip content="Stan" relationship="label">
                                <p className={styles.conditionText}>{item.condition.toLowerCase()}</p>
                            </Tooltip>
                        )}
                        <div className={styles.metaLine}>
                            {item.purchaseDate && (
                                <Tooltip content="Data zakupu" relationship="label">
                                    <span>{item.purchaseDate}</span>
                                </Tooltip>
                            )}
                            {item.purchaseDate && item.purchasePrice && <span>|</span>}
                            {item.purchasePrice && (
                                <Tooltip content="Cena zakupu" relationship="label">
                                    <span>{item.purchasePrice} zł</span>
                                </Tooltip>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className={styles.menuContainer}>
                    <Menu>
                        <MenuTrigger disableButtonEnhancement>
                            <Button appearance="subtle" size="small" icon={<MoreHorizontal24Regular />} />
                        </MenuTrigger>
                        <MenuPopover>
                            <MenuList>
                                <MenuItem onClick={() => onManage(item)}>Zarządzaj</MenuItem>
                                <MenuItem onClick={() => onEdit(item)}>Edytuj</MenuItem>
                                <MenuItem onClick={() => onDelete(item.id)}>Usuń</MenuItem>
                            </MenuList>
                        </MenuPopover>
                    </Menu>
                </div>
            </div>
        </Card>
    );
};

// ZMIANA: Zaktualizowane opcje filtrowania
const equipmentTypeOptions = [
    { key: 'all', text: 'Wszystkie typy' },
    { key: 'console', text: 'Konsola' }, { key: 'pc', text: 'Komputer' },
    { key: 'vr', text: 'VR' }, { key: 'controller', text: 'Kontroler' },
    { key: 'monitor', text: 'Monitor' }, { key: 'router', text: 'Router' },
    { key: 'case', text: 'Torba, etui, skrzynia' }, { key: 'accessory', text: 'Akcesorium' },
];
const conditionOptions = ['Wszystkie stany', 'Sprawny', 'Uszkodzony', 'Planowany'];
const ownerOptions = ['Wszyscy', 'Centrum Kultury', 'Prywatny'];


export default function EquipmentView() {
    // ... (reszta kodu bez zmian, wszystko powinno działać z nowymi opcjami)
    const styles = useStyles();
    const [allEquipment, setAllEquipment] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [equipmentToDelete, setEquipmentToDelete] = useState(null);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [selectedConditions, setSelectedConditions] = useState([]);
    const [selectedOwners, setSelectedOwners] = useState([]);

    useEffect(() => {
        const equipmentCollectionRef = db.collection(firebaseApi._getFullPath('gamingEquipment'));
        const unsubscribe = equipmentCollectionRef.onSnapshot((snapshot) => {
            const equipmentData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            equipmentData.sort((a, b) => (b.purchaseDate || '').localeCompare(a.purchaseDate || ''));
            setAllEquipment(equipmentData);
            setIsLoading(false);
        }, (error) => {
            console.error("Błąd pobierania sprzętu:", error);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredEquipment = useMemo(() => {
        return allEquipment.filter(item => {
            const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(item.type);
            const conditionMatch = selectedConditions.length === 0 || selectedConditions.includes(item.condition);
            const ownerMatch = selectedOwners.length === 0 || selectedOwners.includes(item.owner);
            return typeMatch && conditionMatch && ownerMatch;
        });
    }, [allEquipment, selectedTypes, selectedConditions, selectedOwners]);

    const handleEdit = (equipment) => {
        setSelectedEquipment(equipment);
        setIsEditModalOpen(true);
    };
    
    const handleManage = (equipment) => {
        setSelectedEquipment(equipment);
        setIsManageModalOpen(true);
    };

    const handleAddNew = () => {
        setSelectedEquipment(null);
        setIsEditModalOpen(true);
    };
    
    const confirmDelete = (equipmentId) => {
        setEquipmentToDelete(equipmentId);
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (equipmentToDelete) {
            try {
                await db.collection(firebaseApi._getFullPath('gamingEquipment')).doc(equipmentToDelete).delete();
            } catch (error) {
                console.error("Błąd podczas usuwania sprzętu:", error);
            }
        }
        setIsConfirmOpen(false);
        setEquipmentToDelete(null);
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div>
            {isEditModalOpen && <EquipmentModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} initialData={selectedEquipment} />}
            {isManageModalOpen && <ManageEquipmentModal isOpen={isManageModalOpen} onClose={() => setIsManageModalOpen(false)} equipment={selectedEquipment} />}
            <Dialog open={isConfirmOpen} onOpenChange={(_, data) => !data.open && setIsConfirmOpen(false)}>
                <DialogSurface>
                    <DialogBody>
                        <DialogTitle>Potwierdź usunięcie</DialogTitle>
                        <Body1>Czy na pewno chcesz usunąć ten sprzęt? Wszystkie przypisane do niego gry i konta również zostaną usunięte. Tej operacji nie można cofnąć.</Body1>
                    </DialogBody>
                    <DialogActions>
                        <Button appearance="secondary" onClick={() => setIsConfirmOpen(false)}>Anuluj</Button>
                        <Button appearance="primary" onClick={handleDelete}>Usuń</Button>
                    </DialogActions>
                </DialogSurface>
            </Dialog>
            
            <div className={styles.toolbar}>
                <div className={styles.filters}>
                    <TagPicker 
                        onOptionSelect={(_, data) => setSelectedTypes(data.selectedOptions)} 
                        selectedOptions={selectedTypes}
                        className={styles.tagPicker}
                    >
                        <TagPickerControl>
                            <TagPickerGroup>
                                {selectedTypes.map(option => <Tag key={option} value={option}>{equipmentTypeOptions.find(o => o.key === option)?.text}</Tag>)}
                            </TagPickerGroup>
                            <TagPickerInput placeholder="Filtruj po typie..." />
                        </TagPickerControl>
                        <TagPickerList>
                            {equipmentTypeOptions
                                .filter(opt => !selectedTypes.includes(opt.key) && opt.key !== 'all')
                                .map(opt => <TagPickerOption value={opt.key} key={opt.key}>{opt.text}</TagPickerOption>)}
                        </TagPickerList>
                    </TagPicker>
                    <TagPicker 
                        onOptionSelect={(_, data) => setSelectedConditions(data.selectedOptions)} 
                        selectedOptions={selectedConditions}
                        className={styles.tagPicker}
                    >
                        <TagPickerControl>
                            <TagPickerGroup>
                                {selectedConditions.map(option => <Tag key={option} value={option}>{option}</Tag>)}
                            </TagPickerGroup>
                            <TagPickerInput placeholder="Filtruj po stanie..." />
                        </TagPickerControl>
                        <TagPickerList>
                            {conditionOptions
                                .filter(opt => !selectedConditions.includes(opt) && opt !== 'Wszystkie stany')
                                .map(opt => <TagPickerOption value={opt} key={opt}>{opt}</TagPickerOption>)}
                        </TagPickerList>
                    </TagPicker>
                     <TagPicker 
                        onOptionSelect={(_, data) => setSelectedOwners(data.selectedOptions)} 
                        selectedOptions={selectedOwners}
                        className={styles.tagPicker}
                    >
                        <TagPickerControl>
                            <TagPickerGroup>
                                {selectedOwners.map(option => <Tag key={option} value={option}>{option}</Tag>)}
                            </TagPickerGroup>
                            <TagPickerInput placeholder="Filtruj po własności..." />
                        </TagPickerControl>
                        <TagPickerList>
                            {ownerOptions
                                .filter(opt => !selectedOwners.includes(opt) && opt !== 'Wszyscy')
                                .map(opt => <TagPickerOption value={opt} key={opt}>{opt}</TagPickerOption>)}
                        </TagPickerList>
                    </TagPicker>
                </div>
                <Button icon={<Add24Regular />} appearance="primary" onClick={handleAddNew}>
                    Dodaj sprzęt
                </Button>
            </div>


            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
                {filteredEquipment.map((item) => (
                    <EquipmentCard 
                        key={item.id}
                        item={item}
                        onManage={handleManage}
                        onEdit={handleEdit}
                        onDelete={confirmDelete}
                    />
                ))}
            </div>
             {filteredEquipment.length === 0 && <p className="text-center p-8 text-neutral-foreground-2">Brak sprzętu spełniającego wybrane kryteria.</p>}
        </div>
    );
}
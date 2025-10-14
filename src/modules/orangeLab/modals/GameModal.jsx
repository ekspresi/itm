import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, Button, Input, Field,
    makeStyles, tokens,
    TagPicker, TagPickerControl, TagPickerGroup, Tag, TagPickerInput, TagPickerList, TagPickerOption,
    Dropdown, Option,
    Tooltip,
    Switch // <-- NOWY IMPORT
} from "@fluentui/react-components";
import { Add24Regular, Dismiss16Regular } from "@fluentui/react-icons";
import { db, firebaseApi } from '../../../lib/firebase';

const useStyles = makeStyles({
    dialogBody: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
    formGrid: { 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: tokens.spacingVerticalL, 
        paddingTop: tokens.spacingVerticalL,
        marginBottom: tokens.spacingVerticalL,
    },
    fullWidth: { gridColumnStart: 1, gridColumnEnd: 3 },
    assignmentSection: { 
        display: 'grid', 
        gridTemplateColumns: '2fr 1fr auto', 
        gap: tokens.spacingHorizontalM, 
        alignItems: 'end',
        padding: tokens.spacingVerticalL,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderRadius: tokens.borderRadiusMedium,
    },
    autoWidthDropdown: {
        minWidth: 'auto',
    },
    assignmentsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalS,
        marginTop: tokens.spacingVerticalS,
    },
    assignmentItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
        backgroundColor: tokens.colorNeutralBackground2,
        borderRadius: tokens.borderRadiusSmall,
    },
    optionWithIcon: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
    }
});

const getAccountTypeIcon = (accountType) => {
    if (!accountType) return null;
    let iconClass = 'fas fa-question-circle';
    const type = accountType.toLowerCase();

    if (type.includes('steam')) iconClass = 'fab fa-steam';
    else if (type.includes('xbox')) iconClass = 'fab fa-xbox';
    else if (type.includes('playstation')) iconClass = 'fab fa-playstation';
    else if (type.includes('epic')) iconClass = 'fa-solid fa-gamepad';
    else if (type.includes('ubisoft')) iconClass = 'fa-solid fa-gamepad';

    return <i className={`${iconClass} text-base w-5 text-center`}></i>;
};

export default function GameModal({ isOpen, onClose, initialData, allGames, allAccounts }) {
    const styles = useStyles();
    const [formData, setFormData] = useState({ name: '', imageUrl: '', genres: [], assignments: [] });
    const [isSaving, setIsSaving] = useState(false);
    
    const [currentAccountId, setCurrentAccountId] = useState('');
    const [currentStatus, setCurrentStatus] = useState('Planowana');
    const [availableGenres, setAvailableGenres] = useState([]);
    const [genreInput, setGenreInput] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.name || '', imageUrl: initialData.imageUrl || '',
                    genres: initialData.genres || [], assignments: initialData.assignments || [],
                    playerCount: initialData.playerCount || '', // Nowe pole
                    supportsSteeringWheel: initialData.supportsSteeringWheel || false, // Nowe pole
                });
            } else {
                setFormData({ 
                    name: '', imageUrl: '', genres: [], assignments: [],
                    playerCount: '', supportsSteeringWheel: false,
                });
            }

            const allExistingGenres = allGames.reduce((acc, game) => {
                (game.genres || []).forEach(genre => acc.add(genre));
                return acc;
            }, new Set());
            setAvailableGenres(Array.from(allExistingGenres));
            setGenreInput('');
        }
    }, [initialData, allGames, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleGenreSelect = (event, data) => {
        setFormData(prev => ({...prev, genres: data.selectedOptions}));
    };
    
    const handleSwitchChange = (fieldName, checked) => {
        setFormData(prev => ({...prev, [fieldName]: checked}));
    };

    const handleGenreKeyDown = (event) => {
        if (event.key === ',' || event.key === 'Enter') {
            event.preventDefault();
            const newTag = genreInput.trim();
            if (newTag && !formData.genres.includes(newTag)) {
                setFormData(prev => ({...prev, genres: [...prev.genres, newTag]}));
                if (!availableGenres.includes(newTag)) {
                    setAvailableGenres(prev => [...prev, newTag]);
                }
            }
            setGenreInput('');
        }
    };

    const handleAddAssignment = () => {
        if (!currentAccountId || !currentStatus) return;
        const newAssignment = { accountId: currentAccountId, status: currentStatus };
        if (!formData.assignments.some(a => a.accountId === newAssignment.accountId)) {
            setFormData(prev => ({...prev, assignments: [...prev.assignments, newAssignment]}));
        }
    };
    
    const handleRemoveAssignment = (accountIdToRemove) => {
        setFormData(prev => ({...prev, assignments: prev.assignments.filter(a => a.accountId !== accountIdToRemove)}));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let finalGenres = [...formData.genres];
            const lastTypedGenre = genreInput.trim();
            if (lastTypedGenre && !finalGenres.includes(lastTypedGenre)) {
                finalGenres.push(lastTypedGenre);
            }
            
            const dataToSave = { ...formData, genres: finalGenres };
            if (!dataToSave.genres.includes('Wyścigowe')) {
                dataToSave.supportsSteeringWheel = false; // Czyść pole, jeśli gra nie jest wyścigowa
            }

            const collectionRef = db.collection(firebaseApi._getFullPath('gameLibrary'));
            let docRef;

            if (initialData?.id) {
                docRef = collectionRef.doc(initialData.id);
            } else {
                docRef = collectionRef.doc();
                dataToSave.id = docRef.id;
            }
            
            await docRef.set(dataToSave, { merge: true });
            onClose();

        } catch (error) {
            console.error("Błąd zapisu gry:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const assignmentStatuses = ['Zainstalowana', 'Zakupiona', 'W subskrypcji', 'Planowana'];
    const getAccountInfo = (id) => allAccounts.find(acc => acc.id === id);

    return (
        <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
            <DialogSurface>
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <DialogBody className={styles.dialogBody}>
                        <DialogTitle>{initialData ? 'Edytuj grę' : 'Dodaj grę do biblioteki'}</DialogTitle>
                        
                        <div className={styles.formGrid}>
                            <Field label="Nazwa gry" required className={styles.fullWidth}>
                                <Input name="name" value={formData.name || ''} onChange={handleChange} />
                            </Field>
                            <Field label="URL do grafiki/okładki">
                                <Input name="imageUrl" value={formData.imageUrl || ''} onChange={handleChange} />
                            </Field>
                            {/* NOWE POLE: Ilość graczy */}
                            <Field label="Ilość graczy (np. 1-4)">
                                <Input name="playerCount" value={formData.playerCount || ''} onChange={handleChange} />
                            </Field>
                             <Field label="Gatunek (wpisz nowy, użyj ',' lub 'Enter' aby dodać)" className={styles.fullWidth}>
                                <TagPicker 
                                    onOptionSelect={handleGenreSelect} 
                                    selectedOptions={formData.genres}
                                >
                                    <TagPickerControl>
                                        <TagPickerGroup>
                                            {formData.genres.map(option => <Tag key={option} value={option}>{option}</Tag>)}
                                        </TagPickerGroup>
                                        <TagPickerInput 
                                            placeholder="Dodaj gatunek..."
                                            value={genreInput}
                                            onChange={(e) => setGenreInput(e.target.value)}
                                            onKeyDown={handleGenreKeyDown}
                                        />
                                    </TagPickerControl>
                                    <TagPickerList>
                                        {availableGenres
                                            .filter(opt => !formData.genres.includes(opt))
                                            .map(opt => <TagPickerOption value={opt} key={opt}>{opt}</TagPickerOption>)}
                                    </TagPickerList>
                                </TagPicker>
                            </Field>
                            
                            {/* NOWE POLE WARUNKOWE */}
                            {formData.genres.includes('Wyścigowe') && (
                                <div className={styles.fullWidth}>
                                    <Switch 
                                        label="Obsługuje kierownicę"
                                        checked={formData.supportsSteeringWheel || false}
                                        onChange={(_, data) => handleSwitchChange('supportsSteeringWheel', data.checked)}
                                    />
                                </div>
                            )}

                            <div className={styles.fullWidth}>
                                <label className="mb-2 block font-semibold">Przypisania do kont</label>
                                <div className={styles.assignmentSection}>
                                    <Dropdown 
                                        className={styles.autoWidthDropdown}
                                        placeholder="Wybierz konto" 
                                        onOptionSelect={(_,d) => setCurrentAccountId(d.optionValue)}
                                        button={
                                            <div className={styles.optionWithIcon}>
                                                {getAccountTypeIcon(getAccountInfo(currentAccountId)?.accountType)}
                                                <span>{getAccountInfo(currentAccountId)?.email || 'Wybierz konto'}</span>
                                            </div>
                                        }
                                    >
                                        {allAccounts.map(acc => (
                                            <Option key={acc.id} value={acc.id}>
                                                <div className={styles.optionWithIcon}>
                                                    {getAccountTypeIcon(acc.accountType)}
                                                    <span>{acc.email}</span>
                                                </div>
                                            </Option>
                                        ))}
                                    </Dropdown>
                                     <Dropdown 
                                        className={styles.autoWidthDropdown}
                                        placeholder="Wybierz status" 
                                        value={currentStatus}
                                        onOptionSelect={(_,d) => setCurrentStatus(d.optionValue)}
                                    >
                                        {assignmentStatuses.map(s => <Option key={s} value={s}>{s}</Option>)}
                                    </Dropdown>
                                    <Tooltip content="Dodaj przypisanie" relationship="label">
                                        <Button icon={<Add24Regular />} onClick={handleAddAssignment} />
                                    </Tooltip>
                                </div>
                                <div className={styles.assignmentsList}>
                                    {formData.assignments.map(assign => {
                                        const accountInfo = getAccountInfo(assign.accountId);
                                        return (
                                            <div key={assign.accountId} className={styles.assignmentItem}>
                                                <div className={styles.optionWithIcon}>
                                                    {getAccountTypeIcon(accountInfo?.accountType)}
                                                    <div>
                                                        <span className="font-semibold">{accountInfo?.email || 'Nieznane konto'}</span>
                                                        <span className="text-gray-500 text-sm"> - {assign.status}</span>
                                                    </div>
                                                </div>
                                                <Button 
                                                    icon={<Dismiss16Regular />} 
                                                    appearance="subtle" 
                                                    onClick={() => handleRemoveAssignment(assign.accountId)}
                                                    aria-label="Usuń przypisanie"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </DialogBody>
                    <DialogActions>
                        <Button appearance="secondary" onClick={onClose}>Anuluj</Button>
                        <Button type="submit" appearance="primary" disabled={isSaving}>Zapisz</Button>
                    </DialogActions>
                </form>
            </DialogSurface>
        </Dialog>
    );
}
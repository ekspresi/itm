import React, { useState, useEffect, useMemo } from 'react'; // <-- Dodajemy useMemo
import { 
    Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, Button, Input, Field,
    Dropdown, Option, Switch, Textarea,
    makeStyles, tokens
} from "@fluentui/react-components";
import { db, firebaseApi } from '../../../lib/firebase';

const useStyles = makeStyles({
    dialogBody: { 
        display: 'flex', 
        flexDirection: 'column', 
        gap: tokens.spacingVerticalL 
    },
    formGrid: { 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: tokens.spacingVerticalL,
        marginBottom: tokens.spacingVerticalL,
    },
    fullWidth: { 
        gridColumnStart: 1, 
        gridColumnEnd: 3 
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

export default function AccountModal({ isOpen, onClose, initialData, allEquipment }) {
    const styles = useStyles();
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                accountType: '', email: '', password: '', nickname: '', 
                assignedEquipmentId: '', hasSubscription: false, subscriptionEndDate: '',
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSelectChange = (fieldName, data) => {
        setFormData(prev => ({ ...prev, [fieldName]: data.optionValue }));
    };

    const handleSwitchChange = (fieldName, checked) => {
        setFormData(prev => ({...prev, [fieldName]: checked}));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const dataToSave = { ...formData };
            if (!dataToSave.hasSubscription) {
                dataToSave.subscriptionEndDate = '';
            }
            const collectionRef = db.collection(firebaseApi._getFullPath('accounts'));
            let docRef;

            if (dataToSave.id) {
                docRef = collectionRef.doc(dataToSave.id);
            } else {
                docRef = collectionRef.doc();
                dataToSave.id = docRef.id;
            }
            
            await docRef.set(dataToSave, { merge: true });
            onClose();

        } catch (error) {
            console.error("Błąd zapisu konta:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const accountTypes = ['Steam', 'Xbox', 'PlayStation', 'Epic Games', 'Ubisoft Connect', 'Inne'];
    
    const formatEquipmentName = (eq) => {
        return eq ? `${eq.name}${eq.number ? ` #${eq.number}` : ''}` : '';
    };

    // ZMIANA: Filtrowanie i grupowanie listy sprzętu
    const groupedEquipmentOptions = useMemo(() => {
        const categories = {
            console: 'Konsole',
            pc: 'Komputery',
            vr: 'VR',
        };
        const filtered = allEquipment.filter(eq => categories[eq.type]);
        
        return Object.keys(categories).reduce((acc, key) => {
            const items = filtered.filter(eq => eq.type === key);
            if (items.length > 0) {
                acc.push({ isHeader: true, text: categories[key] });
                items.forEach(item => acc.push({ isHeader: false, ...item }));
            }
            return acc;
        }, []);
    }, [allEquipment]);

    return (
        <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
            <DialogSurface>
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <DialogBody className={styles.dialogBody}>
                        <DialogTitle>{initialData ? 'Edytuj konto' : 'Dodaj nowe konto'}</DialogTitle>
                        
                        <div className={styles.formGrid}>
                            <Field label="Typ konta" className={styles.fullWidth}>
                                <Dropdown
                                    placeholder="Wybierz typ"
                                    // ZMIANA: Renderowanie wartości z ikoną
                                    value={formData.accountType ? `${formData.accountType}` : ''}
                                    onOptionSelect={(e, data) => handleSelectChange('accountType', data)}
                                    button={
                                        <div className={styles.optionWithIcon}>
                                            {getAccountTypeIcon(formData.accountType)}
                                            <span>{formData.accountType || 'Wybierz typ'}</span>
                                        </div>
                                    }
                                >
                                    {accountTypes.map(type => (
                                        <Option key={type} value={type}>
                                            <div className={styles.optionWithIcon}>
                                                {getAccountTypeIcon(type)}
                                                <span>{type}</span>
                                            </div>
                                        </Option>
                                    ))}
                                </Dropdown>
                            </Field>

                            <Field label="Adres e-mail" required>
                                <Input name="email" type="email" value={formData.email || ''} onChange={handleChange} />
                            </Field>
                            <Field label="Hasło" required>
                                <Input name="password" type="text" value={formData.password || ''} onChange={handleChange} />
                            </Field>

                            <Field label="Nazwa użytkownika">
                                <Input name="nickname" value={formData.nickname || ''} onChange={handleChange} />
                            </Field>
                            <Field label="Przypisany sprzęt">
                                <Dropdown
                                    placeholder="Wybierz sprzęt"
                                    value={formatEquipmentName(allEquipment.find(eq => eq.id === formData.assignedEquipmentId))}
                                    onOptionSelect={(e, data) => handleSelectChange('assignedEquipmentId', data)}
                                >
                                    <Option value="">Brak przypisania</Option>
                                    {/* ZMIANA: Renderowanie pogrupowanej listy */}
                                    {groupedEquipmentOptions.map((item, index) => 
                                        item.isHeader ? (
                                            <Option key={`header-${index}`} disabled style={{ fontWeight: 'bold', fontStyle: 'italic', marginTop: index > 0 ? '10px' : '0' }}>
                                                {item.text}
                                            </Option>
                                        ) : (
                                            <Option key={item.id} value={item.id}>
                                                {formatEquipmentName(item)}
                                            </Option>
                                        )
                                    )}
                                </Dropdown>
                            </Field>
                            
                            <div className={`${styles.fullWidth} flex flex-col gap-4`}>
                                <Switch 
                                    label="Posiada aktywną subskrypcję"
                                    checked={formData.hasSubscription || false}
                                    onChange={(_, data) => handleSwitchChange('hasSubscription', data.checked)}
                                />
                                {formData.hasSubscription && (
                                     <Field label="Ważność subskrypcji">
                                        <Input name="subscriptionEndDate" type="date" value={formData.subscriptionEndDate || ''} onChange={handleChange} />
                                    </Field>
                                )}
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
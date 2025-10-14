import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, Button, Input, Field,
    Dropdown, Option, Textarea, // <-- Dodajemy Textarea
    makeStyles, tokens
} from "@fluentui/react-components";
// NOWE IKONY
import { Router20Regular, Briefcase20Regular } from "@fluentui/react-icons";
import { db, firebaseApi } from '../../../lib/firebase';

const useStyles = makeStyles({
    dialogBody: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalL,
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: tokens.spacingVerticalL,
    },
    fullWidth: {
        gridColumnStart: 1,
        gridColumnEnd: 3,
    },
});

export default function EquipmentModal({ isOpen, onClose, initialData }) {
    const styles = useStyles();
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                name: '', number: '', type: 'console', purchasePrice: '',
                purchaseDate: '', owner: 'Centrum Kultury', imageUrl: '',
                condition: 'Sprawny', // Zmieniono domyślny stan
                notes: '', // Dodano notatki
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

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const dataToSave = { ...formData };
            delete dataToSave.theme; 
            
            const collectionRef = db.collection(firebaseApi._getFullPath('gamingEquipment'));
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
            console.error("Błąd zapisu sprzętu:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // ZMIANA: Dodano nowe kategorie
    const equipmentTypes = [
        { key: 'console', text: 'Konsola' }, { key: 'pc', text: 'Komputer' },
        { key: 'vr', text: 'VR' }, { key: 'controller', text: 'Kontroler' },
        { key: 'monitor', text: 'Monitor' }, { key: 'router', text: 'Router' },
        { key: 'case', text: 'Torba, etui, skrzynia' }, { key: 'accessory', text: 'Akcesorium' },
    ];
    
    // ZMIANA: Zaktualizowano stany
    const conditions = ['Sprawny', 'Uszkodzony', 'Planowany'];


    return (
        <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
            <DialogSurface>
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <DialogBody className={styles.dialogBody}>
                        <DialogTitle>{initialData ? 'Edytuj sprzęt' : 'Dodaj nowy sprzęt'}</DialogTitle>
                        
                        <div className={styles.formGrid}>
                            <Field label="Nazwa sprzętu" required>
                                <Input name="name" value={formData.name || ''} onChange={handleChange} />
                            </Field>
                            <Field label="Numer">
                                <Input name="number" value={formData.number || ''} onChange={handleChange} />
                            </Field>

                            <Field label="Typ sprzętu">
                                <Dropdown
                                    placeholder="Wybierz typ"
                                    value={equipmentTypes.find(t => t.key === formData.type)?.text || ''}
                                    onOptionSelect={(e, data) => handleSelectChange('type', data)}
                                >
                                    {equipmentTypes.map((type) => (
                                        <Option key={type.key} value={type.key}>
                                            {type.text}
                                        </Option>
                                    ))}
                                </Dropdown>
                            </Field>
                            <Field label="Adres URL grafiki">
                                <Input name="imageUrl" value={formData.imageUrl || ''} onChange={handleChange} />
                            </Field>

                            <Field label="Stan sprzętu">
                                <Dropdown
                                    placeholder="Wybierz stan"
                                    value={formData.condition || ''}
                                    onOptionSelect={(e, data) => handleSelectChange('condition', data)}
                                >
                                    {conditions.map((c) => <Option key={c} value={c}>{c}</Option>)}
                                </Dropdown>
                            </Field>
                             <Field label="Własność">
                                <Dropdown
                                    value={formData.owner || ''}
                                    onOptionSelect={(e, data) => handleSelectChange('owner', data)}
                                >
                                    <Option value="Centrum Kultury">Centrum Kultury</Option>
                                    <Option value="Prywatny">Prywatny</Option>
                                </Dropdown>
                            </Field>

                            <Field label="Cena zakupu">
                                <Input name="purchasePrice" type="number" value={formData.purchasePrice || ''} onChange={handleChange} />
                            </Field>
                            <Field label="Data zakupu">
                                <Input name="purchaseDate" type="date" value={formData.purchaseDate || ''} onChange={handleChange} />
                            </Field>

                            {/* NOWE POLE NOTATEK */}
                            <div className={styles.fullWidth}>
                                <Field label="Notatki">
                                    <Textarea name="notes" value={formData.notes || ''} onChange={handleChange} resize="vertical" />
                                </Field>
                            </div>
                        </div>
                    </DialogBody>
                    <DialogActions>
                        <Button appearance="secondary" onClick={onClose}>Anuluj</Button>
                        <Button type="submit" appearance="primary" disabled={isSaving}>
                            {isSaving ? 'Zapisywanie...' : 'Zapisz'}
                        </Button>
                    </DialogActions>
                </form>
            </DialogSurface>
        </Dialog>
    );
}
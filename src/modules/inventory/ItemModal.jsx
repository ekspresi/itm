import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogSurface, DialogTitle, DialogBody, DialogContent, DialogActions,
    Button, Input, Label, Field, Dropdown, Option, Textarea, makeStyles,
} from "@fluentui/react-components";

const useStyles = makeStyles({
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
});

const initialItemState = {
    name: '',
    inventoryNumber: '',
    purchaseDate: '',
    purchaseValue: 0,
    currentLocationId: '',
    notes: '',
    status: 'w użyciu',
};

export default function ItemModal({ isOpen, onClose, onSave, editingItem, locations }) {
    const styles = useStyles();
    const [itemData, setItemData] = useState(initialItemState);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setItemData(editingItem ? { ...initialItemState, ...editingItem } : initialItemState);
        }
    }, [isOpen, editingItem]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setItemData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!itemData.name || !itemData.currentLocationId) {
            alert('Nazwa przedmiotu i lokalizacja są wymagane.');
            return;
        }
        setIsLoading(true);
        const success = await onSave({ 
            ...itemData, 
            purchaseValue: parseFloat(itemData.purchaseValue) || 0 
        });
        setIsLoading(false);
        if (success) {
            onClose();
        } else {
            alert('Wystąpił błąd podczas zapisu.');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
            <DialogSurface>
                <DialogBody>
                    <DialogTitle>{editingItem ? "Edytuj przedmiot" : "Dodaj nowy przedmiot"}</DialogTitle>
                    <DialogContent>
                        <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr' }}>
                           <Field label="Nazwa przedmiotu *" required>
                                <Input name="name" value={itemData.name} onChange={handleChange} />
                            </Field>
                        </div>
                        <div className={styles.formGrid}>
                            <Field label="Numer inwentarzowy">
                                <Input name="inventoryNumber" value={itemData.inventoryNumber} onChange={handleChange} />
                            </Field>
                             <Field label="Lokalizacja *" required>
                                <Dropdown 
                                    value={locations.find(l => l.id === itemData.currentLocationId)?.name || ''}
                                    onOptionSelect={(_, data) => setItemData(prev => ({...prev, currentLocationId: data.optionValue}))}
                                >
                                    {locations.map(loc => (
                                        <Option key={loc.id} value={loc.id}>{loc.name}</Option>
                                    ))}
                                </Dropdown>
                            </Field>
                        </div>
                         <div className={styles.formGrid}>
                            <Field label="Data zakupu">
                                <Input type="date" name="purchaseDate" value={itemData.purchaseDate} onChange={handleChange} />
                            </Field>
                            <Field label="Wartość zakupu (PLN)">
                                <Input type="number" name="purchaseValue" value={itemData.purchaseValue} onChange={handleChange} />
                            </Field>
                        </div>
                        <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr' }}>
                            <Field label="Notatki">
                                <Textarea name="notes" value={itemData.notes} onChange={handleChange} resize="vertical" />
                            </Field>
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <Button appearance="secondary" onClick={onClose} disabled={isLoading}>Anuluj</Button>
                        <Button appearance="primary" onClick={handleSave} disabled={isLoading}>
                            {isLoading ? 'Zapisywanie...' : 'Zapisz'}
                        </Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}
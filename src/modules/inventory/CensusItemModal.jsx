import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogSurface, DialogTitle, DialogBody, DialogContent, DialogActions,
    Button, Input, Field,
} from "@fluentui/react-components";

const initialState = {
    name: '',
    unit: 'szt.',
    quantityFound: 1,
    pricePerUnit: 0,
};

export default function CensusItemModal({ isOpen, onClose, onSave, editingItem }) {
    const [itemData, setItemData] = useState(initialState);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Jeśli edytujemy, załaduj dane. Jeśli nie, użyj stanu początkowego.
            setItemData(editingItem ? { ...editingItem } : initialState);
        }
    }, [isOpen, editingItem]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setItemData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!itemData.name) return alert('Nazwa jest wymagana.');
        setIsLoading(true);
        // Przekazujemy pełny obiekt (z ID, jeśli istnieje) do funkcji zapisu
        const success = await onSave({
            ...itemData,
            quantityFound: parseInt(itemData.quantityFound, 10) || 0,
            pricePerUnit: parseFloat(itemData.pricePerUnit) || 0,
        });
        setIsLoading(false);
        if (success) onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
            <DialogSurface>
                <DialogBody>
                    <DialogTitle>{editingItem ? "Edytuj pozycję spisu" : "Dodaj pozycję do spisu"}</DialogTitle>
                    <DialogContent className="flex flex-col gap-4">
                        <Field label="Nazwa przedmiotu *" required>
                            <Input name="name" value={itemData.name} onChange={handleChange} />
                        </Field>
                        <div className="grid grid-cols-3 gap-4">
                             <Field label="Ilość *" required>
                                <Input type="number" name="quantityFound" value={itemData.quantityFound} onChange={handleChange} />
                            </Field>
                             <Field label="Jednostka">
                                <Input name="unit" value={itemData.unit} onChange={handleChange} />
                            </Field>
                             <Field label="Cena jedn. (PLN)">
                                <Input type="number" name="pricePerUnit" value={itemData.pricePerUnit} onChange={handleChange} />
                            </Field>
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <Button appearance="secondary" onClick={onClose} disabled={isLoading}>Anuluj</Button>
                        <Button appearance="primary" onClick={handleSave} disabled={isLoading}>Zapisz</Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}
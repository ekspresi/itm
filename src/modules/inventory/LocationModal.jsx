import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogSurface, DialogTitle, DialogBody, DialogContent, DialogActions,
    Button, Input, Label, Field,
} from "@fluentui/react-components";

const initialLocationState = {
    name: '',
    personResponsible: '',
};

export default function LocationModal({ isOpen, onClose, onSave, editingLocation }) {
    const [locationData, setLocationData] = useState(initialLocationState);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLocationData(editingLocation ? { ...editingLocation } : initialLocationState);
        }
    }, [isOpen, editingLocation]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLocationData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!locationData.name) {
            alert('Nazwa lokalizacji jest wymagana.');
            return;
        }
        setIsLoading(true);
        const success = await onSave(locationData);
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
                    <DialogTitle>{editingLocation ? "Edytuj lokalizację" : "Dodaj nową lokalizację"}</DialogTitle>
                    <DialogContent>
                        <div className="flex flex-col gap-4">
                            <Field label="Nazwa lokalizacji/kategorii *" required>
                                <Input name="name" value={locationData.name} onChange={handleChange} />
                            </Field>
                            <Field label="Osoba materialnie odpowiedzialna">
                                <Input name="personResponsible" value={locationData.personResponsible} onChange={handleChange} />
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
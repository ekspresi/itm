import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogSurface, DialogTitle, DialogBody, DialogContent, DialogActions,
    Button, Input, Label, Field
} from "@fluentui/react-components";

export default function RoomModal({ isOpen, onClose, onSave, isLoading, editingRoom }) {
    const [roomData, setRoomData] = useState({ numer: '', nazwa: '' });
    const [validationError, setValidationError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setRoomData(editingRoom ? { ...editingRoom } : { numer: '', nazwa: '' });
            setValidationError('');
        }
    }, [isOpen, editingRoom]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setRoomData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        if (!roomData.nazwa.trim()) {
            setValidationError('Nazwa sali jest wymagana.');
            return;
        }
        onSave(roomData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
            <DialogSurface>
                <DialogBody>
                    <DialogTitle>{editingRoom ? "Edytuj salę" : "Dodaj nową salę"}</DialogTitle>
                    <DialogContent className="flex flex-col gap-4">
                        <Field label="Numer sali" hint="np. 1.12 lub Piwnica">
                            <Input id="numer" name="numer" value={roomData.numer} onChange={handleChange} />
                        </Field>
                        <Field label="Nazwa sali" required>
                            <Input id="nazwa" name="nazwa" value={roomData.nazwa} onChange={handleChange} />
                        </Field>
                        {validationError && <p className="text-red-500 text-sm text-center">{validationError}</p>}
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
};
import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogSurface, DialogTitle, DialogBody, DialogContent, DialogActions,
    Button, Input, Field, Dropdown, Option, Switch, makeStyles, tokens
} from "@fluentui/react-components";

const useStyles = makeStyles({
    formGrid: { display: 'grid', gap: '16px' },
    twoColumnGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    fullWidth: { width: '100%' },
});

export default function EventModal({ isOpen, onClose, onSave, isLoading, editingEvent, rooms, onCheckConflict }) {
    const styles = useStyles();
    const initialEventState = { nazwa: '', data: new Date().toISOString().slice(0, 10), godzinaOd: '', godzinaDo: '', salaId: '', organizator: '', platne: false, publiczne: true };
    const [eventData, setEventData] = useState(initialEventState);
    const [validationError, setValidationError] = useState('');

    useEffect(() => {
        if (isOpen) {
            const dataToSet = editingEvent ? { ...initialEventState, ...editingEvent } : initialEventState;
            if (!dataToSet.salaId && rooms.length > 0) {
                dataToSet.salaId = rooms[0].id;
            }
            setEventData(dataToSet);
            setValidationError('');
        }
    }, [isOpen, editingEvent, rooms]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEventData(prev => ({ ...prev, [name]: value }));
    };

const handleSave = async () => {
    if (!eventData.nazwa.trim() || !eventData.data || !eventData.salaId) {
        setValidationError('Pola z gwiazdką (*) są wymagane.');
        return;
    }
    const conflict = await onCheckConflict(eventData);
    let canSave = true;

    if (conflict) {
        canSave = window.confirm(`UWAGA: W tym terminie odbywają się zajęcia "${conflict.nazwa}". Zapisanie wydarzenia spowoduje odwołanie tych zajęć w dniu ${eventData.data}.\n\nCzy chcesz kontynuować?`);
    }

    if (canSave) {
        const wasSuccess = await onSave(eventData, conflict);
        // Zamykamy modal tylko jeśli zapis się powiódł
        if (wasSuccess) {
            onClose();
        }
    }
};

    return (
        <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
            <DialogSurface>
                <DialogBody>
                    <DialogTitle>{editingEvent ? "Edytuj wydarzenie" : "Dodaj nowe wydarzenie"}</DialogTitle>
                    <DialogContent className={styles.formGrid}>
                        <Field label="Nazwa wydarzenia *" required>
                            <Input name="nazwa" value={eventData.nazwa} onChange={handleChange} />
                        </Field>
                        <Field label="Data wydarzenia *" required>
                            <Input type="date" name="data" value={eventData.data} onChange={handleChange} />
                        </Field>
                        <div className={styles.twoColumnGrid}>
                            <Field label="Godzina od">
                                <Input type="time" name="godzinaOd" value={eventData.godzinaOd} onChange={handleChange} />
                            </Field>
                            <Field label="Godzina do">
                                <Input type="time" name="godzinaDo" value={eventData.godzinaDo} onChange={handleChange} />
                            </Field>
                        </div>
                        <Field label="Sala *" required>
                            <Dropdown
                                name="salaId"
                                value={rooms.find(r => r.id === eventData.salaId)?.nazwa || ''}
                                onOptionSelect={(_, data) => data.optionValue && setEventData(prev => ({ ...prev, salaId: data.optionValue }))}
                            >
                                {rooms.map(room => <Option key={room.id} value={room.id}>{`${room.nazwa} (${room.numer || 'b/n'})`}</Option>)}
                            </Dropdown>
                        </Field>
                        <Field label="Organizator">
                            <Input name="organizator" value={eventData.organizator} onChange={handleChange} />
                        </Field>
                        <div className={styles.twoColumnGrid}>
                            <Switch label="Płatne" checked={eventData.platne} onChange={(_, data) => setEventData(prev => ({ ...prev, platne: data.checked }))} />
                            <Switch label="Publiczne" checked={eventData.publiczne} onChange={(_, data) => setEventData(prev => ({ ...prev, publiczne: data.checked }))} />
                        </div>
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
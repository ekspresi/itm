import React, { useState, useEffect } from 'react';
import { Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, Button, Input, Field } from "@fluentui/react-components";
import { db, firebaseApi } from '../../../lib/firebase'; // <--- Poprawiony import

export default function ParticipantModal({ isOpen, onClose, initialData }) {
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                firstName: '',
                lastName: '',
                group: '',
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const dataToSave = { ...formData };
            // Poprawiona składnia
            const collectionRef = db.collection(firebaseApi._getFullPath('participants'));
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
            console.error("Błąd zapisu uczestnika:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
            <DialogSurface>
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <DialogBody>
                        <DialogTitle>{initialData ? 'Edytuj dane uczestnika' : 'Dodaj nowego uczestnika'}</DialogTitle>
                        
                        <div className="flex flex-col gap-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                               <Field label="Imię" required>
                                    <Input name="firstName" value={formData.firstName || ''} onChange={handleChange} />
                                </Field>
                                <Field label="Nazwisko">
                                    <Input name="lastName" value={formData.lastName || ''} onChange={handleChange} />
                                </Field>
                            </div>
                            <Field label="Grupa (np. Wtorek 16:00 lub nazwa własna)">
                                <Input name="group" value={formData.group || ''} onChange={handleChange} />
                            </Field>
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
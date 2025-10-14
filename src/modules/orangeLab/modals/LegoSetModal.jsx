import React, { useState, useEffect } from 'react';
import { Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, Button, Input, Field, RadioGroup, Radio } from "@fluentui/react-components";
import { db, firebaseApi } from '../../../lib/firebase';

export default function LegoSetModal({ isOpen, onClose, initialData }) {
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            // Dodajemy 'pieceCount' do domyślnego stanu
            setFormData({
                name: '', number: '', series: '', pieceCount: '', age: '', purchasePrice: '',
                purchaseDate: '', owner: 'Centrum Kultury', imageUrl: '',
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleOwnerChange = (_, data) => {
        setFormData(prev => ({ ...prev, owner: data.value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const dataToSave = { ...formData };
            const collectionRef = db.collection(firebaseApi._getFullPath('legoSets'));
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
            console.error("Błąd zapisu zestawu LEGO:", error);
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
            <DialogSurface>
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <DialogBody>
                        <DialogTitle>{initialData ? 'Edytuj zestaw LEGO' : 'Dodaj nowy zestaw LEGO'}</DialogTitle>
                        
                        <div className="flex flex-col gap-4 pt-4 mb-4">
                            <Field label="Nazwa zestawu" required>
                                <Input name="name" value={formData.name || ''} onChange={handleChange} />
                            </Field>

                            <Field label="URL do grafiki">
                                <Input name="imageUrl" value={formData.imageUrl || ''} onChange={handleChange} />
                            </Field>

                            {/* Zmieniamy siatkę na 3-kolumnową i dodajemy nowe pole */}
                            <div className="grid grid-cols-3 gap-4">
                               <Field label="Numer zestawu">
                                    <Input name="number" value={formData.number || ''} onChange={handleChange} />
                                </Field>
                                <Field label="Seria">
                                    <Input name="series" value={formData.series || ''} onChange={handleChange} />
                                </Field>
                                <Field label="Liczba elementów">
                                    <Input name="pieceCount" type="number" value={formData.pieceCount || ''} onChange={handleChange} />
                                </Field>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Cena zakupu">
                                    <Input name="purchasePrice" type="number" value={formData.purchasePrice || ''} onChange={handleChange} />
                                </Field>
                                <Field label="Data zakupu">
                                    <Input name="purchaseDate" type="date" value={formData.purchaseDate || ''} onChange={handleChange} />
                                </Field>
                            </div>
                            
                            <Field label="Własność">
                                <RadioGroup value={formData.owner} onChange={handleOwnerChange} layout="horizontal">
                                    <Radio value="Centrum Kultury" label="Centrum Kultury" />
                                    <Radio value="prywatna" label="Prywatna" />
                                </RadioGroup>
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
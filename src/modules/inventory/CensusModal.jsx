import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog, DialogSurface, DialogTitle, DialogBody, DialogContent, DialogActions,
    Button, Input, Label, Field, Dropdown, Option, Textarea, // Dodano Textarea
} from "@fluentui/react-components";

const initialState = {
    year: new Date().getFullYear(),
    locationId: null,
    committee: [],
    startDate: '',
    endDate: '',
};

export default function CensusModal({ isOpen, onClose, onSave, locations, existingCensuses, editingCensus }) {
    const [censusData, setCensusData] = useState(initialState);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Jeśli edytujemy, załaduj dane. Jeśli tworzymy, użyj stanu początkowego.
            if (editingCensus) {
                setCensusData({
                    ...initialState,
                    ...editingCensus,
                    committee: Array.isArray(editingCensus.committee) ? editingCensus.committee.join('\n') : '',
                });
            } else {
                setCensusData(initialState);
            }
        }
    }, [isOpen, editingCensus]);
    
    // Filtrujemy lokalizacje, dla których już istnieje spis w danym roku
    const availableLocations = useMemo(() => {
        if (!locations) return [];
        const censusedLocationIds = (existingCensuses || [])
            .filter(c => c.year === censusData.year)
            .map(c => c.locationId);
        return locations.filter(loc => !censusedLocationIds.includes(loc.id));
    }, [locations, existingCensuses, year]);

     const handleSave = async () => {
        if (!editingCensus && (!censusData.year || !censusData.locationId)) {
            return alert('Rok i lokalizacja są wymagane.');
        }
        setIsLoading(true);
        const dataToSave = {
            ...censusData,
            committee: censusData.committee.split('\n').filter(name => name.trim() !== ''),
        };
        const success = await onSave(dataToSave);
        setIsLoading(false);
        if (success) onClose();
    };

    const isEditing = !!editingCensus;

    return (
        <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
            <DialogSurface>
                <DialogBody>
                    <DialogTitle>{isEditing ? "Zarządzaj danymi spisu" : "Rozpocznij nowy spis z natury"}</DialogTitle>
                    <DialogContent className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Rok spisu *" required>
                                <Input 
                                    type="number" 
                                    value={censusData.year} 
                                    onChange={(e) => setCensusData(p => ({...p, year: parseInt(e.target.value, 10)}))} 
                                    disabled={isEditing}
                                />
                            </Field>
                            <Field label="Lokalizacja *" required>
                                <Dropdown
                                    placeholder="Wybierz lokalizację"
                                    value={locations.find(l => l.id === censusData.locationId)?.name || ''}
                                    onOptionSelect={(_, data) => setCensusData(p => ({...p, locationId: data.optionValue}))}
                                    disabled={isEditing}
                                >
                                    {isEditing 
                                        ? locations.map(loc => (<Option key={loc.id} value={loc.id}>{loc.name}</Option>))
                                        : availableLocations.map(loc => (<Option key={loc.id} value={loc.id}>{loc.name}</Option>))
                                    }
                                </Dropdown>
                            </Field>
                        </div>
                        <Field label="Komisja inwentaryzacyjna (każda osoba w nowej linii)">
                            <Textarea 
                                resize="vertical"
                                value={censusData.committee}
                                onChange={(e) => setCensusData(p => ({...p, committee: e.target.value}))}
                            />
                        </Field>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Data rozpoczęcia">
                                <Input 
                                    type="datetime-local"
                                    value={censusData.startDate}
                                    onChange={(e) => setCensusData(p => ({...p, startDate: e.target.value}))}
                                />
                            </Field>
                            <Field label="Data zakończenia">
                                <Input 
                                    type="datetime-local"
                                    value={censusData.endDate}
                                    onChange={(e) => setCensusData(p => ({...p, endDate: e.target.value}))}
                                />
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
import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, Button, Input, Field,
    Dropdown, Option,
    TagPicker, TagPickerControl, TagPickerGroup, Tag, TagPickerInput, TagPickerList, TagPickerOption,
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
        gridTemplateColumns: '1fr',
        gap: tokens.spacingVerticalL,
        paddingTop: tokens.spacingVerticalL,
        marginBottom: tokens.spacingVerticalL,
    },
});

export default function StationModal({ isOpen, onClose, initialData, allEquipment, allStations }) {
    const styles = useStyles();
    const [name, setName] = useState('');
    const [primaryEquipmentId, setPrimaryEquipmentId] = useState('');
    const [selectedSecondaryIds, setSelectedSecondaryIds] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    // NOWA LOGIKA: Filtrujemy listy sprzętu, aby pokazać tylko dostępny
    const { availablePrimary, availableSecondary } = useMemo(() => {
        // 1. Stwórz zbiór wszystkich ID sprzętu, które są już użyte w INNYCH stanowiskach
        const usedIds = new Set();
        allStations.forEach(station => {
            // Jeśli edytujemy stanowisko, ignorujemy jego własny sprzęt
            if (initialData && station.id === initialData.id) {
                return;
            }
            (station.equipmentIds || []).forEach(id => usedIds.add(id));
        });

        // 2. Podziel cały dostępny sprzęt na kategorie
        const primary = [];
        const secondary = [];
        const primaryTypes = ['console', 'pc', 'vr'];
        allEquipment.forEach(eq => {
            if (primaryTypes.includes(eq.type)) {
                primary.push(eq);
            } else {
                secondary.push(eq);
            }
        });

        // 3. Zwróć tylko ten sprzęt, który nie jest na liście "użytych"
        return {
            availablePrimary: primary.filter(eq => !usedIds.has(eq.id)),
            availableSecondary: secondary.filter(eq => !usedIds.has(eq.id)),
        };
    }, [allEquipment, allStations, initialData]);


    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name || '');
                const primary = allEquipment.find(eq => (initialData.equipmentIds || []).includes(eq.id) && ['console', 'pc', 'vr'].includes(eq.type));
                const secondary = (initialData.equipmentIds || []).filter(id => id !== primary?.id);
                
                setPrimaryEquipmentId(primary?.id || '');
                setSelectedSecondaryIds(secondary);
            } else {
                setName('');
                setPrimaryEquipmentId('');
                setSelectedSecondaryIds([]);
            }
        }
    }, [isOpen, initialData, allEquipment]);
    
    const formatEquipmentName = (eq) => eq ? `${eq.name}${eq.number ? ` #${eq.number}` : ''}` : '';

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const equipmentIds = [primaryEquipmentId, ...selectedSecondaryIds].filter(Boolean);
            const dataToSave = { name, equipmentIds };
            
            const collectionRef = db.collection(firebaseApi._getFullPath('stations'));
            let docRef;

            if (initialData?.id) {
                docRef = collectionRef.doc(initialData.id);
            } else {
                docRef = collectionRef.doc();
                dataToSave.id = docRef.id;
            }
            
            await docRef.set(dataToSave, { merge: true });
            onClose();
        } catch (error) {
            console.error("Błąd zapisu stanowiska:", error);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDelete = async () => {
        if(initialData?.id && window.confirm('Czy na pewno chcesz usunąć to stanowisko?')){
             setIsSaving(true);
             try {
                await db.collection(firebaseApi._getFullPath('stations')).doc(initialData.id).delete();
                onClose();
             } catch(e) { console.error(e); }
             finally { setIsSaving(false); }
        }
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
            <DialogSurface>
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <DialogBody className={styles.dialogBody}>
                        <DialogTitle>{initialData ? 'Edytuj stanowisko' : 'Utwórz nowe stanowisko'}</DialogTitle>
                        
                        <div className={styles.formGrid}>
                            <Field label="Nazwa stanowiska (np. Stanowisko VR)" required>
                                <Input value={name} onChange={(_, data) => setName(data.value)} />
                            </Field>
                            <Field label="Wybierz sprzęt główny">
                                <Dropdown
                                    placeholder="Wybierz konsolę, PC lub VR"
                                    value={formatEquipmentName(allEquipment.find(eq => eq.id === primaryEquipmentId))}
                                    onOptionSelect={(_, data) => setPrimaryEquipmentId(data.optionValue)}
                                >
                                    {/* Używamy przefiltrowanej listy */}
                                    {availablePrimary.map(eq => (
                                        <Option key={eq.id} value={eq.id}>{formatEquipmentName(eq)}</Option>
                                    ))}
                                </Dropdown>
                            </Field>
                            <Field label="Dodaj inne sprzęty">
                                <TagPicker
                                    onOptionSelect={(_, data) => setSelectedSecondaryIds(data.selectedOptions)}
                                    selectedOptions={selectedSecondaryIds}
                                >
                                    <TagPickerControl>
                                        <TagPickerGroup>
                                            {selectedSecondaryIds.map(id => {
                                                const eq = allEquipment.find(e => e.id === id);
                                                return <Tag key={id} value={id}>{formatEquipmentName(eq)}</Tag>
                                            })}
                                        </TagPickerGroup>
                                        <TagPickerInput placeholder="Wybierz kontrolery, monitory itp." />
                                    </TagPickerControl>
                                    <TagPickerList>
                                        {/* Używamy przefiltrowanej listy */}
                                        {availableSecondary
                                            .filter(eq => !selectedSecondaryIds.includes(eq.id))
                                            .map(eq => (
                                                <TagPickerOption value={eq.id} key={eq.id}>
                                                    {formatEquipmentName(eq)}
                                                </TagPickerOption>
                                        ))}
                                    </TagPickerList>
                                </TagPicker>
                            </Field>
                        </div>
                    </DialogBody>
                    <DialogActions>
                        {initialData && <Button appearance="secondary" onClick={handleDelete} disabled={isSaving} style={{marginRight: "auto"}}>Usuń</Button>}
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
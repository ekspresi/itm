import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogSurface, DialogTitle, DialogBody, DialogContent, DialogActions,
    Button, Input, Label, Field, Dropdown, Option, Switch, makeStyles, tokens
} from "@fluentui/react-components";
import { Add24Regular, Dismiss24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
    formGrid: { display: 'grid', gap: '16px' },
    twoColumnGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    threeColumnGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', alignItems: 'flex-end' },
    terminGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', alignItems: 'flex-end' },
    fullWidth: { width: '100%' }
});

export default function ClassModal({ isOpen, onClose, onSave, isLoading, editingClass, rooms, schoolYear }) {
    const styles = useStyles();
    const ORGANIZERS = {
        CK: 'Centrum Kultury "Kłobuk"',
        MU3W: 'Mikołajski Uniwersytet III Wieku',
        INNY: 'Inny'
    };
    const initialClassState = { nazwa: '', salaId: '', prowadzacy: '', platne: false, organizator: ORGANIZERS.CK, organizatorInny: '', okresOd: '', okresDo: '', terminy: [] };
    const [classData, setClassData] = useState(initialClassState);
    const [validationError, setValidationError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (editingClass && rooms.length > 0) {
                const dataToSet = { ...initialClassState, ...editingClass };
                if (!dataToSet.organizator) dataToSet.organizator = ORGANIZERS.CK;
                if (!dataToSet.terminy || dataToSet.terminy.length === 0) {
                     dataToSet.terminy = [{id: Date.now(), dzienTygodnia: '1', godzinaOd: '', godzinaDo: ''}];
                }
                const classKey = `${editingClass.nazwa}-${editingClass.prowadzacy}`;
                setClassData(dataToSet);
            } else if (!editingClass) {
                 const newClassDefaults = { 
                    ...initialClassState, 
                    terminy: [{id: Date.now(), dzienTygodnia: '1', godzinaOd: '', godzinaDo: ''}],
                    rokSzkolny: schoolYear,
                    salaId: rooms.length > 0 ? rooms[0].id : '',
                };
                setClassData(newClassDefaults);
            }
            setValidationError('');
        } else {
            setClassData(initialClassState);
        }
    }, [isOpen, editingClass, rooms, schoolYear]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setClassData(prev => ({ ...prev, [name]: value }));
    };

    const handleDropdownChange = (name, value) => {
         setClassData(prev => ({ ...prev, [name]: value }));
    };

    const handleTerminChange = (index, field, value) => {
        const newTerminy = [...classData.terminy];
        newTerminy[index][field] = value;
        setClassData(prev => ({...prev, terminy: newTerminy}));
    };

    const addTermin = () => {
        const newTermin = {id: Date.now(), dzienTygodnia: '1', godzinaOd: '', godzinaDo: ''};
        setClassData(prev => ({...prev, terminy: [...prev.terminy, newTermin]}));
    };

    const removeTermin = (index) => {
        if (classData.terminy.length > 1) {
            const newTerminy = classData.terminy.filter((_, i) => i !== index);
            setClassData(prev => ({...prev, terminy: newTerminy}));
        }
    };

const handleSave = async () => { // <-- ZMIANA: dodajemy "async"
        if (!classData.nazwa.trim() || !classData.salaId) {
            setValidationError('Nazwa zajęć i sala są wymagane.'); return;
        }
         if (classData.terminy.some(t => !t.godzinaOd || !t.godzinaDo)) {
            setValidationError('Godziny rozpoczęcia i zakończenia są wymagane dla każdego terminu.'); return;
        }
        if (classData.organizator === ORGANIZERS.INNY && !classData.organizatorInny.trim()) {
            setValidationError('Proszę wpisać nazwę innego organizatora.'); return;
        }
        
        // ZMIANA: Czekamy na wynik zapisu i zamykamy modal tylko po sukcesie
        const isSuccess = await onSave(classData);
        if (isSuccess) {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
            <DialogSurface>
                <DialogBody>
                    <DialogTitle>{editingClass ? "Edytuj zajęcia" : `Dodaj nowe zajęcia (${schoolYear})`}</DialogTitle>
                    <DialogContent className={styles.formGrid}>
                        <div className={styles.threeColumnGrid}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <Field label="Nazwa zajęć *" required>
                                    <Input id="nazwa" name="nazwa" value={classData.nazwa} onChange={handleChange} className={styles.fullWidth} />
                                </Field>
                            </div>
                            <Field label="Sala *" required>
                                <Dropdown 
                                    name="salaId"
                                    className={styles.fullWidth} 
                                    value={rooms.find(r => r.id === classData.salaId)?.nazwa || ''} // Wyświetlamy nazwę
                                    onOptionSelect={(_, data) => data.optionValue && handleDropdownChange('salaId', data.optionValue)}
                                >
                                    {rooms.map(room => <Option key={room.id} value={room.id}>{`${room.nazwa} (${room.numer || 'b/n'})`}</Option>)}
                                </Dropdown>
                            </Field>
                        </div>
                        <div className={styles.threeColumnGrid}>
                            <Field label="Prowadzący">
                                <Input name="prowadzacy" value={classData.prowadzacy} onChange={handleChange} className={styles.fullWidth}/>
                            </Field>
                            <Field label="Organizator">
                                 <Dropdown 
                                    name="organizator" 
                                    className={styles.fullWidth} 
                                    value={classData.organizator} // <-- POPRAWKA: z selectedValue na value
                                    onOptionSelect={(_, data) => data.optionValue && handleDropdownChange('organizator', data.optionValue)}
                                >
                                    {Object.values(ORGANIZERS).map(org => <Option key={org} value={org}>{org}</Option>)}
                                </Dropdown>
                            </Field>
                        </div>
                        {classData.organizator === ORGANIZERS.INNY && (
                            <Field label="Wpisz nazwę organizatora" required>
                                <Input name="organizatorInny" value={classData.organizatorInny} onChange={handleChange} className={styles.fullWidth} />
                            </Field>
                        )}
                        <div className={styles.threeColumnGrid}>
                            <div className="flex items-end pb-1">
                                <Switch label="Płatne" checked={classData.platne} onChange={(_, data) => setClassData(prev => ({...prev, platne: data.checked}))} />
                            </div>
                            <Field label="Pierwsze zajęcia">
                                <Input type="date" name="okresOd" value={classData.okresOd} onChange={handleChange} className={styles.fullWidth} />
                            </Field>
                            <Field label="Ostatnie zajęcia">
                                <Input type="date" name="okresDo" value={classData.okresDo} onChange={handleChange} className={styles.fullWidth} />
                            </Field>
                        </div>
                        
                        <div className="border-t pt-4 space-y-2">
                            <Label required>Terminy</Label>
                            {(classData.terminy || []).map((termin, index) => (
                                <div key={termin.id || index} className={styles.terminGrid}>
<Dropdown 
    value={['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'][termin.dzienTygodnia]}
    onOptionSelect={(_, data) => data.optionValue && handleTerminChange(index, 'dzienTygodnia', data.optionValue)}
>
    <Option value="1">Poniedziałek</Option>
    <Option value="2">Wtorek</Option>
    <Option value="3">Środa</Option>
    <Option value="4">Czwartek</Option>
    <Option value="5">Piątek</Option>
    <Option value="6">Sobota</Option>
    <Option value="0">Niedziela</Option> {/* <-- ZMIANA WARTOŚCI */}
</Dropdown>
                                    <Input type="time" value={termin.godzinaOd} onChange={e => handleTerminChange(index, 'godzinaOd', e.target.value)} />
                                    <Input type="time" value={termin.godzinaDo} onChange={e => handleTerminChange(index, 'godzinaDo', e.target.value)} />
                                    <Button icon={<Dismiss24Regular />} appearance="subtle" onClick={() => removeTermin(index)} disabled={classData.terminy.length <= 1} />
                                </div>
                            ))}
                            <Button icon={<Add24Regular />} appearance="outline" onClick={addTermin} className={styles.fullWidth}>Dodaj kolejny termin</Button>
                        </div>
                        {validationError && <p className="text-red-500 text-sm text-center mt-4">{validationError}</p>}
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
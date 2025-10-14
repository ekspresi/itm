import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, Button, Input, Field, Combobox, Option,
    TagPicker, TagPickerControl, TagPickerGroup, Tag, TagPickerInput, TagPickerList, TagPickerOption, Avatar,
    Slider
} from "@fluentui/react-components";
import { db, firebaseApi } from '../../../lib/firebase';

export default function AssignSetModal({ isOpen, onClose, participants, legoSets, initialData }) {
    const [selectedParticipantNames, setSelectedParticipantNames] = useState([]); 
    const [selectedSet, setSelectedSet] = useState('');
    const [buildTime, setBuildTime] = useState('');
    const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);
    const [progressPercent, setProgressPercent] = useState(100);
    const [isSaving, setIsSaving] = useState(false);

    const getFullName = (p) => [p.firstName, p.lastName].filter(Boolean).join(' ');

    useEffect(() => {
        if (initialData) {
            const initialParticipants = participants.filter(p => initialData.participantIds.includes(p.id));
            setSelectedParticipantNames(initialParticipants.map(getFullName));
            setSelectedSet(initialData.legoSetId || '');
            setBuildTime(initialData.buildTime || '');
            setCompletionDate(initialData.completionDate || new Date().toISOString().split('T')[0]);
            setProgressPercent(initialData.progressPercent === undefined ? 100 : initialData.progressPercent);
        } else {
            setSelectedParticipantNames([]);
            setSelectedSet('');
            setBuildTime('');
            setCompletionDate(new Date().toISOString().split('T')[0]);
            setProgressPercent(100);
        }
    }, [initialData, participants, isOpen]); // Dodajemy isOpen, by resetować formularz przy każdym otwarciu
    

    const participantOptions = participants.map(getFullName);

    const onOptionSelect = (e, data) => {
        setSelectedParticipantNames(data.selectedOptions);
    };

    // ZMIANA: Funkcja nie jest już wołana przez 'onSubmit'
    const handleSave = async () => {
        if (selectedParticipantNames.length === 0 || !selectedSet) {
            alert('Proszę wybrać uczestników i zestaw.');
            return;
        }
        setIsSaving(true);
        try {
            const participantIds = selectedParticipantNames.map(name => {
                const participant = participants.find(p => getFullName(p) === name);
                return participant ? participant.id : null;
            }).filter(Boolean);

            const collectionRef = db.collection(firebaseApi._getFullPath('buildHistory'));
            let docRef;
            const dataToSave = {
                participantIds: participantIds,
                legoSetId: selectedSet,
                buildTime: parseInt(buildTime, 10) || 0,
                completionDate,
                progressPercent: progressPercent,
            };

            if (initialData?.id) {
                docRef = collectionRef.doc(initialData.id);
            } else {
                docRef = collectionRef.doc();
                dataToSave.id = docRef.id;
            }

            await docRef.set(dataToSave, { merge: true });
            onClose();

        } catch (error) {
            console.error("Błąd zapisu historii budowania:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
            <DialogSurface>
                {/* ZMIANA: Usunięto tag <form> */}
                <div>
                    <DialogBody>
                        <DialogTitle>{initialData ? 'Edytuj postęp budowania' : 'Zapisz postęp budowania'}</DialogTitle>
                        
                        <div className="flex flex-col gap-4 pt-4">
                           <Field label="Uczestnik lub para" required>
                                <TagPicker onOptionSelect={onOptionSelect} selectedOptions={selectedParticipantNames}>
                                    <TagPickerControl>
                                        <TagPickerGroup>
                                            {selectedParticipantNames.map((option) => (
                                                <Tag
                                                    key={option}
                                                    shape="rounded"
                                                    media={<Avatar aria-hidden name={option} color="colorful" />}
                                                    value={option}
                                                >
                                                    {option}
                                                </Tag>
                                            ))}
                                        </TagPickerGroup>
                                        <TagPickerInput placeholder="Wybierz uczestników" />
                                    </TagPickerControl>
                                    <TagPickerList>
                                        {participantOptions
                                        .filter((option) => !selectedParticipantNames.includes(option))
                                        .map((option) => (
                                            <TagPickerOption
                                                key={option}
                                                value={option}
                                                media={<Avatar aria-hidden name={option} color="colorful" />}
                                            >
                                            {option}
                                            </TagPickerOption>
                                        ))}
                                    </TagPickerList>
                                </TagPicker>
                            </Field>
                            <Field label="Zbudowany zestaw" required>
                                <Combobox
                                    selectedValue={legoSets.find(s => s.id === selectedSet)?.name}
                                    defaultSelectedOptions={initialData ? [initialData.legoSetId] : []}
                                    placeholder="Wybierz zestaw"
                                    onOptionSelect={(_, data) => setSelectedSet(data.optionValue)}
                                >
                                    {legoSets.map(set => (
                                        <Option key={set.id} value={set.id}>
                                            {set.name} ({set.number})
                                        </Option>
                                    ))}
                                </Combobox>
                            </Field>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Czas złożenia (w minutach)">
                                    <Input 
                                        type="number" 
                                        value={buildTime} 
                                        onChange={(_, data) => setBuildTime(data.value)} 
                                    />
                                </Field>
                                <Field label="Data (ostatniej aktualizacji)">
                                    <Input 
                                        type="date" 
                                        value={completionDate}
                                        onChange={(_, data) => setCompletionDate(data.value)}
                                    />
                                </Field>
                            </div>
                            <Field label={`Postęp ukończenia: ${progressPercent}%`}>
                                <Slider 
                                    min={0} 
                                    max={100} 
                                    step={5} 
                                    value={progressPercent} 
                                    onChange={(_, data) => setProgressPercent(data.value)} 
                                />
                            </Field>
                        </div>
                    </DialogBody>
                    <DialogActions>
                        <Button appearance="secondary" onClick={onClose}>Anuluj</Button>
                        {/* ZMIANA: Usunięto type="submit", dodano onClick={handleSave} */}
                        <Button appearance="primary" disabled={isSaving} onClick={handleSave}>
                            {isSaving ? 'Zapisywanie...' : 'Zapisz'}
                        </Button>
                    </DialogActions>
                </div>
            </DialogSurface>
        </Dialog>
    );
}
import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { SHARED_STYLES } from '../../lib/helpers';
import { WorkTimeEntryRow } from './WorkTimeComponents'; // Importujemy nasz komponent wiersza

export default function WorkTimeEntryModal({ isOpen, onClose, employees, onSave, editingData }) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [entries, setEntries] = useState([]);

    useEffect(() => {
        if (isOpen) {
            if (editingData) {
                setSelectedEmployee(editingData.employeeName);
                setEntries(editingData.entries.map(e => ({ ...e, tempId: e.id || Date.now() + Math.random() })));
            } else {
                setSelectedEmployee(employees.length > 0 ? employees[0] : '');
                setEntries([{ tempId: Date.now(), date: new Date().toISOString().slice(0, 10), value: 8 }]);
            }
        }
    }, [isOpen, editingData, employees]);

    const updateEntry = (tempId, field, newValue) => { setEntries(entries.map(e => e.tempId === tempId ? { ...e, [field]: newValue } : e)); };
    const addEntry = () => { const d = entries.length > 0 ? new Date(entries[entries.length - 1].date) : new Date(); d.setDate(d.getDate() + 1); setEntries([...entries, { tempId: Date.now(), date: d.toISOString().slice(0, 10), value: 8 }]); };
    const removeEntry = (tempId) => { if (entries.length > 1) { setEntries(entries.filter(e => e.tempId !== tempId)); } };
    const handleSaveClick = async () => { setIsLoading(true); await onSave(entries, selectedEmployee); setIsLoading(false); onClose(); };

    const title = editingData ? `Edytuj czas pracy: ${editingData.employeeName}` : "Wprowadź czas pracy";
    const modalFooter = (<><button onClick={onClose} disabled={isLoading} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Anuluj</button><button onClick={handleSaveClick} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">{isLoading ? 'Zapisywanie...' : 'Zapisz'}</button></>);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} footer={modalFooter} maxWidth="max-w-3xl">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
                {!editingData && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Wybierz pracownika</label>
                        <div className="grid grid-cols-2 gap-2">
                            {employees.map(emp => (
                                <button key={emp} onClick={() => setSelectedEmployee(emp)} className={`${SHARED_STYLES.buttonSelect.base} ${selectedEmployee === emp ? SHARED_STYLES.buttonSelect.active : SHARED_STYLES.buttonSelect.inactive}`}>{emp}</button>
                            ))}
                        </div>
                    </div>
                )}
                {entries.map(entry => (
                    <WorkTimeEntryRow 
                        key={entry.tempId}
                        entry={entry}
                        onUpdate={updateEntry}
                        onRemove={removeEntry}
                        isRemoveDisabled={entries.length <= 1}
                    />
                ))}
                 <button onClick={addEntry} className="w-full mt-2 bg-gray-200 hover:bg-gray-300 font-semibold text-sm py-2 px-4 rounded-lg"><i className="fa-solid fa-plus mr-2"></i>Dodaj kolejny dzień</button>
            </div>
        </Modal>
    );
};
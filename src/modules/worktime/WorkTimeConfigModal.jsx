import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { SHARED_STYLES } from '../../lib/helpers';
import { firebaseApi } from '../../lib/firebase';
import firebase from '../../lib/firebase'; // Importujemy domyślny eksport

export default function WorkTimeConfigModal({ isOpen, onClose, employees, onSaveEmployees, onSaveYearBatch }) {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('employees');
    const [employeeName, setEmployeeName] = useState('');
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [yearHours, setYearHours] = useState({});

    useEffect(() => {
        if (isOpen && activeTab === 'hours') {
            const fetchYearHours = async () => {
                setIsLoading(true);
                setYearHours({});
                const startDate = `${selectedYear}-01`;
                const endDate = `${selectedYear}-12`;
                try {
                    const yearConfigs = await firebaseApi.fetchCollection('worktime_config', {
                        filter: { field: firebase.firestore.FieldPath.documentId(), operator: '>=', value: startDate }
                    });
                    const filteredConfigs = yearConfigs.filter(doc => doc.id <= endDate);
                    const hoursMap = filteredConfigs.reduce((acc, doc) => {
                        acc[doc.id] = doc.requiredHours || '';
                        return acc;
                    }, {});
                    setYearHours(hoursMap);
                } catch (error) {
                    console.error("Błąd pobierania rocznej konfiguracji godzin:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchYearHours();
        }
    }, [selectedYear, isOpen, activeTab]);

const handleEditClick = (employee) => { setEditingEmployee(employee); setEmployeeName(employee); };
    const handleCancelEdit = () => { setEditingEmployee(null); setEmployeeName(''); };
    const handleSaveEmployee = async () => { setIsLoading(true); const t = employeeName.trim(); if (!t) { setIsLoading(false); return; } let u; if (editingEmployee) { u = employees.map(e => (e === editingEmployee ? t : e)); } else { u = [...employees, t]; } await onSaveEmployees(u); handleCancelEdit(); setIsLoading(false); };
    const handleDeleteEmployee = async (emp) => { if (window.confirm(`Usunąć "${emp}"?`)) { setIsLoading(true); await onSaveEmployees(employees.filter(e => e !== emp)); setIsLoading(false); } };
    const handleHoursChange = (month, value) => { setYearHours(prev => ({ ...prev, [month]: value })); };
    const handleSaveYear = async () => { setIsLoading(true); await onSaveYearBatch(yearHours, selectedYear); setIsLoading(false); };

    const modalFooter = (<><button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Zamknij</button></>);
    const months = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Konfiguracja modułu Czas Pracy" footer={modalFooter} maxWidth="max-w-2xl">
            <div className="flex border-b mb-4">
                <button onClick={() => setActiveTab('employees')} className={`${SHARED_STYLES.tabs.base} ${activeTab === 'employees' ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>Pracownicy</button>
                <button onClick={() => setActiveTab('hours')} className={`${SHARED_STYLES.tabs.base} ${activeTab === 'hours' ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>Wymiar godzin</button>
            </div>

            {activeTab === 'employees' && (
                <div>
                    <div className="mb-4">
                         <label className="block text-sm font-medium text-gray-700 mb-1">{editingEmployee ? `Edytuj nazwę:` : 'Dodaj pracownika:'}</label>
                        <div className="flex space-x-2"><input type="text" placeholder="Imię i nazwisko" value={employeeName} onChange={e => setEmployeeName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md"/><button onClick={handleSaveEmployee} disabled={isLoading} className="bg-blue-600 text-white px-4 rounded-md hover:bg-blue-700 shrink-0">{editingEmployee ? 'Zapisz' : 'Dodaj'}</button></div>
                        {editingEmployee && <button onClick={handleCancelEdit} className="text-xs text-gray-500 hover:text-black mt-1">Anuluj edycję</button>}
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                        {employees.map(emp => (
                            <div key={emp} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors"><span className="font-semibold text-gray-700 text-sm">{emp}</span><div className="space-x-3"><button onClick={() => handleEditClick(emp)} className="text-blue-600 hover:text-blue-800" title="Edytuj"><i className="fa-solid fa-pencil"></i></button><button onClick={() => handleDeleteEmployee(emp)} className="text-red-500 hover:text-red-700" title="Usuń"><i className="fa-solid fa-trash-can"></i></button></div></div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'hours' && (
                <div>
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <button onClick={() => setSelectedYear(y => y - 1)} className="p-2 text-lg"><i className="fa-solid fa-chevron-left"></i></button>
                        <span className="text-xl font-bold">{selectedYear}</span>
                        <button onClick={() => setSelectedYear(y => y + 1)} className="p-2 text-lg"><i className="fa-solid fa-chevron-right"></i></button>
                    </div>
                    {isLoading ? <LoadingSpinner /> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            {months.map((name, index) => {
                                const monthId = `${selectedYear}-${String(index + 1).padStart(2, '0')}`;
                                return (
                                    <div key={monthId} className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-gray-700">{name}</label>
                                        <input type="number" placeholder="np. 168" value={yearHours[monthId] || ''} onChange={e => handleHoursChange(monthId, e.target.value)} className="w-24 p-2 border border-gray-300 rounded-md text-right"/>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div className="mt-6 text-right">
                         <button onClick={handleSaveYear} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">Zapisz zmiany dla tego roku</button>
                    </div>
                </div>
            )}
        </Modal>
    );
};
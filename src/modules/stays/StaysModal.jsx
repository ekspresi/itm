import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import LoadingSpinner from '../../components/LoadingSpinner';
import { firebaseApi } from '../../lib/firebase';

export default function StaysModal({ isOpen, onClose, onSave, allAccommodations, targetMonth }) {
    const [isLoading, setIsLoading] = useState(false);
    const [entries, setEntries] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [activeMonth, setActiveMonth] = useState('');

    useEffect(() => {
        if (isOpen) {
            setActiveMonth(targetMonth);
        }
    }, [isOpen, targetMonth]);

    useEffect(() => {
        if (isOpen && activeMonth) {
            setIsLoading(true);
            const [year, month] = activeMonth.split('-').map(Number);
            const fetchEntries = async () => {
                try {
                    const monthEntries = await firebaseApi.fetchCollection('stays', { filter: { field: 'year', operator: '==', value: year }}, true);
                    const filteredByMonth = monthEntries.filter(e => e.month === month);
                    const entriesMap = filteredByMonth.reduce((acc, entry) => { acc[entry.accommodationId] = entry.guests; return acc; }, {});
                    setEntries(entriesMap);
                } catch (e) { 
                    console.error("Błąd wczytywania wpisów:", e); 
                    setEntries({});
                } finally { 
                    setIsLoading(false); 
                }
            };
            fetchEntries();
        } else {
            setEntries({});
            setSearchTerm('');
        }
    }, [isOpen, activeMonth]);

    const handleEntryChange = (accId, value) => {
        const numValue = Number(value);
        setEntries(prev => ({
            ...prev,
            [accId]: isNaN(numValue) || numValue < 0 ? 0 : numValue
        }));
    };

    const handleSaveClick = async () => {
        setIsLoading(true);
        await onSave(entries, activeMonth);
        setIsLoading(false);
        onClose();
    };

    const title = `Edytuj dane dla miesiąca: ${activeMonth}`;
    const modalFooter = (<><button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Anuluj</button><button onClick={handleSaveClick} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">{isLoading ? 'Zapisywanie...' : 'Zapisz zmiany'}</button></>);

    const filteredAccommodations = allAccommodations.filter(acc =>
        acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.address || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    const cityAccommodations = filteredAccommodations.filter(acc => acc.location === 'city');
    const municipalityAccommodations = filteredAccommodations.filter(acc => acc.location === 'municipality');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} footer={modalFooter} maxWidth="max-w-3xl">
            <div className="space-y-4">
                {/* ZMIANA: Dodajemy input do wyboru miesiąca */}
                <FormField label="Wybierz miesiąc do edycji">
                    <input
                        type="month"
                        value={activeMonth}
                        onChange={e => setActiveMonth(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                    />
                </FormField>
                <input 
                    type="text"
                    placeholder="Szukaj obiektu po nazwie lub adresie..."
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <div className="space-y-4 max-h-[55vh] overflow-y-auto p-1">
                    {isLoading ? <LoadingSpinner /> : (
                        <>
                            {cityAccommodations.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="font-bold text-gray-500 border-b pb-1">Miasto Mikołajki</h4>
                                    {cityAccommodations.map(acc => (
                                        <div key={acc.id} className="grid grid-cols-4 gap-4 items-center p-2 rounded-md hover:bg-gray-50">
                                            <div className="col-span-3">
                                                <p className="font-semibold text-sm">{acc.name}</p>
                                                <p className="text-xs text-gray-500">{acc.address}</p>
                                            </div>
                                            <input type="number" value={entries[acc.id] || ''} onChange={(e) => handleEntryChange(acc.id, e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-right font-semibold" />
                                        </div>
                                    ))}
                                </div>
                            )}
                            {municipalityAccommodations.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="font-bold text-gray-500 border-b pb-1">Gmina Mikołajki</h4>
                                     {municipalityAccommodations.map(acc => (
                                        <div key={acc.id} className="grid grid-cols-4 gap-4 items-center p-2 rounded-md hover:bg-gray-50">
                                            <div className="col-span-3">
                                                <p className="font-semibold text-sm">{acc.name}</p>
                                                <p className="text-xs text-gray-500">{acc.address}</p>
                                            </div>
                                            <input type="number" value={entries[acc.id] || ''} onChange={(e) => handleEntryChange(acc.id, e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-right font-semibold" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
};
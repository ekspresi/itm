import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import NumberInput from '../../components/NumberInput';

export default function SalesModal({ isOpen, onClose, onSave, isLoading, existingData, defaultDate }) {
    const [sale, setSale] = useState({});
    const [validationError, setValidationError] = useState('');

    useEffect(() => {
        if (isOpen) {
            const initialData = existingData 
                ? { ...existingData } 
                : { date: defaultDate || new Date().toISOString().slice(0, 10), totalAmount: '', cardAmount: '', invoiceAmount: '' };
            setSale(initialData);
            setValidationError('');
        }
    }, [isOpen, existingData, defaultDate]);

    const handleChange = (field, value) => {
        setSale(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveClick = () => {
        if (!sale.date || !sale.totalAmount) {
            setValidationError('Pola z gwiazdką (*) są wymagane.');
            return;
        }
        onSave(sale);
    };

    const isSaveDisabled = !sale.date || String(sale.totalAmount).trim() === '';

    const modalFooter = (
        <>
            <button onClick={onClose} disabled={isLoading} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Anuluj</button>
            <button 
                onClick={handleSaveClick} 
                disabled={isLoading || isSaveDisabled} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400"
            >
                {isLoading ? 'Zapisywanie...' : (existingData ? 'Zapisz zmiany' : 'Zapisz')}
            </button>
        </>
    );

    const title = existingData ? `Edytuj sprzedaż z dnia: ${existingData.date}` : "Dodaj sprzedaż dzienną";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} footer={modalFooter} maxWidth="max-w-xl">
            <div className="grid md:grid-cols-2 gap-4">
                <FormField label="Data raportu *">
                    <input type="date" value={sale.date || ''} onChange={e => handleChange('date', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                </FormField>
                <NumberInput label="Suma z kasy fiskalnej *" value={sale.totalAmount} onChange={val => handleChange('totalAmount', val)} />
                <NumberInput label="W tym płatności terminalem" value={sale.cardAmount} onChange={val => handleChange('cardAmount', val)} />
                <NumberInput label="W tym faktury przelewowe" value={sale.invoiceAmount} onChange={val => handleChange('invoiceAmount', val)} />
            </div>
             {validationError && (<div className="pt-4 text-center"><p className="text-red-600 font-semibold">{validationError}</p></div>)}
        </Modal>
    );
};
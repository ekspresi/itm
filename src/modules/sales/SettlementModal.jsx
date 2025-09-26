import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import NumberInput from '../../components/NumberInput';

export default function SettlementModal({ isOpen, onClose, onSave, isLoading, existingData, reportMonth }) {
    const [settlementData, setSettlementData] = useState({});
    const [validationError, setValidationError] = useState('');

    useEffect(() => {
        if (isOpen) {
            const initialData = existingData || {
                settlementMonth: reportMonth, purchaseNet: '', margin: '', salesNet: '',
                vat: '', salesGross: '', bankDeposit: ''
            };
            setSettlementData(initialData);
            setValidationError('');
        }
    }, [isOpen, existingData, reportMonth]);

    const handleChange = (field, value) => {
        setSettlementData(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveClick = () => {
        onSave(settlementData);
    };

    // Sprawdzamy, czy którekolwiek z pól jest puste
    const isSaveDisabled = Object.values(settlementData).some(val => String(val).trim() === '');

    const modalFooter = (
        <>
            <button onClick={onClose} disabled={isLoading} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Anuluj</button>
            <button 
                onClick={handleSaveClick} 
                disabled={isLoading || isSaveDisabled} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400"
            >
                {isLoading ? 'Zapisywanie...' : (existingData ? 'Zapisz zmiany' : 'Zapisz rozliczenie')}
            </button>
        </>
    );
    
    const title = existingData 
        ? `Edytuj rozliczenie dla: ${new Date(existingData.settlementMonth + '-02').toLocaleString('pl-PL', { month: 'long', year: 'numeric' })}`
        : "Dodaj nowe rozliczenie miesięczne";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} footer={modalFooter} maxWidth="max-w-3xl">
            <div className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                    <FormField label="Miesiąc rozliczenia *">
                        <input type="month" value={settlementData.settlementMonth || ''} onChange={e => handleChange('settlementMonth', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                    </FormField>
                    <NumberInput label="Wartość zakupu netto *" value={settlementData.purchaseNet} onChange={val => handleChange('purchaseNet', val)} />
                    <NumberInput label="Marża *" value={settlementData.margin} onChange={val => handleChange('margin', val)} />
                    <NumberInput label="Wartość sprzedaży netto *" value={settlementData.salesNet} onChange={val => handleChange('salesNet', val)} />
                    <NumberInput label="VAT *" value={settlementData.vat} onChange={val => handleChange('vat', val)} />
                    <NumberInput label="Wartość sprzedaży brutto *" value={settlementData.salesGross} onChange={val => handleChange('salesGross', val)} />
                </div>
                <div className="border-t pt-4">
                     <NumberInput label="Wpłacono na rachunek bankowy *" value={settlementData.bankDeposit} onChange={val => handleChange('bankDeposit', val)} />
                </div>
            </div>
        </Modal>
    );
};
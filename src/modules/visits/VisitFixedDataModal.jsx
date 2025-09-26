import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import LoadingSpinner from '../../components/LoadingSpinner';
import { SHARED_STYLES } from '../../lib/helpers';
import { firebaseApi } from '../../lib/firebase';

export default function VisitFixedDataModal({ isOpen, onClose, selectedDate, onSaveSuccess, allIndicators }) {
    const [isLoading, setIsLoading] = useState(true);
    const [fixedData, setFixedData] = useState(null);
    
    const defaultDataStructure = {
        total: '',
        gender: { },
        language: { },
        purpose: {}
    };

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                setIsLoading(true);
                try {
                    const data = await firebaseApi.fetchDocument('overrides', selectedDate);
                    const initialData = { 
                        ...defaultDataStructure, 
                        ...(data || {}),
                        gender: data?.gender || {},
                        language: data?.language || {},
                        purpose: data?.purpose || {}
                    };
                    setFixedData(initialData);
                } catch (error) {
                    console.error("Błąd wczytywania stałych danych:", error);
                    alert("Nie udało się wczytać istniejących danych stałych.");
                    setFixedData(defaultDataStructure);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [isOpen, selectedDate]);

    const handleValueChange = (field, value) => {
        const numValue = value === '' ? '' : Number(value);
        setFixedData(prev => ({ ...prev, [field]: isNaN(numValue) ? '' : numValue }));
    };
    
    const handleNestedValueChange = (parent, field, value) => {
        const numValue = value === '' ? '' : Number(value);
        setFixedData(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [field]: isNaN(numValue) ? '' : numValue
            }
        }));
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const total = Number(fixedData.total || 0);
            const genderSum = Object.values(fixedData.gender || {}).reduce((sum, val) => sum + Number(val || 0), 0);
            const langSum = Object.values(fixedData.language || {}).reduce((sum, val) => sum + Number(val || 0), 0);

            if (genderSum !== total || langSum !== total) {
                if (!window.confirm("Uwaga: Suma płci lub języków nie zgadza się z sumą całkowitą. Czy na pewno chcesz zapisać?")) {
                    setIsLoading(false);
                    return;
                }
            }
            
            await firebaseApi.saveDocument('overrides', { ...fixedData, id: selectedDate });
            alert("Stałe dane dzienne zostały pomyślnie zapisane.");
            onSaveSuccess();
            onClose();
        } catch (error) {
            console.error("Błąd zapisu stałych danych:", error);
            alert("Wystąpił błąd podczas zapisu.");
        } finally {
            setIsLoading(false);
        }
    };

    const modalFooter = (
        <>
            <button onClick={onClose} disabled={isLoading} className={SHARED_STYLES.buttons.secondary}>Anuluj</button>
            <button onClick={handleSave} disabled={isLoading} className={SHARED_STYLES.buttons.primary}>
                {isLoading ? 'Zapisywanie...' : 'Zapisz dane'}
            </button>
        </>
    );

    const title = `Edytuj stałe dane dla: ${selectedDate}`;
    
    const genderIndicators = allIndicators.filter(ind => ind.category === 'gender').sort((a, b) => a.sortOrder - b.sortOrder);
    const languageIndicators = allIndicators.filter(ind => ind.category === 'language').sort((a, b) => a.sortOrder - b.sortOrder);
    const purposeIndicators = allIndicators.filter(ind => ind.category === 'purpose').sort((a, b) => a.sortOrder - b.sortOrder);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} footer={modalFooter} maxWidth="max-w-4xl">
            {isLoading || !fixedData ? <LoadingSpinner /> : (
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Wprowadź ostateczne, przeliczone sumy dla tego dnia. Te wartości zostaną użyte w raportach, jeśli rok {selectedDate.substring(0,4)} jest ustawiony w tryb "Ręczny".
                    </p>
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <FormField label="Łączna liczba odwiedzających *">
                            <input type="number" value={fixedData.total || ''} onChange={e => handleValueChange('total', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md font-bold text-lg" />
                        </FormField>
                    </div>

                    <div className="pt-4 border-t">
                        <h4 className="text-md font-semibold text-gray-800 mb-2 text-center">Podział na płeć</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {genderIndicators.map(indicator => (
                                <FormField key={indicator.slug} label={indicator.name}>
                                    <input
                                        type="number"
                                        value={fixedData.gender?.[indicator.slug] || ''}
                                        onChange={e => handleNestedValueChange('gender', indicator.slug, e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </FormField>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <h4 className="text-md font-semibold text-gray-800 mb-2 text-center">Podział na języki</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {languageIndicators.map(indicator => (
                                <FormField key={indicator.slug} label={indicator.name}>
                                    <input
                                        type="number"
                                        value={fixedData.language?.[indicator.slug] || ''}
                                        onChange={e => handleNestedValueChange('language', indicator.slug, e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </FormField>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <h4 className="text-md font-semibold text-gray-800 mb-2 text-center">Cele wizyt</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {purposeIndicators.map(indicator => (
                                <FormField 
                                    key={indicator.slug} 
                                    label={
                                        <span className="flex items-center gap-2">
                                            <i className={`fa-solid ${indicator.icon} fa-fw text-gray-400`}></i>
                                            {indicator.name}
                                        </span>
                                    }
                                >
                                    <input
                                        type="number"
                                        value={fixedData.purpose?.[indicator.slug] || ''}
                                        onChange={e => handleNestedValueChange('purpose', indicator.slug, e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </FormField>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}
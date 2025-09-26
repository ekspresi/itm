import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import ButtonSelectGroup from '../../components/ButtonSelectGroup';

export default function AccommodationFilterModal({ isOpen, onClose, config, activeFilters, onApplyFilters }) {
    const [localFilters, setLocalFilters] = useState(activeFilters);

    useEffect(() => {
        if (isOpen) {
            setLocalFilters(activeFilters);
        }
    }, [isOpen, activeFilters]);

    const handleCheckboxChange = (filterKey, value) => {
        const currentValues = new Set(localFilters[filterKey] || []);
        if (currentValues.has(value)) {
            currentValues.delete(value);
        } else {
            currentValues.add(value);
        }
        setLocalFilters(prev => ({ ...prev, [filterKey]: Array.from(currentValues) }));
    };

    const handleApply = () => { onApplyFilters(localFilters); onClose(); };
    const handleClear = () => { 
        const clearedFilters = { categoryIds: [], attributeIds: [], languageIds: [] }; 
        setLocalFilters(clearedFilters); 
        onApplyFilters(clearedFilters); 
        onClose(); 
    };

    const modalFooter = (
        <>
            <button onClick={handleClear} className="text-sm font-semibold text-gray-600 hover:text-black">Wyczyść filtry</button>
            <div className="flex gap-2">
                <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Anuluj</button>
                <button onClick={handleApply} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Zastosuj</button>
            </div>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Filtruj obiekty" footer={modalFooter} maxWidth="max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ButtonSelectGroup title="Kategorie" items={config.categories} selectedIds={localFilters.categoryIds} onToggle={(id) => handleCheckboxChange('categoryIds', id)} />
                <ButtonSelectGroup title="Atrybuty" items={config.attributes} selectedIds={localFilters.attributeIds} onToggle={(id) => handleCheckboxChange('attributeIds', id)} />
                <ButtonSelectGroup title="Język obsługi" items={config.languages} selectedIds={localFilters.languageIds} onToggle={(id) => handleCheckboxChange('languageIds', id)} />
            </div>
        </Modal>
    );
};
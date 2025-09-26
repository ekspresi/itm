import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import ButtonSelectGroup from '../../components/ButtonSelectGroup';

export default function EventFilterModal({ isOpen, onCancel, onApply, currentFilters, categories }) {
    const [localFilters, setLocalFilters] = useState(currentFilters);

    useEffect(() => { setLocalFilters(currentFilters); }, [currentFilters, isOpen]);

    const handleToggleCategory = (categoryId) => {
        setLocalFilters(prev => {
            const currentIds = new Set(prev.categoryIds || []);
            if (currentIds.has(categoryId)) { currentIds.delete(categoryId); } else { currentIds.add(categoryId); }
            return { ...prev, categoryIds: Array.from(currentIds) };
        });
    };

    const handleApply = () => { onApply(localFilters); onCancel(); };
    const modalFooter = (<><div></div><div className="flex gap-2"><button onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Anuluj</button><button onClick={handleApply} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Zastosuj filtry</button></div></>);

    return (
        <Modal isOpen={isOpen} onClose={onCancel} title="Filtruj wydarzenia po kategorii" footer={modalFooter} maxWidth="max-w-sm">
            <ButtonSelectGroup title="Dostępne kategorie" items={categories} selectedIds={localFilters.categoryIds || []} onToggle={handleToggleCategory} />
        </Modal>
    );
};
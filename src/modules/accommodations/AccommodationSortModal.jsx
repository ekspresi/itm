import React from 'react';
import Modal from '../../components/Modal'; // <-- Zmieniona ścieżka
import { SHARED_STYLES } from '../../lib/helpers'; // <-- Zmieniona ścieżka

export default function AccommodationSortModal({ isOpen, onClose, onSort, currentSort }) {
    const sortOptions = [
        { label: 'Nazwa (A-Z)', key: 'name_asc' },
        { label: 'Nazwa (Z-A)', key: 'name_desc' },
        { label: 'Data dodania (najnowsze)', key: 'date_desc' },
        { label: 'Data dodania (najstarsze)', key: 'date_asc' },
        { label: 'Liczba miejsc (rosnąco)', key: 'capacity_asc' },
        { label: 'Liczba miejsc (malejąco)', key: 'capacity_desc' },
    ];

    const modalFooter = (<><div></div><button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Zamknij</button></>);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Sortuj listę" footer={modalFooter} maxWidth="max-w-sm">
            <div className="space-y-2">
                {sortOptions.map(option => (
                    <button 
                        key={option.key} 
                        onClick={() => { onSort(option.key); onClose(); }} 
                        className={`${SHARED_STYLES.buttonSelect.base} ${currentSort === option.key ? SHARED_STYLES.buttonSelect.active : SHARED_STYLES.buttonSelect.inactive}`}>
                        {option.label}
                    </button>
                ))}
            </div>
        </Modal>
    );
};
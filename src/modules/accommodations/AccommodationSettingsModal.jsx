import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { SHARED_STYLES } from '../../lib/helpers';

export default function AccommodationSettingsModal({ isOpen, onClose, config, onSave, isLoading }) {
    const [activeTab, setActiveTab] = useState('categories');
    const [localConfig, setLocalConfig] = useState(config);
    const [newItemName, setNewItemName] = useState('');

    useEffect(() => {
        if (isOpen) {
            setLocalConfig(config);
            setActiveTab('categories');
            setNewItemName('');
        }
    }, [isOpen, config]);

    const handleAddItem = () => {
        const trimmedName = newItemName.trim();
        if (!trimmedName) return;
        const newItem = { id: Date.now().toString(), name: trimmedName };
        const updatedList = [...(localConfig[activeTab] || []), newItem];
        setLocalConfig(prev => ({ ...prev, [activeTab]: updatedList }));
        setNewItemName('');
    };

    const handleDeleteItem = (idToDelete) => {
        if (window.confirm('Czy na pewno chcesz usunąć tę pozycję?')) {
            const updatedList = localConfig[activeTab].filter(item => item.id !== idToDelete);
            setLocalConfig(prev => ({ ...prev, [activeTab]: updatedList }));
        }
    };

    const handleSaveChanges = () => { onSave(localConfig); };

    const tabs = [
        { key: 'categories', label: 'Kategorie' },
        { key: 'attributes', label: 'Atrybuty' },
        { key: 'languages', label: 'Języki obsługi' }
    ];

    const modalFooter = (
        <>
            <button onClick={onClose} disabled={isLoading} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Anuluj</button>
            <button onClick={handleSaveChanges} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">{isLoading ? 'Zapisywanie...' : 'Zapisz wszystkie zmiany'}</button>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ustawienia modułu Noclegi" footer={modalFooter} maxWidth="max-w-xl">
            <div className="space-y-4">
                <div className="flex border-b">
                    {tabs.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`${SHARED_STYLES.tabs.base} ${activeTab === tab.key ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>{tab.label}</button>
                    ))}
                </div>
                <div className="flex space-x-2">
                    <input type="text" placeholder={`Nazwa nowej pozycji...`} className="w-full p-2 border border-gray-300 rounded-md" value={newItemName} onChange={e => setNewItemName(e.target.value)} />
                    <button onClick={handleAddItem} className="bg-blue-600 text-white px-4 rounded-md hover:bg-blue-700 shrink-0">Dodaj</button>
                </div>
                <div className="space-y-2 border-t pt-4">
                    {(localConfig[activeTab] || []).length > 0 ? (
                        (localConfig[activeTab] || []).map(item => (
                            <div key={item.id} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                                <span>{item.name}</span>
                                <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-700" title="Usuń"><i className="fa-solid fa-trash-can"></i></button>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-center text-gray-500 py-4">Brak zdefiniowanych pozycji.</p>
                    )}
                </div>
            </div>
        </Modal>
    );
};
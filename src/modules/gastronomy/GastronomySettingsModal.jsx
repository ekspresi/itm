import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { SHARED_STYLES } from '../../lib/helpers';

export default function GastronomySettingsModal({ isOpen, onClose, config, onSave, isLoading }) {
            const [activeTab, setActiveTab] = useState('categories');
            const [localConfig, setLocalConfig] = useState(config);
            const [newItemName, setNewItemName] = useState('');

            useEffect(() => {
                if (isOpen) { setLocalConfig(config || { categories: [], cuisines: [] }); setActiveTab('categories'); setNewItemName(''); }
            }, [isOpen, config]);
            
            const generateSlug = (name) => name.toString().toLowerCase().trim().replace(/[\s\W_]+/g, '-');
            const handleAddItem = () => {
                const trimmedName = newItemName.trim();
                if (!trimmedName) return;
                const newItem = { id: generateSlug(trimmedName), name: trimmedName };
                const updatedList = [...(localConfig[activeTab] || []), newItem];
                setLocalConfig(prev => ({ ...prev, [activeTab]: updatedList }));
                setNewItemName('');
            };
            const handleDeleteItem = (id) => {
                if (window.confirm('Na pewno usunąć?')) {
                    const updatedList = localConfig[activeTab].filter(item => item.id !== id);
                    setLocalConfig(prev => ({ ...prev, [activeTab]: updatedList }));
                }
            };

            const modalFooter = (<><button onClick={onClose} className={SHARED_STYLES.buttons.secondary}>Anuluj</button><button onClick={() => onSave(localConfig)} disabled={isLoading} className={SHARED_STYLES.buttons.primary}>{isLoading ? 'Zapisywanie...' : 'Zapisz'}</button></>);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ustawienia Modułu Gastronomia" footer={modalFooter} maxWidth="max-w-xl">
                    <div className="flex border-b mb-4">
                        <button onClick={() => setActiveTab('categories')} className={`${SHARED_STYLES.tabs.base} ${activeTab === 'categories' ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>Kategorie</button>
                        <button onClick={() => setActiveTab('cuisines')} className={`${SHARED_STYLES.tabs.base} ${activeTab === 'cuisines' ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>Kuchnie</button>
                    </div>
                    <div className="flex space-x-2">
                        <input type="text" placeholder="Nazwa..." value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full p-2 border rounded-md"/>
                        <button onClick={handleAddItem} className="bg-blue-600 text-white px-4 rounded-md hover:bg-blue-700 shrink-0">Dodaj</button>
                    </div>
                    <div className="space-y-2 border-t pt-4 mt-4 max-h-64 overflow-y-auto">
                        {(localConfig[activeTab] || []).map(item => (
                            <div key={item.id} className="bg-gray-100 p-2 rounded-md flex justify-between items-center">
                                <span>{item.name}</span>
                                <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-700"><i className="fa-solid fa-trash-can"></i></button>
                            </div>
                        ))}
                    </div>
        </Modal>
    );
};
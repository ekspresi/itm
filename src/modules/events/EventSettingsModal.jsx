import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import ToggleSwitch from '../../components/ToggleSwitch';
import { SHARED_STYLES } from '../../lib/helpers';

export default function EventSettingsModal({ isOpen, onClose, config, onSave, isLoading }) {
    const [activeTab, setActiveTab] = useState('categories');
    const [localConfig, setLocalConfig] = useState(config);

    const [newItemName, setNewItemName] = useState('');
    const [newItemUrl, setNewItemUrl] = useState('');
    const [isDefaultFeatured, setIsDefaultFeatured] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    useEffect(() => {
        if (isOpen) {
            const initialConfig = { categories: [], sources: { localFacebookPages: [], nearbyFacebookPages: [] }, ...config };
            setLocalConfig(initialConfig);
            setActiveTab('categories');
            handleCancelEdit();
        }
    }, [isOpen, config]);

    const handleCancelEdit = () => {
        setEditingItem(null);
        setNewItemName('');
        setNewItemUrl('');
        setIsDefaultFeatured(false);
    };
    
    const handleSaveItem = (listName) => {
        const trimmedName = newItemName.trim();
        if (!trimmedName) return;

        let list = listName === 'categories' ? [...(localConfig.categories || [])] : [...(localConfig.sources[listName] || [])];

        if (editingItem) {
            const itemIndex = list.findIndex(item => item.id === editingItem.id);
            if (itemIndex > -1) {
                list[itemIndex].name = trimmedName;
                if (listName !== 'categories') {
                    list[itemIndex].url = newItemUrl.trim();
                    list[itemIndex].isDefaultFeatured = isDefaultFeatured;
                }
            }
        } else {
            const newItem = { id: Date.now().toString(), name: trimmedName };
            if (listName !== 'categories') {
                if (!newItemUrl.trim()) {
                    alert("Adres URL jest wymagany.");
                    return;
                }
                newItem.url = newItemUrl.trim();
                newItem.isDefaultFeatured = isDefaultFeatured;
            }
            list.push(newItem);
        }
        
        if (listName === 'categories') {
            setLocalConfig(prev => ({ ...prev, categories: list }));
        } else {
            setLocalConfig(prev => ({ ...prev, sources: { ...prev.sources, [listName]: list } }));
        }
        handleCancelEdit();
    };

    const handleDeleteItem = (listName, idToDelete) => {
        if (!window.confirm('Czy na pewno chcesz usunąć tę pozycję?')) return;
        let list = listName === 'categories' ? [...(localConfig.categories || [])] : [...(localConfig.sources[listName] || [])];
        const updatedList = list.filter(item => item.id !== idToDelete);

        if (listName === 'categories') {
            setLocalConfig(prev => ({ ...prev, categories: updatedList }));
        } else {
            setLocalConfig(prev => ({ ...prev, sources: { ...prev.sources, [listName]: updatedList } }));
        }
    };
    
    const handleEditClick = (item, listName) => {
        setEditingItem(item);
        setNewItemName(item.name);
        if (listName !== 'categories') {
            setNewItemUrl(item.url);
            setIsDefaultFeatured(item.isDefaultFeatured || false);
        }
    };

    const renderSourceSection = (title, listName) => (
        <div className="space-y-4">
            <h4 className="font-bold text-gray-700">{title}</h4>
            <div className="p-3 border rounded-lg bg-gray-50">
                <h5 className="text-sm font-bold mb-2">{editingItem && editingItem.url !== undefined ? `Edytuj źródło: ${editingItem.name}` : 'Dodaj nowe źródło'}</h5>
                <div className="space-y-2">
                    <input type="text" placeholder="Nazwa (np. CK Kłobuk)" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full p-2 border rounded"/>
                    <input type="url" placeholder="URL do /events" value={newItemUrl} onChange={e => setNewItemUrl(e.target.value)} className="w-full p-2 border rounded"/>
                    <ToggleSwitch label="Wyróżniaj domyślnie" enabled={isDefaultFeatured} setEnabled={setIsDefaultFeatured} />
                    <div className="flex gap-2 justify-end">
                        {editingItem && editingItem.url !== undefined && <button onClick={handleCancelEdit} className={SHARED_STYLES.buttons.secondary}>Anuluj</button>}
                        <button onClick={() => handleSaveItem(listName)} className={SHARED_STYLES.buttons.primary}>{editingItem && editingItem.url !== undefined ? 'Zapisz' : 'Dodaj'}</button>
                    </div>
                </div>
            </div>
            <div className="space-y-2 p-2 border rounded-md bg-gray-50 max-h-48 overflow-y-auto">
                {(localConfig.sources[listName] || []).map(item => (
                    <div key={item.id} className="bg-white p-2 rounded shadow-sm flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-sm">{item.name}</p>
                            <p className="text-xs text-gray-500 truncate">{item.url}</p>
                        </div>
                        <div className="flex items-center gap-2">
                           {item.isDefaultFeatured && <i className="fa-solid fa-star text-yellow-500" title="Domyślnie wyróżnione"></i>}
                           <button onClick={() => handleEditClick(item, listName)} className="text-blue-600 hover:text-blue-800" title="Edytuj"><i className="fa-solid fa-pencil"></i></button>
                           <button onClick={() => handleDeleteItem(listName, item.id)} className="text-red-500 hover:text-red-700" title="Usuń"><i className="fa-solid fa-trash-can"></i></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ustawienia Modułu Wydarzenia" footer={<><button onClick={onClose} className={SHARED_STYLES.buttons.secondary}>Anuluj</button><button onClick={() => onSave(localConfig)} disabled={isLoading} className={SHARED_STYLES.buttons.primary}>{isLoading ? 'Zapisywanie...' : 'Zapisz wszystkie zmiany'}</button></>} maxWidth="max-w-4xl">
            <div className="flex border-b mb-4">
                <button onClick={() => { setActiveTab('categories'); handleCancelEdit(); }} className={`${SHARED_STYLES.tabs.base} ${activeTab === 'categories' ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>Kategorie</button>
                <button onClick={() => { setActiveTab('sources'); handleCancelEdit(); }} className={`${SHARED_STYLES.tabs.base} ${activeTab === 'sources' ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>Źródła Facebook</button>
            </div>

            {activeTab === 'categories' && (
                <div className="space-y-4">
                     <div className="p-3 border rounded-lg bg-gray-50">
                        <h5 className="text-sm font-bold mb-2">{editingItem ? `Edytuj kategorię: ${editingItem.name}`: 'Dodaj nową kategorię'}</h5>
                        <div className="flex gap-2">
                            <input type="text" placeholder="Nazwa nowej kategorii" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full p-2 border rounded"/>
                            <button onClick={() => handleSaveItem('categories')} className={SHARED_STYLES.buttons.primary}>{editingItem ? 'Zapisz' : 'Dodaj'}</button>
                            {editingItem && <button onClick={handleCancelEdit} className={SHARED_STYLES.buttons.secondary}>Anuluj</button>}
                        </div>
                    </div>
                    <div className="space-y-2 p-2 border rounded-md bg-gray-50 max-h-64 overflow-y-auto">
                        {(localConfig.categories || []).map(cat => (
                            <div key={cat.id} className="bg-white p-2 rounded shadow-sm flex justify-between items-center">
                                <span className="font-semibold text-sm">{cat.name}</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleEditClick(cat, 'categories')} className="text-blue-600 hover:text-blue-800" title="Edytuj"><i className="fa-solid fa-pencil"></i></button>
                                    <button onClick={() => handleDeleteItem('categories', cat.id)} className="text-red-500 hover:text-red-700" title="Usuń"><i className="fa-solid fa-trash-can"></i></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'sources' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderSourceSection("Wydarzenia lokalne", "localFacebookPages")}
                    {renderSourceSection("Wydarzenia w okolicy", "nearbyFacebookPages")}
                </div>
            )}
        </Modal>
    );
};
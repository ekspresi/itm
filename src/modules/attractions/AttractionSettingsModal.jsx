import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { SHARED_STYLES } from '../../lib/helpers';

export default function AttractionSettingsModal({ isOpen, onClose, config, onSave, isLoading }) {
    const [activeTab, setActiveTab] = useState('type');
    const [localConfig, setLocalConfig] = useState(config);
    const [newItemName, setNewItemName] = useState('');
    const [newItemIcon, setNewItemIcon] = useState('');
    const [editingItem, setEditingItem] = useState(null);

    useEffect(() => {
        if (isOpen) {
            const initialConfig = {
                tags: { type: [] },
                municipalities: [],
                collections: [],
                ...config
            };
            setLocalConfig(initialConfig);
            setActiveTab('type');
            handleCancelEdit();
        }
    }, [isOpen, config]);
    
    const generateSlug = (name) => {
        const polishChars = { 'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z' };
        return name.toString().toLowerCase().trim().replace(/[\s\W_]+/g, '-').replace(/[ąćęłńóśźż]/g, char => polishChars[char]).replace(/&/g, '-and-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
    };
    
    const handleSaveItem = () => {
        const trimmedName = newItemName.trim();
        if (!trimmedName) return;

        // ZMIANA: Poprawiona logika pobierania listy
        let list;
        if (activeTab === 'type') list = [...(localConfig.tags?.type || [])];
        else if (activeTab === 'municipalities') list = [...(localConfig.municipalities || [])];
        else if (activeTab === 'collections') list = [...(localConfig.collections || [])];

        if (editingItem) {
            const itemIndex = list.findIndex(item => item.id === editingItem.id);
            if (itemIndex > -1) {
                list[itemIndex].name = trimmedName;
                if (activeTab !== 'municipalities') {
                    list[itemIndex].icon = newItemIcon.trim();
                }
            }
        } else {
            const newItem = { id: generateSlug(trimmedName), name: trimmedName };
            if (activeTab !== 'municipalities') {
                newItem.icon = newItemIcon.trim();
            }
            list.push(newItem);
        }
        
        // ZMIANA: Poprawiona logika zapisu do stanu
        if (activeTab === 'type') {
             setLocalConfig(prev => ({ ...prev, tags: { ...prev.tags, type: list } }));
        } else if (activeTab === 'municipalities') {
            setLocalConfig(prev => ({ ...prev, municipalities: list }));
        } else if (activeTab === 'collections') {
            setLocalConfig(prev => ({ ...prev, collections: list }));
        }
        
        handleCancelEdit();
    };

    const handleDeleteItem = (idToDelete) => {
        if (window.confirm('Czy na pewno chcesz usunąć tę pozycję?')) {
            // ZMIANA: Poprawiona logika usuwania
            if (activeTab === 'type') {
                const updatedList = localConfig.tags.type.filter(item => item.id !== idToDelete);
                setLocalConfig(prev => ({ ...prev, tags: { ...prev.tags, type: updatedList } }));
            } else if (activeTab === 'municipalities') {
                const updatedList = localConfig.municipalities.filter(item => item.id !== idToDelete);
                setLocalConfig(prev => ({ ...prev, municipalities: updatedList }));
            } else if (activeTab === 'collections') {
                const updatedList = localConfig.collections.filter(item => item.id !== idToDelete);
                setLocalConfig(prev => ({ ...prev, collections: updatedList }));
            }
        }
    };
    
    const handleMoveItem = (index, direction) => {
        // ZMIANA: Poprawiona logika zmiany kolejności
        let list;
        if (activeTab === 'type') list = [...localConfig.tags.type];
        else if (activeTab === 'municipalities') list = [...localConfig.municipalities];
        else if (activeTab === 'collections') list = [...localConfig.collections];

        const [movedItem] = list.splice(index, 1);
        list.splice(index + direction, 0, movedItem);
        
        if (activeTab === 'type') {
            setLocalConfig(prev => ({ ...prev, tags: { ...prev.tags, type: list } }));
        } else if (activeTab === 'municipalities') {
            setLocalConfig(prev => ({...prev, municipalities: list}));
        } else if (activeTab === 'collections') {
            setLocalConfig(prev => ({ ...prev, collections: list }));
        }
    };
    
    const handleEditClick = (item) => {
        setEditingItem(item);
        setNewItemName(item.name);
        if (activeTab !== 'municipalities') {
            setNewItemIcon(item.icon || '');
        }
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
        setNewItemName('');
        setNewItemIcon('');
    };

    const handleSaveChanges = () => { onSave(localConfig); };

    const tabs = [
        { key: 'type', label: 'Kategorie' }, 
        { key: 'municipalities', label: 'Gminy' },
        { key: 'collections', label: 'Kolekcje' }
    ];
    
    // ZMIANA: Poprawiona logika pobierania listy do wyświetlenia
    let currentList;
    if (activeTab === 'type') currentList = localConfig.tags?.type || [];
    else if (activeTab === 'municipalities') currentList = localConfig.municipalities || [];
    else if (activeTab === 'collections') currentList = localConfig.collections || [];

    const actionButton = "bg-white hover:bg-gray-100 text-gray-600 w-8 h-8 rounded-lg border shadow-sm flex items-center justify-center transition-colors disabled:opacity-30";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ustawienia modułu Atrakcje" footer={<><button onClick={onClose} className={SHARED_STYLES.buttons.secondary}>Anuluj</button><button onClick={handleSaveChanges} disabled={isLoading} className={SHARED_STYLES.buttons.primary}>{isLoading ? 'Zapisywanie...' : 'Zapisz wszystkie zmiany'}</button></>} maxWidth="max-w-xl">
            <div className="space-y-4">
                <div className="flex border-b">
                    {tabs.map(tab => ( <button key={tab.key} onClick={() => { setActiveTab(tab.key); handleCancelEdit(); }} className={`${SHARED_STYLES.tabs.base} ${activeTab === tab.key ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>{tab.label}</button> ))}
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{editingItem ? `Edytuj pozycję` : 'Dodaj nową pozycję'}</label>
                    <div className="flex space-x-2">
                        <input type="text" placeholder="Wpisz nazwę..." className="w-full p-2 border border-gray-300 rounded-md" value={newItemName} onChange={e => setNewItemName(e.target.value)} />
                         {activeTab !== 'municipalities' && (
                             <input type="text" placeholder="fa-ikona" className="w-32 p-2 border border-gray-300 rounded-md" value={newItemIcon} onChange={e => setNewItemIcon(e.target.value)} />
                         )}
                        <button onClick={handleSaveItem} className="bg-blue-600 text-white px-4 rounded-md hover:bg-blue-700 shrink-0">{editingItem ? 'Zapisz' : 'Dodaj'}</button>
                    </div>
                    {editingItem && <button onClick={handleCancelEdit} className="text-xs text-gray-500 hover:text-black mt-1">Anuluj edycję</button>}
                </div>
                <div className="space-y-2 border-t pt-4 max-h-64 overflow-y-auto">
                    {(currentList).map((item, index) => (
                        <div key={item.id} className="bg-white p-2 rounded-lg shadow-sm border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {item.icon && <i className={`fa-solid ${item.icon} fa-fw text-gray-500`}></i>}
                                <span className="font-semibold text-sm">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                 <button onClick={() => handleMoveItem(index, -1)} disabled={index === 0} className={actionButton} title="Przesuń w górę"><i className="fa-solid fa-arrow-up text-xs"></i></button>
                                 <button onClick={() => handleMoveItem(index, 1)} disabled={index === currentList.length - 1} className={actionButton} title="Przesuń w dół"><i className="fa-solid fa-arrow-down text-xs"></i></button>
                                 <button onClick={() => handleEditClick(item)} className={actionButton} title="Edytuj"><i className="fa-solid fa-pencil text-xs"></i></button>
                                 <button onClick={() => handleDeleteItem(item.id)} className={`${actionButton} hover:bg-red-50 hover:text-red-600`} title="Usuń"><i className="fa-solid fa-trash-can text-xs"></i></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
}
import React, { useState, useEffect } from 'react';
import { firebaseApi } from '../../lib/firebase';
import LoadingSpinner from '../../components/LoadingSpinner';
import MessageBox from '../../components/MessageBox';
import { SHARED_STYLES } from '../../lib/helpers';
import LeafletEditor from './LeafletEditor';

export default function LeafletsModule() {
    const [isLoading, setIsLoading] = useState(true);
    const [leaflets, setLeaflets] = useState([]);
    const [message, setMessage] = useState({ text: '', type: 'info' });
    const [view, setView] = useState('list'); 
    const [editingLeaflet, setEditingLeaflet] = useState(null);

    const fetchLeaflets = async () => {
        setIsLoading(true);
        try {
            const data = await firebaseApi.fetchCollection('leaflets_entries', { orderBy: { field: 'name', direction: 'asc' } });
            setLeaflets(data);
        } catch (error) {
            setMessage({ text: 'Błąd podczas ładowania listy ulotek.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'list') {
            fetchLeaflets();
        }
    }, [view]);

    const handleAddNew = () => {
        setEditingLeaflet(null);
        setView('editor');
    };

    const handleEdit = (leaflet) => {
        setEditingLeaflet(leaflet);
        setView('editor');
    };

    const handleDelete = async (leafletId, leafletName) => {
        if (window.confirm(`Czy na pewno chcesz usunąć ulotkę "${leafletName}"?`)) {
            setIsLoading(true);
            try {
                await firebaseApi.deleteDocument('leaflets_entries', leafletId);
                setMessage({ text: 'Ulotka została usunięta.', type: 'success' });
                fetchLeaflets();
            } catch (error) {
                setMessage({ text: 'Wystąpił błąd podczas usuwania.', type: 'error' });
                setIsLoading(false);
            }
        }
    };

    const handleReturnToList = () => {
        setView('list');
        setEditingLeaflet(null);
    };

    return (
        <div className="max-w-7xl mx-auto">
            {view === 'list' ? (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Zarządzanie Ulotkami</h2>
                        <button onClick={handleAddNew} className={SHARED_STYLES.toolbar.primaryButton}>
                            <i className="fa-solid fa-plus mr-2"></i>Nowa ulotka
                        </button>
                    </div>
                    <MessageBox message={message.text} type={message.type} onDismiss={() => setMessage({ text: '', type: 'info' })} />

                    {isLoading ? <LoadingSpinner /> : leaflets.length === 0 ? (
                        <div className="text-center text-gray-500 py-16">
                            <i className="fa-solid fa-file-alt fa-3x text-gray-300 mb-4"></i>
                            <p className="font-semibold">Brak zapisanych ulotek.</p>
                            <p className="text-sm">Kliknij "Nowa ulotka", aby stworzyć pierwszą.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="hidden md:grid grid-cols-12 gap-4 px-4 text-left text-xs font-bold text-gray-500 uppercase">
                                <div className="col-span-6">Nazwa robocza</div>
                                <div className="col-span-4">Tytuł na okładce</div>
                                <div className="col-span-2 text-right">Akcje</div>
                            </div>
                            {leaflets.map(leaflet => (
                                <div key={leaflet.id} className="bg-white p-4 rounded-lg shadow-sm grid grid-cols-2 md:grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors">
                                    <div className="col-span-2 md:col-span-6">
                                        <p className="font-semibold text-blue-800">{leaflet.name}</p>
                                    </div>
                                    <div className="md:col-span-4">
                                        <p className="md:hidden text-xs font-bold text-gray-500 uppercase">Tytuł</p>
                                        <p>{leaflet.title}</p>
                                    </div>
                                    <div className="flex items-center justify-start md:justify-end gap-2 col-span-2">
                                        <button onClick={() => handleEdit(leaflet)} className={SHARED_STYLES.toolbar.iconButton} style={{height: '32px', width: '32px'}} title="Edytuj"><i className="fa-solid fa-pencil text-sm"></i></button>
                                        <button onClick={() => handleDelete(leaflet.id, leaflet.name)} className={`${SHARED_STYLES.toolbar.iconButton} hover:text-red-600`} style={{height: '32px', width: '32px'}} title="Usuń"><i className="fa-solid fa-trash-can text-sm"></i></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <LeafletEditor 
                    initialLeaflet={editingLeaflet}
                    onSaveSuccess={handleReturnToList}
                    onCancel={handleReturnToList}
                />
            )}
        </div>
    );
}
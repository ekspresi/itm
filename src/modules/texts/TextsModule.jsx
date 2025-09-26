import React, { useState, useEffect } from 'react';
import { firebaseApi } from '../../lib/firebase';
import LoadingSpinner from '../../components/LoadingSpinner';
import MessageBox from '../../components/MessageBox';
import TextModal from './TextModal';
import { SHARED_STYLES } from '../../lib/helpers';

export default function TextsModule() {
    const [isLoading, setIsLoading] = useState(true);
    const [texts, setTexts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingText, setEditingText] = useState(null);
    const [message, setMessage] = useState({ text: '', type: 'info' });

    const fetchTexts = async () => {
        setIsLoading(true);
        try {
            const data = await firebaseApi.fetchCollection('texts_entries', { orderBy: { field: 'createdAt', direction: 'desc' } });
            setTexts(data);
        } catch (error) {
            console.error("Błąd pobierania tekstów:", error);
            setMessage({ text: 'Nie udało się pobrać listy tekstów.', type: 'error' });
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchTexts();
    }, []);

    const handleOpenAddModal = () => {
        setEditingText(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (text) => {
        setEditingText(text);
        setIsModalOpen(true);
    };

    const handleSaveText = async (textData) => {
        setIsLoading(true);
        try {
            let dataToSave = { ...textData };
            if (!dataToSave.id) {
                dataToSave.createdAt = new Date();
            }
            await firebaseApi.saveDocument('texts_entries', dataToSave);
            setMessage({ text: textData.id ? 'Tekst zaktualizowany.' : 'Tekst dodany.', type: 'success' });
            setIsModalOpen(false);
            fetchTexts();
        } catch (error) {
            console.error("Błąd zapisu tekstu:", error);
            setMessage({ text: 'Wystąpił błąd podczas zapisu.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteText = async (textId) => {
        if (window.confirm('Czy na pewno chcesz usunąć ten wpis?')) {
            setIsLoading(true);
            try {
                await firebaseApi.deleteDocument('texts_entries', textId);
                setMessage({ text: 'Tekst usunięty.', type: 'success' });
                fetchTexts();
            } catch (error) {
                console.error("Błąd usuwania tekstu:", error);
                setMessage({ text: 'Wystąpił błąd podczas usuwania.', type: 'error' });
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <TextModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveText}
                isLoading={isLoading}
                editingText={editingText}
            />
            <div className="flex justify-end items-center mb-6">
                <button onClick={handleOpenAddModal} className={SHARED_STYLES.toolbar.primaryButton}>
                    <i className="fa-solid fa-plus mr-2"></i>Tekst
                </button>
            </div>
            <MessageBox message={message.text} type={message.type} onDismiss={() => setMessage({ text: '', type: 'info' })} />
            {isLoading ? <LoadingSpinner /> : (
                <div className="space-y-2">
                    <div className="hidden md:grid grid-cols-12 gap-4 px-4 text-left text-xs font-bold text-gray-500 uppercase">
                        <div className="col-span-10">Tytuł</div>
                        <div className="col-span-2 text-right">Akcje</div>
                    </div>
                    {texts.length === 0 ? (
                         <div className="text-center text-gray-500 py-16">
                            <i className="fa-solid fa-book fa-3x text-gray-300 mb-4"></i>
                            <p className="font-semibold">Brak wpisów.</p>
                            <p className="text-sm">Użyj przycisku "+ Tekst", aby dodać pierwszy wpis.</p>
                        </div>
                    ) : (
                        texts.map(text => (
                            <div key={text.id} className="bg-white p-4 rounded-lg shadow-sm grid grid-cols-2 md:grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors">
                                <div className="col-span-2 md:col-span-10">
                                    <p className="font-semibold text-blue-800">{text.title_pl}</p>
                                </div>
                                <div className="flex items-center justify-start md:justify-end gap-2 col-span-2">
                                    <button onClick={() => handleOpenEditModal(text)} className={SHARED_STYLES.toolbar.iconButton} style={{height: '32px', width: '32px'}} title="Edytuj">
                                        <i className="fa-solid fa-pencil text-sm"></i>
                                    </button>
                                    <button onClick={() => handleDeleteText(text.id)} className={`${SHARED_STYLES.toolbar.iconButton} hover:text-red-600`} style={{height: '32px', width: '32px'}} title="Usuń">
                                        <i className="fa-solid fa-trash-can text-sm"></i>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
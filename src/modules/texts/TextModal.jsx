import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { SHARED_STYLES } from '../../lib/helpers';

export default function TextModal({ isOpen, onClose, onSave, isLoading, editingText }) {
    const initialTextState = {
        title_pl: '', title_de: '', title_en: '', title_cz: '',
        short_desc_pl: '', short_desc_de: '', short_desc_en: '', short_desc_cz: '',
        long_desc_pl: '', long_desc_de: '', long_desc_en: '', long_desc_cz: '',
        imageUrl: '', thumbnailUrl: '',
    };
    const [textData, setTextData] = useState(initialTextState);
    const [activeLang, setActiveLang] = useState('pl');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTextData(editingText || initialTextState);
            setActiveLang('pl');
            setUploadError('');
        }
    }, [isOpen, editingText]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTextData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setUploadProgress(0);
        setUploadError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('module', 'texts');

        const uploadUrl = 'https://visit-mikolajki.pl/imageUpload.php';

        try {
            const response = await fetch(uploadUrl, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Błąd serwera: ${response.statusText}`);
            }

            const result = await response.json();
            setTextData(prev => ({ 
                ...prev, 
                imageUrl: result.imageUrl, 
                thumbnailUrl: result.thumbnailUrl 
            }));

        } catch (error) {
            console.error('Błąd podczas wgrywania pliku:', error);
            setUploadError(`Błąd wgrywania: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = () => {
        if (!textData.title_pl.trim()) {
            alert("Tytuł w języku polskim jest wymagany.");
            return;
        }
        onSave(textData);
    };

    const modalFooter = (
        <>
            <button onClick={onClose} disabled={isLoading} className={SHARED_STYLES.buttons.secondary}>Anuluj</button>
            <button onClick={handleSave} disabled={isLoading || isUploading} className={SHARED_STYLES.buttons.primary}>
                {isLoading ? 'Zapisywanie...' : (editingText ? 'Zapisz zmiany' : 'Zapisz tekst')}
            </button>
        </>
    );
    const title = editingText ? `Edytuj tekst: ${textData.title_pl}` : "Dodaj nowy tekst";
    const langTabs = [{ key: 'pl', label: 'Polski' }, { key: 'de', label: 'Niemiecki' }, { key: 'en', label: 'Angielski' }, { key: 'cz', label: 'Czeski' }];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} footer={modalFooter} maxWidth="max-w-4xl">
            <div className="space-y-4">
                <div className="flex border-b">
                    {langTabs.map(tab => (
                        <button key={tab.key} onClick={() => setActiveLang(tab.key)} className={`${SHARED_STYLES.tabs.base} ${activeLang === tab.key ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>{tab.label}</button>
                    ))}
                </div>
                
                <FormField label={`Tytuł (${activeLang.toUpperCase()})`}>
                    <input type="text" value={textData[`title_${activeLang}`] || ''} onChange={handleChange} name={`title_${activeLang}`} className="w-full p-2 border border-gray-300 rounded-md" />
                </FormField>
                <FormField label={`Krótki opis (${activeLang.toUpperCase()})`}>
                    <textarea value={textData[`short_desc_${activeLang}`] || ''} onChange={handleChange} name={`short_desc_${activeLang}`} rows="3" className="w-full p-2 border border-gray-300 rounded-md"></textarea>
                </FormField>
                <FormField label={`Długi opis (${activeLang.toUpperCase()})`}>
                     <textarea value={textData[`long_desc_${activeLang}`] || ''} onChange={handleChange} name={`long_desc_${activeLang}`} rows="8" className="w-full p-2 border border-gray-300 rounded-md"></textarea>
                </FormField>

                <div className="pt-4 border-t">
                    <FormField label="Grafika" htmlFor="file-upload-text">
                        <div className="mt-1"><input type="file" id="file-upload-text" className="hidden" onChange={handleFileSelect} accept="image/png, image/jpeg" /><label htmlFor="file-upload-text" className="cursor-pointer bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm py-2 px-4 border border-gray-300 rounded-md shadow-sm"><i className="fa-solid fa-upload mr-2"></i> Wybierz plik...</label></div>
                        {isUploading && <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div></div>}
                        {uploadError && <p className="text-red-600 text-sm mt-2">{uploadError}</p>}
                        {textData.thumbnailUrl && !isUploading && (<div className="mt-2"><img src={textData.thumbnailUrl} alt="Podgląd miniatury" className="w-48 h-auto rounded-md shadow-md" /></div>)}
                    </FormField>
                </div>
            </div>
        </Modal>
    );
};
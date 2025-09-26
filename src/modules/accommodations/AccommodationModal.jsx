import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import ToggleSwitch from '../../components/ToggleSwitch';
import ButtonSelectGroup from '../../components/ButtonSelectGroup';
import { storage } from '../../lib/firebase';

// TODO: Wklej tutaj swoją prawdziwą implementację funkcji getResizedUrl
const getResizedUrl = (url, size) => {
  console.warn('Użyto zastępczej funkcji getResizedUrl. Zastąp ją swoją implementacją.');
  return url;
};

export default function AccommodationModal({ isOpen, onClose, onSave, editingAccommodation, config, isLoading, onDelete }) {
    const initialAccommodationState = { name: '', description: '', isSeasonal: true, address: '', phone: '', email: '', website: '', capacity: '', isFeatured: false, imageUrl: '', thumbnailUrl: '', categoryIds: [], attributeIds: [], languageIds: [], location: 'city', travelhostIds: [] };    
    const [accommodationData, setAccommodationData] = useState(initialAccommodationState);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [validationError, setValidationError] = useState('');
    const [currentTravelhostId, setCurrentTravelhostId] = useState('');

    const handleAddTravelhostId = () => {
        const newId = currentTravelhostId.trim();
        if (newId && !(accommodationData.travelhostIds || []).includes(newId)) {
            const updatedIds = [...(accommodationData.travelhostIds || []), newId];
            setAccommodationData(prev => ({ ...prev, travelhostIds: updatedIds }));
            setCurrentTravelhostId('');
        }
    };

    const handleRemoveTravelhostId = (idToRemove) => {
        const updatedIds = (accommodationData.travelhostIds || []).filter(i => i !== idToRemove);
        setAccommodationData(prev => ({ ...prev, travelhostIds: updatedIds }));
    };

    useEffect(() => {
        if (isOpen) {
            if (editingAccommodation) {
                let dataToSet = { ...initialAccommodationState, ...editingAccommodation, travelhostIds: editingAccommodation.travelhostIds || [] };
                if (editingAccommodation.travelhostId && (!dataToSet.travelhostIds || dataToSet.travelhostIds.length === 0)) {
                    dataToSet.travelhostIds = [editingAccommodation.travelhostId];
                }
                setAccommodationData(dataToSet);
            } else {
                setAccommodationData(initialAccommodationState);
            }
            setIsUploading(false);
            setUploadProgress(0);
            setValidationError('');
            setCurrentTravelhostId('');
        }
    }, [isOpen, editingAccommodation]);

    const handleChange = (e) => { const { name, value } = e.target; setAccommodationData(prev => ({ ...prev, [name]: value })); };

    const handleCheckboxChange = useCallback((key, id) => {
        setAccommodationData(prev => {
            const currentIds = new Set(prev[key] || []);
            if (currentIds.has(id)) { currentIds.delete(id); } else { currentIds.add(id); }
            return { ...prev, [key]: Array.from(currentIds) };
        });
    }, []);

    const handleSave = () => {
        setValidationError('');
        if (!accommodationData.name || accommodationData.name.trim() === '') { setValidationError('Pole "Nazwa obiektu" jest wymagane.'); return; }
        const { travelhostId, ...dataToSave } = accommodationData;
        onSave(dataToSave);
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        setUploadProgress(0);
        const uploadFile = (fileToUpload, onProgress) => {
             return new Promise((resolve, reject) => {
                const filePath = `accommodations/${Date.now()}_${fileToUpload.name}`;
                const fileRef = storage.ref(filePath);
                const uploadTask = fileRef.put(fileToUpload);
                uploadTask.on('state_changed', 
                    (snapshot) => {
                        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                        onProgress(progress);
                    }, 
                    (error) => { reject(error); }, 
                    () => {
                        uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                            resolve({ 
                                imageUrl: getResizedUrl(downloadURL, '1920x1920'), 
                                thumbnailUrl: getResizedUrl(downloadURL, '350x350')
                            });
                        });
                    }
                );
            });
        };
        const urls = await uploadFile(file, setUploadProgress);
        if (urls) {
            setAccommodationData(prev => ({ ...prev, imageUrl: urls.imageUrl, thumbnailUrl: urls.thumbnailUrl }));
        }
        setIsUploading(false);
    };

    const modalFooter = (
        <>
            <div>
                {editingAccommodation && (<button type="button" onClick={() => onDelete(editingAccommodation.id)} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg">Usuń</button>)}
            </div>
            <div className="flex space-x-3">
                <button onClick={onClose} disabled={isLoading} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg">Anuluj</button>
                <button onClick={handleSave} disabled={isLoading || isUploading} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg disabled:bg-gray-400">{isLoading ? 'Zapisywanie...' : (editingAccommodation ? 'Zapisz zmiany' : 'Zapisz obiekt')}</button>
            </div>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingAccommodation ? `Edytuj obiekt: ${accommodationData.name}` : "Dodaj nowy obiekt noclegowy"} footer={modalFooter} maxWidth="max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    <FormField label="Nazwa obiektu *" htmlFor="name"><input type="text" id="name" name="name" className="w-full p-2 border border-gray-300 rounded-md" value={accommodationData.name} onChange={handleChange} required /></FormField>
                    <FormField label="Adres" htmlFor="address"><input type="text" id="address" name="address" className="w-full p-2 border border-gray-300 rounded-md" value={accommodationData.address} onChange={handleChange} /></FormField>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Telefon" htmlFor="phone"><input type="text" id="phone" name="phone" className="w-full p-2 border border-gray-300 rounded-md" value={accommodationData.phone} onChange={handleChange} /></FormField>
                        <FormField label="E-mail" htmlFor="email"><input type="email" id="email" name="email" className="w-full p-2 border border-gray-300 rounded-md" value={accommodationData.email} onChange={handleChange} /></FormField>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Strona WWW" htmlFor="website"><input type="url" id="website" name="website" placeholder="https://..." className="w-full p-2 border border-gray-300 rounded-md" value={accommodationData.website} onChange={handleChange} /></FormField>
                        <FormField label="Liczba miejsc" htmlFor="capacity"><input type="number" id="capacity" name="capacity" className="w-full p-2 border border-gray-300 rounded-md" value={accommodationData.capacity} onChange={handleChange} /></FormField>
                    </div>
                    <FormField label="Travelhost ID" htmlFor="travelhostId">
                        <div className="space-y-1 mb-2">
                            {(accommodationData.travelhostIds || []).map(id => (
                                <div key={id} className="flex items-center justify-between bg-gray-100 text-sm p-2 rounded-md">
                                    <span className="font-medium truncate">{id}</span>
                                    <button type="button" onClick={() => handleRemoveTravelhostId(id)} className="text-red-500 hover:text-red-700" title="Usuń">
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex space-x-2">
                            <input 
                                type="text" 
                                id="travelhostId" 
                                placeholder="Wpisz ID i dodaj..." 
                                className="w-full p-2 border border-gray-300 rounded-md" 
                                value={currentTravelhostId} 
                                onChange={e => setCurrentTravelhostId(e.target.value)} 
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTravelhostId(); } }} 
                            />
                            <button 
                                type="button" 
                                onClick={handleAddTravelhostId} 
                                className="bg-blue-600 text-white px-4 rounded-md hover:bg-blue-700 shrink-0 disabled:bg-gray-300" 
                                disabled={!currentTravelhostId.trim()}
                            >
                                Dodaj
                            </button>
                        </div>
                    </FormField>
                    <FormField label="Opis" htmlFor="description"><textarea id="description" name="description" rows="8" className="w-full p-2 border border-gray-300 rounded-md" value={accommodationData.description} onChange={handleChange}></textarea></FormField>
                </div>
                <div className="space-y-4">
                    <div className="space-y-4 p-4 border rounded-md bg-gray-50/50">
                        <ToggleSwitch label="W mieście" enabled={accommodationData.location === 'city'} setEnabled={(value) => setAccommodationData(prev => ({ ...prev, location: value ? 'city' : 'municipality' }))} options={['Nie', 'Tak']} />
                        <ToggleSwitch label="Sezonowy" enabled={accommodationData.isSeasonal} setEnabled={(value) => setAccommodationData(prev => ({ ...prev, isSeasonal: value }))} options={['Nie', 'Tak']} />
                        <ToggleSwitch label="Wyróżnij obiekt" enabled={accommodationData.isFeatured} setEnabled={(value) => setAccommodationData(prev => ({ ...prev, isFeatured: value }))} options={['Nie', 'Tak']} />
                    </div>
                    <div>
                        <FormField label="Grafika" htmlFor="imageUrl">
                            <div className="mt-1"><input type="file" id="file-upload-accommodation" className="hidden" onChange={handleFileSelect} accept="image/png, image/jpeg" /><label htmlFor="file-upload-accommodation" className="cursor-pointer bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm py-2 px-4 border border-gray-300 rounded-md shadow-sm"><i className="fa-solid fa-upload mr-2"></i> Wybierz plik...</label></div>
                        </FormField>
                    </div>
                    <div>
                        <ButtonSelectGroup title="Kategorie obiektu" items={config.categories} selectedIds={accommodationData.categoryIds} onToggle={(id) => handleCheckboxChange('categoryIds', id)} />
                        <ButtonSelectGroup title="Atrybuty obiektu" items={config.attributes} selectedIds={accommodationData.attributeIds} onToggle={(id) => handleCheckboxChange('attributeIds', id)} />
                        <ButtonSelectGroup title="Języki obsługi" items={config.languages} selectedIds={accommodationData.languageIds} onToggle={(id) => handleCheckboxChange('languageIds', id)} />
                    </div>
                </div>
            </div>
            {validationError && (<div className="pt-4 text-center"><p className="text-red-600 font-semibold">{validationError}</p></div>)}
        </Modal>
    );
};
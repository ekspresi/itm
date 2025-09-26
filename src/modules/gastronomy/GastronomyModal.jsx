import React, { useState, useEffect, useRef } from 'react';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import NumberInput from '../../components/NumberInput';
import ToggleSwitch from '../../components/ToggleSwitch';
import { SHARED_STYLES } from '../../lib/helpers';
import { callCloudFunction, firebaseApi } from '../../lib/firebase';
import firebase from 'firebase/compat/app'; // Potrzebny do wywołania funkcji chmurowej
import { convertGoogleHoursToEditorFormat } from '../../lib/helpers';

export default function GastronomyModal({ isOpen, onClose, onSave, isLoading, editingPlace, config, setMessage }) {
    const initialPlaceState = { 
        name: '', custom_description_pl: '', category_ids: [], cuisine_ids: [], 
        managed_by_google: true, google_place_id: '', address_formatted: '', 
        phone: '', website: '', google_maps_url: '', status: 'OPERATIONAL', 
        rating: '', latitude: '', longitude: '', servesBreakfast: false, 
        servesLunch: false, servesDinner: false, servesBeer: false, servesWine: false, 
        reservable: false, dineIn: true, takeout: false, delivery: false, 
        outdoorSeating: false, goodForChildren: false, wheelchairAccessibleEntrance: false, 
        wheelchairAccessibleParking: false, wheelchairAccessibleRestroom: false,
        opening_hours: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
        imageUrl: '', thumbnailUrl: '', squareThumbnailUrl: '', image_alt_text: ''
    };
    const [placeData, setPlaceData] = useState(initialPlaceState);
    const [isFetching, setIsFetching] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const statusDropdownRef = React.useRef(null);
    const [isFetchingHours, setIsFetchingHours] = useState(false); // Nowy stan dla nowego przycisku

        const handleFetchHours = async () => {
        if (!placeData.google_place_id) {
            alert("Wklej Google Place ID.");
            return;
        }
        setIsFetchingHours(true);
        try {
            const updateFunction = firebase.app().functions('europe-central2').httpsCallable('updateGastronomyHours');
            const result = await updateFunction({ placeId: placeData.google_place_id });
            
            if (result.data.success) {
                const updatedData = result.data.data;
                const editorFriendlyHours = convertGoogleHoursToEditorFormat(updatedData.opening_hours);
                
                setPlaceData(prev => ({
                    ...prev,
                    opening_hours: editorFriendlyHours,
                    status: updatedData.status
                }));
                setMessage({ text: "Godziny i status zostały zaktualizowane.", type: 'success' });
            } else { throw new Error(result.data.error); }
        } catch (error) {
            setMessage({ text: `Błąd: ${error.message}`, type: 'error' });
        } finally {
            setIsFetchingHours(false);
        }
    };

    const statusOptions = [
        { id: 'OPERATIONAL', name: 'Działający' },
        { id: 'CLOSED_TEMPORARILY', name: 'Tymczasowo zamknięty' },
        { id: 'CLOSED_PERMANENTLY', name: 'Zamknięty na stałe' },
    ];

    useEffect(() => {
        if (isOpen) {
            setPlaceData(editingPlace ? { ...initialPlaceState, ...editingPlace } : initialPlaceState);
            setUploadError('');
        }
    }, [isOpen, editingPlace]);

    // Zamykanie dropdownu statusu po kliknięciu na zewnątrz
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
                setIsStatusDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [statusDropdownRef]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setPlaceData(prev => ({ ...prev, [name]: value }));
    };
            
            const handleCheckboxChange = (key, id) => {
                setPlaceData(prev => {
                    const currentIds = new Set(prev[key] || []);
                    if (currentIds.has(id)) { currentIds.delete(id); } else { currentIds.add(id); }
                    return { ...prev, [key]: Array.from(currentIds) };
                });
            };

    const handleFetchFromGoogle = async () => {
        if (!placeData.google_place_id) {
            alert("Wklej Google Place ID, aby pobrać dane.");
            return;
        }
        setIsFetching(true);
        try {
            const result = await callCloudFunction('getGastronomyPlaceDetails', { placeId: placeData.google_place_id });
            if (result.success) {
                const googleData = result.data;
                
                // ZMIANA: Konwertujemy godziny na właściwy format PRZED zapisaniem do stanu
                const editorFriendlyHours = convertGoogleHoursToEditorFormat(googleData.opening_hours);
                
                setPlaceData(prev => ({ 
                    ...prev, 
                    ...googleData, 
                    opening_hours: editorFriendlyHours // Nadpisujemy godziny sformatowaną wersją
                }));
                
                setMessage({ text: "Dane z Google zostały pobrane i wczytane do formularza.", type: 'success' });
            } else { 
                throw new Error(result.error); 
            }
        } catch (error) {
            setMessage({ text: `Wystąpił błąd: ${error.message}`, type: 'error' });
        } finally {
            setIsFetching(false);
        }
    };

        // NOWOŚĆ: Funkcje skopiowane z AttractionModal do obsługi godzin
    const handleTimeRangeChange = (day, rangeIndex, value) => setPlaceData(p => ({...p, opening_hours: {...p.opening_hours, [day]: p.opening_hours[day].map((r, i) => i === rangeIndex ? value : r)}}));
    const handleAddTimeRange = (day) => setPlaceData(p => ({...p, opening_hours: {...p.opening_hours, [day]: [...(p.opening_hours[day] || []), "09:00-17:00"]}}));
    const handleRemoveTimeRange = (day, rangeIndex) => setPlaceData(p => ({...p, opening_hours: {...p.opening_hours, [day]: p.opening_hours[day].filter((_, i) => i !== rangeIndex)}}));
    const handleCopyHours = (sourceDay) => {
        if (!window.confirm(`Skopiować godziny z tego dnia do pozostałych?`)) return;
        setPlaceData(p => {
            const ranges = p.opening_hours[sourceDay] || [];
            const newHours = { ...p.opening_hours };
            Object.keys(newHours).forEach(day => { newHours[day] = [...ranges]; });
            return { ...p, opening_hours: newHours };
        });
    };

    // NOWOŚĆ: Funkcja do uploadu grafiki
    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        setUploadError('');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('module', 'gastronomy');
        const uploadUrl = 'https://visit-mikolajki.pl/imageUpload.php';

        try {
            const response = await fetch(uploadUrl, { method: 'POST', body: formData });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Błąd serwera: ${response.statusText}`);
            }
            const result = await response.json();
            setPlaceData(prev => ({ ...prev, imageUrl: result.imageUrl, thumbnailUrl: result.thumbnailUrl, squareThumbnailUrl: result.squareThumbnailUrl }));
        } catch (error) {
            setUploadError(`Błąd wgrywania: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const modalFooter = (<>
        <button onClick={onClose} className={SHARED_STYLES.buttons.secondary}>Anuluj</button>
        <button onClick={() => onSave(placeData)} disabled={isLoading} className={SHARED_STYLES.buttons.primary}>
            {isLoading ? 'Zapisywanie...' : (editingPlace ? 'Zapisz zmiany' : 'Dodaj obiekt')}
        </button>
    </>);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingPlace ? `Edytuj: ${placeData.name}` : "Dodaj nowy obiekt"} footer={modalFooter} maxWidth="max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lewa kolumna */}
                <div className="space-y-4">
                    <FormField label="Nazwa obiektu"><input type="text" name="name" value={placeData.name || ''} onChange={handleChange} className="w-full p-2 border rounded-md"/></FormField>
                    {/* ZMIANA: Etykieta "Adres" */}
                    <FormField label="Adres"><input type="text" name="address_formatted" value={placeData.address_formatted || ''} onChange={handleChange} className="w-full p-2 border rounded-md"/></FormField>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Telefon"><input type="text" name="phone" value={placeData.phone || ''} onChange={handleChange} className="w-full p-2 border rounded-md"/></FormField>
                        <FormField label="Strona WWW"><input type="url" name="website" value={placeData.website || ''} onChange={handleChange} className="w-full p-2 border rounded-md"/></FormField>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <FormField label="Szer. geo. (lat)"><input type="text" name="latitude" value={placeData.latitude || ''} onChange={handleChange} className="w-full p-2 border rounded-md"/></FormField>
                         <FormField label="Dł. geo. (lng)"><input type="text" name="longitude" value={placeData.longitude || ''} onChange={handleChange} className="w-full p-2 border rounded-md"/></FormField>
                    </div>
                    <FormField label="Link do Google Maps"><input type="url" name="google_maps_url" value={placeData.google_maps_url || ''} onChange={handleChange} className="w-full p-2 border rounded-md"/></FormField>
                    
                    {/* ZMIANA: Przeniesione pola Google ID i Grafiki */}
                    <FormField label="Google Place ID">
                        <div className="flex gap-2">
                            <input type="text" name="google_place_id" value={placeData.google_place_id || ''} onChange={handleChange} className="w-full p-2 border rounded-md"/>
                            <button onClick={handleFetchFromGoogle} disabled={isFetching} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-9 px-4 rounded-md shrink-0">{isFetching ? <i className="fa-solid fa-spinner fa-spin"></i> : "Pobierz"}</button>
                        </div>
                    </FormField>
                    {/* ZMIANA: Przeniesiona sekcja Grafiki z dodatkowym polem */}
                    <div className="p-4 border rounded-lg bg-gray-50/50 space-y-3">
                        <FormField label="Grafika">
                            <div className="mt-1">
                                <input type="file" id="file-upload-gastro" className="hidden" onChange={handleFileSelect} accept="image/png, image/jpeg" />
                                <label htmlFor="file-upload-gastro" className="cursor-pointer bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm py-2 px-4 border border-gray-300 rounded-md shadow-sm">
                                    <i className="fa-solid fa-upload mr-2"></i> Wybierz plik...
                                </label>
                            </div>
                            {isUploading && <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `0%` }}></div></div>}
                            {uploadError && <p className="text-red-600 text-sm mt-2">{uploadError}</p>}
                            {(placeData.thumbnailUrl || placeData.google_photo_url) && !isUploading && (
                                <div className="mt-2">
                                    <img src={placeData.thumbnailUrl || placeData.google_photo_url} alt="Podgląd" className="w-48 h-auto rounded-md shadow-md" />
                                </div>
                            )}
                        </FormField>
                        {/* NOWOŚĆ: Pole na tekst alternatywny */}
                        <FormField label="Tekst alternatywny (autor)">
                            <input 
                                type="text" 
                                name="image_alt_text" 
                                value={placeData.image_alt_text || ''} 
                                onChange={handleChange} 
                                className="w-full p-2 border rounded-md"
                            />
                        </FormField>
                    </div>
                </div>

                {/* Prawa kolumna */}
                <div className="space-y-4">
                     <div className="p-3 border rounded-lg space-y-3">
                        <h3 className="text-sm font-bold text-gray-700 mb-2">Synchronizacja</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {/* ZMIANA: Dodajemy nowy przycisk */}
                            <ToggleSwitch label="Synchronizuj godziny" enabled={placeData.managed_by_google} setEnabled={val => setPlaceData(prev => ({...prev, managed_by_google: val}))} />
                            <button onClick={handleFetchHours} disabled={isFetchingHours} className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold h-9 px-4 rounded-md text-xs">
                                {isFetchingHours ? <i className="fa-solid fa-spinner fa-spin"></i> : "Odśwież teraz"}
                            </button>
                        </div>
                    </div>
                    <div className="p-3 border rounded-lg space-y-3">
                        <h3 className="text-sm font-bold text-gray-700 mb-2">Opcje i Atrybuty</h3>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            {/* ZMIANA: Pole Status jako lista wyboru */}
                             <FormField label="Status">
                                <div className="relative" ref={statusDropdownRef}>
                                    <button type="button" onClick={() => setIsStatusDropdownOpen(p => !p)} className="w-full text-left p-2 border bg-white rounded-md flex justify-between items-center h-9">
                                        <span>{(statusOptions.find(o => o.id === placeData.status) || {}).name || 'Wybierz...'}</span><i className={`fa-solid fa-chevron-down text-xs transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`}></i>
                                    </button>
                                    {isStatusDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border shadow-lg rounded-lg z-10">
                                            {statusOptions.map(opt => <button key={opt.id} type="button" onClick={() => { setPlaceData(p => ({...p, status: opt.id})); setIsStatusDropdownOpen(false); }} className={`${SHARED_STYLES.buttonSelect.base} ${placeData.status === opt.id ? SHARED_STYLES.buttonSelect.active : SHARED_STYLES.buttonSelect.inactive}`}>{opt.name}</button>)}
                                        </div>
                                    )}
                                </div>
                            </FormField>
                            <ToggleSwitch label="Ogródek" enabled={placeData.outdoorSeating} setEnabled={val => setPlaceData(prev => ({...prev, outdoorSeating: val}))} />
                            <ToggleSwitch label="Na miejscu" enabled={placeData.dineIn} setEnabled={val => setPlaceData(prev => ({...prev, dineIn: val}))} />
                            <ToggleSwitch label="Na wynos" enabled={placeData.takeout} setEnabled={val => setPlaceData(prev => ({...prev, takeout: val}))} />
                            <ToggleSwitch label="Dostawa" enabled={placeData.delivery} setEnabled={val => setPlaceData(prev => ({...prev, delivery: val}))} />
                            <ToggleSwitch label="Rezerwacje" enabled={placeData.reservable} setEnabled={val => setPlaceData(prev => ({...prev, reservable: val}))} />
                            <ToggleSwitch label="Dla dzieci" enabled={placeData.goodForChildren} setEnabled={val => setPlaceData(prev => ({...prev, goodForChildren: val}))} />
                        </div>
                    </div>
                     <div className="border p-3 rounded-lg space-y-3">
                        <h3 className="text-sm font-bold text-gray-700 mb-2">Oferta</h3>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            <ToggleSwitch label="Śniadania" enabled={placeData.servesBreakfast} setEnabled={val => setPlaceData(prev => ({...prev, servesBreakfast: val}))} />
                            <ToggleSwitch label="Lunch" enabled={placeData.servesLunch} setEnabled={val => setPlaceData(prev => ({...prev, servesLunch: val}))} />
                            <ToggleSwitch label="Kolacje" enabled={placeData.servesDinner} setEnabled={val => setPlaceData(prev => ({...prev, servesDinner: val}))} />
                        </div>
                    </div>
                     <div className="border p-3 rounded-lg space-y-3">
                        <h3 className="text-sm font-bold text-gray-700 mb-2">Ułatwienia dostępu</h3>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            <ToggleSwitch label="Wejście dla wózków" enabled={placeData.wheelchairAccessibleEntrance} setEnabled={val => setPlaceData(prev => ({...prev, wheelchairAccessibleEntrance: val}))} />
                            <ToggleSwitch label="Parking dla wózków" enabled={placeData.wheelchairAccessibleParking} setEnabled={val => setPlaceData(prev => ({...prev, wheelchairAccessibleParking: val}))} />
                            <ToggleSwitch label="Toaleta dla wózków" enabled={placeData.wheelchairAccessibleRestroom} setEnabled={val => setPlaceData(prev => ({...prev, wheelchairAccessibleRestroom: val}))} />
                        </div>
                    </div>
                </div>
            </div>
            {/* ZMIANA: Poprawiona sekcja z edytorem godzin otwarcia */}
            <div className="md:col-span-2 pt-4 border-t mt-4">
                 <h3 className="text-sm font-bold text-gray-700 mb-2">Godziny otwarcia</h3>
                 <div className="space-y-3 p-3 bg-gray-50/50 rounded-lg border">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                        const dayNames = { monday: 'Pon', tuesday: 'Wt', wednesday: 'Śr', thursday: 'Czw', friday: 'Pt', saturday: 'So', sunday: 'Nd' };
                        // POPRAWKA: Upewniamy się, że `placeData.opening_hours` istnieje przed próbą dostępu do `day`
                        const ranges = placeData.opening_hours?.[day] || [];
                        return (
                            <div key={day} className="grid grid-cols-[50px_1fr_auto] gap-3 items-center">
                                <span className="font-semibold text-sm text-gray-600">{dayNames[day]}</span>
                                <div className="flex flex-wrap gap-2">
                                    {ranges.length === 0 && <p className="text-xs text-gray-500 italic">Zamknięte</p>}
                                    {ranges.map((range, index) => (
                                        <div key={index} className="flex items-center">
                                            <input type="text" value={range} onChange={(e) => handleTimeRangeChange(day, index, e.target.value)} placeholder="np. 10:00-18:00" className="w-32 p-1 border rounded-md text-sm" />
                                            <button type="button" onClick={() => handleRemoveTimeRange(day, index)} className="p-1 text-red-500 hover:text-red-700 text-lg">&times;</button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button type="button" onClick={() => handleAddTimeRange(day)} className="text-blue-600 hover:text-blue-800 w-6 h-6 flex items-center justify-center bg-white border rounded shadow-sm" title="Dodaj przedział"><i className="fa-solid fa-plus text-xs"></i></button>
                                    <button type="button" onClick={() => handleCopyHours(day)} className="text-gray-600 hover:text-blue-800 w-6 h-6 flex items-center justify-center bg-white border rounded shadow-sm" title="Kopiuj do wszystkich"><i className="fa-solid fa-copy text-xs"></i></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Modal>
    );
};
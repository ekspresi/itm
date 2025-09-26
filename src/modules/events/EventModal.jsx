import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import ButtonSelectGroup from '../../components/ButtonSelectGroup';
import ToggleSwitch from '../../components/ToggleSwitch';
import { SHARED_STYLES } from '../../lib/helpers';

export default function EventModal ({ isOpen, onCancel, categories, isLoading, eventData, setEventData, editingEvent, handleSaveEvent, handleFileUpload, onDelete }) {
    const [activeLang, setActiveLang] = useState('pl');
    const [hasSchedule, setHasSchedule] = useState(false);
    const [isPaid, setIsPaid] = useState(false);
    const [priceValue, setPriceValue] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setActiveLang('pl');
            const scheduleExists = (eventData.occurrences || []).some(occ => occ.schedule && occ.schedule.length > 0);
            setHasSchedule(scheduleExists);
            const paidStatus = eventData.priceInfo_pl !== 'Wstęp wolny';
            setIsPaid(paidStatus);
            setPriceValue(paidStatus ? parseInt(eventData.priceInfo_pl, 10) || '' : '');
        }
    }, [isOpen, eventData]);

    const handleChange = (e) => { const { name, value } = e.target; setEventData(prev => ({ ...prev, [name]: value })); };
    const handleCategoryCheckboxChange = useCallback((key, id) => { setEventData(prev => { const c = new Set(prev.categoryIds || []); if (c.has(id)) { c.delete(id); } else { c.add(id); } return { ...prev, categoryIds: Array.from(c) }; }); }, []);
    const handleScheduleToggle = (isChecked) => { 
        setHasSchedule(isChecked); 
        if (isChecked && (!eventData.occurrences[0].schedule || eventData.occurrences[0].schedule.length === 0)) { 
            handleAddScheduleItem(0); 
        } 
    };
    const handleFileSelect = async (e) => { 
        const file = e.target.files[0]; 
        if (!file) return; 
        setIsUploading(true); 
        const urls = await handleFileUpload(file, (progress) => {}); 
        if (urls) { 
            setEventData(prev => ({ ...prev, imageUrl: urls.fullSizeUrl, thumbnailUrl: urls.thumbnailUrl })); 
        } 
        setIsUploading(false); 
    };
    const handlePaidToggle = (isNowPaid) => { 
        setIsPaid(isNowPaid); 
        if (isNowPaid) { 
            setEventData(prev => ({ ...prev, priceInfo_pl: priceValue ? `${priceValue} zł` : '0 zł' })); 
        } else { 
            setEventData(prev => ({ ...prev, priceInfo_pl: 'Wstęp wolny' })); 
        } 
    };
    const handlePriceChange = (e) => { 
        const newPrice = e.target.value; 
        setPriceValue(newPrice); 
        setEventData(prev => ({ ...prev, priceInfo_pl: `${newPrice} zł` })); 
    };
    const handleOccurrenceChange = (index, field, value) => { 
        const newOccurrences = [...eventData.occurrences]; 
        newOccurrences[index][field] = value; 
        setEventData(prev => ({ ...prev, occurrences: newOccurrences })); 
    };
    const handleAddOccurrence = () => { 
        const lastOccurrence = eventData.occurrences[eventData.occurrences.length - 1];
        const lastDate = new Date(lastOccurrence.eventDate);
        lastDate.setDate(lastDate.getDate() + 1);
        const nextDayStr = lastDate.toISOString().slice(0, 10);
        const newOccurrence = { eventDate: nextDayStr, startTime: '', endTime: '', schedule: [] };
        setEventData(prev => ({ ...prev, occurrences: [...prev.occurrences, newOccurrence] })); 
    };
    const handleRemoveOccurrence = (index) => { 
        if (eventData.occurrences.length <= 1) return;
        const newOccurrences = eventData.occurrences.filter((_, i) => i !== index); 
        setEventData(prev => ({ ...prev, occurrences: newOccurrences })); 
    };
    const handleScheduleItemChange = (occurrenceIndex, itemIndex, field, value) => { 
        const newOccurrences = JSON.parse(JSON.stringify(eventData.occurrences)); 
        newOccurrences[occurrenceIndex].schedule[itemIndex][field] = value; 
        setEventData(prev => ({ ...prev, occurrences: newOccurrences })); 
    };
    const handleAddScheduleItem = (occurrenceIndex) => { 
        const newOccurrences = JSON.parse(JSON.stringify(eventData.occurrences)); 
        if (!newOccurrences[occurrenceIndex].schedule) { 
            newOccurrences[occurrenceIndex].schedule = []; 
        } 
        newOccurrences[occurrenceIndex].schedule.push({ time: '', title: '' });
        setEventData(prev => ({ ...prev, occurrences: newOccurrences })); 
    };
    const handleRemoveScheduleItem = (occurrenceIndex, itemIndex) => { 
        const newOccurrences = JSON.parse(JSON.stringify(eventData.occurrences)); 
        newOccurrences[occurrenceIndex].schedule.splice(itemIndex, 1); 
        setEventData(prev => ({ ...prev, occurrences: newOccurrences })); 
    };

    const modalFooter = (
        <>
            <div>{editingEvent && (<button type="button" onClick={() => onDelete(editingEvent.id)} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg">Usuń</button>)}</div>
            <div className="flex space-x-3"><button onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg">Anuluj</button><button onClick={handleSaveEvent} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">{isLoading ? 'Zapisywanie...' : (editingEvent ? 'Zapisz zmiany' : 'Zapisz wydarzenie')}</button></div>
        </>
    );

    const langTabs = [{ key: 'pl', label: 'Polski' }, { key: 'de', label: 'Niemiecki' }, { key: 'en', label: 'Angielski' }];

    return (
        <Modal isOpen={isOpen} onClose={onCancel} title={editingEvent ? `Edytuj wydarzenie: ${eventData.eventName_pl}` : "Dodaj nowe wydarzenie"} footer={modalFooter} maxWidth="max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* --- LEWA KOLUMNA: GŁÓWNE INFORMACJE I TERMINY --- */}
                <div className="md:col-span-2 space-y-4">
                    <FormField label="Nazwa wydarzenia (PL) *">
                        <input type="text" name="eventName_pl" value={eventData.eventName_pl} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md"/>
                    </FormField>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Terminy *</label>
                        {(eventData.occurrences || []).map((occurrence, occurrenceIndex) => (
                            <div key={occurrenceIndex} className="p-3 border rounded-md bg-gray-50/50 space-y-3">
                                <div className="flex items-center gap-2">
                                    <input type="date" value={occurrence.eventDate} onChange={(e) => handleOccurrenceChange(occurrenceIndex, 'eventDate', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm"/>
                                    <input type="time" value={occurrence.startTime} onChange={(e) => handleOccurrenceChange(occurrenceIndex, 'startTime', e.target.value)} className="p-2 border border-gray-300 rounded-md text-sm"/>
                                    <input type="time" value={occurrence.endTime} onChange={(e) => handleOccurrenceChange(occurrenceIndex, 'endTime', e.target.value)} className="p-2 border border-gray-300 rounded-md text-sm"/>
                                    <button type="button" onClick={() => handleRemoveOccurrence(occurrenceIndex)} disabled={eventData.occurrences.length <= 1} className="p-2 text-red-500 hover:text-red-700 disabled:text-gray-300"><i className="fa-solid fa-trash-can"></i></button>
                                </div>
                                {hasSchedule && (<div className="pt-3 pl-4 border-l-2 ml-2 space-y-2">{(occurrence.schedule || []).map((item, itemIndex) => (<div key={itemIndex} className="flex items-center gap-2"><input type="time" value={item.time} onChange={(e) => handleScheduleItemChange(occurrenceIndex, itemIndex, 'time', e.target.value)} className="p-2 border"/><input type="text" value={item.title} onChange={(e) => handleScheduleItemChange(occurrenceIndex, itemIndex, 'title', e.target.value)} className="w-full p-2 border"/><button type="button" onClick={() => handleRemoveScheduleItem(occurrenceIndex, itemIndex)} className="p-2 text-red-500"><i className="fa-solid fa-trash-can"></i></button></div>))}<button type="button" onClick={() => handleAddScheduleItem(occurrenceIndex)} className="text-xs text-blue-600"><i className="fa-solid fa-plus mr-1"></i> Dodaj punkt</button></div>)}
                            </div>
                        ))}
                        <button onClick={handleAddOccurrence} className="text-sm font-semibold text-blue-600 hover:text-blue-800 mt-2"><i className="fa-solid fa-plus mr-1"></i> Dodaj kolejny termin</button>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Lokalizacja"><input type="text" name="location" value={eventData.location} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md"/></FormField>
                        <FormField label="Organizator"><input type="text" name="organizer" value={eventData.organizer} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md"/></FormField>
                    </div>
                </div>
                {/* --- PRAWA KOLUMNA: KATEGORIE, OPCJE I MULTILANG --- */}
                <div className="space-y-4">
                    <ButtonSelectGroup title="Kategorie wydarzenia" items={categories} selectedIds={eventData.categoryIds || []} onToggle={(id) => handleCategoryCheckboxChange('categoryIds', id)} />
                    <div className="space-y-4 p-4 border rounded-md bg-gray-50/50">
                        <ToggleSwitch label="Wyróżnione" enabled={eventData.isFeatured} setEnabled={(value) => setEventData(prev => ({ ...prev, isFeatured: value }))} />
                        <ToggleSwitch label="Płatne" enabled={isPaid} setEnabled={handlePaidToggle} />
                        <ToggleSwitch label="Harmonogram" enabled={hasSchedule} setEnabled={handleScheduleToggle} />
                    </div>
                    <FormField label="Status wydarzenia">
    <select value={eventData.status || 'TBC'} name="status" onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md">
        <option value="TBC">Do potwierdzenia</option>
        <option value="confirmed">Potwierdzone</option>
        <option value="cancelled">Odwołane</option>
    </select>
</FormField>
                    <FormField label="Plakat / Grafika">
                        <div className="mt-1"><input type="file" id="file-upload" className="hidden" onChange={handleFileSelect} accept="image/png, image/jpeg" /><label htmlFor="file-upload" className="cursor-pointer bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm py-2 px-4 border border-gray-300 rounded-md shadow-sm"><i className="fa-solid fa-upload mr-2"></i> Wybierz plik...</label></div>
                        {isUploading && (<div className="mt-2 w-full bg-gray-200 rounded-full h-2.5"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `0%` }}></div></div>)}
                        {eventData.imageUrl && !isUploading && (<div className="mt-2"><img src={eventData.imageUrl} alt="Podgląd plakatu" className="w-full rounded-md shadow-md" /></div>)}
                    </FormField>
                </div>
                {/* --- SEKCJA WIELOJĘZYCZNA (POD SPODEM, PEŁNA SZEROKOŚĆ) --- */}
                <div className="md:col-span-3 pt-4 border-t">
                    <div className="flex border-b">
                        {langTabs.map(tab => (
                            <button key={tab.key} onClick={() => setActiveLang(tab.key)} className={`${SHARED_STYLES.tabs.base} ${activeLang === tab.key ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>{tab.label}</button>
                        ))}
                    </div>
                    <div className="pt-4 space-y-4">
                        <FormField label={`Nazwa wydarzenia (${activeLang.toUpperCase()})`}>
                             <input type="text" name={`eventName_${activeLang}`} value={eventData[`eventName_${activeLang}`] || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" disabled={activeLang === 'pl'}/>
                        </FormField>
                        <FormField label={`Opis (${activeLang.toUpperCase()})`}>
                            <textarea name={`description_${activeLang}`} value={eventData[`description_${activeLang}`] || ''} onChange={handleChange} rows="6" className="w-full p-2 border border-gray-300 rounded-md"></textarea>
                        </FormField>
                         <FormField label={`Informacja o cenie (${activeLang.toUpperCase()})`}>
                            <input type="text" name={`priceInfo_${activeLang}`} value={eventData[`priceInfo_${activeLang}`] || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md"/>
                        </FormField>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions,
    Button, Field, Input, Textarea, Switch,
    makeStyles, tokens,
    TabList, Tab, Dropdown, Option,
    Subtitle2, Body1, Tooltip, Spinner, Label, ProgressBar
} from '@fluentui/react-components';
import { Add16Regular, Dismiss16Regular, Copy16Regular, ArrowSync16Regular, ArrowUpload16Regular } from '@fluentui/react-icons';
import firebase from 'firebase/compat/app';
import 'firebase/compat/functions';
import MultiSelectCombobox from '../../components/MultiSelectCombobox';
import MessageBox from '../../components/MessageBox';
import { convertGoogleHoursToEditorFormat } from '../../lib/helpers';

const useStyles = makeStyles({
    dialogBody: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
    dialogActions: { paddingTop: tokens.spacingVerticalL },
    tabContent: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${tokens.spacingHorizontalL} ${tokens.spacingVerticalL}`, paddingTop: tokens.spacingVerticalL },
    fullWidth: { gridColumnStart: 1, gridColumnEnd: 3 },
    section: { gridColumnStart: 1, gridColumnEnd: 3, display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM, paddingTop: tokens.spacingVerticalM, borderTop: `1px solid ${tokens.colorNeutralStroke2}` },
    switchGroup: { display: 'flex', flexWrap: 'wrap', gap: tokens.spacingHorizontalXXL },
    dayRow: { display: 'grid', gridTemplateColumns: '50px 1fr auto', gap: tokens.spacingHorizontalL, alignItems: 'center' },
    rangesContainer: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
    rangeInputGroup: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS },
    imagePreview: { width: '56px', height: '56px', borderRadius: tokens.borderRadiusMedium, objectFit: 'cover', boxShadow: tokens.shadow4 },
});

const ALL_ATTRIBUTES = [
    { id: 'serves_breakfast', name: 'Śniadania' },
    { id: 'has_vegetarian_options', name: 'Opcje wegetariańskie' },
    { id: 'has_gluten_free_options', name: 'Opcje bezglutenowe' },
    { id: 'reservation_required', name: 'Wymagana rezerwacja' },
    { id: 'is_accessible', name: 'Dostosowane dla niepełnosprawnych' },
];

const STATUS_OPTIONS = [
    { id: 'OPERATIONAL', name: 'Działający' },
    { id: 'CLOSED_TEMPORARILY', name: 'Tymczasowo zamknięty' },
    { id: 'CLOSED_PERMANENTLY', name: 'Zamknięty na stałe' },
];

// === ZMIANA: Dodano pole 'phone' ===
const initialState = {
    name: '', address_formatted: '', google_place_id: '',
    phone: '', website: '', email: '',
    description_pl: '', category_ids: [], cuisine_ids: [],
    is_seasonal: false, is_active: true, managed_by_google: true,
    imageUrl: '', thumbnailUrl: '', squareThumbnailUrl: '', 
    image_alt_text: '', status: 'OPERATIONAL',
    opening_hours: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
    attribute_ids: [],
};

export default function GastronomyModal({ isOpen, onClose, onSave, isLoading, editingPlace, config }) {
    const styles = useStyles();
    const [place, setPlace] = useState(initialState);
    const [activeTab, setActiveTab] = useState('basic');
    const [isFetchingHours, setIsFetchingHours] = useState(false);
    const [message, setMessage] = useState({ text: '', type: 'info' });
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    useEffect(() => {
        if (isOpen) {
            let initialData = JSON.parse(JSON.stringify(initialState));
            if (editingPlace) {
                Object.assign(initialData, editingPlace);
                if (editingPlace.attributes) {
                    initialData.attribute_ids = Object.keys(editingPlace.attributes)
                        .filter(key => editingPlace.attributes[key] === true);
                }
                if (!initialData.opening_hours) initialData.opening_hours = initialState.opening_hours;
            }
            setPlace(initialData);
            setActiveTab('basic');
        }
    }, [isOpen, editingPlace]);
    
    const handleSave = () => {
        const dataToSave = { ...place };
        const attributesObject = {};
        ALL_ATTRIBUTES.forEach(attr => {
            attributesObject[attr.id] = dataToSave.attribute_ids.includes(attr.id);
        });
        dataToSave.attributes = attributesObject;
        delete dataToSave.attribute_ids;
        onSave(dataToSave);
    };

    const handleInputChange = (e, data) => setPlace(p => ({ ...p, [e.target.name]: data?.value ?? e.target.value }));
    const handleSwitchChange = (field, checked) => setPlace(p => ({...p, [field]: checked}));
    const handleOpenImageLibrary = () => { const url = prompt("Symulacja: Wklej URL obrazka:"); if (url) setPlace(p => ({...p, imageUrl: url})); };
    const handleTimeRangeChange = (day, index, value) => { const newHours = { ...place.opening_hours }; newHours[day][index] = value; setPlace(p => ({ ...p, opening_hours: newHours })); };
    const handleAddTimeRange = (day) => { const newHours = { ...place.opening_hours }; newHours[day] = [...(newHours[day] || []), '']; setPlace(p => ({ ...p, opening_hours: newHours })); };
    const handleRemoveTimeRange = (day, index) => { const newHours = { ...place.opening_hours }; newHours[day] = newHours[day].filter((_, i) => i !== index); setPlace(p => ({ ...p, opening_hours: newHours })); };
    const handleCopyHours = (sourceDay) => { const rangesToCopy = place.opening_hours[sourceDay] || []; if (window.confirm(`Skopiować godziny z tego dnia do wszystkich pozostałych?`)) { const newHours = { ...place.opening_hours }; Object.keys(newHours).forEach(day => { newHours[day] = [...rangesToCopy]; }); setPlace(p => ({ ...p, opening_hours: newHours })); } };
    const handleFetchHours = async () => { if (!place.google_place_id) { setMessage({ text: "Najpierw uzupełnij Google Place ID w zakładce 'Dane podstawowe'.", type: 'warning' }); return; } setIsFetchingHours(true); setMessage({ text: '', type: 'info' }); try { const updateFunction = firebase.app().functions('europe-central2').httpsCallable('updateGastronomyHours'); const result = await updateFunction({ placeId: place.google_place_id }); if (result.data.success) { const updatedData = result.data.data; const editorFriendlyHours = convertGoogleHoursToEditorFormat(updatedData.opening_hours); setPlace(prev => ({ ...prev, opening_hours: editorFriendlyHours, status: updatedData.status })); setMessage({ text: "Godziny i status zostały zaktualizowane.", type: 'success' }); } else { throw new Error(result.data.error || 'Nieznany błąd funkcji.'); } } catch (error) { setMessage({ text: `Błąd: ${error.message}`, type: 'error' }); } finally { setIsFetchingHours(false); } };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        setUploadError('');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('module', 'gastronomy'); // ZMIANA na 'gastronomy'
        const uploadUrl = 'https://visit-mikolajki.pl/imageUpload.php';

        try {
            const response = await fetch(uploadUrl, { method: 'POST', body: formData });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Błąd serwera: ${response.statusText}`);
            }
            const result = await response.json();
            setPlace(prev => ({ 
                ...prev, 
                imageUrl: result.imageUrl, 
                thumbnailUrl: result.thumbnailUrl,
                squareThumbnailUrl: result.squareThumbnailUrl
            }));
        } catch (error) {
            setUploadError(`Błąd wgrywania: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(e, data) => !data.open && onClose()}>
            <DialogSurface>
                <DialogTitle>{editingPlace ? 'Edytuj obiekt gastronomiczny' : 'Dodaj nowy obiekt'}</DialogTitle>
                <DialogBody className={styles.dialogBody}>
                    <TabList selectedValue={activeTab} onTabSelect={(_, data) => setActiveTab(data.value)}>
                        <Tab value="basic">Dane podstawowe</Tab>
                        <Tab value="hours">Godziny i Status</Tab>
                        <Tab value="details">Szczegóły</Tab>
                    </TabList>

                    {activeTab === 'basic' && (
                        <div className={styles.tabContent}>
                            <Field label="Nazwa obiektu" required className={styles.fullWidth}>
                                <Input name="name" value={place.name} onChange={handleInputChange} />
                            </Field>
                            <Field label="Adres"><Input name="address_formatted" value={place.address_formatted} onChange={handleInputChange} /></Field>
                            <Field label="Telefon"><Input name="phone" value={place.phone} onChange={handleInputChange} /></Field>
                            <Field label="Strona internetowa"><Input name="website" value={place.website} onChange={handleInputChange} /></Field>
                            <Field label="E-mail"><Input name="email" value={place.email} onChange={handleInputChange} /></Field>
                            <Field label="Opis" className={styles.fullWidth}>
                                <Textarea name="description_pl" value={place.description_pl} onChange={handleInputChange} resize="vertical" />
                            </Field>
                            
                            <div className={styles.section}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                    <div>
                                        <Label htmlFor="file-upload-gastronomy">Grafika</Label>
                                        <div className="mt-2 flex flex-col items-start gap-4">
                                            <input type="file" id="file-upload-gastronomy" className="hidden" onChange={handleFileSelect} accept="image/png, image/jpeg, image/webp" />
                                            <Button as="label" htmlFor="file-upload-gastronomy" icon={<ArrowUpload16Regular />} disabled={isUploading}>Wybierz plik...</Button>
                                            {isUploading && <ProgressBar className="w-full" />}
                                            {uploadError && <Body1 className="text-red-600">{uploadError}</Body1>}
                                            
                                            {/* === ZMIANA: Zastosowano nowy styl === */}
                                            {(place.squareThumbnailUrl || place.thumbnailUrl) && !isUploading && (
                                                <img 
                                                    src={place.squareThumbnailUrl || place.thumbnailUrl} 
                                                    alt="Podgląd miniatury" 
                                                    className={styles.imagePreview}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <Field label="Tekst alternatywny (autor)">
                                        <Input name="image_alt_text" value={place.image_alt_text} onChange={handleInputChange} placeholder="np. fot. Jan Kowalski" />
                                    </Field>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'hours' && (
                        <div className={styles.tabContent}>
                            <MessageBox message={message.text} type={message.type} onDismiss={() => setMessage({ text: '', type: 'info' })} className={styles.fullWidth} />
                            
                            <div className="flex items-end"><Switch labelPosition="after" label="Synchronizuj z Google" checked={place.managed_by_google} onChange={(_,d)=>handleSwitchChange('managed_by_google', d.checked)} /></div>
                            <div className="flex items-end"><Button icon={isFetchingHours ? <Spinner size="tiny" /> : <ArrowSync16Regular />} disabled={isFetchingHours} onClick={handleFetchHours}>{isFetchingHours ? 'Aktualizuję...' : "Zaktualizuj"}</Button></div>
                            
                            <Field label="Google Place ID"><Input name="google_place_id" value={place.google_place_id} onChange={handleInputChange} /></Field>
                            <Field label="Status operacyjny">
                                <Dropdown value={STATUS_OPTIONS.find(o => o.id === place.status)?.name || 'Wybierz...'} onOptionSelect={(_, data) => setPlace(p => ({ ...p, status: data.optionValue }))} >
                                    {STATUS_OPTIONS.map(opt => (<Option key={opt.id} value={opt.id}>{opt.name}</Option>))}
                                </Dropdown>
                            </Field>

        {/* --- Edytor godzin otwarcia --- */}
        <div className={styles.section}>
            <Subtitle2>Godziny otwarcia</Subtitle2>
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(dayKey => {
                const dayNames = { monday: 'Pon', tuesday: 'Wt', wednesday: 'Śr', thursday: 'Czw', friday: 'Pt', saturday: 'So', sunday: 'Nd' };
                const ranges = place.opening_hours?.[dayKey] || [];
                return (
                    <div key={dayKey} className={styles.dayRow}>
                        <Subtitle2 as="span">{dayNames[dayKey]}</Subtitle2>
                        <div className={styles.rangesContainer}>
                            {ranges.length === 0 && <Body1 className="italic text-gray-500">Zamknięte</Body1>}
                            {ranges.map((range, index) => (
                                <div key={index} className={styles.rangeInputGroup}>
                                    <Input 
                                        value={range} 
                                        onChange={(e, data) => handleTimeRangeChange(dayKey, index, data.value)} 
                                        placeholder="np. 10:00-18:00" 
                                    />
                                    <Tooltip content="Usuń przedział" relationship="label">
                                        <Button 
                                            icon={<Dismiss16Regular />} 
                                            appearance="subtle" 
                                            onClick={() => handleRemoveTimeRange(dayKey, index)} 
                                        />
                                    </Tooltip>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Tooltip content="Dodaj przedział" relationship="label">
                                <Button 
                                    icon={<Add16Regular />} 
                                    onClick={() => handleAddTimeRange(dayKey)} 
                                />
                            </Tooltip>
                            <Tooltip content="Kopiuj do wszystkich" relationship="label">
                                <Button 
                                    icon={<Copy16Regular />} 
                                    onClick={() => handleCopyHours(dayKey)} 
                                />
                            </Tooltip>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
)}

{activeTab === 'details' && (
    <div className={styles.tabContent}>
        {/* --- Pierwszy wiersz --- */}
        <Field label="Kategorie">
            <MultiSelectCombobox 
                options={config.categories || []} 
                selectedIds={place.category_ids} 
                onSelectionChange={(s) => setPlace(p => ({...p, category_ids: s}))} 
            />
        </Field>
        <Field label="Rodzaje kuchni">
            <MultiSelectCombobox 
                options={config.cuisines || []} 
                selectedIds={place.cuisine_ids} 
                onSelectionChange={(s) => setPlace(p => ({...p, cuisine_ids: s}))} 
            />
        </Field>

        {/* --- Drugi wiersz --- */}
        <Field label="Atrybuty">
            <MultiSelectCombobox 
                options={ALL_ATTRIBUTES} 
                selectedIds={place.attribute_ids} 
                onSelectionChange={(s) => setPlace(p => ({ ...p, attribute_ids: s }))} 
            />
        </Field>
        
        {/* Pusta przestrzeń w drugiej kolumnie drugiego wiersza */}
        <div></div>

        {/* --- Pozostałe sekcje --- */}
        <div className={styles.section}>
            <Subtitle2>Ustawienia ogólne</Subtitle2>
            <div className={styles.switchGroup}>
                <Switch 
                    label="Obiekt sezonowy" 
                    checked={place.is_seasonal} 
                    onChange={(_,d)=>handleSwitchChange('is_seasonal', d.checked)} 
                />
            </div>
        </div>
    </div>
)}
                </DialogBody>
                <DialogActions className={styles.dialogActions}>
                    <Button appearance="secondary" onClick={onClose} disabled={isLoading}>Anuluj</Button>
                    <Button appearance="primary" onClick={handleSave} disabled={isLoading}>{isLoading ? 'Zapisywanie...' : 'Zapisz'}</Button>
                </DialogActions>
            </DialogSurface>
        </Dialog>
    );
}
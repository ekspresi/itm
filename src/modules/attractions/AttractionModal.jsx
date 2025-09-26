import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog, DialogSurface, DialogTitle, DialogBody, DialogContent, DialogActions,
    Button, makeStyles, tokens, // <-- DODAJ 'tokens' TUTAJ
    TabList, Tab, Input, Label, Textarea, Field, InfoLabel, Switch, Dropdown, Option,
} from "@fluentui/react-components";

import ToggleSwitch from '../../components/ToggleSwitch';
import { SHARED_STYLES, DIRECTIONS_LIST } from '../../lib/helpers';
import firebase from '../../lib/firebase'; // Potrzebne do wywołania funkcji chmurowej
import IconTagPicker from '../../components/IconTagPicker';

const useStyles = makeStyles({
    wideDialog: {
        width: "1200px",
        maxWidth: "95vw", // Zapobiega "wylewaniu się" okna na małych ekranach
    },
    formGrid: {
        display: 'grid',
        gap: '16px',
    },
    twoColumnGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
    },
    fullWidth: {
        width: '100%',
        // DODAJEMY TĘ LINIĘ
        marginTop: tokens.spacingVerticalXXS,
    },
    // NOWY STYL DO NAPRAWY IKONKI "i"
    infoButton: {
        marginTop: '0px',
    },
});

export default function AttractionModal({ isOpen, onClose, onSave, isLoading, editingAttraction, config }) {
    const styles = useStyles();
    const initialAttractionState = {
        name_pl: '', name_de: '', name_en: '',
        teaser_pl: '', teaser_de: '', teaser_en: '',
        info_snippet_pl: '', info_snippet_de: '', info_snippet_en: '',
        full_desc_pl: '', full_desc_de: '', full_desc_en: '',
        address: '', phone: '', email: '', website: '',
        google_maps_url: '',
        latitude: '',
        longitude: '',
        google_place_id: '',
        directions_data: [], 
        municipality_id: '',
        tag_ids: { type: [] },
        collection_ids: [],
        verification_status: 'Aktualne', 
        last_verified_date: '',
        opening_hours: {
            monday: [], tuesday: [], wednesday: [], thursday: [], 
            friday: [], saturday: [], sunday: []
        },
        opening_hours_managed_by_google: false,
        reservation_required: false,
        reservation_details_pl: '', reservation_details_de: '', reservation_details_en: '',
        imageUrl: '', thumbnailUrl: '',
        squareThumbnailUrl: '',
        image_alt_text: '',
        distance_mikolajki: '',
        createdAt: null,
    };

    const [attractionData, setAttractionData] = useState(initialAttractionState);
    const [activeLang, setActiveLang] = useState('pl');
    // NOWY STAN DO OBSŁUGI ZAKŁADEK W PRAWEJ KOLUMNIE
    const [activeRightTab, setActiveRightTab] = useState('details');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

const statusOptions = [
    { id: 'Aktualne', name: 'Aktualne' },
    { id: 'Do weryfikacji', name: 'Do weryfikacji' },
    { id: 'Zarchiwizowane', name: 'Zarchiwizowane' },
];

    const [isFetchingHours, setIsFetchingHours] = useState(false);

    const isMobileOS = () => {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return /android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    };


    const handleFetchGoogleHours = async () => {
        if (!attractionData.google_place_id) {
            alert("Najpierw wklej Google Place ID dla tej atrakcji.");
            return;
        }
        setIsFetchingHours(true);
        try {
            const functions = firebase.app().functions('europe-central2');
            const getPlaceOpeningHours = functions.httpsCallable('getPlaceOpeningHours');
            
            const result = await getPlaceOpeningHours({ placeId: attractionData.google_place_id });

            if (result.data.success) {
                const { hours, status } = result.data;
                setAttractionData(prev => ({ ...prev, opening_hours: { ...prev.opening_hours, ...hours } }));
                if (status === 'CLOSED_PERMANENTLY') {
                    if (window.confirm("Google Maps zgłasza, że to miejsce jest ZAMKNIĘTE NA STAŁE. Czy chcesz zmienić status tej atrakcji na 'Zarchiwizowane'?")) {
                        setAttractionData(prev => ({ ...prev, verification_status: 'Zarchiwizowane' }));
                    }
                } else if (status === 'CLOSED_TEMPORARILY') {
                    alert("Uwaga: Google Maps zgłasza, że to miejsce jest TYMCZASOWO ZAMKNIĘTE.");
                } else {
                     alert("Godziny otwarcia zostały pomyślnie zaimportowane!");
                }
            } else {
                throw new Error(result.data.error || "Nieznany błąd funkcji chmurowej.");
            }
        } catch (error) {
            console.error("Błąd podczas pobierania godzin z Google Maps:", error);
            alert(`Wystąpił błąd: ${error.message}`);
        } finally {
            setIsFetchingHours(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setAttractionData(editingAttraction ? { ...initialAttractionState, ...editingAttraction } : initialAttractionState);
            setActiveLang('pl');
            setActiveRightTab('details'); // Resetuj do pierwszej zakładki przy otwarciu
            setUploadError('');
        }
    }, [isOpen, editingAttraction]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setAttractionData(prev => ({ ...prev, [name]: value }));
    };

    const handleDirectionToggle = (directionId) => {
        setAttractionData(prev => {
            const existingData = prev.directions_data || [];
            const isSelected = existingData.some(d => d.direction_id === directionId);
            let newDirectionsData;
            if (isSelected) {
                newDirectionsData = existingData.filter(d => d.direction_id !== directionId);
            } else {
                newDirectionsData = [...existingData, { direction_id: directionId, distance: '' }];
            }
            return { ...prev, directions_data: newDirectionsData };
        });
    };

    const handleDistanceChange = (directionId, distance) => {
        setAttractionData(prev => {
            const newDirectionsData = (prev.directions_data || []).map(d => 
                d.direction_id === directionId ? { ...d, distance: distance } : d
            );
            return { ...prev, directions_data: newDirectionsData };
        });
    };

    const handleTagToggle = (tagId) => {
        setAttractionData(prev => {
            const currentTags = new Set(prev.tag_ids.type || []);
            if (currentTags.has(tagId)) currentTags.delete(tagId); else currentTags.add(tagId);
            return { ...prev, tag_ids: { ...prev.tag_ids, type: Array.from(currentTags) } };
        });
    };

    const handleCollectionToggle = (collectionId) => {
        setAttractionData(prev => {
            const currentCollections = new Set(prev.collection_ids || []);
            if (currentCollections.has(collectionId)) {
                currentCollections.delete(collectionId);
            } else {
                currentCollections.add(collectionId);
            }
            return { ...prev, collection_ids: Array.from(currentCollections) };
        });
    };

    const handleTimeRangeChange = (day, rangeIndex, value) => {
        setAttractionData(prev => {
            const newHours = { ...prev.opening_hours };
            newHours[day][rangeIndex] = value;
            return { ...prev, opening_hours: newHours };
        });
    };

    const handleAddTimeRange = (day) => {
        setAttractionData(prev => {
            const newHours = { ...prev.opening_hours };
            newHours[day] = [...(newHours[day] || []), "09:00-17:00"];
            return { ...prev, opening_hours: newHours };
        });
    };

    const handleRemoveTimeRange = (day, rangeIndex) => {
        setAttractionData(prev => {
            const newHours = { ...prev.opening_hours };
            newHours[day] = newHours[day].filter((_, i) => i !== rangeIndex);
            return { ...prev, opening_hours: newHours };
        });
    };

    const handleCopyHours = (sourceDay) => {
        if (!window.confirm(`Czy na pewno chcesz skopiować godziny z tego dnia do wszystkich pozostałych?`)) return;
        setAttractionData(prev => {
            const sourceRanges = prev.opening_hours[sourceDay] || [];
            const newHours = { ...prev.opening_hours };
            Object.keys(newHours).forEach(day => {
                newHours[day] = [...sourceRanges];
            });
            return { ...prev, opening_hours: newHours };
        });
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        setUploadError('');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('module', 'attractions');
        const uploadUrl = 'https://visit-mikolajki.pl/imageUpload.php';

        try {
            const response = await fetch(uploadUrl, { method: 'POST', body: formData });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Błąd serwera: ${response.statusText}`);
            }
            const result = await response.json();
            setAttractionData(prev => ({ 
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
    
    const handleSave = () => {
        if (!attractionData.name_pl.trim()) {
            alert("Nazwa w języku polskim jest wymagana.");
            return;
        }
        onSave(attractionData);
    };

    const modalFooter = (
        <>
            <button onClick={onClose} disabled={isLoading} className={SHARED_STYLES.buttons.secondary}>Anuluj</button>
            <button onClick={handleSave} disabled={isLoading || isUploading} className={SHARED_STYLES.buttons.primary}>
                {isLoading ? 'Zapisywanie...' : (editingAttraction ? 'Zapisz zmiany' : 'Zapisz atrakcję')}
            </button>
        </>
    );
    const title = editingAttraction ? `Edytuj atrakcję: ${attractionData.name_pl}` : "Dodaj nową atrakcję";

    return (
        <Dialog open={isOpen} onOpenChange={(_, data) => { if (!data.open) { onClose(); } }}>
            <DialogSurface className={styles.wideDialog}>
                <DialogBody>
                    <DialogTitle>{editingAttraction ? `Edytuj atrakcję: ${attractionData.name_pl}` : "Dodaj nową atrakcję"}</DialogTitle>
<DialogContent>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
{/* --- LEWA KOLUMNA --- */}
<div className={styles.formGrid}>
    <TabList selectedValue={activeLang} onTabSelect={(_, data) => setActiveLang(data.value)}>
        <Tab value="pl">Polski</Tab>
        <Tab value="de">Niemiecki</Tab>
        <Tab value="en">Angielski</Tab>
    </TabList>
    
    <div>
        <Label htmlFor={`name-${activeLang}`}>Nazwa ({activeLang.toUpperCase()})</Label>
        <Input id={`name-${activeLang}`} value={attractionData[`name_${activeLang}`] || ''} onChange={handleChange} name={`name_${activeLang}`} className={styles.fullWidth} />
    </div>
    
    <Field 
        label={
            <InfoLabel 
                info="Krótki, marketingowy tekst (np. Odkryj... poczuj... zobacz...)."
                // ZASTOSOWANIE POPRAWKI DLA IKONKI "i"
                infoButton={{ className: styles.infoButton }}
            >
                Zajawka ({activeLang.toUpperCase()})
            </InfoLabel>
        }
    >
        <Textarea value={attractionData[`teaser_${activeLang}`] || ''} onChange={handleChange} name={`teaser_${activeLang}`} resize="vertical" className={styles.fullWidth} />
    </Field>
    
    <Field 
        label={
            <InfoLabel 
                info="Zwięzły, rzeczowy opis do materiałów drukowanych."
                // ZASTOSOWANIE POPRAWKI DLA IKONKI "i"
                infoButton={{ className: styles.infoButton }}
            >
                Opis Informacyjny ({activeLang.toUpperCase()})
            </InfoLabel>
        }
    >
        <Textarea value={attractionData[`info_snippet_${activeLang}`] || ''} onChange={handleChange} name={`info_snippet_${activeLang}`} resize="vertical" className={styles.fullWidth} />
    </Field>

    <Field label={`Opis Pełny (${activeLang.toUpperCase()})`}>
         <Textarea value={attractionData[`full_desc_${activeLang}`] || ''} onChange={handleChange} name={`full_desc_${activeLang}`} resize="vertical" rows={2} className={styles.fullWidth} />
    </Field>


                                    {/* ZMIANA TUTAJ */}
                                    <Switch
                                        label="Wymagana rezerwacja"
                                        checked={attractionData.reservation_required}
                                        onChange={(_, data) => setAttractionData(prev => ({ ...prev, reservation_required: data.checked }))}
                                    />
                                    {attractionData.reservation_required && (
                                        <Field label={`Warunki rezerwacji (${activeLang.toUpperCase()})`}>
                                            <Textarea value={attractionData[`reservation_details_${activeLang}`] || ''} onChange={handleChange} name={`reservation_details_${activeLang}`} resize="vertical" className={styles.fullWidth} />
                                        </Field>
                                    )}

</div>

        {/* --- PRAWA KOLUMNA --- */}
        <div>
            <TabList selectedValue={activeRightTab} onTabSelect={(_, data) => setActiveRightTab(data.value)} className="mb-4">
                <Tab value="details">Szczegóły</Tab>
                <Tab value="graphics">Grafika</Tab>
                <Tab value="categories">Kategorie</Tab>
                <Tab value="directions">Dojazd</Tab>
                <Tab value="hours">Godziny</Tab>
            </TabList>

            {activeRightTab === 'details' && (
                <div className={styles.formGrid}>
                    <div className={styles.twoColumnGrid}>
                                            <div>
                                                <Label htmlFor="status-dropdown">Status</Label>
                                                {/* ZMIANA: Nowy Dropdown dla Statusu */}
                                                <Dropdown
                                                    id="status-dropdown"
                                                    aria-labelledby="status-dropdown"
                                                    placeholder="Wybierz status"
                                                    className={styles.fullWidth}
                                                    selectedValue={attractionData.verification_status}
                                                    onOptionSelect={(_, data) => {
                                                        if (data.optionValue) {
                                                            setAttractionData(prev => ({...prev, verification_status: data.optionValue}));
                                                        }
                                                    }}
                                                >
                                                    {statusOptions.map((option) => (
                                                        <Option key={option.id} value={option.id}>
                                                            {option.name}
                                                        </Option>
                                                    ))}
                                                </Dropdown>
                                            </div>
                        <div>
                            <Label htmlFor="last_verified_date">Data ost. weryfikacji</Label>
                            <Input type="date" id="last_verified_date" value={attractionData.last_verified_date || ''} onChange={handleChange} name="last_verified_date" className={styles.fullWidth} />
                        </div>
                    </div>
                    <div className={styles.twoColumnGrid}>
                                             <div>
                                                <Label htmlFor="municipality-dropdown">Gmina</Label>
                                                {/* ZMIANA: Nowy Dropdown dla Gminy */}
                                                <Dropdown
                                                    id="municipality-dropdown"
                                                    aria-labelledby="municipality-dropdown"
                                                    placeholder="Wybierz gminę"
                                                    className={styles.fullWidth}
                                                    selectedValue={attractionData.municipality_id}
                                                    onOptionSelect={(_, data) => {
                                                        if (data.optionValue) {
                                                            setAttractionData(prev => ({...prev, municipality_id: data.optionValue}));
                                                        }
                                                    }}
                                                >
                                                    {(config.municipalities || []).map((option) => (
                                                        <Option key={option.id} value={option.id}>
                                                            {option.name}
                                                        </Option>
                                                    ))}
                                                </Dropdown>
                                            </div>
                        <div>
                            <Label htmlFor="address">Adres</Label>
                            <Input id="address" value={attractionData.address || ''} onChange={handleChange} name="address" className={styles.fullWidth} />
                        </div>
                    </div>
                    {attractionData.municipality_id === config.municipalities.find(m => m.name.toLowerCase().includes('mikołajki'))?.id && (
                        <div>
                            <Label htmlFor="distance_mikolajki">Odległość od Informacji Turystycznej (km)</Label>
                            <Input id="distance_mikolajki" inputMode="decimal" name="distance_mikolajki" value={attractionData.distance_mikolajki || ''} onChange={handleChange} placeholder="np. 1,20" className={styles.fullWidth} />
                        </div>
                    )}
                    <div className={styles.twoColumnGrid}>
                        <div>
                            <Label htmlFor="latitude">Szer. geo. (lat)</Label>
                            <Input id="latitude" value={attractionData.latitude || ''} onChange={handleChange} name="latitude" placeholder="np. 53.778" className={styles.fullWidth} />
                        </div>
                        <div>
                            <Label htmlFor="longitude">Dł. geo. (lng)</Label>
                            <Input id="longitude" value={attractionData.longitude || ''} onChange={handleChange} name="longitude" placeholder="np. 21.572" className={styles.fullWidth} />
                        </div>
                    </div>
                    <div className={styles.twoColumnGrid}>
                        <div>
                            <Label htmlFor="phone">Telefon</Label>
                            <Input id="phone" value={attractionData.phone || ''} onChange={handleChange} name="phone" className={styles.fullWidth} />
                        </div>
                        <div>
                            <Label htmlFor="email">E-mail</Label>
                            <Input type="email" id="email" value={attractionData.email || ''} onChange={handleChange} name="email" className={styles.fullWidth} />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="website">Strona WWW</Label>
                        <Input type="url" id="website" value={attractionData.website || ''} onChange={handleChange} name="website" className={styles.fullWidth} />
                    </div>
                        <div className={styles.twoColumnGrid}>
                            <div>
                                <Label htmlFor="google_maps_url">Link do Map Google</Label>
                                <Input type="url" id="google_maps_url" value={attractionData.google_maps_url || ''} onChange={handleChange} name="google_maps_url" className={styles.fullWidth} />
                            </div>
                            <div>
                                <Label htmlFor="google_place_id">Google Place ID</Label>
                                <div className="flex gap-2">
                                    <Input id="google_place_id" value={attractionData.google_place_id || ''} onChange={handleChange} name="google_place_id" className="w-full"/>
                                    <Button onClick={handleFetchGoogleHours} disabled={isFetchingHours} appearance="primary">
                                        {isFetchingHours ? <i className="fa-solid fa-spinner fa-spin"></i> : "Pobierz"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                </div>
            )}

{activeRightTab === 'graphics' && (
    <div className={styles.formGrid}>
        <div>
            <Label htmlFor="file-upload-attraction">Grafika</Label>
            <div className="mt-1">
                <input 
                    type="file" 
                    id="file-upload-attraction" 
                    className="hidden" 
                    onChange={handleFileSelect} 
                    accept="image/png, image/jpeg" 
                />
                <Button 
                    as="label" 
                    htmlFor="file-upload-attraction" 
                    icon={<i className="fa-solid fa-upload"></i>}
                >
                    Wybierz plik...
                </Button>
            </div>

            {isUploading && (
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `0%` }}></div>
                </div>
            )}
            {uploadError && <p className="text-red-600 text-sm mt-2">{uploadError}</p>}
            
            {(attractionData.thumbnailUrl || attractionData.squareThumbnailUrl) && !isUploading && (
                <div className="mt-2">
                    <img 
                        src={attractionData.squareThumbnailUrl || attractionData.thumbnailUrl} 
                        alt="Podgląd miniatury" 
                        className="w-48 h-auto rounded-md shadow-md" 
                    />
                </div>
            )}
        </div>
        <div>
            <Label htmlFor="image_alt_text">Tekst alternatywny (autor)</Label>
            <Input 
                id="image_alt_text" 
                value={attractionData.image_alt_text || ''} 
                onChange={handleChange} 
                name="image_alt_text" 
                placeholder="np. fot. Jan Kowalski" 
            />
        </div>
    </div>
)}
                    
{activeRightTab === 'categories' && (
    <div className={styles.formGrid}>
        <IconTagPicker
            label="Kategorie"
            options={config.tags?.type || []}
            selectedIds={attractionData.tag_ids?.type || []}
            onSelectionChange={(selected) => 
                setAttractionData(prev => ({ ...prev, tag_ids: { ...prev.tag_ids, type: selected } }))
            }
        />

        <IconTagPicker
            label="Kolekcje"
            options={config.collections || []}
            selectedIds={attractionData.collection_ids || []}
            onSelectionChange={(selected) => 
                setAttractionData(prev => ({ ...prev, collection_ids: selected }))
            }
        />
    </div>
)}

                    {activeRightTab === 'directions' && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Kierunek jazdy i odległość</h3>
                            <div className="space-y-2">
                                {DIRECTIONS_LIST.map(direction => {
                                    const currentData = (attractionData.directions_data || []).find(d => d.direction_id === direction.id);
                                    const isSelected = !!currentData;
                                    return (
                                        <button key={direction.id} type="button" onClick={() => handleDirectionToggle(direction.id)} className={`w-full p-3 rounded-lg transition-all text-sm font-semibold border flex items-center justify-between ${isSelected ? 'bg-blue-50 border-blue-300 shadow-md' : 'bg-white hover:bg-gray-50'}`}>
                                            <span className={isSelected ? 'text-blue-800' : 'text-gray-800'}>{direction.name}</span>
                                            {isSelected && (
                                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                    <label className="text-xs font-medium text-gray-600">Odległość:</label>
                                                    <input type="text" inputMode="decimal" value={currentData.distance} onChange={e => handleDistanceChange(direction.id, e.target.value)} className="w-20 p-1 border border-gray-300 rounded-md text-right" />
                                                    <span className="text-xs font-medium text-gray-600">km</span>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    
                    {activeRightTab === 'hours' && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-gray-700">Godziny otwarcia</h3>
                                <button type="button" onClick={handleFetchGoogleHours} disabled={isFetchingHours} className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-wait">
                                    {isFetchingHours ? <><i className="fa-solid fa-spinner fa-spin mr-1"></i>Pobieranie...</> : <><i className="fa-brands fa-google mr-1"></i> Pobierz z Google Maps</>}
                                </button>
                            </div>
                                        <div className="mb-3">
                                            {/* ZMIANA TUTAJ */}
                                            <Switch
                                                label="Zarządzane przez Mapy Google"
                                                checked={attractionData.opening_hours_managed_by_google}
                                                onChange={(_, data) => setAttractionData(prev => ({ ...prev, opening_hours_managed_by_google: data.checked }))}
                                            />
                                        </div>
                            <div className="space-y-3 p-3 bg-gray-50 rounded-lg border">
                                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                                    const dayNames = { monday: 'Poniedziałek', tuesday: 'Wtorek', wednesday: 'Środa', thursday: 'Czwartek', friday: 'Piątek', saturday: 'Sobota', sunday: 'Niedziela' };
                                    const ranges = attractionData.opening_hours?.[day] || [];
                                    return (
                                        <div key={day} className="grid grid-cols-[100px_1fr_auto] gap-3 items-center">
                                            <span className="font-semibold text-sm text-gray-600">{dayNames[day]}</span>
                                            <div className="flex flex-wrap gap-2">
                                                {ranges.length === 0 && <p className="text-xs text-gray-500 italic">Zamknięte</p>}
                                                {ranges.map((range, index) => (
                                                    <div key={index} className="flex items-center">
                                                        <input type="text" value={range} onChange={(e) => handleTimeRangeChange(day, index, e.target.value)} placeholder="np. 10:00-18:00" className="w-32 p-1 border border-gray-300 rounded-md text-sm" />
                                                        <button type="button" onClick={() => handleRemoveTimeRange(day, index)} className="p-1 text-red-500 hover:text-red-700 text-lg">&times;</button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button type="button" onClick={() => handleAddTimeRange(day)} className="text-blue-600 hover:text-blue-800 w-6 h-6 flex items-center justify-center bg-white border rounded shadow-sm" title="Dodaj przedział czasowy"><i className="fa-solid fa-plus text-xs"></i></button>
                                                <button type="button" onClick={() => handleCopyHours(day)} className="text-gray-600 hover:text-blue-800 w-6 h-6 flex items-center justify-center bg-white border rounded shadow-sm" title="Kopiuj do wszystkich"><i className="fa-solid fa-copy text-xs"></i></button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
                    </DialogContent>
                    <DialogActions>
                        {/* Przyciski ze stopki renderujemy tutaj jako przyciski Fluent UI */}
                        <Button appearance="secondary" onClick={onClose} disabled={isLoading}>
                            Anuluj
                        </Button>
                        <Button appearance="primary" onClick={handleSave} disabled={isLoading || isUploading}>
                            {isLoading ? 'Zapisywanie...' : (editingAttraction ? 'Zapisz zmiany' : 'Zapisz atrakcję')}
                        </Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}
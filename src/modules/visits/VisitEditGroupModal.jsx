import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { SHARED_STYLES } from '../../lib/helpers';
import { firebaseApi } from '../../lib/firebase';

export default function VisitEditGroupModal({ isOpen, onClose, groupToEdit, allIndicators, yearlySettings, onSaveSuccess }) {
    const [isLoading, setIsLoading] = useState(false);
    
    // Stany na edytowane dane
    const [tourists, setTourists] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState(null);
    const [selectedPurposes, setSelectedPurposes] = useState(new Set());

    // Stany na dostępne opcje
    const [activeIndicators, setActiveIndicators] = useState({ gender: [], language: [], purpose: [] });
    const [currentYearSettings, setCurrentYearSettings] = useState(null);

    useEffect(() => {
        if (isOpen && groupToEdit) {
            // Inicjalizujemy stan modala danymi edytowanej grupy
            setTourists(groupToEdit.tourists || []);
            setSelectedLanguage(groupToEdit.language || null);
            setSelectedPurposes(new Set(groupToEdit.purposes || []));

            // Filtrujemy wskaźniki, aby pokazać tylko te aktywne dla roku edytowanego wpisu
            const year = groupToEdit.date.substring(0, 4);
            const settings = yearlySettings[year] || { mode: 'multiplier', value: 1, barometrEnabled: false };
            setCurrentYearSettings(settings);

            if (!settings.activeIndicators) {
                setActiveIndicators({ gender: [], language: [], purpose: [] });
                return;
            }

            const activeSlugs = settings.activeIndicators;
            const newActiveIndicators = { gender: [], language: [], purpose: [] };
            allIndicators.forEach(ind => {
                if (activeSlugs[ind.category]?.includes(ind.slug)) {
                    newActiveIndicators[ind.category].push(ind);
                }
            });
            Object.keys(newActiveIndicators).forEach(cat => {
                newActiveIndicators[cat].sort((a, b) => a.sortOrder - b.sortOrder);
            });
            setActiveIndicators(newActiveIndicators);

        }
    }, [isOpen, groupToEdit, allIndicators, yearlySettings]);

    const addTourist = (genderSlug) => setTourists(prev => [...prev, { gender: genderSlug, bikeAgeRange: null }]);
    const removeTourist = (index) => setTourists(prev => prev.filter((_, i) => i !== index));
    const selectLanguage = (langSlug) => setSelectedLanguage(langSlug);
    const togglePurpose = (purposeSlug) => {
        const newSet = new Set(selectedPurposes);
        if (newSet.has(purposeSlug)) newSet.delete(purposeSlug);
        else newSet.add(purposeSlug);
        
        if (purposeSlug === 'rowery' && !newSet.has('rowery')) {
            setTourists(prev => prev.map(t => ({ ...t, bikeAgeRange: null })));
        }
        setSelectedPurposes(newSet);
    };

    const handleAgeChange = (index, age) => {
        setTourists(prev => prev.map((tourist, i) => i === index ? { ...tourist, bikeAgeRange: age } : tourist));
    };

    const handleSave = async () => {
        setIsLoading(true);
        const dataToSave = {
            ...groupToEdit, // Zachowujemy oryginalne dane jak ID, data, timestamp
            language: selectedLanguage,
            purposes: Array.from(selectedPurposes),
            tourists: tourists
        };

        try {
            await firebaseApi.saveDocument('visits', dataToSave);
            onSaveSuccess(); // Sygnalizujemy sukces do rodzica
            onClose(); // Zamykamy modal
        } catch (error) {
            console.error("Błąd aktualizacji grupy:", error);
            alert("Nie udało się zapisać zmian.");
        } finally {
            setIsLoading(false);
        }
    };

    const isSaveDisabled = tourists.length === 0 || !selectedLanguage || selectedPurposes.size === 0 || isLoading;
    const isBikePurposeSelected = selectedPurposes.has('rowery');
    const showAgeSelector = isBikePurposeSelected && currentYearSettings?.barometrEnabled;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edytuj grupę z dnia: ${groupToEdit?.date}`} footer={
                <>
                    {/* NOWOŚĆ: Wyświetlanie ID grupy */}
                    <div className="text-xs text-gray-400 font-mono" title="Identyfikator dokumentu w bazie danych">
                        ID: {groupToEdit?.id}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} disabled={isLoading} className={SHARED_STYLES.buttons.secondary}>Anuluj</button>
                        <button onClick={handleSave} disabled={isSaveDisabled} className={SHARED_STYLES.buttons.primary}>
                            {isLoading ? 'Zapisywanie...' : 'Zapisz zmiany'}
                        </button>
                    </div>
                </>
            } maxWidth="max-w-6xl">
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-700">1. Dodaj / Usuń turystów</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {activeIndicators.gender.map(ind => (
                                <button key={ind.slug} onClick={() => addTourist(ind.slug)} className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center text-center h-24 w-full">
                                    <i className={`fa-solid ${ind.icon || 'fa-user'} fa-2x mb-2`} style={{ color: ind.color || '#374151' }}></i>
                                    <h3 className="font-semibold text-gray-800 text-sm">{ind.name}</h3>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                         <h3 className="text-lg font-bold text-gray-700">2. Wybierz język obsługi</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {activeIndicators.language.map(ind => (
                                <button key={ind.slug} onClick={() => selectLanguage(ind.slug)} className={`p-2 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center text-center h-24 w-full ${selectedLanguage === ind.slug ? 'bg-blue-600 text-white ring-2 ring-blue-700' : 'bg-white'}`}>
                                    <h3 className={`font-semibold text-sm capitalize ${selectedLanguage === ind.slug ? 'text-white' : 'text-gray-800'}`}>{ind.name}</h3>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                {tourists.length > 0 && (
                    <div>
                        <h3 className="text-md font-bold text-gray-700 mb-2">Edytowana grupa ({tourists.length})</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 border-t pt-4">
                            {tourists.map((t, index) => {
                                const indicator = activeIndicators.gender.find(i => i.slug === t.gender);
                                return (
                                    <div key={index} className="bg-gray-50 p-3 rounded-lg shadow-sm border flex flex-col gap-2">
                                        <div className="w-full flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <i className={`fa-solid ${indicator?.icon || 'fa-user'}`} style={{ color: indicator?.color || '#000000' }}></i>
                                                <span className="font-medium text-sm">{indicator?.name || t.gender}</span>
                                            </div>
                                            <button onClick={() => removeTourist(index)} className={`${SHARED_STYLES.toolbar.iconButton} hover:text-red-600`} style={{ height: '28px', width: '28px' }} title="Usuń">
                                                <i className="fa-solid fa-xmark text-sm"></i>
                                            </button>
                                        </div>
                                        {showAgeSelector && (
                                            <div className="mt-2">
                                                <label className="text-xs font-semibold text-gray-500">Wiek:</label>
                                                <div className="w-full grid grid-cols-3 gap-1">
                                                    {[{value: 'do 25', label: '<25'}, {value: '26-50', label: '26-50'}, {value: '51+', label: '>51'}].map(age => (
                                                        <button key={age.value} onClick={() => handleAgeChange(index, age.value)} className={`w-full text-xs font-semibold py-1 px-2 rounded-md border transition-colors ${t.bikeAgeRange === age.value ? 'bg-blue-600 text-white border-blue-700' : 'bg-white hover:bg-gray-200'}`}>
                                                            {age.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
                <div>
                    <h3 className="text-lg font-bold text-gray-700 mb-4">3. Wybierz cele wizyty</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {activeIndicators.purpose.map(ind => (
                            <button key={ind.slug} onClick={() => togglePurpose(ind.slug)} className={`p-2 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center text-center h-24 ${selectedPurposes.has(ind.slug) ? 'bg-blue-600 text-white ring-2 ring-blue-700' : 'bg-white'}`}>
                                <i className={`fa-solid ${ind.icon} fa-2x mb-2 ${selectedPurposes.has(ind.slug) ? 'text-white' : 'text-gray-800'}`}></i>
                                <h3 className={`font-semibold text-xs ${selectedPurposes.has(ind.slug) ? 'text-white' : 'text-gray-800'}`}>{ind.name}</h3>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
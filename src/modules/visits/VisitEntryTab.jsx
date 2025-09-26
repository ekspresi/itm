import React, { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import MessageBox from '../../components/MessageBox';
import { SHARED_STYLES } from '../../lib/helpers';
import { firebaseApi } from '../../lib/firebase';

export default function VisitEntryTab({ db, user, selectedDate, onSave, onClear, setIsSaveDisabled, onTouristCountChange, dataToPreload, onPreloadComplete }) {
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: 'info' });

    const [tourists, setTourists] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState(null);
    const [selectedPurposes, setSelectedPurposes] = useState(new Set());

    const [activeIndicators, setActiveIndicators] = useState({ gender: [], language: [], purpose: [] });
    const [currentYearSettings, setCurrentYearSettings] = useState(null);

    useEffect(() => {
        if (onTouristCountChange) {
            onTouristCountChange(tourists.length);
        }
    }, [tourists, onTouristCountChange]);

    const resetForm = useCallback(() => {
        setTourists([]);
        setSelectedLanguage(null);
        setSelectedPurposes(new Set());
        setMessage({ text: '', type: 'info' });
    }, []);

    useEffect(() => {
        const fetchConfigForYear = async () => {
            setIsLoading(true);
            resetForm();
            const year = selectedDate.substring(0, 4);
            try {
                const [allIndicators, configDoc] = await Promise.all([
                    firebaseApi.fetchCollection('indicators'),
                    firebaseApi.fetchDocument('visits_config', '--main--')
                ]);

                const yearlySettings = configDoc?.yearlySettings?.[year];
                setCurrentYearSettings(yearlySettings || { mode: 'multiplier', value: 1, barometrEnabled: false });

                if (!yearlySettings || !yearlySettings.activeIndicators) {
                    setMessage({ text: `Brak zdefiniowanych aktywnych wskaźników dla roku ${year}. Skonfiguruj je w panelu ustawień.`, type: 'error' });
                    setActiveIndicators({ gender: [], language: [], purpose: [] });
                    return;
                }

                const activeSlugs = yearlySettings.activeIndicators;
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

            } catch (error) {
                console.error("Błąd wczytywania konfiguracji dla roku:", error);
                setMessage({ text: "Wystąpił błąd podczas wczytywania konfiguracji.", type: 'error' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchConfigForYear();
    }, [selectedDate, resetForm]);

    useEffect(() => {
        onClear(resetForm);
    }, [onClear, resetForm]);

    useEffect(() => {
        const handleSave = () => {
            const visitData = { date: selectedDate, language: selectedLanguage, purposes: Array.from(selectedPurposes), tourists: tourists };
            const fullSaveLogic = async (callback) => {
                try {
                    const dataToSave = { ...visitData, timestamp: new Date(), userId: user.uid };
                    await firebaseApi.saveDocument('visits', dataToSave);
                    callback(true);
                    resetForm();
                } catch (error) {
                    console.error("Błąd zapisu wizyty:", error);
                    callback(false);
                }
            };
            
            fullSaveLogic((isSuccess) => {
                if(isSuccess) setMessage({ text: `Zapisano pomyślnie ${tourists.length} os. na dzień ${selectedDate}.`, type: 'success' });
                else setMessage({ text: "Wystąpił błąd podczas zapisu.", type: 'error' });
            });
        };
        onSave(handleSave);
    }, [onSave, tourists, selectedLanguage, selectedPurposes, selectedDate, user, resetForm]);

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
    
    useEffect(() => {
        setIsSaveDisabled(tourists.length === 0 || !selectedLanguage || selectedPurposes.size === 0 || isLoading);
    }, [tourists, selectedLanguage, selectedPurposes, isLoading, setIsSaveDisabled]);

    const isBikePurposeSelected = selectedPurposes.has('rowery');
    const showAgeSelector = isBikePurposeSelected && currentYearSettings?.barometrEnabled;

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="space-y-6 select-none">
            <MessageBox message={message.text} type={message.type} onDismiss={() => setMessage({ text: '', type: 'info' })} />
            {message.type !== 'error' && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                         <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-700">Odwiedzający w grupie</h3>
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
                             <h3 className="text-lg font-bold text-gray-700">Język</h3>
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
                            <h3 className="text-md font-bold text-gray-700 mb-2">Dodane osoby ({tourists.length})</h3>
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
                        <h3 className="text-lg font-bold text-gray-700 mb-4">Cele wizyty</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                            {activeIndicators.purpose.map(ind => (
                                <button key={ind.slug} onClick={() => togglePurpose(ind.slug)} className={`p-2 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center text-center h-24 ${selectedPurposes.has(ind.slug) ? 'bg-blue-600 text-white ring-2 ring-blue-700' : 'bg-white'}`}>
                                    <i className={`fa-solid ${ind.icon} fa-2x mb-2 ${selectedPurposes.has(ind.slug) ? 'text-white' : 'text-gray-800'}`}></i>
                                    <h3 className={`font-semibold text-xs ${selectedPurposes.has(ind.slug) ? 'text-white' : 'text-gray-800'}`}>{ind.name}</h3>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import LoadingSpinner from '../../components/LoadingSpinner';
import MessageBox from '../../components/MessageBox';
import { firebaseApi } from '../../lib/firebase';

const UnmatchedRowActions = ({ item, index, resolution, onResolve }) => {
    if (resolution && resolution.action === 'create') {
        const resolutionText = `Utworzysz nowy obiekt "${resolution.name}" w: ${resolution.location === 'city' ? 'Mieście' : 'Gminie'}`;
        return (
            <div className="mt-3 border-t pt-3 flex items-center justify-between text-sm">
                <p className="font-semibold text-green-700">✅ Rozwiązane: <span className="font-normal italic">{resolutionText}</span></p>
                <button onClick={() => onResolve(index, null)} className="text-xs text-gray-500 hover:text-black">Cofnij</button>
            </div>
        );
    }

    const isNameMissing = !resolution || !resolution.name || resolution.name.trim() === '';

    return (
        <div className="mt-3 border-t pt-3 flex items-center justify-end gap-2">
            <button 
                onClick={() => onResolve(index, { ...resolution, action: 'create', location: 'city' })} 
                disabled={isNameMissing}
                className="text-sm font-semibold bg-green-200 text-green-800 p-2 rounded-md hover:bg-green-300 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
                Utwórz (Miasto)
            </button>
            <button 
                onClick={() => onResolve(index, { ...resolution, action: 'create', location: 'municipality' })} 
                disabled={isNameMissing}
                className="text-sm font-semibold bg-green-200 text-green-800 p-2 rounded-md hover:bg-green-300 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
                Utwórz (Gmina)
            </button>
       </div>
    );
};

export default function StaysImportModal({ isOpen, onClose, onSaveImport }) {
    const [importMonth, setImportMonth] = useState(new Date().toISOString().slice(0, 7));
    const [jsonText, setJsonText] = useState('');
    const [step, setStep] = useState(1);
    const [parsedData, setParsedData] = useState(null);
    const [error, setError] = useState('');
    const [accommodations, setAccommodations] = useState([]);
    const [categorizedData, setCategorizedData] = useState(null);
    const [resolutions, setResolutions] = useState({});

    // ZMIANA: Nowy useEffect do resetowania stanu modala po jego zamknięciu
    useEffect(() => {
        if (!isOpen) {
            // Używamy małego opóźnienia, aby reset nie był widoczny podczas animacji zamykania
            setTimeout(() => {
                setStep(1);
                setJsonText('');
                setError('');
                setParsedData(null);
                setCategorizedData(null);
                setResolutions({});
                // Nie resetujemy 'accommodations', bo i tak jest pobierane na nowo w kroku 2
            }, 300);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && step === 2 && accommodations.length === 0) {
            const fetchAccommodations = async () => { 
                try { 
                    const data = await firebaseApi.fetchCollection('accommodations', { orderBy: { field: 'name', direction: 'asc' } }, true); 
                    setAccommodations(data); 
                } catch (e) { setError("Nie udało się pobrać listy obiektów noclegowych z bazy."); }
            };
            fetchAccommodations();
        }
    }, [isOpen, step]);

    useEffect(() => {
        if (step !== 2 || !parsedData || accommodations.length === 0) { 
            setCategorizedData(null); 
            return; 
        }
        
        const travelhostIdMap = new Map();
        accommodations.forEach(acc => {
            if (acc.travelhostIds && Array.isArray(acc.travelhostIds)) {
                acc.travelhostIds.forEach(id => {
                    travelhostIdMap.set(id, acc);
                });
            }
        });

        const matched = [];
        const unmatched = [];
        
        parsedData.forEach(item => {
            const travelId = item["Travelhost ID"];
            if (travelId && travelhostIdMap.has(travelId)) {
                matched.push({ ...item, matchedAcc: travelhostIdMap.get(travelId) });
            } else {
                unmatched.push(item);
            }
        });

        setCategorizedData({ matched, unmatched, errors: [] });

    }, [parsedData, accommodations, step]);

    const handleParseAndProceed = () => {
        setError('');
        try {
            const data = JSON.parse(jsonText);
            if (!Array.isArray(data)) { throw new Error("Wklejony kod nie jest tablicą (nie zaczyna się od [ )."); }
            if (data.length === 0) { throw new Error("Tablica jest pusta. Wklej dane."); }
            const firstItem = data[0];
            if (typeof firstItem !== 'object' || firstItem === null || !('Travelhost ID' in firstItem) || !('guests' in firstItem)) {
                throw new Error("Struktura danych jest nieprawidłowa. Oczekiwano obiektów z kluczami 'Travelhost ID' i 'guests'.");
            }
            setParsedData(data); setStep(2);
        } catch (e) { setError(`Błąd w kodzie JSON: ${e.message}`); setParsedData(null); }
    };
    
    // ZMIANA: Upraszczamy funkcję - teraz tylko wywołuje onClose z propsów, resztę robi useEffect
    const handleClose = () => {
        onClose();
    };
    
    const handleUnmatchedNameChange = (index, newName) => {
        setResolutions(prev => ({
            ...prev,
            [index]: {
                ...(prev[index] || {}),
                name: newName
            }
        }));
    };
    
    const handleResolution = (index, resolution) => { 
        if (resolution === null) {
            const newResolutions = { ...resolutions };
            delete newResolutions[index];
            setResolutions(newResolutions);
        } else {
            setResolutions(prev => ({ ...prev, [index]: resolution })); 
        }
    };
    
    const allUnmatchedResolved = categorizedData ? 
        categorizedData.unmatched.length === Object.keys(resolutions).length &&
        Object.values(resolutions).every(res => res && res.action === 'create' && res.name && res.name.trim() !== '')
        : false;
        
    // ZMIANA: Poprawiony licznik kroków z 3 na 2
    const title = `Importer danych o pobytach (Krok ${step}/2)`;
    const modalFooter = (
        <>
            <div>{step === 2 && <button onClick={() => setStep(1)} className="text-sm font-semibold text-gray-600 hover:text-black">Wróć</button>}</div> 
            <div className="flex gap-2">
                <button onClick={handleClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Anuluj</button>
                {step === 1 && ( <button onClick={handleParseAndProceed} disabled={!jsonText.trim()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400">Dalej</button> )}
                {step === 2 && ( <button onClick={() => onSaveImport({ categorizedData, resolutions, importMonth })} disabled={!allUnmatchedResolved} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400">Zapisz import</button> )}
            </div>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={title} footer={modalFooter} maxWidth="max-w-4xl">
            {step === 1 && (
                <div className="space-y-4">
                     <FormField label="Wybierz miesiąc, którego dotyczą dane" htmlFor="import-month">
                        <input type="month" id="import-month" value={importMonth} onChange={e => setImportMonth(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md"/>
                    </FormField>
                    <FormField label="Wklej dane w formacie JSON" htmlFor="json-data">
                        <textarea id="json-data" rows="10" value={jsonText} onChange={e => setJsonText(e.target.value)} placeholder='[{"Travelhost ID": "7f79470e-5ced-4eb8-9ba9-3447c0233d1f", "guests": 4}, ...]' className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"></textarea>
                    </FormField>
                    {error && <MessageBox message={error} type="error" />}
                </div>
            )}
            {step === 2 && (
                <div>
                    {!categorizedData ? <LoadingSpinner /> : (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-green-700 mb-2">✅ Obiekty automatycznie dopasowane ({categorizedData.matched.length})</h3>
                                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2 bg-gray-50/50">
                                    {categorizedData.matched.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm">
                                            <div>
                                                <p className="font-semibold">{item.matchedAcc.name}</p>
                                                <p className="text-xs text-gray-500">Travelhost ID: {item["Travelhost ID"]}</p>
                                            </div>
                                            <div className="font-bold text-lg text-right">{item.guests}</div>
                                        </div>
                                    ))}
                                    {categorizedData.matched.length === 0 && <p className="text-sm text-center text-gray-500 p-4">Brak obiektów dopasowanych automatycznie.</p>}
                                </div>
                            </div>
                            {categorizedData.unmatched.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-yellow-700 mb-2">⚠️ Obiekty wymagające utworzenia ({categorizedData.unmatched.length})</h3>
                                    <div className="space-y-3">
                                        {categorizedData.unmatched.map((item, index) => (
                                            <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-grow pr-4">
                                                        <input 
                                                            type="text"
                                                            placeholder="Wprowadź nazwę nowego obiektu..."
                                                            value={resolutions[index]?.name || ''}
                                                            onChange={e => handleUnmatchedNameChange(index, e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded-md mb-1 font-semibold"
                                                        />
                                                        <p className="text-xs text-gray-600">Travelhost ID: {item["Travelhost ID"]}</p>
                                                    </div>
                                                    <div className="font-bold text-2xl">{item.guests}</div>
                                                </div>
                                                <UnmatchedRowActions item={item} index={index} resolution={resolutions[index]} onResolve={handleResolution} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};
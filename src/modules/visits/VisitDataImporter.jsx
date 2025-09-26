import React, { useState, useEffect } from 'react';
import { firebaseApi } from '../../lib/firebase';
import { SHARED_STYLES } from '../../lib/helpers';

export default function VisitDataImporter({ allIndicators, onImportComplete }) {
    const [isLoading, setIsLoading] = useState(false);
    const [jsonText, setJsonText] = useState('');
    const [message, setMessage] = useState({ text: '', type: 'info' });

    const handleImport = async () => {
        if (!window.confirm(`Czy na pewno chcesz zaimportować te dane? Ta operacja nadpisze istniejące dane ręczne dla podanych dni.`)) {
            return;
        }

        setIsLoading(true);
        setMessage({ text: 'Rozpoczynam import...', type: 'info' });

        let data;
        try {
            data = JSON.parse(jsonText);
            if (!Array.isArray(data)) throw new Error("Dane nie są tablicą (array).");
        } catch (e) {
            setMessage({ text: `Błąd w formacie JSON: ${e.message}`, type: 'error' });
            setIsLoading(false);
            return;
        }

        const genderSlugs = new Set(allIndicators.filter(i => i.category === 'gender').map(i => i.slug));
        const languageSlugs = new Set(allIndicators.filter(i => i.category === 'language').map(i => i.slug));
        const purposeSlugs = new Set(allIndicators.filter(i => i.category === 'purpose').map(i => i.slug));

        const importPromises = data.map(row => {
            const date = row.data;
            if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                console.warn(`Pominięto wiersz z nieprawidłową lub brakującą datą: ${JSON.stringify(row)}`);
                return Promise.resolve({ status: 'skipped', reason: 'Invalid date' });
            }

            const overrideDoc = {
                id: date,
                total: Number(row.total) || 0,
                gender: {},
                language: {},
                purpose: {}
            };

            for (const key in row) {
                if (key === 'data' || key === 'total') continue;
                
                const value = Number(row[key]) || 0;
                if (genderSlugs.has(key)) {
                    overrideDoc.gender[key] = value;
                } else if (languageSlugs.has(key)) {
                    overrideDoc.language[key] = value;
                } else if (purposeSlugs.has(key)) {
                    overrideDoc.purpose[key] = value;
                }
            }
            
            return firebaseApi.saveDocument('overrides', overrideDoc);
        });

        try {
            await Promise.all(importPromises);
            setMessage({ text: `Import zakończony! Przetworzono ${data.length} wierszy. Zmiany będą widoczne po odświeżeniu podsumowań.`, type: 'success' });
            onImportComplete();
        } catch (e) {
            console.error("Błąd podczas zapisu do bazy danych:", e);
            setMessage({ text: `Wystąpił krytyczny błąd podczas zapisu do bazy: ${e.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-gray-800">Importer danych ręcznych</h3>
            <p className="text-sm text-gray-600 mt-2 mb-4">Wklej tutaj dane w formacie JSON przygotowane w poprzednim kroku. Narzędzie automatycznie zapisze każdy wiersz jako osobny dokument w bazie danych dla odpowiedniego dnia. <b className="text-red-600">Uwaga:</b> Operacja nadpisze istniejące dane ręczne dla tych dni.</p>
            
            <textarea
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
                placeholder="Wklej tutaj tablicę JSON..."
                className="w-full h-64 p-2 border border-gray-300 rounded-md font-mono text-xs"
                disabled={isLoading}
            />
            
            <div className="mt-4 flex justify-end">
                <button
                    onClick={handleImport}
                    disabled={isLoading || !jsonText.trim()}
                    className={SHARED_STYLES.buttons.primary}
                >
                    {isLoading ? 'Importowanie...' : 'Uruchom Import'}
                </button>
            </div>
            
            {message.text && <MessageBox message={message.text} type={message.type} onDismiss={() => setMessage({ text: '', type: 'info' })} />}
        </div>
    );
}
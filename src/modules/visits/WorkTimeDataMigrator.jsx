import React, { useState, useEffect } from 'react';
import { firebaseApi } from '../../lib/firebase';
import { SHARED_STYLES } from '../../lib/helpers';

export default function WorkTimeDataMigrator() {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleMigration = async () => {
        if (!window.confirm("Czy na pewno chcesz rozpocząć migrację danych modułu Czas Pracy? Proces skopiuje dane do nowej lokalizacji. Stare kolekcje będziesz musiał/a usunąć ręcznie po weryfikacji.")) {
            return;
        }

        setIsLoading(true);
        setMessage('Rozpoczynam migrację... To może potrwać chwilę.');

        try {
            // --- Ścieżki do kolekcji ---
            const oldConfigPath = 'config'; 
            const newConfigPath = 'worktime_module/--data--/config';
            const oldEntriesPath = 'entries';
            const newEntriesPath = 'worktime_module/--data--/entries';

            // --- Migracja Konfiguracji ---
            setMessage('Krok 1/2: Migruję konfigurację (pracownicy, wymiar godzin)...');
            const oldConfigsSnapshot = await db.collection(oldConfigPath).get();
            const configPromises = [];
            oldConfigsSnapshot.forEach(doc => {
                configPromises.push(db.collection(newConfigPath).doc(doc.id).set(doc.data()));
            });
            await Promise.all(configPromises);
            
            // --- Migracja Wpisów Czasu Pracy ---
            setMessage('Krok 2/2: Migruję wpisy czasu pracy...');
            const oldEntriesSnapshot = await db.collection(oldEntriesPath).get();
            const entryPromises = [];
            oldEntriesSnapshot.forEach(doc => {
                entryPromises.push(db.collection(newEntriesPath).doc(doc.id).set(doc.data()));
            });
            await Promise.all(entryPromises);

            // --- Komunikat o sukcesie ---
            setMessage(`✅ SUKCES! Migracja zakończona. Przeniesiono ${oldConfigsSnapshot.size} dokumentów konfiguracyjnych i ${oldEntriesSnapshot.size} wpisów czasu pracy. Sprawdź dane w Firebase, a następnie możesz bezpiecznie usunąć stare kolekcje 'config' i 'entries' z głównego poziomu bazy.`);

        } catch (error) {
            console.error("Błąd migracji:", error);
            setMessage(`BŁĄD: Wystąpił błąd podczas migracji. Sprawdź konsolę deweloperską (F12), aby uzyskać więcej informacji. Błąd: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto border-l-4 border-orange-500">
            <h3 className="text-xl font-bold text-gray-800">Narzędzie do Migracji Danych (Czas pracy)</h3>
            <p className="text-sm text-gray-600 mt-2 mb-4">
                Użyj tego narzędzia, aby przenieść dane modułu "Czas pracy" z błędnie utworzonych, głównych kolekcji (`config`, `entries`) do nowej, poprawnej lokalizacji wewnątrz `worktime_module`.
            </p>
            <button onClick={handleMigration} disabled={isLoading} className={SHARED_STYLES.buttons.primary + " w-full"}>
                {isLoading ? 'Trwa migracja...' : 'Rozpocznij migrację danych'}
            </button>
            {message && <p className="mt-4 text-sm font-semibold text-center p-2 bg-gray-100 rounded-md">{message}</p>}
        </div>
    );
}
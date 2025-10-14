import { firebaseApi } from './firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/functions';

/**
 * Globalna, reużywalna funkcja do masowej aktualizacji danych z Google.
 * @param {Array} items - Tablica obiektów do przetworzenia.
 * @param {string} collectionName - Nazwa kolekcji w Firestore do zapisu.
 * @param {string} cloudFunctionName - Nazwa funkcji chmurowej do wywołania.
 * @param {function} dataConverter - Funkcja konwertująca dane z Google na format edytora.
 * @returns {Promise<object>} - Obiekt z podsumowaniem: { successCount, errorCount }.
 */
export async function updateAllHoursFromGoogle(items, collectionName, cloudFunctionName, dataConverter) {
    const itemsToUpdate = items.filter(p => p.managed_by_google && p.google_place_id);

    if (itemsToUpdate.length === 0) {
        alert("Brak obiektów do zaktualizowania (dla żadnego nie jest włączona synchronizacja z Google i/lub brakuje Google Place ID).");
        return { successCount: 0, errorCount: 0 };
    }

    if (!window.confirm(`Czy na pewno chcesz zaktualizować dane dla ${itemsToUpdate.length} obiektów? Może to chwilę potrwać.`)) {
        return null; // Anulowano przez użytkownika
    }

    let successCount = 0;
    let errorCount = 0;

    try {
        const updateFunction = firebase.app().functions('europe-central2').httpsCallable(cloudFunctionName);

        for (const item of itemsToUpdate) {
            try {
                const result = await updateFunction({ placeId: item.google_place_id });
                if (result.data.success) {
                    const convertedData = dataConverter(result.data.data.opening_hours);
                    
                    await firebaseApi.saveDocument(collectionName, {
                        id: item.id,
                        opening_hours: convertedData,
                        status: result.data.data.status,
                    });
                    successCount++;
                } else {
                    console.error(`Błąd przetwarzania dla ${item.name || item.id}:`, result.data.error);
                    errorCount++;
                }
            } catch (error) {
                console.error(`Błąd wywołania funkcji chmurowej dla ${item.name || item.id}:`, error);
                errorCount++;
            }
        }
    } catch (error) {
        // Błąd krytyczny, np. z inicjalizacją funkcji chmurowej
        throw new Error(`Wystąpił krytyczny błąd podczas procesu aktualizacji: ${error.message}`);
    }

    return { successCount, errorCount };
}
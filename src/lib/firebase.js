import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import 'firebase/compat/functions';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY,
    authDomain: import.meta.env.VITE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_APP_ID
};
export const appId = firebaseConfig.projectId;

try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
} catch (e) {
    console.error("Krytyczny błąd konfiguracji Firebase:", e);
}

export const db = firebase.firestore();
export const storage = firebase.storage();
export const auth = firebase.auth(); // Eksportujemy też auth
export const functions = firebase.app().functions('europe-central2'); // POPRAWIONA LINIA

export const firebaseApi = {
    _getFullPath: (collectionName, isRoot = false) => {
        if (isRoot) {
            return collectionName;
        }

        // --- Moduł Odwiedziny ---
        if (collectionName === 'visits_config') return `visits_module/--data--/config`;
        const visitsModuleCollections = ['indicators', 'visits', 'overrides'];
        if (visitsModuleCollections.includes(collectionName)) {
            return `visits_module/--data--/${collectionName}`;
        }

        // --- Moduł Czas Pracy ---
        if (collectionName === 'worktime_config') return `worktime_module/--data--/config`;
        if (collectionName === 'worktime_entries') return `worktime_module/--data--/entries`;
        
        // --- NOWOŚĆ: Moduł Atrakcje ---
        if (collectionName === 'attractions_config') return `attractions_module/--data--/config`;
        if (collectionName === 'attractions_entries') return `attractions_module/--data--/entries`;
        if (collectionName === 'attractions_collections') return `attractions_module/--data--/collections`; 

// --- NOWOŚĆ: Moduł Wydarzenia v2 ---
if (collectionName === 'events_config') return `events_module/--data--/config`;
if (collectionName === 'local_events') return `events_module/--data--/local_events`;
if (collectionName === 'nearby_events') return `events_module/--data--/nearby_events`;

// --- NOWOŚĆ: Moduł Teksty ---
if (collectionName === 'texts_entries') return `texts_module/--data--/entries`;

    // --- Moduł Gastronomia ---
    if (collectionName === 'gastronomy_config') return `gastronomy_module/--data--/config`;
    if (collectionName === 'gastronomy_entries') return `gastronomy_module/--data--/entries`;

        // --- NOWOŚĆ: Moduł Ulotek ---
    if (collectionName === 'leaflets_config') return `leaflets_module/--data--/config`;
    if (collectionName === 'leaflets_entries') return `leaflets_module/--data--/entries`;

    if (collectionName === 'schedule_config') return `schedule_module/--data--/config`;
    const scheduleModuleCollections = ['rooms', 'classes', 'events', 'cancellations'];
    if (scheduleModuleCollections.includes(collectionName)) {
        return `schedule_module/--data--/${collectionName}`;
    }


        // --- Pozostałe moduły ---
        return `/artifacts/${appId}/public/data/${collectionName}`;
    },

    saveDocument: function(collectionName, data, isRoot = false) {
        const { id, ...dataToSave } = data;
        const fullPath = this._getFullPath(collectionName, isRoot);
        if (id) {
            return db.collection(fullPath).doc(id).set(dataToSave, { merge: true });
        } else {
            return db.collection(fullPath).add(dataToSave);
        }
    },

    deleteDocument: function(collectionName, docId, isRoot = false) {
        const fullPath = this._getFullPath(collectionName, isRoot);
        return db.collection(fullPath).doc(docId).delete();
    },

    fetchCollection: async function(collectionName, { filter, orderBy } = {}, isRoot = false) {
        let query = db.collection(this._getFullPath(collectionName, isRoot));
        if (filter) {
            query = query.where(filter.field, filter.operator, filter.value);
        }
        if (orderBy) {
            query = query.orderBy(orderBy.field, orderBy.direction || 'asc');
        }
        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    
    fetchDocument: async function(collectionName, docId, isRoot = false) {
        const docSnap = await db.collection(this._getFullPath(collectionName, isRoot)).doc(docId).get();
        if (docSnap.exists) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            console.warn(`Dokument ${docId} nie został znaleziony w kolekcji ${collectionName}.`);
            return null;
        }
    },
};

export const callCloudFunction = async (functionName, data = {}) => {
    // Upewnij się, że użytkownik jest zalogowany
    if (!firebase.auth().currentUser) {
        throw new Error("Użytkownik niezalogowany.");
    }
    const idToken = await firebase.auth().currentUser.getIdToken();
    const response = await fetch(`https://europe-central2-itmikolajki-stats.cloudfunctions.net/${functionName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ data: data })
    });
    
    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error?.message || `Błąd serwera: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data; // Zwracamy bezpośrednio obiekt 'data' z odpowiedzi
};

export default firebase;
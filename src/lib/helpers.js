import { tokens } from '@fluentui/react-components';

export const SHARED_STYLES = {
    toolbar: {
        iconButton: "bg-white hover:bg-gray-100 text-gray-800 font-semibold text-sm h-10 w-10 rounded-lg border shadow-sm flex items-center justify-center transition-colors",
        primaryButton: "bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm h-10 px-4 rounded-lg flex items-center justify-center shadow-sm transition-colors"
    },
    buttonSelect: {
        base: "w-full text-left p-3 rounded-lg transition-colors text-sm font-semibold",
        active: "bg-blue-100 text-blue-800",
        inactive: "hover:bg-blue-50"
    },
    buttons: {
        primary: "bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400",
        secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg disabled:opacity-50"
    },
    tabs: {
        base: "py-2 px-4 text-sm font-semibold transition-colors",
        active: "border-b-2 border-blue-600 text-blue-600",
        inactive: "text-gray-500 hover:text-gray-700"
    }
};

export const AGE_RANGES = ["do 25", "26-50", "51+"]; // Uproszczona wersja dla nowych przycisków

export const BIKE_REPORT_SORT_ORDER_V2 = [
    'polski_mezczyzna_do 25', 'polski_mezczyzna_26-50', 'polski_mezczyzna_51+',
    'polski_kobieta_do 25', 'polski_kobieta_26-50', 'polski_kobieta_51+',
    'angielski_mezczyzna_do 25', 'angielski_mezczyzna_26-50', 'angielski_mezczyzna_51+',
    'angielski_kobieta_do 25', 'angielski_kobieta_26-50', 'angielski_kobieta_51+',
    'niemiecki_mezczyzna_do 25', 'niemiecki_mezczyzna_26-50', 'niemiecki_mezczyzna_51+',
    'niemiecki_kobieta_do 25', 'niemiecki_kobieta_26-50', 'niemiecki_kobieta_51+',
    'czeski_mezczyzna_do 25', 'czeski_mezczyzna_26-50', 'czeski_mezczyzna_51+',
    'czeski_kobieta_do 25', 'czeski_kobieta_26-50', 'czeski_kobieta_51+'
];

/**
 * Zwraca poprawną formę polskiego rzeczownika w zależności od liczby.
 * @param {number} n - Liczba, do której dopasowujemy formę.
 * @param {string} form1 - Forma dla 1 (np. "zapytanie").
 * @param {string} form2 - Forma dla 2, 3, 4 i liczb kończących się na 2, 3, 4 (np. "zapytania").
 * @param {string} form5 - Forma dla 5+ i liczb kończących się na 0, 1, 5-9 (np. "zapytań").
 * @returns {string} Poprawna forma rzeczownika.
 */
export const getPolishPlural = (n, form1, form2, form5) => {
    n = Math.abs(n);
    if (n === 1) return form1;
    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return form2;
    return form5;
};

/**
 * Agreguje surowe dane z tablicy grup wizyt do prostego obiektu podsumowującego.
 * @param {Array} visitGroups - Tablica dokumentów z kolekcji 'visits'.
 * @returns {Object} Obiekt z surowymi, zsumowanymi danymi.
 */
export function aggregateRawVisits(visitGroups) {
    const rawData = { total: 0, gender: {}, language: {}, purpose: {}, bikeStats: {} };
    if (!visitGroups) return rawData;

    for (const group of visitGroups) {
        const groupSize = group.tourists?.length || 0;
        rawData.total += groupSize;
        if (group.language) {
            rawData.language[group.language] = (rawData.language[group.language] || 0) + groupSize;
        }
        (group.purposes || []).forEach(pSlug => {
            rawData.purpose[pSlug] = (rawData.purpose[pSlug] || 0) + groupSize;
        });
        (group.tourists || []).forEach(t => {
            if (t.gender) {
                rawData.gender[t.gender] = (rawData.gender[t.gender] || 0) + 1;
            }
            if (t.bikeAgeRange && (group.purposes || []).includes('rowery')) {
                const key = `${group.language}_${t.gender}_${t.bikeAgeRange}`;
                rawData.bikeStats[key] = (rawData.bikeStats[key] || 0) + 1;
            }
        });
    }
    return rawData;
}

/**
 * Bierze zagregowane surowe dane i przelicza je przez podany mnożnik, uzgadniając sumy.
 * @param {Object} rawData - Obiekt z surowymi danymi (wynik funkcji aggregateRawVisits).
 * @param {number} multiplier - Mnożnik do zastosowania.
 * @returns {Object} Obiekt z przeliczonymi i uzgodnionymi danymi.
 */
export function calculateMultipliedData(rawData, multiplier) {
    if (!rawData) return { total: 0, gender: {}, language: {}, purpose: {} };
    const multipliedData = {
        total: Math.round(rawData.total * multiplier),
        gender: {}, language: {}, purpose: {}
    };

    let genderSum = 0;
    const genderSlugs = Object.keys(rawData.gender);
    genderSlugs.forEach((slug, index) => {
        const multipliedCount = Math.round(rawData.gender[slug] * multiplier);
        multipliedData.gender[slug] = multipliedCount;
        if (index < genderSlugs.length - 1) genderSum += multipliedCount;
    });
    if (genderSlugs.length > 0) {
        const lastGenderSlug = genderSlugs[genderSlugs.length - 1];
        multipliedData.gender[lastGenderSlug] = multipliedData.total - genderSum;
    }
    
    let langSum = 0;
    const langSlugs = Object.keys(rawData.language);
    langSlugs.forEach((slug, index) => {
         const multipliedCount = Math.round(rawData.language[slug] * multiplier);
         multipliedData.language[slug] = multipliedCount;
         if (index < langSlugs.length - 1) langSum += multipliedCount;
    });
    if (langSlugs.length > 0) {
        const lastLangSlug = langSlugs[langSlugs.length - 1];
        const calculatedSum = Object.values(multipliedData.language).reduce((a, b) => a + b, 0);
        multipliedData.language[lastLangSlug] += multipliedData.total - calculatedSum;
    }

    Object.entries(rawData.purpose).forEach(([slug, count]) => {
        multipliedData.purpose[slug] = Math.round(count * multiplier);
    });

    return multipliedData;
}

/**
 * Tworzy szczegółowe, roczne zestawienie statystyk z podziałem na miesiące.
 * Wersja 2.0
 * @param {Array} annualVisits - Tablica wszystkich wizyt z danego roku.
 * @param {Object} yearlySettings - Obiekt konfiguracyjny z trybami i mnożnikami.
 * @returns {Array} Tablica 12 obiektów, gdzie każdy obiekt to pełne statystyki dla danego miesiąca.
 */
export async function createMonthlyBreakdown(annualVisits, yearlySettings) {
    const visitsByMonth = Array(12).fill(null).map(() => []);
    annualVisits.forEach(visit => {
        const monthIndex = new Date(visit.date + 'T12:00:00Z').getUTCMonth();
        visitsByMonth[monthIndex].push(visit);
    });

    const monthlyBreakdown = await Promise.all(visitsByMonth.map(async (monthVisits, index) => {
        const year = new Date().getFullYear(); // Założenie, że wszystkie wizyty są z tego samego roku
        const month = index + 1;
        const dateForOverrides = `${year}-${String(month).padStart(2, '0')}`;
        
        const rawData = aggregateRawVisits(monthVisits);
        let multipliedData;

        const settingsForYear = yearlySettings[year] || { mode: 'multiplier', value: 1 };
        
        if (settingsForYear.mode === 'fixed') {
             // W trybie ręcznym, musimy sprawdzić, czy są nadpisania dla każdego dnia miesiąca
             // To jest uproszczenie; pełna logika jest w komponencie rocznym
            multipliedData = { total: 0, gender: {}, language: {}, purpose: {} }; // Uproszczenie dla tej funkcji
        } else {
            multipliedData = calculateMultipliedData(rawData, settingsForYear.value || 1);
        }

        return { raw: rawData, multiplied: multipliedData };
    }));

    return monthlyBreakdown;
}

export const formatPhoneNumber = (phoneStr) => {
    if (!phoneStr) return 'Brak';
    const cleaned = ('' + phoneStr).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})$/);
    if (match) {
        return `${match[1]} ${match[2]} ${match[3]}`;
    }
    return phoneStr;
};

// NOWOŚĆ: Funkcja sprawdzająca, czy obiekt jest otwarty w danym momencie
export const isOpenNow = (place) => {
    if (!place.opening_hours || !place.opening_hours.periods) {
        return false; // Brak danych o godzinach
    }
    if (place.opening_hours.openNow !== undefined) {
        return place.opening_hours.openNow; // Jeśli Google podało gotową flagę
    }
    
    try {
        const now = new Date();
        // Dzień tygodnia: 0 = Niedziela, 1 = Poniedziałek, ..., 6 = Sobota
        const dayOfWeek = now.getDay();
        const nowInMinutes = now.getHours() * 60 + now.getMinutes();

        for (const period of place.opening_hours.periods) {
            if (period.open.day === dayOfWeek) {
                const openInMinutes = period.open.hour * 60 + period.open.minute;
                const closeInMinutes = period.close.hour * 60 + period.close.minute;

                if (nowInMinutes >= openInMinutes && nowInMinutes < closeInMinutes) {
                    return true; // Znaleziono pasujący przedział czasowy
                }
            }
        }
        return false; // Zamknięte
    } catch (e) {
        console.error("Błąd parsowania godzin otwarcia:", e);
        return false;
    }
};

// NOWOŚĆ: Konwertuje "surowy" obiekt godzin z Google na format używany przez edytor
export const convertGoogleHoursToEditorFormat = (googleHours) => {
    if (!googleHours || !googleHours.periods) {
        return { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] };
    }

    const formattedHours = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] };
    const dayMap = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    googleHours.periods.forEach((period) => {
        if (period.open && period.close) {
            const dayKey = dayMap[period.open.day];
            const openTime = `${String(period.open.hour).padStart(2, "0")}:${String(period.open.minute).padStart(2, "0")}`;
            const closeTime = `${String(period.close.hour).padStart(2, "0")}:${String(period.close.minute).padStart(2, "0")}`;
            if (formattedHours[dayKey]) {
                formattedHours[dayKey].push(`${openTime}-${closeTime}`);
            }
        }
    });
    return formattedHours;
};

export const getPrintHeaderDetails = (moduleType, customDate) => {
    const isSales = moduleType === 'sales';
    const logoUrl = isSales ? "https://stats.visit-mikolajki.pl/ck-logo.jpg" : STATS_LOGO_URL;
    const lines = isSales ? [
        { text: 'Centrum Kultury "Kłobuk" w Mikołajkach', bold: true },
        { text: '11-730 Mikołajki, ul. Kolejowa 6', bold: false },
        { text: 'tel. 87 421 61 46, e-mail: biuro@ckklobuk.pl', bold: false } // <-- DODANA LINIA
    ] : [
        { text: 'Informacja Turystyczna w Mikołajkach', bold: true },
        { text: '11-730 Mikołajki, Plac Wolności 7', bold: false },
        { text: 'tel. 87 421 68 50, e-mail: it@mikolajki.pl', bold: false }
    ];
    
    return {
        logoUrl,
        date: customDate || new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }) + ' r.',
        lines
    };
};

 export const STATS_LOGO_URL = "https://stats.visit-mikolajki.pl/it-logo.jpg";

 export const DIRECTIONS_LIST = [
    { id: 'luknajno', name: 'Łuknajno' },
    { id: 'piecki', name: 'Piecki' },
    { id: 'ruciane-nida', name: 'Ruciane-Nida' },
    { id: 'prom-wierzba', name: 'Prom Bełdany' },
    { id: 'orzysz', name: 'Orzysz' },
    { id: 'gizycko', name: 'Giżycko' },
    { id: 'ryn', name: 'Ryn' },
    { id: 'mragowo', name: 'Mrągowo' },
];

export const COLOR_PALETTE = [
    tokens.colorPaletteRedBackground2,
    tokens.colorPaletteOrangeBackground2,
    tokens.colorPaletteYellowBackground2,
    tokens.colorPaletteGreenBackground2,
    tokens.colorPaletteForestBackground2,
    tokens.colorPaletteCranberryBackground2,
    tokens.colorPalettePumpkinBackground2,
    tokens.colorPalettePeachBackground2,
    tokens.colorPaletteMarigoldBackground2,
    tokens.colorPaletteGoldBackground2,
    tokens.colorPaletteBrassBackground2,
    tokens.colorPaletteBrownBackground2,
    tokens.colorPaletteCornflowerBackground2,
    tokens.colorPaletteBlueBackground2,
    tokens.colorPaletteRoyalBlueBackground2,
    tokens.colorPalettePlumBackground2,
    tokens.colorPaletteGrapeBackground2,
    tokens.colorPaletteLilacBackground2,
    tokens.colorPalettePinkBackground2,
    tokens.colorPaletteMagentaBackground2,
];

export const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};
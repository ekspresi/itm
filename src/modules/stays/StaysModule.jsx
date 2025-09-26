import React, { useState, useEffect, useMemo } from 'react';
import { firebaseApi } from '../../lib/firebase';
import { SHARED_STYLES } from '../../lib/helpers';

import MessageBox from '../../components/MessageBox';
import StaysModal from './StaysModal';
import StaysImportModal from './StaysImportModal';
import StaysAnnualReportTab from './StaysAnnualReportTab';
import StaysComparisonTab from './StaysComparisonTab';
import StaysDetailsTab from './StaysDetailsTab';

export default function StaysModule() {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: 'info' });
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [activeTab, setActiveTab] = useState('report');
    const [yearData, setYearData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMonth, setEditingMonth] = useState(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [detailsSearchTerm, setDetailsSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [comparisonMode, setComparisonMode] = useState('year');
    const [periodA, setPeriodA] = useState(new Date().getFullYear());
    const [periodB, setPeriodB] = useState(new Date().getFullYear() - 1);
    const [comparisonData, setComparisonData] = useState(null);
    const [allAccommodations, setAllAccommodations] = useState([]);
    const [yearStayEntries, setYearStayEntries] = useState([]);
    const [hideEmpty, setHideEmpty] = useState(false);
    const [selectedMonthData, setSelectedMonthData] = useState(null);

    useEffect(() => {
        const fetchAllAccommodations = async () => {
            try {
                const data = await firebaseApi.fetchCollection('accommodations', {}, true);
                setAllAccommodations(data);
            } catch (e) {
                setMessage({ text: "Nie udało się pobrać listy obiektów noclegowych.", type: 'error' });
            }
        };
        fetchAllAccommodations();
    }, []);

    const handleFetchReport = async (year) => {
        if (allAccommodations.length === 0) return;
        setIsLoading(true);
        setYearData([]);
        setYearStayEntries([]);
        try {
            const stayEntries = await firebaseApi.fetchCollection('stays', { filter: { field: 'year', operator: '==', value: year } }, true);
            setYearStayEntries(stayEntries);
            const accommodationMap = allAccommodations.reduce((acc, obj) => { acc[obj.id] = obj.location; return acc; }, {});
            const monthlyTotals = stayEntries.reduce((acc, entry) => {
                if (!acc[entry.month]) { acc[entry.month] = { city: 0, municipality: 0 }; }
                const location = accommodationMap[entry.accommodationId];
                if (location === 'city') { acc[entry.month].city += entry.guests || 0; } else if (location === 'municipality') { acc[entry.month].municipality += entry.guests || 0; }
                return acc;
            }, {});
            const formattedYearData = Object.keys(monthlyTotals).map(monthNum => ({
                id: `${year}-${String(monthNum).padStart(2, '0')}`,
                year: year,
                month: Number(monthNum),
                city: monthlyTotals[monthNum].city,
                municipality: monthlyTotals[monthNum].municipality
            })).sort((a, b) => a.month - b.month);
            setYearData(formattedYearData);
        } catch (error) { console.error("Błąd pobierania danych o pobytach:", error); setMessage({ text: "Wystąpił błąd podczas ładowania danych.", type: 'error' }); } finally { setIsLoading(false); }
    };

    useEffect(() => { handleFetchReport(selectedYear); }, [selectedYear, allAccommodations]);

    const detailsData = useMemo(() => {
        const staysByAccId = yearStayEntries.reduce((acc, entry) => {
            if (!acc[entry.accommodationId]) { acc[entry.accommodationId] = {}; }
            acc[entry.accommodationId][entry.month] = entry.guests;
            return acc;
        }, {});
        return allAccommodations.map(acc => {
            const monthlyData = staysByAccId[acc.id] || {};
            let total = 0;
            const monthsData = {};
            for (let i = 1; i <= 12; i++) { const guests = monthlyData[i] || 0; monthsData[i] = guests; total += guests; }
            return { ...acc, months: monthsData, total: total };
        });
    }, [yearStayEntries, allAccommodations]);

    const changeYear = (direction) => { setSelectedYear(prevYear => prevYear + direction); };
    const totals = useMemo(() => { return yearData.reduce((acc, monthData) => { acc.city += monthData.city || 0; acc.municipality += monthData.municipality || 0; return acc; }, { city: 0, municipality: 0 }); }, [yearData]);
    const months = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
    
    const handleOpenAddModal = () => { setEditingMonth(new Date().toISOString().slice(0, 7)); setIsModalOpen(true); };
    const handleOpenEditModal = (stayData) => { setEditingMonth(stayData.id); setIsModalOpen(true); };
    const handleSaveStay = async (entries, targetMonth) => {
        const [year, month] = targetMonth.split('-').map(Number);
        const promises = [];
        for (const accId in entries) {
            const guests = entries[accId] || 0;
            const docId = `${targetMonth}_${accId}`;
            const stayData = { year, month, accommodationId: accId, guests: guests };
            promises.push(firebaseApi.saveDocument('stays', { ...stayData, id: docId }, true));
        }
        try { await Promise.all(promises); setMessage({ text: `Dane dla miesiąca ${targetMonth} zostały pomyślnie zapisane.`, type: 'success' }); handleFetchReport(selectedYear); } catch (error) { console.error("Błąd zapisu:", error); setMessage({ text: "Wystąpił błąd podczas zapisu.", type: 'error' }); }
    };
const handleDeleteStay = async (monthId) => {
        const [year, monthNum] = monthId.split('-');
        const monthName = new Date(monthId + '-02').toLocaleString('pl-PL', { month: 'long', year: 'numeric' });

        if (window.confirm(`Czy na pewno chcesz usunąć WSZYSTKIE dane o pobytach za miesiąc ${monthName}? Tej operacji nie można cofnąć.`)) {
            setIsLoading(true);
            try {
                // Krok 1: Znajdź wszystkie dokumenty dla danego roku i miesiąca
                const allYearEntries = await firebaseApi.fetchCollection('stays', { 
                    filter: { field: 'year', operator: '==', value: Number(year) } 
                }, true);
                
                const entriesToDelete = allYearEntries.filter(e => e.month === Number(monthNum));

                if (entriesToDelete.length === 0) {
                    setMessage({ text: `Brak danych do usunięcia dla miesiąca ${monthName}.`, type: 'info' });
                    setIsLoading(false);
                    return;
                }

                // Krok 2: Przygotuj operacje usunięcia dla każdego znalezionego dokumentu
                const deletePromises = entriesToDelete.map(entry => 
                    firebaseApi.deleteDocument('stays', entry.id, true)
                );

                // Krok 3: Wykonaj wszystkie operacje usunięcia jednocześnie
                await Promise.all(deletePromises);

                setMessage({ text: `Dane dla miesiąca ${monthName} zostały pomyślnie usunięte.`, type: 'success' });
                handleFetchReport(selectedYear); // Odśwież dane w widoku

            } catch (error) {
                console.error("Błąd usuwania danych pobytowych:", error);
                setMessage({ text: "Wystąpił błąd podczas usuwania danych.", type: 'error' });
            } finally {
                setIsLoading(false);
            }
        }
    };
    const handleMonthSelect = (monthData) => { if (selectedMonthData && selectedMonthData.id === monthData.id) { setSelectedMonthData(null); } else { setSelectedMonthData(monthData); } };
    
const handleSaveImport = async ({ categorizedData, resolutions, importMonth }) => {
    setIsLoading(true);
    const [year, month] = importMonth.split('-').map(Number);
    const newAccommodationPromises = [];
    
    const resolvedUnmatched = categorizedData.unmatched.map((item, index) => ({ ...item, resolution: resolutions[index] }));
    
    const itemsToCreateInAccommodations = resolvedUnmatched.filter(item => item.resolution && item.resolution.action === 'create');
    
    itemsToCreateInAccommodations.forEach(item => {
        const newAccData = { 
            name: item.resolution.name,
            // ZMIANA: Zapisujemy ID w tablicy, zgodnie z nowym modelem danych
            travelhostIds: [item["Travelhost ID"]], 
            location: item.resolution.location, 
            description: '', 
            isSeasonal: true, 
            address: '', 
            phone: '', 
            email: '', 
            website: '', 
            capacity: '', 
            isFeatured: false, 
            imageUrl: '', 
            thumbnailUrl: '', 
            categoryIds: [], 
            attributeIds: [], 
            languageIds: [] 
        };
        newAccommodationPromises.push(firebaseApi.saveDocument('accommodations', newAccData, true));
    });

    try {
        const newAccommodationRefs = await Promise.all(newAccommodationPromises);
        const staySavePromises = [];

        categorizedData.matched.forEach(item => {
            const stayData = { year, month, accommodationId: item.matchedAcc.id, guests: item.guests };
            const docId = `${importMonth}_${item.matchedAcc.id}`;
            staySavePromises.push(firebaseApi.saveDocument('stays', { ...stayData, id: docId }, true));
        });

        itemsToCreateInAccommodations.forEach((item, index) => {
            const newAccId = newAccommodationRefs[index].id;
            const stayData = { year, month, accommodationId: newAccId, guests: item.guests };
            const docId = `${importMonth}_${newAccId}`;
            staySavePromises.push(firebaseApi.saveDocument('stays', { ...stayData, id: docId }, true));
        });

        await Promise.all(staySavePromises);
        
        setMessage({ text: `Pomyślnie zaimportowano dane dla miesiąca ${importMonth}.`, type: 'success' });
        handleFetchReport(selectedYear);
        setIsImportModalOpen(false);

    } catch (error) {
        console.error("Błąd zapisu importu:", error);
        setMessage({ text: "Wystąpił błąd podczas zapisu danych.", type: 'error' });
    } finally {
        setIsLoading(false);
    }
};
    
    const handleCompare = async () => {
        if (allAccommodations.length === 0) { setMessage({ text: "Poczekaj, ładuję listę obiektów noclegowych...", type: 'info' }); return; };
        setIsLoading(true);
        setComparisonData(null);
        const fetchAndProcessPeriod = async (mode, period) => {
            let entries = [];
            if (mode === 'year') { entries = await firebaseApi.fetchCollection('stays', { filter: { field: 'year', operator: '==', value: period } }, true); } else { const [year, month] = String(period).split('-').map(Number); entries = await firebaseApi.fetchCollection('stays', { filter: { field: 'year', operator: '==', value: year }, }, true); entries = entries.filter(e => e.month === month); }
            const accommodationMap = allAccommodations.reduce((acc, obj) => { acc[obj.id] = obj.location; return acc; }, {});
            const totals = entries.reduce((acc, entry) => { const location = accommodationMap[entry.accommodationId]; if (location === 'city') { acc.city += entry.guests || 0; } else if (location === 'municipality') { acc.municipality += entry.guests || 0; } return acc; }, { city: 0, municipality: 0 });
            return { ...totals, total: totals.city + totals.municipality };
        };
        try {
            const [dataA, dataB] = await Promise.all([ fetchAndProcessPeriod(comparisonMode, periodA), fetchAndProcessPeriod(comparisonMode, periodB) ]);
            setComparisonData({ dataA, dataB });
        } catch (error) { console.error("Błąd porównywania:", error); setMessage({ text: "Wystąpił błąd podczas porównywania danych.", type: 'error' }); } finally { setIsLoading(false); }
    };

    const handleSort = (key) => {
        setSortConfig(prevConfig => {
            if (prevConfig.key === key) { return { ...prevConfig, direction: prevConfig.direction === 'asc' ? 'desc' : 'asc' }; }
            return { key: key, direction: 'desc' };
        });
    };

    return (
        <div className="max-w-7xl mx-auto">
            <StaysModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveStay} allAccommodations={allAccommodations} targetMonth={editingMonth} />
            <StaysImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSaveImport={handleSaveImport} />
            <div className="flex flex-col md:flex-row items-center md:justify-between gap-4 mb-6 no-print">
                <div className="flex items-center justify-center gap-2"><button onClick={() => changeYear(-1)} className="bg-white hover:bg-gray-100 text-gray-800 font-semibold text-sm h-10 w-10 rounded-lg border shadow-sm flex items-center justify-center transition-colors"><i className="fa-solid fa-chevron-left"></i></button><input type="number" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="p-2 border border-gray-300 rounded-md shadow-sm h-10 font-semibold text-sm w-28 text-center" /><button onClick={() => changeYear(1)} className="bg-white hover:bg-gray-100 text-gray-800 font-semibold text-sm h-10 w-10 rounded-lg border shadow-sm flex items-center justify-center transition-colors"><i className="fa-solid fa-chevron-right"></i></button></div>
                <div className="flex w-full md:w-auto items-center gap-2">
                    <button onClick={() => setIsImportModalOpen(true)} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold text-sm h-10 px-4 rounded-lg flex items-center justify-center shadow-sm transition-colors"><i className="fa-solid fa-upload sm:mr-2"></i><span className="hidden sm:inline">Importuj dane</span></button>
                    <button onClick={handleOpenAddModal} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm h-10 px-4 rounded-lg flex flex-grow md:flex-grow-0 items-center justify-center shadow-sm transition-colors"><i className="fa-solid fa-plus sm:mr-2"></i><span className="hidden sm:inline">Dodaj ręcznie</span></button>
                </div>
            </div>
            <div className="flex border-b mb-6">
                <button onClick={() => setActiveTab('report')} className={`${SHARED_STYLES.tabs.base} ${activeTab === 'report' ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>Podsumowanie</button>
                <button onClick={() => setActiveTab('comparison')} className={`${SHARED_STYLES.tabs.base} ${activeTab === 'comparison' ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>Porównanie</button>
                <button onClick={() => setActiveTab('details')} className={`${SHARED_STYLES.tabs.base} ${activeTab === 'details' ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>Obiekty noclegowe</button>
            </div>
            <MessageBox message={message.text} type={message.type} onDismiss={() => setMessage({ text: '', type: 'info' })} />
            <div>
                {activeTab === 'report' && ( <StaysAnnualReportTab isLoading={isLoading} yearData={yearData} selectedYear={selectedYear} totals={totals} months={months} handleOpenEditModal={handleOpenEditModal} handleDeleteStay={handleDeleteStay} handleMonthSelect={handleMonthSelect} selectedMonthData={selectedMonthData} /> )}
                {activeTab === 'comparison' && ( <StaysComparisonTab isLoading={isLoading} comparisonMode={comparisonMode} setComparisonMode={setComparisonMode} periodA={periodA} setPeriodA={setPeriodA} periodB={periodB} setPeriodB={setPeriodB} handleCompare={handleCompare} comparisonData={comparisonData} /> )}
                {activeTab === 'details' && ( <StaysDetailsTab detailsSearchTerm={detailsSearchTerm} setDetailsSearchTerm={setDetailsSearchTerm} sortConfig={sortConfig} handleSort={handleSort} detailsData={detailsData} months={months} hideEmpty={hideEmpty} setHideEmpty={setHideEmpty} /> )}
            </div>
        </div>
    );
}
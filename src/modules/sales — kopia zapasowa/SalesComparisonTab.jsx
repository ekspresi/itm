import React, { useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import FormField from '../../components/FormField';
import ComparisonCard from '../../components/ComparisonCard';
import { firebaseApi } from '../../lib/firebase';

export default function SalesComparisonTab() {
    const [isLoading, setIsLoading] = useState(false);
    const [comparisonMode, setComparisonMode] = useState('month');
    const [comparisonData, setComparisonData] = useState(null);

    const [periodA, setPeriodA] = useState(new Date().toISOString().slice(0, 7));
    const [periodB, setPeriodB] = useState(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        return d.toISOString().slice(0, 7);
    });

    const handleCompare = async () => {
        setIsLoading(true);
        setComparisonData(null);
        const fetchAndProcessPeriod = async (mode, period) => {
            let entries = [];
            if (mode === 'year') {
                const yearEntries = await firebaseApi.fetchCollection('sales_entries', { filter: { field: 'date', operator: '>=', value: `${period}-01-01` } }, true);
                entries = yearEntries.filter(e => e.date <= `${period}-12-31`);
            } else {
                const [year, month] = String(period).split('-');
                const monthEntries = await firebaseApi.fetchCollection('sales_entries', { filter: { field: 'date', operator: '>=', value: `${period}-01` } }, true);
                entries = monthEntries.filter(e => e.date <= `${period}-${new Date(year, month, 0).getDate()}`);
            }
            return entries.reduce((summary, entry) => {
                summary.total += entry.totalAmount || 0;
                summary.cash += entry.cashAmount || 0;
                summary.card += entry.cardAmount || 0;
                summary.invoice += entry.invoiceAmount || 0;
                return summary;
            }, { total: 0, cash: 0, card: 0, invoice: 0 });
        };
        try {
            const [dataA, dataB] = await Promise.all([
                fetchAndProcessPeriod(comparisonMode, periodA),
                fetchAndProcessPeriod(comparisonMode, periodB)
            ]);
            setComparisonData({ dataA, dataB });
        } catch (error) {
            console.error("Błąd podczas porównywania danych:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleModeChange = (mode) => {
        setComparisonMode(mode);
        setComparisonData(null);
        if (mode === 'year') {
            setPeriodA(new Date().getFullYear());
            setPeriodB(new Date().getFullYear() - 1);
        } else {
            setPeriodA(new Date().toISOString().slice(0, 7));
            const d = new Date();
            d.setFullYear(d.getFullYear() - 1);
            setPeriodB(d.toISOString().slice(0, 7));
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="max-w-2xl mx-auto">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center p-1 bg-gray-200 rounded-lg mb-6">
                    <button onClick={() => handleModeChange('month')} className={`w-full h-full p-2 rounded-md text-sm font-semibold ${comparisonMode === 'month' ? 'bg-white shadow' : 'bg-transparent text-gray-600'}`}>Miesiąc do miesiąca</button>
                    <button onClick={() => handleModeChange('year')} className={`w-full h-full p-2 rounded-md text-sm font-semibold ${comparisonMode === 'year' ? 'bg-white shadow' : 'bg-transparent text-gray-600'}`}>Rok do roku</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <FormField label="Okres A (nowszy)" htmlFor="period-a">{comparisonMode === 'year' ? ( <input type="number" id="period-a" value={periodA} onChange={e => setPeriodA(Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded-md"/> ) : ( <input type="month" id="period-a" value={periodA} onChange={e => setPeriodA(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md"/> )}</FormField>
                    <FormField label="Okres B (starszy)" htmlFor="period-b">{comparisonMode === 'year' ? ( <input type="number" id="period-b" value={periodB} onChange={e => setPeriodB(Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded-md"/> ) : ( <input type="month" id="period-b" value={periodB} onChange={e => setPeriodB(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md"/> )}</FormField>
                </div>
                <div className="mt-6">
                    <button onClick={handleCompare} disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center">
                        <i className="fa-solid fa-scale-balanced mr-2"></i>
                        {isLoading ? 'Porównuję...' : 'Porównaj okresy'}
                    </button>
                </div>
            </div>

            {/* --- NOWY BLOK WYŚWIETLAJĄCY WYNIKI --- */}
            <div className="mt-8 border-t pt-6">
                {isLoading && <LoadingSpinner />}
                {comparisonData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <ComparisonCard title="Gotówka" valueA={comparisonData.dataA.cash} valueB={comparisonData.dataB.cash} periodA={periodA} periodB={periodB} />
                        <ComparisonCard title="Terminal" valueA={comparisonData.dataA.card} valueB={comparisonData.dataB.card} periodA={periodA} periodB={periodB} />
                        <ComparisonCard title="Przelew" valueA={comparisonData.dataA.invoice} valueB={comparisonData.dataB.invoice} periodA={periodA} periodB={periodB} />
                        <ComparisonCard title="RAZEM" valueA={comparisonData.dataA.total} valueB={comparisonData.dataB.total} periodA={periodA} periodB={periodB} />
                    </div>
                )}
            </div>
            </div>
        </div>
    );
};
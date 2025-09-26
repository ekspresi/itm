import React from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import FormField from '../../components/FormField';
import ComparisonCard from '../../components/ComparisonCard';

export default function StaysComparisonTab({ isLoading, comparisonMode, setComparisonMode, periodA, setPeriodA, periodB, setPeriodB, handleCompare, comparisonData }) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center p-1 bg-gray-200 rounded-lg mb-6">
                    <button onClick={() => { setComparisonMode('year'); setPeriodA(new Date().getFullYear()); setPeriodB(new Date().getFullYear() - 1); }} className={`w-full h-full p-2 rounded-md text-sm font-semibold ${comparisonMode === 'year' ? 'bg-white shadow' : 'bg-transparent text-gray-600'}`}>Rok do roku</button>
                    <button onClick={() => { setComparisonMode('month'); setPeriodA(new Date().toISOString().slice(0, 7)); const d = new Date(); d.setFullYear(d.getFullYear() - 1); setPeriodB(d.toISOString().slice(0, 7)); }} className={`w-full h-full p-2 rounded-md text-sm font-semibold ${comparisonMode === 'month' ? 'bg-white shadow' : 'bg-transparent text-gray-600'}`}>Miesiąc do miesiąca</button>
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
            <div className="mt-8 border-t pt-6">
                {isLoading && <LoadingSpinner />}
                {comparisonData && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ComparisonCard title="Miasto Mikołajki" valueA={comparisonData.dataA.city} valueB={comparisonData.dataB.city} periodA={periodA} periodB={periodB} />
                        <ComparisonCard title="Gmina Mikołajki" valueA={comparisonData.dataA.municipality} valueB={comparisonData.dataB.municipality} periodA={periodA} periodB={periodB} />
                        <ComparisonCard title="RAZEM" valueA={comparisonData.dataA.total} valueB={comparisonData.dataB.total} periodA={periodA} periodB={periodB} />
                    </div>
                )}
            </div>
        </div>
    );
};
import React from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { StaysPieChart, StaysMonthlyBreakdownChart } from './StaysCharts';

export default function StaysAnnualReportTab({ isLoading, yearData, selectedYear, totals, months, handleOpenEditModal, handleDeleteStay, handleMonthSelect, selectedMonthData }) {
    let chartData = null;
    let chartTitle = '';
    if (selectedMonthData) {
        chartData = { city: selectedMonthData.city || 0, municipality: selectedMonthData.municipality || 0 };
        chartTitle = `Struktura pobytów - ${months[selectedMonthData.month - 1]} ${selectedYear}`;
    } else if (yearData.length > 0) {
        chartData = { city: totals.city, municipality: totals.municipality };
        chartTitle = `Struktura pobytów w roku ${selectedYear}`;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                {isLoading ? <LoadingSpinner /> : yearData.length === 0 ? (
                    <div className="p-8 bg-white rounded-lg shadow-md text-center text-gray-500">
                        <i className="fa-solid fa-chart-bar fa-3x mb-4 text-gray-300"></i>
                        <p>Brak danych o pobytach dla roku {selectedYear}.</p>
                        <p className="text-sm mt-2">Użyj przycisku "Dodaj dane", aby wprowadzić pierwszy wpis.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="hidden md:grid grid-cols-12 gap-4 px-4 text-left text-xs font-bold text-gray-500 uppercase"><div className="col-span-3">Miesiąc</div><div className="col-span-2 text-right">Miasto Mikołajki</div><div className="col-span-2 text-right">Gmina Mikołajki</div><div className="col-span-2 text-right">Razem</div><div className="col-span-3 text-right">Akcje</div></div>
                        {yearData.map(item => {
                            const total = (item.city || 0) + (item.municipality || 0);
                            const isSelected = selectedMonthData && selectedMonthData.id === item.id;
                            return (
                                <button key={item.id} onClick={() => handleMonthSelect(item)} className={`w-full text-left grid grid-cols-12 gap-4 items-center p-4 rounded-lg shadow-sm transition-all ${isSelected ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-white hover:shadow-md'}`}>
                                    <div className="col-span-3 font-bold text-blue-800">{months[item.month - 1]}</div>
                                    <div className="col-span-2 text-right font-semibold text-gray-700">{item.city || 0}</div>
                                    <div className="col-span-2 text-right font-semibold text-gray-700">{item.municipality || 0}</div>
                                    <div className="col-span-2 text-right font-bold text-lg">{total}</div>
                                    <div className="col-span-3 flex justify-end items-center gap-3">
                                        <button onClick={(e) => { e.stopPropagation(); handleOpenEditModal(item); }} className="text-blue-600 hover:text-blue-800" title="Edytuj"><i className="fa-solid fa-pencil"></i></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteStay(item.id); }} className="text-red-500 hover:text-red-700" title="Usuń"><i className="fa-solid fa-trash-can"></i></button>
                                    </div>
                                </button>
                            );
                        })}
                        <div className="grid grid-cols-12 gap-4 items-center bg-blue-800 text-white p-4 rounded-lg shadow-lg mt-4"><div className="col-span-3 font-bold uppercase">Suma roczna</div><div className="col-span-2 text-right font-semibold text-lg">{totals.city}</div><div className="col-span-2 text-right font-semibold text-lg">{totals.municipality}</div><div className="col-span-2 text-right font-bold text-xl">{totals.city + totals.municipality}</div><div className="col-span-3"></div></div>
                    </div>
                )}
            </div>
            <div className="lg:col-span-1 space-y-4">
                {!isLoading && chartData && ( <StaysPieChart data={chartData} title={chartTitle} /> )}
                {!isLoading && !selectedMonthData && yearData.length > 0 && ( <StaysMonthlyBreakdownChart yearData={yearData} months={months} year={selectedYear} /> )}
            </div>
        </div>
    );
};
import React, { useState, useEffect, useRef } from 'react';
import { SHARED_STYLES } from '../../lib/helpers';
import { getPrintHeaderDetails } from '../../lib/helpers';

export default function SalesToolbar({ activeTab, reportMonth, onMonthChange, reportYear, onYearChange, onAddSaleClick, handlePrint, salesData, annualData }) {
    const [isPrintMenuOpen, setPrintMenuOpen] = useState(false);
    const printMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (printMenuRef.current && !printMenuRef.current.contains(event.target)) {
                setPrintMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [printMenuRef]);

    const changeMonth = (direction) => {
        const d = new Date(reportMonth + '-02');
        d.setMonth(d.getMonth() + direction);
        onMonthChange(d.toISOString().slice(0, 7));
    };

    const changeYear = (direction) => {
        onYearChange(reportYear + direction);
    };

    const handlePrintOptionClick = (type) => {
        setPrintMenuOpen(false);
        if (activeTab === 'monthly' && salesData) {
            const dateStr = new Date(reportMonth + '-02').toLocaleString('pl-PL', { month: 'long', year: 'numeric' });
            const lastDay = new Date(reportMonth.split('-')[0], reportMonth.split('-')[1], 0).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }) + ' r.';
            const header = getPrintHeaderDetails('sales', lastDay);

            if (type === 'settlement') {
                handlePrint('monthly-sales-printable', 'Miesięczny Raport Sprzedaży', `za miesiąc ${dateStr}`, header);
            } else if (type === 'summary') {
                handlePrint('monthly-details-printable', 'Miesięczne Podsumowanie Sprzedaży', `za miesiąc ${dateStr}`, header);
            }
        } else if (activeTab === 'annual' && annualData) {
            const lastDay = new Date(reportYear, 11, 31).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }) + ' r.';
            const header = getPrintHeaderDetails('sales', lastDay);

            if (type === 'settlement') {
                handlePrint('annual-sales-printable', 'Roczny Raport Sprzedaży', `za rok ${reportYear}`, header);
            } else if (type === 'summary') {
                handlePrint('annual-details-printable', 'Roczne Podsumowanie Sprzedaży', `za rok ${reportYear}`, header);
            }
        } else {
            alert("Brak danych do wydrukowania w tym widoku.");
        }
    };

    return (
        <div className="flex flex-col md:flex-row items-center md:justify-between gap-4 mb-6 no-print">
            {/* Lewa strona: Dynamiczny selektor daty */}
            {/* ZMIANA: Dodajemy warunkową klasę 'invisible', aby ukryć ten blok w zakładce Porównanie */}
            <div className={`flex items-center justify-center gap-2 ${activeTab === 'comparison' ? 'invisible' : ''}`}>
                {activeTab === 'annual' ? (
                    <>
                        <button onClick={() => changeYear(-1)} className={SHARED_STYLES.toolbar.iconButton}><i className="fa-solid fa-chevron-left"></i></button>
                        <input type="number" value={reportYear} onChange={e => onYearChange(Number(e.target.value))} className="p-2 border border-gray-300 rounded-md shadow-sm h-10 font-semibold text-sm w-28 text-center" />
                        <button onClick={() => changeYear(1)} className={SHARED_STYLES.toolbar.iconButton}><i className="fa-solid fa-chevron-right"></i></button>
                    </>
                ) : (
                     <>
                        <button onClick={() => changeMonth(-1)} className={SHARED_STYLES.toolbar.iconButton}><i className="fa-solid fa-chevron-left"></i></button>
                        <input type="month" value={reportMonth} onChange={e => onMonthChange(e.target.value)} className="p-2 border border-gray-300 rounded-md shadow-sm h-10 font-semibold text-sm" />
                        <button onClick={() => changeMonth(1)} className={SHARED_STYLES.toolbar.iconButton}><i className="fa-solid fa-chevron-right"></i></button>
                    </>
                )}
            </div>

            {/* Prawa strona: Przyciski akcji */}
            <div className="flex w-full md:w-auto items-center gap-2">
                {/* NOWY PRZYCISK DRUKOWANIA Z MENU ROZWIJANYM */}
                <div className="relative" ref={printMenuRef}>
                    <button onClick={() => setPrintMenuOpen(prev => !prev)} className="bg-white hover:bg-gray-100 text-gray-800 border font-semibold text-sm h-10 px-4 rounded-lg flex items-center justify-center shadow-sm transition-colors" title="Drukuj">
                        <i className="fa-solid fa-print sm:mr-2"></i>
                        <span className="hidden sm:inline">Drukuj</span>
                        <i className="fa-solid fa-chevron-down text-xs ml-2"></i>
                    </button>
                    {isPrintMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                            <button onClick={() => handlePrintOptionClick('settlement')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Rozliczenie</button>
                            <button onClick={() => handlePrintOptionClick('summary')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Podsumowanie</button>
                            <button disabled className="block w-full text-left px-4 py-2 text-sm text-gray-400 cursor-not-allowed">Szablony</button>
                        </div>
                    )}
                </div>
                
                <button onClick={onAddSaleClick} className={SHARED_STYLES.toolbar.primaryButton}>
                    <i className="fa-solid fa-plus sm:mr-2"></i><span className="hidden sm:inline">Sprzedaż</span>
                </button>
            </div>
        </div>
    );
};
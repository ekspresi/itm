import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SHARED_STYLES } from '../../lib/helpers';

export default function VisitsToolbar({ activeTab, selectedDate, onDateChange, selectedMonth, onMonthChange, selectedYear, onYearChange, showMultiplied, onMultiplierChange, onClear, onSave, isSaveDisabled, onEditClick, onPrintClick, onConfigClick, touristCount, isComparisonActive, setIsComparisonActive, comparisonDate, setComparisonDate }) {
    const [isPrintMenuOpen, setPrintMenuOpen] = useState(false);
    const printMenuRef = React.useRef(null);

    const prevDayString = useMemo(() => {
        if (!selectedDate) return '';
        const mainDate = new Date(selectedDate + 'T12:00:00Z');
        if (isNaN(mainDate)) return '';
        mainDate.setUTCDate(mainDate.getUTCDate() - 1);
        return mainDate.toISOString().slice(0, 10);
    }, [selectedDate]);

    const prevMonthString = useMemo(() => {
        if (!selectedMonth) return '';
        const d = new Date(selectedMonth + '-02T12:00:00Z');
        if (isNaN(d)) return '';
        d.setUTCMonth(d.getUTCMonth() - 1);
        return d.toISOString().slice(0, 7);
    }, [selectedMonth]);
    
    const prevYearString = useMemo(() => {
        if (!selectedYear) return '';
        return String(Number(selectedYear) - 1);
    }, [selectedYear]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (printMenuRef.current && !printMenuRef.current.contains(event.target)) {
                setPrintMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [printMenuRef]);

    const handleCheckboxChange = (e) => {
        const isChecked = e.target.checked;
        setIsComparisonActive(isChecked);
        if (isChecked) {
            if (activeTab === 'daily') {
                setComparisonDate(prevDayString);
            } else if (activeTab === 'monthly') {
                setComparisonDate(prevMonthString);
            } else if (activeTab === 'annual') {
                setComparisonDate(prevYearString);
            }
        }
    };
    
    const changeDay = (direction) => {
        const d = new Date(selectedDate + 'T12:00:00Z');
        d.setUTCDate(d.getUTCDate() + direction);
        onDateChange(d.toISOString().slice(0, 10));
    };
    const changeMonth = (direction) => {
        const d = new Date(selectedMonth + '-02T12:00:00Z');
        d.setUTCMonth(d.getUTCMonth() + direction);
        onMonthChange(d.toISOString().slice(0, 7));
    };
    const changeYear = (direction) => onYearChange(selectedYear + direction);

    const renderRightSide = () => {
        const configButton = (
            <button onClick={onConfigClick} className={SHARED_STYLES.toolbar.iconButton} title="Ustawienia modułu">
                <i className="fa-solid fa-cog"></i>
            </button>
        );

        switch(activeTab) {
            case 'entry':
                return (
                    <>
                        {configButton}
                        <button onClick={onClear} className="bg-white hover:bg-gray-100 text-gray-800 border font-semibold text-sm h-10 px-4 rounded-lg flex items-center justify-center shadow-sm transition-colors">
                            <i className="fa-solid fa-eraser sm:mr-2"></i><span className="hidden sm:inline">Wyczyść</span>
                        </button>
                        <button onClick={onEditClick} className="bg-white hover:bg-gray-100 text-gray-800 border font-semibold text-sm h-10 px-4 rounded-lg flex items-center justify-center shadow-sm transition-colors">
                            <i className="fa-solid fa-pencil sm:mr-2"></i><span className="hidden sm:inline">Zarządzaj</span>
                        </button>
                        <button onClick={onSave} disabled={isSaveDisabled} className={SHARED_STYLES.toolbar.primaryButton}>
                            <i className="fa-solid fa-save mr-2"></i>Zapisz ({touristCount} os.)
                        </button>
                    </>
                );
            case 'daily':
            case 'monthly':
                 return (
                    <>
                        {configButton}
                        <button onClick={() => onPrintClick('summary')} className="bg-white hover:bg-gray-100 text-gray-800 border font-semibold text-sm h-10 px-4 rounded-lg flex items-center justify-center shadow-sm transition-colors">
                            <i className="fa-solid fa-print sm:mr-2"></i><span className="hidden sm:inline">Drukuj</span>
                        </button>
                    </>
                );
            case 'annual':
                return (
                    <>
                        {configButton}
                        <div className="relative" ref={printMenuRef}>
                            <button onClick={() => setPrintMenuOpen(prev => !prev)} className="bg-white hover:bg-gray-100 text-gray-800 border font-semibold text-sm h-10 px-4 rounded-lg flex items-center justify-center shadow-sm transition-colors">
                                <i className="fa-solid fa-print sm:mr-2"></i>
                                <span className="hidden sm:inline">Drukuj</span>
                                <i className="fa-solid fa-chevron-down text-xs ml-2"></i>
                            </button>
                            {isPrintMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                                    <button onClick={() => { setPrintMenuOpen(false); onPrintClick('summary'); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Raport skrócony</button>
                                    <button onClick={() => { setPrintMenuOpen(false); onPrintClick('detailed'); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Raport szczegółowy</button>
                                </div>
                            )}
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col md:flex-row items-center md:justify-between gap-4 mb-6 no-print">
            <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className={`flex items-center justify-center gap-2 flex-wrap`}>
                    {activeTab === 'entry' || activeTab === 'daily' ? (
                        <>
                            <div className="flex items-center gap-2">
                                <button onClick={() => changeDay(-1)} className={SHARED_STYLES.toolbar.iconButton}><i className="fa-solid fa-chevron-left"></i></button>
                                <input type="date" value={selectedDate} onChange={e => onDateChange(e.target.value)} className="p-2 border border-gray-300 rounded-md shadow-sm h-10 font-semibold" />
                                <button onClick={() => changeDay(1)} className={SHARED_STYLES.toolbar.iconButton}><i className="fa-solid fa-chevron-right"></i></button>
                            </div>
                            {activeTab === 'daily' && (
                                <div className="flex items-center gap-2 border-l pl-4">
                                    <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                                        <input type="checkbox" checked={isComparisonActive} onChange={handleCheckboxChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                                        Porównaj z
                                    </label>
                                    <input type="date" value={isComparisonActive ? comparisonDate : prevDayString} onChange={e => setComparisonDate(e.target.value)} disabled={!isComparisonActive} className="p-2 border border-gray-300 rounded-md shadow-sm h-10 font-semibold disabled:bg-gray-100 disabled:text-gray-500" />
                                    <div className="border-l h-6 border-gray-300"></div>
                                </div>
                            )}
                        </>
                    ) : activeTab === 'monthly' ? (
                        <>
                            <div className="flex items-center gap-2">
                                <button onClick={() => changeMonth(-1)} className={SHARED_STYLES.toolbar.iconButton}><i className="fa-solid fa-chevron-left"></i></button>
                                <input type="month" value={selectedMonth} onChange={e => onMonthChange(e.target.value)} className="p-2 border border-gray-300 rounded-md shadow-sm h-10 font-semibold" />
                                <button onClick={() => changeMonth(1)} className={SHARED_STYLES.toolbar.iconButton}><i className="fa-solid fa-chevron-right"></i></button>
                            </div>
                            <div className="flex items-center gap-2 border-l pl-4">
                                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                                    <input type="checkbox" checked={isComparisonActive} onChange={handleCheckboxChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                                    Porównaj z
                                </label>
                                <input type="month" value={isComparisonActive ? comparisonDate : prevMonthString} onChange={e => setComparisonDate(e.target.value)} disabled={!isComparisonActive} className="p-2 border border-gray-300 rounded-md shadow-sm h-10 font-semibold disabled:bg-gray-100 disabled:text-gray-500" />
                                <div className="border-l h-6 border-gray-300"></div>
                            </div>
                        </>
                    ) : activeTab === 'annual' ? (
                        <>
                            <div className="flex items-center gap-2">
                                <button onClick={() => changeYear(-1)} className={SHARED_STYLES.toolbar.iconButton}><i className="fa-solid fa-chevron-left"></i></button>
                                <input type="number" value={selectedYear} onChange={e => onYearChange(Number(e.target.value))} className="p-2 border border-gray-300 rounded-md shadow-sm h-10 font-semibold w-28 text-center" />
                                <button onClick={() => changeYear(1)} className={SHARED_STYLES.toolbar.iconButton}><i className="fa-solid fa-chevron-right"></i></button>
                            </div>
                            <div className="flex items-center gap-2 border-l pl-4">
                                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                                    <input type="checkbox" checked={isComparisonActive} onChange={handleCheckboxChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                                    Porównaj z
                                </label>
                                <input type="number" value={isComparisonActive ? comparisonDate : prevYearString} onChange={e => setComparisonDate(e.target.value)} disabled={!isComparisonActive} className="p-2 border border-gray-300 rounded-md shadow-sm h-10 font-semibold w-28 text-center disabled:bg-gray-100 disabled:text-gray-500" />
                                <div className="border-l h-6 border-gray-300"></div>
                            </div>
                        </>
                    ) : null}
                </div>
                {(activeTab === 'daily' || activeTab === 'monthly' || activeTab === 'annual') && (
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-600 cursor-pointer">
                        <input type="checkbox" checked={showMultiplied} onChange={e => onMultiplierChange(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        Mnożnik
                    </label>
                )}
            </div>
            <div className="flex w-full md:w-auto items-center justify-end gap-2">
                {renderRightSide()}
            </div>
        </div>
    );
};
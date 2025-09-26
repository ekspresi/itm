import React, { useState, useEffect } from 'react';
import { firebaseApi } from '../../lib/firebase';
import firebase from '../../lib/firebase';
import { SHARED_STYLES } from '../../lib/helpers';

import LoadingSpinner from '../../components/LoadingSpinner';
import MessageBox from '../../components/MessageBox';
import WorkTimeConfigModal from './WorkTimeConfigModal';
import WorkTimeEntryModal from './WorkTimeEntryModal';
import { WorkTimeDetailsTable } from './WorkTimeComponents';

export default function WorkTimeModule() {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: 'info' });
    const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
    const [reportData, setReportData] = useState(null);
    const [employeeList, setEmployeeList] = useState([]);
    const [isEntryModalOpen, setEntryModalOpen] = useState(false);
    const [isConfigModalOpen, setConfigModalOpen] = useState(false);
    const [editingEmployeeData, setEditingEmployeeData] = useState(null);

    const handleFetchReport = async (month) => {
        setIsLoading(true);
        setReportData(null);
        setMessage({ text: '', type: 'info' });

        const reportYear = month.substring(0, 4);
        const [year, monthNum] = month.split('-');
        const startDate = `${reportYear}-01-01`;
        const endDate = `${month}-${new Date(year, monthNum, 0).getDate()}`;

        try {
            const [employeesConfig, yearConfigs, allEntries] = await Promise.all([
                firebaseApi.fetchDocument('worktime_config', '--employees--'),
                firebaseApi.fetchCollection('worktime_config', { filter: { field: firebase.firestore.FieldPath.documentId(), operator: '>=', value: reportYear } }),
                firebaseApi.fetchCollection('worktime_entries', { filter: { field: 'date', operator: '>=', value: startDate } })
            ]);

            const employees = employeesConfig?.list || [];
            setEmployeeList(employees);

            if (employees.length === 0) {
                setMessage({ text: 'Brak zdefiniowanych pracowników. Skonfiguruj ich w ustawieniach.', type: 'info' });
                setIsLoading(false); return;
            }

            const entriesForPeriod = allEntries.filter(e => e.date <= endDate);

            const processedData = employees.reduce((acc, employeeName) => {
                const employeeEntriesForYear = entriesForPeriod.filter(e => e.employee === employeeName);
                if (employeeEntriesForYear.length === 0) return acc;

                let totalOvertime = 0;

                for (let i = 0; i < parseInt(monthNum, 10); i++) {
                    const currentLoopMonth = `${reportYear}-${String(i + 1).padStart(2, '0')}`;
                    const monthEntries = employeeEntriesForYear.filter(e => e.date.startsWith(currentLoopMonth));
                    const monthConfig = yearConfigs.find(c => c.id === currentLoopMonth);
                    const requiredHours = monthConfig?.requiredHours || 0;

                    if (monthEntries.length > 0 || requiredHours > 0) {
                        const workedHours = monthEntries.reduce((sum, e) => sum + (typeof e.value === 'number' ? e.value : 0), 0);
                        const leaveDays = monthEntries.filter(e => e.value === 'U').length;
                        const adjustedRequired = requiredHours > 0 ? requiredHours - (leaveDays * 8) : 0;
                        const overtimeForMonth = adjustedRequired > 0 ? workedHours - adjustedRequired : workedHours;
                        totalOvertime += overtimeForMonth;
                    }
                }

                const currentMonthEntries = employeeEntriesForYear.filter(e => e.date.startsWith(month));
                const currentMonthConfig = yearConfigs.find(c => c.id === month);
                const currentRequiredHours = currentMonthConfig?.requiredHours || 0;
                const currentWorkedHours = currentMonthEntries.reduce((sum, e) => sum + (typeof e.value === 'number' ? e.value : 0), 0);
                const currentLeaveDays = currentMonthEntries.filter(e => e.value === 'U').length;
                const currentAdjustedRequired = currentRequiredHours > 0 ? currentRequiredHours - (currentLeaveDays * 8) : 0;
                const currentOvertimeMonth = currentAdjustedRequired > 0 ? currentWorkedHours - currentAdjustedRequired : currentWorkedHours;

                acc[employeeName] = {
                    stats: { workedHours: currentWorkedHours, overtimeMonth: currentOvertimeMonth, totalOvertime: totalOvertime },
                    entries: currentMonthEntries.sort((a, b) => a.date.localeCompare(b.date))
                };
                return acc;
            }, {});

            if (Object.keys(processedData).length === 0) {
                 setMessage({ text: `Brak zarejestrowanych godzin pracy w miesiącu ${new Date(month + '-02').toLocaleString('pl-PL', { month: 'long', year: 'numeric' })}.`, type: 'info' });
            }
            setReportData(processedData);
        } catch (error) { console.error("Błąd pobierania raportu:", error); setMessage({ text: 'Wystąpił błąd podczas pobierania danych.', type: 'error' }); } finally { setIsLoading(false); }
    };

    useEffect(() => { handleFetchReport(reportMonth); }, [reportMonth]);

    const changeMonth = (direction) => { const d = new Date(reportMonth + '-02'); d.setMonth(d.getMonth() + direction); setReportMonth(d.toISOString().slice(0, 7)); };
    const handleMonthInputChange = (e) => { setReportMonth(e.target.value); };

    const handleSaveEmployeeList = async (newList) => { try { await firebaseApi.saveDocument('worktime_config', { id: '--employees--', list: newList }); setEmployeeList(newList); } catch (e) { console.error(e); } };
    const handleSaveYearBatch = async (hoursByMonth, year) => {
        const promises = [];
        for (const monthId in hoursByMonth) {
            const hours = Number(hoursByMonth[monthId]);
            if (!isNaN(hours) && hours >= 0) {
                 promises.push(firebaseApi.saveDocument('worktime_config', { id: monthId, requiredHours: hours }));
            }
        }
        try { await Promise.all(promises); setMessage({ text: `Zapisano wymiar godzin dla roku ${year}.`, type: 'success' }); handleFetchReport(reportMonth); } catch (error) { console.error(error); setMessage({ text: "Błąd zapisu.", type: 'error' }); }
    };

    const handleSaveEntries = async (entriesToSave, employee) => {
        const savePromises = entriesToSave.map(entry => {
            const docId = `${entry.date}_${employee}`;
            const data = { employee, date: entry.date, value: entry.value };
            return firebaseApi.saveDocument('worktime_entries', { ...data, id: docId });
        });
        let deletePromises = [];
        if (editingEmployeeData) {
            const originalEntries = editingEmployeeData.entries;
            const entriesToSaveIds = new Set(entriesToSave.map(e => e.id));
            const entriesToDelete = originalEntries.filter(orig => !entriesToSaveIds.has(orig.id));
            deletePromises = entriesToDelete.map(entry => {
                const docId = `${entry.date}_${employee}`;
                return firebaseApi.deleteDocument('worktime_entries', docId);
            });
        }
        const allPromises = [...savePromises, ...deletePromises];
        try {
            await Promise.all(allPromises);
            setMessage({ text: 'Pomyślnie zapisano zmiany.', type: 'success' });
            handleFetchReport(reportMonth);
        } catch (error) { console.error("Błąd zapisu czasu pracy:", error); setMessage({ text: 'Wystąpił błąd podczas zapisu.', type: 'error' }); }
    };

    const handleOpenAddModal = () => { setEditingEmployeeData(null); setEntryModalOpen(true); };
    const handleOpenEditModal = (employeeName) => { const employeeData = reportData[employeeName]; setEditingEmployeeData({ employeeName, entries: employeeData.entries }); setEntryModalOpen(true); };

    return (
        <div className="max-w-7xl mx-auto">
            <WorkTimeConfigModal isOpen={isConfigModalOpen} onClose={() => setConfigModalOpen(false)} employees={employeeList} onSaveEmployees={handleSaveEmployeeList} onSaveYearBatch={handleSaveYearBatch} />
            <WorkTimeEntryModal isOpen={isEntryModalOpen} onClose={() => setEntryModalOpen(false)} employees={employeeList} onSave={handleSaveEntries} editingData={editingEmployeeData} />
            <div className="flex flex-col md:flex-row items-center md:justify-between gap-4 mb-6 no-print">
                <div className="flex items-center justify-center gap-2">
                    <button onClick={() => changeMonth(-1)} className={SHARED_STYLES.toolbar.iconButton}><i className="fa-solid fa-chevron-left"></i></button>
                    <input type="month" value={reportMonth} onChange={handleMonthInputChange} className="p-2 border border-gray-300 rounded-md shadow-sm h-10 font-semibold text-sm" />
                    <button onClick={() => changeMonth(1)} className={SHARED_STYLES.toolbar.iconButton}><i className="fa-solid fa-chevron-right"></i></button>
                </div>
                <div className="flex w-full md:w-auto items-center gap-2">
                    <button onClick={() => setConfigModalOpen(true)} className={SHARED_STYLES.toolbar.iconButton} title="Konfiguracja"><i className="fa-solid fa-cog"></i></button>
                    <button onClick={handleOpenAddModal} className={SHARED_STYLES.toolbar.primaryButton}><i className="fa-solid fa-plus sm:mr-2"></i><span className="hidden sm:inline">Czas pracy</span></button>
                </div>
            </div>
            <MessageBox message={message.text} type={message.type} onDismiss={() => setMessage({ text: '', type: 'info' })} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {isLoading ? (
                    <div className="lg:col-span-2"><LoadingSpinner /></div>
                ) : !reportData || Object.keys(reportData).length === 0 ? (
                    <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-md text-center text-gray-500">
                        <i className="fa-solid fa-folder-open fa-3x mb-4 text-gray-300"></i>
                        <p>Brak danych do wyświetlenia dla tego miesiąca.</p>
                    </div>
                ) : (
                    Object.entries(reportData).map(([employeeName, data]) => (
                         <div key={employeeName} className="bg-white p-4 rounded-lg shadow-md">
                            <h3 className="text-xl font-bold text-center text-blue-800 mb-4">{employeeName}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-center mb-4">
                                <div className="p-3 bg-gray-50 rounded-md border"><p className="text-sm text-gray-500">Przepracowane</p><p className="text-2xl font-bold">{data.stats.workedHours} h</p></div>
                                <div className="p-3 bg-gray-50 rounded-md border"><p className="text-sm text-gray-500">Bilans miesiąca</p><p className={`text-2xl font-bold ${data.stats.overtimeMonth >= 0 ? 'text-green-600' : 'text-red-600'}`}>{data.stats.overtimeMonth.toFixed(1)} h</p></div>
                                <div className="p-3 bg-blue-50 border-blue-200 border rounded-md"><p className="text-sm font-bold text-blue-800">Suma nadgodzin</p><p className={`text-2xl font-bold ${data.stats.totalOvertime >= 0 ? 'text-green-700' : 'text-red-700'}`}>{data.stats.totalOvertime.toFixed(1)} h</p></div>
                            </div>
                            <WorkTimeDetailsTable entries={data.entries} month={reportMonth} />
                            <div className="text-center mt-4"><button onClick={() => handleOpenEditModal(employeeName)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold py-2 px-4 rounded-lg"><i className="fa-solid fa-pencil mr-2"></i>Edytuj miesiąc</button></div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
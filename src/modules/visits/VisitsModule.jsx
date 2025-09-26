import React, { useState, useEffect, useRef, useCallback } from 'react';
import { firebaseApi } from '../../lib/firebase';
import { SHARED_STYLES } from '../../lib/helpers';

// Import wszystkich części składowych
import VisitsToolbar from './VisitsToolbar';
import VisitEntryTab from './VisitEntryTab';
import VisitDailyDashboardTab from './VisitDailyDashboardTab';
import VisitMonthlyDashboardTab from './VisitMonthlyDashboardTab';
import VisitAnnualDashboardTab from './VisitAnnualDashboardTab';
import VisitsSettingsPanel from './VisitsSettingsPanel';
import VisitDataImporter from './VisitDataImporter';
import WorkTimeDataMigrator from './WorkTimeDataMigrator';
import VisitEditGroupModal from './VisitEditGroupModal';
import VisitFixedDataModal from './VisitFixedDataModal';
import { PrintableDailyVisitReport, PrintableMonthlyVisitReport, PrintableAnnualVisitReport, PrintableAnnualDetailedReport } from './PrintableReports';

export default function VisitsModule({ db, user, appId, handlePrint }) {
    const [activeTab, setActiveTab] = useState('entry');
    const [showMultiplied, setShowMultiplied] = useState(true); // Domyślnie włączony mnożnik
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const [isEditGroupModalOpen, setEditGroupModalOpen] = useState(false);
    const [isFixedDataModalOpen, setFixedDataModalOpen] = useState(false);

    const [currentView, setCurrentView] = useState('dashboard');
    const [refreshKey, setRefreshKey] = useState(0); 
    const [allIndicators, setAllIndicators] = useState([]);
    const [yearlySettings, setYearlySettings] = useState({});

    const [reportSummaryData, setReportSummaryData] = useState(null);
    const [monthlyBreakdownData, setMonthlyBreakdownData] = useState(null);
    const [touristCount, setTouristCount] = useState(0);
    const [groupToEdit, setGroupToEdit] = useState(null);
    const [dataToPreload, setDataToPreload] = useState(null);
    const [scrollToGroups, setScrollToGroups] = useState(false);

    const [isSaveDisabled, setIsSaveDisabled] = useState(true); 
    const clearFormRef = useRef(null);
    const saveFormRef = useRef(null);

    const [comparisonState, setComparisonState] = useState({
        daily: { isActive: false, date: '' },
        monthly: { isActive: false, date: '' },
        annual: { isActive: false, date: '' },
    });

    useEffect(() => {
        const fetchGlobalConfig = async () => {
            const [indicatorsData, configData] = await Promise.all([
                firebaseApi.fetchCollection('indicators'),
                firebaseApi.fetchDocument('visits_config', '--main--')
            ]);
            setAllIndicators(indicatorsData || []);
            setYearlySettings(configData?.yearlySettings || {});
        };
        fetchGlobalConfig();
    }, [refreshKey]);

    const handleConfigClick = () => setCurrentView('settings'); 
    const handleReturnToDashboard = () => {
        setCurrentView('dashboard');
        setRefreshKey(prev => prev + 1);
    };

    const handleOpenFixedDataModal = () => setFixedDataModalOpen(true);
    const handleSaveSuccess = () => { setRefreshKey(prevKey => prevKey + 1); setEditGroupModalOpen(false); setFixedDataModalOpen(false); };
    const handleDeleteGroup = async (groupId) => {
        await firebaseApi.deleteDocument('visits', groupId);
        setRefreshKey(prevKey => prevKey + 1);
    };
    const handleEditGroup = (groupData) => { setGroupToEdit(groupData); setEditGroupModalOpen(true); };
    const handleDataLoaded = useCallback((data) => {
        if (data) {
            setReportSummaryData(data.summary || data);
            setMonthlyBreakdownData(data.breakdown || null);
        } else {
            setReportSummaryData(null);
            setMonthlyBreakdownData(null);
        }
    }, []);

    const handleManageDayClick = () => {
        setActiveTab('daily');
        setScrollToGroups(true);
    };

    const handlePrintClick = (type = 'summary') => {
        const dataToPrint = (type === 'detailed') ? monthlyBreakdownData : reportSummaryData;
        if (!dataToPrint) {
            alert("Brak danych do wydrukowania w tym widoku.");
            return;
        }
        let printId, title, subtitle, dateForHeader, isLandscape = false;
        const header = getPrintHeaderDetails(null); 
        if (activeTab === 'daily') {
            printId = 'daily-visit-printable';
            title = 'Dzienny Raport Odwiedzin';
            dateForHeader = new Date(selectedDate + 'T12:00:00Z').toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }) + ' r.';
            subtitle = new Date(selectedDate + 'T12:00:00Z').toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
        } else if (activeTab === 'monthly') {
            printId = 'monthly-visit-printable';
            title = 'Miesięczny Raport Odwiedzin';
            const [year, month] = selectedMonth.split('-');
            subtitle = new Date(selectedMonth + '-02').toLocaleString('pl-PL', { month: 'long', year: 'numeric' });
            dateForHeader = new Date(year, month, 0).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }) + ' r.';
        } else if (activeTab === 'annual') {
            subtitle = `${selectedYear}`;
            dateForHeader = new Date(selectedYear, 11, 31).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }) + ' r.';
            if (type === 'detailed') {
                printId = 'annual-visit-detailed-printable';
                title = 'Szczegółowy Raport Roczny Odwiedzin';
                isLandscape = true;
            } else {
                printId = 'annual-visit-printable';
                title = 'Roczny Raport Odwiedzin';
            }
        } else { return; }
        header.date = dateForHeader;
        handlePrint(printId, title, subtitle, header, isLandscape);
    };

    const handleClear = () => { if(clearFormRef.current) clearFormRef.current(); };
    const handleSave = () => { if(saveFormRef.current) saveFormRef.current(); };

    return (
        <div className="max-w-7xl mx-auto">
            {/* ZMIANA: Usunięto VisitManageDayModal */}
            <VisitEditGroupModal isOpen={isEditGroupModalOpen} onClose={() => setEditGroupModalOpen(false)} groupToEdit={groupToEdit} allIndicators={allIndicators} yearlySettings={yearlySettings} onSaveSuccess={handleSaveSuccess} />
            <VisitFixedDataModal isOpen={isFixedDataModalOpen} onClose={() => setFixedDataModalOpen(false)} selectedDate={selectedDate} onSaveSuccess={handleSaveSuccess} allIndicators={allIndicators} />

            {currentView === 'dashboard' ? (
                <>
                    <VisitsToolbar 
                        activeTab={activeTab}
                        selectedDate={selectedDate} onDateChange={setSelectedDate}
                        selectedMonth={selectedMonth} onMonthChange={setSelectedMonth}
                        selectedYear={selectedYear} onYearChange={setSelectedYear}
                        showMultiplied={showMultiplied} onMultiplierChange={setShowMultiplied}
                        onClear={handleClear}
                        onSave={handleSave}
                        isSaveDisabled={isSaveDisabled}
                        onEditClick={handleManageDayClick}
                        onPrintClick={handlePrintClick}
                        onConfigClick={handleConfigClick}
                        touristCount={touristCount}
                        isComparisonActive={comparisonState[activeTab]?.isActive || false}
                        setIsComparisonActive={(isActive) => setComparisonState(prev => ({...prev, [activeTab]: {...prev[activeTab], isActive}}))}
                        comparisonDate={comparisonState[activeTab]?.date || ''}
                        setComparisonDate={(date) => setComparisonState(prev => ({...prev, [activeTab]: {...prev[activeTab], date}}))}
                    />
                    <div className="flex border-b mb-6 overflow-x-auto">
                        <button onClick={() => setActiveTab('entry')} className={`${SHARED_STYLES.tabs.base} ${activeTab === 'entry' ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>Wprowadzanie</button>
                        <button onClick={() => setActiveTab('daily')} className={`${SHARED_STYLES.tabs.base} ${activeTab === 'daily' ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>Podsumowanie dzienne</button>
                        <button onClick={() => setActiveTab('monthly')} className={`${SHARED_STYLES.tabs.base} ${activeTab === 'monthly' ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>Podsumowanie miesięczne</button>
                        <button onClick={() => setActiveTab('annual')} className={`${SHARED_STYLES.tabs.base} ${activeTab === 'annual' ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>Podsumowanie roczne</button>
                        <button onClick={() => setActiveTab('importer')} className={`${SHARED_STYLES.tabs.base} ${activeTab === 'importer' ? 'border-b-2 border-yellow-600 text-yellow-600' : SHARED_STYLES.tabs.inactive}`}>
                            <i className="fa-solid fa-upload mr-2"></i>Importer
                        </button>
                        <button onClick={() => setActiveTab('migracja')} className={`${SHARED_STYLES.tabs.base} ${activeTab === 'migracja' ? 'border-b-2 border-orange-600 text-orange-600' : SHARED_STYLES.tabs.inactive}`}>
                            <i className="fa-solid fa-database mr-2"></i>Migracja Czasu Pracy
                        </button>
                    </div>
                    <div>
                        {activeTab === 'entry' && (
                            <VisitEntryTab 
                                key={`entry-${refreshKey}`}
                                db={db} user={user} 
                                selectedDate={selectedDate}
                                onSave={(func) => saveFormRef.current = func}
                                onClear={(func) => clearFormRef.current = func}
                                setIsSaveDisabled={setIsSaveDisabled}
                                onTouristCountChange={setTouristCount}
                                dataToPreload={dataToPreload}
                                onPreloadComplete={() => setDataToPreload(null)}
                            />
                        )}
                        {activeTab === 'daily' && (
                            <VisitDailyDashboardTab 
                                key={`daily-${refreshKey}`} 
                                db={db} appId={appId} 
                                showMultiplied={showMultiplied} 
                                selectedDate={selectedDate} 
                                onDataLoaded={handleDataLoaded}
                                onOpenFixedDataModal={handleOpenFixedDataModal}
                                onEditGroup={handleEditGroup}
                                onDeleteGroup={handleDeleteGroup}
                                isComparisonActive={comparisonState.daily.isActive}
                                comparisonDate={comparisonState.daily.date}
                                scrollToGroups={scrollToGroups}
                                onScrollComplete={() => setScrollToGroups(false)}
                            />
                        )}
                        {activeTab === 'monthly' && (
                            <VisitMonthlyDashboardTab 
                                key={`monthly-${refreshKey}`} 
                                db={db} 
                                appId={appId} 
                                showMultiplied={showMultiplied} 
                                selectedMonth={selectedMonth} 
                                onDataLoaded={handleDataLoaded} 
                                isComparisonActive={comparisonState.monthly.isActive}
                                comparisonDate={comparisonState.monthly.date}
                            />
                        )}
                        {activeTab === 'annual' && (
                            <VisitAnnualDashboardTab 
                                key={`annual-${refreshKey}`} 
                                db={db} 
                                appId={appId} 
                                showMultiplied={showMultiplied} 
                                selectedYear={selectedYear} 
                                onDataLoaded={handleDataLoaded} 
                                isComparisonActive={comparisonState.annual.isActive}
                                comparisonDate={comparisonState.annual.date}
                            />
                        )}
                        {activeTab === 'importer' && (
                            <VisitDataImporter 
                                allIndicators={allIndicators} 
                                onImportComplete={() => setRefreshKey(prev => prev + 1)} 
                            />
                        )}
                        {activeTab === 'migracja' && (
                            <WorkTimeDataMigrator />
                        )}
                    </div>
                </>
            ) : (
                <VisitsSettingsPanel onReturn={handleReturnToDashboard} />
            )}
            <div className="hidden">
                 <div id="daily-visit-printable"><PrintableDailyVisitReport statsData={reportSummaryData} showMultiplied={showMultiplied} allIndicators={allIndicators} /></div>
                 <div id="monthly-visit-printable"><PrintableMonthlyVisitReport statsData={reportSummaryData} showMultiplied={showMultiplied} allIndicators={allIndicators} /></div>
                 <div id="annual-visit-printable"><PrintableAnnualVisitReport statsData={reportSummaryData} showMultiplied={showMultiplied} allIndicators={allIndicators} /></div>
                 <div id="annual-visit-detailed-printable"><PrintableAnnualDetailedReport monthlyBreakdownData={monthlyBreakdownData} showMultiplied={showMultiplied} allIndicators={allIndicators} /></div>
            </div>
        </div>
    );
}
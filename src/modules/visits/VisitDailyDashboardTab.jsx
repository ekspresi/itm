import React, { useState, useEffect, useMemo } from 'react';
import { firebaseApi } from '../../lib/firebase';
import { getPolishPlural, BIKE_REPORT_SORT_ORDER_V2 } from '../../lib/helpers';
import { aggregateRawVisits, calculateMultipliedData } from '../../lib/helpers';
import LoadingSpinner from '../../components/LoadingSpinner';
import KpiCard, { ComparisonIndicator } from '../../components/KpiCard';
import { VisitsHourlyTrendChart, VisitsPurposePieChart } from './VisitsCharts';

export default function VisitDailyDashboardTab({ db, appId, showMultiplied, selectedDate, onDataLoaded, onOpenFixedDataModal, onEditGroup, onDeleteGroup, isComparisonActive, comparisonDate, scrollToGroups, onScrollComplete }) {
    const [isLoading, setIsLoading] = useState(true);
    const [statsData, setStatsData] = useState(null);
    const [currentYearSettings, setCurrentYearSettings] = useState({ mode: 'multiplier' });
    const [allIndicators, setAllIndicators] = useState([]);
    const [visitGroups, setVisitGroups] = useState([]);

    useEffect(() => {
        if (scrollToGroups && !isLoading) {
            const section = document.getElementById('registered-groups-section');
            if (section) {
                setTimeout(() => {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
            onScrollComplete();
        }
    }, [scrollToGroups, isLoading, onScrollComplete]);

    const calculatePercentageChange = (current, previous) => {
        const c = current || 0;
        const p = previous || 0;
        if (p === 0) return c > 0 ? 100 : 0;
        return ((c - p) / p) * 100;
    };

    useEffect(() => {
        const fetchDailyStats = async () => {
            setIsLoading(true);
            setStatsData(null);
            onDataLoaded(null);
            setVisitGroups([]);

            try {
                const [indicators, configDoc] = await Promise.all([
                    firebaseApi.fetchCollection('indicators'),
                    firebaseApi.fetchDocument('visits_config', '--main--')
                ]);
                const yearlySettings = configDoc?.yearlySettings || {};
                
                let effectiveComparisonDate = '';
                if (isComparisonActive && comparisonDate) {
                    effectiveComparisonDate = comparisonDate;
                } else {
                    const prevDayQuery = await db.collection(firebaseApi._getFullPath('visits')).where('date', '<', selectedDate).orderBy('date', 'desc').limit(1).get();
                    if (!prevDayQuery.empty) {
                        effectiveComparisonDate = prevDayQuery.docs[0].data().date;
                    }
                }

                const [mainDayGroups, comparisonDayGroups] = await Promise.all([
                    firebaseApi.fetchCollection('visits', { filter: { field: 'date', operator: '==', value: selectedDate } }),
                    effectiveComparisonDate ? firebaseApi.fetchCollection('visits', { filter: { field: 'date', operator: '==', value: effectiveComparisonDate } }) : Promise.resolve([])
                ]);
                
                const year = selectedDate.substring(0, 4);
                const settingsForYear = yearlySettings[year] || { mode: 'multiplier', value: 1, barometrEnabled: false };
                const rawData = aggregateRawVisits(mainDayGroups);
                
                let fixedDayData = null;
                if (settingsForYear.mode === 'fixed') {
                    fixedDayData = await firebaseApi.fetchDocument('overrides', selectedDate);
                }

                if (rawData.total === 0 && !fixedDayData) {
                    setStatsData(null); onDataLoaded(null); setIsLoading(false);
                    return; 
                }
                
                const indicatorsBySlug = new Map((indicators || []).map(i => [i.slug, i]));
                setAllIndicators(indicators || []);
                setCurrentYearSettings(settingsForYear);
                setVisitGroups(mainDayGroups.sort((a,b) => b.timestamp.toMillis() - a.timestamp.toMillis()));
                
                const emptyComparison = { total: 0, gender: {}, language: {}, purpose: {}, hourlyTotals: Array(24).fill(0), avgHourly: 0, largestGroup: 0, bestHour: { hour: 'N/A', count: 0 }, topPurpose: { name: 'Brak', slug: null, count: 0 } };

                const rawComparison = comparisonDayGroups.length > 0 ? aggregateRawVisits(comparisonDayGroups) : { ...emptyComparison };
                rawComparison.hourlyTotals = Array(24).fill(0);
                comparisonDayGroups.forEach(g => { if (g.timestamp?.toDate()) { rawComparison.hourlyTotals[g.timestamp.toDate().getHours()] += (g.tourists?.length || 0); }});
                const comparisonHoursWithVisits = rawComparison.hourlyTotals.slice(8, 21).filter(h => h > 0).length;
                rawComparison.avgHourly = comparisonHoursWithVisits > 0 ? rawComparison.total / comparisonHoursWithVisits : 0;
                rawComparison.largestGroup = Math.max(0, ...comparisonDayGroups.map(g => g.tourists?.length || 0));
                rawComparison.bestHour = { hour: rawComparison.hourlyTotals.indexOf(Math.max(...rawComparison.hourlyTotals)), count: Math.max(...rawComparison.hourlyTotals) };
                const topPurposeEntryComparison = Object.entries(rawComparison.purpose).sort((a,b) => b[1] - a[1])[0] || [null, 0];
                rawComparison.topPurpose = { name: indicatorsBySlug.get(topPurposeEntryComparison[0])?.name || "Brak", slug: topPurposeEntryComparison[0], count: topPurposeEntryComparison[1] };
                
                let multipliedComparison = { ...emptyComparison };
                if (effectiveComparisonDate) {
                    const comparisonYear = effectiveComparisonDate.substring(0, 4);
                    const settingsForComparisonYear = yearlySettings[comparisonYear] || { mode: 'multiplier', value: 1 };
                    
                    if (settingsForComparisonYear.mode === 'fixed') {
                        const fixedComparisonData = await firebaseApi.fetchDocument('overrides', effectiveComparisonDate);
                        if (fixedComparisonData) {
                             const topPurposeEntry = Object.entries(fixedComparisonData.purpose || {}).sort((a,b) => b[1] - a[1])[0] || [null, 0];
                             multipliedComparison = {
                                ...emptyComparison,
                                ...fixedComparisonData,
                                topPurpose: { name: indicatorsBySlug.get(topPurposeEntry[0])?.name || "Brak", slug: topPurposeEntry[0], count: topPurposeEntry[1] },
                            };
                        }
                    } else {
                        multipliedComparison = calculateMultipliedData(rawComparison, settingsForComparisonYear.value || 1);
                        multipliedComparison.hourlyTotals = rawComparison.hourlyTotals.map(h => Math.round(h * (settingsForComparisonYear.value || 1)));
                        const multipliedComparisonHoursWithVisits = multipliedComparison.hourlyTotals.slice(8, 21).filter(h => h > 0).length;
                        multipliedComparison.avgHourly = multipliedComparisonHoursWithVisits > 0 ? multipliedComparison.total / multipliedComparisonHoursWithVisits : 0;
                        multipliedComparison.bestHour = { hour: multipliedComparison.hourlyTotals.indexOf(Math.max(...multipliedComparison.hourlyTotals)), count: Math.max(...multipliedComparison.hourlyTotals) };
                        const topPurposeMultipliedComparison = { ...rawComparison.topPurpose, count: multipliedComparison.purpose?.[rawComparison.topPurpose.slug] || 0 };
                        multipliedComparison.topPurpose = topPurposeMultipliedComparison;
                    }
                }
                
                const hourlyTotalsRaw = Array(24).fill(0);
                mainDayGroups.forEach(g => { if (g.timestamp?.toDate()) { hourlyTotalsRaw[g.timestamp.toDate().getHours()] += (g.tourists?.length || 0); }});
                const hoursWithVisits = hourlyTotalsRaw.slice(8, 21).filter(h => h > 0).length;
                const largestGroupSize = Math.max(0, ...mainDayGroups.map(g => g.tourists?.length || 0));
                
                let finalMultipliedObject;
                const multipliedData = fixedDayData || calculateMultipliedData(rawData, settingsForYear.value || 1);

                if (settingsForYear.mode === 'fixed') {
                    const topPurposeEntry = Object.entries(multipliedData.purpose || {}).sort((a,b) => b[1] - a[1])[0] || [null, 0];
                    finalMultipliedObject = {
                        ...multipliedData,
                        avgHourly: 'N/A',
                        bestHour: { hour: 'N/A', count: 0 },
                        largestGroup: 'N/A',
                        topPurpose: { name: indicatorsBySlug.get(topPurposeEntry[0])?.name || "Brak", slug: topPurposeEntry[0], count: topPurposeEntry[1] },
                    };
                } else {
                    multipliedData.hourlyTotals = hourlyTotalsRaw.map(h => Math.round(h * (settingsForYear.value || 1)));
                    const multipliedHoursWithVisits = multipliedData.hourlyTotals.slice(8, 21).filter(h => h > 0).length;
                    const topPurposeEntry = Object.entries(rawData.purpose).sort((a,b) => b[1] - a[1])[0] || [null, 0];
                    const topPurpose = { name: indicatorsBySlug.get(topPurposeEntry[0])?.name || "Brak", slug: topPurposeEntry[0], count: topPurposeEntry[1] };
                    finalMultipliedObject = {
                        ...multipliedData,
                        avgHourly: { value: multipliedHoursWithVisits > 0 ? multipliedData.total / multipliedHoursWithVisits : 0, dod: calculatePercentageChange(multipliedHoursWithVisits > 0 ? multipliedData.total / multipliedHoursWithVisits : 0, multipliedComparison.avgHourly), diff: ((multipliedHoursWithVisits > 0 ? multipliedData.total / multipliedHoursWithVisits : 0) - (multipliedComparison.avgHourly || 0)) },
                        bestHour: { hour: multipliedData.hourlyTotals.indexOf(Math.max(...multipliedData.hourlyTotals)), count: Math.max(...multipliedData.hourlyTotals) },
                        topPurpose: { ...topPurpose, count: multipliedData.purpose?.[topPurposeEntry[0]] || 0 },
                        largestGroup: { value: largestGroupSize },
                    };
                }
                
                const topPurposeEntryRaw = Object.entries(rawData.purpose).sort((a,b) => b[1] - a[1])[0] || [null, 0];
                const finalData = {
                    raw: { ...rawData, hourlyTotals: hourlyTotalsRaw,
                        total: { value: rawData.total, dod: calculatePercentageChange(rawData.total, rawComparison.total), diff: rawData.total - rawComparison.total },
                        avgHourly: { value: hoursWithVisits > 0 ? rawData.total / hoursWithVisits : 0, dod: calculatePercentageChange(hoursWithVisits > 0 ? rawData.total / hoursWithVisits : 0, rawComparison.avgHourly), diff: ((hoursWithVisits > 0 ? rawData.total / hoursWithVisits : 0) - rawComparison.avgHourly) },
                        bestHour: { hour: hourlyTotalsRaw.indexOf(Math.max(...hourlyTotalsRaw)), count: Math.max(...hourlyTotalsRaw) },
                        largestGroup: { value: largestGroupSize, dod: calculatePercentageChange(largestGroupSize, rawComparison.largestGroup), diff: largestGroupSize - rawComparison.largestGroup },
                        topPurpose: { name: indicatorsBySlug.get(topPurposeEntryRaw[0])?.name || "Brak", slug: topPurposeEntryRaw[0], count: topPurposeEntryRaw[1] },
                        rawComparison
                    },
                    multiplied: {
                        ...finalMultipliedObject,
                        total: { value: multipliedData.total || 0, dod: calculatePercentageChange(multipliedData.total, multipliedComparison.total), diff: (multipliedData.total || 0) - (multipliedComparison.total || 0) },
                        comparison: multipliedComparison
                    }
                };
                
                setStatsData(finalData); 
                onDataLoaded(finalData);
            } catch (error) { console.error("Błąd pobierania statystyk dziennych:", error); } finally { setIsLoading(false); }
        };
        fetchDailyStats();
    }, [selectedDate, onDataLoaded, db, isComparisonActive, comparisonDate]);

    const displayData = showMultiplied ? statsData?.multiplied : statsData?.raw;
    const purposeSorted = displayData?.purpose ? Object.entries(displayData.purpose).sort((a, b) => b[1] - a[1]) : [];
    const bikeStatsSorted = statsData?.raw?.bikeStats ? BIKE_REPORT_SORT_ORDER_V2.map(key => [key, statsData.raw.bikeStats[key]]).filter(([, count]) => count > 0) : [];
    const actionButton = "bg-white hover:bg-gray-100 text-gray-600 w-8 h-8 rounded-lg border shadow-sm flex items-center justify-center transition-colors";
    
    const allActiveIndicators = Array.from(new Set([...Object.keys(statsData?.raw?.gender || {}), ...Object.keys(statsData?.raw?.language || {}), ...Object.keys(statsData?.raw?.rawComparison?.gender || {}), ...Object.keys(statsData?.raw?.rawComparison?.language || {})]));
    const activeIndicators = {
        gender: allIndicators.filter(ind => ind.category === 'gender' && allActiveIndicators.includes(ind.slug)).sort((a,b) => a.sortOrder - b.sortOrder),
        language: allIndicators.filter(ind => ind.category === 'language' && allActiveIndicators.includes(ind.slug)).sort((a,b) => a.sortOrder - b.sortOrder)
    };

    return (
        <div>
            {currentYearSettings.mode === 'fixed' && !isComparisonActive && ( <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg flex items-center justify-between"><p className="text-sm font-semibold text-blue-800">Przeglądasz dane dla roku w trybie ręcznym.</p><button onClick={onOpenFixedDataModal} className={SHARED_STYLES.buttons.primary}><i className="fa-solid fa-pencil mr-2"></i> Wprowadź/Edytuj dane stałe</button></div> )}
            {isLoading && <LoadingSpinner />}
             {!isLoading && !statsData && ( 
                <div className="text-center text-gray-500 py-16">
                    <i className="fa-solid fa-folder-open fa-4x mb-4 text-gray-300"></i>
                    <p className="font-semibold text-lg">Brak danych o odwiedzinach</p>
                    <p className="text-sm mt-1">Nie zarejestrowano żadnych grup dla dnia {selectedDate}.</p>
                </div>
            )}
            {!isLoading && statsData && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard title="Łącznie odwiedzających" value={displayData.total.value} icon="fa-users" footer={<ComparisonIndicator value={displayData.total.dod} diff={displayData.total.diff} />} />
                        
                        <KpiCard 
                            title="Średnia godzinowa" 
                            value={typeof displayData.avgHourly === 'object' ? displayData.avgHourly.value.toFixed(1) : displayData.avgHourly} 
                            icon="fa-clock" 
                            footer={typeof displayData.avgHourly === 'object' ? <ComparisonIndicator value={displayData.avgHourly.dod} diff={displayData.avgHourly.diff.toFixed(1)} /> : null} 
                        />
                        
                        <KpiCard 
                            title="Najlepsza godzina" 
                            value={typeof displayData.bestHour.hour === 'number' ? `${displayData.bestHour.hour}:00` : displayData.bestHour.hour} 
                            icon="fa-trophy" 
                            footer={(() => {
                                const comparisonData = showMultiplied ? statsData.multiplied.comparison.bestHour : statsData.raw.rawComparison.bestHour;
                                const trend = calculatePercentageChange(displayData.bestHour.count, comparisonData.count);
                                const diff = displayData.bestHour.count - comparisonData.count;
                                return (
                                    <div className="flex justify-between items-center w-full">
                                        <span>{`${displayData.bestHour.count} ${getPolishPlural(displayData.bestHour.count, 'odwiedzający', 'odwiedzających', 'odwiedzających')}`}</span>
                                        {comparisonData && <span className="flex items-center">
                                            {isComparisonActive && <span className="text-gray-400 font-normal mr-1">{comparisonData.hour}:00</span>}
                                            <ComparisonIndicator value={trend} diff={diff} />
                                        </span>}
                                    </div>
                                );
                            })()}
                        />

                        <KpiCard 
                            title="Najczęstszy cel" 
                            value={displayData.topPurpose?.name || 'Brak'} 
                            icon="fa-crosshairs"
                            footer={(() => {
                                const countText = `${displayData.topPurpose.count} ${getPolishPlural(displayData.topPurpose.count, 'zapytanie', 'zapytania', 'zapytań')}`;
                                const mainPurposeSlug = displayData.topPurpose.slug;
                                const comparisonTopPurpose = showMultiplied ? statsData.multiplied.comparison.topPurpose : statsData.raw.rawComparison.topPurpose;
                                const showTrend = comparisonTopPurpose && mainPurposeSlug && (mainPurposeSlug === comparisonTopPurpose.slug);

                                if (showTrend) {
                                    const comparisonPurposeCount = (showMultiplied ? (statsData.multiplied.comparison?.purpose || {})[mainPurposeSlug] : (statsData.raw.rawComparison?.purpose || {})[mainPurposeSlug]) || 0;
                                    const trend = calculatePercentageChange(displayData.topPurpose.count, comparisonPurposeCount);
                                    const diff = displayData.topPurpose.count - comparisonPurposeCount;
                                    return (
                                        <div className="flex justify-between items-center w-full">
                                            <span>{countText}</span>
                                            <ComparisonIndicator value={trend} diff={diff} />
                                        </div>
                                    );
                                }
                                return countText;
                            })()}
                        />
                        
                        {activeIndicators.gender.map(ind => {
                             const rawCurrent = statsData.raw.gender[ind.slug] || 0;
                             const rawPrev = statsData.raw.rawComparison?.gender[ind.slug] || 0;
                             const multCurrent = statsData.multiplied.gender[ind.slug] || 0;
                             const multPrev = statsData.multiplied.comparison?.gender[ind.slug] || 0;
                             const trendValue = showMultiplied ? calculatePercentageChange(multCurrent, multPrev) : calculatePercentageChange(rawCurrent, rawPrev);
                             const trendDiff = showMultiplied ? multCurrent - multPrev : rawCurrent - rawPrev;
                            return (<KpiCard key={ind.slug} title={ind.name} value={displayData.gender[ind.slug] || 0} icon={ind.icon || 'fa-user'} footer={<ComparisonIndicator value={trendValue} diff={trendDiff}/>} />);
                        })}
                        
                        <KpiCard 
                            title="Największa grupa" 
                            value={`${statsData.raw.largestGroup.value} os.`} 
                            icon="fa-user-group" 
                            footer={!showMultiplied ? <ComparisonIndicator value={statsData.raw.largestGroup.dod} diff={statsData.raw.largestGroup.diff} /> : null}
                        />
                        
                        <div className="bg-white p-4 rounded-lg shadow-md">
                             <div className="flex items-center justify-between"><p className="text-sm font-semibold text-gray-500">Podział na języki</p><i className="fa-solid fa-flag text-gray-300"></i></div>
                             <div className="space-y-2 mt-2 text-sm">
                                {activeIndicators.language.map(ind => {
                                    const rawCurrent = statsData.raw.language[ind.slug] || 0;
                                    const rawPrev = statsData.raw.rawComparison?.language[ind.slug] || 0;
                                    const multCurrent = statsData.multiplied.language[ind.slug] || 0;
                                    const multPrev = statsData.multiplied.comparison?.language[ind.slug] || 0;
                                    const trendValue = showMultiplied ? calculatePercentageChange(multCurrent, multPrev) : calculatePercentageChange(rawCurrent, rawPrev);
                                    const trendDiff = showMultiplied ? multCurrent - multPrev : rawCurrent - rawPrev;
                                    return (
                                        <div key={ind.slug} className="flex justify-between items-center">
                                            <span className="font-semibold">{ind.name}</span>
                                            <div className="flex items-center gap-2">
                                                <ComparisonIndicator value={trendValue} diff={trendDiff}/>
                                                <span className="font-bold text-blue-800 w-8 text-right">{displayData.language[ind.slug] || 0}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    
                    {isComparisonActive ? (
                        <div className="space-y-6">
                            {statsData.raw.hourlyTotals && statsData.raw.rawComparison.hourlyTotals && (
                                <VisitsHourlyTrendChart 
                                    mainData={showMultiplied ? statsData.multiplied.hourlyTotals : statsData.raw.hourlyTotals}
                                    comparisonData={showMultiplied ? statsData.multiplied.comparison.hourlyTotals : statsData.raw.rawComparison.hourlyTotals}
                                    mainDate={selectedDate}
                                    comparisonDate={comparisonDate}
                                />
                            )}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-center font-semibold text-gray-600 text-sm mb-2">Główny dzień: {selectedDate}</h3>
                                    <VisitsPurposePieChart purposeData={displayData.purpose} allIndicators={allIndicators} />
                                </div>
                                <div>
                                    <h3 className="text-center font-semibold text-gray-600 text-sm mb-2">Dzień porównawczy: {comparisonDate}</h3>
                                    <VisitsPurposePieChart 
                                        purposeData={(showMultiplied ? (statsData.multiplied.comparison?.purpose || {}) : (statsData.raw.rawComparison?.purpose || {}))}
                                        allIndicators={allIndicators} 
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        ((displayData.total.value > 0) || (displayData.total.value === 0 && statsData?.raw?.hourlyTotals?.some(h => h > 0))) && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <VisitsHourlyTrendChart 
                                    mainData={showMultiplied ? statsData.multiplied.hourlyTotals : statsData.raw.hourlyTotals} 
                                    mainDate={selectedDate} 
                                />
                                <VisitsPurposePieChart purposeData={displayData.purpose} allIndicators={allIndicators} />
                            </div>
                        )
                    )}

                     {purposeSorted.length > 0 && (<div>
                        <h3 className="text-lg font-bold text-gray-700 mb-4 text-center">Cele wizyt</h3>
                        {isComparisonActive ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {(() => {
                                    const comparisonPurposeData = showMultiplied ? (statsData.multiplied.comparison?.purpose || {}) : (statsData.raw.rawComparison?.purpose || {});
                                    const allPurposeSlugs = Array.from(new Set([...Object.keys(displayData.purpose), ...Object.keys(comparisonPurposeData)]));
                                    allPurposeSlugs.sort((a, b) => (displayData.purpose[b] || 0) - (displayData.purpose[a] || 0));
                                    return allPurposeSlugs.map(slug => {
                                        const indicator = allIndicators.find(i => i.slug === slug);
                                        if (!indicator) return null;
                                        const currentCount = displayData.purpose[slug] || 0;
                                        const comparisonCount = comparisonPurposeData[slug] || 0;
                                        const trend = calculatePercentageChange(currentCount, comparisonCount);
                                        const diff = currentCount - comparisonCount;
                                        return (
                                            <div key={slug} className="bg-white p-3 rounded-lg shadow-sm border flex items-center text-sm">
                                                <div className="flex-grow flex items-center pr-2">
                                                    <i className={`fa-solid ${indicator.icon} fa-fw mr-3 text-gray-400 text-lg`}></i>
                                                    <span className="font-semibold text-gray-700">{indicator.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <ComparisonIndicator value={trend} diff={diff} />
                                                    <span className="font-bold text-blue-800 w-8 text-right text-lg">{currentCount}</span>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {purposeSorted.map(([slug, count]) => {
                                    const indicator = allIndicators.find(i => i.slug === slug);
                                    if (!indicator) return null;
                                    return ( <div key={slug} className="bg-white p-3 rounded-lg shadow-sm border flex items-center text-sm"><i className={`fa-solid ${indicator.icon} fa-fw mr-3 text-gray-400 text-lg`}></i><span className="flex-grow font-semibold text-gray-700">{indicator.name}</span><span className="font-bold text-blue-800 text-lg">{count}</span></div> );
                                })}
                            </div>
                        )}
                    </div>)}

                    {!isComparisonActive && bikeStatsSorted.length > 0 && currentYearSettings.barometrEnabled && (
                         <div>
                            <h3 className="text-lg font-bold text-gray-700 mb-4 text-center">B@rometr Turystyczny (Rowerzyści)</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {bikeStatsSorted.map(([key, count]) => {
                                    const [langSlug, genderSlug, age] = key.split('_');
                                    const langIndicator = allIndicators.find(i => i.slug === langSlug);
                                    const genderIndicator = allIndicators.find(i => i.slug === genderSlug);
                                    if (!langIndicator || !genderIndicator) return null;
                                    return ( <div key={key} className="bg-white p-3 rounded-lg shadow-sm border flex items-center text-sm"><i className={`fa-solid ${genderIndicator.icon || 'fa-user'} fa-fw mr-3 text-lg`} style={{ color: genderIndicator.color || '#000000' }}></i><span className="flex-grow font-semibold text-gray-700">{`${langIndicator.name}, ${age}`}</span><span className="font-bold text-blue-800 text-lg">{count}</span></div> );
                                })}
                            </div>
                        </div>
                    )}
                    {!isComparisonActive && !showMultiplied && visitGroups.length > 0 && (
                        <div id="registered-groups-section">
                            <h3 className="text-lg font-bold text-gray-700 mb-4 text-center">Grupy zarejestrowane w tym dniu</h3>
                            <div className="space-y-3">
                                {visitGroups.map(group => {
                                    const languageIndicator = allIndicators.find(i => i.slug === group.language);
                                    return (
                                        <div key={group.id} className="bg-white p-3 rounded-lg shadow-sm border flex items-center justify-between hover:bg-gray-50">
                                            <div className="flex-grow space-y-2">
                                                <div className="flex items-center gap-2 flex-wrap text-sm">
                                                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md text-xs"><i className="fa-regular fa-clock mr-1"></i>{group.timestamp?.toDate().toLocaleTimeString('pl-PL', {hour: '2-digit', minute:'2-digit'}) || 'Brak'}</span>
                                                    <span className="text-gray-500">-</span>
                                                    <span>{languageIndicator?.name || group.language}</span>
                                                    <span className="text-gray-500">-</span>
                                                    <div className="flex items-center gap-1.5 text-base">
                                                        {(group.tourists || []).map((tourist, index) => {
                                                            const genderIndicator = allIndicators.find(i => i.slug === tourist.gender);
                                                            return (<i key={index} className={`fa-solid ${genderIndicator?.icon || 'fa-user'}`} style={{ color: genderIndicator?.color || '#000000' }} title={genderIndicator?.name || ''}></i>);
                                                        })}
                                                    </div>
                                                </div>
                                                {(group.purposes || []).length > 0 && (
                                                    <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-200">
                                                        {(group.purposes).map(slug => {
                                                            const purposeIndicator = allIndicators.find(i => i.slug === slug);
                                                            if (!purposeIndicator) return null;
                                                            return ( <div key={slug} className="bg-gray-100 border border-gray-200 rounded-md p-1 px-2 flex items-center gap-1.5 text-xs text-gray-700"><i className={`fa-solid ${purposeIndicator.icon} fa-fw text-gray-400`}></i><span className="font-medium">{purposeIndicator.name}</span></div> );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                                <button onClick={() => onEditGroup(group)} className={actionButton} title="Edytuj"><i className="fa-solid fa-pencil text-xs"></i></button>
                                                <button onClick={() => onDeleteGroup(group.id)} className={`${actionButton} hover:bg-red-50 hover:text-red-600`} title="Usuń"><i className="fa-solid fa-trash-can text-xs"></i></button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
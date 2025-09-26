import React, { useState, useEffect } from 'react';
import firebase from '../../lib/firebase';
import { firebaseApi } from '../../lib/firebase';
import { getPolishPlural } from '../../lib/helpers';
import { aggregateRawVisits, calculateMultipliedData } from '../../lib/helpers';
import LoadingSpinner from '../../components/LoadingSpinner';
import KpiCard, { ComparisonIndicator } from '../../components/KpiCard';
import { VisitsDailyTrendChart, VisitsPurposePieChart } from './VisitsCharts';

export default function VisitMonthlyDashboardTab({ db, appId, showMultiplied, selectedMonth, onDataLoaded, isComparisonActive, comparisonDate }) {
    const [isLoading, setIsLoading] = useState(true);
    const [statsData, setStatsData] = useState(null);
    const [allIndicators, setAllIndicators] = useState([]);

    const calculatePercentageChange = (current, previous) => {
        const c = current || 0;
        const p = previous || 0;
        if (p === 0) return c > 0 ? 100 : 0;
        return ((c - p) / p) * 100;
    };

    useEffect(() => {
        const fetchMonthlyStats = async () => {
            setIsLoading(true);
            setStatsData(null);
            onDataLoaded(null);

            try {
                const [indicators, configDoc] = await Promise.all([
                    firebaseApi.fetchCollection('indicators'),
                    firebaseApi.fetchDocument('visits_config', '--main--')
                ]);
                const indicatorsBySlug = new Map((indicators || []).map(i => [i.slug, i]));
                setAllIndicators(indicators || []);
                const yearlySettings = configDoc?.yearlySettings || {};

                const processPeriod = async (monthString) => {
                    if (!monthString) return null;
                    const [year, monthNum] = monthString.split('-').map(Number);
                    const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
                    const daysInMonth = new Date(year, monthNum, 0).getDate();
                    const endDate = `${year}-${String(monthNum).padStart(2, '0')}-${daysInMonth}`;

                    const [visits, overrides] = await Promise.all([
                        firebaseApi.fetchCollection('visits', { filter: { field: 'date', operator: '>=', value: startDate } }),
                        firebaseApi.fetchCollection('overrides', { filter: { field: firebase.firestore.FieldPath.documentId(), operator: '>=', value: startDate } })
                    ]);
                    
                    const monthVisits = visits.filter(v => v.date <= endDate);
                    const monthOverrides = new Map(overrides.filter(o => o.id <= endDate).map(o => [o.id, o]));
                    
                    const emptyResult = { total: 0, gender: {}, language: {}, purpose: {}, dailyTotals: Array(daysInMonth).fill(0), avgDaily: 0, largestGroup: 0, bestDay: { day: 0, count: 0 }, topPurpose: { name: "Brak", slug: null, count: 0 } };
                    
                    const settingsForYear = yearlySettings[year] || { mode: 'multiplier', value: 1 };
                    if (monthVisits.length === 0 && (settingsForYear.mode === 'multiplier' || (settingsForYear.mode === 'fixed' && monthOverrides.size === 0))) {
                        return { raw: emptyResult, multiplied: emptyResult };
                    }
                    
                    const rawSummary = aggregateRawVisits(monthVisits);
                    const multipliedSummary = { total: 0, gender: {}, language: {}, purpose: {} };
                    const visitsByDay = monthVisits.reduce((acc, v) => { (acc[v.date] = acc[v.date] || []).push(v); return acc; }, {});
                    
                    const dailyTotalsRaw = Array(daysInMonth).fill(0);
                    const dailyTotalsMultiplied = Array(daysInMonth).fill(0);

                    for (let day = 1; day <= daysInMonth; day++) {
                        const currentDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        let dayMultipliedData;
                        const dayVisits = visitsByDay[currentDate] || [];
                        const dayRawData = aggregateRawVisits(dayVisits);
                        dailyTotalsRaw[day - 1] = dayRawData.total;

                        if (settingsForYear.mode === 'fixed' && monthOverrides.has(currentDate)) {
                            dayMultipliedData = monthOverrides.get(currentDate);
                        } else {
                            dayMultipliedData = calculateMultipliedData(dayRawData, settingsForYear.value || 1);
                        }
                        dailyTotalsMultiplied[day-1] = dayMultipliedData.total || 0;
                        
                        multipliedSummary.total += dayMultipliedData.total || 0;
                        Object.entries(dayMultipliedData.gender || {}).forEach(([slug, count]) => { multipliedSummary.gender[slug] = (multipliedSummary.gender[slug] || 0) + count; });
                        Object.entries(dayMultipliedData.language || {}).forEach(([slug, count]) => { multipliedSummary.language[slug] = (multipliedSummary.language[slug] || 0) + count; });
                        Object.entries(dayMultipliedData.purpose || {}).forEach(([slug, count]) => { multipliedSummary.purpose[slug] = (multipliedSummary.purpose[slug] || 0) + count; });
                    }
                    
                    const topPurposeEntryRaw = Object.entries(rawSummary.purpose).sort((a,b) => b[1] - a[1])[0] || [null, 0];
                    const topPurposeEntryMultiplied = Object.entries(multipliedSummary.purpose).sort((a,b) => b[1] - a[1])[0] || [null, 0];
                    const bestDayRaw = dailyTotalsRaw.indexOf(Math.max(...dailyTotalsRaw)) + 1;
                    const bestDayMultiplied = dailyTotalsMultiplied.indexOf(Math.max(...dailyTotalsMultiplied)) + 1;

                    return {
                        raw: { ...rawSummary, dailyTotals: dailyTotalsRaw, avgDaily: rawSummary.total / daysInMonth, largestGroup: Math.max(0, ...monthVisits.map(g => g.tourists?.length || 0)), bestDay: { day: bestDayRaw, count: Math.max(...dailyTotalsRaw) }, topPurpose: { name: indicatorsBySlug.get(topPurposeEntryRaw[0])?.name || "Brak", slug: topPurposeEntryRaw[0], count: topPurposeEntryRaw[1] } },
                        multiplied: { ...multipliedSummary, dailyTotals: dailyTotalsMultiplied, avgDaily: multipliedSummary.total / daysInMonth, largestGroup: Math.max(0, ...monthVisits.map(g => g.tourists?.length || 0)), bestDay: { day: bestDayMultiplied, count: Math.max(...dailyTotalsMultiplied) }, topPurpose: { name: indicatorsBySlug.get(topPurposeEntryMultiplied[0])?.name || "Brak", slug: topPurposeEntryMultiplied[0], count: topPurposeEntryMultiplied[1] } }
                    };
                };

                let effectiveComparisonMonth = '';
                if (isComparisonActive && comparisonDate) {
                    effectiveComparisonMonth = comparisonDate;
                } else {
                    const d = new Date(selectedMonth + '-02T12:00:00Z');
                    d.setUTCMonth(d.getUTCMonth() - 1);
                    effectiveComparisonMonth = d.toISOString().slice(0, 7);
                }
                
                const [mainPeriodData, comparisonPeriodData] = await Promise.all([
                    processPeriod(selectedMonth),
                    processPeriod(effectiveComparisonMonth)
                ]);

                if (!mainPeriodData || (mainPeriodData.raw.total === 0 && mainPeriodData.multiplied.total === 0)) {
                    setStatsData(null); onDataLoaded(null);
                    setIsLoading(false);
                    return;
                }
                
                const finalData = {
                    raw: { ...mainPeriodData.raw, 
                           total: { value: mainPeriodData.raw.total, trend: calculatePercentageChange(mainPeriodData.raw.total, comparisonPeriodData?.raw.total), diff: mainPeriodData.raw.total - (comparisonPeriodData?.raw.total || 0)},
                           comparison: comparisonPeriodData?.raw
                         },
                    multiplied: { ...mainPeriodData.multiplied, 
                                  total: { value: mainPeriodData.multiplied.total, trend: calculatePercentageChange(mainPeriodData.multiplied.total, comparisonPeriodData?.multiplied.total), diff: mainPeriodData.multiplied.total - (comparisonPeriodData?.multiplied.total || 0)},
                                  comparison: comparisonPeriodData?.multiplied
                                }
                };
                
                setStatsData(finalData);
                onDataLoaded(finalData);

            } catch (error) {
                console.error("Błąd pobierania statystyk miesięcznych:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMonthlyStats();
    }, [selectedMonth, isComparisonActive, comparisonDate, onDataLoaded, db]);
    
    const displayData = showMultiplied ? statsData?.multiplied : statsData?.raw;
    const purposeSorted = displayData?.purpose ? Object.entries(displayData.purpose).sort((a, b) => b[1] - a[1]) : [];
    
    const activeIndicators = {
        gender: allIndicators.filter(ind => ind.category === 'gender' && ((displayData?.gender?.[ind.slug] || 0) > 0 || (displayData?.comparison?.gender?.[ind.slug] || 0) > 0)).sort((a, b) => a.sortOrder - b.sortOrder),
        language: allIndicators.filter(ind => ind.category === 'language' && ((displayData?.language?.[ind.slug] || 0) > 0 || (displayData?.comparison?.language?.[ind.slug] || 0) > 0)).sort((a, b) => a.sortOrder - b.sortOrder)
    };

    return (
        <div>
            {isLoading && <LoadingSpinner />}
            {!isLoading && !statsData && (
                <div className="text-center text-gray-500 py-16">
                    <i className="fa-solid fa-folder-open fa-4x mb-4 text-gray-300"></i>
                    <p className="font-semibold text-lg">Brak danych o odwiedzinach</p>
                    <p className="text-sm mt-1">Nie zarejestrowano żadnych grup w miesiącu {selectedMonth}.</p>
                </div>
            )}
            {!isLoading && statsData && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard title="Łącznie odwiedzających" value={displayData.total.value} icon="fa-users" footer={<ComparisonIndicator value={displayData.total.trend} diff={displayData.total.diff} />} />
                        <KpiCard 
                            title="Średnia dzienna" 
                            value={displayData.avgDaily.toFixed(1)} 
                            icon="fa-clock" 
                            footer={displayData.comparison ? <ComparisonIndicator value={calculatePercentageChange(displayData.avgDaily, displayData.comparison.avgDaily)} diff={(displayData.avgDaily - (displayData.comparison.avgDaily || 0)).toFixed(1)} /> : null} 
                        />
                        <KpiCard 
                            title="Najlepszy dzień" 
                            value={`${displayData.bestDay.day}.${selectedMonth.split('-')[1]}`}
                            icon="fa-trophy" 
                            footer={(() => {
                                const countText = `${displayData.bestDay.count} ${getPolishPlural(displayData.bestDay.count, 'odwiedzający', 'odwiedzających', 'odwiedzających')}`;
                                if (!displayData.comparison) return countText;
                                const trend = calculatePercentageChange(displayData.bestDay.count, displayData.comparison.bestDay.count);
                                const diff = displayData.bestDay.count - (displayData.comparison.bestDay.count || 0);
                                return (
                                    <div className="flex justify-between items-center w-full">
                                        <span>{countText}</span>
                                        <ComparisonIndicator value={trend} diff={diff} />
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
                                if (!displayData.comparison) return countText;
                                const trend = calculatePercentageChange(displayData.topPurpose.count, (displayData.comparison.purpose || {})[displayData.topPurpose.slug] || 0);
                                const diff = displayData.topPurpose.count - ((displayData.comparison.purpose || {})[displayData.topPurpose.slug] || 0);
                                return (
                                     <div className="flex justify-between items-center w-full">
                                        <span>{countText}</span>
                                        <ComparisonIndicator value={trend} diff={diff} />
                                    </div>
                                );
                            })()}
                        />
                        {activeIndicators.gender.map(ind => {
                             const current = displayData.gender[ind.slug] || 0;
                             const comparison = displayData.comparison?.gender[ind.slug] || 0;
                             return (<KpiCard key={ind.slug} title={ind.name} value={current} icon={ind.icon || 'fa-user'} footer={<ComparisonIndicator value={calculatePercentageChange(current, comparison)} diff={current - comparison}/>} />);
                        })}
                        <KpiCard 
                            title="Największa grupa" 
                            value={`${displayData.largestGroup} os.`} 
                            icon="fa-user-group" 
                            footer={!showMultiplied && displayData.comparison ? <ComparisonIndicator value={calculatePercentageChange(displayData.largestGroup, displayData.comparison.largestGroup)} diff={displayData.largestGroup - (displayData.comparison.largestGroup || 0)} /> : null}
                        />
                        <div className="bg-white p-4 rounded-lg shadow-md">
                             <div className="flex items-center justify-between"><p className="text-sm font-semibold text-gray-500">Podział na języki</p><i className="fa-solid fa-flag text-gray-300"></i></div>
                             <div className="space-y-2 mt-2 text-sm">
                                {activeIndicators.language.map(ind => {
                                    const current = displayData.language[ind.slug] || 0;
                                    const comparison = displayData.comparison?.language[ind.slug] || 0;
                                    return (
                                        <div key={ind.slug} className="flex justify-between items-center">
                                            <span className="font-semibold">{ind.name}</span>
                                            <div className="flex items-center gap-2">
                                                <ComparisonIndicator value={calculatePercentageChange(current, comparison)} diff={current-comparison}/>
                                                <span className="font-bold text-blue-800 w-8 text-right">{current}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        {!isComparisonActive ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <VisitsDailyTrendChart 
                                    mainData={displayData.dailyTotals} 
                                    mainDate={selectedMonth} 
                                />
                                <VisitsPurposePieChart purposeData={displayData.purpose} allIndicators={allIndicators} />
                            </div>
                        ) : (
                             <div className="space-y-6">
                                <VisitsDailyTrendChart 
                                    mainData={displayData.dailyTotals}
                                    comparisonData={displayData.comparison?.dailyTotals}
                                    mainDate={selectedMonth}
                                    comparisonDate={comparisonDate}
                                />
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-center font-semibold text-gray-600 text-sm mb-2">Główny miesiąc: {selectedMonth}</h3>
                                        <VisitsPurposePieChart purposeData={displayData.purpose} allIndicators={allIndicators} />
                                    </div>
                                    {displayData.comparison && <div>
                                        <h3 className="text-center font-semibold text-gray-600 text-sm mb-2">Miesiąc porównawczy: {comparisonDate}</h3>
                                        <VisitsPurposePieChart 
                                            purposeData={displayData.comparison.purpose || {}}
                                            allIndicators={allIndicators} 
                                        />
                                    </div>}
                                </div>
                            </div>
                        )}
                    </div>

                    {purposeSorted.length > 0 && (<div>
                        <h3 className="text-lg font-bold text-gray-700 mb-4 text-center">Cele wizyt</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {(() => {
                                const comparisonPurposeData = displayData.comparison?.purpose || {};
                                const allPurposeSlugs = Array.from(new Set([...Object.keys(displayData.purpose), ...Object.keys(comparisonPurposeData)]));
                                allPurposeSlugs.sort((a, b) => (displayData.purpose[b] || 0) - (displayData.purpose[a] || 0));
                                return allPurposeSlugs.map(slug => {
                                    const indicator = allIndicators.find(i => i.slug === slug);
                                    if (!indicator) return null;
                                    const currentCount = displayData.purpose[slug] || 0;
                                    if (currentCount === 0 && !isComparisonActive) return null;
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
                    </div>)}
                </div>
            )}
        </div>
    );
}
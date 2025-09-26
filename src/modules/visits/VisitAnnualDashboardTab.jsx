import React, { useState, useEffect } from 'react';
import firebase from '../../lib/firebase';
import { firebaseApi } from '../../lib/firebase';
import { getPolishPlural } from '../../lib/helpers';
import { aggregateRawVisits, calculateMultipliedData } from '../../lib/helpers';
import LoadingSpinner from '../../components/LoadingSpinner';
import KpiCard, { ComparisonIndicator } from '../../components/KpiCard';
import { VisitsMonthlyTrendChart, VisitsPurposePieChart } from './VisitsCharts';

export default function VisitAnnualDashboardTab({ db, appId, showMultiplied, selectedYear, onDataLoaded, isComparisonActive, comparisonDate }) {
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
        const fetchAnnualStats = async () => {
            setIsLoading(true);
            setStatsData(null);
            onDataLoaded(null);
            
            try {
                const [indicators, configDoc] = await Promise.all([
                    firebaseApi.fetchCollection('indicators'),
                    firebaseApi.fetchDocument('visits_config', '--main--')
                ]);
                const indicatorsBySlug = new Map((indicators || []).map(i => [i.slug, i]));
                const monthNames = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
                setAllIndicators(indicators || []);
                const yearlySettings = configDoc?.yearlySettings || {};

                const processPeriod = async (yearString) => {
                    if (!yearString) return null;
                    const year = Number(yearString);
                    const startDate = `${year}-01-01`;
                    const endDate = `${year}-12-31`;

                    const [visits, overrides] = await Promise.all([
                        firebaseApi.fetchCollection('visits', { filter: { field: 'date', operator: '>=', value: startDate } }),
                        firebaseApi.fetchCollection('overrides', { filter: { field: firebase.firestore.FieldPath.documentId(), operator: '>=', value: startDate } })
                    ]);
                    
                    const yearVisits = visits.filter(v => v.date <= endDate);
                    const yearOverrides = overrides.filter(o => o.id <= endDate);
                    
                    const emptySummary = { total: 0, gender: {}, language: {}, purpose: {}, monthlyTotals: Array(12).fill(0), avgMonthly: 0, largestGroup: 0, bestMonth: { name: 'Brak', count: 0 }, topPurpose: { name: "Brak", slug: null, count: 0 } };
                    const emptyBreakdown = Array(12).fill(null).map(() => ({ raw: {total: 0, gender: {}, language: {}, purpose: {}}, multiplied: {total: 0, gender: {}, language: {}, purpose: {}} }));
                    
                    if (yearVisits.length === 0 && yearOverrides.length === 0) {
                        return { summary: { raw: emptySummary, multiplied: emptySummary }, breakdown: emptyBreakdown };
                    }
                    
                    const settingsForYear = yearlySettings[year] || { mode: 'multiplier', value: 1 };
                    
                    const monthlyBreakdown = Array(12).fill(null).map(() => ({ raw: {total: 0, gender: {}, language: {}, purpose: {}}, multiplied: {total: 0, gender: {}, language: {}, purpose: {}} }));
                    
                    yearVisits.forEach(visit => {
                        const monthIndex = new Date(visit.date + 'T12:00:00Z').getUTCMonth();
                        if (monthlyBreakdown[monthIndex]) {
                            const rawMonthData = monthlyBreakdown[monthIndex].raw;
                            const groupSize = visit.tourists?.length || 0;
                            rawMonthData.total += groupSize;
                            if (visit.language) rawMonthData.language[visit.language] = (rawMonthData.language[visit.language] || 0) + groupSize;
                            (visit.purposes || []).forEach(pSlug => { rawMonthData.purpose[pSlug] = (rawMonthData.purpose[pSlug] || 0) + groupSize; });
                            (visit.tourists || []).forEach(t => { if (t.gender) rawMonthData.gender[t.gender] = (rawMonthData.gender[t.gender] || 0) + 1; });
                        }
                    });
                    
                    let monthlyTotalsMultiplied = Array(12).fill(0);

                    if (settingsForYear.mode === 'fixed') {
                        yearOverrides.forEach(ov => {
                            const monthIndex = new Date(ov.id + 'T12:00:00Z').getUTCMonth();
                             if (monthlyBreakdown[monthIndex]) {
                                const multipliedMonthData = monthlyBreakdown[monthIndex].multiplied;
                                multipliedMonthData.total += ov.total || 0;
                                Object.entries(ov.gender || {}).forEach(([slug, count]) => { multipliedMonthData.gender[slug] = (multipliedMonthData.gender[slug] || 0) + count; });
                                Object.entries(ov.language || {}).forEach(([slug, count]) => { multipliedMonthData.language[slug] = (multipliedMonthData.language[slug] || 0) + count; });
                                Object.entries(ov.purpose || {}).forEach(([slug, count]) => { multipliedMonthData.purpose[slug] = (multipliedMonthData.purpose[slug] || 0) + count; });
                            }
                        });
                        monthlyTotalsMultiplied = monthlyBreakdown.map(m => m.multiplied.total);
                    } else {
                        for(let i=0; i<12; i++) {
                             if (monthlyBreakdown[i]) {
                                monthlyBreakdown[i].multiplied = calculateMultipliedData(monthlyBreakdown[i].raw, settingsForYear.value || 1);
                            }
                        }
                        monthlyTotalsMultiplied = monthlyBreakdown.map(m => m.multiplied.total);
                    }
                    
                    const rawSummary = aggregateRawVisits(yearVisits);
                    const multipliedSummary = { total: 0, gender: {}, language: {}, purpose: {} };
                    monthlyBreakdown.forEach(month => {
                        const mData = month?.multiplied || { total: 0, gender: {}, language: {}, purpose: {} };
                        multipliedSummary.total += mData.total || 0;
                        Object.entries(mData.gender || {}).forEach(([slug, count]) => { multipliedSummary.gender[slug] = (multipliedSummary.gender[slug] || 0) + count; });
                        Object.entries(mData.language || {}).forEach(([slug, count]) => { multipliedSummary.language[slug] = (multipliedSummary.language[slug] || 0) + count; });
                        Object.entries(mData.purpose || {}).forEach(([slug, count]) => { multipliedSummary.purpose[slug] = (multipliedSummary.purpose[slug] || 0) + count; });
                    });

                    const monthlyTotalsRaw = monthlyBreakdown.map(m => m?.raw?.total || 0);
                    
                    const topPurposeEntryRaw = Object.entries(rawSummary.purpose).sort((a,b) => b[1] - a[1])[0] || [null, 0];
                    const topPurposeEntryMultiplied = Object.entries(multipliedSummary.purpose).sort((a,b) => b[1] - a[1])[0] || [null, 0];
                    const bestMonthIndexRaw = monthlyTotalsRaw.indexOf(Math.max(...monthlyTotalsRaw));
                    const bestMonthIndexMultiplied = monthlyTotalsMultiplied.indexOf(Math.max(...monthlyTotalsMultiplied));
                    
                    const summary = {
                        raw: { ...rawSummary, monthlyTotals: monthlyTotalsRaw, avgMonthly: rawSummary.total / 12, largestGroup: Math.max(0, ...yearVisits.map(g => g.tourists?.length || 0)), bestMonth: { name: monthNames[bestMonthIndexRaw], count: Math.max(...monthlyTotalsRaw) }, topPurpose: { name: indicatorsBySlug.get(topPurposeEntryRaw[0])?.name || "Brak", slug: topPurposeEntryRaw[0], count: topPurposeEntryRaw[1] } },
                        multiplied: { ...multipliedSummary, monthlyTotals: monthlyTotalsMultiplied, avgMonthly: multipliedSummary.total / 12, largestGroup: Math.max(0, ...yearVisits.map(g => g.tourists?.length || 0)), bestMonth: { name: monthNames[bestMonthIndexMultiplied], count: Math.max(...monthlyTotalsMultiplied) }, topPurpose: { name: indicatorsBySlug.get(topPurposeEntryMultiplied[0])?.name || "Brak", slug: topPurposeEntryMultiplied[0], count: topPurposeEntryMultiplied[1] } }
                    };

                    return { summary, breakdown: monthlyBreakdown };
                };

                let effectiveComparisonYear = '';
                if (isComparisonActive && comparisonDate) {
                    effectiveComparisonYear = comparisonDate;
                } else {
                    effectiveComparisonYear = String(Number(selectedYear) - 1);
                }
                
                const [mainPeriodData, comparisonPeriodData] = await Promise.all([
                    processPeriod(String(selectedYear)),
                    processPeriod(effectiveComparisonYear)
                ]);

                if (!mainPeriodData || mainPeriodData.summary.raw.total === 0) {
                    setStatsData(null); onDataLoaded(null);
                    setIsLoading(false);
                    return;
                }
                
                const finalSummary = {
                    raw: { ...mainPeriodData.summary.raw, 
                           total: { value: mainPeriodData.summary.raw.total, trend: calculatePercentageChange(mainPeriodData.summary.raw.total, comparisonPeriodData?.summary.raw.total), diff: mainPeriodData.summary.raw.total - (comparisonPeriodData?.summary.raw.total || 0)},
                           comparison: comparisonPeriodData?.summary.raw
                         },
                    multiplied: { ...mainPeriodData.summary.multiplied, 
                                  total: { value: mainPeriodData.summary.multiplied.total, trend: calculatePercentageChange(mainPeriodData.summary.multiplied.total, comparisonPeriodData?.summary.multiplied.total), diff: mainPeriodData.summary.multiplied.total - (comparisonPeriodData?.summary.multiplied.total || 0)},
                                  comparison: comparisonPeriodData?.summary.multiplied
                                }
                };
                
                setStatsData(finalSummary);
                onDataLoaded({ summary: finalSummary, breakdown: mainPeriodData.breakdown });

            } catch (error) {
                console.error("Błąd pobierania statystyk rocznych:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnnualStats();
    }, [selectedYear, isComparisonActive, comparisonDate, onDataLoaded, db]);
    
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
                    <p className="text-sm mt-1">Nie zarejestrowano żadnych grup w roku {selectedYear}.</p>
                </div>
            )}
            {!isLoading && statsData && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard title="Łącznie odwiedzających" value={displayData.total.value} icon="fa-users" footer={<ComparisonIndicator value={displayData.total.trend} diff={displayData.total.diff} />} />
                        <KpiCard 
                            title="Średnia miesięczna" 
                            value={displayData.avgMonthly.toFixed(1)} 
                            icon="fa-clock" 
                            footer={displayData.comparison ? <ComparisonIndicator value={calculatePercentageChange(displayData.avgMonthly, displayData.comparison.avgMonthly)} diff={(displayData.avgMonthly - (displayData.comparison.avgMonthly || 0)).toFixed(1)} /> : null} 
                        />
                        <KpiCard 
                            title="Najlepszy miesiąc" 
                            value={displayData.bestMonth.name}
                            icon="fa-trophy" 
                            footer={(() => {
                                const countText = `${displayData.bestMonth.count} ${getPolishPlural(displayData.bestMonth.count, 'odwiedzający', 'odwiedzających', 'odwiedzających')}`;
                                if (!displayData.comparison) return countText;
                                const trend = calculatePercentageChange(displayData.bestMonth.count, displayData.comparison.bestMonth.count);
                                const diff = displayData.bestMonth.count - (displayData.comparison.bestMonth.count || 0);
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
                                <VisitsMonthlyTrendChart 
                                    mainData={displayData.monthlyTotals} 
                                    mainDate={selectedYear} 
                                />
                                <VisitsPurposePieChart purposeData={displayData.purpose} allIndicators={allIndicators} />
                            </div>
                        ) : (
                             <div className="space-y-6">
                                <VisitsMonthlyTrendChart 
                                    mainData={displayData.monthlyTotals}
                                    comparisonData={displayData.comparison?.monthlyTotals}
                                    mainYear={selectedYear}
                                    comparisonYear={comparisonDate}
                                />
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-center font-semibold text-gray-600 text-sm mb-2">Główny rok: {selectedYear}</h3>
                                        <VisitsPurposePieChart purposeData={displayData.purpose} allIndicators={allIndicators} />
                                    </div>
                                    {displayData.comparison && <div>
                                        <h3 className="text-center font-semibold text-gray-600 text-sm mb-2">Rok porównawczy: {comparisonDate}</h3>
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
import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';

export function VisitsDailyTrendChart({ mainData, comparisonData, mainDate, comparisonDate }) {
    const chartRef = React.useRef(null);
    const chartInstanceRef = React.useRef(null);

    React.useEffect(() => {
        if (chartRef.current && mainData) {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            const labels = Array.from({ length: mainData.length }, (_, i) => i + 1);
            const datasets = [{
                label: `Odwiedziny (${mainDate})`,
                data: mainData,
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
                borderRadius: 4,
            }];

            if (comparisonData) {
                datasets.push({
                    label: `Odwiedziny (${comparisonDate})`,
                    data: comparisonData,
                    backgroundColor: 'rgba(107, 114, 128, 0.5)',
                    borderColor: 'rgba(107, 114, 128, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                });
            }

            const ctx = chartRef.current.getContext('2d');
            chartInstanceRef.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: !!comparisonData, position: 'top' },
                        title: {
                            display: true,
                            text: `Trend dzienny w miesiącu`,
                            font: { size: 16 }
                        }
                    },
                    scales: {
                        y: { beginAtZero: true, ticks: { precision: 0 } },
                        x: { grid: { display: false }, title: { display: true, text: 'Dzień miesiąca' } }
                    }
                }
            });
        }
        return () => { 
            if (chartInstanceRef.current) { 
                chartInstanceRef.current.destroy(); 
            }
        };
    }, [mainData, comparisonData, mainDate, comparisonDate]);

    return (
        <div className="bg-white p-4 rounded-lg shadow-md h-96">
            <canvas ref={chartRef}></canvas>
        </div>
    );
}

export function VisitsPurposePieChart({ purposeData, allIndicators }) {
    const chartRef = React.useRef(null);
    const chartInstanceRef = React.useRef(null);

    React.useEffect(() => {
        if (chartRef.current && purposeData && allIndicators) {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            const indicatorsBySlug = new Map(allIndicators.map(i => [i.slug, i]));
            const purposeSorted = Object.entries(purposeData).sort((a, b) => b[1] - a[1]);
            
            const labels = [];
            const data = [];
            let othersSum = 0;
            const maxSlices = 7;

            purposeSorted.forEach(([slug, count], index) => {
                if (index < maxSlices) {
                    const indicator = indicatorsBySlug.get(slug);
                    labels.push(indicator?.name || slug);
                    data.push(count);
                } else {
                    othersSum += count;
                }
            });

            if (othersSum > 0) {
                labels.push("Inne");
                data.push(othersSum);
            }

            const ctx = chartRef.current.getContext('2d');
            chartInstanceRef.current = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Liczba zapytań',
                        data: data,
                        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6'],
                        borderColor: '#ffffff',
                        borderWidth: 2,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' },
                        title: {
                            display: true,
                            text: 'Najpopularniejsze cele wizyt',
                            font: { size: 16 }
                        }
                    }
                }
            });
        }
        return () => { 
            if (chartInstanceRef.current) { 
                chartInstanceRef.current.destroy(); 
            }
        };
    }, [purposeData, allIndicators]);

    return (
        <div className="bg-white p-4 rounded-lg shadow-md h-96">
            <canvas ref={chartRef}></canvas>
        </div>
    );
}

export function VisitsHourlyTrendChart({ mainData, comparisonData, mainDate, comparisonDate }) {
    const chartRef = React.useRef(null);
    const chartInstanceRef = React.useRef(null);

    React.useEffect(() => {
        if (chartRef.current && mainData) {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            const businessHoursLabels = Array.from({length: 13}, (_, i) => i + 8);
            const datasets = [{
                label: `Odwiedziny (${new Date(mainDate + 'T12:00:00Z').toLocaleDateString('pl-PL')})`,
                data: mainData.slice(8, 21),
                backgroundColor: 'rgba(139, 92, 246, 0.7)',
                borderColor: 'rgba(139, 92, 246, 1)',
                borderWidth: 1,
                borderRadius: 4,
            }];

            if (comparisonData) {
                datasets.push({
                    label: `Odwiedziny (${new Date(comparisonDate + 'T12:00:00Z').toLocaleDateString('pl-PL')})`,
                    data: comparisonData.slice(8, 21),
                    backgroundColor: 'rgba(107, 114, 128, 0.5)',
                    borderColor: 'rgba(107, 114, 128, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                });
            }

            const ctx = chartRef.current.getContext('2d');
            chartInstanceRef.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: businessHoursLabels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: !!comparisonData, position: 'top' },
                        title: {
                            display: true,
                            text: `Trend godzinowy`,
                            font: { size: 16 }
                        }
                    },
                    scales: {
                        y: { beginAtZero: true, ticks: { precision: 0 } },
                        x: { grid: { display: false }, title: { display: true, text: 'Godzina' } }
                    }
                }
            });
        }
        return () => { 
            if (chartInstanceRef.current) { 
                chartInstanceRef.current.destroy(); 
            }
        };
    }, [mainData, comparisonData, mainDate, comparisonDate]);

    return (
        <div className="bg-white p-4 rounded-lg shadow-md h-96">
            <canvas ref={chartRef}></canvas>
        </div>
    );
}

export function VisitsMonthlyTrendChart({ mainData, comparisonData, mainYear, comparisonYear }) {
    const chartRef = React.useRef(null);
    const chartInstanceRef = React.useRef(null);
    // ZMIANA: Etykiety tylko dla sezonu
    const monthLabels = ["Maj", "Cze", "Lip", "Sie", "Wrz"];

    React.useEffect(() => {
        if (chartRef.current && mainData) {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            const datasets = [{
                label: `Odwiedziny (${mainYear})`,
                // ZMIANA: Pobieramy tylko dane dla miesięcy od maja (indeks 4) do września (indeks 8)
                data: mainData.slice(4, 9),
                backgroundColor: 'rgba(22, 163, 74, 0.7)',
                borderColor: 'rgba(22, 163, 74, 1)',
                borderWidth: 1,
                borderRadius: 4,
            }];

            if (comparisonData) {
                datasets.push({
                    label: `Odwiedziny (${comparisonYear})`,
                    // ZMIANA: Pobieramy tylko dane dla miesięcy od maja (indeks 4) do września (indeks 8)
                    data: comparisonData.slice(4, 9),
                    backgroundColor: 'rgba(107, 114, 128, 0.5)',
                    borderColor: 'rgba(107, 114, 128, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                });
            }

            const ctx = chartRef.current.getContext('2d');
            chartInstanceRef.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: monthLabels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: !!comparisonData, position: 'top' },
                        title: {
                            display: true,
                            // ZMIANA: Nowy tytuł wykresu
                            text: `Trend miesięczny w sezonie`,
                            font: { size: 16 }
                        }
                    },
                    scales: {
                        y: { beginAtZero: true, ticks: { precision: 0 } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }
        return () => { 
            if (chartInstanceRef.current) { 
                chartInstanceRef.current.destroy(); 
            }
        };
    }, [mainData, comparisonData, mainYear, comparisonYear]);

    return (
        <div className="bg-white p-4 rounded-lg shadow-md h-96">
            <canvas ref={chartRef}></canvas>
        </div>
    );
}
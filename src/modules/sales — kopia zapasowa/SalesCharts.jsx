import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';
import { formatCurrency } from './salesHelpers'; // Importujemy naszą nową funkcję

export function SalesDailyChart({ salesData, reportMonth }) {
    const chartRef = React.useRef(null);
    const chartInstanceRef = React.useRef(null);

    React.useEffect(() => {
        if (chartRef.current && salesData && salesData.entries.length > 0) {
            // Zniszcz poprzednią instancję wykresu, jeśli istnieje
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            // Przygotowanie danych do wykresu
            const [year, month] = reportMonth.split('-').map(Number);
            const daysInMonth = new Date(year, month, 0).getDate();
            
            const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
            const dailyTotals = Array(daysInMonth).fill(0);

            salesData.entries.forEach(entry => {
                const dayOfMonth = new Date(entry.date + 'T12:00:00Z').getUTCDate();
                dailyTotals[dayOfMonth - 1] = entry.totalAmount;
            });

            // Tworzenie nowego wykresu
            const ctx = chartRef.current.getContext('2d');
            chartInstanceRef.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Sprzedaż dzienna',
                        data: dailyTotals,
                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1,
                        borderRadius: 4,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: `Trend sprzedaży dziennej - ${new Date(reportMonth + '-02').toLocaleString('pl-PL', { month: 'long', year: 'numeric' })}`,
                            font: { size: 16 }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Sprzedaż: ${formatCurrency(context.raw)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: { 
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            }
                        },
                        x: { grid: { display: false } }
                    }
                }
            });
        }
        // Funkcja czyszcząca - zniszcz wykres przy odmontowaniu komponentu
        return () => { 
            if (chartInstanceRef.current) { 
                chartInstanceRef.current.destroy(); 
            }
        };
    }, [salesData, reportMonth]); // Przerenderuj wykres, gdy zmienią się dane lub miesiąc

    return (
        <div className="bg-white p-4 rounded-lg shadow-md h-96">
            <canvas ref={chartRef}></canvas>
        </div>
    );
}

export function SalesAnnualChart({ annualData }) {
    const chartRef = React.useRef(null);
    const chartInstanceRef = React.useRef(null);
    const monthLabels = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];

    React.useEffect(() => {
        if (chartRef.current && annualData) {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            chartInstanceRef.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: monthLabels,
                    datasets: [{
                        label: 'Suma sprzedaży w miesiącu',
                        data: annualData.monthlyTotals,
                        backgroundColor: 'rgba(22, 163, 74, 0.7)',
                        borderColor: 'rgba(22, 163, 74, 1)',
                        borderWidth: 1,
                        borderRadius: 4,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title: { display: false }, // Tytuł będzie w kodzie JSX
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Sprzedaż: ${formatCurrency(context.raw)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: { 
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            }
                        },
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
    }, [annualData]);

    return (
        <div className="bg-white p-4 rounded-lg shadow-md h-96">
            <canvas ref={chartRef}></canvas>
        </div>
    );
}
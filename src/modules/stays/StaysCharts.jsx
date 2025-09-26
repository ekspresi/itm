import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto'; // Ważny import, który automatycznie rejestruje wszystko, czego potrzebujemy

export function StaysPieChart({ data, title }) {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    useEffect(() => {
        if (chartRef.current && data) {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            chartInstanceRef.current = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Miasto Mikołajki', 'Gmina Mikołajki'],
                    datasets: [{
                        label: 'Liczba pobytów',
                        data: [data.city, data.municipality],
                        backgroundColor: ['rgba(59, 130, 246, 0.85)', 'rgba(16, 185, 129, 0.85)'],
                        borderColor: '#ffffff',
                        borderWidth: 3,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' },
                        title: { display: true, text: title, font: { size: 16 } }
                    }
                }
            });
        }
        return () => { if (chartInstanceRef.current) { chartInstanceRef.current.destroy(); }};
    }, [data, title]);

    return (
        <div className="bg-white p-4 rounded-lg shadow-md h-96">
            <canvas ref={chartRef}></canvas>
        </div>
    );
};

export function StaysMonthlyBreakdownChart({ yearData, months, year }) {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const romanLabels = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

    useEffect(() => {
        if (chartRef.current && yearData.length > 0) {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            const monthlyTotals = Array(12).fill(0);
            yearData.forEach(monthEntry => {
                const total = (monthEntry.city || 0) + (monthEntry.municipality || 0);
                monthlyTotals[monthEntry.month - 1] = total;
            });

            const ctx = chartRef.current.getContext('2d');
            chartInstanceRef.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: romanLabels,
                    datasets: [{
                        label: `Suma pobytów w miesiącu`,
                        data: monthlyTotals,
                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title: { display: true, text: `Podział pobytów na miesiące w ${year}`, font: { size: 16 } }
                    },
                    scales: {
                        y: { beginAtZero: true },
                        x: { ticks: { maxRotation: 0, minRotation: 0 } }
                    }
                }
            });
        }
        return () => { if (chartInstanceRef.current) { chartInstanceRef.current.destroy(); }};
    }, [yearData, months, year]);

    return (
        <div className="bg-white p-4 rounded-lg shadow-md h-96">
            <canvas ref={chartRef}></canvas>
        </div>
    );
};
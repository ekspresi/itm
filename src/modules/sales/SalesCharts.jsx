import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { tokens } from '@fluentui/react-components';

// --- Wykres dzienny ---
export const SalesDailyChart = ({ salesData, reportMonth }) => {
    const chartData = salesData.entries.map(entry => ({
        name: entry.date.substring(8, 10), // Wyciągamy tylko dzień miesiąca
        Sprzedaż: entry.totalAmount,
    }));

    return (
        <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke2} />
                    <XAxis dataKey="name" tick={{ fill: tokens.colorNeutralForeground2 }} />
                    <YAxis tick={{ fill: tokens.colorNeutralForeground2 }} tickFormatter={(value) => `${value} zł`} />
                    <Tooltip
                        cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                        contentStyle={{
                            backgroundColor: tokens.colorNeutralBackground1,
                            borderColor: tokens.colorNeutralStroke2,
                            borderRadius: tokens.borderRadiusMedium,
                        }}
                    />
                    <Bar dataKey="Sprzedaż" fill={tokens.colorBrandBackground} name="Sprzedaż" unit=" zł" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

// --- Wykres roczny ---
export const SalesAnnualChart = ({ annualData }) => {
    const months = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];

    const chartData = annualData.monthlyTotals.map((total, index) => ({
        name: months[index],
        Sprzedaż: total,
    }));

    return (
        <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke2} />
                    <XAxis dataKey="name" tick={{ fill: tokens.colorNeutralForeground2 }} />
                    <YAxis tick={{ fill: tokens.colorNeutralForeground2 }} tickFormatter={(value) => `${value} zł`} />
                    <Tooltip
                        cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                        contentStyle={{
                            backgroundColor: tokens.colorNeutralBackground1,
                            borderColor: tokens.colorNeutralStroke2,
                            borderRadius: tokens.borderRadiusMedium,
                        }}
                    />
                    <Bar dataKey="Sprzedaż" fill={tokens.colorPaletteGreenBackground3} name="Sprzedaż" unit=" zł" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
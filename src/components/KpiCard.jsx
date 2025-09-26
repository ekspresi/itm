import React from 'react';
import { getPolishPlural } from '../lib/helpers'; // Importujemy funkcję pomocniczą

export const ComparisonIndicator = ({ value, diff }) => {
    if (value === null || diff === null || value === undefined || diff === undefined) {
        return <span className="text-xs font-bold text-gray-400">-</span>;
    }

    if (!isFinite(value)) {
        const color = diff > 0 ? 'text-green-600' : 'text-red-600';
        const sign = diff > 0 ? '+' : '';
        return <span className={`text-xs font-bold ${color}`}>({`${sign}${diff}`})</span>;
    }

    if (value === 0 && (diff === 0 || diff === '0.0' || diff === '-0.0')) {
        return <span className="text-xs font-bold text-gray-500"><i className="fa-solid fa-minus mr-1"></i>0.0% (0)</span>;
    }

    const color = value > 0 ? 'text-green-600' : 'text-red-600';
    const icon = value > 0 ? 'fa-arrow-up' : 'fa-arrow-down';
    const sign = value > 0 ? '+' : '';
    const diffSign = diff > 0 ? '+' : '';

    return (
        <span className={`text-xs font-bold ${color}`}>
            <i className={`fa-solid ${icon} mr-1`}></i>
            {`${sign}${value.toFixed(1)}%`}
            <span className="ml-1 font-normal text-gray-500">({`${diffSign}${diff}`})</span>
        </span>
    );
};

export default function KpiCard({ title, value, icon, footer }) {
    return (
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-500">{title}</p>
                    {icon && <i className={`fa-solid ${icon} text-gray-300`}></i>}
                </div>
                <p className="text-3xl font-bold text-blue-800 mt-2">{value}</p>
            </div>
            {footer && (
                <div className="text-xs font-bold mt-3 text-gray-500">
                    {typeof footer === 'string' ? <span>{footer}</span> : footer}
                </div>
            )}
        </div>
    );
}
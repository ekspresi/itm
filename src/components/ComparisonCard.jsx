import React from 'react';

export default function ComparisonCard({ title, valueA, valueB, periodA, periodB }) {
    const diff = valueA - valueB;
    const percentChange = valueB === 0 ? (valueA > 0 ? 100 : 0) : ((diff / valueB) * 100);
    const colorClass = diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-500';
    const iconClass = diff > 0 ? 'fa-arrow-up' : diff < 0 ? 'fa-arrow-down' : 'fa-minus';

    return (
        <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-bold text-gray-800 text-center mb-4">{title}</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                    <p className="text-xs text-gray-500">{periodA}</p>
                    <p className="text-2xl font-bold">{valueA}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">{periodB}</p>
                    <p className="text-2xl font-bold">{valueB}</p>
                </div>
            </div>
            <div className={`mt-4 text-center font-bold text-xl flex items-center justify-center ${colorClass}`}>
                <i className={`fa-solid ${iconClass} mr-2`}></i>
                <span>{diff > 0 ? `+${diff}` : diff}</span>
                <span className="text-sm ml-2">({percentChange.toFixed(1)}%)</span>
            </div>
        </div>
    );
};
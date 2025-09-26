import React from 'react';
import ButtonSelectGroup from '../../components/ButtonSelectGroup';

export default function EventSortAndFilterPanel({ categories, activeFilters, sortConfig, onFilterToggle, onSortChange }) {
    const SORT_OPTIONS = [
        { key: 'date', direction: 'desc', label: 'Data (najnowsze)' },
        { key: 'date', direction: 'asc', label: 'Data (najstarsze)' },
        { key: 'name', direction: 'asc', label: 'Nazwa (A-Z)' },
        { key: 'name', direction: 'desc', label: 'Nazwa (Z-A)' },
    ];
    const SCOPE_OPTIONS = [
        { key: null, label: 'Wszystkie' },
        { key: 'local', label: 'Lokalne' },
        { key: 'nearby', label: 'Okolica' },
    ];
    return (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-2">Sortuj według</h3>
                    <div className="space-y-1">
                        {SORT_OPTIONS.map(option => {
                            const isActive = sortConfig.key === option.key && sortConfig.direction === option.direction;
                            return <button key={`${option.key}-${option.direction}`} onClick={() => onSortChange(option.key, option.direction)} className={`w-full text-left text-sm p-2 rounded-md transition-colors ${isActive ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-gray-100'}`}>{option.label}</button>;
                        })}
                    </div>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-2">Zasięg</h3>
                    <div className="space-y-1">
                        {SCOPE_OPTIONS.map(option => {
                            const isActive = activeFilters.scope === option.key;
                            return <button key={option.label} onClick={() => onFilterToggle('scope', option.key, true)} className={`w-full text-left text-sm p-2 rounded-md transition-colors ${isActive ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-gray-100'}`}>{option.label}</button>;
                        })}
                    </div>
                </div>
                <div className="md:col-span-2">
                    <ButtonSelectGroup title="Filtruj po kategoriach" items={categories} selectedIds={activeFilters.categoryIds || []} onToggle={(id) => onFilterToggle('categoryIds', id)} />
                </div>
            </div>
        </div>
    );
};
import React from 'react';
import ToggleSwitch from '../../components/ToggleSwitch';

export default function GastronomySortAndFilterPanel({ activeFilters, onFilterToggle, sortConfig, onSortChange }) {
    const SORT_OPTIONS = [
        { key: 'name', direction: 'asc', label: 'Nazwa (A-Z)' },
        { key: 'name', direction: 'desc', label: 'Nazwa (Z-A)' },
        { key: 'createdAt', direction: 'desc', label: 'Data dodania (najnowsze)' },
    ];

    const ATTRIBUTE_FILTERS = [
        { key: 'outdoorSeating', label: 'Ogródek' },
        { key: 'servesBreakfast', label: 'Śniadania' },
        { key: 'delivery', label: 'Dowóz' },
        { key: 'wheelchairAccessibleEntrance', label: 'Dostęp dla niepełnosprawnych' },
    ];

    return (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-2">Sortuj według</h3>
                    <div className="space-y-1">
                        {SORT_OPTIONS.map(option => {
                            const isActive = sortConfig.key === option.key && sortConfig.direction === option.direction;
                            return (
                                <button key={`${option.key}-${option.direction}`} onClick={() => onSortChange(option.key, option.direction)}
                                    className={`w-full text-left text-sm p-2 rounded-md transition-colors ${isActive ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-gray-100'}`}>
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="md:col-span-2">
                    <h3 className="text-sm font-bold text-gray-700 mb-2">Filtruj po atrybutach Google</h3>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        {ATTRIBUTE_FILTERS.map(attr => (
                            <ToggleSwitch 
                                key={attr.key} 
                                label={attr.label} 
                                enabled={!!activeFilters[attr.key]} 
                                setEnabled={(val) => onFilterToggle(attr.key, val)} 
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
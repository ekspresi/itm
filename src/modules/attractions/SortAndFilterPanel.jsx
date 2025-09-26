import React from 'react';
import MultiSelectCombobox from '../../components/MultiSelectCombobox';

// POPRAWKA JEST TUTAJ -> dodaliśmy `sortConfig` do listy
export default function SortAndFilterPanel({ config, activeFilters, sortConfig, onFilterToggle, onSortChange }) {
    const SORT_OPTIONS = [
        { key: 'name', direction: 'asc', label: 'Nazwa (A-Z)' },
        { key: 'name', direction: 'desc', label: 'Nazwa (Z-A)' },
        { key: 'distance', direction: 'asc', label: 'Odległość (rosnąco)' },
        { key: 'distance', direction: 'desc', label: 'Odległość (malejąco)' },
        { key: 'verification_date', direction: 'desc', label: 'Data weryfikacji (najnowsze)' },
        { key: 'verification_date', direction: 'asc', label: 'Data weryfikacji (najstarsze)' },
        { key: 'creation_date', direction: 'desc', label: 'Data dodania (najnowsze)' },
        { key: 'creation_date', direction: 'asc', label: 'Data dodania (najstarsze)' },
    ];

    return (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-2">Sortowanie</h3>
                    <div className="space-y-1">
                        {SORT_OPTIONS.map(option => {
                            const isActive = sortConfig.key === option.key && sortConfig.direction === option.direction;
                            return (
                                <button 
                                    key={`${option.key}-${option.direction}`} 
                                    onClick={() => onSortChange(option.key, option.direction)}
                                    className={`w-full text-left text-sm p-2 rounded-md ${isActive ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-gray-100'}`}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <MultiSelectCombobox
                    label="Gminy"
                    placeholder="Wybierz gminy"
                    options={config.municipalities || []}
                    selectedIds={activeFilters.municipalities || []}
                    onSelectionChange={(selected) => onFilterToggle('municipalities', selected, true)}
                />
                <MultiSelectCombobox
                    label="Kategorie"
                    placeholder="Wybierz kategorie"
                    options={config.tags?.type || []}
                    selectedIds={activeFilters.types || []}
                    onSelectionChange={(selected) => onFilterToggle('types', selected, true)}
                />
                <MultiSelectCombobox
                    label="Kolekcje"
                    placeholder="Wybierz kolekcje"
                    options={config.collections || []}
                    selectedIds={activeFilters.collections || []}
                    onSelectionChange={(selected) => onFilterToggle('collections', selected, true)}
                />
            </div>
        </div>
    );
};
import React from 'react';
import { SHARED_STYLES } from '../lib/helpers';

export default function Toolbar({ viewMode, setViewMode, onSortClick, onFilterClick, onSettingsClick, onAddClick }) {
    return (
        <div className="flex flex-col md:flex-row items-center md:justify-between gap-4 mb-6 no-print">
            <div className="flex items-center gap-2 flex-wrap justify-center">
                {/* Przełącznik Widoku */}
                <div className="flex items-center p-1 bg-gray-200 rounded-lg h-10">
                    <button onClick={() => setViewMode('tiles')} className={`px-3 h-full rounded-md text-sm font-semibold flex items-center gap-2 ${viewMode === 'tiles' ? 'bg-white shadow' : 'bg-transparent text-gray-600'}`}>
                        <i className="fa-solid fa-grip"></i> Kafelki
                    </button>
                    <button onClick={() => setViewMode('list')} className={`px-3 h-full rounded-md text-sm font-semibold flex items-center gap-2 ${viewMode === 'list' ? 'bg-white shadow' : 'bg-transparent text-gray-600'}`}>
                        <i className="fa-solid fa-list"></i> Lista
                    </button>
                </div>

                {/* Przyciski filtrów i sortowania */}
                <button onClick={onSortClick} className={SHARED_STYLES.toolbar.iconButton} title="Sortuj"><i className="fa-solid fa-sort"></i></button>
                <button onClick={onFilterClick} className={SHARED_STYLES.toolbar.iconButton} title="Filtruj"><i className="fa-solid fa-filter"></i></button>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={onSettingsClick} className={SHARED_STYLES.toolbar.iconButton} title="Ustawienia"><i className="fa-solid fa-cog"></i></button>
                <button onClick={onAddClick} className={SHARED_STYLES.toolbar.primaryButton}><i className="fa-solid fa-plus mr-2"></i>Obiekt noclegowy</button>
            </div>
        </div>
    );
};
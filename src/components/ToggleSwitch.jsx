import React from 'react';

export default function ToggleSwitch({ label, enabled, setEnabled, options = ['Nie', 'Tak'] }) {
    return (
        <div className="flex items-center justify-between">
        {label && <span className="text-sm font-medium text-gray-700 mr-3">{label}</span>}
        <div className="flex items-center p-1 bg-gray-200 rounded-lg h-9">
            <button
                type="button"
                onClick={() => setEnabled(false)}
                className={`px-3 h-full rounded-md text-sm font-semibold transition-all ${!enabled ? 'bg-white shadow' : 'bg-transparent text-gray-600'}`}
            >
                {options[0]}
            </button>
            <button
                type="button"
                onClick={() => setEnabled(true)}
                className={`px-3 h-full rounded-md text-sm font-semibold transition-all ${enabled ? 'bg-white shadow' : 'bg-transparent text-gray-600'}`}
            >
                {options[1]}
            </button>
        </div>
        </div>
    );
}
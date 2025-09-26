import React from 'react';
import { SHARED_STYLES } from '../lib/helpers'; // Importujemy nasze globalne style

export default function ButtonSelectGroup({ title, items, selectedIds, onToggle }) {
    return (
        <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
            <div className="space-y-2 p-2 border rounded-md max-h-80 overflow-y-auto bg-gray-50">
                {items && items.length > 0 ? items.map(item => {
                    const isActive = (selectedIds || []).includes(item.id);
                    return (
                        <button key={item.id} type="button" onClick={() => onToggle(item.id)} className={`${SHARED_STYLES.buttonSelect.base} ${isActive ? SHARED_STYLES.buttonSelect.active : SHARED_STYLES.buttonSelect.inactive}`}>
                            <div className="flex items-center gap-2">
                                {item.icon && <i className={`fa-solid ${item.icon} fa-fw text-gray-500`}></i>}
                                <span>{item.name}</span>
                            </div>
                        </button>
                    );
                }) : <p className="text-xs text-center text-gray-500 py-4">Brak opcji do wyboru.</p>}
            </div>
        </div>
    );
};
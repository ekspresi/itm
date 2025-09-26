import React from 'react';
import ToggleSwitch from '../../components/ToggleSwitch';

export default function StaysDetailsTab({ detailsSearchTerm, setDetailsSearchTerm, sortConfig, handleSort, detailsData, months, hideEmpty, setHideEmpty }) {
    return (
        <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg shadow-md">
                <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 items-center">
                    <label htmlFor="details-search" className="block text-sm font-medium text-gray-700">Wyszukaj obiekt noclegowy</label>
                    <label className="block text-sm font-medium text-gray-700">Ukryj puste</label>
                    <input type="text" id="details-search" placeholder="Wpisz nazwę lub adres..." className="w-full px-2 py-[0.3rem] border border-gray-300 rounded-md" value={detailsSearchTerm} onChange={e => setDetailsSearchTerm(e.target.value)} />
                    <div className="flex justify-center">
                        <ToggleSwitch enabled={hideEmpty} setEnabled={setHideEmpty} />
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4 px-4 text-left text-xs font-bold text-gray-500 uppercase">
                <button onClick={() => handleSort('name')} className="w-4/12 flex items-center gap-2 hover:text-blue-600">
                    <span>Obiekt</span>
                    {sortConfig.key === 'name' && <i className={`fa-solid fa-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>}
                </button>
                <div className="w-8/12 flex justify-around text-center">
                    {months.map((name, index) => {
                        const monthKey = index + 1;
                        return (
                            <button key={index} onClick={() => handleSort(monthKey)} className="grow basis-0 hover:text-blue-600 flex items-center justify-center gap-1">
                                <span>{['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][index]}</span>
                                {sortConfig.key === monthKey && <i className={`fa-solid fa-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>}
                            </button>
                        );
                    })}
                    <button onClick={() => handleSort('total')} className="grow basis-0 font-extrabold hover:text-blue-600 flex items-center justify-center gap-1">
                        <span>SUMA</span>
                        {sortConfig.key === 'total' && <i className={`fa-solid fa-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>}
                    </button>
                </div>
            </div>
            <div className="space-y-2">
                {detailsData
                    .filter(item => {
                        if (hideEmpty && item.total === 0) return false;
                        return item.name.toLowerCase().includes(detailsSearchTerm.toLowerCase()) || (item.address || '').toLowerCase().includes(detailsSearchTerm.toLowerCase());
                    })
                    .sort((a, b) => {
                        const key = sortConfig.key;
                        const direction = sortConfig.direction === 'asc' ? 1 : -1;
                        const valA = key === 'name' ? a.name.toLowerCase() : (key === 'total' ? a.total : a.months[key]);
                        const valB = key === 'name' ? b.name.toLowerCase() : (key === 'total' ? b.total : b.months[key]);
                        if (valA < valB) return -1 * direction;
                        if (valA > valB) return 1 * direction;
                        return 0;
                    })
                    .map(item => (
                    <div key={item.id} className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm">
                        <div className="w-4/12">
                            <p className="font-bold text-sm text-blue-800 truncate">{item.name}</p>
                            <p className="text-xs text-gray-500 truncate">{item.address}</p>
                        </div>
                        <div className="w-8/12 flex justify-around text-center text-sm font-semibold">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(monthIndex => {
                                const guests = item.months[monthIndex] || 0;
                                return <span key={monthIndex} className={`grow basis-0 ${guests > 0 ? 'text-gray-800' : 'text-gray-300'}`}>{guests > 0 ? guests : '-'}</span>;
                            })}
                            <span className="grow basis-0 font-extrabold text-blue-800">{item.total > 0 ? item.total : '-'}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
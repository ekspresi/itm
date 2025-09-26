import React from 'react';

export function WorkTimeDetailsTable({ entries, month }) {
    if (!entries || entries.length === 0) { 
        return <p className="text-center text-sm text-gray-500 mt-4">Brak wpisów w tym miesiącu.</p>; 
    }
    const [year, monthNum] = month.split('-');
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const entriesByDay = entries.reduce((acc, entry) => { 
        const day = new Date(entry.date + 'T12:00:00Z').getUTCDate(); 
        acc[day] = entry.value; 
        return acc; 
    }, {});

    const getDayClass = (value) => { 
        if (value === 'U') return 'bg-yellow-200 text-yellow-800'; 
        if (value === 'W') return 'bg-green-200 text-green-800'; 
        if (typeof value === 'number' && value > 0) return 'bg-blue-100 text-blue-800'; 
        return 'bg-gray-100 text-gray-400'; 
    }

    return (
        <div className="mt-4 border-t pt-4">
            <h4 className="font-semibold text-center text-sm text-gray-600 mb-3">Ewidencja miesiąca</h4>
            <div className="grid grid-cols-7 gap-1 text-center">
                {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map(d => <div key={d} className="font-bold text-xs">{d}</div>)}
                {Array.from({ length: (new Date(year, monthNum - 1, 1).getDay() + 6) % 7 }).map((_, i) => <div key={`empty-${i}`}></div>)}
                {daysArray.map(day => {
                    const value = entriesByDay[day];
                    return (
                        <div key={day} className={`py-2 px-1 rounded-md text-xs h-14 flex flex-col justify-center ${getDayClass(value)}`}>
                            <div className="font-bold text-base">{day}</div>
                            <div>{typeof value === 'number' ? `${value} h` : (value ?? '-')}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export function WorkTimeEntryRow({ entry, onUpdate, onRemove, isRemoveDisabled }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center bg-gray-50 p-2 rounded-lg">
            <input 
                type="date" 
                value={entry.date} 
                onChange={e => onUpdate(entry.tempId, 'date', e.target.value)} 
                className="w-full p-2 border border-gray-300 rounded-md" 
            />
            <div className="flex items-center justify-center space-x-2">
                <button onClick={() => onUpdate(entry.tempId, 'value', Math.max(0, (typeof entry.value === 'number' ? entry.value : 0) - 1))} className="bg-gray-200 h-10 w-10 rounded-full font-bold text-2xl flex items-center justify-center pb-1 leading-none">-</button>
                <span className="text-xl font-bold w-16 text-center">{typeof entry.value === 'number' ? entry.value : entry.value}</span>
                <button onClick={() => onUpdate(entry.tempId, 'value', (typeof entry.value === 'number' ? entry.value : 0) + 1)} className="bg-gray-200 h-10 w-10 rounded-full font-bold text-2xl flex items-center justify-center pb-1 leading-none">+</button>
            </div>
            <div className="flex items-center justify-end space-x-2">
                <button onClick={() => onUpdate(entry.tempId, 'value', 'U')} className={`w-10 h-10 rounded-md font-bold text-sm ${entry.value === 'U' ? 'bg-yellow-500 text-white' : 'bg-yellow-200'}`}>U</button>
                <button onClick={() => onUpdate(entry.tempId, 'value', 'W')} className={`w-10 h-10 rounded-md font-bold text-sm ${entry.value === 'W' ? 'bg-green-500 text-white' : 'bg-green-200'}`}>W</button>
                <button onClick={() => onRemove(entry.tempId)} className="text-red-500 hover:text-red-700 disabled:text-gray-300" disabled={isRemoveDisabled}>
                    <i className="fa-solid fa-trash-can fa-lg"></i>
                </button>
            </div>
        </div>
    );
};
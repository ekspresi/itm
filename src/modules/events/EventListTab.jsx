import React, { useState, useMemo } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import EventTile from './EventTile'; // Importujemy nowo stworzony kafelek

export default function EventListTab({ isLoading, events, categories, allOccurrences, onDetailsClick, onEdit, onDelete, onArchive }) {
    const [viewMode, setViewMode] = useState('list');
    const [calendarMonth, setCalendarMonth] = useState(new Date().toISOString().slice(0, 7));
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [activeFilters, setActiveFilters] = useState({ categoryIds: [], scope: null });
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [filterDate, setFilterDate] = useState(null);

const displayedEvents = useMemo(() => {
    let filtered = [...allOccurrences];

    // Filtrowanie (bez zmian)
    if (filterDate) {
        filtered = filtered.filter(item => item.occurrenceDetails.eventDate === filterDate);
    }
    if (activeFilters.scope) {
        filtered = filtered.filter(item => item.scope === activeFilters.scope);
    }
    if (activeFilters.categoryIds.length > 0) {
        filtered = filtered.filter(item => (item.categoryIds || []).some(id => activeFilters.categoryIds.includes(id)));
    }

    // Usuwanie przeszłych wydarzeń
    if (!filterDate) {
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        filtered = filtered.filter(item => {
            const eventDate = item.occurrenceDetails.eventDate;
            if (eventDate < todayStr) return false;
            if (eventDate === todayStr) {
                const eventEndTime = item.occurrenceDetails.endTime || '23:59';
                return eventEndTime > currentTimeStr;
            }
            return true;
        });
    }

    // Sortowanie
    filtered.sort((a, b) => {
        // Sortowanie od najwcześniejszego do najpóźniejszego
        const dateA = a.occurrenceDetails.eventDate + (a.occurrenceDetails.startTime || '00:00');
        const dateB = b.occurrenceDetails.eventDate + (b.occurrenceDetails.startTime || '00:00');
        return dateA.localeCompare(dateB); 
    });

    return filtered;
}, [allOccurrences, activeFilters, filterDate]);

    const handleSortChange = (key, direction) => setSortConfig({ key, direction });
    const handleFilterToggle = (category, value, isSingleSelect = false) => {
        if (isSingleSelect) {
            setActiveFilters(prev => ({ ...prev, [category]: prev[category] === value ? null : value }));
        } else {
            setActiveFilters(prev => {
                const currentValues = new Set(prev[category] || []);
                if (currentValues.has(value)) {
                    currentValues.delete(value);
                } else {
                    currentValues.add(value);
                }
                return { ...prev, [category]: Array.from(currentValues) };
            });
        }
    };
    
    const changeCalendarMonth = (direction) => {
        const d = new Date(calendarMonth + '-02T12:00:00Z');
        d.setUTCMonth(d.getUTCMonth() + direction);
        setCalendarMonth(d.toISOString().slice(0, 7));
    };

    return (
        <div>
            {viewMode === 'list' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {isLoading ? <div className="md:col-span-3 lg:col-span-3"><LoadingSpinner /></div> : !displayedEvents.length ? (
                         <p className="text-center text-gray-400 py-16 md:col-span-3">Brak wydarzeń spełniających wybrane kryteria.</p>
                    ) : (
                        displayedEvents.map(item => (
                            <EventTile 
                                key={item.id} 
                                event={item} 
                                onDetailsClick={() => onDetailsClick(events.find(e => e.id === item.originalId))} 
                                onEdit={() => onEdit(events.find(e => e.id === item.originalId))} 
                                onDelete={() => onDelete(item.originalId)} 
                                onArchive={() => onArchive(events.find(e => e.id === item.originalId))}
                                categories={categories} 
                            />
                        ))
                    )}
                </div>
            )}
            {viewMode === 'calendar' && (
                <div className="bg-white rounded-lg shadow-md p-4">
                    {(() => {
                        const [year, month] = calendarMonth.split('-').map(Number);
                        const daysInMonth = new Date(year, month, 0).getDate();
                        const firstDayOfMonth = (new Date(year, month - 1, 1).getDay() + 6) % 7;
                        const weekDays = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
                        const eventDaysInMonth = new Set();
                        allOccurrences.forEach(item => { if (item.occurrenceDetails.eventDate?.startsWith(calendarMonth)) { eventDaysInMonth.add(parseInt(item.occurrenceDetails.eventDate.split('-')[2], 10)); } });
                        const dayCells = [];
                        for (let i = 0; i < firstDayOfMonth; i++) { dayCells.push(<div key={`empty-${i}`} className="border rounded-md bg-gray-50"></div>); }
                        for (let day = 1; day <= daysInMonth; day++) {
                            const currentDateStr = `${calendarMonth}-${String(day).padStart(2, '0')}`;
                            const isToday = (currentDateStr === new Date().toISOString().slice(0, 10));
                            const hasEvents = eventDaysInMonth.has(day);
                            dayCells.push(
                                <button key={day} onClick={() => { setFilterDate(currentDateStr); setViewMode('list'); }} className="border rounded-md p-2 min-h-[120px] text-left hover:bg-blue-50 transition-colors">
                                    <div className={`font-bold w-8 h-8 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : ''}`}>{day}</div>
                                    {hasEvents && (<div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mt-2"></div>)}
                                </button>
                            );
                        }
                        return (<div className="grid grid-cols-7 gap-2">{weekDays.map(day => <div key={day} className="font-bold text-center text-gray-500">{day}</div>)}{dayCells}</div>);
                    })()}
                </div>
            )}
        </div>
    );
};
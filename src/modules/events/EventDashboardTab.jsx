import React, { useMemo, useState } from 'react';
import KpiCard from '../../components/KpiCard';

export default function EventDashboardTab({ events, categories, onDetailsClick, onEdit, onDelete, onArchive }) {
    const EventSection = ({ title, subtitle, eventsToShow }) => {
        const [viewMode, setViewMode] = useState('tiles');
        const [timeWindow, setTimeWindow] = useState(7);

        const filteredEvents = useMemo(() => {
            const now = new Date();
            const todayStr = now.toISOString().slice(0, 10);
            const futureDate = new Date();
            futureDate.setDate(now.getDate() + timeWindow);
            const futureDateStr = futureDate.toISOString().slice(0, 10);

            return eventsToShow
                .flatMap(event => (event.occurrences || []).map(occurrence => ({ ...event, originalId: event.id, id: `${event.id}_${occurrence.eventDate}_${occurrence.startTime}`, occurrenceDetails: occurrence })))
                .filter(item => {
                    const eventDate = item.occurrenceDetails.eventDate;
                    if (!eventDate) return false;
                    const isInRange = eventDate >= todayStr && eventDate < futureDateStr;
                    if (!isInRange) return false;
                    if (eventDate === todayStr) {
                        if (!item.occurrenceDetails.startTime) return true;
                        const nowTime = now.getHours() * 60 + now.getMinutes();
                        const [endHour, endMinute] = (item.occurrenceDetails.endTime || "23:59").split(':').map(Number);
                        return nowTime < (endHour * 60 + endMinute);
                    }
                    return true;
                })
                .sort((a,b) => ((a.occurrenceDetails.eventDate + (a.occurrenceDetails.startTime || '00:00')).localeCompare(b.occurrenceDetails.eventDate + (b.occurrenceDetails.startTime || '00:00'))));
        }, [eventsToShow, timeWindow]);

        const DashboardEventTile = ({ event }) => {
            const occurrence = event.occurrenceDetails || {};
            const fullLocation = [event.city, event.location].filter(Boolean).join(' | ');
            return (
                <div onClick={() => onDetailsClick(event)} className="bg-white rounded-lg shadow-md p-4 flex flex-col justify-between gap-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer">
                    <div className="flex gap-4">
                        <div className="w-24 h-24 bg-gray-200 rounded-md overflow-hidden flex-shrink-0 relative">
                            {event.thumbnailUrl ? <img src={event.thumbnailUrl} alt={event.eventName_pl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><i className="fa-solid fa-calendar-days fa-2x text-gray-400"></i></div>}
                            {event.source === 'facebook_import' && (
                                <div className="absolute top-1 left-1 bg-white/80 rounded-full w-5 h-5 flex items-center justify-center" title="Import z Facebooka">
                                    <i className="fa-brands fa-facebook text-gray-500 text-sm"></i>
                                </div>
                            )}
                        </div>
                        <div className="flex-grow min-w-0">
                            <p className="font-semibold text-blue-800 leading-tight text-sm">{event.eventName_pl}</p>
                            <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                                <p><i className="fa-solid fa-calendar-day fa-fw"></i> {occurrence.eventDate}</p>
                                <p><i className="fa-solid fa-clock fa-fw"></i> {occurrence.startTime || 'Brak godziny'}</p>
                                <p className="truncate"><i className="fa-solid fa-map-marker-alt fa-fw"></i> {fullLocation || 'Brak miejsca'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        };

        return (
            <div>
                <div className="flex justify-between items-center mb-5">
                    <div>
                        <h3 className="text-lg font-bold text-gray-700">{title}</h3>
                        <p className="text-sm text-gray-500">{subtitle.replace('2 tygodni', '2 tygodnie')}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center p-1 bg-gray-200 rounded-lg h-9">
                            <button onClick={() => setTimeWindow(7)} className={`px-3 h-full rounded-md text-xs font-semibold ${timeWindow === 7 ? 'bg-white shadow' : 'bg-transparent text-gray-600'}`}>7 dni</button>
                            <button onClick={() => setTimeWindow(14)} className={`px-3 h-full rounded-md text-xs font-semibold ${timeWindow === 14 ? 'bg-white shadow' : 'bg-transparent text-gray-600'}`}>14 dni</button>
                        </div>
                        <div className="flex items-center p-1 bg-gray-200 rounded-lg h-9">
                            <button onClick={() => setViewMode('tiles')} className={`px-3 h-full rounded-md text-xs font-semibold ${viewMode === 'tiles' ? 'bg-white shadow' : 'bg-transparent text-gray-600'}`}><i className="fa-solid fa-grip"></i></button>
                            <button onClick={() => setViewMode('list')} className={`px-3 h-full rounded-md text-xs font-semibold ${viewMode === 'list' ? 'bg-white shadow' : 'bg-transparent text-gray-600'}`}><i className="fa-solid fa-list"></i></button>
                        </div>
                    </div>
                </div>
                {viewMode === 'tiles' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredEvents.length === 0 ? <p className="text-center text-gray-500 py-8 md:col-span-3">Brak wydarzeń w tym okresie.</p> : filteredEvents.map(event => <DashboardEventTile key={event.id} event={event} />)}
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="hidden md:grid grid-cols-12 gap-4 px-4 text-left text-xs font-bold text-gray-500 uppercase">
                            <div className="col-span-3">Termin</div><div className="col-span-5">Nazwa</div><div className="col-span-4">Lokalizacja</div>
                        </div>
                        {filteredEvents.length === 0 ? <p className="text-center text-gray-500 py-8">Brak wydarzeń w tym okresie.</p> : filteredEvents.map(event => (
                            <div key={event.id} onClick={() => onDetailsClick(events.find(e => e.id === event.originalId))} className="bg-white p-3 rounded-lg shadow-sm grid grid-cols-12 gap-4 items-center cursor-pointer hover:bg-gray-50">
                                <div className="col-span-3 font-semibold text-blue-800">{event.occurrenceDetails.eventDate} <span className="text-gray-600">{event.occurrenceDetails.startTime}</span></div>
                                <div className="col-span-5 font-semibold">{event.eventName_pl}</div>
                                <div className="col-span-4 text-sm text-gray-600 truncate">{[event.city, event.location].filter(Boolean).join(' | ')}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const localEvents = useMemo(() => events.filter(e => e.scope === 'local'), [events]);
    const nearbyEvents = useMemo(() => events.filter(e => e.scope === 'nearby'), [events]);

    return (
        <div className="space-y-8">
            {/* SEKCJA 1: KARTY KPI (zawsze widoczne) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Tutaj można w przyszłości dodać logikę do KPI */}
                <KpiCard title="Wydarzenia lokalne (ogółem)" value={localEvents.length} icon="fa-map-pin" />
                <KpiCard title="Wydarzenia w okolicy (ogółem)" value={nearbyEvents.length} icon="fa-map" />
                <KpiCard title="Wszystkie wydarzenia" value={events.length} icon="fa-calendar-check" />
            </div>

            {/* SEKCJA 2: WYDARZENIA LOKALNE */}
            <EventSection
                title="Nadchodzące wydarzenia lokalne"
                subtitle="Wydarzenia w mieście i gminie Mikołajki"
                eventsToShow={localEvents}
            />

            {/* SEKCJA 3: WYDARZENIA W OKOLICY */}
             <EventSection
                title="Nadchodzące wydarzenia w okolicy"
                subtitle="Wydarzenia w okolicy"
                eventsToShow={nearbyEvents}
            />
        </div>
    );
};
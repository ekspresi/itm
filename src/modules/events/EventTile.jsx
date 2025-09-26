import React from 'react';
import { SHARED_STYLES } from '../../lib/helpers';

export default function EventTile({ event, onDetailsClick, onEdit, onArchive, onDelete, categories }) {
    const getStatusInfo = (status) => {
        switch (status) {
            case 'TBC': return { icon: 'fa-question-circle', color: 'text-yellow-600' };
            case 'cancelled': return { icon: 'fa-times-circle', color: 'text-red-600' };
            case 'confirmed': default: return { icon: 'fa-check-circle', color: 'text-green-600' };
        }
    };

    const statusInfo = getStatusInfo(event.status);
    const occurrence = event.occurrenceDetails || event.occurrences?.[0] || {};

    return (
        <div className="bg-white rounded-lg shadow-md flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
            <div onClick={onDetailsClick} className="cursor-pointer p-4">
                <div className="flex gap-4">
                    <div className="w-24 h-24 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                        {event.thumbnailUrl ? 
                            <img src={event.thumbnailUrl} alt={event.eventName_pl} className="w-full h-full object-cover" /> :
                            <div className="w-full h-full flex items-center justify-center"><i className="fa-solid fa-calendar-days fa-2x text-gray-400"></i></div>
                        }
                    </div>
                    <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start gap-2">
                            <h3 className="font-bold text-blue-800 leading-tight">{event.eventName_pl}</h3>
                            {event.source === 'facebook_import' && (
                                <div className="flex-shrink-0" title="Import z Facebooka">
                                    <i className="fa-brands fa-facebook-f text-gray-400"></i>
                                </div>
                            )}
                        </div>
                        <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                            <p><i className="fa-solid fa-calendar-day fa-fw"></i> {occurrence.eventDate} {occurrence.startTime && `| ${occurrence.startTime}`}</p>
                            <p className="truncate"><i className="fa-solid fa-map-marker-alt fa-fw"></i> {event.location || 'Brak miejsca'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm" title={`Status: ${event.status}`}>
                    <div className={statusInfo.color}><i className={`fa-solid ${statusInfo.icon}`}></i></div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); onDetailsClick(); }} className={SHARED_STYLES.toolbar.iconButton} style={{height: '32px', width: '32px'}} title="Podgląd"><i className="fa-solid fa-eye text-sm"></i></button>
                    <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className={SHARED_STYLES.toolbar.iconButton} style={{height: '32px', width: '32px'}} title="Edytuj"><i className="fa-solid fa-pencil text-sm"></i></button>
                    <button onClick={(e) => { e.stopPropagation(); onArchive(); }} className={SHARED_STYLES.toolbar.iconButton} style={{height: '32px', width: '32px'}} title="Archiwizuj"><i className="fa-solid fa-box-archive text-sm"></i></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className={`${SHARED_STYLES.toolbar.iconButton} hover:text-red-600`} style={{height: '32px', width: '32px'}} title="Usuń"><i className="fa-solid fa-trash-can text-sm"></i></button>
                </div>
            </div>
        </div>
    );
};
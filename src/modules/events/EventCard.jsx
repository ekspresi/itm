import React from 'react';

export default function EventCard({ event, onEdit, onDelete, categories }) {
    const baseCardClasses = "rounded-lg shadow-md flex p-3 gap-4 transition-all duration-300";
    const featuredCardClasses = "bg-blue-50 border-2 border-blue-300";
    const standardCardClasses = "bg-white";

    const categoryNames = (event.categoryIds || [])
        .map(id => {
            const category = categories.find(cat => cat.id === id);
            return category ? category.name : null;
        })
        .filter(Boolean)
        .join(', ');

    const firstOccurrence = event.occurrences && event.occurrences[0] ? event.occurrences[0] : {};

    return (
        <div className={`${baseCardClasses} ${event.isFeatured ? featuredCardClasses : standardCardClasses}`}>
            <div className="w-32 h-32 flex-shrink-0 bg-gray-200 rounded-md overflow-hidden">
                {event.thumbnailUrl ? (
                    <img src={event.thumbnailUrl} alt={`Plakat dla ${event.eventName_pl}`} className="w-full h-full object-cover"/>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <i className="fa-solid fa-calendar-days fa-3x text-gray-400"></i>
                    </div>
                )}
            </div>
            <div className="flex-grow flex flex-col justify-between min-h-[8rem] min-w-0">
                <div>
                    <h3 className={`font-bold text-lg leading-tight truncate ${event.isFeatured ? 'text-blue-800' : ''}`}>
                        {event.eventName_pl}
                    </h3>
                    <div className="mt-2 space-y-1 text-sm text-gray-700">
                        <p className="flex items-center">
                            <i className="fa-solid fa-tags fa-fw mr-2 text-gray-400"></i>
                            <span className="text-gray-500 font-medium truncate">{categoryNames || 'Brak kategorii'}</span>
                        </p>
                        <p className="flex items-center">
                            <i className="fa-solid fa-calendar-day fa-fw mr-2 text-gray-400"></i>
                            <span className="truncate">{firstOccurrence.eventDate || 'Brak daty'}</span>
                        </p>
                        {firstOccurrence.startTime && (
                            <p className="flex items-center">
                                <i className="fa-solid fa-clock fa-fw mr-2 text-gray-400"></i>
                                <span className="truncate">{firstOccurrence.startTime}</span>
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex justify-end items-end">
                    <div className="flex items-center gap-3 shrink-0">
                        <button onClick={() => onEdit(event)} className="text-blue-600 hover:text-blue-800" title="Edytuj"><i className="fa-solid fa-pencil"></i></button>
                        <button onClick={() => onDelete(event.id)} className="text-red-500 hover:text-red-700" title="Usuń"><i className="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>
            </div>
        </div>
    );
};
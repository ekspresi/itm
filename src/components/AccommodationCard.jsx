import React from 'react';

export default function AccommodationCard({ accommodation, onEdit, onDelete }) {
    const baseCardClasses = "rounded-lg shadow-md flex p-3 gap-4 transition-all duration-300";
    const featuredCardClasses = "bg-blue-50 border-2 border-blue-300";
    const standardCardClasses = "bg-white";

    return (
        <div className={`${baseCardClasses} ${accommodation.isFeatured ? featuredCardClasses : standardCardClasses}`}>
            <div className="w-32 h-32 flex-shrink-0 bg-gray-200 rounded-md overflow-hidden">
                {accommodation.thumbnailUrl ? (
                    <img 
                        src={accommodation.thumbnailUrl} 
                        alt={`Miniatura dla ${accommodation.name}`} 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <i className="fa-solid fa-bed fa-3x text-gray-400"></i>
                    </div>
                )}
            </div>
            <div className="flex-grow flex flex-col justify-between min-h-[8rem] min-w-0">
                <div>
                    <h3 className={`font-bold text-lg leading-tight truncate ${accommodation.isFeatured ? 'text-blue-800' : ''}`}>
                        {accommodation.name}
                    </h3>
                    <div className="mt-2 space-y-1 text-sm text-gray-700">
                        <p className="flex items-center">
                            <i className="fa-solid fa-location-dot fa-fw mr-2 text-gray-400"></i>
                            <span className="truncate">{accommodation.address || 'Brak adresu'}</span>
                        </p>
                        <p className="flex items-center">
                            <i className="fa-solid fa-phone fa-fw mr-2 text-gray-400"></i>
                            <span className="truncate">{accommodation.phone || 'Brak telefonu'}</span>
                        </p>
                        <p className="flex items-center">
                            <i className="fa-solid fa-user fa-fw mr-2 text-gray-400"></i>
                            <span className="truncate">{accommodation.capacity || 'Brak danych'}</span>
                        </p>
                    </div>
                </div>
                <div className="flex justify-end items-end">
                    <div className="flex items-center gap-3 shrink-0">
                        <button onClick={() => onEdit(accommodation)} className="text-blue-600 hover:text-blue-800" title="Edytuj">
                            <i className="fa-solid fa-pencil"></i>
                        </button>
                        <button onClick={() => onDelete(accommodation.id)} className="text-red-500 hover:text-red-700" title="Usuń">
                            <i className="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
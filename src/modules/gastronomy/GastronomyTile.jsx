import React from 'react';
import { SHARED_STYLES } from '../../lib/helpers';
import { isOpenNow } from '../../lib/helpers'; // Importujemy funkcję sprawdzającą godziny

export default function GastronomyTile({ place, onEdit, onDelete, onDetailsClick }) {
    const imageUrl = place.thumbnailUrl || place.google_photo_url;
    const isOpen = isOpenNow(place);

    return (
        <div className="bg-white rounded-lg shadow-md flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
            <div onClick={() => onDetailsClick(place)} className="cursor-pointer p-4">
                <div className="flex gap-4">
                    <div className="w-24 h-24 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                        {imageUrl ? 
                            <img src={imageUrl} alt={place.name} className="w-full h-full object-cover" /> :
                            <div className="w-full h-full flex items-center justify-center"><i className="fa-solid fa-utensils fa-2x text-gray-400"></i></div>
                        }
                    </div>
                    <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start gap-2">
                            <h3 className="font-bold text-blue-800 leading-tight pr-2">{place.name}</h3>
                            {place.managed_by_google && (
                                <div className="flex-shrink-0" title="Dane synchronizowane z Google"><i className="fa-brands fa-google text-gray-400"></i></div>
                            )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1 truncate">{place.address_formatted}</p>
                    </div>
                </div>
            </div>

            <div className="border-t px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm">
                    <div title={isOpen ? "Otwarte teraz" : "Obecnie zamknięte"} className={isOpen ? 'text-blue-600' : 'text-gray-400'}>
                        <i className={`fa-solid ${isOpen ? 'fa-door-open' : 'fa-door-closed'}`}></i>
                    </div>
                    <div title="Ocena Google" className={`font-bold ${place.rating ? 'text-blue-600' : 'text-gray-400'}`}>
                        <i className="fa-solid fa-star text-xs mr-1"></i>
                        <span>{place.rating || '-'}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => onDetailsClick(place)} className={SHARED_STYLES.toolbar.iconButton} style={{height: '32px', width: '32px'}} title="Podgląd"><i className="fa-solid fa-eye text-sm"></i></button>
                    <button onClick={() => onEdit(place)} className={SHARED_STYLES.toolbar.iconButton} style={{height: '32px', width: '32px'}} title="Edytuj"><i className="fa-solid fa-pencil text-sm"></i></button>
                    <button onClick={() => onDelete(place.id)} className={`${SHARED_STYLES.toolbar.iconButton} hover:text-red-600`} style={{height: '32px', width: '32px'}} title="Usuń"><i className="fa-solid fa-trash-can text-sm"></i></button>
                </div>
            </div>
        </div>
    );
};
import React from 'react';
import { SHARED_STYLES } from '../../lib/helpers';
import { formatPhoneNumber, DIRECTIONS_LIST } from '../../lib/helpers';

export default function AttractionTile({ attraction, onDetailsClick, onEdit, onArchive, onDelete, activeDirectionFilter, config }) {
    const renderDistances = () => {
        const parseAndFormat = (distStr) => {
            if (!distStr && distStr !== 0) return null;
            const match = String(distStr).match(/(\d+[\.,]?\d*)/);
            return match ? `${match[1].replace('.', ',')} km` : null;
        };

        const mikolajkiId = (config.municipalities || []).find(m => m.name.toLowerCase().includes('mikołajki'))?.id;

        // Priorytet 1: Dystans w Mikołajkach (bez zmian)
        if (attraction.municipality_id === mikolajkiId && attraction.distance_mikolajki) {
            const formattedDist = parseAndFormat(attraction.distance_mikolajki);
            if (formattedDist) {
                return <span>Mikołajki: <strong>{formattedDist}</strong></span>;
            }
        }

        const directionsData = attraction.directions_data || [];
        if (directionsData.length === 0) return <span>-</span>;
        
        // NOWA LOGIKA: Sprawdź, czy jest aktywny filtr kierunku
        if (activeDirectionFilter) {
            const filteredDir = directionsData.find(d => d.direction_id === activeDirectionFilter);
            if (filteredDir) {
                const dirName = DIRECTIONS_LIST.find(d => d.id === filteredDir.direction_id)?.name;
                const distance = filteredDir.distance ? `<strong>${String(filteredDir.distance).replace('.', ',')} km</strong>` : '-';
                return <span dangerouslySetInnerHTML={{ __html: `${dirName}: ${distance}` }} />;
            }
            return <span>-</span>; // Placeholder, jeśli nie znajdzie
        } else {
            // Jeśli nie ma filtra, wyświetl wszystkie dostępne kierunki
            return (
                <div className="flex flex-col items-start">
                    {directionsData.map(dir => {
                        const dirName = DIRECTIONS_LIST.find(d => d.id === dir.direction_id)?.name;
                        const distance = dir.distance ? `<strong>${String(dir.distance).replace('.', ',')} km</strong>` : '-';
                        return <span key={dir.direction_id} dangerouslySetInnerHTML={{ __html: `${dirName}: ${distance}` }} />;
                    })}
                </div>
            );
        }
    };

const getStatusInfo = (status) => {
        switch (status) {
            case 'Aktualne': return { icon: 'fa-check-circle', color: 'text-green-600' };
            case 'Do weryfikacji': return { icon: 'fa-exclamation-circle', color: 'text-yellow-600' };
            case 'Zarchiwizowane': return { icon: 'fa-box-archive', color: 'text-gray-500' };
            default: return { icon: 'fa-question-circle', color: 'text-gray-500' };
        }
    };

    const statusInfo = getStatusInfo(attraction.verification_status);

    return (
        <div className="bg-white rounded-lg shadow-md p-4 flex flex-col justify-between gap-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
            <div onClick={() => onDetailsClick(attraction)} className="cursor-pointer">
                <div className="flex gap-4">
                    <div className="relative w-24 h-24 flex-shrink-0">
                        <div className="w-24 h-24 bg-gray-200 rounded-md overflow-hidden">
                            {attraction.squareThumbnailUrl ? 
                                <img src={attraction.squareThumbnailUrl} alt={attraction.name_pl} className="w-full h-full object-cover" /> :
                                <div className="w-full h-full flex items-center justify-center"><i className="fa-solid fa-image fa-2x text-gray-400"></i></div>
                            }
                        </div>
                        {/* USUNIĘTO NIEBIESKĄ KROPKĘ Z TEGO MIEJSCA */}
                    </div>
                    <div className="flex-grow">
                        <h3 className="font-bold text-blue-800 leading-tight">{attraction.name_pl}</h3>
                        <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                            <p className="flex items-start gap-1.5"><i className="fa-solid fa-map-marker-alt fa-fw mt-0.5"></i><span>{attraction.address || 'Brak adresu'}</span></p>
                            <p className="flex items-start gap-1.5"><i className="fa-solid fa-phone fa-fw mt-0.5"></i><span>{formatPhoneNumber(attraction.phone)}</span></p>
                            <div className="flex items-start gap-1.5"><i className="fa-solid fa-route fa-fw mt-0.5"></i>{renderDistances()}</div>
                        </div>
                    </div>
                </div>
                {attraction.info_snippet_pl && (
                    <p className="text-xs text-gray-700 border-t pt-2 mt-4">{attraction.info_snippet_pl}</p>
                )}
            </div>
            
            {/* NOWA, ROZBUDOWANA STOPKA */}
            <div className="border-t pt-2 flex items-center justify-between gap-2">
                {/* Lewa strona: Wskaźniki statusu */}
                <div className="flex items-center gap-3 text-gray-400">
                    {attraction.opening_hours_managed_by_google && (
                        <div className="flex items-center text-xs" title="Godziny otwarcia są zarządzane przez Google Maps">
                            <i className="fa-brands fa-google fa-fw"></i>
                        </div>
                    )}
                    <div className={`flex items-center gap-1 text-xs font-semibold ${statusInfo.color}`} title={`Status: ${attraction.verification_status}`}>
                        <i className={`fa-solid ${statusInfo.icon} fa-fw`}></i>
                        <span>{attraction.last_verified_date || 'Brak daty'}</span>
                    </div>
                </div>

                {/* Prawa strona: Przyciski akcji */}
                <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(attraction); }} className={SHARED_STYLES.toolbar.iconButton} style={{height: '32px', width: '32px'}} title="Edytuj"><i className="fa-solid fa-pencil text-sm"></i></button>
                    <button onClick={(e) => { e.stopPropagation(); onArchive(attraction); }} className={SHARED_STYLES.toolbar.iconButton} style={{height: '32px', width: '32px'}} title="Archiwizuj"><i className="fa-solid fa-box-archive text-sm"></i></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(attraction.id); }} className={`${SHARED_STYLES.toolbar.iconButton} hover:text-red-600`} style={{height: '32px', width: '32px'}} title="Usuń"><i className="fa-solid fa-trash-can text-sm"></i></button>
                </div>
            </div>
        </div>
    );
};
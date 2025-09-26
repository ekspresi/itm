import React, { useState } from 'react';
import Modal from '../../components/Modal';
import { SHARED_STYLES } from '../../lib/helpers';

const InfoRow = ({ icon, label, children }) => (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100">
        <i className={`fa-solid ${icon} fa-fw text-gray-400 mt-1`}></i>
        <div className="text-sm">
            <p className="font-bold text-gray-500 text-xs">{label}</p>
            <div className="font-semibold text-gray-800">{children}</div>
        </div>
    </div>
);

export default function EventDetailsModal({ isOpen, onClose, event, categories, onEdit, onDelete, onArchive }) {
    const [activeLang, setActiveLang] = useState('pl');

    if (!isOpen || !event) return null;

    const getCategoryNames = (ids = []) => ids.map(id => categories.find(c => c.id === id)?.name || null).filter(Boolean).join(', ');
    const getGmapsLink = (coords) => {
        if (!coords || !coords.latitude || !coords.longitude) return null;
        return `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
    };

    const modalFooter = (
        <div className="w-full flex justify-end gap-2">
            <button onClick={() => onArchive(event)} className={SHARED_STYLES.buttons.secondary}><i className="fa-solid fa-box-archive mr-2"></i>Archiwizuj</button>
            <button onClick={() => onEdit(event)} className={SHARED_STYLES.buttons.secondary}><i className="fa-solid fa-pencil mr-2"></i>Edytuj</button>
            <button onClick={() => onDelete(event.id)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"><i className="fa-solid fa-trash-can mr-2"></i>Usuń</button>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={event[`eventName_${activeLang}`] || event.eventName_pl} footer={modalFooter} maxWidth="max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {/* --- LEWA KOLUMNA: GRAFIKA I SZCZEGÓŁOWE INFO --- */}
                <div className="space-y-1">
                    <div className="w-full h-56 bg-gray-200 rounded-lg overflow-hidden mb-3">
                        {event.imageUrl ? 
                            <img src={event.imageUrl} alt={`Plakat dla ${event.eventName_pl}`} className="w-full h-full object-cover"/> :
                            <div className="w-full h-full flex items-center justify-center"><i className="fa-solid fa-image fa-4x text-gray-400"></i></div>
                        }
                    </div>
                    <InfoRow icon="fa-map-marker-alt" label="Lokalizacja">
                        <div className="flex flex-col">
                           {event.city && <span>{event.city}</span>}
                           <span>{event.location || 'Brak'}</span>
                           <span className="text-xs text-gray-500">{event.address || ''} 
                               {event.coordinates && (
                                   <a href={getGmapsLink(event.coordinates)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-2">[Zobacz na mapie]</a>
                               )}
                           </span>
                        </div>
                    </InfoRow>
                    <InfoRow icon="fa-user-tie" label="Organizator">{event.organizer || 'Brak'}</InfoRow>
                    <InfoRow icon="fa-money-bill" label="Cena">
                        <span>{event.priceInfo_pl || 'Brak'}</span>
                        {event.ticketUrl && (
                             <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline ml-2">[Kup bilet]</a>
                        )}
                    </InfoRow>
                    <InfoRow icon="fa-tags" label="Kategorie">{getCategoryNames(event.categoryIds) || 'Brak'}</InfoRow>
                    <InfoRow icon="fa-satellite-dish" label="Źródło">
                        <span>{event.source === 'facebook_import' ? 'Facebook' : 'Dodano ręcznie'}</span>
                        {event.source === 'facebook_import' && event.sourceName && (
                            <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline ml-2">[{event.sourceName}]</a>
                        )}
                    </InfoRow>
                    {(event.attendingCount > 0 || event.interestedCount > 0) && (
                         <InfoRow icon="fa-users" label="Popularność">
                            <div className="flex items-center gap-4">
                                <span title="Wezmą udział"><i className="fa-solid fa-user-check mr-1"></i> {event.attendingCount || 0}</span>
                                <span title="Zainteresowani"><i className="fa-solid fa-star mr-1"></i> {event.interestedCount || 0}</span>
                            </div>
                        </InfoRow>
                    )}
                </div>
                {/* --- PRAWA KOLUMNA: OPIS I TERMINY (bez zmian) --- */}
                <div className="space-y-4">
                     <div className="flex border-b">
                        {[{ key: 'pl', label: 'Polski' }, { key: 'de', label: 'Niemiecki' }, { key: 'en', label: 'Angielski' }].map(tab => (
                            <button key={tab.key} onClick={() => setActiveLang(tab.key)} className={`${SHARED_STYLES.tabs.base} ${activeLang === tab.key ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>{tab.label}</button>
                        ))}
                    </div>
                    {event[`description_${activeLang}`] && 
                        <div>
                            <h4 className="font-bold text-sm mb-1">Opis</h4>
                            <div className="text-sm whitespace-pre-wrap prose max-w-none" dangerouslySetInnerHTML={{ __html: event[`description_${activeLang}`] }}></div>
                        </div>
                    }
                     <div>
                        <h4 className="font-bold text-sm mb-1">Wszystkie terminy</h4>
                        <ul className="list-disc list-inside text-sm space-y-1">
                           {(event.occurrences || []).map((occ, index) => (
                               <li key={index}>{occ.eventDate} {occ.startTime && `o ${occ.startTime}`} {occ.endTime && `- ${occ.endTime}`}</li>
                           ))}
                        </ul>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
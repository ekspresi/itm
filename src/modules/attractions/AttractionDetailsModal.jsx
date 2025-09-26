import React, { useState } from 'react';
import Modal from '../../components/Modal';
import { formatPhoneNumber } from '../../lib/helpers';
import { DIRECTIONS_LIST } from '../../lib/helpers'; // Zakładając, że DIRECTIONS_LIST jest w helpers.js
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

export default function AttractionDetailsModal({ isOpen, onClose, attraction, config }) {
    const [activeLang, setActiveLang] = useState('pl');

    if (!isOpen || !attraction) return null;

    const getMunicipalityName = (id) => (config.municipalities || []).find(m => m.id === id)?.name || 'Brak';
    const getTypeName = (id) => (config.tags?.type || []).find(t => t.id === id)?.name || '';
    const getTypeIcon = (id) => (config.tags?.type || []).find(t => t.id === id)?.icon || '';

    const renderLink = (url, text) => {
        if (!url) return <span>Brak</span>;
        const displayUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '');
        return <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{text || displayUrl}</a>;
    };
    
    const InfoRow = ({ icon, label, children }) => (
        <div className="flex items-start gap-3 py-2 border-b border-gray-100">
            <i className={`fa-solid ${icon} fa-fw text-gray-400 mt-1`}></i>
            <div className="text-sm">
                <p className="font-bold text-gray-500 text-xs">{label}</p>
                <div className="font-semibold text-gray-800">{children}</div>
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={attraction[`name_${activeLang}`] || attraction.name_pl} maxWidth="max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* === LEWA KOLUMNA === */}
                <div className="space-y-4">
                    <div className="w-full h-56 bg-gray-200 rounded-lg overflow-hidden">
                        {attraction.imageUrl ? 
                            <img src={attraction.imageUrl} alt={`Zdjęcie dla ${attraction.name_pl}`} className="w-full h-full object-cover"/> :
                            <div className="w-full h-full flex items-center justify-center"><i className="fa-solid fa-image fa-4x text-gray-400"></i></div>
                        }
                    </div>
                    
                    <InfoRow icon="fa-monument" label="Gmina">{getMunicipalityName(attraction.municipality_id)}</InfoRow>
                    <InfoRow icon="fa-map-marker-alt" label="Adres">{attraction.address || 'Brak'}</InfoRow>
                    <InfoRow icon="fa-phone" label="Telefon">{formatPhoneNumber(attraction.phone)}</InfoRow>
                    <InfoRow icon="fa-envelope" label="E-mail">{attraction.email ? <a href={`mailto:${attraction.email}`} className="text-blue-600 hover:underline">{attraction.email}</a> : 'Brak'}</InfoRow>
                    <InfoRow icon="fa-globe" label="Strona WWW">{renderLink(attraction.website)}</InfoRow>
                    <InfoRow icon="fa-map-signs" label="Mapy Google">{renderLink(attraction.google_maps_url, "Otwórz w Mapach Google")}</InfoRow>
                    
                    {(attraction.directions_data?.length > 0) && (
                        <InfoRow icon="fa-route" label="Dojazd od IT">
                            <ul className="list-disc list-inside">
                                {attraction.directions_data.map(dir => {
                                    const dirName = DIRECTIONS_LIST.find(d => d.id === dir.direction_id)?.name;
                                    return <li key={dir.direction_id}>{dirName}: <strong>{dir.distance} km</strong></li>
                                })}
                            </ul>
                        </InfoRow>
                    )}

                    <div className="pt-2 border-t">
                        <h4 className="font-bold text-sm my-2">Kategorie</h4>
                        <div className="flex flex-wrap gap-2">
                            {(attraction.tag_ids?.type || []).map(tagId => (
                                 <span key={tagId} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-semibold flex items-center gap-1.5">
                                    {getTypeIcon(tagId) && <i className={`fa-solid ${getTypeIcon(tagId)}`}></i>}
                                    {getTypeName(tagId)}
                                </span>
                            ))}
                            {(attraction.collection_ids || []).map(collectionId => {
                                const collection = (config.collections || []).find(c => c.id === collectionId);
                                return collection ? (
                                    <span key={collectionId} className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded-full font-semibold flex items-center gap-1.5">
                                        {collection.icon && <i className={`fa-solid ${collection.icon}`}></i>}
                                        {collection.name}
                                    </span>
                                ) : null;
                            })}
                        </div>
                    </div>
                </div>

                {/* === PRAWA KOLUMNA === */}
                <div className="space-y-4">
                     <div className="flex border-b">
                        {[{ key: 'pl', label: 'Polski' }, { key: 'de', label: 'Niemiecki' }, { key: 'en', label: 'Angielski' }].map(tab => (
                            <button key={tab.key} onClick={() => setActiveLang(tab.key)} className={`${SHARED_STYLES.tabs.base} ${activeLang === tab.key ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>{tab.label}</button>
                        ))}
                    </div>
                    
                    {attraction[`teaser_${activeLang}`] && <div><h4 className="font-bold text-sm mb-1">Zajawka</h4><p className="text-sm italic bg-gray-50 p-2 rounded-md">{attraction[`teaser_${activeLang}`]}</p></div>}
                    {attraction[`info_snippet_${activeLang}`] && <div><h4 className="font-bold text-sm mb-1">Opis informacyjny</h4><p className="text-sm">{attraction[`info_snippet_${activeLang}`]}</p></div>}
                    {attraction[`full_desc_${activeLang}`] && <div><h4 className="font-bold text-sm mb-1">Opis pełny</h4><p className="text-sm whitespace-pre-wrap">{attraction[`full_desc_${activeLang}`]}</p></div>}
                    
                    {attraction.reservation_required && (
                         <div className="pt-2 border-t"><h4 className="font-bold text-sm mb-1 text-blue-700">Wymagana rezerwacja</h4><p className="text-sm">{attraction[`reservation_details_${activeLang}`]}</p></div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
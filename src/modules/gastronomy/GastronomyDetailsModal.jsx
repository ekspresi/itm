import React from 'react';
import Modal from '../../components/Modal';

export default function GastronomyDetailsModal({ isOpen, onClose, place }) {
    if (!isOpen) return null;

    const InfoRow = ({ icon, label, children }) => (
        <div className="flex items-start gap-3 py-2 border-b border-gray-100">
            <i className={`fa-solid ${icon} fa-fw text-gray-400 mt-1`}></i>
            <div className="text-sm">
                <p className="font-bold text-gray-500 text-xs">{label}</p>
                <div className="font-semibold text-gray-800">{children || <span className="text-gray-400 font-normal">Brak</span>}</div>
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={place.name} maxWidth="max-w-xl">
            <div>
                {(place.imageUrl || place.google_photo_url) && (
                    <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden mb-4">
                        <img src={place.imageUrl || place.google_photo_url} alt={`Zdjęcie dla ${place.name}`} className="w-full h-full object-cover" />
                    </div>
                )}
                <InfoRow icon="fa-map-marker-alt" label="Adres">{place.address_formatted}</InfoRow>
                <InfoRow icon="fa-map-signs" label="Zobacz na mapie"><a href={place.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Otwórz w Google Maps</a></InfoRow>
                <InfoRow icon="fa-phone" label="Telefon">{place.phone}</InfoRow>
                <InfoRow icon="fa-globe" label="Strona WWW">{place.website ? <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{place.website}</a> : 'Brak'}</InfoRow>
                <InfoRow icon="fa-star" label="Ocena Google">{place.rating ? `${place.rating} / 5` : 'Brak'}</InfoRow>
                {place.opening_hours?.weekdayDescriptions && (
                    <InfoRow icon="fa-clock" label="Godziny otwarcia"><ul className="text-xs">{place.opening_hours.weekdayDescriptions.map((line, index) => <li key={index}>{line}</li>)}</ul></InfoRow>
                )}
                <InfoRow icon="fa-utensils" label="Atrybuty">
                    <div className="flex flex-wrap gap-2">
                        {place.servesBreakfast && <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">Śniadania</span>}
                        {place.servesLunch && <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">Lunch</span>}
                        {place.outdoorSeating && <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">Ogródek</span>}
                        {place.delivery && <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">Dowóz</span>}
                    </div>
                </InfoRow>
            </div>
        </Modal>
    );
};
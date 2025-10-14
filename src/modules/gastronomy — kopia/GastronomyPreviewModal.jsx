import React from 'react';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function GastronomyPreviewModal({ isOpen, onClose, previewData, isLoading }) {
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
        <Modal isOpen={isOpen} onClose={onClose} title="Podgląd Miejsca" maxWidth="max-w-xl">
            {isLoading && <LoadingSpinner />}
            {!isLoading && previewData && (
                <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-blue-800 mb-2">{previewData.name}</h3>
                    <InfoRow icon="fa-map-marker-alt" label="Adres">{previewData.address_formatted}</InfoRow>
                    
                    {/* ZMIANA: Dodano link do Google Maps */}
                    <InfoRow icon="fa-map-signs" label="Zobacz na mapie">
                        <a href={previewData.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Otwórz w Google Maps</a>
                    </InfoRow>

                    <InfoRow icon="fa-phone" label="Telefon">{previewData.phone}</InfoRow>
                    <InfoRow icon="fa-globe" label="Strona WWW">
                        {previewData.website ? <a href={previewData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{previewData.website}</a> : 'Brak'}
                    </InfoRow>
                    <InfoRow icon="fa-star" label="Ocena Google">{previewData.rating ? `${previewData.rating} / 5` : 'Brak'}</InfoRow>
                    
                    {/* ZMIANA: Dodano wyświetlanie godzin otwarcia */}
                    {previewData.opening_hours?.weekdayDescriptions && (
                        <InfoRow icon="fa-clock" label="Godziny otwarcia">
                            <ul className="text-xs">
                                {previewData.opening_hours.weekdayDescriptions.map((line, index) => <li key={index}>{line}</li>)}
                            </ul>
                        </InfoRow>
                    )}

                    <InfoRow icon="fa-utensils" label="Atrybuty">
                        <div className="flex flex-wrap gap-2">
                            {previewData.servesBreakfast && <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">Śniadania</span>}
                            {previewData.servesLunch && <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">Lunch</span>}
                            {previewData.servesDinner && <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">Kolacje</span>}
                            {previewData.outdoorSeating && <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">Ogródek</span>}
                            {previewData.delivery && <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">Dowóz</span>}
                            {previewData.takeout && <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">Na wynos</span>}
                        </div>
                    </InfoRow>
                    <InfoRow icon="fa-wheelchair" label="Dostępność">
                        <div className="flex flex-wrap gap-2">
                            {previewData.wheelchairAccessibleEntrance ? <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Dostępne wejście</span> : <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Brak info o wejściu</span>}
                        </div>
                    </InfoRow>
                </div>
            )}
        </Modal>
    );
};
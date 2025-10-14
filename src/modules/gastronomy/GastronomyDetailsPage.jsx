import React from 'react';
import { isOpenNow, getDayName } from '../../lib/helpers';
import { Card, CardHeader, CardPreview, Image, Body1, Subtitle2 } from '@fluentui/react-components';

const DetailRow = ({ icon, label, value, className = '' }) => (
    <div className={`flex items-start gap-3 text-sm ${className}`}>
        <div className="w-5 text-center text-gray-500"><i className={`fa-solid ${icon}`}></i></div>
        <div className="flex-1">
            <p className="font-semibold text-gray-500">{label}</p>
            <p className="text-gray-800">{value}</p>
        </div>
    </div>
);

export default function GastronomyDetailsPage({ place }) {
    if (!place) return null;

    const isOpen = isOpenNow(place);
    const imageUrl = place.imageUrl || place.google_photo_url || '';

    const today = new Date().getDay(); // 0=Niedziela, 1=Poniedziałek, ...
    const dayIndex = today === 0 ? 6 : today - 1;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader
                        header={<Body1><b className="text-2xl">{place.name}</b></Body1>}
                        description={<Subtitle2>{place.address_formatted}</Subtitle2>}
                    />
                    <CardPreview>
                        {imageUrl ?
                            <Image src={imageUrl} alt={place.name} fit="cover" className="h-64" /> :
                            <div className="h-64 bg-gray-100 flex items-center justify-center">
                                <i className="fa-solid fa-utensils fa-4x text-gray-300"></i>
                            </div>
                        }
                    </CardPreview>

                    {place.custom_description_pl && (
                        <div className="p-4 border-t">
                            <h3 className="font-bold mb-2">Opis</h3>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{place.custom_description_pl}</p>
                        </div>
                    )}
                </Card>
            </div>

            <div className="space-y-4">
                <Card>
                    <div className="p-4 space-y-4">
                        <h3 className="font-bold">Informacje</h3>
                        {place.phone && <DetailRow icon="fa-phone" label="Telefon" value={place.phone} />}
                        {place.website && <DetailRow icon="fa-globe" label="Strona WWW" value={<a href={place.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{place.website}</a>} />}
                        <div className={`flex items-start gap-3 text-sm`}>
                            <div className="w-5 text-center text-gray-500"><i className={`fa-solid fa-door-open`}></i></div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-500">Status</p>
                                <p className={`font-bold ${isOpen ? 'text-green-600' : 'text-red-600'}`}>
                                    {isOpen ? 'Otwarte teraz' : 'Teraz zamknięte'}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
                
                {/* POPRAWIONY WARUNEK: Sprawdzamy, czy `weekday_text` istnieje */}
                {place.opening_hours?.weekday_text?.length > 0 && (
                    <Card>
                        <div className="p-4">
                            <h3 className="font-bold mb-3">Godziny otwarcia</h3>
                            <ul className="space-y-1 text-sm">
                                {place.opening_hours.weekday_text.map((text, index) => (
                                    <li key={index} className={`flex justify-between ${dayIndex === index ? 'font-bold text-blue-800' : ''}`}>
                                        <span>{getDayName(index)}:</span>
                                        <span>{text.split(': ')[1]}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
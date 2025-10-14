import React, { useState, useEffect } from 'react';
import { db, firebaseApi } from '../../../lib/firebase'; // <--- Poprawiony import
import { Button, Card, CardHeader } from "@fluentui/react-components";
import { Add24Regular, Edit24Regular } from "@fluentui/react-icons";
import LoadingSpinner from '../../../components/LoadingSpinner';
import StationModal from '../modals/StationModal';

export default function StationsView() {
    const [allStations, setAllStations] = useState([]);
    const [allEquipment, setAllEquipment] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStation, setSelectedStation] = useState(null);

    useEffect(() => {
        // Poprawiona składnia
        const stationsRef = db.collection(firebaseApi._getFullPath('stations'));
        const equipmentRef = db.collection(firebaseApi._getFullPath('gamingEquipment'));

        const unsubStations = stationsRef.onSnapshot(snapshot => {
            setAllStations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unsubEquipment = equipmentRef.onSnapshot(snapshot => {
            setAllEquipment(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        });

        return () => {
            unsubStations();
            unsubEquipment();
        };
    }, []);

    const handleEdit = (station) => {
        setSelectedStation(station);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setSelectedStation(null);
        setIsModalOpen(true);
    };
    
    const getEquipmentName = (id) => {
        const item = allEquipment.find(eq => eq.id === id);
        return item ? item.name : 'Nieznany sprzęt';
    };


    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div>
            {isModalOpen && (
                <StationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    initialData={selectedStation}
                    allEquipment={allEquipment}
                    allStations={allStations}
                />
            )}
            <div className="flex justify-end mb-4">
                <Button icon={<Add24Regular />} appearance="primary" onClick={handleAddNew}>
                    Utwórz nowe stanowisko
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {allStations.map(station => (
                    <Card key={station.id}>
                        <CardHeader
                            header={<div className="font-semibold text-base">{station.name}</div>}
                            action={
                                <Button icon={<Edit24Regular />} appearance="transparent" onClick={() => handleEdit(station)} />
                            }
                        />
                        <div className="p-4 pt-0">
                            <h4 className="font-semibold text-sm mb-1">Składniki stanowiska:</h4>
                            <ul className="list-disc pl-5 text-sm">
                                {(station.equipmentIds || []).map(id => (
                                    <li key={id}>{getEquipmentName(id)}</li>
                                ))}
                            </ul>
                        </div>
                    </Card>
                 ))}
            </div>
            {allStations.length === 0 && <p className="text-center p-8 text-neutral-foreground-2">Brak utworzonych stanowisk.</p>}
        </div>
    );
}
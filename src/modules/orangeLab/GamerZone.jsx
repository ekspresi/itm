import React, { useState, useEffect } from 'react';
import { db, firebaseApi } from '../../lib/firebase';
import { TabList, Tab } from "@fluentui/react-components";
import EquipmentView from './views/EquipmentView';
import GameLibraryView from './views/GameLibraryView';
import StationsView from './views/StationsView';
import AccountsView from './views/AccountsView';
import StationDetailsView from './views/StationDetailsView'; // <-- NOWY IMPORT
import LoadingSpinner from '../../components/LoadingSpinner'; // <-- NOWY IMPORT

export default function GamerZone() {
    // Stany do zarządzania danymi
    const [allData, setAllData] = useState({ stations: [], equipment: [], games: [], accounts: [] });
    const [isLoading, setIsLoading] = useState(true);

    // Stany do nawigacji
    const [activeTab, setActiveTab] = useState("stations");
    const [view, setView] = useState('list'); // 'list' lub 'details'
    const [selectedStationId, setSelectedStationId] = useState(null);

    // Główny useEffect pobierający wszystkie dane dla Strefy Gracza
    useEffect(() => {
        const collections = ['stations', 'gamingEquipment', 'gameLibrary', 'accounts'];
        const unsubscribers = collections.map(colName => {
            const ref = db.collection(firebaseApi._getFullPath(colName));
            return ref.onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllData(prev => ({ ...prev, [colName === 'gamingEquipment' ? 'equipment' : colName === 'gameLibrary' ? 'games' : colName]: data }));
            });
        });
        
        setIsLoading(false);
        return () => unsubscribers.forEach(unsub => unsub());
    }, []);

    const handleViewStation = (stationId) => {
        setSelectedStationId(stationId);
        setView('details');
    };

    const handleBackToList = () => {
        setSelectedStationId(null);
        setView('list');
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (view === 'details') {
        return <StationDetailsView 
                    stationId={selectedStationId} 
                    allData={allData}
                    onBack={handleBackToList}
                />;
    }

    return (
        <div className="flex flex-col h-full">
            <TabList selectedValue={activeTab} onTabSelect={(_, data) => setActiveTab(data.value)}>
                <Tab value="stations">Stanowiska</Tab>
                <Tab value="equipment">Baza Sprzętu</Tab>
                <Tab value="games">Biblioteka Gier</Tab>
                <Tab value="accounts">Menadżer kont</Tab>
            </TabList>
            <div className="flex-grow pt-4">
                {activeTab === 'accounts' && <AccountsView allAccounts={allData.accounts} allEquipment={allData.equipment} />}
                {activeTab === 'stations' && <StationsView allStations={allData.stations} allEquipment={allData.equipment} onViewStation={handleViewStation} />}
                {activeTab === 'equipment' && <EquipmentView allEquipment={allData.equipment} />}
                {activeTab === 'games' && <GameLibraryView allGames={allData.games} allAccounts={allData.accounts} />}
            </div>
        </div>
    );
}
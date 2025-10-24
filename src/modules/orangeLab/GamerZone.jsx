import React, { useState } from 'react';
import { TabList, Tab } from "@fluentui/react-components";
import StationsView from './views/StationsView';
import EquipmentView from './views/EquipmentView';
import AccountsView from './views/AccountsView';
import GameLibraryView from './views/GameLibraryView';

// KROK 1 (poprawiony): Odbieramy onStationClick jako props
export default function GamerZone({ onStationClick }) { 
    const [selectedTab, setSelectedTab] = useState("stations");

    const handleTabSelect = (event, data) => {
        setSelectedTab(data.value);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="mb-4">
                <TabList selectedValue={selectedTab} onTabSelect={handleTabSelect}>
                    <Tab value="stations">Stanowiska</Tab>
                    <Tab value="equipment">Sprzęty</Tab>
                    <Tab value="accounts">Konta</Tab>
                    <Tab value="gameLibrary">Biblioteka gier</Tab>
                </TabList>
            </div>
            <div className="flex-grow">
                {selectedTab === 'stations' && <StationsView onStationClick={onStationClick} />}
                {selectedTab === 'equipment' && <EquipmentView />}
                {selectedTab === 'accounts' && <AccountsView />}
                {selectedTab === 'gameLibrary' && <GameLibraryView />}
            </div>
        </div>
    );
}
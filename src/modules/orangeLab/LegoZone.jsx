import React, { useState } from 'react';
import { TabList, Tab } from "@fluentui/react-components";
import SetsView from './views/SetsView';
import ParticipantsView from './views/ParticipantsView';
import ProgressView from './views/ProgressView'; // <--- DODAJ TEN IMPORT

export default function LegoZone() {
    const [activeTab, setActiveTab] = useState("progress");

    return (
        <div className="flex flex-col h-full">
            <TabList selectedValue={activeTab} onTabSelect={(_, data) => setActiveTab(data.value)}>
                <Tab value="progress">Postępy</Tab>
                <Tab value="participants">Uczestnicy i Grupy</Tab>
                <Tab value="sets">Baza Zestawów</Tab>
            </TabList>
            <div className="flex-grow pt-4">
                {activeTab === 'sets' && <SetsView />}
                {activeTab === 'participants' && <ParticipantsView />}
                {activeTab === 'progress' && <ProgressView />}
            </div>
        </div>
    );
}
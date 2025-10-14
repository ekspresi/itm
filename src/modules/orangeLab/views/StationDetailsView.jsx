import React, { useMemo } from 'react';
import { Button, Subtitle1, Title3, Divider } from "@fluentui/react-components";
import { ArrowLeft24Regular } from '@fluentui/react-icons';

// UWAGA: Poniższy kod zakłada, że skopiowałeś/przeniosłeś komponenty
// EquipmentCard i GameCard do osobnych plików lub skopiowałeś ich kod tutaj.
// Dla uproszczenia, zakładam, że ich kod jest dostępny.
// Poniżej znajdują się uproszczone wersje - musisz je zastąpić pełnym kodem z odpowiednich plików.

const EquipmentCard = ({ item }) => <div className="p-4 shadow-md rounded-lg bg-white">{item.name} (Sprzęt)</div>;
const GameCard = ({ game }) => <div className="p-4 shadow-md rounded-lg bg-white">{game.name} (Gra)</div>;
const AccountRow = ({ account }) => <div className="p-4 shadow-md rounded-lg bg-white">{account.email} (Konto)</div>;


export default function StationDetailsView({ stationId, allData, onBack }) {
    const { stations, equipment, games, accounts } = allData;

    const station = useMemo(() => stations.find(s => s.id === stationId), [stationId, stations]);

    const stationEquipment = useMemo(() => {
        if (!station) return [];
        return equipment.filter(eq => station.equipmentIds.includes(eq.id));
    }, [station, equipment]);

    const stationAccounts = useMemo(() => {
        if (stationEquipment.length === 0) return [];
        const equipmentIds = stationEquipment.map(eq => eq.id);
        return accounts.filter(acc => equipmentIds.includes(acc.assignedEquipmentId));
    }, [stationEquipment, accounts]);

    const stationGamesByStatus = useMemo(() => {
        if (stationAccounts.length === 0) return {};
        const stationAccountIds = new Set(stationAccounts.map(acc => acc.id));
        
        const relevantGames = games.filter(game => 
            game.assignments?.some(assign => stationAccountIds.has(assign.accountId))
        );

        const grouped = {};
        relevantGames.forEach(game => {
            game.assignments.forEach(assign => {
                if (stationAccountIds.has(assign.accountId)) {
                    if (!grouped[assign.status]) {
                        grouped[assign.status] = [];
                    }
                    // Unikaj duplikatów gier w tej samej kategorii statusu
                    if (!grouped[assign.status].some(g => g.id === game.id)) {
                        grouped[assign.status].push(game);
                    }
                }
            });
        });
        return grouped;
    }, [stationAccounts, games]);
    
    const equipmentByCat = useMemo(() => {
        const grouped = {};
        stationEquipment.forEach(eq => {
            const type = eq.type || 'inne';
            if(!grouped[type]) grouped[type] = [];
            grouped[type].push(eq);
        });
        return grouped;
    }, [stationEquipment]);


    if (!station) {
        return <div>Nie znaleziono stanowiska. <Button onClick={onBack}>Wróć</Button></div>;
    }

    return (
        <div className="flex flex-col gap-8">
            <div>
                <Button icon={<ArrowLeft24Regular />} onClick={onBack} appearance="subtle" className="mb-4">Wróć do listy</Button>
                <Title3>{station.name}</Title3>
            </div>

            <Divider />

            <div>
                <Subtitle1>Sprzęt w tym stanowisku</Subtitle1>
                {Object.entries(equipmentByCat).map(([category, items]) => (
                    <div key={category} className="mt-4">
                        <h3 className="font-semibold capitalize mb-2">{category}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                            {items.map(item => <EquipmentCard key={item.id} item={item} />)}
                        </div>
                    </div>
                ))}
            </div>
            
             <Divider />

            <div>
                <Subtitle1>Konta przypisane do stanowiska</Subtitle1>
                <div className="flex flex-col gap-2 mt-4">
                    {stationAccounts.map(account => <AccountRow key={account.id} account={account} />)}
                </div>
            </div>

            <Divider />

            <div>
                <Subtitle1>Gry na tym stanowisku</Subtitle1>
                {Object.entries(stationGamesByStatus).map(([status, gameList]) => (
                    <div key={status} className="mt-4">
                        <h3 className="font-semibold mb-2">{status}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {gameList.map(game => <GameCard key={game.id} game={game} />)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, Button, Input, Field, TabList, Tab, Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell, Combobox, Option, RadioGroup, Radio,
    makeStyles, tokens
} from "@fluentui/react-components";
import { Add24Regular, Delete24Regular } from "@fluentui/react-icons";
import { db, firebaseApi } from '../../../lib/firebase';
import LoadingSpinner from '../../../components/LoadingSpinner';

// === NOWE STYLE (wzorowane na AttractionModal.jsx i GastronomyModal.jsx) ===
const useStyles = makeStyles({
    dialogBody: { 
        display: 'flex', 
        flexDirection: 'column', 
        gap: tokens.spacingVerticalL 
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: tokens.spacingVerticalL,
        alignItems: 'end',
        paddingTop: tokens.spacingVerticalL,
    },
    fullWidth: {
        gridColumnStart: 1,
        gridColumnEnd: 3,
    },
    accountsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: tokens.spacingVerticalL,
        alignItems: 'end',
    },
    tabContent: {
        paddingTop: tokens.spacingVerticalL,
        minHeight: '400px', // Zapewnia stałą wysokość modala
    }
});


// === KOMPONENT ZAKŁADKI "GRY" ===
const GamesTab = ({ equipment, allGamesFromLibrary }) => {
    const styles = useStyles();
    const [assignedGames, setAssignedGames] = useState([]);
    const [selectedGameId, setSelectedGameId] = useState(null);
    const [status, setStatus] = useState('installed');

    useEffect(() => {
        const gamesRef = db.collection(firebaseApi._getFullPath('gamingEquipment')).doc(equipment.id).collection('assignedGames');
        const unsubscribe = gamesRef.onSnapshot((snapshot) => {
            setAssignedGames(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [equipment.id]);

    const handleAddGame = async () => {
        if (!selectedGameId) return;
        const assignmentRef = db.collection(firebaseApi._getFullPath('gamingEquipment')).doc(equipment.id).collection('assignedGames').doc();
        await assignmentRef.set({ id: assignmentRef.id, gameId: selectedGameId, status });
        setSelectedGameId(null);
    };
    
    const handleDeleteGame = async (assignmentId) => {
        if(window.confirm('Czy na pewno chcesz usunąć przypisanie tej gry?')){
            const docRef = db.collection(firebaseApi._getFullPath('gamingEquipment')).doc(equipment.id).collection('assignedGames').doc(assignmentId);
            await docRef.delete();
        }
    };

    const getGameName = (gameId) => allGamesFromLibrary.find(g => g.id === gameId)?.name || 'Nierozpoznana gra';
    const statusLabels = { installed: 'Zainstalowana', uninstalled: 'Niezainstalowana', planned: 'W planach' };

    return (
        <div>
            <div className={`p-4 bg-neutral-background-2 rounded-lg ${styles.formGrid}`}>
                <div className={styles.fullWidth}>
                    <Field label="Wybierz grę z biblioteki" required>
                        <Combobox placeholder="Wyszukaj grę..." onOptionSelect={(_, data) => setSelectedGameId(data.optionValue)}>
                            {allGamesFromLibrary.map(game => (
                                <Option key={game.id} value={game.id}>{game.name}</Option>
                            ))}
                        </Combobox>
                    </Field>
                </div>
                <div className={styles.fullWidth}>
                    <Field label="Status">
                        <RadioGroup value={status} onChange={(_, data) => setStatus(data.value)} layout="horizontal">
                            <Radio value="installed" label="Zainstalowana" />
                            <Radio value="uninstalled" label="Niezainstalowana" />
                            <Radio value="planned" label="W planach" />
                        </RadioGroup>
                    </Field>
                </div>
                <div className={`${styles.fullWidth} flex justify-end`}>
                    <Button appearance="primary" icon={<Add24Regular />} onClick={handleAddGame} disabled={!selectedGameId}>Przypisz grę</Button>
                </div>
            </div>
            
            <Table arial-label="Lista przypisanych gier" className="mt-4">
                 <TableHeader><TableRow>
                    <TableHeaderCell>Nazwa Gry</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell></TableHeaderCell>
                </TableRow></TableHeader>
                <TableBody>
                    {assignedGames.map(game => (
                        <TableRow key={game.id}>
                            <TableCell className="font-semibold">{getGameName(game.gameId)}</TableCell>
                            <TableCell>{statusLabels[game.status]}</TableCell>
                            <TableCell>
                                <div className="flex justify-end">
                                    <Button icon={<Delete24Regular />} appearance="subtle" onClick={() => handleDeleteGame(game.id)} />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {assignedGames.length === 0 && <p className="text-center p-8 text-neutral-foreground-2">Brak przypisanych gier.</p>}
        </div>
    );
};

// === GŁÓWNY KOMPONENT MODALA ===
export default function ManageEquipmentModal({ isOpen, onClose, equipment }) {
    const styles = useStyles(); // <-- Używamy stylów
    const [activeTab, setActiveTab] = useState("games");
    const [gameLibrary, setGameLibrary] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const gamesLibRef = db.collection(firebaseApi._getFullPath('gameLibrary'));
        const unsubscribe = gamesLibRef.onSnapshot((snapshot) => {
            setGameLibrary(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return (
        <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
            <DialogSurface className="w-[800px] max-w-[95vw]">
                {/* ZMIANA TUTAJ: Dodajemy className do DialogBody */}
                <DialogBody className={styles.dialogBody}>
                    <DialogTitle>Zarządzaj: {equipment.name}</DialogTitle>
                    <div className={styles.tabContent}>
                        {isLoading ? <LoadingSpinner /> : (
                            <>
                                {activeTab === 'games' && <GamesTab equipment={equipment} allGamesFromLibrary={gameLibrary} />}
                                {activeTab === 'accounts' && <AccountsTab equipment={equipment} />}
                            </>
                        )}
                    </div>
                </DialogBody>
                <DialogActions>
                    <Button appearance="secondary" onClick={onClose}>Zamkij</Button>
                </DialogActions>
            </DialogSurface>
        </Dialog>
    );
}
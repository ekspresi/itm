import React, { useState, useEffect } from 'react';
import { db, firebaseApi } from '../../../lib/firebase';
import { 
    Button, Card, ProgressBar, Menu, MenuTrigger, MenuList, MenuItem, MenuPopover,
    makeStyles, tokens 
} from "@fluentui/react-components";
import { Add24Regular, MoreHorizontal24Regular } from "@fluentui/react-icons";
import LoadingSpinner from '../../../components/LoadingSpinner';
import AssignSetModal from '../modals/AssignSetModal';

const useStyles = makeStyles({
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: tokens.spacingHorizontalL,
    }
});

// === NOWY KOMPONENT KARTY POSTĘPU ===
const BuildHistoryCard = ({ entry, allSets, onEdit, onDelete }) => {
    const set = allSets.find(s => s.id === entry.legoSetId);
    if (!set) return null;

    return (
        <Card>
            {/* ZMIANA TUTAJ: Kontener z poprawnymi proporcjami obrazka */}
            <div className="aspect-[1200/569] w-full overflow-hidden">
                <img 
                    src={set.imageUrl || 'https://placehold.co/1200x569/cccccc/333333?text=Brak+foto'} 
                    alt={set.name} 
                    className="w-full h-full object-cover" 
                />
            </div>
            <div className="p-4">
                <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-base mb-2 h-12">{set.name}</h3>
                    <Menu>
                        <MenuTrigger disableButtonEnhancement>
                            <Button appearance="transparent" icon={<MoreHorizontal24Regular />} />
                        </MenuTrigger>
                        <MenuPopover>
                            <MenuList>
                                <MenuItem onClick={() => onEdit(entry)}>Edytuj</MenuItem>
                                <MenuItem onClick={() => onDelete(entry.id)}>Usuń</MenuItem>
                            </MenuList>
                        </MenuPopover>
                    </Menu>
                </div>
                <div className="text-xs text-neutral-foreground-2 mb-2">
                    {set.number} | {set.series}
                </div>
                <div className="mb-2">
                    <ProgressBar value={entry.progressPercent / 100} />
                    <div className="text-xs text-right mt-1 font-semibold">{entry.progressPercent}%</div>
                </div>
                <div className="text-xs text-neutral-foreground-2 flex justify-between">
                    <span>Czas pracy: {entry.buildTime || 0} min</span>
                    <span>Data: {entry.completionDate}</span>
                </div>
            </div>
        </Card>
    );
};

// === GŁÓWNY KOMPONENT WIDOKU ===
export default function ProgressView() {
    const styles = useStyles();
    const [allData, setAllData] = useState({ participants: [], sets: [], history: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);

    useEffect(() => {
        const participantsRef = db.collection(firebaseApi._getFullPath('participants'));
        const setsRef = db.collection(firebaseApi._getFullPath('legoSets'));
        const historyRef = db.collection(firebaseApi._getFullPath('buildHistory'));

        const unsubParticipants = participantsRef.onSnapshot(snapshot => {
            setAllData(prev => ({ ...prev, participants: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) }));
        });
        const unsubSets = setsRef.onSnapshot(snapshot => {
            setAllData(prev => ({ ...prev, sets: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) }));
        });
        const unsubHistory = historyRef.onSnapshot(snapshot => {
            setAllData(prev => ({ ...prev, history: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) }));
            setIsLoading(false);
        });

        return () => {
            unsubParticipants();
            unsubSets();
            unsubHistory();
        };
    }, []);

    const handleAddNew = () => {
        setEditingEntry(null);
        setIsModalOpen(true);
    };

    const handleEdit = (entry) => {
        setEditingEntry(entry);
        setIsModalOpen(true);
    };
    
    const handleDelete = async (entryId) => {
        if (window.confirm('Czy na pewno chcesz usunąć ten wpis postępu?')) {
            await db.collection(firebaseApi._getFullPath('buildHistory')).doc(entryId).delete();
        }
    };


    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div>
            {isModalOpen && (
                <AssignSetModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    participants={allData.participants}
                    legoSets={allData.sets}
                    initialData={editingEntry}
                />
            )}
            <div className="flex justify-end mb-4">
                <Button icon={<Add24Regular />} appearance="primary" onClick={handleAddNew}>
                    Zapisz postęp
                </Button>
            </div>

            <div className="flex flex-col gap-8">
                {allData.participants.map(p => {
                    const participantHistory = allData.history.filter(entry => entry.participantIds.includes(p.id));
                    if (participantHistory.length === 0) return null;

                    return (
                        <div key={p.id}>
                            <h2 className="text-xl font-semibold mb-3">{p.firstName} {p.lastName}</h2>
                            <div className={styles.grid}>
                                {participantHistory.map(entry => (
                                    <BuildHistoryCard 
                                        key={entry.id}
                                        entry={entry}
                                        allSets={allData.sets}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
            {allData.history.length === 0 && (
                 <p className="text-center p-8 text-neutral-foreground-2">Brak zapisanych postępów. Kliknij "Zapisz postęp", aby dodać pierwszy wpis.</p>
            )}
        </div>
    );
}
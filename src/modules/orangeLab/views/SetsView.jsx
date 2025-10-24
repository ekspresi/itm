import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { db, firebaseApi } from '../../../lib/firebase';
import { Button, Spinner, makeStyles, tokens } from '@fluentui/react-components'; // KROK 5: Zmiana importów
import { Add24Regular } from '@fluentui/react-icons';
import LegoSetModal from '../modals/LegoSetModal';
// KROK 5: Import nowej karty i MessageBoxa
import CondensedGridCard from '../../../components/views/CondensedGridCard';
import MessageBox from '../../../components/MessageBox';

// KROK 5: Dodajemy prosty useStyles, jeśli go nie było
const useStyles = makeStyles({
    toolbar: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: tokens.spacingVerticalL,
    },
});

export default function SetsView() {
    const styles = useStyles(); // KROK 5: Używamy stylów
    const [allSets, setAllSets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSet, setSelectedSet] = useState(null);

    // KROK 5: Stany dla dialogu usuwania
    const [isMessageBoxOpen, setIsMessageBoxOpen] = useState(false);
    const [setToDelete, setSetToDelete] = useState(null);

    useEffect(() => {
        const setsCollectionRef = db.collection(firebaseApi._getFullPath('legoSets'));
        const unsubscribe = setsCollectionRef.orderBy('name', 'asc').onSnapshot((snapshot) => {
            const setsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllSets(setsData);
            setIsLoading(false);
        }, (error) => {
            console.error("Błąd pobierania zestawów LEGO:", error);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleEdit = (set) => {
        setSelectedSet(set);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setSelectedSet(null);
        setIsModalOpen(true);
    };

    // KROK 5: Funkcje do obsługi usuwania
    const handleOpenDeleteDialog = (set) => {
        setSetToDelete(set);
        setIsMessageBoxOpen(true);
    };

    const confirmDelete = async () => {
        if (setToDelete) {
            try {
                await firebaseApi.deleteDocument('legoSets', setToDelete.id);
                console.log("Usunięto zestaw LEGO:", setToDelete.id);
            } catch (error) {
                console.error("Błąd podczas usuwania zestawu LEGO:", error);
            }
        }
        setIsMessageBoxOpen(false);
        setSetToDelete(null);
    };

    if (isLoading) {
        // KROK 5: Użycie oficjalnego komponentu Spinner
        return <Spinner label="Ładowanie bazy zestawów LEGO..." />;
    }

    return (
        <div>
            {isModalOpen && (
                <LegoSetModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    initialData={selectedSet}
                />
            )}

            {/* KROK 5: Dodanie globalnego MessageBoxa */}
            <MessageBox
                open={isMessageBoxOpen}
                title="Potwierdź usunięcie"
                content={`Czy na pewno chcesz usunąć zestaw "${setToDelete?.name || ''}"? Tej operacji nie można cofnąć.`}
                onConfirm={confirmDelete}
                onCancel={() => setIsMessageBoxOpen(false)}
            />

            <div className={styles.toolbar}>
                <Button icon={<Add24Regular />} appearance="primary" onClick={handleAddNew}>
                    Dodaj nowy zestaw
                </Button>
            </div>

            {/* KROK 5: Zmiana siatki na 4 kolumny i użycie CondensedGridCard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {allSets.map((set) => (
                    <CondensedGridCard
                        key={set.id}
                        title={set.name}
                        imageUrl={set.imageUrl} // Zakładam, że pole nazywa się imageUrl
                        onEditClick={() => handleEdit(set)}
                        onDeleteClick={() => handleOpenDeleteDialog(set)}
                    />
                ))}
            </div>
             {allSets.length === 0 && <p className="text-center p-8 text-neutral-foreground-2">Brak dodanych zestawów LEGO.</p>}
        </div>
    );
}
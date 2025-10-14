import React, { useState, useEffect } from 'react';
import { db, firebaseApi } from '../../../lib/firebase'; // <--- DODAJ IMPORT 'db'
import { Button } from "@fluentui/react-components";
import { Add24Regular } from "@fluentui/react-icons";
import LoadingSpinner from '../../../components/LoadingSpinner';
import LegoSetModal from '../modals/LegoSetModal';

export default function SetsView() {
    const [allSets, setAllSets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSet, setSelectedSet] = useState(null);

    useEffect(() => {
        const setsCollectionRef = db.collection(firebaseApi._getFullPath('legoSets'));
        const unsubscribe = setsCollectionRef.onSnapshot((snapshot) => {
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

    if (isLoading) {
        return <LoadingSpinner />;
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
            <div className="flex justify-end mb-4">
                <Button icon={<Add24Regular />} appearance="primary" onClick={handleAddNew}>
                    Dodaj nowy zestaw
                </Button>
            </div>
            <div className="overflow-x-auto bg-neutral-background-1 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-neutral-stroke-2">
                    <thead className="bg-neutral-background-2">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Nazwa</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Numer / Seria</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Właściciel</th>
                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Akcje</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-stroke-1">
                        {allSets.map((set) => (
                            <tr key={set.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-semibold">{set.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{set.number} / {set.series}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{set.owner}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <Button appearance="subtle" onClick={() => handleEdit(set)}>
                                        Edytuj
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {allSets.length === 0 && <p className="text-center p-8 text-neutral-foreground-2">Brak dodanych zestawów LEGO.</p>}
            </div>
        </div>
    );
}
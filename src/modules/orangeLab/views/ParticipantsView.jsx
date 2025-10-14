import React, { useState, useEffect } from 'react';
import { db, firebaseApi } from '../../../lib/firebase'; // <--- Poprawiony import
import { Button } from "@fluentui/react-components";
import { Add24Regular } from "@fluentui/react-icons";
import LoadingSpinner from '../../../components/LoadingSpinner';
import ParticipantModal from '../modals/ParticipantModal';

export default function ParticipantsView() {
    const [allParticipants, setAllParticipants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState(null);

    useEffect(() => {
        // Poprawiona składnia
        const participantsCollectionRef = db.collection(firebaseApi._getFullPath('participants'));
        const unsubscribe = participantsCollectionRef.onSnapshot((snapshot) => {
            const participantsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllParticipants(participantsData);
            setIsLoading(false);
        }, (error) => {
            console.error("Błąd pobierania uczestników:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleEdit = (participant) => {
        setSelectedParticipant(participant);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setSelectedParticipant(null);
        setIsModalOpen(true);
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div>
            {isModalOpen && (
                <ParticipantModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    initialData={selectedParticipant}
                />
            )}
            <div className="flex justify-end mb-4">
                <Button icon={<Add24Regular />} appearance="primary" onClick={handleAddNew}>
                    Dodaj uczestnika
                </Button>
            </div>

            <div className="overflow-x-auto bg-neutral-background-1 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-neutral-stroke-2">
                    <thead className="bg-neutral-background-2">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Imię i Nazwisko</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Grupa</th>
                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Akcje</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-stroke-1">
                        {allParticipants.map((person) => (
                            <tr key={person.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-semibold">{person.firstName} {person.lastName}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{person.group}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <Button appearance="subtle" onClick={() => handleEdit(person)}>
                                        Edytuj
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {allParticipants.length === 0 && <p className="text-center p-8 text-neutral-foreground-2">Brak dodanych uczestników.</p>}
            </div>
        </div>
    );
}
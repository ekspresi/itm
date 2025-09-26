import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { SHARED_STYLES } from '../../lib/helpers';
import { firebaseApi } from '../../lib/firebase';

export default function VisitManageDayModal({ isOpen, onClose, selectedDate, allIndicators, onEditGroup, onDeleteGroup }) {
    const [isLoading, setIsLoading] = useState(true);
    const [visitGroups, setVisitGroups] = useState([]);

    const fetchData = useCallback(async () => {
        if (isOpen) {
            setIsLoading(true);
            try {
                const groups = await firebaseApi.fetchCollection('visits', {
                    filter: { field: 'date', operator: '==', value: selectedDate }
                });
                setVisitGroups(groups.sort((a,b) => b.timestamp.toMillis() - a.timestamp.toMillis()));
            } catch (error) {
                console.error("Błąd wczytywania grup:", error);
                alert("Nie udało się wczytać wpisów z tego dnia.");
            } finally {
                setIsLoading(false);
            }
        }
    }, [isOpen, selectedDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDelete = async (groupId) => {
        if (window.confirm("Czy na pewno chcesz usunąć tę grupę? Operacja jest nieodwracalna.")) {
            await onDeleteGroup(groupId);
            fetchData(); // Odśwież listę po usunięciu
        }
    };
    
    const indicatorsBySlug = useMemo(() => new Map(allIndicators.map(i => [i.slug, i])), [allIndicators]);
    const actionButton = "bg-white hover:bg-gray-100 text-gray-600 w-8 h-8 rounded-lg border shadow-sm flex items-center justify-center transition-colors";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Zarządzaj wpisami z dnia: ${selectedDate}`} footer={<button onClick={onClose} className={SHARED_STYLES.buttons.secondary}>Zamknij</button>} maxWidth="max-w-4xl">
            {isLoading ? <LoadingSpinner /> : (
                <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-3">
                    {visitGroups.length === 0 ? (
                        <p className="text-center text-gray-500 py-16">Brak zarejestrowanych grup w tym dniu.</p>
                    ) : (
                        visitGroups.map(group => {
                            const languageName = indicatorsBySlug.get(group.language)?.name || group.language;
                            const purposeNames = (group.purposes || []).map(slug => indicatorsBySlug.get(slug)?.name || slug).join(', ');

                            return (
                                <div key={group.id} className="bg-gray-50 hover:bg-gray-100 p-3 rounded-lg shadow-sm border flex items-center justify-between">
                                    <div className="flex-grow">
                                        <p className="font-bold">
                                            Grupa: <span className="text-blue-700">{group.tourists?.length || 0} os.</span>
                                            <span className="text-gray-500 font-normal text-xs ml-2">
                                                (godz. {group.timestamp?.toDate().toLocaleTimeString('pl-PL') || 'Brak'})
                                            </span>
                                        </p>
                                        <p className="text-sm"><span className="font-semibold">Język:</span> {languageName}</p>
                                        <p className="text-sm"><span className="font-semibold">Cele:</span> {purposeNames}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                        <button onClick={() => onEditGroup(group)} className={actionButton} title="Edytuj">
                                            <i className="fa-solid fa-pencil text-xs"></i>
                                        </button>
                                        <button onClick={() => handleDelete(group.id)} className={`${actionButton} hover:bg-red-50 hover:text-red-600`} title="Usuń">
                                            <i className="fa-solid fa-trash-can text-xs"></i>
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </Modal>
    );
}
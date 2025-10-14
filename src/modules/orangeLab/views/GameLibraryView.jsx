import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db, firebaseApi } from '../../../lib/firebase';
import {
    Button, Card, makeStyles, tokens,
    Menu, MenuTrigger, MenuPopover, MenuList, MenuItem,
    Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, Body1,
    Tooltip,
    TagPicker, TagPickerControl, TagPickerGroup, Tag, TagPickerInput, TagPickerList, TagPickerOption
} from "@fluentui/react-components";
import {
    Add24Regular, MoreHorizontal24Regular
} from "@fluentui/react-icons";
import LoadingSpinner from '../../../components/LoadingSpinner';
import GameModal from '../modals/GameModal';

const useStyles = makeStyles({
    cardContent: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: tokens.spacingVerticalS,
        justifyContent: 'space-between',
    },
    imageContainer: {
        width: '100%',
        aspectRatio: '1 / 1',
        marginBottom: tokens.spacingVerticalM,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tokens.colorNeutralBackground2,
        borderRadius: tokens.borderRadiusMedium,
        overflow: 'hidden',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    overlayContainer: {
        position: 'absolute',
        top: tokens.spacingVerticalS,
        left: tokens.spacingHorizontalS,
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalXS,
    },
    overlayBox: {
        backgroundColor: tokens.colorNeutralBackground1,
        color: tokens.colorNeutralForeground2,
        borderRadius: tokens.borderRadiusSmall,
        padding: '4px',
        width: '28px',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: tokens.shadow8,
    },
    smallIcon: {
        fontSize: '16px',
        display: 'flex',
        alignItems: 'center',
    },
    title: {
        fontSize: tokens.fontSizeBase200,
        fontWeight: tokens.fontWeightSemibold,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textAlign: 'center',
        display: 'block',
        marginBottom: tokens.spacingVerticalXS,
    },
    genreText: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorBrandForeground1,
        fontStyle: 'italic',
        textAlign: 'center',
        overflow: 'hidden',
        height: '36px',
        marginBottom: tokens.spacingVerticalL,
    },
    menuContainer: {
        display: 'flex',
        justifyContent: 'center',
    },
    toolbar: {
        display: 'flex',
        gap: tokens.spacingHorizontalL,
        marginBottom: tokens.spacingVerticalL,
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    filters: {
        display: 'flex',
        gap: tokens.spacingHorizontalL,
        flexGrow: 1,
        flexWrap: 'wrap',
    },
    tagPicker: {
        minWidth: '200px',
        flexGrow: 1,
    },
    optionWithIcon: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
    }
});

const getAccountTypeIcon = (accountType) => {
    if (!accountType) return null;
    let iconClass = 'fas fa-question-circle';
    const type = accountType.toLowerCase();

    if (type.includes('steam')) iconClass = 'fab fa-steam';
    else if (type.includes('xbox')) iconClass = 'fab fa-xbox';
    else if (type.includes('playstation')) iconClass = 'fab fa-playstation';
    else if (type.includes('epic')) iconClass = 'fa-solid fa-gamepad';
    else if (type.includes('ubisoft')) iconClass = 'fa-solid fa-gamepad';

    return <i className={`${iconClass} text-base w-5 text-center`}></i>;
};

// NOWA FUNKCJA POMOCNICZA
const shortenEmail = (email) => {
    if (!email) return '';
    return email.split('@')[0];
};

const GameCard = ({ game, allAccounts, onEdit, onDelete }) => {
    const styles = useStyles();
    const titleRef = useRef(null);
    const [isTitleOverflowing, setIsTitleOverflowing] = useState(false);

    useEffect(() => {
        if (titleRef.current && titleRef.current.scrollWidth > titleRef.current.clientWidth) {
            setIsTitleOverflowing(true);
        } else {
            setIsTitleOverflowing(false);
        }
    }, [game.name]);

    const accountIcons = useMemo(() => {
        if (!game.assignments || game.assignments.length === 0) return [];
        const assignmentsWithInfo = game.assignments
            .map(assign => {
                const account = allAccounts.find(acc => acc.id === assign.accountId);
                return account ? { ...assign, ...account } : null;
            })
            .filter(Boolean);

        const uniqueTypes = [...new Set(assignmentsWithInfo.map(a => a.accountType))];

        return uniqueTypes.map(type => {
            const accountsOfType = assignmentsWithInfo.filter(a => a.accountType === type);
            const tooltipContent = accountsOfType.map(a => `${a.email || a.nickname} (${a.status})`).join(', ');
            return { type, icon: getAccountTypeIcon(type), tooltip: tooltipContent };
        });
    }, [game.assignments, allAccounts]);

    const imageTooltipContent = [
        game.playerCount ? `Gra dla ${game.playerCount} graczy` : '',
        game.supportsSteeringWheel ? 'Obsługuje kierownicę' : ''
    ].filter(Boolean).join(', ');

    return (
        <Card>
            <div className={styles.cardContent}>
                <div>
                    <Tooltip content={imageTooltipContent} relationship="label" disabled={!imageTooltipContent}>
                        <div className={styles.imageContainer}>
                            <img
                                src={game.imageUrl || 'https://placehold.co/200x200/cccccc/333333?text=?'}
                                alt={game.name}
                                className={styles.image}
                            />
                            <div className={styles.overlayContainer}>
                                {accountIcons.map(item => (
                                    <Tooltip key={item.type} content={item.tooltip} relationship="label">
                                        <div className={styles.overlayBox}>
                                            <span className={styles.smallIcon}>{item.icon}</span>
                                        </div>
                                    </Tooltip>
                                ))}
                            </div>
                        </div>
                    </Tooltip>
                    <Tooltip content={game.name} relationship="label" disabled={!isTitleOverflowing}>
                        <h3 ref={titleRef} className={styles.title}>{game.name}</h3>
                    </Tooltip>
                    {game.genres && game.genres.length > 0 && (
                        <p className={styles.genreText}>{game.genres.join(', ')}</p>
                    )}
                </div>

                <div className={styles.menuContainer}>
                    <Menu>
                        <MenuTrigger disableButtonEnhancement>
                            <Button appearance="subtle" size="small" icon={<MoreHorizontal24Regular />} />
                        </MenuTrigger>
                        <MenuPopover>
                            <MenuList>
                                <MenuItem onClick={() => onEdit(game)}>Edytuj</MenuItem>
                                <MenuItem onClick={() => onDelete(game.id)}>Usuń</MenuItem>
                            </MenuList>
                        </MenuPopover>
                    </Menu>
                </div>
            </div>
        </Card>
    );
};

export default function GameLibraryView() {
    const styles = useStyles();
    const [allGames, setAllGames] = useState([]);
    const [allAccounts, setAllAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGame, setSelectedGame] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [gameToDelete, setGameToDelete] = useState(null);
    const [selectedAccounts, setSelectedAccounts] = useState([]);

    useEffect(() => {
        const gamesCollectionRef = db.collection(firebaseApi._getFullPath('gameLibrary'));
        const accountsCollectionRef = db.collection(firebaseApi._getFullPath('accounts'));

        const unsubGames = gamesCollectionRef.onSnapshot((snapshot) => {
            const gamesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            gamesData.sort((a, b) => a.name.localeCompare(b.name, 'pl', { sensitivity: 'base' }));
            setAllGames(gamesData);
            setIsLoading(false);
        });

        const unsubAccounts = accountsCollectionRef.onSnapshot((snapshot) => {
            setAllAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubGames();
            unsubAccounts();
        };
    }, []);
    
    const filteredGames = useMemo(() => {
        if (selectedAccounts.length === 0) {
            return allGames;
        }
        return allGames.filter(game => 
            game.assignments && game.assignments.some(assign => selectedAccounts.includes(assign.accountId))
        );
    }, [allGames, selectedAccounts]);

    const handleEdit = (game) => {
        setSelectedGame(game);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setSelectedGame(null);
        setIsModalOpen(true);
    };

    const confirmDelete = (gameId) => {
        setGameToDelete(gameId);
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (gameToDelete) {
            try {
                await db.collection(firebaseApi._getFullPath('gameLibrary')).doc(gameToDelete).delete();
            } catch (error) {
                console.error("Błąd podczas usuwania gry:", error);
            }
        }
        setIsConfirmOpen(false);
        setGameToDelete(null);
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div>
            {isModalOpen && (
                <GameModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    initialData={selectedGame}
                    allGames={allGames}
                    allAccounts={allAccounts}
                />
            )}

            <Dialog open={isConfirmOpen} onOpenChange={(_, data) => !data.open && setIsConfirmOpen(false)}>
                <DialogSurface>
                    <DialogBody>
                        <DialogTitle>Potwierdź usunięcie</DialogTitle>
                        <p>Czy na pewno chcesz trwale usunąć tę grę z biblioteki? Tej operacji nie można cofnąć.</p>
                    </DialogBody>
                    <DialogActions>
                        <Button appearance="secondary" onClick={() => setIsConfirmOpen(false)}>Anuluj</Button>
                        <Button appearance="primary" onClick={handleDelete}>Usuń</Button>
                    </DialogActions>
                </DialogSurface>
            </Dialog>

            <div className={styles.toolbar}>
                <div className={styles.filters}>
                    <TagPicker 
                        onOptionSelect={(_, data) => setSelectedAccounts(data.selectedOptions)} 
                        selectedOptions={selectedAccounts}
                        className={styles.tagPicker}
                    >
                        <TagPickerControl>
                            <TagPickerGroup>
                                {selectedAccounts.map(accountId => {
                                    const account = allAccounts.find(a => a.id === accountId);
                                    return (
                                        <Tag key={accountId} value={accountId} media={getAccountTypeIcon(account?.accountType)}>
                                            {/* ZMIANA TUTAJ */}
                                            {shortenEmail(account?.email) || accountId}
                                        </Tag>
                                    );
                                })}
                            </TagPickerGroup>
                            <TagPickerInput placeholder="Filtruj po koncie..." />
                        </TagPickerControl>
                        <TagPickerList>
                            {allAccounts
                                .filter(acc => !selectedAccounts.includes(acc.id))
                                .map(acc => (
                                    <TagPickerOption 
                                        value={acc.id} 
                                        key={acc.id} 
                                        media={getAccountTypeIcon(acc.accountType)}
                                    >
                                        {/* ZMIANA TUTAJ */}
                                        {shortenEmail(acc.email)}
                                    </TagPickerOption>
                                ))}
                        </TagPickerList>
                    </TagPicker>
                </div>
                <Button icon={<Add24Regular />} appearance="primary" onClick={handleAddNew}>
                    Dodaj nową grę do biblioteki
                </Button>
            </div>


            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                {filteredGames.map((game) => (
                    <GameCard
                        key={game.id}
                        game={game}
                        allAccounts={allAccounts}
                        onEdit={handleEdit}
                        onDelete={confirmDelete}
                    />
                ))}
            </div>
             {filteredGames.length === 0 && <p className="text-center p-8 text-neutral-foreground-2">Brak gier spełniających wybrane kryteria.</p>}
        </div>
    );
}
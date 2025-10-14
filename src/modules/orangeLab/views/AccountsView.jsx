import React, { useState, useEffect } from 'react';
import { db, firebaseApi } from '../../../lib/firebase';
import { 
    Button, Card, makeStyles, tokens,
    Menu, MenuTrigger, MenuPopover, MenuList, MenuItem,
    Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, Body1
} from "@fluentui/react-components";
import { Add24Regular, MoreHorizontal24Regular } from "@fluentui/react-icons";
import LoadingSpinner from '../../../components/LoadingSpinner';
import AccountModal from '../modals/AccountModal';

const useStyles = makeStyles({
    card: {
        width: '100%',
        marginBottom: tokens.spacingVerticalS,
        padding: '0 !important',
    },
    rowGrid: {
        display: 'grid',
        gridTemplateColumns: '1.5fr 2fr 1fr 1.5fr 1.5fr auto',
        gap: tokens.spacingHorizontalL,
        alignItems: 'center',
        padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    },
    column: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
    },
    headerColumn: {
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorNeutralForeground2,
        fontSize: tokens.fontSizeBase200,
    }
});

const getAccountTypeIcon = (accountType) => {
    let iconClass = 'fas fa-question-circle';
    const type = accountType.toLowerCase();

    if (type.includes('steam')) iconClass = 'fab fa-steam';
    else if (type.includes('xbox')) iconClass = 'fab fa-xbox';
    else if (type.includes('playstation')) iconClass = 'fab fa-playstation';
    else if (type.includes('epic')) iconClass = 'fa-solid fa-gamepad';
    else if (type.includes('ubisoft')) iconClass = 'fa-solid fa-gamepad';

    return <i className={`${iconClass} text-base w-5 text-center`}></i>;
};

export default function AccountsView() {
    const styles = useStyles();
    const [allAccounts, setAllAccounts] = useState([]);
    const [allEquipment, setAllEquipment] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState(null);

    useEffect(() => {
        const unsubAccounts = db.collection(firebaseApi._getFullPath('accounts')).orderBy('accountType').onSnapshot(snapshot => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllAccounts(data);
            setIsLoading(false);
        });

        const unsubEquipment = db.collection(firebaseApi._getFullPath('gamingEquipment')).onSnapshot(snapshot => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllEquipment(data);
        });

        return () => {
            unsubAccounts();
            unsubEquipment();
        };
    }, []);
    
    const handleEdit = (account) => {
        setSelectedAccount(account);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setSelectedAccount(null);
        setIsModalOpen(true);
    };

    const confirmDelete = (accountId) => {
        setAccountToDelete(accountId);
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (accountToDelete) {
            await db.collection(firebaseApi._getFullPath('accounts')).doc(accountToDelete).delete();
        }
        setIsConfirmOpen(false);
        setAccountToDelete(null);
    };

    const getEquipmentName = (id) => {
        const eq = allEquipment.find(eq => eq.id === id);
        if (!eq) return '-';
        return `${eq.name}${eq.number ? ` #${eq.number}` : ''}`;
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div>
            {isModalOpen && <AccountModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialData={selectedAccount} allEquipment={allEquipment} />}
            <Dialog open={isConfirmOpen} onOpenChange={(_, data) => !data.open && setIsConfirmOpen(false)}>
                <DialogSurface>
                    <DialogBody>
                        <DialogTitle>Potwierdź usunięcie</DialogTitle>
                        <Body1>Czy na pewno chcesz usunąć to konto?</Body1>
                    </DialogBody>
                    <DialogActions>
                        <Button appearance="secondary" onClick={() => setIsConfirmOpen(false)}>Anuluj</Button>
                        <Button appearance="primary" onClick={handleDelete}>Usuń</Button>
                    </DialogActions>
                </DialogSurface>
            </Dialog>

            <div className="flex justify-end mb-4">
                <Button icon={<Add24Regular />} appearance="primary" onClick={handleAddNew}>
                    Dodaj konto
                </Button>
            </div>

            {/* Nagłówek tabeli */}
            <div className={`${styles.rowGrid} mb-2`}>
                <div className={`${styles.column} ${styles.headerColumn}`}>Typ konta</div>
                <div className={`${styles.column} ${styles.headerColumn}`}>Adres e-mail</div>
                <div className={`${styles.column} ${styles.headerColumn}`}>Nick</div>
                <div className={`${styles.column} ${styles.headerColumn}`}>Przypisany sprzęt</div>
                <div className={`${styles.column} ${styles.headerColumn}`}>Subskrypcja</div>
                {/* ZMIANA: Dodajemy nieaktywny, przezroczysty przycisk jako atrapę szóstej kolumny */}
                <div>
                    <Button appearance="transparent" icon={<MoreHorizontal24Regular />} disabled />
                </div>
            </div>

            {/* Lista kont */}
            {allAccounts.map(account => (
                <Card key={account.id} className={styles.card}>
                    <div className={styles.rowGrid}>
                        <div className={styles.column}>
                            {getAccountTypeIcon(account.accountType)}
                            <span>{account.accountType}</span>
                        </div>
                        <div className={styles.column}>{account.email}</div>
                        <div className={styles.column}>{account.nickname || '-'}</div>
                        <div className={styles.column}>{getEquipmentName(account.assignedEquipmentId)}</div>
                        <div className={styles.column}>
                            {account.hasSubscription ? (account.subscriptionEndDate || 'Aktywna') : 'Nie'}
                        </div>
                        <div>
                             <Menu>
                                <MenuTrigger disableButtonEnhancement>
                                    <Button appearance="transparent" icon={<MoreHorizontal24Regular />} />
                                </MenuTrigger>
                                <MenuPopover>
                                    <MenuList>
                                        <MenuItem onClick={() => handleEdit(account)}>Edytuj</MenuItem>
                                        <MenuItem onClick={() => confirmDelete(account.id)}>Usuń</MenuItem>
                                    </MenuList>
                                </MenuPopover>
                            </Menu>
                        </div>
                    </div>
                </Card>
            ))}
            {allAccounts.length === 0 && <p className="text-center p-8 text-neutral-foreground-2">Brak dodanych kont.</p>}
        </div>
    );
}
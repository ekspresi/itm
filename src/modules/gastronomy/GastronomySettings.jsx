import React, { useState, useEffect } from 'react';
import {
    Tab,
    TabList,
    Input,
    Button,
    makeStyles,
    tokens,
    Card,
    CardHeader,
    Text,
    Body1
} from '@fluentui/react-components';
import { Delete24Regular } from '@fluentui/react-icons';
import { firebaseApi } from '../../lib/firebase';
import LoadingSpinner from '../../components/LoadingSpinner';
import MessageBox from '../../components/MessageBox';


const useStyles = makeStyles({
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalL,
    },
    addForm: {
        display: 'flex',
        gap: tokens.spacingHorizontalS,
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalS,
        maxHeight: '50vh',
        overflowY: 'auto',
    },
    listItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
        backgroundColor: tokens.colorNeutralBackground1,
        borderRadius: tokens.borderRadiusMedium,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
    }
});

export default function GastronomySettings() {
    const styles = useStyles();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: 'info' });
    const [config, setConfig] = useState({ categories: [], cuisines: [] });
    const [activeTab, setActiveTab] = useState('categories');
    const [newItemName, setNewItemName] = useState('');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const configData = await firebaseApi.fetchDocument('gastronomy_config', '--main--');
            if (configData) setConfig(configData);
        } catch (error) {
            setMessage({ text: "Nie udało się wczytać konfiguracji.", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const generateSlug = (name) => name.toString().toLowerCase().trim().replace(/[\s\W_]+/g, '-');

    const handleAddItem = () => {
        const trimmedName = newItemName.trim();
        if (!trimmedName) return;
        const newItem = { id: generateSlug(trimmedName), name: trimmedName };
        const updatedList = [...(config[activeTab] || []), newItem];
        setConfig(prev => ({ ...prev, [activeTab]: updatedList }));
        setNewItemName('');
    };

    const handleDeleteItem = (id) => {
        if (window.confirm('Na pewno usunąć?')) {
            const updatedList = config[activeTab].filter(item => item.id !== id);
            setConfig(prev => ({ ...prev, [activeTab]: updatedList }));
        }
    };

    const handleSaveConfig = async () => {
        setIsLoading(true);
        try {
            await firebaseApi.saveDocument('gastronomy_config', { ...config, id: '--main--' });
            setMessage({ text: 'Ustawienia zapisane.', type: 'success' });
        } catch (e) {
            setMessage({ text: 'Błąd zapisu ustawień.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
             <MessageBox message={message.text} type={message.type} onDismiss={() => setMessage({ text: '', type: 'info' })} />
            {isLoading && <LoadingSpinner />}
            <Card>
                <CardHeader
                    header={<Text weight="semibold">Zarządzaj taksonomią</Text>}
                    description={<Body1>Dodawaj i usuwaj kategorie oraz rodzaje kuchni, aby lepiej klasyfikować obiekty gastronomiczne.</Body1>}
                />
                 <TabList selectedValue={activeTab} onTabSelect={(_, data) => setActiveTab(data.value)}>
                    <Tab value="categories">Kategorie</Tab>
                    <Tab value="cuisines">Kuchnie</Tab>
                </TabList>
                <div className="p-4 space-y-4">
                     <div className={styles.addForm}>
                        <Input
                            placeholder="Nazwa nowego elementu..."
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                            className="w-full"
                        />
                        <Button appearance="primary" onClick={handleAddItem}>Dodaj</Button>
                    </div>

                    <div className={styles.list}>
                        {(config[activeTab] || []).map(item => (
                            <div key={item.id} className={styles.listItem}>
                                <Text>{item.name}</Text>
                                <Button
                                    icon={<Delete24Regular />}
                                    appearance="subtle"
                                    onClick={() => handleDeleteItem(item.id)}
                                />
                            </div>
                        ))}
                    </div>
                     <div className="flex justify-end">
                         <Button appearance='primary' onClick={handleSaveConfig} disabled={isLoading}>
                            {isLoading ? 'Zapisywanie...' : 'Zapisz zmiany'}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
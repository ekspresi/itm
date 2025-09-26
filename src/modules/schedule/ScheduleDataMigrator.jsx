import React, { useState } from 'react';
import { Button, Text, makeStyles, tokens } from '@fluentui/react-components';
import { db, appId } from '../../lib/firebase'; // Importujemy też appId

const useStyles = makeStyles({
    container: {
        padding: tokens.spacingVerticalXXL,
        backgroundColor: tokens.colorNeutralBackground1,
        borderRadius: tokens.borderRadiusLarge,
        boxShadow: tokens.shadow8,
        maxWidth: '600px',
        margin: 'auto',
        textAlign: 'center',
        borderTop: `4px solid ${tokens.colorPaletteRedBorder2}`,
    },
    message: {
        marginTop: tokens.spacingVerticalL,
        padding: tokens.spacingVerticalM,
        backgroundColor: tokens.colorNeutralBackground2,
        borderRadius: tokens.borderRadiusMedium,
        fontWeight: tokens.fontWeightSemibold,
    }
});

export default function ScheduleDataMigrator() {
    const styles = useStyles();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleMigration = async () => {
        if (!window.confirm("Czy na pewno chcesz rozpocząć migrację danych modułu Harmonogramu?")) return;

        setIsLoading(true);
        setMessage('Rozpoczynam migrację...');

        try {
            // POPRAWKA: Definiujemy prawidłowe ścieżki
            const oldBasePath = `/artifacts/${appId}/public/data`;
            const collectionsToMigrate = {
                'ck_rooms': 'schedule_module/--data--/rooms',
                'ck_classes': 'schedule_module/--data--/classes',
                'ck_events': 'schedule_module/--data--/events',
                'ck_class_cancellations': 'schedule_module/--data--/cancellations',
                'ck_config': 'schedule_module/--data--/config',
            };

            let totalDocs = 0;
            for (const [oldName, newPath] of Object.entries(collectionsToMigrate)) {
                setMessage(`Migruję kolekcję: ${oldName}...`);
                // POPRAWKA: Używamy pełnej ścieżki do starej kolekcji
                const oldCollectionPath = `${oldBasePath}/${oldName}`;
                const oldCollectionSnapshot = await db.collection(oldCollectionPath).get();

                if (oldCollectionSnapshot.empty) {
                    console.warn(`Kolekcja źródłowa ${oldCollectionPath} jest pusta lub nie istnieje. Pomijam.`);
                    continue;
                }

                const batch = db.batch();
                oldCollectionSnapshot.forEach(doc => {
                    const newDocRef = db.collection(newPath).doc(doc.id);
                    batch.set(newDocRef, doc.data());
                });
                await batch.commit();
                totalDocs += oldCollectionSnapshot.size;
            }

            if (totalDocs > 0) {
                 setMessage(`✅ SUKCES! Migracja zakończona. Przeniesiono ${totalDocs} dokumentów. Możesz teraz przywrócić oryginalny kod ScheduleModule.jsx i odświeżyć stronę (Ctrl+Shift+R).`);
            } else {
                 setMessage(`⚠️ UWAGA: Migracja zakończona, ale nie znaleziono żadnych dokumentów w kolekcjach źródłowych. Upewnij się, że dane istnieją w Firebase pod ścieżką /artifacts/${appId}/public/data/`);
            }

        } catch (error) {
            setMessage(`BŁĄD: ${error.message}`);
            console.error("Błąd migracji:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <Text as="h2" size={600} weight="semibold">Narzędzie do Migracji Danych Harmonogramu</Text>
            <Text as="p" block className="mt-2">
                Użyj tego narzędzia, aby przenieść dane z głównych kolekcji (`ck_...`) do nowej, zagnieżdżonej lokalizacji.
            </Text>
            <Button 
                appearance="primary" 
                size="large" 
                onClick={handleMigration} 
                disabled={isLoading} 
                className="mt-4"
            >
                {isLoading ? 'Trwa migracja...' : 'Rozpocznij migrację'}
            </Button>
            {message && <p className={styles.message}>{message}</p>}
        </div>
    );
};
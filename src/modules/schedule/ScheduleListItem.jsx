import React from 'react';
import { Text, makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
    row: {
        display: 'grid',
        gridTemplateColumns: '120px 2.5fr 1.5fr 1fr', // Definiujemy 4 kolumny
        alignItems: 'center',
        gap: tokens.spacingHorizontalL,
        padding: `${tokens.spacingHorizontalS} ${tokens.spacingHorizontalL}`,
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
        backgroundColor: tokens.colorNeutralBackground1,
        transition: 'background-color 0.2s',
        ':hover': {
            backgroundColor: tokens.colorNeutralBackground1Hover,
        }
    },
    colorBar: {
        width: '4px',
        height: '24px',
        borderRadius: tokens.borderRadiusMedium,
    },
    cell: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
        minWidth: 0, // Zapobiega rozpychaniu przez długi tekst
    },
    truncate: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    time: {
        fontSize: tokens.fontSizeBase300,
        fontWeight: tokens.fontWeightSemibold,
    },
    title: {
        fontWeight: tokens.fontWeightSemibold,
    }
});

export default function ScheduleListItem({ item, roomName }) {
    const styles = useStyles();
    const itemColor = item.type === 'event' ? tokens.colorPaletteTealBorderActive : tokens.colorPaletteSkyBlueBorderActive;

    return (
        <div className={styles.row}>
            {/* Kolumna 1: Godzina */}
            <div className={`${styles.cell} ${styles.time}`}>
                <div className={styles.colorBar} style={{ backgroundColor: itemColor }} />
                {item.godzinaOd} - {item.godzinaDo}
            </div>
            {/* Kolumna 2: Nazwa zajęć */}
            <div className={`${styles.cell} ${styles.title}`}>
                <Text className={styles.truncate} title={item.nazwa}>{item.nazwa}</Text>
            </div>
            {/* Kolumna 3: Prowadzący */}
            <div className={styles.cell}>
                <Text className={styles.truncate} title={item.prowadzacy || item.organizatorInny || item.organizator}>
                    {item.prowadzacy || item.organizatorInny || item.organizator}
                </Text>
            </div>
            {/* Kolumna 4: Sala */}
            <div className={styles.cell}>
                <Text className={styles.truncate} title={roomName}>{roomName}</Text>
            </div>
        </div>
    );
}
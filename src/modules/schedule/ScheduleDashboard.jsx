import React from 'react';
import {
    makeStyles,
    tokens,
    Text,
    Button,
} from '@fluentui/react-components';
import {
    CalendarLtr24Regular,
    ConferenceRoom24Regular,
    ClipboardTextLtr24Regular,
    MegaphoneLoud24Regular,
    ChevronRight24Regular, // <-- NOWA IKONA
} from '@fluentui/react-icons';

const useStyles = makeStyles({
    listContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingHorizontalS, // Mniejszy odstęp
    },
    cardButton: {
        height: 'auto',
        maxWidth: '100%',
        width: '100%',
        // GŁÓWNA ZMIANA: Rozkładamy elementy na lewo i prawo
        justifyContent: 'space-between', 
        padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalL}`,
        border: `1px solid ${tokens.colorNeutralStroke2}`, // Bardziej subtelna ramka
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorNeutralBackground1,
    ':hover': {
        backgroundColor: tokens.colorNeutralBackground1Hover,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderBottomColor: tokens.colorNeutralStroke1, // WAŻNE: Ramka nie zmienia już koloru po najechaniu
    },
            ':active': {
            backgroundColor: tokens.colorNeutralBackground1Pressed,
            borderBottomColor: tokens.colorNeutralStroke1,
        }
    },
    contentWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalL,
        textAlign: 'left',
    },
    icon: {
        fontSize: '24px', // Standardowy rozmiar dla ikon w listach
        color: tokens.colorNeutralForeground2, // Bardziej stonowany kolor ikony
        flexShrink: 0,
    },
    textContainer: {
        display: 'flex',
        flexDirection: 'column',
    },
    title: {
        // ZMIANA: Mniejszy, bardziej odpowiedni rozmiar tytułu
        fontSize: tokens.fontSizeBase300, 
        fontWeight: tokens.fontWeightRegular,
        color: tokens.colorNeutralForeground1,
    },
    description: {
        fontSize: tokens.fontSizeBase200, // Mniejszy opis
        color: tokens.colorNeutralForeground2,
    },
    chevron: {
        color: tokens.colorNeutralForeground2,
    }
});

const DashboardButton = ({ icon, title, description, onClick }) => {
    const styles = useStyles();
    return (
        // Przycisk teraz sam w sobie jest kontenerem flex
        <Button className={styles.cardButton} onClick={onClick}>
            <div className={styles.contentWrapper}>
                <div className={styles.icon}>{icon}</div>
                <div className={styles.textContainer}>
                    <Text as="h2" block className={styles.title}>{title}</Text>
                    <Text as="p" block className={styles.description}>{description}</Text>
                </div>
            </div>
            <div className={styles.chevron}>
                <ChevronRight24Regular />
            </div>
        </Button>
    );
};

export default function ScheduleDashboard({ onNavigate, handlePrint }) {
    const styles = useStyles();
    return (
        <div className={styles.listContainer}>
            <DashboardButton 
                icon={<CalendarLtr24Regular />}
                title="Harmonogram"
                description="Przeglądaj i zarządzaj rezerwacjami sal"
                onClick={() => onNavigate('harmonogram')}
            />
            <DashboardButton 
                icon={<ConferenceRoom24Regular />}
                title="Pomieszczenia"
                description="Dodawaj i edytuj dostępne sale"
                onClick={() => onNavigate('pomieszczenia')}
            />
            <DashboardButton 
                icon={<ClipboardTextLtr24Regular />}
                title="Zajęcia"
                description="Zarządzaj cyklicznymi zajęciami i grupami"
                onClick={() => onNavigate('zajecia')}
            />
            <DashboardButton 
                icon={<MegaphoneLoud24Regular />}
                title="Wydarzenia"
                description="Dodawaj jednorazowe wydarzenia i rezerwacje"
                onClick={() => onNavigate('wydarzenia')}
            />
        </div>
    );
}
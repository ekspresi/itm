import React from 'react';
import {
    makeStyles,
    tokens,
    Text,
    Button,
} from '@fluentui/react-components';
import {
    Box24Regular,
    DocumentCheckmark24Regular,
    Location24Regular,
    ChevronRight24Regular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
    listContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingHorizontalS,
    },
    cardButton: {
        height: 'auto',
        maxWidth: '100%',
        width: '100%',
        justifyContent: 'space-between', 
        padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalL}`,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorNeutralBackground1,
        ':hover': {
            backgroundColor: tokens.colorNeutralBackground1Hover,
            border: `1px solid ${tokens.colorNeutralStroke2}`,
            borderBottomColor: tokens.colorNeutralStroke1,
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
        fontSize: '24px',
        color: tokens.colorNeutralForeground2,
        flexShrink: 0,
    },
    textContainer: {
        display: 'flex',
        flexDirection: 'column',
    },
    title: {
        fontSize: tokens.fontSizeBase300, 
        fontWeight: tokens.fontWeightRegular,
        color: tokens.colorNeutralForeground1,
    },
    description: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground2,
    },
    chevron: {
        color: tokens.colorNeutralForeground2,
    }
});

const DashboardButton = ({ icon, title, description, onClick }) => {
    const styles = useStyles();
    return (
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

export default function InventoryDashboard({ onNavigate }) {
    const styles = useStyles();
    return (
        <div className={styles.listContainer}>
            <DashboardButton 
                icon={<Box24Regular />}
                title="Baza Sprzętu"
                description="Zarządzaj centralną listą wszystkich sprzętów"
                onClick={() => onNavigate('itemsView')}
            />
            <DashboardButton 
                icon={<Location24Regular />}
                title="Lokalizacje"
                description="Zarządzaj salami i kategoriami inwentaryzacyjnymi"
                onClick={() => onNavigate('locationsView')}
            />
            <DashboardButton 
                icon={<DocumentCheckmark24Regular />}
                title="Spisy z Natury"
                description="Przeprowadzaj i przeglądaj roczne spisy inwentaryzacyjne"
                onClick={() => onNavigate('censusesView')}
            />
        </div>
    );
}
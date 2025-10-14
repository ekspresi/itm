import React from 'react';
import {
    makeStyles,
    tokens,
    Text,
    Button,
} from '@fluentui/react-components';
import {
    Food24Regular,
    FoodCake24Regular,
    DrinkCoffee24Regular,
    Settings24Regular,
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
        borderColor: tokens.colorNeutralStroke1,
    },
    ':active': {
            backgroundColor: tokens.colorNeutralBackground1Pressed,
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

export default function GastronomyDashboard({ onNavigate }) {
    const styles = useStyles();
    return (
        <div className={styles.listContainer}>
            <DashboardButton
                icon={<Food24Regular />}
                title="Restauracje i kawiarnie"
                description="Przeglądaj i zarządzaj restauracjami i kawiarniami"
                onClick={() => onNavigate('restaurants')}
            />
            <DashboardButton
                icon={<DrinkCoffee24Regular />}
                title="Piekarnie"
                description="Zarządzaj listą piekarni w okolicy"
                onClick={() => onNavigate('bakeries')}
            />
            <DashboardButton
                icon={<FoodCake24Regular />}
                title="Cukiernie i lodziarnie"
                description="Zarządzaj listą cukierni i lodziarni"
                onClick={() => onNavigate('confectioneries')}
            />
             <DashboardButton
                icon={<Settings24Regular />}
                title="Ustawienia"
                description="Zarządzaj kategoriami i rodzajami kuchni"
                onClick={() => onNavigate('settings')}
            />
        </div>
    );
}
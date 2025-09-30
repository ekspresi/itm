import React from 'react';
import {
    makeStyles,
    tokens,
    Text,
    Button,
} from '@fluentui/react-components';
import {
    CalendarMonth24Regular,
    CalendarDay24Regular,
    ChartMultiple24Regular,
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

export default function SalesDashboard({ onNavigate }) {
    const styles = useStyles();
    return (
        <div className={styles.listContainer}>
            <DashboardButton
                icon={<CalendarDay24Regular />}
                title="Podsumowanie miesięczne"
                description="Analizuj sprzedaż w wybranym miesiącu"
                onClick={() => onNavigate('monthly')}
            />
            <DashboardButton
                icon={<CalendarMonth24Regular />}
                title="Podsumowanie roczne"
                description="Zobacz roczne trendy i wyniki sprzedaży"
                onClick={() => onNavigate('annual')}
            />
            <DashboardButton
                icon={<ChartMultiple24Regular />}
                title="Porównanie"
                description="Porównuj wyniki sprzedaży między okresami"
                onClick={() => onNavigate('comparison')}
            />
        </div>
    );
}
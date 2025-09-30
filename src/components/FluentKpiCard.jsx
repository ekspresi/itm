import React from 'react';
import {
    Card,
    makeStyles,
    tokens,
    Text,
} from '@fluentui/react-components';
import {
    ArrowUp24Filled,
    ArrowDown24Filled,
    Subtract24Filled,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
    card: {
        width: '100%',
        height: '100%',
        padding: tokens.spacingVerticalL,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: tokens.fontSizeBase300,
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorNeutralForeground2,
    },
    icon: {
        color: tokens.colorNeutralForegroundDisabled,
        fontSize: '24px', // Dopasowanie rozmiaru ikony
    },
    value: {
        fontSize: tokens.fontSizeHero800,
        fontWeight: tokens.fontWeightBold,
        color: tokens.colorNeutralForeground1,
        lineHeight: '1.2',
        marginTop: tokens.spacingVerticalS,
    },
    footer: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground2,
        marginTop: tokens.spacingVerticalL,
    },
    indicatorContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalXS,
    },
});

const formatDiffValue = (num) => {
    if (typeof num !== 'number') return num;
    return num.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const ComparisonIndicator = ({ value, diff, unit = '%' }) => {
    const styles = useStyles();

    if (value === null || value === undefined || isNaN(value)) {
        return <span className={styles.footer}>Brak danych do porównania</span>;
    }

    const isPositive = value > 0;
    const isNeutral = value === 0;
    const formattedValue = isFinite(value) ? `${Math.abs(value).toFixed(1)}${unit}` : '∞';

    const color = isNeutral
        ? tokens.colorNeutralForeground2
        : isPositive
        ? tokens.colorPaletteGreenForeground3
        : tokens.colorPaletteRedForeground3;

    const Icon = isNeutral
        ? Subtract24Filled
        : isPositive
        ? ArrowUp24Filled
        : ArrowDown24Filled;

    return (
        <div className={styles.indicatorContainer} style={{ color }}>
            <Icon style={{ fontSize: '16px' }} />
            <Text weight="semibold">{formattedValue}</Text>
            {diff !== undefined && diff !== null && (
                <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                    ({diff > 0 ? '+' : ''}{formatDiffValue(diff)})
                </Text>
            )}
        </div>
    );
};

const FluentKpiCard = ({ title, value, footer, icon }) => {
    const styles = useStyles();

    return (
        <Card className={styles.card}>
            <div>
                <div className={styles.header}>
                    <Text className={styles.title}>{title}</Text>
                    {/* ZMIANA: Renderujemy ikonę jako komponent */}
                    {icon && <span className={styles.icon}>{icon}</span>}
                </div>
                <Text block className={styles.value}>{value}</Text>
            </div>
            <div className={styles.footer}>
                {footer}
            </div>
        </Card>
    );
};

export default FluentKpiCard;
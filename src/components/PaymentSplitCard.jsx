import React from 'react';
import {
    Card,
    makeStyles,
    tokens,
    Text,
    ProgressBar,
} from '@fluentui/react-components';
import { Payment24Regular } from '@fluentui/react-icons'; // <-- NOWY IMPORT
import { formatCurrency } from '../modules/sales/salesHelpers';

const useStyles = makeStyles({
    card: {
        width: '100%',
        height: '100%',
        padding: tokens.spacingVerticalL,
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: tokens.fontSizeBase300,
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorNeutralForeground2,
    },
    icon: {
        color: tokens.colorNeutralForegroundDisabled,
        fontSize: '24px',
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalS,
        marginTop: tokens.spacingVerticalL,
    },
    paymentRow: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalXXS,
    },
    paymentInfo: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    paymentLabel: {
        fontSize: tokens.fontSizeBase200,
        fontWeight: tokens.fontWeightSemibold,
    },
    paymentAmount: {
        fontSize: tokens.fontSizeBase200,
        fontWeight: tokens.fontWeightSemibold,
    },
});

const PaymentSplitCard = ({ title, data }) => {
    const styles = useStyles();
    const { cash, card, invoice } = data.paymentSplit;
    const total = cash.amount + card.amount + invoice.amount;

    const paymentMethods = [
        { label: 'Gotówka', ...cash, color: tokens.colorPaletteGreenBackground3 },
        { label: 'Terminal', ...card, color: tokens.colorBrandBackground },
        { label: 'Przelew', ...invoice, color: tokens.colorPaletteYellowBackground3 },
    ];

    return (
        <Card className={styles.card}>
            <div className={styles.header}>
                <Text className={styles.title}>{title}</Text>
                {/* ZMIANA: Użycie ikony z Fluent UI */}
                <Payment24Regular className={styles.icon} />
            </div>
            <div className={styles.content}>
                {total > 0 ? (
                    paymentMethods.map(method => (
                        <div key={method.label} className={styles.paymentRow}>
                            <div className={styles.paymentInfo}>
                                <Text className={styles.paymentLabel}>{method.label} ({method.percent}%)</Text>
                                <Text className={styles.paymentAmount}>{formatCurrency(method.amount)}</Text>
                            </div>
                            <ProgressBar
                                value={method.percent / 100}
                                thickness="large"
                                shape="rounded"
                                color={method.color}
                            />
                        </div>
                    ))
                ) : (
                    <Text align="center" style={{ color: tokens.colorNeutralForeground4, paddingTop: tokens.spacingVerticalL }}>
                        Brak danych o płatnościach.
                    </Text>
                )}
            </div>
        </Card>
    );
};

export default PaymentSplitCard;
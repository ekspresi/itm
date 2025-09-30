import React from 'react';
import { Card, Text, Button, Tooltip, makeStyles, tokens } from '@fluentui/react-components';
import { Add24Regular, Edit24Regular, Delete24Regular } from '@fluentui/react-icons';
import { formatCurrency } from './salesHelpers';

const useStyles = makeStyles({
    card: {
        width: '100%',
        padding: tokens.spacingVerticalL,
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: tokens.fontSizeBase500,
        fontWeight: tokens.fontWeightSemibold,
    },
    actions: {
        display: 'flex',
        gap: tokens.spacingHorizontalS,
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: tokens.spacingHorizontalM,
        marginTop: tokens.spacingVerticalL,
        textAlign: 'center',
    },
    gridItem: {
        backgroundColor: tokens.colorNeutralBackground2,
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
        borderRadius: tokens.borderRadiusMedium,
    },
    gridLabel: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground2,
    },
    gridValue: {
        fontSize: tokens.fontSizeBase400,
        fontWeight: tokens.fontWeightSemibold,
        marginTop: tokens.spacingVerticalXXS,
    },
    bankDepositItem: {
        backgroundColor: tokens.colorBrandBackground2,
        border: `1px solid ${tokens.colorBrandStroke1}`,
    },
    bankDepositLabel: {
        color: tokens.colorBrandForeground2,
    },
    bankDepositValue: {
        color: tokens.colorBrandForeground1,
    }
});

const SalesSettlement = ({ view, data, onEdit, onDelete }) => {
    const styles = useStyles();

    const isMonthly = view === 'monthly';
    const title = isMonthly ? 'Rozliczenie miesięczne' : 'Roczne podsumowanie rozliczeń';
    // W widoku miesięcznym 'data' to settlementData, w rocznym to całe annualData
    const settlementData = isMonthly ? data : data?.kpi?.settlementSummary;

    const dataPoints = [
        { label: 'Zakup netto', value: settlementData?.purchaseNet },
        { label: 'Marża', value: settlementData?.margin },
        { label: 'Sprzedaż netto', value: settlementData?.salesNet },
        { label: 'VAT', value: settlementData?.vat },
        { label: 'Sprzedaż brutto', value: settlementData?.salesGross },
        { label: 'Wpłata bankowa', value: settlementData?.bankDeposit, isSpecial: true },
    ];

    return (
        <Card className={styles.card}>
            <div className={styles.header}>
                <Text as="h3" className={styles.title}>{title}</Text>
                {isMonthly && (
                    <div className={styles.actions}>
                        <Tooltip content={data ? 'Edytuj rozliczenie' : 'Dodaj rozliczenie'} relationship="label">
                            <Button
                                icon={data ? <Edit24Regular /> : <Add24Regular />}
                                onClick={onEdit}
                                appearance="subtle"
                            />
                        </Tooltip>
                        <Tooltip content="Usuń rozliczenie" relationship="label">
                            <Button
                                icon={<Delete24Regular />}
                                onClick={onDelete}
                                disabled={!data}
                                appearance="subtle"
                            />
                        </Tooltip>
                    </div>
                )}
            </div>
            <div className={styles.grid}>
                {dataPoints.map(point => (
                    <div key={point.label} className={`${styles.gridItem} ${point.isSpecial ? styles.bankDepositItem : ''}`}>
                        <Text block className={`${styles.gridLabel} ${point.isSpecial ? styles.bankDepositLabel : ''}`}>{point.label}</Text>
                        <Text block className={`${styles.gridValue} ${point.isSpecial ? styles.bankDepositValue : ''}`}>{formatCurrency(point.value)}</Text>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default SalesSettlement;
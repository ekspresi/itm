import React from 'react';
import {
    Card,
    Text,
    Button,
    Tooltip,
    makeStyles,
    tokens,
    DataGridHeader,
    DataGridRow,
    DataGridHeaderCell,
    DataGrid,
    DataGridBody,
    DataGridCell,
    createTableColumn,
} from '@fluentui/react-components';
import { ChevronUp24Regular, ChevronDown24Regular, Edit24Regular, Delete24Regular } from '@fluentui/react-icons';
import { formatCurrency } from './salesHelpers';

const useStyles = makeStyles({
    card: {
        width: '100%',
        padding: `${tokens.spacingVerticalS} ${tokens.spacingVerticalL}`,
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
    },
    titleSection: {
        padding: `${tokens.spacingVerticalM} 0`,
    },
    title: {
        fontSize: tokens.fontSizeBase500,
        fontWeight: tokens.fontWeightSemibold,
    },
    description: {
        fontSize: tokens.fontSizeBase300,
        color: tokens.colorNeutralForeground2,
    },
    grid: {
        marginTop: tokens.spacingVerticalL,
    },
    actionsCell: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: tokens.spacingHorizontalS,
    },
    footerRow: {
        backgroundColor: tokens.colorNeutralBackground2,
        fontWeight: tokens.fontWeightSemibold,
    },
    numericCell: {
        textAlign: 'right',
    }
});

const SalesDetailsList = ({
    view,
    data,
    isVisible,
    onToggleVisibility,
    onEditEntry,
    onDeleteEntry
}) => {
    const styles = useStyles();
    const isMonthly = view === 'monthly';

    const title = isMonthly ? 'Dzienne raporty sprzedaży' : 'Szczegółowe podsumowanie miesięcy';
    const description = isMonthly ? 'Lista wszystkich wpisów w wybranym miesiącu.' : 'Lista wszystkich miesięcy, w których odnotowano sprzedaż.';

    const months = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];

    const items = isMonthly
        ? data.entries
        : data.monthlyBreakdown
            .map((monthData, index) => ({
                id: index,
                date: months[index],
                cashAmount: monthData.cash,
                cardAmount: monthData.card,
                invoiceAmount: monthData.invoice,
                totalAmount: monthData.total,
            }))
            .filter(item => item.totalAmount > 0);

    const footerData = data.kpi.paymentSplit;
    const totalSum = isMonthly ? data.kpi.totalSales.value : data.kpi.totalAnnualSales.value;

    const columns = [
        createTableColumn({
            columnId: 'date',
            compare: (a, b) => a.date.localeCompare(b.date),
            renderHeaderCell: () => (isMonthly ? 'Data' : 'Miesiąc'),
            renderCell: (item) => <Text weight="semibold">{item.date}</Text>,
        }),
        createTableColumn({
            columnId: 'cashAmount',
            compare: (a, b) => a.cashAmount - b.cashAmount,
            renderHeaderCell: () => <div className={styles.numericCell}>Gotówka</div>,
            renderCell: (item) => <div className={styles.numericCell}>{formatCurrency(item.cashAmount)}</div>,
        }),
        createTableColumn({
            columnId: 'cardAmount',
            compare: (a, b) => a.cardAmount - b.cardAmount,
            renderHeaderCell: () => <div className={styles.numericCell}>Terminal</div>,
            renderCell: (item) => <div className={styles.numericCell}>{formatCurrency(item.cardAmount)}</div>,
        }),
        createTableColumn({
            columnId: 'invoiceAmount',
            compare: (a, b) => a.invoiceAmount - b.invoiceAmount,
            renderHeaderCell: () => <div className={styles.numericCell}>Przelew</div>,
            renderCell: (item) => <div className={styles.numericCell}>{formatCurrency(item.invoiceAmount)}</div>,
        }),
        createTableColumn({
            columnId: 'totalAmount',
            compare: (a, b) => a.totalAmount - b.totalAmount,
            renderHeaderCell: () => <div className={styles.numericCell}>{isMonthly ? 'Suma dnia' : 'Suma miesiąca'}</div>,
            renderCell: (item) => <div className={styles.numericCell}><Text weight="semibold">{formatCurrency(item.totalAmount)}</Text></div>,
        }),
    ];

    if (isMonthly) {
        columns.push(createTableColumn({
            columnId: 'actions',
            renderHeaderCell: () => <div className={styles.numericCell}>Akcje</div>,
            renderCell: (item) => (
                <div className={styles.actionsCell}>
                    <Tooltip content="Edytuj wpis" relationship="label">
                        <Button icon={<Edit24Regular />} size="small" appearance="subtle" onClick={() => onEditEntry(item)} />
                    </Tooltip>
                    <Tooltip content="Usuń wpis" relationship="label">
                        <Button icon={<Delete24Regular />} size="small" appearance="subtle" onClick={() => onDeleteEntry(item.id, item.date)} />
                    </Tooltip>
                </div>
            ),
        }));
    }

    return (
        <Card className={styles.card}>
            <div className={styles.header} onClick={onToggleVisibility}>
                <div className={styles.titleSection}>
                    <Text as="h3" block className={styles.title}>{title}</Text>
                    <Text block className={styles.description}>{description}</Text>
                </div>
                {isMonthly && (
                    <Button
                        icon={isVisible ? <ChevronUp24Regular /> : <ChevronDown24Regular />}
                        appearance="subtle"
                        aria-label={isVisible ? 'Zwiń' : 'Rozwiń'}
                    />
                )}
            </div>

            {isVisible && (
                <div className={styles.grid}>
                    <DataGrid items={items} columns={columns} getRowId={item => item.id} sortable>
                        <DataGridHeader>
                            <DataGridRow>
                                {({ renderHeaderCell }) => (
                                    <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                                )}
                            </DataGridRow>
                        </DataGridHeader>
                        <DataGridBody>
                            {({ item, rowId }) => (
                                <DataGridRow key={rowId}>
                                    {({ renderCell }) => (
                                        <DataGridCell>{renderCell(item)}</DataGridCell>
                                    )}
                                </DataGridRow>
                            )}
                        </DataGridBody>
                    </DataGrid>
                    <DataGrid items={[{ id: 'footer' }]} columns={columns} hideHeader>
                        <DataGridBody>
                            <DataGridRow className={styles.footerRow}>
                                {({ renderCell }) => (
                                    <DataGridCell>{renderCell({
                                        date: 'RAZEM',
                                        cashAmount: footerData.cash.amount,
                                        cardAmount: footerData.card.amount,
                                        invoiceAmount: footerData.invoice.amount,
                                        totalAmount: totalSum,
                                    })}</DataGridCell>
                                )}
                            </DataGridRow>
                        </DataGridBody>
                    </DataGrid>
                </div>
            )}
        </Card>
    );
};

export default SalesDetailsList;
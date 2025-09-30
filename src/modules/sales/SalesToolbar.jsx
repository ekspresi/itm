import React from 'react';
import AppToolbar from '../../components/AppToolbar'; // <-- NOWY IMPORT
import {
    Add24Regular,
    Print24Regular,
    ArrowDownload24Regular,
} from '@fluentui/react-icons';

const SalesToolbar = ({
    activeTab,
    reportMonth,
    onMonthChange,
    reportYear,
    onYearChange,
    onAddSaleClick,
    onPrintRequest,
    handleExport,
    salesData,
    annualData
}) => {
    let dateControls = null;
    if (activeTab === 'monthly') {
        dateControls = {
            type: 'month',
            month: reportMonth,
            onMonthChange: onMonthChange,
        };
    } else if (activeTab === 'annual') {
        dateControls = {
            type: 'year',
            year: reportYear,
            onYearChange: onYearChange,
        };
    }

    const canExport = (activeTab === 'monthly' && salesData?.entries.length > 0) || (activeTab === 'annual' && annualData);
    const canPrint = (activeTab === 'monthly' && salesData) || (activeTab === 'annual' && annualData);

    const printMenuItems = activeTab === 'monthly'
        ? [
            { label: 'Drukuj podsumowanie miesiąca', onClick: () => onPrintRequest('monthly-summary') },
            { label: 'Drukuj szczegóły miesiąca', onClick: () => onPrintRequest('monthly-details') },
          ]
        : [
            { label: 'Drukuj podsumowanie roku', onClick: () => onPrintRequest('annual-summary') },
            { label: 'Drukuj szczegóły roku', onClick: () => onPrintRequest('annual-details') },
          ];

    const actionButtons = [
        [
            {
                tooltip: 'Drukuj raport',
                icon: <Print24Regular />,
                disabled: !canPrint,
                menuItems: printMenuItems,
            },
            {
                tooltip: 'Eksportuj do CSV',
                icon: <ArrowDownload24Regular />,
                onClick: handleExport,
                disabled: !canExport,
            },
        ],
    ];

    if (activeTab === 'monthly') {
        actionButtons.push([
            {
                tooltip: 'Dodaj nowy wpis sprzedaży',
                icon: <Add24Regular />,
                label: 'Sprzedaż',
                onClick: onAddSaleClick,
            },
        ]);
    }

    return <AppToolbar dateControls={dateControls} actionButtons={actionButtons} />;
};

export default SalesToolbar;
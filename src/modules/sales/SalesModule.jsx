import React, { useState, useEffect } from 'react';
import { firebaseApi } from '../../lib/firebase';
import { SHARED_STYLES, getPrintHeaderDetails } from '../../lib/helpers'; // <-- ZAKTUALIZUJ TĘ LINIĘ
import LoadingSpinner from '../../components/LoadingSpinner';
import MessageBox from '../../components/MessageBox';
import FluentKpiCard, { ComparisonIndicator } from '../../components/FluentKpiCard';
import PaymentSplitCard from '../../components/PaymentSplitCard';
import SalesToolbar from './SalesToolbar';
import SalesModal from './SalesModal';
import SettlementModal from './SettlementModal';
import SalesComparisonTab from './SalesComparisonTab';
import SalesDashboard from './SalesDashboard'; // <-- NOWY IMPORT
import SalesSettlement from './SalesSettlement';
import { SalesDailyChart, SalesAnnualChart } from './SalesCharts';
import { PrintableMonthlyReport, PrintableAnnualReport, PrintableMonthlyDetails, PrintableAnnualDetails } from './PrintableReports';
import { formatCurrency } from './salesHelpers';
import { // <-- NOWY IMPORT
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbButton,
    BreadcrumbDivider,
} from "@fluentui/react-components";
import { // <-- NOWE IMPORTY IKON
    Money24Regular,
    DataTrending24Regular,
    Trophy24Regular,
    CalendarCheckmark24Regular,
    Wallet24Regular,
} from '@fluentui/react-icons';

export default function SalesModule({ user, handlePrint }) {
    // === STANY KOMPONENTU ===
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: 'info' });
    const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
    const [salesData, setSalesData] = useState(null);
    const [settlementData, setSettlementData] = useState(null);
    const [isSaleModalOpen, setSaleModalOpen] = useState(false);
    const [isSettlementModalOpen, setSettlementModalOpen] = useState(false);
    const [editingSale, setEditingSale] = useState(null);
    const [editingSettlement, setEditingSettlement] = useState(null);
    const [activeSubPage, setActiveSubPage] = useState('dashboard'); // <-- ZMIANA Z activeTab
    const [reportYear, setReportYear] = useState(new Date().getFullYear());
    const [annualData, setAnnualData] = useState(null);
    const [defaultSaleDate, setDefaultSaleDate] = useState('');
    const [isDailyReportVisible, setIsDailyReportVisible] = useState(false);

    // ... (reszta funkcji bez zmian: findNextAvailableDate, handleFetchReport, handleFetchAnnualReport, etc.) ...
        const findNextAvailableDate = (month, existingEntries = []) => {
        const [year, monthNum] = month.split('-').map(Number);
        const daysInMonth = new Date(year, monthNum, 0).getDate();
        const existingDates = new Set(existingEntries.map(e => e.date));

        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = `${month}-${String(day).padStart(2, '0')}`;
            if (!existingDates.has(currentDate)) {
                return currentDate;
            }
        }
        
        return `${month}-01`;
    };

const handleFetchReport = async (month) => {
    setIsLoading(true);
    setSalesData(null);
    setSettlementData(null);
    setMessage({ text: '', type: 'info' });
    setIsDailyReportVisible(false);

    const year = month.substring(0, 4);
    const [monthYear, monthNum] = month.split('-');
    const startDate = `${month}-01`;
    const endDate = `${month}-${new Date(year, monthNum, 0).getDate()}`;

    const prevYear = Number(year) - 1;
    const prevMonthDate = new Date(month + '-02T12:00:00Z');
    prevMonthDate.setUTCMonth(prevMonthDate.getUTCMonth() - 1);
    const prevMonthString = prevMonthDate.toISOString().slice(0, 7);
    const [prevMonthYear, prevMonthNum] = prevMonthString.split('-');
    const prevMonthStartDate = `${prevMonthString}-01`;
    const prevMonthEndDate = `${prevMonthString}-${new Date(prevMonthYear, prevMonthNum, 0).getDate()}`;

    try {
        const [
            allSalesEntries, allSettlements, settlementDoc, previousMonthSalesEntries
        ] = await Promise.all([
            firebaseApi.fetchCollection('sales_entries', {}, true),
            firebaseApi.fetchCollection('sales_settlements', {}, true),
            firebaseApi.fetchDocument('sales_settlements', month, true),
            firebaseApi.fetchCollection('sales_entries', { filter: { field: 'date', operator: '>=', value: prevMonthStartDate } }, true)
        ]);

        const salesUntilMonthEnd = allSalesEntries.filter(e => e.date <= endDate);
        const settlementsUntilMonthEnd = allSettlements.filter(s => s.id <= month);
        const totalCumulativeCash = salesUntilMonthEnd.reduce((sum, entry) => sum + (entry.cashAmount || 0), 0);
        const totalCumulativeDeposits = settlementsUntilMonthEnd.reduce((sum, s) => sum + (s.bankDeposit || 0), 0);
        const cashBalance = totalCumulativeCash - totalCumulativeDeposits;

        const monthSalesEntries = salesUntilMonthEnd.filter(e => e.date >= startDate);
        const yearSalesEntries = salesUntilMonthEnd.filter(e => e.date.startsWith(year));

        const prevMonthFiltered = previousMonthSalesEntries.filter(e => e.date <= prevMonthEndDate);
        const totalSalesPreviousMonth = prevMonthFiltered.reduce((sum, entry) => sum + (entry.totalAmount || 0), 0);
        const numberOfDaysPreviousMonth = new Set(prevMonthFiltered.map(e => e.date)).size;
        const averageDailySalesPreviousMonth = totalSalesPreviousMonth > 0 ? totalSalesPreviousMonth / numberOfDaysPreviousMonth : 0;

        const calculatePercentageChange = (current, previous) => {
            if (previous === 0) return current > 0 ? Infinity : 0;
            return ((current - previous) / previous) * 100;
        };

        if (settlementDoc) { setSettlementData(settlementDoc); }

        const ytdCurrentYearTotal = yearSalesEntries.reduce((sum, entry) => sum + (entry.totalAmount || 0), 0);

        const prevYearEndDateYTD = `${prevYear}-${endDate.substring(5)}`;
        const prevYearSalesEntriesYTD = allSalesEntries.filter(e => e.date.startsWith(String(prevYear)) && e.date <= prevYearEndDateYTD);
        const ytdPreviousYearTotal = prevYearSalesEntriesYTD.reduce((sum, entry) => sum + (entry.totalAmount || 0), 0);

        const totalSales = monthSalesEntries.reduce((sum, entry) => sum + (entry.totalAmount || 0), 0);
        const bestDay = monthSalesEntries.reduce((max, entry) => (entry.totalAmount || 0) > (max.totalAmount || 0) ? entry : max, { totalAmount: 0 });
        const numberOfDaysWithSales = new Set(monthSalesEntries.map(e => e.date)).size;
        const averageDailySales = totalSales > 0 ? totalSales / numberOfDaysWithSales : 0;

        const totalCash = monthSalesEntries.reduce((sum, e) => sum + (e.cashAmount || 0), 0);
        const totalCard = monthSalesEntries.reduce((sum, e) => sum + (e.cardAmount || 0), 0);
        const totalInvoice = monthSalesEntries.reduce((sum, e) => sum + (e.invoiceAmount || 0), 0);
        const getPercentage = (part, total) => total > 0 ? ((part / total) * 100).toFixed(0) : 0;

        const paymentSplitData = {
            cash: { amount: totalCash, percent: getPercentage(totalCash, totalSales) },
            card: { amount: totalCard, percent: getPercentage(totalCard, totalSales) },
            invoice: { amount: totalInvoice, percent: getPercentage(totalInvoice, totalSales) },
        };
        const kpiData = {
            cashBalance,
            ytdTotalSales: { 
                value: ytdCurrentYearTotal,
                yoy: calculatePercentageChange(ytdCurrentYearTotal, ytdPreviousYearTotal),
                diff: ytdCurrentYearTotal - ytdPreviousYearTotal
            },
            totalSales: { 
                value: totalSales,
                mom: calculatePercentageChange(totalSales, totalSalesPreviousMonth),
                diff: totalSales - totalSalesPreviousMonth
            },
            averageDailySales: { 
                value: averageDailySales,
                mom: calculatePercentageChange(averageDailySales, averageDailySalesPreviousMonth),
                diff: averageDailySales - averageDailySalesPreviousMonth
            },
            bestDay: monthSalesEntries.length > 0 ? { amount: bestDay.totalAmount, date: bestDay.date } : { amount: 0, date: null },
            paymentSplit: paymentSplitData
        };

        setSalesData({
            entries: monthSalesEntries.sort((a, b) => a.date.localeCompare(b.date)),
            kpi: kpiData
        });

    } catch (error) {
        console.error("Błąd podczas pobierania danych sprzedaży:", error);
        setMessage({ text: 'Wystąpił błąd podczas pobierania danych.', type: 'error' });
    } finally {
        setIsLoading(false);
    }
};
    
const handleFetchAnnualReport = async (year) => {
    setIsLoading(true);
    setAnnualData(null);

    try {
        const [
            allSalesEntries,
            allSettlements
        ] = await Promise.all([
            firebaseApi.fetchCollection('sales_entries', {}, true),
            firebaseApi.fetchCollection('sales_settlements', {}, true)
        ]);
        
        const yearEntries = allSalesEntries.filter(e => e.date.startsWith(String(year)));
        const prevYearEntries = allSalesEntries.filter(e => e.date.startsWith(String(year - 1)));
        const yearSettlements = allSettlements.filter(s => s.id.startsWith(String(year)));

        if (yearEntries.length === 0) {
            setIsLoading(false);
            return;
        }

        const calculatePercentageChange = (current, previous) => {
            if (previous === 0) return current > 0 ? Infinity : 0;
            return ((current - previous) / previous) * 100;
        };
        
        const monthlyBreakdown = Array(12).fill(null).map(() => ({
            total: 0, cash: 0, card: 0, invoice: 0
        }));

        yearEntries.forEach(entry => {
            const monthIndex = new Date(entry.date + 'T12:00:00Z').getUTCMonth();
            monthlyBreakdown[monthIndex].total += entry.totalAmount || 0;
            monthlyBreakdown[monthIndex].cash += entry.cashAmount || 0;
            monthlyBreakdown[monthIndex].card += entry.cardAmount || 0;
            monthlyBreakdown[monthIndex].invoice += entry.invoiceAmount || 0;
        });

        const totalAnnualSales = monthlyBreakdown.reduce((sum, month) => sum + month.total, 0);
        const monthlyTotalsOnly = monthlyBreakdown.map(m => m.total);
        const bestMonthIndex = monthlyTotalsOnly.reduce((bestIndex, current, index, arr) => current > arr[bestIndex] ? index : bestIndex, 0);
        const months = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];

        const totalAnnualSalesPreviousYear = prevYearEntries.reduce((sum, entry) => sum + (entry.totalAmount || 0), 0);
        
        const totalCash = yearEntries.reduce((sum, e) => sum + (e.cashAmount || 0), 0);
        const totalCard = yearEntries.reduce((sum, e) => sum + (e.cardAmount || 0), 0);
        const totalInvoice = yearEntries.reduce((sum, e) => sum + (e.invoiceAmount || 0), 0);
        const getPercentage = (part, total) => total > 0 ? ((part / total) * 100).toFixed(0) : 0;
        const paymentSplit = {
            cash: { amount: totalCash, percent: getPercentage(totalCash, totalAnnualSales) },
            card: { amount: totalCard, percent: getPercentage(totalCard, totalAnnualSales) },
            invoice: { amount: totalInvoice, percent: getPercentage(totalInvoice, totalAnnualSales) },
        };
        
        const settlementSummary = yearSettlements.reduce((summary, doc) => {
            summary.purchaseNet += doc.purchaseNet || 0;
            summary.margin += doc.margin || 0;
            summary.salesNet += doc.salesNet || 0;
            summary.vat += doc.vat || 0;
            summary.salesGross += doc.salesGross || 0;
            summary.bankDeposit += doc.bankDeposit || 0;
            return summary;
        }, { purchaseNet: 0, margin: 0, salesNet: 0, vat: 0, salesGross: 0, bankDeposit: 0 });


        setAnnualData({
            monthlyTotals: monthlyTotalsOnly, 
            monthlyBreakdown: monthlyBreakdown, 
            kpi: {
                totalAnnualSales: {
                    value: totalAnnualSales,
                    yoy: calculatePercentageChange(totalAnnualSales, totalAnnualSalesPreviousYear)
                },
                averageMonthlySales: {
                    value: totalAnnualSales / 12,
                    yoy: calculatePercentageChange(totalAnnualSales / 12, totalAnnualSalesPreviousYear / 12)
                },
                bestMonth: {
                    name: months[bestMonthIndex],
                    amount: monthlyTotalsOnly[bestMonthIndex]
                },
                paymentSplit,
                settlementSummary
            }
        });

    } catch (error) {
        console.error("Błąd podczas pobierania raportu rocznego:", error);
        setMessage({ text: 'Wystąpił błąd podczas pobierania danych rocznych.', type: 'error' });
    } finally {
        setIsLoading(false);
    }
};

    useEffect(() => {
        if (activeSubPage === 'monthly') {
            handleFetchReport(reportMonth);
        }
    }, [activeSubPage, reportMonth]);

    useEffect(() => {
        if (activeSubPage === 'annual') {
            handleFetchAnnualReport(reportYear);
        }
    }, [activeSubPage, reportYear]);

    const handleAddSaleClick = () => {
        const nextDate = findNextAvailableDate(reportMonth, salesData?.entries);
        setDefaultSaleDate(nextDate);
        setEditingSale(null);
        setSaleModalOpen(true);
    };
    const handleSaveSale = async (saleData) => {
        const total = parseFloat(String(saleData.totalAmount).replace(',', '.'));
        if (isNaN(total) || total < 0) {
            setMessage({ text: "Proszę podać prawidłową, dodatnią kwotę sprzedaży.", type: 'error' });
            return;
        }
        setIsLoading(true);
        const card = parseFloat(String(saleData.cardAmount).replace(',', '.')) || 0;
        const invoice = parseFloat(String(saleData.invoiceAmount).replace(',', '.')) || 0;
        const dataToSave = {
            ...saleData,
            totalAmount: total,
            cardAmount: card,
            invoiceAmount: invoice,
            cashAmount: total - card - invoice,
            timestamp: new Date(),
            userId: user.uid
        };
        try {
            await firebaseApi.saveDocument('sales_entries', dataToSave, true);
            setSaleModalOpen(false);
            setEditingSale(null);
            setMessage({ text: `Pomyślnie zapisano sprzedaż z dnia ${saleData.date}.`, type: 'success' });
            handleFetchReport(reportMonth);
        } catch (error) {
            console.error("Błąd zapisu sprzedaży:", error);
            setMessage({ text: 'Wystąpił błąd podczas zapisu.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };
    const handleDeleteSale = async (saleId, saleDate) => {
        if (window.confirm(`Czy na pewno chcesz usunąć wpis sprzedaży z dnia ${saleDate}? Tej operacji nie można cofnąć.`)) {
            setIsLoading(true);
            try {
                await firebaseApi.deleteDocument('sales_entries', saleId, true);
                setMessage({ text: 'Wpis sprzedaży został usunięty.', type: 'success' });
                handleFetchReport(reportMonth);
            } catch (error) {
                console.error("Błąd usuwania wpisu sprzedaży:", error);
                setMessage({ text: 'Wystąpił błąd podczas usuwania.', type: 'error' });
            } finally {
                setIsLoading(false);
            }
        }
    };
    const handleSaveSettlement = async (data) => {
        setIsLoading(true);
        const { settlementMonth, ...dataToSave } = data;
        Object.keys(dataToSave).forEach(key => {
            dataToSave[key] = parseFloat(String(dataToSave[key]).replace(',', '.')) || 0;
        });
        dataToSave.id = settlementMonth;
        dataToSave.lastUpdated = new Date();
        dataToSave.userId = user.uid;
        try {
            await firebaseApi.saveDocument('sales_settlements', dataToSave, true);
            setSettlementModalOpen(false);
            setEditingSettlement(null);
            setMessage({ text: `Pomyślnie zapisano rozliczenie dla miesiąca ${settlementMonth}.`, type: 'success' });
            handleFetchReport(reportMonth);
        } catch (error) {
            console.error("Błąd zapisu rozliczenia:", error);
            setMessage({ text: 'Wystąpił błąd podczas zapisu rozliczenia.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };
    const handleDeleteSettlement = async () => {
        const monthName = new Date(reportMonth + '-02').toLocaleString('pl-PL', { month: 'long', year: 'numeric' });
        if (window.confirm(`Czy na pewno chcesz usunąć całe rozliczenie za ${monthName}? Tej operacji nie można cofnąć.`)) {
            setIsLoading(true);
            try {
                await firebaseApi.deleteDocument('sales_settlements', reportMonth, true);
                setMessage({ text: 'Rozliczenie zostało usunięte.', type: 'success' });
                handleFetchReport(reportMonth);
            } catch (error) {
                console.error("Błąd usuwania rozliczenia:", error);
                setMessage({ text: 'Wystąpił błąd podczas usuwania.', type: 'error' });
            } finally {
                setIsLoading(false);
            }
        }
    };
const handleExportToCsv = () => {
    let csvContent = "\uFEFF"; 
    let fileName = 'raport_sprzedazy.csv';
    const months = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];

    if (activeSubPage === 'monthly' && salesData?.entries.length > 0) {
        fileName = `raport_sprzedazy_miesieczny_${reportMonth}.csv`;
        csvContent += "Data;Gotówka;Terminal;Przelew;Razem\r\n";
        
        salesData.entries.forEach(entry => {
            const row = [
                entry.date,
                (entry.cashAmount || 0).toFixed(2).replace('.', ','),
                (entry.cardAmount || 0).toFixed(2).replace('.', ','),
                (entry.invoiceAmount || 0).toFixed(2).replace('.', ','),
                (entry.totalAmount || 0).toFixed(2).replace('.', ',')
            ].join(';');
            csvContent += row + "\r\n";
        });

    } else if (activeSubPage === 'annual' && annualData?.monthlyBreakdown) {
        fileName = `raport_sprzedazy_roczny_${reportYear}.csv`;
        csvContent += "Miesiąc;Gotówka;Terminal;Przelew;Suma\r\n";

        annualData.monthlyBreakdown.forEach((monthData, index) => {
            if (monthData.total > 0) { 
                const row = [
                    months[index],
                    (monthData.cash || 0).toFixed(2).replace('.', ','),
                    (monthData.card || 0).toFixed(2).replace('.', ','),
                    (monthData.invoice || 0).toFixed(2).replace('.', ','),
                    (monthData.total || 0).toFixed(2).replace('.', ',')
                ].join(';');
                csvContent += row + "\r\n";
            }
        });
    } else {
        alert("Brak danych do wyeksportowania w tym widoku.");
        return;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
const handlePrintRequest = (printType) => {
    let printId, title, subtitle, formattedDate, header;

    try {
        switch (printType) {
            case 'monthly-summary':
                if (!salesData) throw new Error("Brak danych do wydrukowania.");
                printId = 'monthly-sales-printable';
                title = 'Miesięczny Raport Sprzedaży';
                subtitle = `za miesiąc ${new Date(reportMonth + '-02').toLocaleString('pl-PL', { month: 'long', year: 'numeric' })}`;
                const [year, month] = reportMonth.split('-');
                formattedDate = new Date(year, month, 0).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }) + ' r.';
                break;
            
            case 'monthly-details':
                if (!salesData) throw new Error("Brak danych do wydrukowania.");
                printId = 'monthly-details-printable';
                title = 'Szczegółowy Miesięczny Raport Sprzedaży';
                subtitle = `za miesiąc ${new Date(reportMonth + '-02').toLocaleString('pl-PL', { month: 'long', year: 'numeric' })}`;
                const [yearD, monthD] = reportMonth.split('-');
                formattedDate = new Date(yearD, monthD, 0).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }) + ' r.';
                break;

            case 'annual-summary':
                if (!annualData) throw new Error("Brak danych do wydrukowania.");
                printId = 'annual-sales-printable';
                title = 'Roczny Raport Sprzedaży';
                subtitle = `za rok ${reportYear}`;
                formattedDate = new Date(reportYear, 11, 31).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }) + ' r.';
                break;

            case 'annual-details':
                if (!annualData) throw new Error("Brak danych do wydrukowania.");
                printId = 'annual-details-printable';
                title = 'Szczegółowy Roczny Raport Sprzedaży';
                subtitle = `za rok ${reportYear}`;
                formattedDate = new Date(reportYear, 11, 31).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }) + ' r.';
                break;

            default:
                return;
        }

        // Zakładając, że funkcja `getPrintHeaderDetails` jest dostępna w tym zakresie
        header = getPrintHeaderDetails('sales', formattedDate); 
        handlePrint(printId, title, subtitle, header);

    } catch (error) {
        alert(error.message);
    }
};

    const handleEditSettlement = () => {
        setEditingSettlement(settlementData);
        setSettlementModalOpen(true);
    };

    // NOWA SEKCJA: Tytuły dla breadcrumbs
    const pageTitles = {
        monthly: 'Podsumowanie miesięczne',
        annual: 'Podsumowanie roczne',
        comparison: 'Porównanie',
    };

return (
    <div className="max-w-7xl mx-auto">
        <SalesModal 
            isOpen={isSaleModalOpen} 
            onClose={() => { setSaleModalOpen(false); setEditingSale(null); }} 
            onSave={handleSaveSale} 
            isLoading={isLoading} 
            existingData={editingSale} 
            defaultDate={defaultSaleDate} 
        />
        <SettlementModal 
            isOpen={isSettlementModalOpen} 
            onClose={() => { setSettlementModalOpen(false); setEditingSettlement(null); }} 
            onSave={handleSaveSettlement} 
            isLoading={isLoading} 
            existingData={editingSettlement} 
            reportMonth={reportMonth} 
        />
        
        {/* NOWA SEKCJA: Breadcrumbs i Toolbar */}
        <div className="mb-4">
             <Breadcrumb>
                <BreadcrumbItem><BreadcrumbButton>Panel administracyjny</BreadcrumbButton></BreadcrumbItem>
                <BreadcrumbDivider />
                <BreadcrumbItem>
                    {activeSubPage === 'dashboard' ? (
                        <BreadcrumbButton current>Sprzedaż</BreadcrumbButton>
                    ) : (
                        <BreadcrumbButton onClick={() => setActiveSubPage('dashboard')}>Sprzedaż</BreadcrumbButton>
                    )}
                </BreadcrumbItem>
                {activeSubPage !== 'dashboard' && (
                    <>
                        <BreadcrumbDivider />
                        <BreadcrumbItem><BreadcrumbButton current>{pageTitles[activeSubPage]}</BreadcrumbButton></BreadcrumbItem>
                    </>
                )}
            </Breadcrumb>
        </div>

        {activeSubPage !== 'dashboard' && (
            <SalesToolbar 
                activeTab={activeSubPage}
                reportMonth={reportMonth}
                onMonthChange={setReportMonth}
                reportYear={reportYear}
                onYearChange={setReportYear}
                onAddSaleClick={handleAddSaleClick}
                onPrintRequest={handlePrintRequest}
                handleExport={handleExportToCsv}
                salesData={salesData}
                annualData={annualData}
            />
        )}
        
        <MessageBox message={message.text} type={message.type} onDismiss={() => setMessage({ text: '', type: 'info' })} />
        
        {/* NOWA LOGIKA RENDEROWANIA */}
        <div className="mt-6">
            {activeSubPage === 'dashboard' && <SalesDashboard onNavigate={setActiveSubPage} />}

            {activeSubPage === 'monthly' && (
                <>
                   {isLoading ? <LoadingSpinner /> : !salesData || !salesData.entries ? (
                        <div className="p-8 bg-white rounded-lg shadow-md text-center text-gray-500">
                            <i className="fa-solid fa-cash-register fa-3x mb-4 text-gray-300"></i>
                            <p>Brak danych o sprzedaży w wybranym miesiącu.</p>
                            <p className="text-sm mt-2">Użyj przycisku "+ Sprzedaż", aby dodać pierwszy wpis.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <FluentKpiCard title="Sprzedaż w tym miesiącu" value={formatCurrency(salesData.kpi.totalSales.value)} icon={<Money24Regular />} footer={<ComparisonIndicator value={salesData.kpi.totalSales.mom} diff={salesData.kpi.totalSales.diff} />} />
                                <FluentKpiCard title="Średnia dzienna" value={formatCurrency(salesData.kpi.averageDailySales.value)} icon={<DataTrending24Regular />} footer={<ComparisonIndicator value={salesData.kpi.averageDailySales.mom} diff={salesData.kpi.averageDailySales.diff.toFixed(1)}/>} />
                                <FluentKpiCard title="Najlepszy dzień" value={formatCurrency(salesData.kpi.bestDay.amount)} icon={<Trophy24Regular />} footer={ salesData.kpi.bestDay.date ? `Data: ${salesData.kpi.bestDay.date}` : 'Brak danych w tym miesiącu' } />
                                <PaymentSplitCard title="Podział płatności" data={salesData.kpi} />
                                <FluentKpiCard title="Sprzedaż w tym roku" value={formatCurrency(salesData.kpi.ytdTotalSales.value)} icon={<CalendarCheckmark24Regular />} footer={<ComparisonIndicator value={salesData.kpi.ytdTotalSales.yoy} diff={salesData.kpi.ytdTotalSales.diff} />} />
                                <FluentKpiCard title="Stan gotówki w kasie" value={formatCurrency(salesData.kpi.cashBalance)} icon={<Wallet24Regular />} footer="Obliczono na koniec miesiąca" />
                            </div>
                            <SalesSettlement view="monthly" data={settlementData} onEdit={handleEditSettlement} onDelete={handleDeleteSettlement} />

                            {/* SEKCJA WYKRESU */}
                            {salesData.kpi.totalSales.value > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-700">Wizualizacja sprzedaży</h3>
                                    <p className="text-sm text-gray-500 mb-2">Wykres słupkowy prezentujący sumy sprzedaży w kolejnych dniach miesiąca.</p>
                                    <SalesDailyChart salesData={salesData} reportMonth={reportMonth} />
                                </div>
                            )}
                            
                            {/* SEKCJA DZIENNYCH RAPORTÓW */}
                            {salesData.entries.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-700">Dzienne raporty sprzedaży</h3>
                                            <p className="text-sm text-gray-500">Lista wszystkich wpisów w wybranym miesiącu.</p>
                                        </div>
                                        <button onClick={() => setIsDailyReportVisible(prev => !prev)} className="p-2 text-gray-500 hover:text-gray-800">
                                            <i className={`fa-solid ${isDailyReportVisible ? 'fa-chevron-up' : 'fa-chevron-down'} transition-transform duration-300`}></i>
                                        </button>
                                    </div>

                                    {isDailyReportVisible && (
                                        <div className="space-y-2">
                                            <div className="hidden md:grid grid-cols-10 gap-4 px-4 text-left text-xs font-bold text-gray-500 uppercase"><div className="col-span-2">Data</div><div className="col-span-2 text-right">Gotówka</div><div className="col-span-2 text-right">Terminal</div><div className="col-span-2 text-right">Przelew</div><div className="col-span-1 text-right">Suma dnia</div><div className="col-span-1 text-right">Akcje</div></div>
                                            {salesData.entries.map(entry => (
                                                <div key={entry.id} className="bg-white p-4 rounded-lg shadow-sm grid grid-cols-2 md:grid-cols-10 gap-4 items-center hover:bg-gray-50 transition-colors">
                                                    <div className="col-span-2"><p className="font-semibold text-blue-800">{entry.date}</p></div>
                                                    <div className="text-left md:text-right col-span-2"><p>{formatCurrency(entry.cashAmount)}</p></div>
                                                    <div className="text-left md:text-right col-span-2"><p>{formatCurrency(entry.cardAmount)}</p></div>
                                                    <div className="text-left md:text-right col-span-2"><p>{formatCurrency(entry.invoiceAmount)}</p></div>
                                                    <div className="text-left md:text-right col-span-1"><p className="font-bold text-lg">{formatCurrency(entry.totalAmount)}</p></div>
                                                    <div className="flex items-center justify-start md:justify-end gap-2 col-span-1">
                                                        <button onClick={() => { setEditingSale(entry); setSaleModalOpen(true); }} className={SHARED_STYLES.toolbar.iconButton} style={{height: '32px', width: '32px'}} title="Edytuj wpis"><i className="fa-solid fa-pencil text-sm"></i></button>
                                                        <button onClick={() => handleDeleteSale(entry.id, entry.date)} className={`${SHARED_STYLES.toolbar.iconButton} hover:text-red-600`} style={{height: '32px', width: '32px'}} title="Usuń wpis"><i className="fa-solid fa-trash-can text-sm"></i></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
            
            {activeSubPage === 'annual' && (
                <>
                     {isLoading ? <LoadingSpinner /> : !annualData ? (
                        <div className="p-8 bg-white rounded-lg shadow-md text-center text-gray-500">
                            <i className="fa-solid fa-chart-pie fa-3x mb-4 text-gray-300"></i>
                            <p>Brak danych o sprzedaży w wybranym roku.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <FluentKpiCard title="Sprzedaż w tym roku" value={formatCurrency(annualData.kpi.totalAnnualSales.value)} icon={<Money24Regular />} footer={<ComparisonIndicator value={annualData.kpi.totalAnnualSales.yoy} diff={annualData.kpi.totalAnnualSales.diff} />} />
                                <FluentKpiCard title="Średnia miesięczna" value={formatCurrency(annualData.kpi.averageMonthlySales.value)} icon={<DataTrending24Regular />} footer={<ComparisonIndicator value={annualData.kpi.averageMonthlySales.yoy} diff={annualData.kpi.averageMonthlySales.diff} />} />
                                <FluentKpiCard title="Najlepszy miesiąc" value={formatCurrency(annualData.kpi.bestMonth.amount)} icon={<Trophy24Regular />} footer={`Miesiąc: ${annualData.kpi.bestMonth.name}`} />
                                <PaymentSplitCard title="Roczny podział płatności" data={annualData.kpi} />
                            </div>
                            <SalesSettlement view="annual" data={annualData} />
                            {/* SEKCJA ROCZNEGO WYKRESU */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-700">Sprzedaż w poszczególnych miesiącach</h3>
                                <p className="text-sm text-gray-500 mb-2">Wykres słupkowy prezentujący sumy sprzedaży w skali roku.</p>
                                <SalesAnnualChart annualData={annualData} />
                            </div>
                            {/* SEKCJA SZCZEGÓŁOWEGO PODSUMOWANIA MIESIĘCY */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-700">Szczegółowe podsumowanie miesięcy</h3>
                                    <p className="text-sm text-gray-500">Lista wszystkich miesięcy, w których odnotowano sprzedaż.</p>
                                </div>
                                <div className="hidden md:grid grid-cols-5 gap-4 px-4 text-left text-xs font-bold text-gray-500 uppercase">
                                    <div className="col-span-1">Miesiąc</div>
                                    <div className="col-span-1 text-right">Gotówka</div>
                                    <div className="col-span-1 text-right">Terminal</div>
                                    <div className="col-span-1 text-right">Przelew</div>
                                    <div className="col-span-1 text-right">Suma miesiąca</div>
                                </div>
                                <div className="space-y-2">
                                    {["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"].map((monthName, index) => {
                                        const monthData = annualData.monthlyBreakdown[index];
                                        if (monthData.total === 0) return null;
                                        return (
                                            <div key={index} className="bg-white p-4 rounded-lg shadow-sm grid grid-cols-2 md:grid-cols-5 gap-4 items-center hover:bg-gray-50 transition-colors">
                                                <div className="col-span-2 md:col-span-1"><p className="font-semibold text-blue-800">{monthName}</p></div>
                                                <div className="text-left md:text-right"><p className="md:hidden text-xs font-bold text-gray-500 uppercase">Gotówka</p><p>{formatCurrency(monthData.cash)}</p></div>
                                                <div className="text-left md:text-right"><p className="md:hidden text-xs font-bold text-gray-500 uppercase">Terminal</p><p>{formatCurrency(monthData.card)}</p></div>
                                                <div className="text-left md:text-right"><p className="md:hidden text-xs font-bold text-gray-500 uppercase">Przelew</p><p>{formatCurrency(monthData.invoice)}</p></div>
                                                <div className="text-left md:text-right"><p className="md:hidden text-xs font-bold text-gray-500 uppercase">Suma miesiąca</p><p className="font-bold text-lg">{formatCurrency(monthData.total)}</p></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeSubPage === 'comparison' && ( <SalesComparisonTab /> )}

            <div className="hidden">
                <div id="monthly-sales-printable">{salesData && <PrintableMonthlyReport salesData={{...salesData, settlementData}} />}</div>
                <div id="annual-sales-printable">{annualData && <PrintableAnnualReport annualData={annualData} />}</div>
                <div id="monthly-details-printable">{salesData && <PrintableMonthlyDetails salesData={salesData} />}</div>
                <div id="annual-details-printable">{annualData && <PrintableAnnualDetails annualData={annualData} />}</div>
            </div>
        </div>
    </div>
);
}
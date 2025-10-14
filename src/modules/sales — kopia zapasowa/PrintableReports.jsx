import React from 'react';
import { formatCurrency } from './salesHelpers';

export function PrintableMonthlyReport({ salesData }) {
    if (!salesData) return null;
    const { kpi, settlementData } = salesData;

    return (
        <div>
            <table>
                <tbody>
                    <tr>
                        <td className="p-2 border font-bold text-base key-column">Koszt sprzedaży towarów handlowych</td>
                        <td className="p-2 border text-right font-bold text-base">{formatCurrency(settlementData?.purchaseNet)}</td>
                    </tr>
                </tbody>
            </table>

            <h3 className="section-title">Podsumowanie rozliczenia</h3>
            <table>
                <tbody>
                    <tr className="bg-gray-50"><td className="p-2 border font-semibold key-column">Wartość zakupu netto</td><td className="p-2 border text-right">{formatCurrency(settlementData?.purchaseNet)}</td></tr>
                    <tr><td className="p-2 border font-semibold key-column">Marża</td><td className="p-2 border text-right">{formatCurrency(settlementData?.margin)}</td></tr>
                    <tr className="bg-gray-50"><td className="p-2 border font-semibold key-column">Wartość sprzedaży netto</td><td className="p-2 border text-right">{formatCurrency(settlementData?.salesNet)}</td></tr>
                    <tr><td className="p-2 border font-semibold key-column">VAT</td><td className="p-2 border text-right">{formatCurrency(settlementData?.vat)}</td></tr>
                    <tr className="bg-gray-50"><td className="p-2 border font-semibold key-column">Wartość sprzedaży brutto</td><td className="p-2 border text-right">{formatCurrency(settlementData?.salesGross)}</td></tr>
                    <tr><td className="p-2 border font-semibold key-column">Wpłata bankowa</td><td className="p-2 border text-right">{formatCurrency(settlementData?.bankDeposit)}</td></tr>
                    <tr className="bg-gray-50"><td className="p-2 border font-semibold key-column">Stan gotówki</td><td className="p-2 border text-right font-bold">{formatCurrency(kpi.cashBalance)}</td></tr>
                </tbody>
            </table>

            <h3 className="section-title">Podsumowanie sprzedaży</h3>
            <table>
                 <tbody>
                    <tr><td className="p-2 border font-semibold key-column">Płatności gotówkowe</td><td className="p-2 border text-right">{formatCurrency(kpi.paymentSplit.cash.amount)}</td></tr>
                    <tr className="bg-gray-50"><td className="p-2 border font-semibold key-column">Płatności terminalem</td><td className="p-2 border text-right">{formatCurrency(kpi.paymentSplit.card.amount)}</td></tr>
                    <tr><td className="p-2 border font-semibold key-column">Płatności przelewem</td><td className="p-2 border text-right">{formatCurrency(kpi.paymentSplit.invoice.amount)}</td></tr>
                </tbody>
            </table>
            
            <div className="signature-block">
                <div className="signature-box">
                    <p>Sporządził:</p>
                    <div className="signature-line"></div>
                    <p className="signature-name">Krzysztof Popielarz</p>
                </div>
                <div className="signature-box">
                    <p>Księgowość:</p>
                    <div className="signature-line"></div>
                    <p className="signature-name">Małgorzata Terlik</p>
                </div>
            </div>
        </div>
    );
}

export function PrintableAnnualReport({ annualData }) {
    if (!annualData) return null;
    const { kpi, monthlyBreakdown } = annualData;
    const months = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];

    return (
        <div>
            <table>
                <tbody>
                    <tr>
                        <td className="p-2 border font-bold text-base key-column">Koszt sprzedaży towarów handlowych</td>
                        <td className="p-2 border text-right font-bold text-base">{formatCurrency(kpi.settlementSummary.purchaseNet)}</td>
                    </tr>
                </tbody>
            </table>
            
            <h3 className="section-title">Podsumowanie rozliczenia</h3>
            <table>
                <tbody>
                    <tr className="bg-gray-50"><td className="p-2 border font-semibold key-column">Wartość zakupu netto</td><td className="p-2 border text-right">{formatCurrency(kpi.settlementSummary.purchaseNet)}</td></tr>
                    <tr><td className="p-2 border font-semibold key-column">Marża</td><td className="p-2 border text-right">{formatCurrency(kpi.settlementSummary.margin)}</td></tr>
                    <tr className="bg-gray-50"><td className="p-2 border font-semibold key-column">Wartość sprzedaży netto</td><td className="p-2 border text-right">{formatCurrency(kpi.settlementSummary.salesNet)}</td></tr>
                    <tr><td className="p-2 border font-semibold key-column">VAT</td><td className="p-2 border text-right">{formatCurrency(kpi.settlementSummary.vat)}</td></tr>
                    <tr className="bg-gray-50"><td className="p-2 border font-semibold key-column">Wartość sprzedaży brutto</td><td className="p-2 border text-right">{formatCurrency(kpi.settlementSummary.salesGross)}</td></tr>
                    <tr><td className="p-2 border font-semibold key-column">Wpłaty bankowe</td><td className="p-2 border text-right">{formatCurrency(kpi.settlementSummary.bankDeposit)}</td></tr>
                </tbody>
            </table>
            
            <h3 className="section-title">Podsumowanie sprzedaży rocznej</h3>
            <table>
                <tbody>
                    <tr className="bg-gray-50"><td className="p-2 border font-semibold key-column">Suma sprzedaży w roku</td><td className="p-2 border text-right font-bold">{formatCurrency(kpi.totalAnnualSales.value)}</td></tr>
                    <tr><td className="p-2 border font-semibold key-column">Płatności gotówkowe</td><td className="p-2 border text-right">{formatCurrency(kpi.paymentSplit.cash.amount)}</td></tr>
                    <tr className="bg-gray-50"><td className="p-2 border font-semibold key-column">Płatności terminalem</td><td className="p-2 border text-right">{formatCurrency(kpi.paymentSplit.card.amount)}</td></tr>
                    <tr><td className="p-2 border font-semibold key-column">Płatności przelewem</td><td className="p-2 border text-right">{formatCurrency(kpi.paymentSplit.invoice.amount)}</td></tr>
                </tbody>
            </table>
            
            {/* Sekcja z podpisami została usunięta */}
        </div>
    );
}

export function PrintableMonthlyDetails({ salesData }) {
    if (!salesData || !salesData.entries) return null;
    return (
        <table className="data-table">
            <thead>
                <tr>
                    <th className="text-left">Data</th>
                    <th className="text-right">Gotówka</th>
                    <th className="text-right">Terminal</th>
                    <th className="text-right">Przelew</th>
                    <th className="text-right font-bold">Razem</th>
                </tr>
            </thead>
            <tbody>
                {salesData.entries.map(entry => (
                    <tr key={entry.id}>
                        <td>{entry.date}</td>
                        <td className="text-right">{formatCurrency(entry.cashAmount)}</td>
                        <td className="text-right">{formatCurrency(entry.cardAmount)}</td>
                        <td className="text-right">{formatCurrency(entry.invoiceAmount)}</td>
                        <td className="text-right font-bold">{formatCurrency(entry.totalAmount)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export function PrintableAnnualDetails({ annualData }) {
    if (!annualData || !annualData.monthlyBreakdown) return null;
    const months = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
    return (
        <table className="data-table">
            <thead>
                <tr>
                    <th className="text-left">Miesiąc</th>
                    <th className="text-right">Gotówka</th>
                    <th className="text-right">Terminal</th>
                    <th className="text-right">Przelew</th>
                    <th className="text-right font-bold">Suma</th>
                </tr>
            </thead>
            <tbody>
                {annualData.monthlyBreakdown.map((monthData, index) => {
                     if (monthData.total === 0) return null;
                     return (
                        <tr key={index}>
                            <td className="font-semibold">{months[index]}</td>
                            <td className="text-right">{formatCurrency(monthData.cash)}</td>
                            <td className="text-right">{formatCurrency(monthData.card)}</td>
                            <td className="text-right">{formatCurrency(monthData.invoice)}</td>
                            <td className="text-right font-bold">{formatCurrency(monthData.total)}</td>
                        </tr>
                     );
                })}
            </tbody>
        </table>
    );
}
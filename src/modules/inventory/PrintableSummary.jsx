import React, { useEffect } from 'react';

const formatCurrency = (value) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value || 0);

// Komponent otrzymuje teraz funkcje handlePrint i onPrintComplete
export default function PrintableSummary({ year, censuses, locations, handlePrint, onPrintComplete }) {
    
    // Ten hook uruchomi się dopiero, gdy komponent zostanie w pełni wyrenderowany w DOM
    useEffect(() => {
        // Sprawdzamy, czy otrzymaliśmy funkcję drukowania
        if (handlePrint) {
            // Wywołujemy drukowanie, mając 100% pewności, że element istnieje
            handlePrint('printable-summary-content', `Arkusz Zbiorczy Inwentaryzacji`, `Rok ${year}`);
        }
        // Informujemy komponent nadrzędny, że zadanie zostało wykonane
        if (onPrintComplete) {
            onPrintComplete();
        }
    }, []); // Pusta tablica gwarantuje, że kod uruchomi się tylko raz

    // Reszta komponentu bez zmian
    if (!censuses || censuses.length === 0) return null;
    const totalValue = censuses.reduce((sum, census) => sum + (census.totalValue || 0), 0);
    const getLocationName = (locationId) => locations.find(loc => loc.id === locationId)?.name || 'Nieznana lokalizacja';

    return (
        <div id="printable-summary-content" style={{ fontFamily: 'Calibri, sans-serif', fontSize: '11pt', color: 'black' }}>
            <h2 style={{ textAlign: 'center' }}>ARKUSZ ZBIORCZY SPISU Z NATURY ZA ROK {year}</h2>
            <table style={{ width: '100%', border: '1px solid black', borderCollapse: 'collapse', textAlign: 'center', marginTop: '20px' }}>
                <thead>
                    <tr>
                        <th style={{ border: '1px solid black', padding: '5px', width: '5%' }}>Lp.</th>
                        <th style={{ border: '1px solid black', padding: '5px', width: '75%' }}>Nazwa arkusza spisu</th>
                        <th style={{ border: '1px solid black', padding: '5px', width: '20%' }}>Wartość</th>
                    </tr>
                </thead>
                <tbody>
                    {censuses.map((census, index) => (
                        <tr key={census.id}>
                            <td style={{ border: '1px solid black', padding: '5px' }}>{index + 1}</td>
                            <td style={{ border: '1px solid black', padding: '5px', textAlign: 'left' }}>
                                Arkusz spisu z natury – {getLocationName(census.locationId)}
                            </td>
                            <td style={{ border: '1px solid black', padding: '5px', textAlign: 'right' }}>
                                {formatCurrency(census.totalValue)}
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan="2" style={{ textAlign: 'right', fontWeight: 'bold', padding: '5px' }}>SUMA CAŁKOWITA:</td>
                        <td style={{ border: '1px solid black', padding: '5px', fontWeight: 'bold', textAlign: 'right' }}>
                            {formatCurrency(totalValue)}
                        </td>
                    </tr>
                </tfoot>
            </table>
            <p style={{marginTop: '30px'}}>
                <strong>Wartość słownie:</strong> ... (funkcjonalność do dodania w przyszłości)
            </p>
        </div>
    );
}
import React from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

// Funkcja pomocnicza do formatowania waluty
const formatCurrency = (value) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value || 0);

// Funkcja do konwersji liczby na tekst (uproszczona)
const numberToWords = (num) => {
    // Prosta implementacja, można ją w przyszłości rozbudować o pełną konwersję
    return `${formatCurrency(num)} PLN`;
};

export default function PrintableCensus({ census, censusItems, location }) {
    if (!census || !location) return null;

    const totalValue = censusItems.reduce((sum, item) => sum + (item.quantityFound * item.pricePerUnit), 0);
    const startDate = census.startDate ? format(new Date(census.startDate), 'dd.MM.yyyy HH:mm') : 'Brak danych';
    const endDate = census.endDate ? format(new Date(census.endDate), 'dd.MM.yyyy HH:mm') : 'Brak danych';

    return (
        <div id="printable-census-content" style={{ fontFamily: 'Calibri, sans-serif', fontSize: '11pt', color: 'black' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <tbody>
                    <tr>
                        <td style={{ width: '60%' }}><strong>ARKUSZ SPISU Z NATURY NR ...</strong></td>
                        <td style={{ width: '40%', textAlign: 'right' }}>Rodzaj inwentaryzacji: roczna</td>
                    </tr>
                    <tr>
                        <td></td>
                        <td style={{ textAlign: 'right' }}>Sposób przeprowadzenia: spis z natury</td>
                    </tr>
                </tbody>
            </table>

            <table style={{ width: '100%', border: '1px solid black', borderCollapse: 'collapse', marginBottom: '10px' }}>
                <tbody>
                    <tr>
                        <td style={{ border: '1px solid black', padding: '5px', width: '50%' }}>
                            <strong>CK KŁOBUK – {location.name}</strong><br />
                            <small>Nazwa i adres jednostki inwentaryzowanej</small>
                        </td>
                        <td style={{ border: '1px solid black', padding: '5px', width: '50%' }}>
                            <strong>{location.personResponsible || 'Brak'}</strong><br />
                            <small>Imię i nazwisko osoby odpowiedzialnej materialnie</small>
                        </td>
                    </tr>
                     <tr>
                        <td style={{ border: '1px solid black', padding: '5px' }}>
                            <strong>Skład komisji inwentaryzacyjnej:</strong><br />
                            {(census.committee || []).join(', ')}
                        </td>
                        <td style={{ border: '1px solid black', padding: '5px' }}>
                            <strong>Inne osoby obecne przy spisie:</strong><br />
                        </td>
                    </tr>
                    <tr>
                        <td style={{ border: '1px solid black', padding: '5px' }}>Spis rozpoczęto dn. {startDate}</td>
                        <td style={{ border: '1px solid black', padding: '5px' }}>Spis zakończono dn. {endDate}</td>
                    </tr>
                </tbody>
            </table>

            <table style={{ width: '100%', border: '1px solid black', borderCollapse: 'collapse', textAlign: 'center' }}>
                <thead>
                    <tr>
                        <th style={{ border: '1px solid black', padding: '5px' }}>Lp.</th>
                        <th style={{ border: '1px solid black', padding: '5px' }}>Nazwa (określenie) przedmiotu</th>
                        <th style={{ border: '1px solid black', padding: '5px' }}>J.m.</th>
                        <th style={{ border: '1px solid black', padding: '5px' }}>Ilość</th>
                        <th style={{ border: '1px solid black', padding: '5px' }}>Cena</th>
                        <th style={{ border: '1px solid black', padding: '5px' }}>Wartość</th>
                        <th style={{ border: '1px solid black', padding: '5px' }}>Uwagi</th>
                    </tr>
                </thead>
                <tbody>
                    {censusItems.map((item, index) => (
                        <tr key={item.id}>
                            <td style={{ border: '1px solid black', padding: '5px' }}>{index + 1}</td>
                            <td style={{ border: '1px solid black', padding: '5px', textAlign: 'left' }}>{item.name}</td>
                            <td style={{ border: '1px solid black', padding: '5px' }}>{item.unit}</td>
                            <td style={{ border: '1px solid black', padding: '5px' }}>{item.quantityFound}</td>
                            <td style={{ border: '1px solid black', padding: '5px' }}>{item.pricePerUnit.toFixed(2)}</td>
                            <td style={{ border: '1px solid black', padding: '5px' }}>{(item.quantityFound * item.pricePerUnit).toFixed(2)}</td>
                            <td style={{ border: '1px solid black', padding: '5px' }}>{item.notes || ''}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan="5" style={{ textAlign: 'right', fontWeight: 'bold', padding: '5px' }}>RAZEM:</td>
                        <td style={{ border: '1px solid black', padding: '5px', fontWeight: 'bold' }}>{totalValue.toFixed(2)}</td>
                        <td style={{ border: '1px solid black', padding: '5px' }}></td>
                    </tr>
                </tfoot>
            </table>
            <p>Spis zakończono na pozycji nr {censusItems.length}</p>
            <p><strong>Wartość słownie:</strong> {numberToWords(totalValue)}</p>
        </div>
    );
}
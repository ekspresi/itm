// Stała z logo, może być przechowywana w pliku konfiguracyjnym
const CK_LOGO_URL = "https://stats.visit-mikolajki.pl/ck-logo.jpg";

// Funkcja pomocnicza do pobierania danych nagłówka
const getPrintHeaderDetails = () => {
    return {
        logoUrl: CK_LOGO_URL,
        date: new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }) + ' r.',
        lines: [
            { text: 'Centrum Kultury "Kłobuk" w Mikołajkach', bold: true },
            { text: '11-730 Mikołajki, ul. Kolejowa 6', bold: false },
            { text: 'tel. 87 421 61 46, e-mail: biuro@ckklobuk.pl', bold: false }
        ]
    };
};

/**
 * Drukuje zawartość harmonogramu.
 * @param {string} scheduleHtml - Kod HTML elementu harmonogramu.
 * @param {string} scheduleTitle - Tytuł do wyświetlenia na wydruku (np. "Harmonogram Sali: Sala taneczna").
 * @param {string} weekDisplay - Zakres dat tygodnia (np. "22.07.2024 - 28.07.2024").
 */
export const printSchedule = (scheduleHtml, scheduleTitle, weekDisplay) => {
    const printWindow = window.open('', '_blank');
    const headerDetails = getPrintHeaderDetails();
    
    printWindow.document.write(`
        <html>
            <head>
                <title>Harmonogram Sali</title>
                <script src="https://cdn.tailwindcss.com/"></script>
                <style>
                    @page { 
                        size: A3 landscape; 
                        margin: 1.5cm; 
                    }
                    html, body { 
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact;
                    }
                    body {
                        display: flex;
                        flex-direction: column;
                    }
                    .print-header-content { display: flex; align-items: center; justify-content: space-between; }
                    .print-header-logo-section { display: flex; align-items: center; gap: 0.75rem; }
                    .print-header-logo-section p { margin: 0; line-height: 1.5; }
                    .print-header-text { font-size: 8pt; }
                    .no-print-in-modal { display: none !important; }
                    .printable-content { flex-grow: 1; }
                    .overflow-x-auto { overflow: visible !important; }
                </style>
            </head>
            <body>
                <header class="print-header">
                    <div class="print-header-content">
                        <div class="print-header-logo-section">
                            <img src="${headerDetails.logoUrl}" style="height: 3rem; width: 3rem;" />
                            <div>${headerDetails.lines.map(line => `<p class="${line.bold ? 'font-bold' : ''} print-header-text">${line.text}</p>`).join('')}</div>
                        </div>
                        <div class="print-header-text">${headerDetails.date}</div>
                    </div>
                </header>
                <h2 class="text-xl font-bold text-center my-4">${scheduleTitle}</h2>
                <h3 class="text-lg text-center mb-4">${weekDisplay}</h3>
                ${scheduleHtml}
            </body>
        </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500); // Opóźnienie, aby zapewnić załadowanie styli
};
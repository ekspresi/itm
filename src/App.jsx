import React, { useState, useEffect } from 'react';
import { useAuth } from './lib/AuthContext.jsx';
import { db, appId } from './lib/firebase';

// Importy komponentów Fluent UI
import { FluentProvider, webLightTheme, webDarkTheme, makeStyles, tokens } from '@fluentui/react-components';

// Importy naszych komponentów
import LoadingSpinner from './components/LoadingSpinner';
import LoginScreen from './components/LoginScreen';
import SideMenu from './components/SideMenu'; // Upewniamy się, że to jest właściwy import
import MobileHeader from './components/MobileHeader';

// Importy wszystkich modułów
import AccommodationModule from './modules/accommodations/AccommodationModule';
import EventsModule from './modules/events/EventsModule';
import WorkTimeModule from './modules/worktime/WorkTimeModule';
import StaysModule from './modules/stays/StaysModule';
import SalesModule from './modules/sales/SalesModule';
import VisitsModule from './modules/visits/VisitsModule';
import AttractionsModule from './modules/attractions/AttractionsModule';
import GastronomyModule from './modules/gastronomy/GastronomyModule';
import TextsModule from './modules/texts/TextsModule';
import LeafletsModule from './modules/leaflets/LeafletsModule';
import ScheduleModule from './modules/schedule/ScheduleModule';

const useStyles = makeStyles({
    main: {
        backgroundColor: tokens.colorNeutralBackground2,
    },
});

function App() {
    const styles = useStyles();
    const { user, isLoggedIn, login, logout, isAuthLoading } = useAuth();
    const [activeModule, setActiveModule] = useState('visits');
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
    const [isMenuCollapsed, setMenuCollapsed] = useState(window.innerWidth < 768);

    // NOWA LOGIKA MOTYWU
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    const theme = isDarkMode ? webDarkTheme : webLightTheme;

  useEffect(() => {
      const handleResize = () => {
          const isMobile = window.innerWidth < 768;
          setIsMobileView(isMobile);
          setMenuCollapsed(isMobile);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

// Ten hook będzie nasłuchiwał zmian w motywie i aktualizował tło całej strony
useEffect(() => {
    // Tło dla całej strony (najgłębsza warstwa)
    document.body.style.backgroundColor = theme.colorNeutralBackground3;
    document.body.style.color = theme.colorNeutralForeground1;
}, [theme]);

    const handlePrint = (elementId, title, subtitle, headerDetails, isLandscape = false) => {
      const printNode = document.getElementById(elementId);
      if (!printNode) {
          console.error(`[Błąd Drukowania] Nie znaleziono elementu o ID: "${elementId}"`);
          alert(`Wystąpił błąd: nie można znaleźć treści do wydruku.`);
          return;
      }

      const newWindow = window.open('', '', 'height=800,width=1200');
      if (!newWindow) {
          alert("Nie można otworzyć nowego okna. Sprawdź, czy przeglądarka nie blokuje wyskakujących okienek.");
          return;
      }

      const landscapeStyles = isLandscape ? '@media print { @page { size: A4 landscape; } }' : '';

      const printStyles = `
          <style>
              body { font-family: ui-sans-serif, system-ui, sans-serif; font-size: 10pt; -webkit-print-color-adjust: exact; }
              ${landscapeStyles}
              .print-header-content { display: flex; align-items: center; justify-content: space-between; }
              .print-header-logo-section { display: flex; align-items: center; gap: 0.75rem; }
              .print-header-logo-section p { margin: 0; line-height: 1.5; }
              .print-header-text { font-size: 8pt; }
              h2.main-title { font-size: 1.125rem; font-weight: bold; text-align: center; margin-bottom: 0; margin-top: 3rem;}
              p.subtitle { text-align: center; font-size: 0.9rem; margin-bottom: 1.5rem; }
              h3.section-title { font-size: 0.9rem; font-weight: bold; margin-bottom: 0.75rem; margin-top: 1.5rem; text-align: center; }
              table { width: 100%; font-size: 9pt; border-collapse: collapse; }
              th, td { padding: 0.3rem 0.5rem; border: 1px solid #e5e7eb; text-align: left; }
              thead { background-color: #f3f4f6; }
              .key-column { width: 60%; }
              .signature-block { display: flex; justify-content: space-between; margin-top: 4rem; font-size: 9pt; page-break-inside: avoid; }
              .signature-box { text-align: center; width: 45%; }
              .signature-box p { margin-bottom: 0; }
              .signature-line { border-bottom: 1px solid #9ca3af; margin-top: 3.5rem; margin-bottom: 0.25rem; }
              .signature-name { font-weight: normal; }
              .text-right { text-align: right; }
              .font-bold { font-weight: bold; }
              .bg-gray-50 { background-color: #f9fafb; }
              .no-print { display: none !important; }
          </style>
      `;

      newWindow.document.write('<html><head><title>Drukuj</title>');
      newWindow.document.write(printStyles);
      newWindow.document.write('</head><body>');

      if (headerDetails) {
          newWindow.document.write('<header class="print-header">');
          newWindow.document.write('<div class="print-header-content">');
          newWindow.document.write(`<div class="print-header-logo-section"><img src="${headerDetails.logoUrl}" style="height: 3rem; width: 3rem;" /><div>${headerDetails.lines.map(line => `<p class="${line.bold ? 'font-bold' : ''} print-header-text">${line.text}</p>`).join('')}</div></div>`);
          newWindow.document.write(`<div class="print-header-text">${headerDetails.date}</div>`);
          newWindow.document.write('</div></header>');
      }

      if (title) { newWindow.document.write(`<h2 class="main-title">${title}</h2>`); }
      if (subtitle) { newWindow.document.write(`<p class="subtitle">${subtitle}</p>`); }
      newWindow.document.write(printNode.innerHTML);

      newWindow.document.write('</body></html>');
      newWindow.document.close();

      setTimeout(() => { 
          newWindow.focus();
          newWindow.print();
          newWindow.close(); 
      }, 750);
  };

  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  }
  if (!isLoggedIn) {
    return <LoginScreen onLogin={login} />;
  }

    return (
        <FluentProvider theme={theme}>
            <div className="flex h-screen">
                <SideMenu 
                    isCollapsed={isMenuCollapsed}
                    setCollapsed={setMenuCollapsed}
                    isMobileView={isMobileView}
                    onLogout={logout}
                    user={user} 
                    activeModule={activeModule}
                    setActiveModule={setActiveModule}
                    // Przekazujemy nowe propsy do naszego starego SideMenu
                    isDarkMode={isDarkMode}
                    setIsDarkMode={setIsDarkMode}
                />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <MobileHeader setMenuCollapsed={setMenuCollapsed} />
                    {isMobileView && !isMenuCollapsed && (
                        <div onClick={() => setMenuCollapsed(true)} className="fixed inset-0 bg-black bg-opacity-50 z-30"></div>
                    )}
                    <main className={`flex-1 p-4 md:p-6 overflow-y-auto ${styles.main}`}>
              {activeModule === 'accommodations' && <AccommodationModule />}
              {activeModule === 'events' && <EventsModule />}
              {activeModule === 'worktime' && <WorkTimeModule />}
              {activeModule === 'stays' && <StaysModule />}
              {activeModule === 'sales' && <SalesModule user={user} handlePrint={handlePrint} />}
              {activeModule === 'visits' && <VisitsModule db={db} appId={appId} user={user} handlePrint={handlePrint} />}
              {activeModule === 'attractions' && <AttractionsModule db={db} appId={appId} user={user} />}
              {activeModule === 'gastronomy' && <GastronomyModule db={db} appId={appId} user={user} />}
              {activeModule === 'texts' && <TextsModule />}
              {activeModule === 'leaflets' && <LeafletsModule />}
              {activeModule === 'schedule' && <ScheduleModule handlePrint={handlePrint} />}
                    </main>
                </div>
            </div>
        </FluentProvider>
    );
}

export default App;
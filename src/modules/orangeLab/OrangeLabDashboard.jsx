import React from 'react';
import { Card, CardHeader, makeStyles, tokens } from "@fluentui/react-components";
import { 
    bundleIcon, 
    PuzzleCube24Filled, 
    PuzzleCube24Regular, 
    Games24Filled, 
    Games24Regular,
    ChevronRight24Regular,
    Clock16Regular,
    Location16Regular
} from "@fluentui/react-icons";

// === AKTUALIZACJA STYLI ===
const useStyles = makeStyles({
    // Style dla przycisków nawigacyjnych (bez zmian)
    cardHeader: {
        gap: tokens.spacingHorizontalXS,
        paddingLeft: tokens.spacingHorizontalXS,
        paddingRight: tokens.spacingHorizontalXS,
        paddingTop: tokens.spacingVerticalXS,
        paddingBottom: tokens.spacingVerticalXS,
    },
    textWrapper: {
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
    },
    icon: {
        color: tokens.colorNeutralForeground2,
    },
    title: {
        fontSize: tokens.fontSizeBase300, 
        fontWeight: tokens.fontWeightRegular,
        color: tokens.colorNeutralForeground1,
    },
    description: {
        fontSize: tokens.fontSizeBase200, 
        color: tokens.colorNeutralForeground2,
    },
    // NOWY STYL dla mniejszych ikon na kartach zajęć
    smallIcon: {
        display: 'flex',
        alignItems: 'center',
    },
});

// === ZAKTUALIZOWANA WERSJA KOMPONENTU KARTY ZAJĘĆ ===
const UpcomingClassCard = ({ classItem, allRooms }) => {
    const styles = useStyles(); // Używamy hooka wewnątrz komponentu
    const today = new Date();
    const todayDayOfWeek = (today.getDay() + 6) % 7 + 1;

    const sortedTerminy = classItem.terminy
        .map(t => ({...t, dayOfWeek: parseInt(t.dzienTygodnia)}))
        .sort((a, b) => {
            let dayA = a.dayOfWeek < todayDayOfWeek ? a.dayOfWeek + 7 : a.dayOfWeek;
            let dayB = b.dayOfWeek < todayDayOfWeek ? b.dayOfWeek + 7 : b.dayOfWeek;
            return dayA - dayB;
        });
    
    const nextTermin = sortedTerminy[0];
    if (!nextTermin) return null;

    // POPRAWIONA LOGIKA ZNAJDOWANIA SALI
    // Sprawdzamy ID sali w konkretnym terminie, a jeśli go tam nie ma, sprawdzamy w głównym obiekcie zajęć
    const roomId = nextTermin.salaId || classItem.salaId;
    const room = allRooms.find(r => r.id === roomId);
    const roomName = room ? room.nazwa : 'Brak sali';

    const days = ["", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];

    return (
        <Card className="h-full">
            <div className="p-4 flex flex-col gap-2">
                <div className="text-sm font-semibold text-blue-600">{days[nextTermin.dayOfWeek].toUpperCase()}</div>
                <div className="font-semibold text-base h-12">{classItem.nazwa}</div>
                <div className="flex items-center gap-2 text-sm text-neutral-foreground-2">
                    <span className={styles.smallIcon}><Clock16Regular /></span>
                    <span>{nextTermin.godzinaOd} - {nextTermin.godzinaDo}</span>
                </div>
                 <div className="flex items-center gap-2 text-sm text-neutral-foreground-2">
                    <span className={styles.smallIcon}><Location16Regular /></span>
                    <span>{roomName}</span>
                </div>
            </div>
        </Card>
    );
};


export default function OrangeLabDashboard({ onNavigate, classes, allRooms }) {
    const styles = useStyles(); 
    const LegoIcon = bundleIcon(PuzzleCube24Filled, PuzzleCube24Regular);
    const GamerIcon = bundleIcon(Games24Filled, Games24Regular);

    const navItems = [
        { id: 'legoZone', title: 'Strefa LEGO', description: 'Zarządzaj zestawami, uczestnikami i śledź postępy w budowaniu.', icon: <LegoIcon /> },
        { id: 'gamerZone', title: 'Strefa Gracza', description: 'Ewidencjonuj konsole, komputery, gogle VR i bibliotekę gier.', icon: <GamerIcon /> },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {classes && classes.length > 0 ? (
                        classes.map(c => <UpcomingClassCard key={c.id} classItem={c} allRooms={allRooms} />)
                    ) : (
                        <div className="col-span-full">
                            <p className="text-center p-8 text-neutral-foreground-2">Brak zaplanowanych zajęć dla Pracowni Orange w harmonogramie.</p>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex flex-col gap-2 mb-5">
                                <h2 className="text-base font-semibold mt-5 mb-2">Zarządzanie Pracownią</h2>
                {navItems.map(item => (
                    <Card key={item.id} className="cursor-pointer" onClick={() => onNavigate(item.id)}>
                        <CardHeader
                            className={styles.cardHeader}
                            image={
                                <div className={styles.icon}>{item.icon}</div>
                            }
                            header={
                                <div className={styles.textWrapper}>
                                    <span className={styles.title}>{item.title}</span>
                                    <span className={styles.description}>{item.description}</span>
                                </div>
                            }
                            action={
                                <span className="text-neutral-foreground-2"><ChevronRight24Regular /></span>
                            }
                        />
                    </Card>
                ))}
            </div>
        </div>
    );
}
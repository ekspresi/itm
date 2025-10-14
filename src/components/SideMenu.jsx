import React from 'react';
import { STATS_LOGO_URL } from '../lib/helpers';
// Dodajemy importy z Fluent UI
import { Button, Tooltip } from "@fluentui/react-components";
import { WeatherSunny24Regular, WeatherMoon24Regular } from "@fluentui/react-icons";

// Komponent przyjmuje nowe propsy na samym końcu listy
export default function SideMenu({ isCollapsed, setCollapsed, isMobileView, onLogout, user, activeModule, setActiveModule, isDarkMode, setIsDarkMode }) {
    const menuItems = [
        {
            category: "ANALITYKA",
            items: [
                { id: 'visits', label: 'Odwiedziny', icon: 'fa-chart-pie' },
                { id: 'stays', label: 'Pobyty', icon: 'fa-user' },
                { id: 'sales', label: 'Sprzedaż', icon: 'fa-cash-register' },
                { id: 'worktime', label: 'Czas pracy', icon: 'fa-clock' }
            ]
        },
        {
            category: "TURYSTYKA",
            items: [
                { id: 'attractions', label: 'Atrakcje', icon: 'fa-map-location-dot' },
                { id: 'events', label: 'Wydarzenia', icon: 'fa-calendar-days' },
                { id: 'gastronomy', label: 'Gastronomia', icon: 'fa-utensils' },
                { id: 'accommodations', label: 'Noclegi', icon: 'fa-bed' },
                { id: 'texts', label: 'Teksty', icon: 'fa-book' },
                { id: 'leaflets', label: 'Ulotki', icon: 'fa-file-alt' }
            ]
        },
            {
        category: "ZARZĄDZANIE", // To jest nowa kategoria z pliku ckklobuk.html
        items: [
            { id: 'schedule', label: 'Harmonogram sal', icon: 'fa-solid fa-calendar-week' }, 
            { id: 'inventory', label: 'Inwentaryzacja', icon: 'fa-solid fa-boxes-stacked' },
            { id: 'orangeLab', label: 'Pracownia Orange', icon: 'fa-solid fa-desktop' },
        ]
    }
    ];

    const sidebarClasses = isMobileView
        ? `fixed inset-0 z-40 h-screen bg-white shadow-lg flex flex-col transition-transform transform ${isCollapsed ? '-translate-x-full' : 'translate-x-0'} w-72`
        : `sidebar bg-white shadow-lg flex flex-col h-screen relative ${isCollapsed ? 'w-20' : 'w-72'}`;

    return (
        <div className={`${sidebarClasses} select-none no-print`}>
            <div className="hidden md:flex items-center pl-3 pr-4 border-b h-20">
                <button onClick={() => setCollapsed(!isCollapsed)} className="p-3 h-12 text-gray-600 hover:text-blue-700 rounded-lg hover:bg-gray-100">
                    <div className="w-8 text-center"><i className="fa-solid fa-bars fa-lg"></i></div>
                </button>
                {!isCollapsed && (
                    <div className="flex items-center ml-3">
                        <img 
                            src={STATS_LOGO_URL} 
                            alt="Logo IT Mikołajki" 
                            className="h-10 w-10 mr-3 shadow-md" 
                            onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/48x48/003366/FFFFFF?text=IT'; }}
                        />
                        <div className="overflow-hidden">
                            <h1 className="text-lg font-bold text-blue-800 whitespace-nowrap">IT Mikołajki</h1>
                            <p className="text-sm text-gray-500 whitespace-nowrap">Panel administracyjny</p>
                        </div>
                    </div>
                )}
            </div>
            <nav className="flex-grow overflow-y-auto p-4 pt-8 md:pt-4">
                {menuItems.map(category => (
                    <div key={category.category}>
                        {(isCollapsed && !isMobileView) ? <hr className="my-4"/> : <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{category.category}</h2>}
                        <ul className="mt-2 space-y-1 mb-2">
                            {category.items.map(item => (
                                <li key={item.id}>
                                    <a 
                                        href="#" 
                                        onClick={() => setActiveModule(item.id)}
                                        className={`flex items-center p-3 h-12 rounded-lg transition-colors ${
                                            activeModule === item.id 
                                            ? 'bg-blue-100 text-blue-800' 
                                            : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        <i className={`fa-solid ${item.icon} fa-lg w-8 text-center`}></i>
                                        {!isCollapsed && <span className="ml-3 font-semibold">{item.label}</span>}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </nav>
            {/* ZAKTUALIZOWANA DOLNA CZĘŚĆ MENU */}
            <div className="p-4 border-t">
                {!isCollapsed && user && (
                    <div className="text-center text-xs text-gray-500 mb-2">
                        <p>Zalogowano jako:</p>
                        <p className="font-semibold">{user.email}</p>
                    </div>
                )}
                <div className={`w-full flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
                    <button onClick={onLogout} className={`flex items-center p-3 rounded-lg transition-colors text-red-600 hover:bg-red-100 ${isCollapsed ? 'w-full justify-center' : ''}`}>
                        <i className="fa-solid fa-right-from-bracket fa-lg"></i>
                        {!isCollapsed && <span className="ml-3 font-semibold">Wyloguj</span>}
                    </button>

                    {/* Pusty element do rozpychania przycisków */}
                    {!isCollapsed && <div className="flex-grow" />} 

                    <Tooltip content={isDarkMode ? "Tryb jasny" : "Tryb ciemny"} relationship="label">
                        <Button
                            appearance="transparent"
                            icon={isDarkMode ? <WeatherSunny24Regular /> : <WeatherMoon24Regular />}
                            onClick={() => setIsDarkMode(!isDarkMode)}
                        />
                    </Tooltip>
                </div>
            </div>
        </div>
    );
};
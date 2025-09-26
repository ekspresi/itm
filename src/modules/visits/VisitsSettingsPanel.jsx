import React, { useState, useEffect } from 'react';
import { firebaseApi } from '../../lib/firebase';
import LoadingSpinner from '../../components/LoadingSpinner';
import { SHARED_STYLES } from '../../lib/helpers';
import IndicatorModal from './IndicatorModal';

export default function VisitsSettingsPanel({ onReturn }) {
    const [isLoading, setIsLoading] = useState(true);
    const [indicators, setIndicators] = useState({ gender: [], language: [], purpose: [] });
    const [yearlyConfig, setYearlyConfig] = useState({});
    const [activeTab, setActiveTab] = useState('config');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIndicator, setEditingIndicator] = useState(null);
    const [editingCategory, setEditingCategory] = useState('');
    
    const categoryHeaders = {
        gender: "Płeć",
        language: "Język",
        purpose: "Cel wizyty"
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [indicatorsData, configData] = await Promise.all([
                firebaseApi.fetchCollection('indicators'),
                firebaseApi.fetchDocument('visits_config', '--main--')
            ]);

            const groupedIndicators = { gender: [], language: [], purpose: [] };
            (indicatorsData || []).forEach(ind => {
                if (groupedIndicators[ind.category]) {
                    groupedIndicators[ind.category].push(ind);
                }
            });
            Object.keys(groupedIndicators).forEach(cat => {
                groupedIndicators[cat].sort((a, b) => a.sortOrder - b.sortOrder);
            });
            
            setIndicators(groupedIndicators);
            if (configData && configData.yearlySettings) {
                setYearlyConfig(configData.yearlySettings);
            }
        } catch (error) {
            console.error("Błąd wczytywania danych konfiguracyjnych:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const generateSlug = (name) => {
        const polishChars = { 'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z' };
        let slug = name.toString().toLowerCase().trim()
            .replace(/[\s\W_]+/g, '-')
            .replace(/[ąćęłńóśźż]/g, char => polishChars[char])
            .replace(/&/g, '-and-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-');
        return slug;
    };

    const handleOpenModal = (indicator, category) => {
        setEditingIndicator(indicator);
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const handleSaveIndicator = async (data) => {
        let dataToSave = { ...data };
        if (editingIndicator) {
            dataToSave.id = editingIndicator.id;
        } else {
            dataToSave.slug = generateSlug(data.name);
            dataToSave.category = editingCategory;
            const maxOrder = indicators[editingCategory].length > 0 ? Math.max(...indicators[editingCategory].map(i => i.sortOrder)) : 0;
            dataToSave.sortOrder = maxOrder + 1;
        }
        await firebaseApi.saveDocument('indicators', dataToSave);
        setIsModalOpen(false);
        fetchData();
    };
    
    const handleDeleteIndicator = async (indicatorToDelete) => {
        if (!window.confirm(`Czy na pewno chcesz usunąć wskaźnik "${indicatorToDelete.name}"? Tej operacji nie można cofnąć.`)) return;
        setIsLoading(true);
        try {
            const newYearlyConfig = JSON.parse(JSON.stringify(yearlyConfig));
            let configChanged = false;
            for (const year in newYearlyConfig) {
                const yearIndicators = newYearlyConfig[year].activeIndicators?.[indicatorToDelete.category];
                if (yearIndicators && yearIndicators.includes(indicatorToDelete.slug)) {
                    configChanged = true;
                    newYearlyConfig[year].activeIndicators[indicatorToDelete.category] = yearIndicators.filter(slug => slug !== indicatorToDelete.slug);
                }
            }
            const deletePromises = [firebaseApi.deleteDocument('indicators', indicatorToDelete.id)];
            if (configChanged) {
                const configDoc = await firebaseApi.fetchDocument('visits_config', '--main--') || {};
                deletePromises.push(firebaseApi.saveDocument('visits_config', { ...configDoc, id: '--main--', yearlySettings: newYearlyConfig }));
            }
            await Promise.all(deletePromises);
            fetchData();
        } catch (error) {
            console.error("Błąd podczas usuwania wskaźnika:", error);
            alert("Wystąpił błąd podczas usuwania.");
            setIsLoading(false);
        }
    };

    const handleMoveIndicator = async (category, index, direction) => {
        const list = [...indicators[category]];
        if ((index === 0 && direction === -1) || (index === list.length - 1 && direction === 1)) return;
        const indicator1 = list[index];
        const indicator2 = list[index + direction];
        [indicator1.sortOrder, indicator2.sortOrder] = [indicator2.sortOrder, indicator1.sortOrder];
        await Promise.all([ firebaseApi.saveDocument('indicators', indicator1), firebaseApi.saveDocument('indicators', indicator2) ]);
        fetchData();
    };

    const handleSettingChange = (year, field, value) => {
        const numValue = parseFloat(String(value).replace(',', '.'));
        setYearlyConfig(prev => ({ ...prev, [year]: { ...prev[year], [field]: isNaN(numValue) ? '' : numValue } }));
    };
    
    const handleModeChange = (year, isChecked) => {
        const newMode = isChecked ? 'multiplier' : 'fixed';
        setYearlyConfig(prev => ({ ...prev, [year]: { ...(prev[year] || {}), mode: newMode } }));
    };

    const handleBarometrToggle = (year, isEnabled) => {
        setYearlyConfig(prev => ({ ...prev, [year]: { ...(prev[year] || {}), barometrEnabled: isEnabled } }));
    };
    
    const addYear = (year) => {
        setYearlyConfig(prev => ({
            ...prev,
            [year]: {
                mode: 'multiplier',
                value: 1,
                barometrEnabled: true,
                activeIndicators: {
                    gender: indicators.gender.map(i => i.slug),
                    language: indicators.language.map(i => i.slug),
                    purpose: indicators.purpose.map(i => i.slug),
                }
            }
        }));
    };
    
    const handleAddNextYear = () => {
        const nextYear = Object.keys(yearlyConfig).length > 0 ? Math.max(...Object.keys(yearlyConfig).map(Number)) + 1 : new Date().getFullYear() + 1;
        addYear(nextYear);
    };

    const handleAddPreviousYear = () => {
        const prevYear = Object.keys(yearlyConfig).length > 0 ? Math.min(...Object.keys(yearlyConfig).map(Number)) - 1 : new Date().getFullYear() - 1;
        addYear(prevYear);
    };
    
    const handleToggleAll = (year, category, selectAll) => {
        const allCategorySlugs = indicators[category].map(ind => ind.slug);
        setYearlyConfig(prev => ({
            ...prev,
            [year]: {
                ...prev[year],
                activeIndicators: {
                    ...prev[year].activeIndicators,
                    [category]: selectAll ? allCategorySlugs : []
                }
            }
        }));
    };

    const handleYearlyToggle = (year, category, slug) => {
        setYearlyConfig(prev => {
            const yearConf = prev[year] || { mode: 'multiplier', barometrEnabled: false, activeIndicators: { gender: [], language: [], purpose: [] } };
            const currentActive = yearConf.activeIndicators?.[category] || [];
            const newActive = new Set(currentActive);
            if (newActive.has(slug)) newActive.delete(slug);
            else newActive.add(slug);
            return { ...prev, [year]: { ...yearConf, activeIndicators: { ...(yearConf.activeIndicators || {}), [category]: Array.from(newActive) } } };
        });
    };

    const handleSaveConfig = async () => {
        setIsLoading(true);
        try {
            await firebaseApi.saveDocument('visits_config', { id: '--main--', yearlySettings: yearlyConfig });
            alert(`Konfiguracja została pomyślnie zapisana.`);
            fetchData();
        } catch (error) { console.error("Błąd zapisu konfiguracji:", error); alert("Błąd zapisu."); } finally { setIsLoading(false); }
    };

    const actionButton = "bg-white hover:bg-gray-100 text-gray-600 w-8 h-8 rounded-lg border shadow-sm flex items-center justify-center transition-colors disabled:opacity-30";

    return (
        <div>
            <IndicatorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveIndicator} editingIndicator={editingIndicator} category={editingCategory} />
            
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Ustawienia modułu Odwiedziny</h2>
                <button onClick={onReturn} className="bg-white hover:bg-gray-100 text-gray-800 border font-semibold text-sm h-10 px-4 rounded-lg flex items-center justify-center shadow-sm transition-colors"><i className="fa-solid fa-arrow-left mr-2"></i>Powrót do modułu</button>
            </div>
            
            <div className="flex border-b border-gray-200">
                <button onClick={() => setActiveTab('config')} className={`${SHARED_STYLES.tabs.base} ${activeTab === 'config' ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>Konfiguracja Sezonów</button>
                <button onClick={() => setActiveTab('indicators')} className={`${SHARED_STYLES.tabs.base} ${activeTab === 'indicators' ? SHARED_STYLES.tabs.active : SHARED_STYLES.tabs.inactive}`}>Wskaźniki</button>
            </div>

            {isLoading ? <LoadingSpinner /> : (
                <div className="mt-6">
                    {activeTab === 'config' && (
                         <div className="space-y-4">
                            <button onClick={handleAddNextYear} className="w-full bg-white hover:bg-gray-50 border rounded-lg font-semibold text-sm py-2 px-4"><i className="fa-solid fa-plus mr-2"></i>Dodaj następny rok</button>
                            {(Object.keys(yearlyConfig).sort((a,b) => b-a)).map(year => {
                                const settings = yearlyConfig[year] || { mode: 'multiplier' };
                                const selectedYearForToggles = year;
                                return (
                                    <div key={selectedYearForToggles} className="bg-white p-4 border rounded-lg shadow-sm space-y-4">
                                        <h3 className="text-xl font-bold text-blue-800">{selectedYearForToggles}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t items-center">
                                            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer"><input type="checkbox" checked={settings.mode === 'multiplier'} onChange={e => handleModeChange(selectedYearForToggles, e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/> Mnożnik automatyczny</label>
<div className="flex items-center gap-2"><label className="text-sm font-medium text-gray-700">Wartość mnożnika</label><input type="number" step="0.01" placeholder="np. 1.75" value={settings.value || ''} onChange={e => handleSettingChange(selectedYearForToggles, 'value', e.target.value)} disabled={settings.mode !== 'multiplier'} className="w-24 p-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" /></div>                                            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer"><input type="checkbox" checked={settings.barometrEnabled || false} onChange={e => handleBarometrToggle(selectedYearForToggles, e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/> B@rometr Turystyczny</label>
                                        </div>
                                        {Object.keys(indicators).map(category => (
                                            <div key={category} className="pt-4 border-t">
                                                <div className="flex items-center justify-start gap-4 mb-2">
                                                    <h4 className="font-semibold text-gray-700">{categoryHeaders[category]}</h4>
                                                    <div className="flex items-center gap-2"><button onClick={() => handleToggleAll(selectedYearForToggles, category, true)} className="text-xs font-semibold text-blue-600 hover:text-blue-800">Zaznacz wszystkie</button><button onClick={() => handleToggleAll(selectedYearForToggles, category, false)} className="text-xs font-semibold text-gray-500 hover:text-gray-800">Odznacz wszystkie</button></div>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
                                                    {indicators[category].map(ind => (
                                                        <label key={ind.id} className="flex items-center"><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={yearlyConfig[selectedYearForToggles]?.activeIndicators?.[category]?.includes(ind.slug) || false} onChange={() => handleYearlyToggle(selectedYearForToggles, category, ind.slug)}/><span className="ml-2 text-sm">{ind.name}</span></label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                            <button onClick={handleAddPreviousYear} className="w-full bg-white hover:bg-gray-50 border rounded-lg font-semibold text-sm py-2 px-4"><i className="fa-solid fa-plus mr-2"></i>Dodaj poprzedni rok</button>
                            <div className="text-center mt-6">
                                <button onClick={handleSaveConfig} className={SHARED_STYLES.buttons.primary + " px-8 py-3 text-lg"}>Zapisz konfigurację</button>
                            </div>
                        </div>
                    )}
                    {activeTab === 'indicators' && ( 
                        <div className="grid md:grid-cols-3 gap-6">
                            {Object.keys(indicators).map(category => (
                                <div key={category}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-bold text-lg">{categoryHeaders[category]}</h3>
                                        <button onClick={() => handleOpenModal(null, category)} className={actionButton} title="Dodaj nowy wskaźnik"><i className="fa-solid fa-plus text-sm"></i></button>
                                    </div>
                                    <div className="space-y-2">
                                        {(indicators[category] || []).map((ind, index) => (
                                            <div key={ind.id} className="bg-white p-2 rounded-lg shadow-sm border flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {category === 'gender' && (<span className="w-4 h-4 rounded-full border" style={{ backgroundColor: ind.color || '#ffffff' }}></span>)}
                                                    <span className="font-semibold text-sm">{ind.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                     <button onClick={() => handleMoveIndicator(category, index, -1)} disabled={index === 0} className={actionButton} title="Przesuń w górę"><i className="fa-solid fa-arrow-up text-xs"></i></button>
                                                     <button onClick={() => handleMoveIndicator(category, index, 1)} disabled={index === indicators[category].length - 1} className={actionButton} title="Przesuń w dół"><i className="fa-solid fa-arrow-down text-xs"></i></button>
                                                     <button onClick={() => handleOpenModal(ind, category)} className={actionButton} title="Edytuj"><i className="fa-solid fa-pencil text-xs"></i></button>
                                                     <button onClick={() => handleDeleteIndicator(ind)} className={`${actionButton} hover:bg-red-50 hover:text-red-600`} title="Usuń"><i className="fa-solid fa-trash-can text-xs"></i></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                     )}
                </div>
            )}
        </div>
    );
}
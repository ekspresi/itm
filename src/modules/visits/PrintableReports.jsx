import React from 'react';

export function PrintableDailyVisitReport({ statsData, showMultiplied, allIndicators }) {
    if (!statsData || !allIndicators) return null;
    const displayData = showMultiplied ? statsData.multiplied : statsData.raw;
    if (!displayData || !displayData.total) return null;

    const purposeSorted = Object.entries(displayData.purpose || {}).sort((a, b) => b[1] - a[1]);
    const indicatorsBySlug = new Map(allIndicators.map(i => [i.slug, i]));

    return (
        <div>
            <h3 className="section-title">Podsumowanie dzienne</h3>
            <table>
                <tbody>
                    <tr className='bg-gray-50'><td className="p-2 border font-semibold key-column">Łączna liczba odwiedzających</td><td className="p-2 border text-right font-bold">{displayData.total.value}</td></tr>
                </tbody>
            </table>

            <h3 className="section-title">Podział na płeć</h3>
            <table>
                <tbody>
                    {Object.keys(displayData.gender || {}).map((slug, index) => {
                        const indicator = indicatorsBySlug.get(slug);
                        return (
                            <tr key={slug} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                <td className="p-2 border font-semibold key-column">{indicator?.name || slug}</td>
                                <td className="p-2 border text-right">{displayData.gender[slug]}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <h3 className="section-title">Podział na języki</h3>
            <table>
                <tbody>
                     {Object.keys(displayData.language || {}).map((slug, index) => {
                        const indicator = indicatorsBySlug.get(slug);
                        return (
                            <tr key={slug} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                <td className="p-2 border font-semibold key-column">{indicator?.name || slug}</td>
                                <td className="p-2 border text-right">{displayData.language[slug]}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            
            <h3 className="section-title">Cele wizyt</h3>
            <table>
                <tbody>
                    {purposeSorted.map(([slug, count], index) => {
                         const indicator = indicatorsBySlug.get(slug);
                         return (
                            <tr key={slug} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                <td className="p-2 border font-semibold key-column">{indicator?.name || slug}</td>
                                <td className="p-2 border text-right font-bold">{count}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export function PrintableMonthlyVisitReport({ statsData, showMultiplied, allIndicators }) {
    if (!statsData || !allIndicators) return null;
    const displayData = showMultiplied ? statsData.multiplied : statsData.raw;
    if (!displayData || !displayData.total) return null;

    const purposeSorted = Object.entries(displayData.purpose || {}).sort((a, b) => b[1] - a[1]);
    const indicatorsBySlug = new Map(allIndicators.map(i => [i.slug, i]));
    
    return (
        <div>
            <h3 className="section-title">Podsumowanie miesięczne</h3>
            <table>
                <tbody>
                    <tr className='bg-gray-50'><td className="p-2 border font-semibold key-column">Łączna liczba odwiedzających</td><td className="p-2 border text-right font-bold">{displayData.total.value}</td></tr>
                </tbody>
            </table>

            <h3 className="section-title">Podział na płeć</h3>
            <table>
                <tbody>
                    {Object.keys(displayData.gender || {}).map((slug, index) => {
                        const indicator = indicatorsBySlug.get(slug);
                        return (
                            <tr key={slug} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                <td className="p-2 border font-semibold key-column">{indicator?.name || slug}</td>
                                <td className="p-2 border text-right">{displayData.gender[slug]}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <h3 className="section-title">Podział na języki</h3>
            <table>
                <tbody>
                     {Object.keys(displayData.language || {}).map((slug, index) => {
                        const indicator = indicatorsBySlug.get(slug);
                        return (
                            <tr key={slug} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                <td className="p-2 border font-semibold key-column">{indicator?.name || slug}</td>
                                <td className="p-2 border text-right">{displayData.language[slug]}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <h3 className="section-title">Cele wizyt</h3>
            <table>
                <tbody>
                    {purposeSorted.map(([slug, count], index) => {
                        const indicator = indicatorsBySlug.get(slug);
                        return (<tr key={slug} className={index % 2 === 0 ? 'bg-gray-50' : ''}><td className="p-2 border font-semibold key-column">{indicator?.name || slug}</td><td className="p-2 border text-right font-bold">{count}</td></tr>);
                    })}
                </tbody>
            </table>
        </div>
    );
}

export function PrintableAnnualVisitReport({ statsData, showMultiplied, allIndicators }) {
    if (!statsData || !allIndicators) return null;
    const displayData = showMultiplied ? statsData.multiplied : statsData.raw;
    if (!displayData || !displayData.total) return null;

    const purposeSorted = Object.entries(displayData.purpose || {}).sort((a, b) => b[1] - a[1]);
    const indicatorsBySlug = new Map(allIndicators.map(i => [i.slug, i]));

    return (
        <div>
            <h3 className="section-title">Podsumowanie roczne</h3>
            <table>
                <tbody>
                    <tr className='bg-gray-50'><td className="p-2 border font-semibold key-column">Łączna liczba odwiedzających</td><td className="p-2 border text-right font-bold">{displayData.total.value}</td></tr>
                </tbody>
            </table>

            <h3 className="section-title">Podział na płeć</h3>
            <table>
                <tbody>
                    {Object.keys(displayData.gender || {}).map((slug, index) => {
                        const indicator = indicatorsBySlug.get(slug);
                        return (
                            <tr key={slug} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                <td className="p-2 border font-semibold key-column">{indicator?.name || slug}</td>
                                <td className="p-2 border text-right">{displayData.gender[slug]}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <h3 className="section-title">Podział na języki</h3>
            <table>
                <tbody>
                     {Object.keys(displayData.language || {}).map((slug, index) => {
                        const indicator = indicatorsBySlug.get(slug);
                        return (
                            <tr key={slug} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                <td className="p-2 border font-semibold key-column">{indicator?.name || slug}</td>
                                <td className="p-2 border text-right">{displayData.language[slug]}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            
            <h3 className="section-title">Cele wizyt</h3>
            <table>
                <tbody>
                    {purposeSorted.map(([slug, count], index) => {
                        const indicator = indicatorsBySlug.get(slug);
                        return (<tr key={slug} className={index % 2 === 0 ? 'bg-gray-50' : ''}><td className="p-2 border font-semibold key-column">{indicator?.name || slug}</td><td className="p-2 border text-right font-bold">{count}</td></tr>);
                    })}
                </tbody>
            </table>
        </div>
    );
}

export function PrintableAnnualDetailedReport({ monthlyBreakdownData, showMultiplied, allIndicators }) {
    if (!monthlyBreakdownData || !allIndicators) return null;

    const dataType = showMultiplied ? 'multiplied' : 'raw';
    const data = monthlyBreakdownData.map(m => m[dataType]);
    const indicatorsBySlug = new Map(allIndicators.map(i => [i.slug, i]));

    const displayedMonthsIndices = [4, 5, 6, 7, 8]; // Maj (V) do Września (IX)
    const monthLabels = ['V', 'VI', 'VII', 'VIII', 'IX'];

    const allGenderSlugs = Array.from(new Set(data.flatMap(m => Object.keys(m.gender || {}))));
    const allLanguageSlugs = Array.from(new Set(data.flatMap(m => Object.keys(m.language || {}))));
    const allPurposeSlugs = Array.from(new Set(data.flatMap(m => Object.keys(m.purpose || {}))));

    const sumDisplayedMonths = (keyAccessor) => {
        return displayedMonthsIndices.reduce((total, monthIndex) => {
            const monthData = data[monthIndex];
            if (!monthData) return total;
            return total + (keyAccessor(monthData) || 0);
        }, 0);
    };

    let rowIndex = 0;

    return (
        <div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th className="text-left key-column">Metryka</th>
                        {monthLabels.map(label => <th key={label} className="text-right">{label}</th>)}
                        <th className="text-right font-bold">RAZEM</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className={rowIndex++ % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="p-2 border font-bold">Łącznie odwiedzających</td>
                        {displayedMonthsIndices.map(i => <td key={i} className="p-2 border text-right font-bold">{data[i]?.total || 0}</td>)}
                        <td className="p-2 border text-right font-bold">{sumDisplayedMonths(d => d.total)}</td>
                    </tr>
                    
                    <tr>
                        <td colSpan={monthLabels.length + 2} className="p-2 border font-bold bg-gray-100">Podział na płeć</td>
                    </tr>
                    {allGenderSlugs.map(slug => {
                        const indicator = indicatorsBySlug.get(slug);
                        return (
                            <tr key={slug} className={rowIndex++ % 2 === 0 ? 'bg-gray-50' : ''}>
                                <td className="p-2 border font-semibold">{indicator?.name || slug}</td>
                                {displayedMonthsIndices.map(i => <td key={i} className="p-2 border text-right">{data[i]?.gender[slug] || 0}</td>)}
                                <td className="p-2 border text-right">{sumDisplayedMonths(d => d.gender[slug] || 0)}</td>
                            </tr>
                        );
                    })}

                    <tr>
                        <td colSpan={monthLabels.length + 2} className="p-2 border font-bold bg-gray-100">Podział na języki</td>
                    </tr>
                    {allLanguageSlugs.map(slug => {
                        const indicator = indicatorsBySlug.get(slug);
                        return (
                            <tr key={slug} className={rowIndex++ % 2 === 0 ? 'bg-gray-50' : ''}>
                                <td className="p-2 border font-semibold">{indicator?.name || slug}</td>
                                {displayedMonthsIndices.map(i => <td key={i} className="p-2 border text-right">{data[i]?.language[slug] || 0}</td>)}
                                <td className="p-2 border text-right">{sumDisplayedMonths(d => d.language[slug] || 0)}</td>
                            </tr>
                        );
                    })}
                    
                    <tr>
                        <td colSpan={monthLabels.length + 2} className="p-2 border font-bold bg-gray-100">Cele wizyt</td>
                    </tr>
                    {allPurposeSlugs.map(slug => {
                        const indicator = indicatorsBySlug.get(slug);
                        return (
                             <tr key={slug} className={rowIndex++ % 2 === 0 ? 'bg-gray-50' : ''}>
                                <td className="p-2 border font-semibold">{indicator?.name || slug}</td>
                                {displayedMonthsIndices.map(i => <td key={i} className="p-2 border text-right">{data[i]?.purpose[slug] || 0}</td>)}
                                <td className="p-2 border text-right">{sumDisplayedMonths(d => d.purpose[slug] || 0)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
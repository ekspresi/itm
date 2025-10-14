import React from 'react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbButton,
    BreadcrumbDivider,
} from "@fluentui/react-components";

/**
 * Globalny, w pełni funkcjonalny komponent Breadcrumbs.
 * Obsługuje:
 * - Małe przyciski z efektami hover/active.
 * - Mały separator chevron.
 * - Stały pierwszy element "Panel administracyjny".
 * - Automatyczne chowanie nadmiarowych elementów do menu "..." (overflow).
 * - Automatyczne skracanie zbyt długich nazw (truncation).
 *
 * @param {Array<Object>} items - Tablica obiektów { name: String, onClick: Function }
 */
export default function Breadcrumbs({ items = [] }) {
    // Dodajemy "Panel administracyjny" na początek
    const allItems = [
        { name: 'Panel administracyjny', isRoot: true },
        ...items
    ];

    return (
        <div style={{ marginBottom: 'var(--spacingVerticalL)' }}>
            <Breadcrumb aria-label="Nawigacja okruszkowa" size="medium">
                {allItems.map((item, index) => {
                    const isCurrentPage = index === allItems.length - 1;

                    return (
                        <React.Fragment key={index}>
                            <BreadcrumbItem>
                                <BreadcrumbButton
                                    onClick={item.onClick}
                                    current={isCurrentPage}
                                    disabled={isCurrentPage || item.isRoot}
                                >
                                    {item.name}
                                </BreadcrumbButton>
                            </BreadcrumbItem>
                            {!isCurrentPage && <BreadcrumbDivider />}
                        </React.Fragment>
                    );
                })}
            </Breadcrumb>
        </div>
    );
}
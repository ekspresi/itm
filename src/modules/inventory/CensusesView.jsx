import React, { useState } from 'react';
import {
    DataGrid, DataGridHeader, DataGridHeaderCell, DataGridRow, DataGridCell, DataGridBody,
    TableCellLayout,
    createTableColumn,
    Button,
    makeStyles,
    tokens,
    Input,
    Field,
    Dropdown,
    Option,
} from '@fluentui/react-components';
import { Add24Regular, Edit24Regular, Delete24Regular, Print24Regular, ContentView24Regular } from '@fluentui/react-icons';
import CensusModal from './CensusModal';

const useStyles = makeStyles({
    toolbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: tokens.spacingVerticalL,
        flexWrap: 'wrap',
        gap: tokens.spacingHorizontalL,
    },
    filters: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalL,
        flexWrap: 'wrap',
    },
});

export default function CensusesView({ censuses, locations, onSave, onDelete, onEdit, onPrint, onPrintSummary, onAddNew }) {
    const styles = useStyles();
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
        const [isModalOpen, setIsModalOpen] = useState(false);

    const filteredCensuses = (censuses || []).filter(c => c.year === yearFilter);

    const getLocationName = (locationId) => {
        return locations.find(loc => loc.id === locationId)?.name || 'Nieznana lokalizacja';
    };

    const columns = [
        createTableColumn({
            columnId: 'locationName',
            renderHeaderCell: () => 'Lokalizacja / Kategoria',
            renderCell: (item) => <TableCellLayout>{getLocationName(item.locationId)}</TableCellLayout>,
        }),
        createTableColumn({
            columnId: 'status',
            renderHeaderCell: () => 'Status',
            renderCell: (item) => <TableCellLayout>{item.status || 'w toku'}</TableCellLayout>,
        }),
        createTableColumn({
            columnId: 'totalValue',
            renderHeaderCell: () => 'Wartość spisu (PLN)',
            renderCell: (item) => <TableCellLayout>{(item.totalValue || 0).toFixed(2)}</TableCellLayout>,
        }),
        createTableColumn({
            columnId: 'actions',
            renderHeaderCell: () => 'Akcje',
            renderCell: (item) => (
                <TableCellLayout>
                    <Button icon={<ContentView24Regular />} appearance="subtle" title="Zobacz/Edytuj" onClick={() => onEdit(item.id)} />
                    {/* --- ZMIEŃ TEN PRZYCISK --- */}
                    <Button icon={<Print24Regular />} appearance="subtle" title="Drukuj arkusz" onClick={() => onPrint(item.id)} />
                    <Button icon={<Delete24Regular />} appearance="subtle" title="Usuń spis" onClick={() => onDelete(item.id)} />
                </TableCellLayout>
            ),
        }),
    ];

    return (
        <>
            <CensusModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={onSave}
                locations={locations}
                existingCensuses={censuses}
            />
            <div className={styles.toolbar}>
                <div className={styles.filters}>
                    <Field label="Filtruj po roku">
                        <Input 
                            type="number" 
                            value={yearFilter} 
                            onChange={(e) => setYearFilter(parseInt(e.target.value, 10))} 
                        />
                    </Field>
                </div>
                                <div className="flex gap-2"> {/* <-- Dodajemy kontener dla przycisków */}
                    <Button icon={<Print24Regular />} onClick={() => onPrintSummary(yearFilter)}>
                        Drukuj arkusz zbiorczy
                    </Button>
                    <Button appearance="primary" icon={<Add24Regular />} onClick={() => setIsModalOpen(true)}>
                        Rozpocznij nowy spis
                    </Button>
                </div>
            </div>
            <DataGrid
                items={filteredCensuses}
                columns={columns}
                getRowId={item => item.id}
                resizableColumns
            >
                <DataGridHeader>
                    <DataGridRow>
                        {({ renderHeaderCell }) => (
                            <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                        )}
                    </DataGridRow>
                </DataGridHeader>
                <DataGridBody>
                    {({ item, rowId }) => (
                        <DataGridRow key={rowId}>
                            {({ renderCell }) => (
                                <DataGridCell>{renderCell(item)}</DataGridCell>
                            )}
                        </DataGridRow>
                    )}
                </DataGridBody>
            </DataGrid>
        </>
    );
}
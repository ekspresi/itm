import React, { useState } from 'react';
import {
    DataGrid, 
    DataGridHeader, 
    DataGridHeaderCell, 
    DataGridRow, 
    DataGridCell, 
    DataGridBody,
    TableCellLayout,
    createTableColumn, // Ważny import
    Button,
    makeStyles,
    tokens,
} from '@fluentui/react-components';
import { Add24Regular, Edit24Regular, Delete24Regular } from '@fluentui/react-icons';
import LocationModal from './LocationModal';

const useStyles = makeStyles({
    toolbar: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: tokens.spacingVerticalL,
    },
});

export default function LocationsView({ locations, onSave, onDelete }) {
    const styles = useStyles();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);

    const handleEdit = (location) => {
        setEditingLocation(location);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingLocation(null);
        setIsModalOpen(true);
    };

    // Poprawna definicja kolumn przy użyciu createTableColumn
    const columns = [
        createTableColumn({
            columnId: 'name',
            renderHeaderCell: () => 'Nazwa lokalizacji/kategorii',
            renderCell: (item) => (
                <TableCellLayout>{item.name}</TableCellLayout>
            ),
        }),
        createTableColumn({
            columnId: 'personResponsible',
            renderHeaderCell: () => 'Osoba odpowiedzialna',
            renderCell: (item) => (
                <TableCellLayout>{item.personResponsible || '-'}</TableCellLayout>
            ),
        }),
        createTableColumn({
            columnId: 'actions',
            renderHeaderCell: () => 'Akcje',
            renderCell: (item) => (
                <TableCellLayout>
                    <Button icon={<Edit24Regular />} appearance="subtle" onClick={() => handleEdit(item)} />
                    <Button icon={<Delete24Regular />} appearance="subtle" onClick={() => onDelete(item.id)} />
                </TableCellLayout>
            ),
        }),
    ];

    return (
        <>
            <LocationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={onSave}
                editingLocation={editingLocation}
            />
            <div className={styles.toolbar}>
                <Button appearance="primary" icon={<Add24Regular />} onClick={handleAddNew}>
                    Dodaj lokalizację
                </Button>
            </div>
            {/* Poprawna implementacja DataGrid */}
            <DataGrid
                items={locations}
                columns={columns}
                getRowId={item => item.id}
                resizableColumns
                columnSizingOptions={{
                    name: { idealWidth: 400 },
                    personResponsible: { defaultWidth: 250 },
                    actions: { defaultWidth: 120, minWidth: 100 },
                }}
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
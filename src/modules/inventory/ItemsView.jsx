import React, { useState, useMemo } from 'react';
import { 
    DataGrid, 
    DataGridHeader, 
    DataGridHeaderCell, 
    DataGridRow, 
    DataGridCell, 
    DataGridBody,
    TableCellLayout,
    createTableColumn,
    Button, 
    Input, 
    Field, 
    Dropdown, 
    Option,
    makeStyles, // <-- Dodany import
    tokens,     // <-- Dodany import
    Text,       // <-- Dodany import
} from '@fluentui/react-components';
import { Add24Regular, Edit24Regular, Delete24Regular } from '@fluentui/react-icons';
import ItemModal from './ItemModal';

// --- NOWE STYLE ---
const useStyles = makeStyles({
    toolbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end', // Wyrównujemy do dołu dla spójnej wysokości
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
    field: {
        width: '280px', // Ujednolicona szerokość dla obu pól
    },
    addButton: {
        height: '100%',
        minHeight: '58px', // Zapewnia minimalną wysokość równą polu z etykietą
        paddingTop: tokens.spacingVerticalS,
        paddingBottom: tokens.spacingVerticalS,
    },
    buttonContent: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: tokens.spacingVerticalXS,
    }
});

export default function ItemsView({ items, locations, onSave, onDelete }) {
    const styles = useStyles(); // <-- Inicjalizacja stylów
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState('all');

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const getLocationName = (locationId) => {
        return locations.find(loc => loc.id === locationId)?.name || 'Brak lokalizacji';
    };

    const filteredItems = useMemo(() => {
        if (!items) return [];
        return items.filter(item => {
            const nameMatch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? true;
            const locationMatch = locationFilter === 'all' || item.currentLocationId === locationFilter;
            return nameMatch && locationMatch;
        });
    }, [items, searchTerm, locationFilter]);

    // --- NOWA, POPRAWNA DEFINICJA KOLUMN ---
    const columns = [
        createTableColumn({
            columnId: 'name',
            renderHeaderCell: () => 'Nazwa przedmiotu',
            renderCell: (item) => (
                <TableCellLayout>{item.name}</TableCellLayout>
            ),
        }),
        createTableColumn({
            columnId: 'inventoryNumber',
            renderHeaderCell: () => 'Numer inwentarzowy',
            renderCell: (item) => (
                <TableCellLayout>{item.inventoryNumber || '-'}</TableCellLayout>
            ),
        }),
        createTableColumn({
            columnId: 'purchaseValue',
            renderHeaderCell: () => 'Wartość (PLN)',
            renderCell: (item) => (
                <TableCellLayout>{(item.purchaseValue || 0).toFixed(2)}</TableCellLayout>
            ),
        }),
        createTableColumn({
            columnId: 'currentLocationId',
            renderHeaderCell: () => 'Lokalizacja',
            renderCell: (item) => (
                <TableCellLayout>{getLocationName(item.currentLocationId)}</TableCellLayout>
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
            <ItemModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={onSave}
                editingItem={editingItem}
                locations={locations}
            />
            {/* --- ZAKTUALIZOWANY TOOLBAR --- */}
            <div className={styles.toolbar}>
                <div className={styles.filters}>
                    <Field label="Wyszukaj po nazwie">
                        <Input 
                            className={styles.field} 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                        />
                    </Field>
                    <Field label="Filtruj po lokalizacji">
                        <Dropdown 
                            className={styles.field}
                            value={locations.find(l => l.id === locationFilter)?.name || 'Wszystkie'}
                            onOptionSelect={(_, data) => setLocationFilter(data.optionValue)}
                        >
                            <Option value="all">Wszystkie</Option>
                            {locations.map(loc => (
                                <Option key={loc.id} value={loc.id}>{loc.name}</Option>
                            ))}
                        </Dropdown>
                    </Field>
                </div>
                <Button 
                    className={styles.addButton} 
                    appearance="primary" 
                    onClick={handleAddNew}
                >
                    <div className={styles.buttonContent}>
                        <Add24Regular />
                        <Text>Dodaj sprzęt</Text>
                    </div>
                </Button>
            </div>
            
            {/* --- NOWA, POPRAWNA STRUKTURA DataGrid --- */}
            <DataGrid
                items={filteredItems}
                columns={columns}
                getRowId={item => item.id}
                resizableColumns
                columnSizingOptions={{
                    name: { idealWidth: 350 },
                    purchaseValue: { defaultWidth: 150 },
                    currentLocationId: { defaultWidth: 250 },
                    actions: { defaultWidth: 120, minWidth: 100 },
                }}
            >
                <DataGridHeader>
                    <DataGridRow>
                        {( { renderHeaderCell }) => (
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
import React, { useState, useMemo } from 'react';
import {
    DataGrid, DataGridHeader, DataGridHeaderCell, DataGridRow, DataGridCell, DataGridBody,
    TableCellLayout,
    createTableColumn,
    Button,
    Input,
    Field,
    makeStyles,
    tokens,
} from '@fluentui/react-components';
import { Add24Regular, Edit24Regular, Delete24Regular, Print24Regular, Settings24Regular } from '@fluentui/react-icons';
import CensusItemModal from './CensusItemModal';
import PrintableCensus from './PrintableCensus';

const useStyles = makeStyles({
    toolbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: tokens.spacingVerticalL,
    },
});

export default function CensusDetailsView({ census, censusItems, allItems, locations, onSaveItem, onDeleteItem, onBack, handlePrint, onEditCensus }) { // <-- Dodaj locations i handlePrint
    const styles = useStyles();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCensusItem, setEditingCensusItem] = useState(null);

    const handleEdit = (item) => {
        setEditingCensusItem(item);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingCensusItem(null);
        setIsModalOpen(true);
    };

    // Sprzęt, który POWINIEN być w tej lokalizacji, a jeszcze nie został dodany do spisu
    const suggestedItems = useMemo(() => {
        const addedItemIds = censusItems.map(item => item.masterItemId);
        return allItems.filter(item => item.currentLocationId === census.locationId && !addedItemIds.includes(item.id));
    }, [allItems, censusItems, census.locationId]);

    const handleAddItemFromMasterList = (masterItem) => {
        const newItem = {
            masterItemId: masterItem.id,
            name: masterItem.name,
            unit: 'szt.', // Domyślnie
            quantityFound: 1, // Domyślnie
            pricePerUnit: masterItem.purchaseValue || 0,
        };
        onSaveItem(newItem);
    };

    const handlePrintClick = () => {
        const location = locations.find(l => l.id === census.locationId);
        const title = `Arkusz Spisu z Natury - ${location.name}`;
        const subtitle = `Rok ${census.year}`;
        
        // Ta funkcja jest przekazywana globalnie z App.jsx
        handlePrint('printable-census-content', title, subtitle);
    };

    const columns = [
        createTableColumn({
            columnId: 'name',
            renderHeaderCell: () => 'Nazwa przedmiotu',
            renderCell: (item) => <TableCellLayout>{item.name}</TableCellLayout>,
        }),
        createTableColumn({
            columnId: 'quantity',
            renderHeaderCell: () => 'Ilość',
            renderCell: (item) => <TableCellLayout>{item.quantityFound}</TableCellLayout>,
        }),
        createTableColumn({
            columnId: 'price',
            renderHeaderCell: () => 'Cena jedn.',
            renderCell: (item) => <TableCellLayout>{(item.pricePerUnit || 0).toFixed(2)}</TableCellLayout>,
        }),
        createTableColumn({
            columnId: 'total',
            renderHeaderCell: () => 'Wartość',
            renderCell: (item) => <TableCellLayout>{((item.quantityFound || 0) * (item.pricePerUnit || 0)).toFixed(2)}</TableCellLayout>,
        }),
        createTableColumn({
            columnId: 'actions',
            renderHeaderCell: () => 'Akcje',
            renderCell: (item) => (
                <TableCellLayout>
                    {/* --- ZMIANA TUTAJ --- */}
                    <Button icon={<Edit24Regular />} appearance="subtle" title="Edytuj" onClick={() => handleEdit(item)} />
                    <Button icon={<Delete24Regular />} appearance="subtle" title="Usuń" onClick={() => onDeleteItem(item.id)} />
                </TableCellLayout>
            ),
        }),
    ];

    return (
        <>
            <CensusItemModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={onSaveItem}
                editingItem={editingCensusItem}
            />
            {/* Ukryty komponent do drukowania */}
            <div style={{ display: 'none' }}>
                <PrintableCensus 
                    census={census} 
                    censusItems={censusItems} 
                    location={locations.find(l => l.id === census.locationId)} 
                />
            </div>

            <div className={styles.toolbar}>
                <Button onClick={onBack}>Powrót do listy spisów</Button>
                <div className="flex gap-2">
                    <Button icon={<Print24Regular />} onClick={handlePrintClick}>Drukuj</Button>
                                        <Button icon={<Settings24Regular />} onClick={onEditCensus}>
                        Zarządzaj danymi spisu
                    </Button>
                    <Button appearance="primary" icon={<Add24Regular />} onClick={handleAddNew}>
                        Dodaj pozycję spoza bazy
                    </Button>
                </div>
            </div>

            <h3 className="font-semibold mb-2">Sprzęt do spisania w tej lokalizacji:</h3>
            <div className="flex flex-wrap gap-2 mb-6">
                {suggestedItems.map(item => (
                    <Button key={item.id} size="small" onClick={() => handleAddItemFromMasterList(item)}>
                        {item.name}
                    </Button>
                ))}
                {suggestedItems.length === 0 && <p className="text-sm text-gray-500">Wszystkie sprzęty z bazy dla tej lokalizacji zostały już dodane.</p>}
            </div>

            <DataGrid items={censusItems} columns={columns} getRowId={item => item.id}>
                <DataGridHeader>
                    <DataGridRow>{({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}</DataGridRow>
                </DataGridHeader>
                <DataGridBody>{({ item, rowId }) => <DataGridRow key={rowId}>{({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}</DataGridRow>}</DataGridBody>
            </DataGrid>
        </>
    );
}
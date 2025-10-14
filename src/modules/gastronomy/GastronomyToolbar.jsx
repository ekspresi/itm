import React from 'react';
import {
    Button,
    Input,
    Tooltip,
    Menu,
    MenuTrigger,
    MenuPopover,
    MenuList,
    MenuItem,
} from '@fluentui/react-components';
import {
    Add24Regular,
    Search24Regular,
    ArrowSync24Regular,
    MoreHorizontal24Regular,
    Checkmark24Regular, // <-- NOWA IKONA
    AppsListDetail24Regular, // <-- NOWA IKONA
} from '@fluentui/react-icons';
import GlobalToolbar from '../../components/GlobalToolbar';

export default function GastronomyToolbar({
    onAdd,
    onViewChange,
    currentView,
    onSearchChange,
    searchTerm,
    onMassUpdate,
    onExport,
}) {
    // Helper do wyświetlania ikony "check" przy aktywnej opcji
    const getCheckmark = (view) => (
        currentView === view ? <Checkmark24Regular /> : null
    );

    return (
        <GlobalToolbar>
            <GlobalToolbar.Left>
                <Input
                  contentBefore={<Search24Regular />}
                  placeholder="Filtruj po nazwie..."
                  value={searchTerm}
                  onChange={(e, data) => onSearchChange(data.value)}
                />
                <Tooltip content="Aktualizuj dane z Google" relationship="label">
                    <Button
                        icon={<ArrowSync24Regular />}
                        onClick={onMassUpdate}
                        aria-label="Aktualizuj z Google"
                    />
                </Tooltip>
            </GlobalToolbar.Left>
            <GlobalToolbar.Right>
                {/* ZAMIANA TOGGLEBUTTON NA MENU */}
                <Menu>
                    <MenuTrigger>
                        <Button icon={<AppsListDetail24Regular />}>Widok</Button>
                    </MenuTrigger>
                    <MenuPopover>
                        <MenuList>
                            <MenuItem icon={getCheckmark('list2')} onClick={() => onViewChange('list2')}>
                                Kafelki
                            </MenuItem>
                            <MenuItem icon={getCheckmark('grid')} onClick={() => onViewChange('grid')}>
                                Kafelki 2
                            </MenuItem>
                            <MenuItem icon={getCheckmark('list')} onClick={() => onViewChange('list')}>
                                Lista
                            </MenuItem>
                        </MenuList>
                    </MenuPopover>
                </Menu>

                <Button
                    appearance="primary"
                    icon={<Add24Regular />}
                    onClick={onAdd}
                >
                    Dodaj obiekt
                </Button>
                <Menu>
                    <MenuTrigger>
                        <Button icon={<MoreHorizontal24Regular />} aria-label="Więcej akcji" />
                    </MenuTrigger>
                    <MenuPopover>
                        <MenuList>
                            <MenuItem onClick={onExport}>
                                Eksportuj widok do CSV
                            </MenuItem>
                        </MenuList>
                    </MenuPopover>
                </Menu>
            </GlobalToolbar.Right>
        </GlobalToolbar>
    );
}
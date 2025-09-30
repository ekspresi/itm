import React, { useState } from 'react';
import {
    makeStyles,
    tokens,
    Label,
    Tooltip,
    Toolbar,
    ToolbarButton,
    ToolbarDivider,
    Menu,
    MenuTrigger,
    MenuList,
    MenuItem,
    MenuPopover,
    Input,
    Popover,
    PopoverTrigger,
    PopoverSurface,
    Button,
} from '@fluentui/react-components';
import { Calendar } from '@fluentui/react-calendar-compat';
import { pl } from 'date-fns/locale';
import {
    CalendarMonth24Regular,
    ChevronLeft24Regular,
    ChevronRight24Regular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
    toolbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorNeutralBackground1,
        marginBottom: tokens.spacingVerticalL,
    },
    inputGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
    },
    pickerContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalXXS,
    },
    yearInput: {
        width: '80px',
        '& input': {
            textAlign: 'center',
        },
        '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
            '-webkit-appearance': 'none',
            margin: '0',
        },
        '& input[type=number]': {
            '-moz-appearance': 'textfield',
        },
    },
});

const dayPickerStrings = {
    months: ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'],
    shortMonths: ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'],
    days: ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'],
    shortDays: ['N', 'P', 'W', 'Ś', 'C', 'P', 'S'],
    prevMonthAriaLabel: 'Poprzedni miesiąc',
    nextMonthAriaLabel: 'Następny miesiąc',
    prevYearAriaLabel: 'Poprzedni rok',
    nextYearAriaLabel: 'Następny rok',
};

const formatMonthYearForButton = (dateString) => {
    if (!dateString) return 'Wybierz miesiąc...';
    const date = new Date(dateString + '-02T12:00:00Z');
    return new Intl.DateTimeFormat('pl-PL', { year: 'numeric', month: 'long' }).format(date);
};

const AppToolbar = ({ dateControls, actionButtons }) => {
    const styles = useStyles();
    const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

    const handleMonthSelect = (date) => {
        if (date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            dateControls.onMonthChange(`${year}-${month}`);
            setIsMonthPickerOpen(false);
        }
    };

    const handleMonthChangeByStep = (step) => {
        const currentDate = new Date(dateControls.month + '-02T12:00:00Z');
        currentDate.setMonth(currentDate.getMonth() + step);
        handleMonthSelect(currentDate);
    };

    const handleYearInputChange = (e) => {
        const value = e.target.value;
        if (/^\d{0,4}$/.test(value)) {
            dateControls.onYearChange(value === '' ? new Date().getFullYear() : parseInt(value, 10));
        }
    };

    return (
        <Toolbar className={styles.toolbar}>
            <div className={styles.inputGroup}>
                {dateControls?.type === 'month' && (
                    <>
                        <Label>{dateControls.label || 'Miesiąc:'}</Label>
                        <div className={styles.pickerContainer}>
                            <Tooltip content="Poprzedni miesiąc" relationship="label">
                                <Button icon={<ChevronLeft24Regular />} onClick={() => handleMonthChangeByStep(-1)} appearance="subtle" />
                            </Tooltip>
                            <Popover open={isMonthPickerOpen} onOpenChange={(e, data) => setIsMonthPickerOpen(data.open)}>
                                <PopoverTrigger>
                                    <Button icon={<CalendarMonth24Regular />} appearance="outline">{formatMonthYearForButton(dateControls.month)}</Button>
                                </PopoverTrigger>
                                <PopoverSurface>
                                    <Calendar
                                        value={dateControls.month ? new Date(dateControls.month + '-02T12:00:00Z') : new Date()}
                                        onSelectDate={handleMonthSelect}
                                        strings={dayPickerStrings}
                                        isDayPickerVisible={false}
                                        highlightSelectedMonth={true}
                                        showGoToToday={false}
                                        locale={pl}
                                    />
                                </PopoverSurface>
                            </Popover>
                            <Tooltip content="Następny miesiąc" relationship="label">
                                <Button icon={<ChevronRight24Regular />} onClick={() => handleMonthChangeByStep(1)} appearance="subtle" />
                            </Tooltip>
                        </div>
                    </>
                )}
                {dateControls?.type === 'year' && (
                    <>
                        <Label htmlFor="year-picker">{dateControls.label || 'Rok:'}</Label>
                        <div className={styles.pickerContainer}>
                            <Tooltip content="Poprzedni rok" relationship="label">
                                <Button icon={<ChevronLeft24Regular />} onClick={() => dateControls.onYearChange(dateControls.year - 1)} appearance="subtle" />
                            </Tooltip>
                            <Input
                                type="number"
                                id="year-picker"
                                value={String(dateControls.year)}
                                onChange={handleYearInputChange}
                                className={styles.yearInput}
                            />
                            <Tooltip content="Następny rok" relationship="label">
                                <Button icon={<ChevronRight24Regular />} onClick={() => dateControls.onYearChange(dateControls.year + 1)} appearance="subtle" />
                            </Tooltip>
                        </div>
                    </>
                )}
            </div>
            <div className={styles.inputGroup}>
                {actionButtons.map((group, index) => (
                    <React.Fragment key={index}>
                        {group.map(button => {
                            if (button.menuItems) {
                                return (
                                    <Menu key={button.tooltip}>
                                        <MenuTrigger disableButtonEnhancement>
                                            <Tooltip content={button.tooltip} relationship="label">
                                                <ToolbarButton icon={button.icon} disabled={button.disabled} />
                                            </Tooltip>
                                        </MenuTrigger>
                                        <MenuPopover>
                                            <MenuList>
                                                {button.menuItems.map(item => (
                                                    <MenuItem key={item.label} onClick={item.onClick}>{item.label}</MenuItem>
                                                ))}
                                            </MenuList>
                                        </MenuPopover>
                                    </Menu>
                                );
                            }
                            return (
                                <Tooltip key={button.tooltip} content={button.tooltip} relationship="label">
                                    <ToolbarButton icon={button.icon} onClick={button.onClick} disabled={button.disabled}>
                                        {button.label}
                                    </ToolbarButton>
                                </Tooltip>
                            );
                        })}
                        {index < actionButtons.length - 1 && <ToolbarDivider />}
                    </React.Fragment>
                ))}
            </div>
        </Toolbar>
    );
};

export default AppToolbar;
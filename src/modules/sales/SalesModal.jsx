import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogSurface,
    DialogTitle,
    DialogBody,
    DialogActions,
    DialogContent,
    Button,
    Input,
    Field,
    makeStyles,
    tokens,
} from '@fluentui/react-components';

const useStyles = makeStyles({
    content: {
        display: 'flex',
        flexDirection: 'column',
        rowGap: tokens.spacingVerticalM,
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: tokens.spacingHorizontalM,
    },
});

export default function SalesModal({ isOpen, onClose, onSave, isLoading, existingData, defaultDate }) {
    const styles = useStyles();
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (isOpen) {
            const initialData = {
                id: existingData?.id || null,
                date: existingData?.date || defaultDate || new Date().toISOString().slice(0, 10),
                totalAmount: existingData?.totalAmount || '',
                cardAmount: existingData?.cardAmount || '',
                invoiceAmount: existingData?.invoiceAmount || '',
            };
            setFormData(initialData);
        }
    }, [isOpen, existingData, defaultDate]);

    const cashAmount = useMemo(() => {
        const total = parseFloat(String(formData.totalAmount || '0').replace(',', '.'));
        const card = parseFloat(String(formData.cardAmount || '0').replace(',', '.'));
        const invoice = parseFloat(String(formData.invoiceAmount || '0').replace(',', '.'));
        if (isNaN(total)) return '0.00';
        return (total - card - invoice).toFixed(2);
    }, [formData.totalAmount, formData.cardAmount, formData.invoiceAmount]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(e, data) => !data.open && onClose()}>
            <DialogSurface>
                <form onSubmit={handleSubmit}>
                    <DialogBody>
                        <DialogTitle>{existingData ? 'Edytuj wpis sprzedaży' : 'Dodaj nowy wpis sprzedaży'}</DialogTitle>
                        <DialogContent className={styles.content}>
                            <Field label="Data" required>
                                <Input name="date" type="date" value={formData.date || ''} onChange={handleChange} />
                            </Field>
                            <div className={styles.grid}>
                                <Field label="Kwota sprzedaży (łącznie)" required>
                                    <Input name="totalAmount" type="number" step="0.01" value={formData.totalAmount || ''} onChange={handleChange} />
                                </Field>
                                <Field label="Płatność terminalem">
                                    <Input name="cardAmount" type="number" step="0.01" value={formData.cardAmount || ''} onChange={handleChange} />
                                </Field>
                                <Field label="Płatność przelewem">
                                    <Input name="invoiceAmount" type="number" step="0.01" value={formData.invoiceAmount || ''} onChange={handleChange} />
                                </Field>
                                <Field label="Wyliczono gotówki">
                                    <Input value={cashAmount.replace('.', ',')} readOnly disabled />
                                </Field>
                            </div>
                        </DialogContent>
                        <DialogActions>
                            <Button type="button" appearance="secondary" onClick={onClose} disabled={isLoading}>Anuluj</Button>
                            <Button type="submit" appearance="primary" disabled={isLoading}>
                                {isLoading ? 'Zapisywanie...' : 'Zapisz'}
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </form>
            </DialogSurface>
        </Dialog>
    );
}
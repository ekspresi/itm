import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTrigger,
    DialogSurface,
    DialogTitle,
    DialogBody,
    DialogActions,
    DialogContent,
    Button,
    Input,
    Field,
    makeStyles,
    tokens
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
    content: {
        display: 'flex',
        flexDirection: 'column',
        rowGap: tokens.spacingVerticalM,
    },
     // Style dla siatki
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: tokens.spacingHorizontalM,
    },
});

export default function SettlementModal({ isOpen, onClose, onSave, isLoading, existingData, reportMonth }) {
    const styles = useStyles();
    const [formData, setFormData] = useState({});
    
    const monthName = new Date(reportMonth + '-02').toLocaleString('pl-PL', { month: 'long', year: 'numeric' });

    useEffect(() => {
        if (isOpen) {
            const initialData = {
                purchaseNet: existingData?.purchaseNet || '',
                margin: existingData?.margin || '',
                salesNet: existingData?.salesNet || '',
                vat: existingData?.vat || '',
                salesGross: existingData?.salesGross || '',
                bankDeposit: existingData?.bankDeposit || '',
            };
            setFormData(initialData);
        }
    }, [isOpen, existingData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...formData, settlementMonth: reportMonth });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(e, data) => !data.open && onClose()}>
            <DialogSurface>
                <form onSubmit={handleSubmit}>
                    <DialogBody>
                        <DialogTitle>
                            {existingData ? 'Edytuj' : 'Dodaj'} rozliczenie za {monthName}
                        </DialogTitle>
                        <DialogContent className={styles.content}>
                           <div className={styles.grid}>
                                <Field label="Zakup netto">
                                    <Input name="purchaseNet" value={formData.purchaseNet || ''} onChange={handleChange} type="number" step="0.01" />
                                </Field>
                                <Field label="Marża">
                                    <Input name="margin" value={formData.margin || ''} onChange={handleChange} type="number" step="0.01" />
                                </Field>
                                <Field label="Sprzedaż netto">
                                    <Input name="salesNet" value={formData.salesNet || ''} onChange={handleChange} type="number" step="0.01" />
                                </Field>
                                <Field label="VAT">
                                    <Input name="vat" value={formData.vat || ''} onChange={handleChange} type="number" step="0.01" />
                                </Field>
                                <Field label="Sprzedaż brutto">
                                    <Input name="salesGross" value={formData.salesGross || ''} onChange={handleChange} type="number" step="0.01" />
                                </Field>
                                <Field label="Wpłata bankowa">
                                    <Input name="bankDeposit" value={formData.bankDeposit || ''} onChange={handleChange} type="number" step="0.01" />
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
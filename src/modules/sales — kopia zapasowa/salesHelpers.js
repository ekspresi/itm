export const formatCurrency = (value) => {
    const num = value || 0;
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(num);
};
/** Modelo de dinero del frontend. Espejo del contrato del backend; nunca se calcula un total de negocio aquí salvo previews declarados. */
export interface Money {
  amount: number;
  currency: 'ARS' | 'USD' | 'MXN' | 'EUR';
}

const formatters = new Map<Money['currency'], Intl.NumberFormat>();

/** Única función de formateo de precios de toda la app (DRY): "$8.500". */
export const formatMoney = (money: Money): string => {
  let formatter = formatters.get(money.currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: money.currency,
      maximumFractionDigits: 0,
    });
    formatters.set(money.currency, formatter);
  }
  return formatter.format(money.amount);
};

export const addMoney = (a: Money, b: Money): Money => {
  if (a.currency !== b.currency) {
    throw new Error('Cannot add money with different currencies.');
  }
  return { amount: a.amount + b.amount, currency: a.currency };
};

export const multiplyMoney = (money: Money, factor: number): Money => ({
  amount: money.amount * factor,
  currency: money.currency,
});

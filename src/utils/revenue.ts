import type { ParsedOrder } from './csvParser';

export function isBundleClass(className: string): boolean {
  return className.toLowerCase().includes('bundle');
}

export function getLineItemRevenue(order: ParsedOrder): number {
  return order.orderSubTotal > 0
    ? order.lineItemSubtotal + (order.lineItemSubtotal / order.orderSubTotal) * order.orderTaxAmount
    : order.lineItemSubtotal;
}

export function getTotalOrderRevenue(data: ParsedOrder[]): number {
  const uniqueOrders = new Map<string, number>();
  data.forEach(order => {
    if (!uniqueOrders.has(order.orderId)) {
      uniqueOrders.set(order.orderId, order.orderTotalAmount);
    }
  });
  return Array.from(uniqueOrders.values()).reduce((sum, amount) => sum + amount, 0);
}

export function getClassRevenueBreakdown(data: ParsedOrder[]): {
  bundleRevenue: number;
  nonBundleRevenue: number;
  totalLineItemRevenue: number;
} {
  let bundleRevenue = 0;
  let nonBundleRevenue = 0;

  data.forEach(order => {
    const revenue = getLineItemRevenue(order);
    if (isBundleClass(order.className)) {
      bundleRevenue += revenue;
    } else {
      nonBundleRevenue += revenue;
    }
  });

  return {
    bundleRevenue,
    nonBundleRevenue,
    totalLineItemRevenue: bundleRevenue + nonBundleRevenue
  };
}

export function calculateRevenueMultiplier(
  data: ParsedOrder[],
  targetTotalRevenue: number
): number | null {
  const { bundleRevenue, nonBundleRevenue } = getClassRevenueBreakdown(data);

  if (nonBundleRevenue <= 0) {
    return null;
  }

  const targetNonBundleRevenue = targetTotalRevenue - bundleRevenue;
  if (targetNonBundleRevenue < 0) {
    return null;
  }

  return targetNonBundleRevenue / nonBundleRevenue;
}

function recalculateOrderTotals(orders: ParsedOrder[]): ParsedOrder[] {
  const byOrderId = new Map<string, ParsedOrder[]>();
  orders.forEach(order => {
    const group = byOrderId.get(order.orderId) ?? [];
    group.push(order);
    byOrderId.set(order.orderId, group);
  });

  const result: ParsedOrder[] = [];

  byOrderId.forEach(group => {
    const originalSubTotal = group[0].orderSubTotal;
    const newSubTotal = group.reduce((sum, order) => sum + order.lineItemSubtotal, 0);
    const taxRatio = originalSubTotal > 0 ? newSubTotal / originalSubTotal : 1;
    const newTaxAmount = group[0].orderTaxAmount * taxRatio;
    const newTotalAmount = newSubTotal + newTaxAmount;

    group.forEach(order => {
      result.push({
        ...order,
        orderSubTotal: newSubTotal,
        orderTaxAmount: newTaxAmount,
        orderTotalAmount: newTotalAmount,
        price: order.quantity > 0 ? order.lineItemSubtotal / order.quantity : order.price
      });
    });
  });

  return result;
}

export function applyRevenueOverride(
  data: ParsedOrder[],
  targetTotalRevenue: number | null | undefined
): ParsedOrder[] {
  if (!targetTotalRevenue || data.length === 0) {
    return data;
  }

  const multiplier = calculateRevenueMultiplier(data, targetTotalRevenue);
  if (multiplier === null || multiplier === 1) {
    return data;
  }

  const scaled = data.map(order => {
    if (isBundleClass(order.className)) {
      return order;
    }

    return {
      ...order,
      lineItemSubtotal: order.lineItemSubtotal * multiplier
    };
  });

  return recalculateOrderTotals(scaled);
}

export function getEffectiveTotalRevenue(
  data: ParsedOrder[],
  overrideTotalRevenue: number | null | undefined
): number {
  if (overrideTotalRevenue != null) {
    return overrideTotalRevenue;
  }
  return getTotalOrderRevenue(data);
}

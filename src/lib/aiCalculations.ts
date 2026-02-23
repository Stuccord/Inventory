export interface ProductCalculation {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}

export interface ReorderSuggestion {
  productId: string;
  currentStock: number;
  reorderLevel: number;
  averageDailySales: number;
  suggestedOrderQuantity: number;
  daysUntilStockout: number;
}

export class AICalculator {
  private static TAX_RATE = 0.1;

  static calculateOrderTotal(
    items: Array<{ quantity: number; unit_price: number; discount_percent?: number }>
  ): ProductCalculation {
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unit_price;
      const discount = item.discount_percent
        ? (itemTotal * item.discount_percent) / 100
        : 0;
      return sum + itemTotal - discount;
    }, 0);

    const discount = items.reduce((sum, item) => {
      if (!item.discount_percent) return sum;
      const itemTotal = item.quantity * item.unit_price;
      return sum + (itemTotal * item.discount_percent) / 100;
    }, 0);

    const tax = subtotal * this.TAX_RATE;
    const total = subtotal + tax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  static calculateSaleTotal(
    items: Array<{ quantity: number; selling_price: number }>
  ): ProductCalculation {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.selling_price,
      0
    );

    const tax = subtotal * this.TAX_RATE;
    const total = subtotal + tax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      discount: 0,
      total: Math.round(total * 100) / 100,
    };
  }

  static calculateProfitMargin(costPrice: number, sellingPrice: number): number {
    if (costPrice === 0) return 0;
    const profit = sellingPrice - costPrice;
    const margin = (profit / costPrice) * 100;
    return Math.round(margin * 100) / 100;
  }

  static suggestReorderQuantity(
    currentStock: number,
    reorderLevel: number,
    averageDailySales: number,
    leadTimeDays: number = 7
  ): ReorderSuggestion {
    const daysUntilStockout = averageDailySales > 0
      ? currentStock / averageDailySales
      : Infinity;

    const safetyStock = Math.ceil(averageDailySales * 3);

    const demandDuringLeadTime = Math.ceil(averageDailySales * leadTimeDays);

    const optimalOrderQuantity = demandDuringLeadTime + safetyStock - currentStock;

    const suggestedOrderQuantity = Math.max(
      0,
      Math.ceil(optimalOrderQuantity / 10) * 10
    );

    return {
      productId: '',
      currentStock,
      reorderLevel,
      averageDailySales: Math.round(averageDailySales * 100) / 100,
      suggestedOrderQuantity,
      daysUntilStockout: Math.round(daysUntilStockout * 100) / 100,
    };
  }

  static predictStockout(
    currentStock: number,
    salesData: Array<{ quantity: number; date: string }>
  ): { predictedStockoutDate: Date | null; daysRemaining: number } {
    if (salesData.length === 0) {
      return { predictedStockoutDate: null, daysRemaining: Infinity };
    }

    const totalSales = salesData.reduce((sum, sale) => sum + sale.quantity, 0);
    const averageDailySales = totalSales / salesData.length;

    if (averageDailySales === 0) {
      return { predictedStockoutDate: null, daysRemaining: Infinity };
    }

    const daysRemaining = currentStock / averageDailySales;
    const predictedStockoutDate = new Date();
    predictedStockoutDate.setDate(
      predictedStockoutDate.getDate() + Math.floor(daysRemaining)
    );

    return {
      predictedStockoutDate,
      daysRemaining: Math.round(daysRemaining * 100) / 100,
    };
  }

  static calculateInventoryValue(
    products: Array<{ quantity: number; cost_price: number }>
  ): { totalValue: number; averageCost: number } {
    const totalValue = products.reduce(
      (sum, product) => sum + product.quantity * product.cost_price,
      0
    );

    const totalQuantity = products.reduce(
      (sum, product) => sum + product.quantity,
      0
    );

    const averageCost =
      totalQuantity > 0 ? totalValue / totalQuantity : 0;

    return {
      totalValue: Math.round(totalValue * 100) / 100,
      averageCost: Math.round(averageCost * 100) / 100,
    };
  }

  static optimizeStockLevels(
    products: Array<{
      id: string;
      name: string;
      currentStock: number;
      reorderLevel: number;
      sales: Array<{ quantity: number; date: string }>;
    }>
  ): Array<{
    productId: string;
    productName: string;
    action: 'reorder' | 'reduce' | 'maintain';
    reason: string;
    suggestedQuantity?: number;
  }> {
    return products.map((product) => {
      const totalSales = product.sales.reduce(
        (sum, sale) => sum + sale.quantity,
        0
      );
      const averageDailySales =
        product.sales.length > 0 ? totalSales / product.sales.length : 0;

      const daysOfStockRemaining =
        averageDailySales > 0
          ? product.currentStock / averageDailySales
          : Infinity;

      if (product.currentStock <= product.reorderLevel) {
        const suggestion = this.suggestReorderQuantity(
          product.currentStock,
          product.reorderLevel,
          averageDailySales
        );

        return {
          productId: product.id,
          productName: product.name,
          action: 'reorder',
          reason: `Stock is at or below reorder level (${product.reorderLevel} units). Estimated ${daysOfStockRemaining.toFixed(1)} days of stock remaining.`,
          suggestedQuantity: suggestion.suggestedOrderQuantity,
        };
      }

      if (daysOfStockRemaining > 90 && averageDailySales > 0) {
        return {
          productId: product.id,
          productName: product.name,
          action: 'reduce',
          reason: `Overstocked. Current stock will last ${daysOfStockRemaining.toFixed(0)} days at current sales rate.`,
        };
      }

      return {
        productId: product.id,
        productName: product.name,
        action: 'maintain',
        reason: `Stock levels are optimal. Approximately ${daysOfStockRemaining.toFixed(1)} days of inventory remaining.`,
      };
    });
  }

  static validateInventoryTransaction(
    productStock: number,
    transactionQuantity: number,
    transactionType: 'in' | 'out'
  ): { valid: boolean; message?: string; newStock: number } {
    const newStock =
      transactionType === 'in'
        ? productStock + transactionQuantity
        : productStock - transactionQuantity;

    if (newStock < 0) {
      return {
        valid: false,
        message: `Insufficient stock. Current stock: ${productStock}, Requested: ${transactionQuantity}`,
        newStock: productStock,
      };
    }

    if (newStock > 100000) {
      return {
        valid: false,
        message: `Stock level too high. New stock would be: ${newStock}`,
        newStock: productStock,
      };
    }

    return {
      valid: true,
      newStock,
    };
  }
}

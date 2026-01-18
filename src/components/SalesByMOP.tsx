import React, { useMemo } from 'react';
import { Download, CreditCard, TrendingUp, DollarSign } from 'lucide-react';
import { type ParsedOrder } from '../utils/csvParser';

interface SalesByMOPProps {
  data: ParsedOrder[];
}

export function SalesByMOP({ data }: SalesByMOPProps) {
  const mopStats = useMemo(() => {
    // Group orders by payment method
    const mopMap = new Map<string, {
      method: string;
      orders: Set<string>;
      revenue: number;
      lineItems: number;
    }>();

    data.forEach(order => {
      const method = order.paymentMethod || 'Unknown';
      
      if (!mopMap.has(method)) {
        mopMap.set(method, {
          method,
          orders: new Set<string>(),
          revenue: 0,
          lineItems: 0
        });
      }

      const stats = mopMap.get(method)!;
      stats.orders.add(order.orderId);
      
      // Calculate proportional revenue for this line item
      const lineItemRevenueContribution = order.orderSubTotal > 0 
        ? order.lineItemSubtotal + (order.lineItemSubtotal / order.orderSubTotal) * order.orderTaxAmount
        : order.lineItemSubtotal;
      
      stats.revenue += lineItemRevenueContribution;
      stats.lineItems += order.quantity;
    });

    // Convert to array and sort by revenue
    const statsArray = Array.from(mopMap.values())
      .map(stat => ({
        ...stat,
        orderCount: stat.orders.size
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Calculate total revenue for percentages
    const totalRevenue = statsArray.reduce((sum, stat) => sum + stat.revenue, 0);

    return {
      stats: statsArray,
      totalRevenue,
      totalOrders: new Set(data.map(o => o.orderId)).size
    };
  }, [data]);

  const exportMOPData = () => {
    const csvContent = [
      'Payment Method,Order Count,Line Items,Revenue,Percentage of Total',
      ...mopStats.stats.map(stat => 
        `"${stat.method}",${stat.orderCount},${stat.lineItems},$${stat.revenue.toFixed(2)},${((stat.revenue / mopStats.totalRevenue) * 100).toFixed(2)}%`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ebony-fit-sales-by-mop.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getMethodIcon = (method: string) => {
    const lowerMethod = method.toLowerCase();
    if (lowerMethod.includes('card') || lowerMethod.includes('credit') || lowerMethod.includes('debit')) {
      return '💳';
    } else if (lowerMethod.includes('klarna')) {
      return '🛒';
    } else if (lowerMethod.includes('afterpay')) {
      return '📱';
    } else if (lowerMethod.includes('cashapp') || lowerMethod.includes('cash app')) {
      return '💵';
    } else if (lowerMethod.includes('paypal')) {
      return '🔵';
    } else if (lowerMethod.includes('venmo')) {
      return '💚';
    }
    return '💳';
  };

  const getMethodColor = (method: string) => {
    const lowerMethod = method.toLowerCase();
    if (lowerMethod.includes('card') || lowerMethod.includes('credit') || lowerMethod.includes('debit')) {
      return 'bg-blue-100 text-blue-800';
    } else if (lowerMethod.includes('klarna')) {
      return 'bg-pink-100 text-pink-800';
    } else if (lowerMethod.includes('afterpay')) {
      return 'bg-purple-100 text-purple-800';
    } else if (lowerMethod.includes('cashapp') || lowerMethod.includes('cash app')) {
      return 'bg-green-100 text-green-800';
    } else if (lowerMethod.includes('paypal')) {
      return 'bg-indigo-100 text-indigo-800';
    } else if (lowerMethod.includes('venmo')) {
      return 'bg-teal-100 text-teal-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sales by Method of Payment</h2>
            <p className="text-gray-600 mt-1">Revenue breakdown by payment method</p>
          </div>
          <button
            onClick={exportMOPData}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-blue-800">Total Revenue</p>
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-900">
              ${mopStats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-purple-800">Total Orders</p>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-900">
              {mopStats.totalOrders.toLocaleString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-green-800">Payment Methods</p>
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-900">
              {mopStats.stats.length}
            </p>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="space-y-4">
          {mopStats.stats.map((stat, index) => {
            const percentage = (stat.revenue / mopStats.totalRevenue) * 100;
            return (
              <div
                key={stat.method}
                className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors duration-200 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg ${getMethodColor(stat.method)} flex items-center justify-center text-2xl`}>
                      {getMethodIcon(stat.method)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{stat.method}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{stat.orderCount} orders</span>
                        <span>•</span>
                        <span>{stat.lineItems} items</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      ${stat.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{percentage.toFixed(1)}% of total</p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${getMethodColor(stat.method).replace('text-', 'bg-').replace('-800', '-600')}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {mopStats.stats.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Method Data</h3>
            <p className="text-gray-600">
              Payment method information is not available in the uploaded data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

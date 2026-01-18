import React, { useMemo, useState } from 'react';
import { Download, Mail, Phone, Star, Users } from 'lucide-react';
import { type ParsedOrder } from '../utils/csvParser';

interface MultiPurchaseCustomersProps {
  data: ParsedOrder[];
}

export function MultiPurchaseCustomers({ data }: MultiPurchaseCustomersProps) {
  const [minClasses, setMinClasses] = useState(2);

  const multiPurchaseData = useMemo(() => {
    const customerMap = data.reduce((acc, order) => {
      const key = `${order.customerEmail}`;
      if (!acc[key]) {
        acc[key] = {
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          classes: new Set<string>(),
          orders: [],
          totalSpent: 0,
          totalTickets: 0
        };
      }
      
      acc[key].classes.add(order.className);
      acc[key].orders.push(order);
      
      // Calculate proportional revenue for this line item
      const lineItemRevenueContribution = order.orderSubTotal > 0 
        ? order.lineItemSubtotal + (order.lineItemSubtotal / order.orderSubTotal) * order.orderTaxAmount
        : order.lineItemSubtotal;
      
      acc[key].totalSpent += lineItemRevenueContribution;
      acc[key].totalTickets += order.quantity;
      
      return acc;
    }, {} as Record<string, {
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      classes: Set<string>;
      orders: ParsedOrder[];
      totalSpent: number;
      totalTickets: number;
    }>);

    return Object.values(customerMap)
      .filter(customer => customer.classes.size >= minClasses)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .map(customer => ({
        ...customer,
        classCount: customer.classes.size,
        classNames: Array.from(customer.classes)
      }));
  }, [data, minClasses]);

  const exportMultiPurchaseData = () => {
    const csvContent = [
      'Customer Name,Email,Phone,Classes Count,Total Spent,Total Tickets,Class Names',
      ...multiPurchaseData.map(customer => 
        `"${customer.customerName}","${customer.customerEmail}","${customer.customerPhone}",${customer.classCount},$${customer.totalSpent.toFixed(2)},${customer.totalTickets},"${customer.classNames.join('; ')}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ebony-fit-multi-purchase-customers.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Multi-Purchase Customers</h2>
            <p className="text-gray-600">Customers who purchased tickets for multiple classes</p>
          </div>
          <button
            onClick={exportMultiPurchaseData}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            <Download className="w-4 h-4" />
            <span>Export List</span>
          </button>
        </div>

        <div className="flex items-center space-x-4 mb-4">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <span>Minimum classes:</span>
            <select
              value={minClasses}
              onChange={(e) => setMinClasses(Number(e.target.value))}
              className="border border-gray-200 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={2}>2+</option>
              <option value={3}>3+</option>
              <option value={4}>4+</option>
              <option value={5}>5+</option>
            </select>
          </label>
          <div className="text-sm text-gray-600">
            {multiPurchaseData.length} customers found
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">VIP Customers</span>
            </div>
            <p className="text-2xl font-bold text-purple-900 mt-1">
              {multiPurchaseData.filter(c => c.classCount >= 5).length}
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-blue-800">Avg Classes per Customer</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">
              {multiPurchaseData.length > 0 
                ? (multiPurchaseData.reduce((sum, c) => sum + c.classCount, 0) / multiPurchaseData.length).toFixed(1)
                : '0'
              }
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-green-800">Total Revenue</p>
            <p className="text-2xl font-bold text-green-900 mt-1">
              ${multiPurchaseData.reduce((sum, c) => sum + c.totalSpent, 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-orange-800">Avg Spend per Customer</p>
            <p className="text-2xl font-bold text-orange-900 mt-1">
              ${multiPurchaseData.length > 0 
                ? (multiPurchaseData.reduce((sum, c) => sum + c.totalSpent, 0) / multiPurchaseData.length).toFixed(2)
                : '0.00'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {multiPurchaseData.map((customer) => (
          <div key={customer.customerEmail} className="p-6 hover:bg-gray-50 transition-colors duration-150">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="font-semibold text-gray-900">{customer.customerName}</h4>
                  {customer.classCount >= 5 && (
                    <span className="inline-flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                      <Star className="w-3 h-3" />
                      <span>VIP</span>
                    </span>
                  )}
                </div>
                
                <div className="space-y-1 mb-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{customer.customerEmail}</span>
                  </div>
                  {customer.customerPhone && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{customer.customerPhone}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-900">Classes Purchased:</h5>
                  <div className="flex flex-wrap gap-2">
                    {customer.classNames.map((className, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                      >
                        {className}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-right ml-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">{customer.classCount} classes</p>
                  <p className="text-sm text-gray-600">{customer.totalTickets} tickets</p>
                  <p className="text-lg font-semibold text-gray-900">${customer.totalSpent.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {multiPurchaseData.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Multi-Purchase Customers Found</h3>
          <p className="text-gray-600">
            No customers have purchased {minClasses}+ classes yet.
          </p>
        </div>
      )}
    </div>
  );
}
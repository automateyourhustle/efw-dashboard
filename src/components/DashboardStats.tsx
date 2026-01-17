import React from 'react';
import { DollarSign, Users, ShoppingBag, TrendingUp } from 'lucide-react';
import { type ParsedOrder } from '../utils/csvParser';

interface DashboardStatsProps {
  data: ParsedOrder[];
}

export function DashboardStats({ data }: DashboardStatsProps) {
  const stats = React.useMemo(() => {
    // Calculate total revenue by summing unique order totals
    const uniqueOrders = new Map<string, number>();
    data.forEach(order => {
      if (!uniqueOrders.has(order.orderId)) {
        uniqueOrders.set(order.orderId, order.orderTotalAmount);
      }
    });
    const totalRevenue = Array.from(uniqueOrders.values()).reduce((sum, amount) => sum + amount, 0);
    
    const totalQuantity = data.reduce((sum, order) => sum + order.quantity, 0);
    const uniqueCustomers = new Set(data.map(order => order.customerEmail)).size;
    const uniqueClasses = new Set(data.map(order => order.className)).size;

    // Calculate revenue per class using proportional allocation
    const classStats = data.reduce((acc, order) => {
      const className = order.className;
      if (!acc[className]) {
        acc[className] = { quantity: 0, revenue: 0 };
      }
      acc[className].quantity += order.quantity;
      
      // Calculate proportional revenue for this line item
      const lineItemRevenueContribution = order.orderSubTotal > 0 
        ? order.lineItemSubtotal + (order.lineItemSubtotal / order.orderSubTotal) * order.orderTaxAmount
        : order.lineItemSubtotal;
      
      acc[className].revenue += lineItemRevenueContribution;
      return acc;
    }, {} as Record<string, { quantity: number; revenue: number }>);

    const topClasses = Object.entries(classStats)
      .filter(([className]) => !className.toLowerCase().includes('bundle'))
      .sort(([, a], [, b]) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalRevenue,
      totalQuantity,
      uniqueCustomers,
      uniqueClasses,
      topClasses,
      classStats
    };
  }, [data]);

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Total Tickets Sold',
      value: stats.totalQuantity.toLocaleString(),
      icon: ShoppingBag,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Unique Customers',
      value: stats.uniqueCustomers.toLocaleString(),
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Total Classes',
      value: stats.uniqueClasses.toLocaleString(),
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Sales Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <div key={stat.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Top 5 Classes by Tickets Sold</h3>
        <div className="space-y-4">
          {stats.topClasses.map(([className, classData], index) => (
            <div key={className} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{className}</h4>
                  <p className="text-sm text-gray-600">
                    {classData.quantity} tickets • ${classData.revenue.toFixed(2)} revenue
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{classData.quantity} sold</p>
                  <p className="text-sm text-gray-600">${classData.revenue.toFixed(2)}</p>
                </div>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(classData.quantity / stats.topClasses[0][1].quantity) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
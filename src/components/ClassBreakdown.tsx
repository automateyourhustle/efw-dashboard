import React, { useState, useMemo } from 'react';
import { Search, SortAsc, SortDesc, Download } from 'lucide-react';
import { type ParsedOrder } from '../utils/csvParser';

interface ClassBreakdownProps {
  data: ParsedOrder[];
  userRole?: 'master' | 'team';
}

// Complete list of Atlanta classes
const ATLANTA_CLASSES = [
  'GO GET IT CALESTHITICS',
  'FOU BRUNCH BOOTCAMP',
  'NEXT LEVEL BOOT CAMP',
  'SUNDAY SERVICE',
  'TRAP YOGA',
  'EBONY FIT DEADLIFT PARTY',
  'POWER HOUR',
  'BODY BLAST DRIP CHECK',
  'BOXING MITT CAMP',
  'PEACH CAMP',
  'BANDS & BADDIES',
  'KEDDLESTHENICS',
  'CLIMATE CONTROL',
  'ONLY YAMS GLUTE CAMP',
  'SPIN CLASS',
  'TRAP MOBILITY',
  'HYPE HIIT',
  'TRAP BOXING',
  'BRICK FIT',
  'TWERK FIT, GIRLS NIGHT OUT',
  'VIP LOUNGE',
  'CLASS TICKET BUNDLES - 2 Class Ticket Bundle',
  'CLASS TICKET BUNDLES - 3 Class Ticket Bundle',
  'CLASS TICKET BUNDLES - 4 Class Ticket Bundle'
];

// Complete list of Houston classes
const HOUSTON_CLASSES = [
  'CLASS TICKET BUNDLES - 2 Class Ticket Bundle',
  'CLASS TICKET BUNDLES - 3 Class Ticket Bundle',
  'CLASS TICKET BUNDLES - 4 Class Ticket Bundle',
  'VIP LOUNGE',
  'FAMILY & FRIENDS LIFT PARTY',
  'AFRO BEAT BOOTCAMP',
  'TRAP SCULPT & MOBILITY',
  'GLUTE CAMP',
  'HTX - NORTHSIDE VS SOUTHSIDE',
  'ONLY YAMS',
  'STEP WITH MARSHE',
  'POWER HOUR',
  'BRICK WIT RINA',
  'EBONY FIT DEADLIFT PARTY',
  'TRAP YOGA',
  'RECOMP BOOTCAMP',
  'LINE DANCE LAB',
  'BEAT BOXING BOOTCAMP',
  'EBONY FIT CLOSE OUT'
];

export function ClassBreakdown({ data, userRole }: ClassBreakdownProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'quantity' | 'revenue'>('quantity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const isMaster = userRole === 'master';

  const classStats = useMemo(() => {
    // First, determine which city this data is for
    const isAtlantaData = data.some(order => 
      order.sourceName === 'Ebony Fit Weekend - Atlanta'
    );
    const isHoustonData = data.some(order => 
      order.sourceName === 'Ebony Fit Weekend - Houston'
    );
    
    // Initialize stats with all classes (for Atlanta/Houston) or empty object (for DC)
    const initialStats: Record<string, {
      name: string;
      quantity: number;
      revenue: number;
      customers: Set<string>;
      orders: ParsedOrder[];
    }> = {};
    
    if (isAtlantaData) {
      // For Atlanta, initialize all classes with zero values
      ATLANTA_CLASSES.forEach(className => {
        initialStats[className] = {
          name: className,
          quantity: 0,
          revenue: 0,
          customers: new Set<string>(),
          orders: []
        };
      });
    } else if (isHoustonData) {
      // For Houston, initialize all classes with zero values
      HOUSTON_CLASSES.forEach(className => {
        initialStats[className] = {
          name: className,
          quantity: 0,
          revenue: 0,
          customers: new Set<string>(),
          orders: []
        };
      });
    }
    
    const stats = data.reduce((acc, order) => {
      const className = order.className;
      if (!acc[className]) {
        acc[className] = {
          name: className,
          quantity: 0,
          revenue: 0,
          customers: new Set<string>(),
          orders: []
        };
      }
      acc[className].quantity += order.quantity;
      
      // Calculate proportional revenue for this line item
      const lineItemRevenueContribution = order.orderSubTotal > 0 
        ? order.lineItemSubtotal + (order.lineItemSubtotal / order.orderSubTotal) * order.orderTaxAmount
        : order.lineItemSubtotal;
      
      acc[className].revenue += lineItemRevenueContribution;
      acc[className].customers.add(order.customerEmail);
      acc[className].orders.push(order);
      return acc;
    }, initialStats);

    return Object.values(stats).map(stat => ({
      ...stat,
      uniqueCustomers: stat.customers.size
    }));
  }, [data]);

  const filteredAndSortedClasses = useMemo(() => {
    let filtered = classStats.filter(cls =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue: string | number, bValue: string | number;
      
      switch (sortField) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'revenue':
          aValue = a.revenue;
          bValue = b.revenue;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return filtered;
  }, [classStats, searchTerm, sortField, sortOrder]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const exportClassData = () => {
    const headers = isMaster 
      ? 'Class Name,Tickets Sold,Revenue,Unique Customers,Average per Customer'
      : 'Class Name,Tickets Sold,Unique Customers';
    
    const rows = filteredAndSortedClasses.map(cls => 
      isMaster 
        ? `"${cls.name}",${cls.quantity},$${cls.revenue.toFixed(2)},${cls.uniqueCustomers},$${(cls.revenue / cls.uniqueCustomers).toFixed(2)}`
        : `"${cls.name}",${cls.quantity},${cls.uniqueCustomers}`
    );

    const csvContent = [headers, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ebony-fit-class-breakdown.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {isMaster ? 'Class Performance Breakdown' : 'Class Breakdown'}
          </h2>
          <button
            onClick={exportClassData}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left py-3 px-6">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <span>Class Name</span>
                  {sortField === 'name' && (
                    sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="text-right py-3 px-6">
                <button
                  onClick={() => handleSort('quantity')}
                  className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <span>Tickets Sold</span>
                  {sortField === 'quantity' && (
                    sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                  )}
                </button>
              </th>
              {isMaster && (
                <th className="text-right py-3 px-6">
                  <button
                    onClick={() => handleSort('revenue')}
                    className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    <span>Revenue</span>
                    {sortField === 'revenue' && (
                      sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </button>
                </th>
              )}
              <th className="text-right py-3 px-6">
                <span className="text-sm font-medium text-gray-700">Unique Customers</span>
              </th>
              {isMaster && (
                <th className="text-right py-3 px-6">
                  <span className="text-sm font-medium text-gray-700">Avg per Customer</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredAndSortedClasses.map((cls) => (
              <tr key={cls.name} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="py-4 px-6">
                  <div className="font-medium text-gray-900">{cls.name}</div>
                </td>
                <td className="py-4 px-6 text-right">
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {cls.quantity}
                  </span>
                </td>
                {isMaster && (
                  <td className="py-4 px-6 text-right font-medium text-gray-900">
                    ${cls.revenue.toFixed(2)}
                  </td>
                )}
                <td className="py-4 px-6 text-right text-gray-600">
                  {cls.uniqueCustomers}
                </td>
                {isMaster && (
                  <td className="py-4 px-6 text-right text-gray-600">
                    ${(cls.revenue / cls.uniqueCustomers).toFixed(2)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedClasses.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No classes found matching your search.</p>
        </div>
      )}
    </div>
  );
}
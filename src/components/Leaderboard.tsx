import React, { useState, useMemo } from 'react';
import { Trophy, Medal, Award, Download, Search, SortAsc, SortDesc } from 'lucide-react';
import { type ParsedOrder } from '../utils/csvParser';

interface LeaderboardProps {
  data: ParsedOrder[];
  userRole?: 'master' | 'team';
}

export function Leaderboard({ data, userRole }: LeaderboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'quantity' | 'revenue' | 'customers'>('quantity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const isMaster = userRole === 'master';

  const leaderboardData = useMemo(() => {
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
    }, {} as Record<string, {
      name: string;
      quantity: number;
      revenue: number;
      customers: Set<string>;
      orders: ParsedOrder[];
    }>);

    return Object.values(stats)
      .filter(stat => !stat.name.toLowerCase().includes('bundle'))
      .map((stat, index) => ({
        ...stat,
        uniqueCustomers: stat.customers.size,
        rank: index + 1
      }));
  }, [data]);

  const filteredAndSortedClasses = useMemo(() => {
    let filtered = leaderboardData.filter(cls =>
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
        case 'customers':
          aValue = a.uniqueCustomers;
          bValue = b.uniqueCustomers;
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

    // Update ranks based on current sort
    return filtered.map((cls, index) => ({
      ...cls,
      rank: index + 1
    }));
  }, [leaderboardData, searchTerm, sortField, sortOrder]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const exportLeaderboard = () => {
    const headers = isMaster 
      ? 'Rank,Class Name,Tickets Sold,Revenue,Unique Customers,Average per Customer'
      : 'Rank,Class Name,Tickets Sold,Unique Customers';
    
    const rows = filteredAndSortedClasses.map(cls => 
      isMaster 
        ? `${cls.rank},"${cls.name}",${cls.quantity},$${cls.revenue.toFixed(2)},${cls.uniqueCustomers},$${(cls.revenue / cls.uniqueCustomers).toFixed(2)}`
        : `${cls.rank},"${cls.name}",${cls.quantity},${cls.uniqueCustomers}`
    );

    const csvContent = [headers, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ebony-fit-class-leaderboard.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return null;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (rank === 2) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (rank === 3) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (rank <= 10) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-50 text-gray-600 border-gray-200';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Class Leaderboard</h2>
            <p className="text-gray-600">Complete ranking of all classes by performance</p>
          </div>
          <button
            onClick={exportLeaderboard}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="text-sm text-gray-600">
            {filteredAndSortedClasses.length} classes
          </div>
        </div>

        {/* Top 3 Podium */}
        {filteredAndSortedClasses.length >= 3 && sortField === 'quantity' && sortOrder === 'desc' && !searchTerm && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* 2nd Place */}
            <div className="text-center">
              <div className="bg-gray-100 rounded-lg p-4 mb-2">
                <Medal className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-600">2</div>
              </div>
              <h4 className="font-medium text-gray-900 text-sm mb-1">{filteredAndSortedClasses[1].name}</h4>
              <p className="text-sm text-gray-600">{filteredAndSortedClasses[1].quantity} tickets</p>
              {isMaster && <p className="text-xs text-gray-500">${filteredAndSortedClasses[1].revenue.toFixed(2)}</p>}
            </div>

            {/* 1st Place */}
            <div className="text-center">
              <div className="bg-yellow-100 rounded-lg p-4 mb-2 border-2 border-yellow-200">
                <Trophy className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
                <div className="text-3xl font-bold text-yellow-600">1</div>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{filteredAndSortedClasses[0].name}</h4>
              <p className="text-sm text-gray-600 font-medium">{filteredAndSortedClasses[0].quantity} tickets</p>
              {isMaster && <p className="text-xs text-gray-500">${filteredAndSortedClasses[0].revenue.toFixed(2)}</p>}
            </div>

            {/* 3rd Place */}
            <div className="text-center">
              <div className="bg-amber-100 rounded-lg p-4 mb-2">
                <Award className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-amber-600">3</div>
              </div>
              <h4 className="font-medium text-gray-900 text-sm mb-1">{filteredAndSortedClasses[2].name}</h4>
              <p className="text-sm text-gray-600">{filteredAndSortedClasses[2].quantity} tickets</p>
              {isMaster && <p className="text-xs text-gray-500">${filteredAndSortedClasses[2].revenue.toFixed(2)}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left py-3 px-6">
                <span className="text-sm font-medium text-gray-700">Rank</span>
              </th>
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
                <button
                  onClick={() => handleSort('customers')}
                  className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <span>Unique Customers</span>
                  {sortField === 'customers' && (
                    sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                  )}
                </button>
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
                  <div className="flex items-center space-x-2">
                    {getRankIcon(cls.rank)}
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-sm font-medium ${getRankBadgeColor(cls.rank)}`}>
                      {cls.rank}
                    </span>
                  </div>
                </td>
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
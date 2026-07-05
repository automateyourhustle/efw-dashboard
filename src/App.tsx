import React, { useState, useMemo } from 'react';
import { Upload, BarChart3, Users, DollarSign, Filter, LogOut, Trophy, AlertCircle, CreditCard, Shield } from 'lucide-react';
import { LoginScreen } from './components/LoginScreen';
import { CitySelector } from './components/CitySelector';
import { DataUploader } from './components/DataUploader';
import { DashboardStats } from './components/DashboardStats';
import { ClassBreakdown } from './components/ClassBreakdown';
import { CustomerLists } from './components/CustomerLists';
import { MultiPurchaseCustomers } from './components/MultiPurchaseCustomers';
import { Leaderboard } from './components/Leaderboard';
import { SalesByMOP } from './components/SalesByMOP';
import { AdminPanel } from './components/AdminPanel';
import { useAuth } from './hooks/useAuth';
import { useOrderData } from './hooks/useOrderData';
import { useCityOverrides } from './hooks/useCityOverrides';
import { applyRevenueOverride } from './utils/revenue';
import type { City } from './types/auth';
import { hasMasterAccess, isSuperAdmin as checkIsSuperAdmin } from './types/auth';

function App() {
  const { isAuthenticated, user, login, logout, selectCity } = useAuth();
  const { data: csvData, isLoading: isOrderLoading, error, uploadData, lastUpdated, fileName } = useOrderData(user?.selectedCity);
  const { overrides, isLoading: isOverrideLoading, saveOverrides, clearOverrides } = useCityOverrides(user?.selectedCity);
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'leaderboard' | 'customers' | 'multi' | 'mop' | 'admin'>('overview');
  const [showUploader, setShowUploader] = useState(false);
  const cityDisplayName: Record<City, string> = {
    dc: 'DC',
    dc2026: 'DC',
    atlanta: 'Atlanta',
    houston: 'Houston',
    charlotte: 'Charlotte'
  };
  const cityYear: Record<City, string> = {
    dc: '2025',
    dc2026: '2026',
    atlanta: '2025',
    houston: '2026',
    charlotte: '2026'
  };
  const cityLabel = `${cityDisplayName[user?.selectedCity ?? 'dc']} ${cityYear[user?.selectedCity ?? 'dc']}`;

  const displayData = useMemo(
    () => applyRevenueOverride(csvData, overrides?.overrideTotalRevenue),
    [csvData, overrides?.overrideTotalRevenue]
  );
  const displayLastUpdated = overrides?.overrideLastUpdated ?? lastUpdated;

  const hasData = csvData.length > 0;
  const isLoading = isOrderLoading || isOverrideLoading;
  const isMaster = hasMasterAccess(user?.role);
  const isSuperAdmin = checkIsSuperAdmin(user?.role);
  const isTeam = user?.role === 'team';

  const handleDataUpload = async (csvText: string, fileName?: string) => {
    const result = await uploadData(csvText, fileName);
    if (result.success) {
      setShowUploader(false);
    }
    return result;
  };

  // Set default tab based on user role
  React.useEffect(() => {
    if (isTeam && activeTab === 'overview' && hasData) {
      setActiveTab('classes');
    } else if (isMaster && hasData && activeTab === 'customers' && !localStorage.getItem('manual-tab-selection')) {
      setActiveTab('overview');
    }
  }, [isTeam, isMaster, hasData]);

  const handleTabChange = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
    localStorage.setItem('manual-tab-selection', 'true');
  };

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} />;
  }

  // Show city selector if no city is selected
  if (!user?.selectedCity) {
    return <CitySelector onCitySelect={selectCity} />;
  }
  // Filter tabs based on user role
  const allTabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3, masterOnly: true, requiresData: true },
    { id: 'classes' as const, label: 'Class Breakdown', icon: Filter, requiresData: true },
    { id: 'leaderboard' as const, label: 'Leaderboard', icon: Trophy, requiresData: true },
    { id: 'customers' as const, label: 'Customer Lists', icon: Users, requiresData: true },
    { id: 'multi' as const, label: 'Multi-Purchase', icon: DollarSign, masterOnly: true, requiresData: true },
    { id: 'mop' as const, label: 'Sales by MOP', icon: CreditCard, masterOnly: true, requiresData: true },
    { id: 'admin' as const, label: 'Admin', icon: Shield, superAdminOnly: true, requiresData: false },
  ];

  const tabs = allTabs.filter(tab => {
    if ('superAdminOnly' in tab && tab.superAdminOnly && !isSuperAdmin) return false;
    if ('masterOnly' in tab && tab.masterOnly && !isMaster) return false;
    if (tab.requiresData && !hasData) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 sm:h-16 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                  Ebony Fit Weekend - {cityDisplayName[user?.selectedCity ?? 'dc']} {cityYear[user?.selectedCity ?? 'dc']}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  {cityDisplayName[user?.selectedCity ?? 'dc']} Event Dashboard
                  {isSuperAdmin ? ' • Super Admin Access' : user?.role === 'master' ? ' • Master Access' : user?.role === 'team' ? ' • Team Access' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4">
              {displayLastUpdated && (
                <div className="text-xs sm:text-sm text-gray-600">
                  Updated: {new Date(displayLastUpdated).toLocaleDateString()} at {new Date(displayLastUpdated).toLocaleTimeString('en-US', {
                    timeZone: 'America/New_York',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })} EST
                </div>
              )}
              <div className="flex items-center space-x-2 sm:space-x-3">
                {user?.selectedCity && (
                  <select
                    onChange={(e) => selectCity(e.target.value as City)}
                    value={user.selectedCity}
                    className="inline-flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors duration-200 text-xs sm:text-sm border-none cursor-pointer appearance-none bg-no-repeat bg-right pr-8"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundPosition: 'right 0.5rem center',
                      paddingRight: '2rem'
                    }}
                  >
                    <option value="dc" className="bg-white text-gray-900">DC 2025</option>
                    <option value="dc2026" className="bg-white text-gray-900">DC 2026</option>
                    <option value="atlanta" className="bg-white text-gray-900">Atlanta 2025</option>
                    <option value="houston" className="bg-white text-gray-900">Houston 2026</option>
                    <option value="charlotte" className="bg-white text-gray-900">Charlotte 2026</option>
                  </select>
                )}
                <button
                  onClick={() => setShowUploader(!showUploader)}
                  className="inline-flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 text-xs sm:text-sm"
                >
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">{hasData ? 'Update' : 'Upload'}</span>
                  <span className="xs:hidden">Data</span>
                </button>
                {isSuperAdmin && (
                  <button
                    onClick={() => handleTabChange('admin')}
                    className={`inline-flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 font-medium rounded-lg transition-colors duration-200 text-xs sm:text-sm ${
                      activeTab === 'admin'
                        ? 'bg-purple-700 text-white'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </button>
                )}
                <button
                  onClick={logout}
                  className="inline-flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors duration-200 text-xs sm:text-sm"
                >
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 text-red-600 mt-0.5">⚠️</div>
              <div>
                <h4 className="text-sm font-medium text-red-900">Error</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-900">Error</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {showUploader && (
          <div className="mb-8">
            <DataUploader onDataUpload={handleDataUpload} hasExistingData={hasData} />
          </div>
        )}

        {!hasData && !showUploader && activeTab !== 'admin' ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Data Available</h2>
              <p className="text-gray-600">
                Click "Upload Data" to load your Ebony Fit Weekend {cityDisplayName[user?.selectedCity ?? 'dc']} order CSV file and view comprehensive analytics.
              </p>
            </div>
            <div className="text-center">
              <button
                onClick={() => setShowUploader(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Upload className="w-5 h-5" />
                <span>Upload CSV File</span>
              </button>
            </div>
          </div>
        ) : (
          (hasData || activeTab === 'admin') && (
          <div className="space-y-8">
            <nav className="mb-8">
              <div className="bg-white p-1 rounded-lg shadow-sm">
                <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => handleTabChange(id)}
                    className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                      activeTab === id
                        ? 'bg-blue-100 text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline sm:inline">{label}</span>
                    <span className="xs:hidden sm:hidden">
                      {id === 'overview' ? 'Stats' : 
                       id === 'classes' ? 'Classes' : 
                       id === 'leaderboard' ? 'Ranks' :
                       id === 'customers' ? 'Lists' : 
                       id === 'multi' ? 'Multi' :
                       id === 'mop' ? 'MOP' :
                       'Admin'}
                    </span>
                  </button>
                ))}
                </div>
              </div>
            </nav>

            {activeTab === 'overview' && isMaster && (
              <DashboardStats
                data={displayData}
                overrideTotalRevenue={overrides?.overrideTotalRevenue}
              />
            )}
            {activeTab === 'classes' && <ClassBreakdown data={displayData} userRole={user?.role} />}
            {activeTab === 'leaderboard' && <Leaderboard data={displayData} userRole={user?.role} />}
            {activeTab === 'customers' && <CustomerLists data={displayData} />}
            {activeTab === 'multi' && isMaster && <MultiPurchaseCustomers data={displayData} />}
            {activeTab === 'mop' && isMaster && <SalesByMOP data={displayData} />}
            {activeTab === 'admin' && isSuperAdmin && (
              <AdminPanel
                cityLabel={cityLabel}
                data={csvData}
                rawLastUpdated={lastUpdated}
                overrides={overrides}
                onSave={saveOverrides}
                onClear={clearOverrides}
              />
            )}
          </div>
          )
        )}
      </main>
    </div>
  );
}

export default App;
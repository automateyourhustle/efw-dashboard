import React, { useState, useMemo } from 'react';
import { Upload, BarChart3, Users, DollarSign, FileDown, Search, Filter, LogOut, Trophy, AlertCircle } from 'lucide-react';
import { LoginScreen } from './components/LoginScreen';
import { CitySelector } from './components/CitySelector';
import { DataUploader } from './components/DataUploader';
import { DashboardStats } from './components/DashboardStats';
import { ClassBreakdown } from './components/ClassBreakdown';
import { CustomerLists } from './components/CustomerLists';
import { MultiPurchaseCustomers } from './components/MultiPurchaseCustomers';
import { Leaderboard } from './components/Leaderboard';
import { useAuth } from './hooks/useAuth';
import { useOrderData } from './hooks/useOrderData';
import type { ParsedOrder } from './utils/csvParser';

function App() {
  const { isAuthenticated, user, login, logout, selectCity } = useAuth();
  const { data: csvData, isLoading, error, uploadData, lastUpdated, fileName } = useOrderData(user?.selectedCity);
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'leaderboard' | 'customers' | 'multi'>('overview');
  const [showUploader, setShowUploader] = useState(false);

  const hasData = csvData.length > 0;
  const isMaster = user?.role === 'master';
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
    { id: 'overview' as const, label: 'Overview', icon: BarChart3, masterOnly: true },
    { id: 'classes' as const, label: 'Class Breakdown', icon: Filter },
    { id: 'leaderboard' as const, label: 'Leaderboard', icon: Trophy },
    { id: 'customers' as const, label: 'Customer Lists', icon: Users },
    { id: 'multi' as const, label: 'Multi-Purchase', icon: DollarSign, masterOnly: true },
  ];

  const tabs = allTabs.filter(tab => isMaster || !tab.masterOnly);

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
                  Ebony Fit Weekend - {user?.selectedCity === 'dc' ? 'DC' : 'Atlanta'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  {user?.selectedCity === 'dc' ? 'DC' : 'Atlanta'} Event Dashboard{user?.role === 'master' ? ' • Master Access' : user?.role === 'team' ? ' • Team Access' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4">
              {hasData && (
                <div className="text-left sm:text-right">
                  {lastUpdated && (
                    <div className="text-xs sm:text-sm text-gray-600">
                      Updated: {new Date(lastUpdated).toLocaleDateString()} at {new Date(lastUpdated).toLocaleTimeString('en-US', {
                        timeZone: 'America/New_York',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })} EST
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <button
                  onClick={() => selectCity(user?.selectedCity === 'dc' ? 'atlanta' : 'dc')}
                  className="inline-flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors duration-200 text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Switch to {user?.selectedCity === 'dc' ? 'Atlanta' : 'DC'}</span>
                  <span className="sm:hidden">{user?.selectedCity === 'dc' ? 'ATL' : 'DC'}</span>
                </button>
                <button
                  onClick={() => setShowUploader(!showUploader)}
                  className="inline-flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 text-xs sm:text-sm"
                >
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">{hasData ? 'Update' : 'Upload'}</span>
                  <span className="xs:hidden">Data</span>
                </button>
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

        {!hasData && !showUploader ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Data Available</h2>
              <p className="text-gray-600">
                Click "Upload Data" to load your Ebony Fit Weekend {user?.selectedCity === 'dc' ? 'DC' : 'Atlanta'} order CSV file and view comprehensive analytics.
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
          hasData && (
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
                       'Multi'}
                    </span>
                  </button>
                ))}
                </div>
              </div>
            </nav>

            {activeTab === 'overview' && isMaster && <DashboardStats data={csvData} />}
            {activeTab === 'classes' && <ClassBreakdown data={csvData} userRole={user?.role} />}
            {activeTab === 'leaderboard' && <Leaderboard data={csvData} userRole={user?.role} />}
            {activeTab === 'customers' && <CustomerLists data={csvData} />}
            {activeTab === 'multi' && isMaster && <MultiPurchaseCustomers data={csvData} />}
          </div>
          )
        )}
      </main>
    </div>
  );
}

export default App;
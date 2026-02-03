import React, { useState, useEffect } from 'react';
import { Calendar, Users, Phone, Clock, TrendingUp, Filter, Download, ChevronDown, ChevronUp, ArrowUpDown, ArrowUp, ArrowDown, Search, Info, X } from 'lucide-react';
import { motion, AnimatePresence, cubicBezier } from 'framer-motion';
import { callRecordApi } from '../services/api';
import { FleetStatisticsDto, FleetStatisticType, TopCallerFleetDto, TopCalledFleetDto, UniqueCallerDetailDto, UniqueCalledDetailDto } from '../types/callRecord';

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: cubicBezier(0.25, 0.46, 0.45, 0.94)
    }
  }
};

const cardHoverVariants = {
  rest: {
    scale: 1,
    y: 0
  },
  hover: {
    scale: 1.02,
    y: -4,
    transition: {
      duration: 0.3,
      ease: cubicBezier(0.25, 0.46, 0.45, 0.94)
    }
  }
};

const filterVariants = {
  collapsed: {
    height: 0,
    opacity: 0
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: cubicBezier(0.25, 0.46, 0.45, 0.94)
    }
  }
};

const tableRowVariants = {
  hidden: { opacity: 0, x: -20 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3
    }
  })
};

const FleetStatisticsPage: React.FC = () => {
  // Date range state
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [topCount, setTopCount] = useState<number>(10);
  const [statisticType, setStatisticType] = useState<FleetStatisticType>(FleetStatisticType.All);
  const [statistics, setStatistics] = useState<FleetStatisticsDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);

  // New state for enhancements
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [callerSearch, setCallerSearch] = useState('');
  const [calledSearch, setCalledSearch] = useState('');

  // Detail modal state
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    type: 'caller' | 'called';
    fleet: string;
    data: UniqueCallerDetailDto[] | UniqueCalledDetailDto[];
    isLoading: boolean;
  }>({ isOpen: false, type: 'caller', fleet: '', data: [], isLoading: false });

  useEffect(() => {
    loadFleetStatistics();
  }, [startDate, endDate, topCount, statisticType, sortOrder]);

  const loadFleetStatistics = async () => {
    setError(null);
    setIsLoading(true);

    try {
      console.log('🔄 Loading fleet statistics...', { startDate, endDate, topCount, statisticType, sortOrder, callerSearch, calledSearch });
      const data = await callRecordApi.getFleetStatistics(
        startDate,
        endDate,
        topCount,
        statisticType,
        sortOrder,
        callerSearch || undefined,
        calledSearch || undefined
      );
      setStatistics(data);
    } catch (err: any) {
      console.error('❌ Error loading fleet statistics:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load fleet statistics');
      setStatistics(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Load unique callers detail for a called fleet
  const loadUniqueCallersDetail = async (calledFleet: string) => {
    setDetailModal(prev => ({ ...prev, isOpen: true, type: 'caller', fleet: calledFleet, isLoading: true, data: [] }));
    try {
      const data = await callRecordApi.getUniqueCallersForFleet(calledFleet, startDate, endDate);
      setDetailModal(prev => ({ ...prev, data, isLoading: false }));
    } catch (err: any) {
      console.error('❌ Error loading unique callers:', err);
      setDetailModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Load unique called fleets detail for a caller
  const loadUniqueCalledDetail = async (callerFleet: string) => {
    setDetailModal(prev => ({ ...prev, isOpen: true, type: 'called', fleet: callerFleet, isLoading: true, data: [] }));
    try {
      const data = await callRecordApi.getUniqueCalledFleetsForCaller(callerFleet, startDate, endDate);
      setDetailModal(prev => ({ ...prev, data, isLoading: false }));
    } catch (err: any) {
      console.error('❌ Error loading unique called fleets:', err);
      setDetailModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const closeDetailModal = () => {
    setDetailModal({ isOpen: false, type: 'caller', fleet: '', data: [], isLoading: false });
  };

  const formatDisplayDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return date;
    }
  };

  const getTypeDescription = () => {
    switch (statisticType) {
      case FleetStatisticType.Caller:
        return 'Top Caller Fleets';
      case FleetStatisticType.Called:
        return 'Top Called Fleets';
      default:
        return 'Fleet Statistics';
    }
  };

  const handleTypeChange = (type: FleetStatisticType) => {
    setStatisticType(type);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-6xl mx-auto flex-1 mt-10 md:mt-12 px-4 space-y-6"
    >
      {/* Page Header */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between ">
          <div>
            <motion.h1
              className="text-2xl font-bold text-gray-900"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Fleet Statistics
            </motion.h1>
            <motion.p
              className="text-gray-600 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Analyze top caller and called fleet performance
            </motion.p>
          </div>
          <motion.div
            className="mt-4 lg:mt-0 flex flex-wrap gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadFleetStatistics}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 shadow-sm"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {isLoading ? 'Loading...' : 'Refresh'}
            </motion.button>
          </motion.div>
        </div>

      </motion.div>

      {/* Filters Section */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        {/* Filter Header */}
        <motion.div
          whileHover={{ backgroundColor: "rgba(239, 246, 255, 0.8)" }}
          className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer"
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <motion.div
                whileHover={{ rotate: 15 }}
                className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 mr-3"
              >
                <Filter className="w-5 h-5 text-blue-600" />
              </motion.div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Filter Settings</h2>
                <p className="text-sm text-gray-600">Customize your statistics view</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-3">
                {isFilterExpanded ? 'Collapse' : 'Expand'}
              </span>
              {isFilterExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </div>
        </motion.div>

        {/* Filter Content */}
        <AnimatePresence>
          {isFilterExpanded && (
            <motion.div
              variants={filterVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              className="p-6 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Date Range Filter */}
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                    Date Range
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <motion.input
                        whileFocus={{ scale: 1.02 }}
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-400"
                      />
                    </div>
                    <span className="text-gray-500 font-medium">to</span>
                    <div className="relative flex-1">
                      <motion.input
                        whileFocus={{ scale: 1.02 }}
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-400"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {startDate === endDate
                      ? formatDisplayDate(startDate)
                      : `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`}
                  </p>
                </div>

                {/* Sort Order */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <ArrowUpDown className="w-4 h-4 mr-2 text-indigo-500" />
                    Sort Order
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSortOrder('DESC')}
                      className={`px-3 py-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${sortOrder === 'DESC'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                        }`}
                    >
                      <ArrowDown className="w-4 h-4" />
                      <span>High</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSortOrder('ASC')}
                      className={`px-3 py-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${sortOrder === 'ASC'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                        }`}
                    >
                      <ArrowUp className="w-4 h-4" />
                      <span>Low</span>
                    </motion.button>
                  </div>
                  <p className="text-xs text-gray-500">
                    {sortOrder === 'DESC' ? 'Highest calls first' : 'Lowest calls first'}
                  </p>
                </div>

                {/* Top Count Filter */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <Users className="w-4 h-4 mr-2 text-purple-500" />
                    Top Records
                  </label>
                  <div className="relative">
                    <motion.select
                      whileFocus={{ scale: 1.02 }}
                      value={topCount}
                      onChange={(e) => setTopCount(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-all shadow-sm hover:border-gray-400 bg-white"
                    >
                      <option value={5}>Top 5 Records</option>
                      <option value={10}>Top 10 Records</option>
                      <option value={20}>Top 20 Records</option>
                      <option value={50}>Top 50 Records</option>
                    </motion.select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Display top {topCount} performing fleets
                  </p>
                </div>

                {/* Type Filter */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <Filter className="w-4 h-4 mr-2 text-green-500" />
                    Statistics Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleTypeChange(FleetStatisticType.All)}
                      className={`px-3 py-3 text-sm font-medium rounded-lg transition-all flex flex-col items-center justify-center ${statisticType === FleetStatisticType.All
                        ? 'bg-blue-600 text-white shadow-md transform scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 border border-gray-300'
                        }`}
                    >
                      <span>All</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleTypeChange(FleetStatisticType.Caller)}
                      className={`px-3 py-3 text-sm font-medium rounded-lg transition-all flex flex-col items-center justify-center ${statisticType === FleetStatisticType.Caller
                        ? 'bg-green-600 text-white shadow-md transform scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 border border-gray-300'
                        }`}
                    >
                      <span>Top Caller</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleTypeChange(FleetStatisticType.Called)}
                      className={`px-3 py-3 text-sm font-medium rounded-lg transition-all flex flex-col items-center justify-center ${statisticType === FleetStatisticType.Called
                        ? 'bg-purple-600 text-white shadow-md transform scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 border border-gray-300'
                        }`}
                    >
                      <span>Top Called</span>
                    </motion.button>
                  </div>
                  <p className="text-xs text-gray-500">
                    {statisticType === FleetStatisticType.All && 'Showing all statistics'}
                    {statisticType === FleetStatisticType.Caller && 'Focusing on callers'}
                    {statisticType === FleetStatisticType.Called && 'Focusing on called fleets'}
                  </p>
                </div>
              </div>

              {/* Caller/Called Explanation */}
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Penjelasan Terminologi</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li><span className="font-medium text-green-700">• Caller Fleet:</span> Fleet yang <strong>MENELEPON</strong> atau menginisiasi panggilan (penelepon)</li>
                      <li><span className="font-medium text-purple-700">• Called Fleet:</span> Fleet yang <strong>DIHUBUNGI</strong> atau menerima panggilan (penerima)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Search Section */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Caller Search */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <Search className="w-4 h-4 mr-2 text-green-500" />
                    Search Caller Fleet
                  </label>
                  <div className="relative">
                    <motion.input
                      whileFocus={{ scale: 1.02 }}
                      type="text"
                      value={callerSearch}
                      onChange={(e) => setCallerSearch(e.target.value)}
                      placeholder="Ketik fleet ID..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-400"
                    />
                    {callerSearch && (
                      <button
                        onClick={() => setCallerSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Called Search */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <Search className="w-4 h-4 mr-2 text-purple-500" />
                    Search Called Fleet
                  </label>
                  <div className="relative">
                    <motion.input
                      whileFocus={{ scale: 1.02 }}
                      type="text"
                      value={calledSearch}
                      onChange={(e) => setCalledSearch(e.target.value)}
                      placeholder="Ketik fleet ID..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:border-gray-400"
                    />
                    {calledSearch && (
                      <button
                        onClick={() => setCalledSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Search Button */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">&nbsp;</label>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={loadFleetStatistics}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Search className="w-4 h-4" />
                    {isLoading ? 'Searching...' : 'Apply Search'}
                  </motion.button>
                </div>
              </div>
              {statistics && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 pt-6 border-t border-gray-100"
                >
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Preview</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="bg-blue-50 rounded-lg p-3"
                    >
                      <div className="text-lg font-bold text-blue-700">{statistics.totalCallsInDay.toLocaleString()}</div>
                      <div className="text-xs text-blue-600">Total Calls</div>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="bg-purple-50 rounded-lg p-3"
                    >
                      <div className="text-lg font-bold text-purple-700">{statistics.totalUniqueCallers.toLocaleString()}</div>
                      <div className="text-xs text-purple-600">Unique Callers</div>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="bg-orange-50 rounded-lg p-3"
                    >
                      <div className="text-lg font-bold text-orange-700">{statistics.totalUniqueCalledFleets.toLocaleString()}</div>
                      <div className="text-xs text-orange-600">Unique Called</div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 overflow-hidden"
          >
            <div className="flex items-center">
              <span className="text-red-700 font-medium">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overall Statistics */}
      {statistics && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            { title: "Total Calls", value: statistics.totalCallsInDay.toLocaleString(), icon: Phone, color: "blue", description: "Total calls for the day" },
            { title: "Unique Callers", value: statistics.totalUniqueCallers.toLocaleString(), icon: Users, color: "purple", description: "Unique caller fleets" },
            { title: "Unique Called", value: statistics.totalUniqueCalledFleets.toLocaleString(), icon: Users, color: "orange", description: "Unique called fleets" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              custom={index}
              variants={itemVariants}
              whileHover="hover"
            >
              <StatCard
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color as any}
                description={stat.description}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center"
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              {/* Spinner */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 border-4 border-blue-300 border-t-blue-600 rounded-full"
              ></motion.div>

              {/* Text */}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-600 text-sm font-medium"
              >
                Loading fleet statistics...
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Callers Section */}
      {statistics && (statisticType === FleetStatisticType.All || statisticType === FleetStatisticType.Caller) && (
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Top Caller Fleets
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Fleets that initiated the most calls on {startDate === endDate ? formatDisplayDate(startDate) : `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`}
            </p>
          </div>

          {statistics.topCallers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caller Fleet</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Calls</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Duration</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {statistics.topCallers.map((caller, index) => (
                    <motion.tr
                      key={caller.rank}
                      custom={index}
                      variants={tableRowVariants}
                      initial="hidden"
                      animate="show"
                      whileHover={{ backgroundColor: "rgba(243, 244, 246, 0.5)" }}
                      className="transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${caller.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                          caller.rank === 2 ? 'bg-gray-100 text-gray-800' :
                            caller.rank === 3 ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                          }`}>
                          #{caller.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {caller.callerFleet}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {caller.totalCalls.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {caller.totalDurationFormatted}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {caller.averageDurationFormatted}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-900 mb-2">No caller data available</p>
              <p className="text-sm text-gray-600">No top caller statistics found for the selected date and filters.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Top Called Fleets Section */}
      {statistics && (statisticType === FleetStatisticType.All || statisticType === FleetStatisticType.Called) && (
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              Top Called Fleets
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Fleets that received the most calls on {startDate === endDate ? formatDisplayDate(startDate) : `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`}
            </p>
          </div>

          {statistics.topCalledFleets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Called Fleet</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Calls</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Callers</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {statistics.topCalledFleets.map((called, index) => (
                    <motion.tr
                      key={called.rank}
                      custom={index}
                      variants={tableRowVariants}
                      initial="hidden"
                      animate="show"
                      whileHover={{ backgroundColor: "rgba(243, 244, 246, 0.5)" }}
                      className="transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${called.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                          called.rank === 2 ? 'bg-gray-100 text-gray-800' :
                            called.rank === 3 ? 'bg-orange-100 text-orange-800' :
                              'bg-green-100 text-green-800'
                          }`}>
                          #{called.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {called.calledFleet}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {called.totalCalls.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {called.totalDurationFormatted}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {called.averageDurationFormatted}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => loadUniqueCallersDetail(called.calledFleet)}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer transition-colors"
                        >
                          {called.uniqueCallers} callers →
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-gray-500">
              <Phone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-900 mb-2">No called fleet data available</p>
              <p className="text-sm text-gray-600">No top called fleet statistics found for the selected date and filters.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* No Data State */}
      {!isLoading && !statistics && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center"
        >
          <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">No fleet statistics available</p>
          <p className="text-gray-400 text-sm mt-2">Select a date with data to view fleet statistics</p>
        </motion.div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {detailModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={closeDetailModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-purple-600" />
                    {detailModal.type === 'caller'
                      ? `Unique Callers for ${detailModal.fleet}`
                      : `Unique Called Fleets for ${detailModal.fleet}`}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {startDate === endDate
                      ? formatDisplayDate(startDate)
                      : `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeDetailModal}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {detailModal.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <span className="ml-3 text-gray-600">Loading details...</span>
                  </div>
                ) : detailModal.data.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {detailModal.type === 'caller' ? 'Caller Fleet' : 'Called Fleet'}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Calls</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {detailModal.data.map((item, index) => (
                        <motion.tr
                          key={detailModal.type === 'caller'
                            ? (item as UniqueCallerDetailDto).callerFleet
                            : (item as UniqueCalledDetailDto).calledFleet}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {detailModal.type === 'caller'
                              ? (item as UniqueCallerDetailDto).callerFleet
                              : (item as UniqueCalledDetailDto).calledFleet}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                            {detailModal.type === 'caller'
                              ? (item as UniqueCallerDetailDto).callCount.toLocaleString()
                              : (item as UniqueCalledDetailDto).callCount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {detailModal.type === 'caller'
                              ? (item as UniqueCallerDetailDto).totalDurationFormatted
                              : (item as UniqueCalledDetailDto).totalDurationFormatted}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No data available</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              {detailModal.data.length > 0 && (
                <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                  <p className="text-sm text-gray-600">
                    Total: <span className="font-semibold">{detailModal.data.length}</span> unique {detailModal.type === 'caller' ? 'callers' : 'called fleets'}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// StatCard Component
const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'orange';
  description: string;
  trend?: string;
}> = ({ title, value, icon: Icon, color, description, trend }) => {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
    green: 'bg-gradient-to-br from-green-500 to-green-600',
    purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
    orange: 'bg-gradient-to-br from-orange-500 to-orange-600'
  };

  const textColors = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    purple: 'text-purple-700',
    orange: 'text-orange-700'
  };

  const bgColors = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    purple: 'bg-purple-50',
    orange: 'bg-orange-50'
  };

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {trend && (
              <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
                {trend}
              </span>
            )}
          </div>
          <p className={`text-2xl font-bold ${textColors[color]} mb-2`}>{value}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <motion.div
          whileHover={{ rotate: 15, scale: 1.1 }}
          className={`p-3 rounded-xl ${colorClasses[color]} text-white shadow-lg transition-transform duration-300`}
        >
          <Icon className="w-6 h-6" />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default FleetStatisticsPage;
import React, { useState, useEffect } from 'react';
import { ActivityLog, ActivityLogQuery, PagedResult } from '../../types/activityLog';
import { activityLogApi } from '../../services/activityLogApi';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { Search, Filter, RotateCw } from 'lucide-react';

const ActivityLogTab: React.FC = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalItems, setTotalItems] = useState(0);
    const [query, setQuery] = useState<ActivityLogQuery>({
        page: 1,
        pageSize: 10,
        search: '',
        module: '',
        action: '',
        startDate: '',
        endDate: ''
    });

    const fetchLogs = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const result = await activityLogApi.getLogs(query);
            setLogs(result.items);
            setTotalItems(result.totalItems);
        } catch (error) {
            console.error('Failed to fetch activity logs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [query.page, query.pageSize, query.module, query.action, query.startDate, query.endDate]); // Trigger fetch on filter change

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setQuery(prev => ({ ...prev, page: 1 })); // Reset to page 1 on search
        fetchLogs();
    };

    const handlePageChange = (newPage: number) => {
        setQuery(prev => ({ ...prev, page: newPage }));
    };

    const totalPages = Math.ceil(totalItems / query.pageSize);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 text-white">
                <h2 className="text-xl font-semibold">Audit Logs</h2>
                <div className="flex space-x-2">
                    <button
                        onClick={() => fetchLogs()}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RotateCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 space-y-4 text-sm text-gray-300">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search description, module, action or user..."
                            value={query.search || ''}
                            onChange={(e) => setQuery(prev => ({ ...prev, search: e.target.value }))}
                            className="bg-gray-700 text-white border border-gray-600 rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex gap-2">
                        <select
                            value={query.module || ''}
                            onChange={(e) => setQuery(prev => ({ ...prev, module: e.target.value, page: 1 }))}
                            className="bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Modules</option>
                            <option value="Auth">Auth</option>
                            <option value="User">User</option>
                            <option value="Role">Role</option>
                            <option value="Permission">Permission</option>
                            <option value="Division">Division</option>
                            <option value="CallRecord">Call Record</option>
                            {/* Add more modules as needed */}
                        </select>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors">
                            Search
                        </button>
                    </div>
                </form>
                <div className="flex gap-4 items-center">
                    <div className="flex gap-2 items-center">
                        <span className="text-gray-400">Date Range:</span>
                        <input
                            type="date"
                            className="bg-gray-700 text-white border border-gray-600 rounded-lg px-2 py-1"
                            value={query.startDate ? query.startDate.split('T')[0] : ''}
                            onChange={(e) => setQuery(prev => ({ ...prev, startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined, page: 1 }))}
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            className="bg-gray-700 text-white border border-gray-600 rounded-lg px-2 py-1"
                            value={query.endDate ? query.endDate.split('T')[0] : ''}
                            onChange={(e) => setQuery(prev => ({ ...prev, endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined, page: 1 }))}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-gray-300">
                        <thead className="bg-gray-900/50 text-xs uppercase text-gray-400">
                            <tr>
                                <th className="px-6 py-3">Timestamp</th>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Module</th>
                                <th className="px-6 py-3">Action</th>
                                <th className="px-6 py-3">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        Loading logs...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No activity logs found.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {format(new Date(log.timestamp), 'dd MMM yyyy HH:mm:ss')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-white">{log.user?.fullName || log.userId}</div>
                                            <div className="text-xs text-gray-500">{log.user?.role?.roleName || 'Unknown Role'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className="px-2 py-1 rounded-full bg-gray-700 text-xs border border-gray-600">
                                                {log.module}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                            {log.action}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400 max-w-md truncate" title={log.description}>
                                            {log.description}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalItems > 0 && (
                    <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between text-sm text-gray-400">
                        <div>
                            Showing <span className="text-white">{(query.page - 1) * query.pageSize + 1}</span> to <span className="text-white">{Math.min(query.page * query.pageSize, totalItems)}</span> of <span className="text-white">{totalItems}</span> results
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(Math.max(1, query.page - 1))}
                                disabled={query.page === 1}
                                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-1 text-white self-center">Page {query.page} of {totalPages}</span>
                            <button
                                onClick={() => handlePageChange(Math.min(totalPages, query.page + 1))}
                                disabled={query.page === totalPages}
                                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityLogTab;

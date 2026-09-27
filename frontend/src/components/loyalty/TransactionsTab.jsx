import React, { useState, useEffect } from 'react';
import { 
    Search, Filter, RefreshCw, MoreVertical, Plus, Eye,
    ArrowUpRight, ArrowDownRight, Settings, Clock, 
    Database, Activity, ArrowRightLeft 
} from 'lucide-react';
import { loyaltyApi } from '../../services/loyaltyApi';
import TableActionMenu from '../shared/TableActionMenu';
import AddTransactionDrawer from './AddTransactionDrawer';
import TransactionDetailDrawer from './TransactionDetailDrawer';

const TransactionsTab = () => {
    const [transactions, setTransactions] = useState([]);
    const [kpis, setKpis] = useState({
        totalTransactions: 0,
        pointsEarned: 0,
        pointsRedeemed: 0,
        totalAdjustments: 0
    });
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [programFilter, setProgramFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [dateFilter, setDateFilter] = useState('All');

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [viewingTransaction, setViewingTransaction] = useState(null);

    const pageSize = 10;

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchKpis = async () => {
        try {
            const res = await loyaltyApi.getTransactionKpis();
            setKpis(res.data);
        } catch (err) {
            console.error('Failed to fetch transaction KPIs', err);
        }
    };

    const fetchPrograms = async () => {
        try {
            const res = await loyaltyApi.getPrograms({ page: 1, pageSize: 100 });
            setPrograms(res.data.items || []);
        } catch (err) {
            console.error('Failed to fetch programs for filter', err);
        }
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                pageSize,
                search: debouncedSearch,
                programId: programFilter || null,
                transactionType: typeFilter,
                dateFilter: dateFilter
            };
            const res = await loyaltyApi.getTransactions(params);
            setTransactions(res.data.items || []);
            setTotalItems(res.data.totalCount || 0);
        } catch (err) {
            console.error('Failed to fetch transactions', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKpis();
        fetchPrograms();
    }, []);

    useEffect(() => {
        fetchTransactions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, debouncedSearch, programFilter, typeFilter, dateFilter]);

    const clearFilters = () => {
        setSearch('');
        setProgramFilter('');
        setTypeFilter('All');
        setDateFilter('All');
        setPage(1);
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'Earned': return 'text-green-500';
            case 'Redeemed': return 'text-red-500';
            case 'Adjustment': return 'text-blue-500';
            case 'Expired': return 'text-orange-500';
            default: return 'text-gray-500';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'Earned': return <ArrowUpRight size={14} className="text-green-500" />;
            case 'Redeemed': return <ArrowDownRight size={14} className="text-red-500" />;
            case 'Adjustment': return <Settings size={14} className="text-blue-500" />;
            case 'Expired': return <Clock size={14} className="text-orange-500" />;
            default: return <Activity size={14} />;
        }
    };

    return (
        <div className="loyalty-workspace flex flex-col h-full gap-4 fade-in">
            {/* KPI Strip */}
            <div className="kpi-strip">
                <div className="kpi-card">
                    <div className="kpi-value">{kpis.totalTransactions.toLocaleString()}</div>
                    <div className="kpi-label"><Database size={14} className="text-gray-400" /> TOTAL TRANSACTIONS</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-value text-green-500">+{kpis.pointsEarned.toLocaleString()}</div>
                    <div className="kpi-label"><ArrowUpRight size={14} className="text-green-500" /> POINTS EARNED</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-value text-red-500">
                        {kpis.pointsRedeemed === 0 ? '0' : `-${kpis.pointsRedeemed.toLocaleString()}`}
                    </div>
                    <div className="kpi-label"><ArrowDownRight size={14} className="text-red-500" /> POINTS REDEEMED</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-value">{kpis.totalAdjustments.toLocaleString()}</div>
                    <div className="kpi-label"><ArrowRightLeft size={14} className="text-blue-500" /> ADJUSTMENTS</div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="filter-bar">
                <div className="filter-left">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by customer or ref..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    
                    <div className="filter-group">
                        <Filter size={18} className="filter-icon" />
                        <select className="filter-select" style={{ minWidth: '150px' }} value={programFilter} onChange={(e) => setProgramFilter(e.target.value)}>
                            <option value="">All Programs</option>
                            {programs.map(p => <option key={p.loyaltyProgramId} value={p.loyaltyProgramId}>{p.programName}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <Filter size={18} className="filter-icon" />
                        <select className="filter-select" style={{ minWidth: '140px' }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                            <option value="All">All Types</option>
                            <option value="Earned">Earned</option>
                            <option value="Redeemed">Redeemed</option>
                            <option value="Adjustment">Adjustment</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <Filter size={18} className="filter-icon" />
                        <select className="filter-select" style={{ minWidth: '130px' }} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                            <option value="All">All Time</option>
                            <option value="Today">Today</option>
                            <option value="Last 7 Days">Last 7 Days</option>
                            <option value="This Month">This Month</option>
                        </select>
                    </div>

                    {(search || programFilter || typeFilter !== 'All' || dateFilter !== 'All') && (
                        <button 
                            className="icon-btn text-muted" 
                            onClick={clearFilters}
                            title="Clear Filters"
                        >
                            <RefreshCw size={16} /> Clear
                        </button>
                    )}
                </div>
                
                <div className="filter-right">
                    <button className="icon-btn" onClick={() => { fetchTransactions(); fetchKpis(); }} title="Refresh" disabled={loading}>
                        <RefreshCw size={18} className={loading ? "spin" : ""} />
                    </button>
                    <button className="primary-btn" style={{ whiteSpace: 'nowrap' }} onClick={() => setIsAddOpen(true)}>
                        <Plus size={16} /> Add Transaction
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="table-container flex-1">
                <table className="enterprise-table w-full">
                    <thead>
                        <tr>
                            <th>DATE</th>
                            <th>CUSTOMER</th>
                            <th>PROGRAM</th>
                            <th>TYPE</th>
                            <th className="text-right">POINTS</th>
                            <th className="text-right">BALANCE AFTER</th>
                            <th>REFERENCE</th>
                            <th>CREATED BY</th>
                            <th className="text-center">ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && transactions.length === 0 ? (
                            <tr><td colSpan="9" className="text-center py-8 text-muted">Loading transactions...</td></tr>
                        ) : transactions.length === 0 ? (
                            <tr><td colSpan="9" className="text-center py-8 text-muted">No transactions found.</td></tr>
                        ) : (
                            transactions.map(t => (
                                <tr key={t.transactionId} className="hover:bg-gray-800/30">
                                    <td className="whitespace-nowrap">{new Date(t.transactionDate).toLocaleString()}</td>
                                    <td>
                                        <div className="font-medium text-white">{t.customerName}</div>
                                        <div className="text-xs text-muted">{t.customerCode}</div>
                                    </td>
                                    <td>{t.programName}</td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            {getTypeIcon(t.transactionType)}
                                            <span className={`font-medium ${getTypeColor(t.transactionType)}`}>
                                                {t.transactionType}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="text-right font-mono font-medium">
                                        {t.transactionType === 'Earned' ? '+' : t.transactionType === 'Redeemed' ? '-' : t.points > 0 ? '+' : t.points < 0 ? '-' : ''}
                                        {Math.abs(t.points).toLocaleString()}
                                    </td>
                                    <td className="text-right font-mono">{t.balanceAfter.toLocaleString()}</td>
                                    <td>{t.reference || '-'}</td>
                                    <td>{t.createdByName}</td>
                                    <td className="text-right">
                                        <TableActionMenu>
                                            <button 
                                                className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center"
                                                onClick={() => setViewingTransaction(t)}
                                            >
                                                <Eye size={16} className="mr-2" /> View Details
                                            </button>
                                        </TableActionMenu>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalItems > 0 && (
                <div className="pagination flex justify-between items-center mt-2 p-2">
                    <div className="text-sm text-muted">
                        Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalItems)} of {totalItems} transactions
                    </div>
                    <div className="flex gap-2">
                        <button 
                            className="secondary-btn px-3 py-1 text-sm" 
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            Previous
                        </button>
                        <button 
                            className="secondary-btn px-3 py-1 text-sm"
                            disabled={page * pageSize >= totalItems}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Modals/Drawers */}
            {isAddOpen && (
                <AddTransactionDrawer 
                    onClose={() => setIsAddOpen(false)}
                    onSuccess={() => {
                        setIsAddOpen(false);
                        fetchTransactions();
                        fetchKpis();
                    }}
                />
            )}

            {viewingTransaction && (
                <TransactionDetailDrawer 
                    transaction={viewingTransaction}
                    onClose={() => setViewingTransaction(null)}
                />
            )}
        </div>
    );
};

export default TransactionsTab;

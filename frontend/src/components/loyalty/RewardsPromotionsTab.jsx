import React, { useState, useEffect, useCallback } from 'react';
import { 
    Search, Plus, Filter, ChevronLeft, ChevronRight, Clock,
    Play, Square, Gift, Tag, MoreVertical, RefreshCw, Eye, Edit2
} from 'lucide-react';
import { loyaltyApi } from '../../services/loyaltyApi';

import CreateRewardDrawer from './CreateRewardDrawer';
import EditRewardDrawer from './EditRewardDrawer';
import RewardDetailDrawer from './RewardDetailDrawer';

import CreatePromotionDrawer from './CreatePromotionDrawer';
import EditPromotionDrawer from './EditPromotionDrawer';
import PromotionDetailDrawer from './PromotionDetailDrawer';
import TableActionMenu from '../shared/TableActionMenu';
import './LoyaltyProgramsTab.css';

const RewardsPromotionsTab = () => {
    const [activeView, setActiveView] = useState('Rewards'); // 'Rewards' or 'Promotions'
    const [programs, setPrograms] = useState([]);
    
    // Rewards State
    const [rewards, setRewards] = useState([]);
    const [rewardsLoading, setRewardsLoading] = useState(true);
    const [rewardKpis, setRewardKpis] = useState({ totalRewards: 0, activeRewards: 0, inactiveRewards: 0, programsWithRewards: 0 });
    const [rewardSearch, setRewardSearch] = useState('');
    const [rewardProgramFilter, setRewardProgramFilter] = useState('');
    const [rewardStatusFilter, setRewardStatusFilter] = useState('All');
    const [rewardPage, setRewardPage] = useState(1);
    const [rewardTotalCount, setRewardTotalCount] = useState(0);
    
    // Promotions State
    const [promotions, setPromotions] = useState([]);
    const [promotionsLoading, setPromotionsLoading] = useState(true);
    const [promoKpis, setPromoKpis] = useState({ totalPromotions: 0, activePromotions: 0, upcomingPromotions: 0, expiredPromotions: 0 });
    const [promoSearch, setPromoSearch] = useState('');
    const [promoProgramFilter, setPromoProgramFilter] = useState('');
    const [promoStatusFilter, setPromoStatusFilter] = useState('All');
    const [promoPage, setPromoPage] = useState(1);
    const [promoTotalCount, setPromoTotalCount] = useState(0);

    // Drawers
    const [isCreateRewardOpen, setIsCreateRewardOpen] = useState(false);
    const [editReward, setEditReward] = useState(null);
    const [viewReward, setViewReward] = useState(null);

    const [isCreatePromoOpen, setIsCreatePromoOpen] = useState(false);
    const [editPromo, setEditPromo] = useState(null);
    const [viewPromo, setViewPromo] = useState(null);

    const pageSize = 10;

    // Fetch Programs for Filters
    useEffect(() => {
        const fetchPrograms = async () => {
            try {
                const res = await loyaltyApi.getPrograms({ pageSize: 100 });
                setPrograms(res.data.items || []);
            } catch (err) {
                console.error("Failed to fetch programs", err);
            }
        };
        fetchPrograms();
    }, []);

    // ----------------------------------------------------
    // REWARDS FETCHING
    // ----------------------------------------------------
    const fetchRewards = useCallback(async () => {
        setRewardsLoading(true);
        try {
            const res = await loyaltyApi.getRewards({
                search: rewardSearch,
                status: rewardStatusFilter,
                loyaltyProgramId: rewardProgramFilter || null,
                page: rewardPage,
                pageSize
            });
            setRewards(res.data.items);
            setRewardTotalCount(res.data.totalCount);
        } catch (err) {
            console.error(err);
        } finally {
            setRewardsLoading(false);
        }
    }, [rewardSearch, rewardStatusFilter, rewardProgramFilter, rewardPage]);

    const fetchRewardKpis = useCallback(async () => {
        try {
            const res = await loyaltyApi.getRewardKpis();
            setRewardKpis(res.data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        if (activeView === 'Rewards') {
            const timer = setTimeout(() => {
                fetchRewards();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [fetchRewards, activeView]);

    useEffect(() => {
        if (activeView === 'Rewards') fetchRewardKpis();
    }, [fetchRewardKpis, activeView]);

    const handleRewardAction = async (action, reward) => {
        try {
            if (action === 'activate') {
                if (!window.confirm("Activate this reward?")) return;
                await loyaltyApi.activateReward(reward.rewardId);
            } else if (action === 'deactivate') {
                if (!window.confirm("Deactivate this reward?")) return;
                await loyaltyApi.deactivateReward(reward.rewardId);
            } else if (action === 'edit') {
                setEditReward(reward);
                return;
            } else if (action === 'view') {
                setViewReward(reward);
                return;
            }
            fetchRewards();
            fetchRewardKpis();
        } catch (err) {
            alert(err.response?.data?.message || `Failed to ${action} reward.`);
        }
    };

    // ----------------------------------------------------
    // PROMOTIONS FETCHING
    // ----------------------------------------------------
    const fetchPromotions = useCallback(async () => {
        setPromotionsLoading(true);
        try {
            const res = await loyaltyApi.getPromotions({
                search: promoSearch,
                status: promoStatusFilter,
                loyaltyProgramId: promoProgramFilter || null,
                page: promoPage,
                pageSize
            });
            setPromotions(res.data.items);
            setPromoTotalCount(res.data.totalCount);
        } catch (err) {
            console.error(err);
        } finally {
            setPromotionsLoading(false);
        }
    }, [promoSearch, promoStatusFilter, promoProgramFilter, promoPage]);

    const fetchPromoKpis = useCallback(async () => {
        try {
            const res = await loyaltyApi.getPromotionKpis();
            setPromoKpis(res.data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        if (activeView === 'Promotions') {
            const timer = setTimeout(() => {
                fetchPromotions();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [fetchPromotions, activeView]);

    useEffect(() => {
        if (activeView === 'Promotions') fetchPromoKpis();
    }, [fetchPromoKpis, activeView]);

    const handlePromotionAction = async (action, promotion) => {
        try {
            if (action === 'activate') {
                if (!window.confirm("Activate this promotion?")) return;
                await loyaltyApi.activatePromotion(promotion.promotionId);
            } else if (action === 'deactivate') {
                if (!window.confirm("Deactivate this promotion?")) return;
                await loyaltyApi.deactivatePromotion(promotion.promotionId);
            } else if (action === 'edit') {
                setEditPromo(promotion);
                return;
            } else if (action === 'view') {
                setViewPromo(promotion);
                return;
            }
            fetchPromotions();
            fetchPromoKpis();
        } catch (err) {
            alert(err.response?.data?.message || `Failed to ${action} promotion.`);
        }
    };

    const renderRewardsView = () => {
        const totalPages = Math.ceil(rewardTotalCount / pageSize);
        return (
            <div className="flex flex-col h-full gap-4 fade-in">
                <div className="kpi-strip">
                    <div className="kpi-card">
                        <div className="kpi-value">{rewardKpis.totalRewards}</div>
                        <div className="kpi-label"><Gift size={14} /> TOTAL REWARDS</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-value">{rewardKpis.activeRewards}</div>
                        <div className="kpi-label"><Play size={14} className="text-green-500" /> ACTIVE</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-value">{rewardKpis.inactiveRewards}</div>
                        <div className="kpi-label"><Square size={14} className="text-red-500" /> INACTIVE</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-value">{rewardKpis.programsWithRewards}</div>
                        <div className="kpi-label"><Tag size={14} className="text-blue-500" /> PROGS W/ REWARDS</div>
                    </div>
                </div>

                <div className="filter-bar">
                    <div className="filter-left">
                        <div className="search-box">
                            <Search size={18} className="search-icon" />
                            <input 
                                type="text" 
                                placeholder="Search rewards..." 
                                value={rewardSearch}
                                onChange={(e) => { setRewardSearch(e.target.value); setRewardPage(1); }}
                            />
                        </div>
                        <div className="filter-group">
                            <Filter size={18} className="filter-icon" />
                            <select 
                                className="filter-select"
                                value={rewardProgramFilter}
                                onChange={(e) => { setRewardProgramFilter(e.target.value); setRewardPage(1); }}
                            >
                                <option value="">All Programs</option>
                                {programs.map(p => (
                                    <option key={p.loyaltyProgramId} value={p.loyaltyProgramId}>{p.programName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <Filter size={18} className="filter-icon" />
                            <select 
                                className="filter-select"
                                value={rewardStatusFilter}
                                onChange={(e) => { setRewardStatusFilter(e.target.value); setRewardPage(1); }}
                            >
                                <option value="All">All Statuses</option>
                                <option value="Active">Active</option>
                                <option value="Draft">Draft</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                        {(rewardSearch || rewardProgramFilter || rewardStatusFilter !== 'All') && (
                            <button className="icon-btn text-muted" onClick={() => { setRewardSearch(''); setRewardProgramFilter(''); setRewardStatusFilter('All'); setRewardPage(1); }} title="Clear Filters">
                                Clear
                            </button>
                        )}
                    </div>
                    <div className="filter-right">
                        <button className="icon-btn" onClick={() => { fetchRewards(); fetchRewardKpis(); }} title="Refresh" disabled={rewardsLoading}>
                            <RefreshCw size={18} className={rewardsLoading ? "spin" : ""} />
                        </button>
                        <button className="primary-btn" onClick={() => setIsCreateRewardOpen(true)}>
                            <Plus size={18} /> Create Reward
                        </button>
                    </div>
                </div>

                <div className="table-container flex-1">
                    <table className="enterprise-table">
                        <thead>
                            <tr>
                                <th>Reward</th>
                                <th>Program</th>
                                <th>Type</th>
                                <th>Points Cost</th>
                                <th>Value</th>
                                <th>Validity</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rewardsLoading ? (
                                <tr><td colSpan="8" className="text-center py-8">Loading rewards...</td></tr>
                            ) : rewards.length === 0 ? (
                                <tr><td colSpan="8" className="text-center py-8 text-muted">No rewards found.</td></tr>
                            ) : (
                                rewards.map(r => (
                                    <tr key={r.rewardId}>
                                        <td>
                                            <div className="font-medium">{r.rewardName}</div>
                                            <div className="text-xs text-muted">{r.rewardCode}</div>
                                        </td>
                                        <td>{r.loyaltyProgram?.programName || 'Unknown'}</td>
                                        <td>{r.rewardType}</td>
                                        <td>{r.pointsCost}</td>
                                        <td>{r.rewardValue ? `₹${r.rewardValue}` : '-'}</td>
                                        <td>
                                            <div className="text-sm">{r.startDate ? new Date(r.startDate).toLocaleDateString() : 'Immediate'}</div>
                                            <div className="text-xs text-muted">{r.endDate ? `to ${new Date(r.endDate).toLocaleDateString()}` : 'No Expiry'}</div>
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${r.status.toLowerCase().replace(' ', '-')}`}>{r.status}</span>
                                        </td>
                                        <td className="text-right">
                                            <TableActionMenu>
                                                <button className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center" onClick={() => handleRewardAction('view', r)}>
                                                    <Eye size={16} className="mr-2" /> View Details
                                                </button>
                                                <button className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center" onClick={() => handleRewardAction('edit', r)}>
                                                    <Edit2 size={16} className="mr-2" /> Edit Reward
                                                </button>
                                                <div className="border-t my-1 border-gray-200 dark:border-gray-700"></div>
                                                {r.status !== 'Active' ? (
                                                    <button className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center text-success" onClick={() => handleRewardAction('activate', r)}>
                                                        <Play size={16} className="mr-2" /> Activate
                                                    </button>
                                                ) : (
                                                    <button className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center text-warning" onClick={() => handleRewardAction('deactivate', r)}>
                                                        <Square size={16} className="mr-2" /> Deactivate
                                                    </button>
                                                )}
                                            </TableActionMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!rewardsLoading && rewards.length > 0 && (
                    <div className="pagination-bar">
                        <div className="pagination-info">
                            Showing {(rewardPage - 1) * pageSize + 1} to {Math.min(rewardPage * pageSize, rewardTotalCount)} of {rewardTotalCount} entries
                        </div>
                        <div className="pagination-controls">
                            <button className="icon-btn" disabled={rewardPage === 1} onClick={() => setRewardPage(p => p - 1)}><ChevronLeft size={18} /></button>
                            <span className="pagination-current">Page {rewardPage} of {totalPages}</span>
                            <button className="icon-btn" disabled={rewardPage === totalPages || totalPages === 0} onClick={() => setRewardPage(p => p + 1)}><ChevronRight size={18} /></button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderPromotionsView = () => {
        const totalPages = Math.ceil(promoTotalCount / pageSize);
        return (
            <div className="flex flex-col h-full gap-4 fade-in">
                <div className="kpi-strip">
                    <div className="kpi-card">
                        <div className="kpi-value">{promoKpis.totalPromotions}</div>
                        <div className="kpi-label"><Tag size={14} /> TOTAL PROMOTIONS</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-value">{promoKpis.activePromotions}</div>
                        <div className="kpi-label"><Play size={14} className="text-green-500" /> ACTIVE</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-value">{promoKpis.upcomingPromotions}</div>
                        <div className="kpi-label"><Clock size={14} className="text-blue-500" /> UPCOMING</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-value">{promoKpis.expiredPromotions}</div>
                        <div className="kpi-label"><Square size={14} className="text-red-500" /> EXPIRED</div>
                    </div>
                </div>

                <div className="filter-bar">
                    <div className="filter-left">
                        <div className="search-box">
                            <Search size={18} className="search-icon" />
                            <input 
                                type="text" 
                                placeholder="Search promotions..." 
                                value={promoSearch}
                                onChange={(e) => { setPromoSearch(e.target.value); setPromoPage(1); }}
                            />
                        </div>
                        <div className="filter-group">
                            <Filter size={18} className="filter-icon" />
                            <select 
                                className="filter-select"
                                value={promoProgramFilter}
                                onChange={(e) => { setPromoProgramFilter(e.target.value); setPromoPage(1); }}
                            >
                                <option value="">All Programs</option>
                                {programs.map(p => (
                                    <option key={p.loyaltyProgramId} value={p.loyaltyProgramId}>{p.programName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <Filter size={18} className="filter-icon" />
                            <select 
                                className="filter-select"
                                value={promoStatusFilter}
                                onChange={(e) => { setPromoStatusFilter(e.target.value); setPromoPage(1); }}
                            >
                                <option value="All">All Statuses</option>
                                <option value="Active">Active</option>
                                <option value="Draft">Draft</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                        {(promoSearch || promoProgramFilter || promoStatusFilter !== 'All') && (
                            <button className="icon-btn text-muted" onClick={() => { setPromoSearch(''); setPromoProgramFilter(''); setPromoStatusFilter('All'); setPromoPage(1); }} title="Clear Filters">
                                Clear
                            </button>
                        )}
                    </div>
                    <div className="filter-right">
                        <button className="icon-btn" onClick={() => { fetchPromotions(); fetchPromoKpis(); }} title="Refresh" disabled={promotionsLoading}>
                            <RefreshCw size={18} className={promotionsLoading ? "spin" : ""} />
                        </button>
                        <button className="primary-btn" onClick={() => setIsCreatePromoOpen(true)}>
                            <Plus size={18} /> Create Promotion
                        </button>
                    </div>
                </div>

                <div className="table-container flex-1">
                    <table className="enterprise-table">
                        <thead>
                            <tr>
                                <th>Promotion</th>
                                <th>Program</th>
                                <th>Type</th>
                                <th>Benefit</th>
                                <th>Validity</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {promotionsLoading ? (
                                <tr><td colSpan="7" className="text-center py-8">Loading promotions...</td></tr>
                            ) : promotions.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-8 text-muted">No promotions found.</td></tr>
                            ) : (
                                promotions.map(p => (
                                    <tr key={p.promotionId}>
                                        <td>
                                            <div className="font-medium">{p.promotionName}</div>
                                            <div className="text-xs text-muted">{p.promotionCode}</div>
                                        </td>
                                        <td>{p.loyaltyProgram?.programName || 'Unknown'}</td>
                                        <td>{p.promotionType}</td>
                                        <td>
                                            {p.promotionType === 'Bonus Points' ? `+${p.bonusPoints} Points` : `${p.pointsMultiplier}x Multiplier`}
                                        </td>
                                        <td>
                                            <div className="text-sm">{new Date(p.startDate).toLocaleDateString()}</div>
                                            <div className="text-xs text-muted">to {new Date(p.endDate).toLocaleDateString()}</div>
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${p.status.toLowerCase().replace(' ', '-')}`}>{p.status}</span>
                                        </td>
                                        <td className="text-right">
                                            <TableActionMenu>
                                                <button className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center" onClick={() => handlePromotionAction('view', p)}>
                                                    <Eye size={16} className="mr-2" /> View Details
                                                </button>
                                                <button className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center" onClick={() => handlePromotionAction('edit', p)}>
                                                    <Edit2 size={16} className="mr-2" /> Edit Promotion
                                                </button>
                                                <div className="border-t my-1 border-gray-200 dark:border-gray-700"></div>
                                                {p.status !== 'Active' ? (
                                                    <button className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center text-success" onClick={() => handlePromotionAction('activate', p)}>
                                                        <Play size={16} className="mr-2" /> Activate
                                                    </button>
                                                ) : (
                                                    <button className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center text-warning" onClick={() => handlePromotionAction('deactivate', p)}>
                                                        <Square size={16} className="mr-2" /> Deactivate
                                                    </button>
                                                )}
                                            </TableActionMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!promotionsLoading && promotions.length > 0 && (
                    <div className="pagination-bar">
                        <div className="pagination-info">
                            Showing {(promoPage - 1) * pageSize + 1} to {Math.min(promoPage * pageSize, promoTotalCount)} of {promoTotalCount} entries
                        </div>
                        <div className="pagination-controls">
                            <button className="icon-btn" disabled={promoPage === 1} onClick={() => setPromoPage(p => p - 1)}><ChevronLeft size={18} /></button>
                            <span className="pagination-current">Page {promoPage} of {totalPages}</span>
                            <button className="icon-btn" disabled={promoPage === totalPages || totalPages === 0} onClick={() => setPromoPage(p => p + 1)}><ChevronRight size={18} /></button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="loyalty-workspace flex flex-col h-full fade-in overflow-y-auto pr-2 gap-8">
            {/* Rewards Section */}
            <div>
                {renderRewardsView()}
            </div>

            {/* Promotions Section */}
            <div>
                {renderPromotionsView()}
            </div>

            {/* Reward Drawers */}
            {isCreateRewardOpen && (
                <CreateRewardDrawer 
                    programs={programs}
                    onClose={() => setIsCreateRewardOpen(false)}
                    onSuccess={() => { setIsCreateRewardOpen(false); fetchRewards(); fetchRewardKpis(); }}
                />
            )}
            {editReward && (
                <EditRewardDrawer
                    reward={editReward}
                    onClose={() => setEditReward(null)}
                    onSuccess={() => { setEditReward(null); fetchRewards(); fetchRewardKpis(); }}
                />
            )}
            {viewReward && (
                <RewardDetailDrawer
                    reward={viewReward}
                    onClose={() => setViewReward(null)}
                />
            )}

            {/* Promotion Drawers */}
            {isCreatePromoOpen && (
                <CreatePromotionDrawer 
                    programs={programs}
                    onClose={() => setIsCreatePromoOpen(false)}
                    onSuccess={() => { setIsCreatePromoOpen(false); fetchPromotions(); fetchPromoKpis(); }}
                />
            )}
            {editPromo && (
                <EditPromotionDrawer
                    promotion={editPromo}
                    onClose={() => setEditPromo(null)}
                    onSuccess={() => { setEditPromo(null); fetchPromotions(); fetchPromoKpis(); }}
                />
            )}
            {viewPromo && (
                <PromotionDetailDrawer
                    promotion={viewPromo}
                    onClose={() => setViewPromo(null)}
                />
            )}
        </div>
    );
};

export default RewardsPromotionsTab;

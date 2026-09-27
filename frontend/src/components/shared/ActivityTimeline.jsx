import React from 'react';
import { User, Package, FileSignature, Shield, CheckCircle, AlertCircle, Clock, Heart } from 'lucide-react';
import './ActivityTimeline.css';

const ActivityTimeline = ({ activities, loading }) => {
    
    if (loading) {
        return <div className="timeline-loading">Loading timeline...</div>;
    }

    if (!activities || activities.length === 0) {
        return <div className="timeline-empty">No activities recorded yet.</div>;
    }

    const getIcon = (module, action) => {
        if (action.toLowerCase().includes('create')) return <PlusCircle size={16} />;
        if (action.toLowerCase().includes('delete')) return <AlertCircle size={16} />;
        if (action.toLowerCase().includes('update')) return <CheckCircle size={16} />;
        
        switch (module.toLowerCase()) {
            case 'users': return <User size={16} />;
            case 'roles': return <Shield size={16} />;
            case 'inventory': return <Package size={16} />;
            case 'contracts': return <FileSignature size={16} />;
            case 'loyalty': return <Heart size={16} />;
            default: return <Clock size={16} />;
        }
    };

    return (
        <div className="activity-timeline">
            {activities.map((activity, index) => (
                <div className="timeline-item" key={activity.activityId || index}>
                    <div className="timeline-icon-container">
                        <div className="timeline-icon">
                            {getIcon(activity.module, activity.action)}
                        </div>
                        {index < activities.length - 1 && <div className="timeline-connector"></div>}
                    </div>
                    <div className="timeline-content">
                        <div className="timeline-header">
                            <span className="timeline-action">{activity.action}</span>
                            <span className="timeline-time">{new Date(activity.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="timeline-desc">{activity.description}</div>
                        {activity.user && (
                            <div className="timeline-user">
                                By: {activity.user.firstName} {activity.user.lastName} (@{activity.user.username})
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ActivityTimeline;

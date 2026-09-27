import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import '../layout/AppShell.css';

const Breadcrumb = () => {
    const location = useLocation();
    
    // Split the pathname and remove empty strings
    const pathnames = location.pathname.split('/').filter((x) => x);

    // If we are at root or just /app, maybe don't show full breadcrumb or handle differently
    if (pathnames.length === 0) return null;

    return (
        <nav className="breadcrumb" aria-label="breadcrumb">
            <Link to="/app" className="breadcrumb-item">BOMS</Link>
            
            {pathnames.map((value, index) => {
                // Skip the base 'app' segment in rendering if we already showed 'BOMS'
                if (value === 'app' && index === 0) return null;

                const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isLast = index === pathnames.length - 1;
                
                // Format the name: capitalize first letter, replace hyphens
                const name = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');

                return (
                    <React.Fragment key={to}>
                        <ChevronRight size={14} />
                        {isLast ? (
                            <span className="breadcrumb-item active" aria-current="page">
                                {name}
                            </span>
                        ) : (
                            <Link to={to} className="breadcrumb-item">
                                {name}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

export default Breadcrumb;

import React, { useState, useEffect } from 'react';
import InvestmentTable from './InvestmentTable';

const InvestmentTabs = ({ onRefresh, reloadKey }) => {
    const [active, setActive] = useState('stock');
    const [loading, setLoading] = useState(true);

    const tabs = ['stock', 'crypto', 'bond'];

    useEffect(() => {
        setLoading(true);
        const timeout = setTimeout(() => setLoading(false), 200);
        return () => clearTimeout(timeout);
    }, [active, reloadKey]);

    return (
        <div>
            <div className="flex justify-around border-b mb-4">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActive(tab)}
                        className={`py-2 px-4 font-medium ${
                            active === tab
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-500'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            <div key={reloadKey}>
                {loading ? (
                    <div className="flex justify-center items-center h-40 animate-fadeIn">
                        <div className="animate-spin h-6 w-6 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                ) : (
                    <InvestmentTable category={active} onRefresh={onRefresh} />
                )}
            </div>
        </div>
    );
};

export default InvestmentTabs;
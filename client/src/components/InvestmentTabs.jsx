import React, { useState } from 'react';
import InvestmentTable from './InvestmentTable';

const categories = ['Stocks', 'Crypto', 'Bonds'];

const InvestmentTabs = () => {
    const [active, setActive] = useState('Stocks');

    return (
        <div className="bg-white p-4 rounded-2xl shadow mb-6">
            <div className="flex justify-around mb-4">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActive(cat)}
                        className={`font-semibold ${active === cat ? 'text-blue-800' : 'text-gray-400'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
            <InvestmentTable category={active} />
        </div>
    );
};

export default InvestmentTabs;
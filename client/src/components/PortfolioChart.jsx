import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Day', value: 100000 },
    { name: 'Week', value: 112000 },
    { name: 'Month', value: 123000 },
    { name: 'Year', value: 18000 }
];

const PortfolioChart = () => {
    return (
        <div className="bg-white p-4 rounded-2xl shadow mb-6">
            <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#16a34a" fill="#bbf7d0" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PortfolioChart;
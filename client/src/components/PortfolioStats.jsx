import React, { useEffect, useState, useRef } from 'react';

const PortfolioStats = () => {
    const [stats, setStats] = useState({
        totalValue: 0,
        monthlyGain: 0,
        totalProfit: 0
    });
    const [highlightColor, setHighlightColor] = useState('');
    const [highlightTotalColor, setHighlightTotalColor] = useState('');
    const previousMonthlyGain = useRef(0);
    const previousTotalValue = useRef(0);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/portfolio/stats');
                const data = await response.json();

                if (data.totalValue !== previousTotalValue.current) {
                    const direction = data.totalValue > previousTotalValue.current ? 'up' : 'down';

                    setHighlightTotalColor('');
                    requestAnimationFrame(() => {
                        setHighlightTotalColor(direction === 'up' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)');
                        setTimeout(() => setHighlightTotalColor(''), 600);
                    });

                    previousTotalValue.current = data.totalValue;
                }

                if (data.monthlyGain !== previousMonthlyGain.current) {
                    const direction = data.monthlyGain > previousMonthlyGain.current ? 'up' : 'down';

                    setHighlightColor('');
                    requestAnimationFrame(() => {
                        setHighlightColor(direction === 'up' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)');
                        setTimeout(() => setHighlightColor(''), 600);
                    });

                    previousMonthlyGain.current = data.monthlyGain;
                }

                setStats(data);
            } catch (error) {
                console.error('Chyba při načítání statistik portfolia:', error);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div
                style={{ backgroundColor: highlightTotalColor }}
                className="bg-white p-4 rounded-2xl shadow text-center transition-colors duration-500"
            >
                <h2 className="text-gray-500">Total Portfolio</h2>
                <p className="text-2xl font-bold text-blue-800">
                    {stats.totalValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} $
                </p>
            </div>
            <div
                style={{ backgroundColor: highlightColor }}
                className="bg-white p-4 rounded-2xl shadow text-center transition-colors duration-500"
            >
                <h2 className="text-gray-500">Gain of month</h2>
                <p className={`text-2xl font-bold ${stats.monthlyGain >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {stats.monthlyGain >= 0 ? '+' : ''}
                    {stats.monthlyGain.toFixed(2)} %
                </p>
            </div>
            <div
                style={{ backgroundColor: highlightColor }}
                className="bg-white p-4 rounded-2xl shadow text-center transition-colors duration-500"
            >
                <h2 className="text-gray-500">Total Profit</h2>
                <p className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {stats.totalProfit >= 0 ? '+' : ''}
                    {stats.totalProfit.toFixed(2)} %
                </p>
            </div>
        </div>
    );
};

export default PortfolioStats;


import React, { useEffect, useState, useRef } from 'react';

const PortfolioStats = () => {
    const [stats, setStats] = useState({
        totalValue: 0,
        monthlyGain: 0,
        totalProfit: 0
    });
    const [highlighted, setHighlighted] = useState("");
    const [loading, setLoading] = useState(false);
    const [gainHighlight, setGainHighlight] = useState(false);
    const [highlightColor, setHighlightColor] = useState('');
    const [highlightTotalColor, setHighlightTotalColor] = useState('');
    const previousMonthlyGain = useRef(0);
    const previousTotalValue = useRef(0);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/stats/portfolio');
                const data = await response.json();
                if (data.totalValue !== previousTotalValue.current) {
                    const direction = data.totalValue > previousTotalValue.current ? 'up' : 'down';

                    setHighlightTotalColor('');
                    setTimeout(() => {
                        setHighlightTotalColor(direction === 'up' ? 'bg-green-100' : 'bg-red-100');
                    }, 10);
                    setTimeout(() => {
                        setHighlightTotalColor('');
                    }, 510);

                    previousTotalValue.current = data.totalValue;
                }

                // Detekce změny hodnoty monthlyGain
                if (data.monthlyGain !== previousMonthlyGain.current) {
                    const direction = data.monthlyGain > previousMonthlyGain.current ? 'up' : 'down';

                    setHighlightColor('');
                    setTimeout(() => {
                        setHighlightColor(direction === 'up' ? 'bg-green-100' : 'bg-red-100');
                    }, 10);
                    setTimeout(() => {
                        setHighlightColor('');
                    }, 510);

                    previousMonthlyGain.current = data.monthlyGain;

                }


                setStats(data);
            } catch (error) {
                console.error('Chyba při načítání statistik portfolia:', error);
            } finally {
                setLoading(false);
            }
        };


        // Poprvé hned po načtení komponenty
        fetchStats();

        // Pak každých 10 sekund (10000 ms)
        const interval = setInterval(fetchStats, 10000);

        // Vyčisti interval při odchodu z komponenty
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div
                className={`bg-white p-4 rounded-2xl shadow text-center transition-colors duration-300 ${highlightTotalColor}`}
            >
                <h2 className="text-gray-500">Total Portfolio</h2>
                <p className="text-2xl font-bold text-blue-800">
                    {stats.totalValue.toLocaleString('cs-CZ')} $
                </p>
            </div>
            <div
                className={`bg-white p-4 rounded-2xl shadow text-center transition-colors duration-300 ${highlightColor}`}
            >
                <h2 className="text-gray-500">Gain of month</h2>
                <p
                    className={`text-2xl font-bold ${
                        stats.monthlyGain >= 0 ? 'text-green-600' : 'text-red-500'
                    }`}
                >
                    {stats.monthlyGain >= 0 ? '+' : ''}
                    {stats.monthlyGain.toFixed(2)} %
                </p>
            </div>
            <div
                className={`bg-white p-4 rounded-2xl shadow text-center transition-colors duration-300 ${highlightColor}`}
            >
                <h2 className="text-gray-500">Total Prosit</h2>
                <p
                    className={`text-2xl font-bold ${
                        stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-500'
                    }`}
                >
                    {stats.totalProfit >= 0 ? '+' : ''}
                    {stats.totalProfit.toFixed(2)} %
                </p>
            </div>
        </div>
    );
};

export default PortfolioStats;
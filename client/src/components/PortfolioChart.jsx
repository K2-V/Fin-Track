import React, { useState, useEffect, useRef } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const periods = ['Day', 'Week', 'Month', 'Year'];

const PortfolioChart = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('Day');
    const [history, setHistory] = useState([]);
    const intervalRef = useRef(null);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/portfolio/history');
            const data = await res.json();
            setHistory(data);
        } catch (err) {
            console.error('Chyba při načítání historie portfolia:', err);
        }
    };

    useEffect(() => {
        fetchHistory(); // první načtení
        intervalRef.current = setInterval(fetchHistory, 30000); // každých 30 sekund

        return () => clearInterval(intervalRef.current); // vyčištění při unmountu
    }, []);

    const groupBy = (arr, keyFn) => {
        const map = new Map();
        for (const item of arr) {
            const key = keyFn(item);
            if (!map.has(key)) {
                map.set(key, []);
            }
            map.get(key).push(item);
        }
        return map;
    };

    const transformData = (period) => {
        const now = new Date();

        const filtered = history.filter((item) => {
            const date = new Date(item.date);
            const diffDays = (now - date) / (1000 * 60 * 60 * 24);
            switch (period) {
                case 'Day':
                    return (
                        date.getDate() === now.getDate() &&
                        date.getMonth() === now.getMonth() &&
                        date.getFullYear() === now.getFullYear()
                    );
                case 'Week':
                    return diffDays <= 7;
                case 'Month':
                    return diffDays <= 31;
                case 'Year':
                    return diffDays <= 365;
                default:
                    return true;
            }
        });

        const transformed = filtered.map((item) => {
            const date = new Date(item.date);
            return {
                date,
                timestamp: date.getTime(),
                value: item.totalValue
            };
        });

        if (period === 'Day') {
            return transformed;
        }

        const groupKeyFn = (item) => {
            const d = item.date;
            if (period === 'Year') {
                const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
                const pastDays = Math.floor((d - firstDayOfYear) / (1000 * 60 * 60 * 24));
                return `${d.getFullYear()}-W${Math.floor(pastDays / 7)}`;
            } else {
                return d.toISOString().substring(0, 10);
            }
        };

        const grouped = groupBy(transformed, groupKeyFn);

        const result = Array.from(grouped.entries()).map(([key, items]) => {
            const avg = items.reduce((sum, i) => sum + i.value, 0) / items.length;
            const ts = items[0].timestamp;
            return { timestamp: ts, value: avg };
        });

        return result.sort((a, b) => a.timestamp - b.timestamp);
    };

    const chartData = transformData(selectedPeriod);
    const ticks = chartData.map(d => d.timestamp);

    const last = chartData[chartData.length - 1];
    const prev = chartData[chartData.length - 2];
    const isGrowing = last && prev && last.value > prev.value;

    const strokeColor = isGrowing ? '#16a34a' : '#dc2626';
    const fillColor = isGrowing ? '#bbf7d0' : '#fecaca';

    const formatLabel = (val) => {
        const d = new Date(val);
        if (selectedPeriod === 'Day') {
            return d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
        } else if (selectedPeriod === 'Year') {
            return d.toLocaleDateString('cs-CZ', { month: 'short' });
        } else {
            return d.toLocaleDateString('cs-CZ');
        }
    };

    return (
        <div className="bg-white p-4 rounded-2xl shadow mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Portfolio Overview</h3>
                <div className="flex gap-2">
                    {periods.map((p) => (
                        <button
                            key={p}
                            className={`px-3 py-1 text-sm rounded-full ${
                                selectedPeriod === p
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                            onClick={() => setSelectedPeriod(p)}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData}>
                    <XAxis
                        dataKey="timestamp"
                        type="number"
                        scale="time"
                        ticks={ticks}
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={formatLabel}
                    />
                    <YAxis
                        domain={['auto', 'auto']}
                        tickFormatter={(val) => `${val.toLocaleString('cs-CZ')} $`}
                        width={80}
                    />
                    <Tooltip
                        formatter={(val) => `${val.toLocaleString('cs-CZ')} $`}
                        labelFormatter={formatLabel}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={strokeColor}
                        fill={fillColor}
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PortfolioChart;
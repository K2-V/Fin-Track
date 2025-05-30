import React, { useEffect, useState, useRef } from 'react';
import Modal from './UI/Modal';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import EditInvestmentModal from './EditInvestment';

const InvestmentDetail = ({ asset, onClose, onRefresh }) => {
    const [investments, setInvestments] = useState([]);
    const [isBond, setIsBond] = useState(false);
    const [currentPrice, setCurrentPrice] = useState(null);
    const [currentValue, setCurrentValue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [priceHistory, setPriceHistory] = useState([]);
    const [editingId, setEditingId] = useState(null);

    const previousValue = useRef(null);
    const previousPrice = useRef(null);
    const [highlightValueColor, setHighlightValueColor] = useState('');
    const [highlightPriceColor, setHighlightPriceColor] = useState('');

    const isCrypto = /btc|eth|usdt|bitcoin|ethereum|tether/i.test(asset);

    const graphColor = priceHistory.length > 0 && currentPrice > priceHistory[0].price
        ? { stroke: '#16a34a', fill: '#bbf7d0' }
        : { stroke: '#dc2626', fill: '#fecaca' };

    useEffect(() => {
        const fetchAll = async () => {
            await fetchPriceHistory();
            await fetchInvestments();
        };

        fetchAll(); // první zavolání ihned

        const interval = setInterval(fetchAll, 10000); // každých 10 s
        return () => clearInterval(interval);
    }, [asset]);

    const fetchData = async () => {
        await Promise.all([fetchInvestments(), fetchPriceHistory()]);
    };

    const fetchPriceHistory = async () => {
        try {
            const res = await axios.get(`/api/marketprices/${asset}`);
            const now = new Date();
            const allData = res.data.map(item => ({
                ...item,
                dateObj: new Date(item.date),
                timestamp: new Date(item.date).getTime()
            }));

            let start, end;
            if (isCrypto) {
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            } else {
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                const hasTodayData = allData.some(item => item.dateObj >= todayStart && item.dateObj <= todayEnd);

                if (hasTodayData) {
                    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 30);
                    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 0);
                } else {
                    const yesterday = new Date(now);
                    yesterday.setDate(yesterday.getDate() - 1);
                    start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 15, 30);
                    end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 22, 0);
                }
            }

            const filtered = allData.filter(item => item.dateObj >= start && item.dateObj <= end);
            const sorted = filtered.map(item => ({ ...item, date: item.timestamp })).sort((a, b) => a.date - b.date);
            setPriceHistory(sorted);
        } catch (err) {
            console.error('Chyba při načítání historie cen:', err);
        }
    };

    const fetchInvestments = async () => {
        try {
            const res = await axios.get(`/api/investments?assetName=${asset}`);
            const data = res.data;
            setInvestments(data);

            const bond = data.some(inv => inv.couponRate != null);
            setIsBond(bond);

            if (!bond && data[0]) {
                const price = data[0].currentPrice ?? 0;
                const total = data.reduce((sum, inv) => sum + (inv.currentValue ?? 0), 0);

                if (previousPrice.current !== null && price !== previousPrice.current) {
                    const direction = price > previousPrice.current ? 'up' : 'down';
                    setHighlightPriceColor(direction === 'up' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)');
                    setTimeout(() => setHighlightPriceColor(''), 600);
                }
                previousPrice.current = price;

                if (previousValue.current !== null && total !== previousValue.current) {
                    const direction = total > previousValue.current ? 'up' : 'down';
                    setHighlightValueColor(direction === 'up' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)');
                    setTimeout(() => setHighlightValueColor(''), 600);
                }
                previousValue.current = total;

                setCurrentValue(total);
                setCurrentPrice(price);
            } else {
                setCurrentValue(null);
                setCurrentPrice(null);
            }
            setLoading(false); // Přesunuto sem, aby se ukončila animace při prvním načtení
        } catch (err) {
            console.error('Chyba při načítání investic:', err);
            setLoading(false);
        }
    };
    const handleDelete = async (id) => {
        if (!window.confirm('Opravdu chcete tuto investici smazat?')) return;
        try {
            await axios.delete(`/api/investments/${id}`);
            await fetchInvestments();
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Chyba při mazání investice:', err);
            alert('Nepodařilo se smazat investici.');
        }
    };
    const calculateMonthsLeft = (purchaseDate, totalMonths) => {
        const now = new Date();
        const start = new Date(purchaseDate);
        const diffMs = now - start;
        const elapsedMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
        const remaining = totalMonths - elapsedMonths;
        return remaining > 0 ? remaining.toFixed(0) : '0';
    };


    const getFixedTicks = () => {
        const chartDate = priceHistory.length > 0 ? new Date(priceHistory[0].date) : new Date();
        chartDate.setHours(0, 0, 0, 0);

        const ticks = [];
        if (isCrypto) {
            for (let h = 0; h <= 23; h++) {
                const d = new Date(chartDate);
                d.setHours(h, 0, 0, 0);
                ticks.push(d.getTime());
            }
        } else {
            const opening = new Date(chartDate);
            opening.setHours(16, 0, 0, 0);
            ticks.push(opening.getTime());
            for (let h = 17; h <= 22; h++) {
                const d = new Date(chartDate);
                d.setHours(h, 0, 0, 0);
                ticks.push(d.getTime());
            }
        }
        return ticks;
    };

    return (
        <Modal open={true} onClose={() => { if (onRefresh) onRefresh(); onClose(); }}>
            <div className="w-full max-w-[1400px] min-h-[300px] mx-auto animate-fadeIn">
                {loading ? (
                    <div className="flex justify-center items-center h-40 animate-fadeIn">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                ) : (
                    <div>
                        <div className="flex justify-between items-start mb-4 gap-6">
                            <div className="flex-1">
                                <h2 className="text-lg font-semibold">Investments Detail</h2>
                                <div className="text-sm text-gray-600">Asset: {asset}</div>
                                {!isBond && (
                                    <>
                                        <div className="text-sm" style={{ backgroundColor: highlightPriceColor }}>
                                            Price: ${currentPrice ?? 'N/A'}
                                        </div>
                                        <div className="text-sm text-green-600" style={{ backgroundColor: highlightValueColor }}>
                                            Current Value: ${currentValue?.toFixed(2)}
                                        </div>
                                    </>
                                )}
                            </div>
                            {!isBond && priceHistory.length > 0 && (
                                <div className="w-full bg-white p-4 rounded-2xl shadow h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={priceHistory}>
                                            <XAxis
                                                dataKey="date"
                                                ticks={getFixedTicks()}
                                                domain={[getFixedTicks()[0], getFixedTicks().slice(-1)[0]]}
                                                type="number"
                                                scale="time"
                                                tickFormatter={(val) => new Date(val).toLocaleTimeString('cs-CZ', { hour: '2-digit' })}
                                                tick={{ fontSize: 10, fill: '#273176' }}
                                            />
                                            <YAxis
                                                domain={['auto', 'auto']}
                                                tick={{ fontSize: 10, fill: '#273176' }}
                                                width={50}
                                            />
                                            <Tooltip
                                                formatter={(val) => `${val.toFixed(2)} $`}
                                                labelFormatter={(label) => new Date(label).toLocaleString('cs-CZ', {
                                                    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
                                                })}
                                            />
                                            <Area
                                                type="natural"
                                                dataKey="price"
                                                stroke={graphColor.stroke}
                                                fill={graphColor.fill}
                                                strokeWidth={2}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                        <table className="w-full text-sm mt-4">
                            <thead className="text-center border-b">
                            <tr>
                                <th className="py-2">Date</th>
                                {isBond ? (
                                    <>
                                        <th>Coupon Rate</th>
                                        <th>Months Left</th>
                                    </>
                                ) : (
                                    <>
                                        <th>Amount</th>
                                        <th>Purchase Price</th>
                                        <th>Current Value</th>
                                    </>
                                )}
                                <th>Change</th>
                                <th>Action</th>
                            </tr>
                            </thead>
                            <tbody>
                            {investments.map((inv, idx) => (
                                <tr key={idx} className="border-b text-center">
                                    <td className="py-2">{new Date(inv.purchaseDate).toLocaleDateString('cs-CZ')}</td>
                                    {isBond ? (
                                        <>
                                            <td>{inv.couponRate ?? 'N/A'} %</td>
                                            <td>{calculateMonthsLeft(inv.purchaseDate, inv.length)}</td>
                                        </>
                                    ) : (
                                        <>
                                            <td>{inv.amount}</td>
                                            <td>{inv.initialPrice}</td>
                                            <td>{inv.currentValue != null
                                                ? `${inv.currentValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} $`
                                                : 'N/A'}
                                            </td>
                                        </>
                                    )}
                                    <td>
                                        {typeof inv.change === 'number' && typeof inv.changePct === 'number' ? (
                                            <div className="flex flex-col items-center">
                        <span className={inv.change >= 0 ? 'text-green-600' : 'text-red-500'}>
                            {inv.change >= 0 ? '+' : ''}{inv.change.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} $
                        </span>
                                                <span className={`text-sm ${inv.changePct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {inv.changePct >= 0 ? '+' : ''}{inv.changePct.toFixed(1)} %
                        </span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">N/A</span>
                                        )}
                                    </td>
                                    <td>
                                        <button onClick={() => handleDelete(inv._id)} className="text-red-600 hover:underline text-sm mr-2">
                                            Delete
                                        </button>
                                        <button onClick={() => setEditingId(inv._id)} className="text-blue-600 hover:underline text-sm">
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {editingId && (
                <EditInvestmentModal
                    investmentId={editingId}
                    onClose={() => setEditingId(null)}
                    onSuccess={async () => {
                        await fetchInvestments();
                        setEditingId(null);
                        if (onRefresh) onRefresh();
                    }}
                />
            )}
        </Modal>
    );
};

export default InvestmentDetail;
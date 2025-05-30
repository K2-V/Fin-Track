import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import InvestmentDetail from './InvestmentDetail';

const InvestmentTable = ({ category }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const intervalRef = useRef(null);

    const fetchFullData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/investments/merged?type=${category.toLowerCase()}`);
            setData(res.data);
        } catch (err) {
            console.error('Error to load investments:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUpdatesOnly = async () => {
        try {
            const res = await axios.get(`/api/investments/merged?type=${category.toLowerCase()}`);
            const newData = res.data;

            setData(prevData =>
                prevData.map(item => {
                    const updated = newData.find(u => u.asset === item.asset);
                    return updated
                        ? {
                            ...item,
                            currentValue: updated.currentValue,
                            profit: updated.profit,
                            profitPct: updated.profitPct
                        }
                        : item;
                })
            );
        } catch (err) {
            console.error('Error while updating values:', err);
        }
    };

    useEffect(() => {
        fetchFullData();

        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(fetchUpdatesOnly, 30000);

        return () => clearInterval(intervalRef.current);
    }, [category]);

    const handleOpenDetail = (assetName) => {
        setSelectedAsset(assetName);
    };

    if (loading) return <p className="text-center">Loading</p>;
    if (data.length === 0) return <p className="text-center text-gray-400">No data</p>;

    return (
        <>
            <table className="w-full text-left">
                <thead>
                <tr className="text-gray-500 border-b">
                    <th className="py-2">Name</th>
                    <th className="py-2">Current Value</th>
                    <th className="py-2">Change</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {data.map((item, idx) => (
                    <tr key={idx} className="border-t text-base">
                        <td className="py-2">{item.asset}</td>
                        <td className="py-2">
                            {item.currentValue != null
                                ? item.currentValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' $'
                                : '—'}
                        </td>
                        <td
                            className={`py-2 ${
                                item.profitPct < 0 ? 'text-red-500' : 'text-green-600'
                            }`}
                        >
                            <div className="flex flex-col leading-tight">
                                    <span>
                                        {item.profit >= 0 ? '+' : ''}
                                        {item.profit?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} $
                                    </span>
                                <span className="text-sm">
                                        {item.profitPct >= 0 ? '+' : ''}
                                    {item.profitPct?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} %
                                    </span>
                            </div>
                        </td>
                        <td className="py-2">
                            <button
                                onClick={() => handleOpenDetail(item.asset)}
                                className="text-blue-600 hover:underline text-sm"
                            >
                                Detail
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {selectedAsset && (
                <InvestmentDetail
                    asset={selectedAsset}
                    onClose={() => setSelectedAsset(null)}
                />
            )}
        </>
    );
};

export default InvestmentTable;
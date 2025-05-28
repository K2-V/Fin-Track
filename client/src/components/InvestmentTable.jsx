import React, { useEffect, useState } from 'react';
import axios from 'axios';
import InvestmentDetail from './InvestmentDetail'; // cesta dle struktury

const InvestmentTable = ({ category }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAsset, setSelectedAsset] = useState(null);

    useEffect(() => {
        setLoading(true);
        axios
            .get(`/api/investments/merged?type=${category.toLowerCase()}`)
            .then(res => {
                setData(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Chyba při načítání investic:', err);
                setLoading(false);
            });
    }, [category]);

    const handleOpenDetail = (assetName) => {
        setSelectedAsset(assetName);
    };

    if (loading) return <p className="text-center">Načítání…</p>;
    if (data.length === 0) return <p className="text-center text-gray-400">Žádná data</p>;

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
                                ? item.currentValue.toLocaleString('cs-CZ') + '$'
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
                                        {item.profit?.toLocaleString('cs-CZ')} $
                                    </span>
                                    <span className="text-sm">
                                        {item.profitPct >= 0 ? '+' : ''}
                                    {item.profitPct?.toFixed(1)} %
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
                <InvestmentDetail asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
            )}
        </>
    );
};

export default InvestmentTable;
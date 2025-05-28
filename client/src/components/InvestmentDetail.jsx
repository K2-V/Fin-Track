import React, { useEffect, useState } from 'react';
import Modal from './UI/Modal';
import axios from 'axios';

const InvestmentDetail = ({ asset, onClose, onRefresh }) => {
    const [investments, setInvestments] = useState([]);
    const [isBond, setIsBond] = useState(false);
    const [currentPrice, setCurrentPrice] = useState(null);
    const [currentValue, setCurrentValue] = useState(null);
    const [loading, setLoading] = useState(true); // přidáno

    useEffect(() => {
        void fetchInvestments();
    }, [asset]);

    const fetchInvestments = async () => {
        try {
            setLoading(true); // začni loading
            const res = await axios.get(`/api/investments?assetName=${asset}`);
            const data = res.data;

            setInvestments(data);

            const bond = data.some(inv => inv.couponRate != null);
            setIsBond(bond);

            if (!bond) {
                const total = data.reduce((sum, inv) => sum + (inv.currentValue ?? 0), 0);
                setCurrentValue(total);
                setCurrentPrice(data[0]?.currentPrice ?? null);
            } else {
                setCurrentValue(null);
                setCurrentPrice(null);
            }
        } catch (err) {
            console.error('Chyba při načítání investic:', err);
        } finally {
            setTimeout(() => setLoading(false), 400); // malé zpoždění pro hladší efekt
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

    const handleClose = () => {
        if (onRefresh) onRefresh();
        onClose();
    };

    const calculateMonthsLeft = (purchaseDate, totalMonths) => {
        const now = new Date();
        const start = new Date(purchaseDate);
        const diffMs = now - start;
        const elapsedMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
        const remaining = totalMonths - elapsedMonths;
        return remaining > 0 ? remaining.toFixed(0) : '0';
    };

    return (
        <Modal open={true} onClose={handleClose}>
            <div className="max-w-5xl w-full min-h-[300px] mx-auto animate-fadeIn transition-opacity duration-500">
            {loading ? (
                <div className="flex justify-center items-center h-40 animate-fadeIn">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
            ) : (
                <div className="animate-fadeIn transition-opacity duration-500">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-lg font-semibold">Investments Detail</h2>
                            <div className="text-sm text-gray-600">Asset: {asset}</div>
                            {!isBond && (
                                <>
                                    <div className="text-sm">Price: ${currentPrice ?? 'N/A'}</div>
                                    <div className="text-sm text-green-600">
                                        Current Value: ${currentValue?.toFixed(2)}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <table className="w-full text-sm">
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
                                        <td>{inv.currentValue != null ? `${inv.currentValue.toFixed(2)} $` : 'N/A'}</td>
                                    </>
                                )}
                                <td>
                                    {typeof inv.change === 'number' && typeof inv.changePct === 'number' ? (
                                        <div className="flex flex-col items-center">
                                                <span className={inv.change >= 0 ? 'text-green-600' : 'text-red-500'}>
                                                    {inv.change >= 0 ? '+' : ''}
                                                    {inv.change.toLocaleString('cs-CZ')} $
                                                </span>
                                            <span className={`text-sm ${inv.changePct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {inv.changePct >= 0 ? '+' : ''}
                                                {inv.changePct.toFixed(1)} %
                                                </span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">N/A</span>
                                    )}
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleDelete(inv._id)}
                                        className="text-red-600 hover:underline text-sm"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
            </div>
        </Modal>
    );
};

export default InvestmentDetail;
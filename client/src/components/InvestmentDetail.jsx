import React, { useEffect, useState } from 'react';
import Modal from './UI/Modal';
import axios from 'axios';

const InvestmentDetail = ({ asset, onClose, onRefresh }) => {
    const [investments, setInvestments] = useState([]);
    const [currentPrice, setCurrentPrice] = useState(null);
    const [currentValue, setCurrentValue] = useState(null);

    const fetchInvestments = async () => {
        try {
            const res = await axios.get(`/api/investments?assetName=${asset}`);
            const data = res.data;
            setInvestments(data);

            const total = data.reduce((sum, inv) => sum + (inv.amount * inv.currentPrice), 0);
            setCurrentValue(total);
            setCurrentPrice(data[0]?.currentPrice ?? null);
        } catch (err) {
            console.error('Chyba při načítání investic:', err);
        }
    };

    useEffect(() => {
        fetchInvestments();
    }, [asset]);

    const handleDelete = async (id) => {
        if (!window.confirm('Opravdu chcete tuto investici smazat?')) return;

        try {
            await axios.delete(`/api/investments/${id}`);
            await fetchInvestments(); // Obnovit data + current value
        } catch (err) {
            console.error('Chyba při mazání investice:', err);
            alert('Nepodařilo se smazat investici.');
        }
    };

    const handleClose = () => {
        if (onRefresh) onRefresh(); // Voláme parent refresh
        onClose();
    };

    return (
        <Modal open={true} onClose={handleClose}>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-lg font-semibold">Investments Detail</h2>
                    <div className="text-sm text-gray-600">Asset: {asset}</div>
                    <div className="text-sm">Price: ${currentPrice}</div>
                    <div className="text-sm text-green-600">
                        Current Value: ${currentValue?.toFixed(2)}
                    </div>
                </div>
            </div>

            <table className="w-full text-sm">
                <thead className="text-center border-b">
                <tr>
                    <th className="py-2">Date</th>
                    <th>Amount</th>
                    <th>Purchase Price</th>
                    <th>Change</th>
                    <th>Akce</th>
                </tr>
                </thead>
                <tbody>
                {investments.map((inv, idx) => (
                    <tr key={idx} className="border-b text-center">
                        <td className="py-2">{new Date(inv.purchaseDate).toLocaleDateString('cs-CZ')}</td>
                        <td>{inv.amount}</td>
                        <td>{inv.initialPrice}</td>
                        <td>
                            {typeof inv.change === 'number' && typeof inv.changePct === 'number' ? (
                                <div className="flex flex-col leading-tight items-center">
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
                                Smazat
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </Modal>
    );
};

export default InvestmentDetail;
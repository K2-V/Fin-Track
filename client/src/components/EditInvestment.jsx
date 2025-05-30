import React, { useEffect, useState } from 'react';
import axios from 'axios';

const EditInvestmentModal = ({ investmentId, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('stock');
    const [form, setForm] = useState({
        assetName: '',
        amount: '',
        initialPrice: '',
        purchaseDate: '',
        couponRate: '',
        investmentLength: ''
    });

    const isBond = category.toLowerCase() === 'bond';

    useEffect(() => {
        const fetchInvestment = async () => {
            try {
                const res = await axios.get(`/api/investments/${investmentId}`);
                const data = res.data;
                setForm({
                    assetName: data.assetName || '',
                    amount: data.amount?.toString() || '',
                    initialPrice: data.initialPrice?.toString() || '',
                    purchaseDate: data.purchaseDate?.slice(0, 10) || '',
                    couponRate: data.couponRate?.toString() || '',
                    investmentLength: data.investmentLength?.toString() || ''
                });
                setCategory(data.categoryId?.name || 'stock');
            } catch (err) {
                console.error('Chyba při načítání investice:', err);
                alert('Nepodařilo se načíst investici.');
            } finally {
                setLoading(false);
            }
        };

        fetchInvestment();
    }, [investmentId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const getAssetPlaceholder = () => {
        switch (category.toLowerCase()) {
            case 'stock': return 'e.g. Apple Inc. (AAPL)';
            case 'crypto': return 'e.g. Bitcoin';
            case 'bond': return 'e.g. Government Bond CZ';
            default: return 'Investment name';
        }
    };

    const handleSubmit = async () => {
        const payload = {
            ...form,
            amount: parseFloat(form.amount),
            initialPrice: isBond ? 1 : parseFloat(form.initialPrice),
            couponRate: isBond ? parseFloat(form.couponRate) : undefined,
            investmentLength: isBond ? parseInt(form.investmentLength) : undefined,
            categoryName: category.toLowerCase()
        };

        try {
            await axios.put(`/api/investments/${investmentId}`, payload);
            alert('Investice byla úspěšně upravena.');
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error('Chyba při ukládání změn:', err);
            alert('Nepodařilo se upravit investici.');
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg text-center">Načítání...</div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 text-xl">&times;</button>
                <h2 className="text-xl font-semibold mb-4 text-center">Edit Investment</h2>

                {!isBond && (
                    <>
                        <label className="block text-sm font-medium">Investment Name</label>
                        <input
                            name="assetName"
                            value={form.assetName}
                            onChange={handleChange}
                            className="w-full mb-3 p-2 border rounded"
                            placeholder={getAssetPlaceholder()}
                        />
                        <label className="block text-sm font-medium">Amount</label>
                        <input
                            name="amount"
                            value={form.amount}
                            onChange={handleChange}
                            className="w-full mb-3 p-2 border rounded"
                            type="number"
                        />
                        <label className="block text-sm font-medium">Purchase Price</label>
                        <input
                            name="initialPrice"
                            value={form.initialPrice}
                            onChange={handleChange}
                            className="w-full mb-3 p-2 border rounded"
                            type="number"
                        />
                    </>
                )}

                {isBond && (
                    <>
                        <label className="block text-sm font-medium">Bond Name</label>
                        <input
                            name="assetName"
                            value={form.assetName}
                            onChange={handleChange}
                            className="w-full mb-3 p-2 border rounded"
                            placeholder="e.g. Government Bond CZ"
                        />
                        <label className="block text-sm font-medium">Amount Invested</label>
                        <input
                            name="amount"
                            value={form.amount}
                            onChange={handleChange}
                            className="w-full mb-3 p-2 border rounded"
                            type="number"
                        />
                        <label className="block text-sm font-medium">Coupon Rate (%)</label>
                        <input
                            name="couponRate"
                            value={form.couponRate}
                            onChange={handleChange}
                            className="w-full mb-3 p-2 border rounded"
                            type="number"
                        />
                        <label className="block text-sm font-medium">Investment Length (months)</label>
                        <input
                            name="investmentLength"
                            value={form.investmentLength}
                            onChange={handleChange}
                            className="w-full mb-3 p-2 border rounded"
                            type="number"
                        />
                    </>
                )}

                <label className="block text-sm font-medium">Purchase Date</label>
                <input
                    name="purchaseDate"
                    value={form.purchaseDate}
                    onChange={handleChange}
                    className="w-full mb-4 p-2 border rounded"
                    type="date"
                />

                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded text-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-blue-700 text-white rounded"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditInvestmentModal;
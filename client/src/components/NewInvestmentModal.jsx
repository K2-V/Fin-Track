import React, { useState } from 'react';
import axios from 'axios';

const NewInvestmentModal = ({ onClose }) => {
    const [category, setCategory] = useState('stock');
    const [form, setForm] = useState({
        assetName: '',
        amount: '1',
        initialPrice: '',
        purchaseDate: '',
        couponRate: '',
        investmentLength: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const getAssetPlaceholder = () => {
        switch (category.toLowerCase()) {
            case 'stock':
                return 'e.g. Apple Inc. (AAPL)';
            case 'crypto':
                return 'e.g. Bitcoin';
            case 'bond':
                return 'e.g. Government Bond CZ';
            default:
                return 'Investment name';
        }
    };
    const handleSubmit = async () => {
        const payload = {
            ...form,
            categoryName: category.toLowerCase()
        };

        if (category === 'bond') {
            payload.initialPrice = 1;
        } else {
            delete payload.couponRate;
            delete payload.investmentLength;}
        try {
            await axios.post('/api/investments', payload);
            alert('Investment was saved successfully.');
            onClose();
        } catch (error) {
            console.error('Error while saving the investment:', error);
            alert('Failed to save the investment.');
        }
    };

    const isBond = category.toLowerCase() === 'bond';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 text-xl">&times;</button>
                <h2 className="text-xl font-semibold mb-4 text-center">Add New Investment</h2>

                <label className="block mb-2 text-sm font-medium">Category</label>
                <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full mb-4 p-2 border rounded"
                >
                    <option value="stock">Stocks</option>
                    <option value="crypto">Crypto</option>
                    <option value="bond">Bonds</option>
                </select>
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
                            placeholder="$"
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
                            placeholder={getAssetPlaceholder()}
                        />
                        <label className="block text-sm font-medium">Amount Invested</label>
                        <input
                            name="amount"
                            value={form.amount}
                            onChange={handleChange}
                            className="w-full mb-3 p-2 border rounded"
                            type="number"
                            placeholder="e.g. 10000"
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
                        className="px-4 py-2 bg-[#273176] text-white rounded"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewInvestmentModal;
import React, { useState, useEffect } from 'react';
import PortfolioStats from './PortfolioStats';
import PortfolioChart from './PortfolioChart';
import InvestmentTabs from './InvestmentTabs';
import AddInvestmentButton from './AddInvestmentButton';
import NewInvestmentModal from './NewInvestmentModal';

const Dashboard = () => {
    const [showModal, setShowModal] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [loading, setLoading] = useState(true);

    const handleCloseModal = () => {
        setShowModal(false);
        setReloadKey(prev => prev + 1);
        setLoading(true);
    };

    useEffect(() => {
        const timeout = setTimeout(() => setLoading(false), 200);
        return () => clearTimeout(timeout);
    }, [reloadKey]);

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="w-full bg-[#273176] text-white px-6 py-4 rounded-b-3xl mb-6">
                <div className="flex items-center space-x-3">
                    <img src="/logo512.png" alt="Logo" className="h-8 w-8" />
                    <h1 className="text-2xl font-bold text-white">FinTrack</h1>
                </div>
            </header>
            <div className="px-6 flex flex-col gap-6 lg:flex-row">
                <div className="lg:w-7/12 space-y-6">
                    <div className="bg-white rounded-2xl shadow p-4 min-h-[120px]">
                        {loading ? (
                            <div className="flex justify-center items-center h-20 animate-fadeIn">
                                <div className="animate-spin h-6 w-6 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                            </div>
                        ) : (
                            <PortfolioStats key={reloadKey} />
                        )}
                    </div>

                    <div className="bg-white rounded-2xl shadow p-4">
                        {loading ? (
                            <div className="flex justify-center items-center h-full animate-fadeIn">
                                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                            </div>
                        ) : (
                            <PortfolioChart key={reloadKey} />
                        )}
                    </div>
                </div>
                <div className="lg:w-5/12">
                    <div className=" bg-white rounded-2xl shadow p-4 overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center items-center h-full animate-fadeIn">
                                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                            </div>
                        ) : (
                            <InvestmentTabs key={reloadKey} />
                        )}
                    </div>
                </div>
            </div>
            <div className="fixed bottom-6 right-6">
                <AddInvestmentButton onClick={() => setShowModal(true)} />
            </div>
            {showModal && <NewInvestmentModal onClose={handleCloseModal} />}
        </div>
    );
};

export default Dashboard;
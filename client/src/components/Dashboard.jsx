import React, { useState } from 'react';
import PortfolioStats from './PortfolioStats';
import PortfolioChart from './PortfolioChart';
import InvestmentTabs from './InvestmentTabs';
import AddInvestmentButton from './AddInvestmentButton';
import NewInvestmentModal from './NewInvestmentModal';

const Dashboard = () => {
    const [showModal, setShowModal] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    const handleCloseModal = () => {
        setShowModal(false);
        setReloadKey(prev => prev + 1); // vynucení přenačtení
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hlavička */}
            <header className="w-full bg-[#273176] text-white px-6 py-4 rounded-b-3xl mb-6">
                <div className="flex items-center space-x-3">
                    <img src="/logo512.png" alt="Logo" className="h-8 w-8" />
                    <h1 className="text-2xl font-bold text-white">FinTrack</h1>
                </div>
            </header>

            {/* Hlavní obsah */}
            <div className="px-6 lg:flex gap-6">
                {/* Levá část – stats + graf */}
                <div className="lg:w-7/12 space-y-6">
                    <PortfolioStats key={reloadKey} />
                    <div className=" h-[480px] bg-white rounded-2xl shadow p-4 h-[420px]">
                        <PortfolioChart key={reloadKey} />
                    </div>
                </div>

                {/* Pravá část – tabs */}
                <div className="lg:w-5/12">
                    <div className="h-[600px] bg-white rounded-2xl shadow p-4 overflow-y-auto">
                        <InvestmentTabs key={reloadKey} />
                    </div>
                </div>
            </div>

            {/* Tlačítko + modal */}
            <div className="fixed bottom-6 right-6">
                <AddInvestmentButton onClick={() => setShowModal(true)} />
            </div>

            {showModal && <NewInvestmentModal onClose={handleCloseModal} />}
        </div>
    );
};

export default Dashboard;
import React, { useState, useMemo } from 'react';
import { Sprout } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const SIPCalculatorWidget = () => {
    // State for Inputs
    const [investment, setInvestment] = useState(5000);
    const [rate, setRate] = useState(12);
    const [years, setYears] = useState(10);
    const [isStepUp, setIsStepUp] = useState(false);
    const [stepUpRate, setStepUpRate] = useState(10);

    // Constants / Formats
    const COLORS = ['#E5E7EB', '#00B37E']; // Grey (Invested), Green (Gained)
    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    // Easter Egg Condition
    const isHighValue = investment > 200000;

    // Logic: Calculate SIP
    const { investedAmount, totalValue, wealthGained } = useMemo(() => {
        let monthlyRate = rate / 12 / 100;
        let months = years * 12;
        let totalInvested = 0;
        let currentVal = 0;
        let currentInvestment = investment;

        if (!isStepUp) {
            // Standard SIP Formula: P * ({[1 + i]^n - 1} / i) * (1 + i)
            // But calculating iteratively to be safe or using formula
            // Formula: M = P × ({[1 + i]^n - 1} / i) × (1 + i)
            totalInvested = investment * months;
            currentVal = investment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
        } else {
            // Step Up Logic (Iterative usually easier)
            currentVal = 0;
            totalInvested = 0;
            currentInvestment = investment;

            for (let y = 1; y <= years; y++) {
                // For each month in this year
                for (let m = 1; m <= 12; m++) {
                    totalInvested += currentInvestment;
                    // Add investment for this month, then compound previous total
                    currentVal = (currentVal + currentInvestment) * (1 + monthlyRate);
                }
                // Increase investment for next year
                currentInvestment = currentInvestment * (1 + stepUpRate / 100);
            }
            // Note: The precise monthly compounding with annual step up depends on exact timing, 
            // usually step up happens at start of next year.
        }

        return {
            investedAmount: Math.round(totalInvested),
            totalValue: Math.round(currentVal),
            wealthGained: Math.round(currentVal - totalInvested)
        };
    }, [investment, rate, years, isStepUp, stepUpRate]);

    // Chart Data
    const data = [
        { name: 'Invested', value: investedAmount },
        { name: 'Gained', value: wealthGained },
    ];

    return (
        <div className="w-full max-w-4xl mx-auto font-sans">
            {/* Design: White Card, Rounded-3xl, Deep Shadow */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100">

                {/* Left Column: Inputs */}
                <div className="w-full md:w-1/2 p-8 border-b md:border-b-0 md:border-r border-gray-100">

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-[#00B37E]">
                            <Sprout size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-[#0B63D8]">SIP Configuration</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Input 1: Monthly Investment */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-semibold text-gray-700">Monthly Investment</label>
                                <div className="bg-green-50 px-3 py-1 rounded-lg text-[#00B37E] font-bold text-sm">
                                    ₹ <input
                                        type="number"
                                        value={investment}
                                        onChange={(e) => setInvestment(Number(e.target.value))}
                                        className="bg-transparent border-none outline-none w-20 text-right"
                                    />
                                </div>
                            </div>
                            <input
                                type="range"
                                min="500"
                                max="300000" // Allowing range > 200k to trigger easter egg easily
                                value={investment}
                                onChange={(e) => setInvestment(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#00B37E]"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>₹500</span>
                                <span>₹2L+</span>
                            </div>
                        </div>

                        {/* Input 2: Expected Return Rate */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-semibold text-gray-700">Expected Return (p.a)</label>
                                <span className="text-[#0B63D8] font-bold">{rate}%</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="30"
                                value={rate}
                                onChange={(e) => setRate(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#00B37E]"
                            />
                        </div>

                        {/* Input 3: Time Period */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-semibold text-gray-700">Time Period</label>
                                <span className="text-[#0B63D8] font-bold">{years} Years</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="40"
                                value={years}
                                onChange={(e) => setYears(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#00B37E]"
                            />
                        </div>

                        {/* Input 4: Step-up Toggle */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    Step-up SIP
                                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Advanced</span>
                                </label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={isStepUp} onChange={(e) => setIsStepUp(e.target.checked)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00B37E]"></div>
                                </label>
                            </div>

                            {isStepUp && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-xl animate-fade-in">
                                    <div className="flex justify-between mb-2">
                                        <label className="text-xs font-semibold text-gray-500">Annual Step-up</label>
                                        <span className="text-[#00B37E] font-bold text-sm">{stepUpRate}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="50"
                                        value={stepUpRate}
                                        onChange={(e) => setStepUpRate(Number(e.target.value))}
                                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#00B37E]"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Results */}
                <div className="w-full md:w-1/2 p-8 bg-gray-50 flex flex-col justify-center items-center relative">

                    {/* Conditional Rendering based on Investment Amount */}
                    {isHighValue ? (
                        // State B: Easter Egg
                        <div className="text-center animate-fade-in">
                            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#00B37E] to-[#0B63D8] rounded-2xl flex items-center justify-center mb-6 shadow-lg transform hover:scale-110 transition-transform">
                                <span className="text-4xl">💎</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">That's a serious investment!</h3>
                            <p className="text-gray-600 mb-8 max-w-xs mx-auto leading-relaxed">
                                You don't require a calculator, you require proper deployment.
                            </p>
                            <button className="bg-[#0B63D8] hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg transition-all transform hover:-translate-y-1">
                                Book a Consultation
                            </button>
                        </div>
                    ) : (
                        // State A: Normal Results
                        <div className="w-full h-full flex flex-col justify-between">
                            <div className="h-64 w-full relative">
                                {/* Recharts Donut */}
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {data.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Centered Total in Donut */}
                                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                    <span className="text-xs text-gray-400 font-medium">Total Value</span>
                                    <span className="text-xl font-bold text-[#0B63D8]">{formatCurrency(totalValue)}</span>
                                </div>
                            </div>

                            <div className="space-y-4 mt-4">
                                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                                        <span className="text-sm text-gray-600">Invested Amount</span>
                                    </div>
                                    <span className="font-semibold text-gray-900">{formatCurrency(investedAmount)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-[#00B37E]"></div>
                                        <span className="text-sm text-gray-600">Est. Returns</span>
                                    </div>
                                    <span className="font-semibold text-[#00B37E]">{formatCurrency(wealthGained)}</span>
                                </div>
                                <div className="flex justify-between items-end pt-2">
                                    <span className="text-sm font-bold text-gray-400">Total Value</span>
                                    <span className="text-2xl font-extrabold text-[#0B63D8]">{formatCurrency(totalValue)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SIPCalculatorWidget;

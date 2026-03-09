import React, { useState, useMemo } from 'react';
import { Activity, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

export default function FinancialHealthScoreCalculator() {
    // 1. STATE MANAGEMENT
    const [age, setAge] = useState(30);
    const [income, setIncome] = useState(100000);
    const [expenses, setExpenses] = useState(50000);
    const [emi, setEmi] = useState(20000);
    const [passiveIncome, setPassiveIncome] = useState(5000);
    const [liquidAssets, setLiquidAssets] = useState(300000);
    const [investedAssets, setInvestedAssets] = useState(1000000);
    const [equityAssets, setEquityAssets] = useState(700000);
    const [realEstate, setRealEstate] = useState(5000000);
    const [debt, setDebt] = useState(3000000);
    const [lifeCover, setLifeCover] = useState(10000000);
    const [healthCover, setHealthCover] = useState(1000000);

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    // 2. SCORING ENGINE
    const { totalScore, status, results, actionPlan } = useMemo(() => {
        let scores = [];
        let actions = [];

        // Helper to add score
        const addScore = (id, name, score, logic, advice) => {
            scores.push({ id, name, score, fullMark: 100 });
            if (score <= 70) actions.push({ name, current: logic, advice });
        };

        // Pillar 1: Emergency Fund (Liquid Assets / Monthly Expenses)
        let efRatio = expenses > 0 ? liquidAssets / expenses : (liquidAssets > 0 ? 99 : 0);
        let efScore = 0;
        if (efRatio >= 6) efScore = 100;
        else if (efRatio >= 3) efScore = 70;
        else if (efRatio >= 1) efScore = 40;
        addScore('ef', 'Emergency Fund', efScore, `${efRatio.toFixed(1)} Months`, 'Build your emergency fund to cover at least 6 months of living expenses using Liquid Funds or FDs.');

        // Pillar 2: Savings Rate ((Income - Expenses - EMI) / Income)
        let savingsRate = income > 0 ? ((income - expenses - emi) / income) * 100 : 0;
        let srScore = 0;
        if (savingsRate >= 30) srScore = 100;
        else if (savingsRate >= 20) srScore = 70;
        else if (savingsRate >= 10) srScore = 40;
        addScore('sr', 'Savings Rate', srScore, `${savingsRate.toFixed(1)}%`, 'Try to save and invest at least 30% of your take-home income by reducing discretionary spending.');

        // Pillar 3: Debt-to-Income (EMI / Income)
        let dti = income > 0 ? (emi / income) * 100 : 0;
        let dtiScore = 0;
        if (dti === 0) dtiScore = 100;
        else if (dti <= 20) dtiScore = 70;
        else if (dti <= 40) dtiScore = 40;
        addScore('dti', 'Debt-to-Income', dtiScore, `${dti.toFixed(1)}%`, 'High EMI burden limits wealth creation. Focus on prepaying expensive debt to bring EMIs below 20% of income.');

        // Pillar 4: Solvency ((Liquid + Invested) / Debt)
        let solvency = debt > 0 ? (liquidAssets + investedAssets) / debt : 99;
        let solScore = 0;
        if (debt === 0 || solvency >= 2.0) solScore = 100;
        else if (solvency >= 1.5) solScore = 70;
        else if (solvency >= 1.0) solScore = 40;
        addScore('sol', 'Solvency', solScore, `${solvency === 99 ? 'Debt Free' : solvency.toFixed(2)}x`, 'Your liabilities are high compared to financial assets. Focus on debt reduction before aggressively accumulating non-liquid assets.');

        // Pillar 5: Life Cover (Life Cover / Annual Income)
        let lifeRatio = income > 0 ? lifeCover / (income * 12) : 0;
        let lcScore = 0;
        if (lifeRatio >= 10) lcScore = 100;
        else if (lifeRatio >= 5) lcScore = 70;
        else if (lifeRatio >= 1) lcScore = 40;
        addScore('lc', 'Life Insurance', lcScore, `${lifeRatio.toFixed(1)}x Income`, 'You are underinsured. Purchase a pure term life insurance policy covering at least 10x your annual income.');

        // Pillar 6: Health Cover (Absolute)
        let hcScore = 0;
        if (healthCover >= 1000000) hcScore = 100; // 10 Lakhs
        else if (healthCover >= 500000) hcScore = 70; // 5 Lakhs
        else if (healthCover > 0) hcScore = 40;
        addScore('hc', 'Health Insurance', hcScore, `${formatCurrency(healthCover)}`, 'Medical inflation is extremely high. Secure at least ₹10 Lakhs of base health insurance coverage independent of your employer.');

        // Pillar 7: Productive Wealth (Invested / (Liquid + Invested))
        let pwTotal = liquidAssets + investedAssets;
        let pwRatio = pwTotal > 0 ? (investedAssets / pwTotal) * 100 : 0;
        let pwScore = 0;
        if (pwRatio >= 60) pwScore = 100;
        else if (pwRatio >= 40) pwScore = 70;
        else if (pwRatio >= 20) pwScore = 40;
        addScore('pw', 'Productive Wealth', pwScore, `${pwRatio.toFixed(0)}%`, 'You hold too much cash. Deploy idle cash above your emergency fund into productive, return-generating investments.');

        // Pillar 8: Age-to-Wealth (Actual NW / Target NW)
        let actualNw = (liquidAssets + investedAssets + realEstate) - debt;
        let targetNw = (age * (income * 12)) / 10;
        let awRatio = targetNw > 0 ? actualNw / targetNw : (actualNw > 0 ? 1 : 0);
        let awScore = 0;
        if (awRatio >= 1.0) awScore = 100;
        else if (awRatio >= 0.5) awScore = 70;
        else if (awRatio >= 0.1) awScore = 40;
        addScore('aw', 'Age-to-Wealth', awScore, `${(awRatio * 100).toFixed(0)}% of Target`, 'Your current net worth is below the target for your age and income. You need to aggressively increase your savings rate and investment returns.');

        // Pillar 9: FIRE Ratio (Passive Income / Expenses)
        let fireRatio = expenses > 0 ? passiveIncome / expenses : (passiveIncome > 0 ? 1 : 0);
        let fireScore = 0;
        if (fireRatio >= 1.0) fireScore = 100;
        else if (fireRatio >= 0.5) fireScore = 70;
        else if (fireRatio >= 0.1) fireScore = 40;
        addScore('fire', 'F.I.R.E Ratio', fireScore, `${(fireRatio * 100).toFixed(0)}% of Expenses`, 'Focus on building dividend, interest, or rental income streams to cover your living expenses for true financial independence.');

        // Pillar 10: Age-Adjusted Equity
        let actualEq = investedAssets > 0 ? (equityAssets / investedAssets) * 100 : 0;
        let targetEq = 100 - age;
        let eqDiff = Math.abs(actualEq - targetEq);
        let eqScore = 0;
        if (eqDiff <= 10) eqScore = 100;
        else if (eqDiff <= 25) eqScore = 70;
        else if (eqDiff <= 40) eqScore = 40;
        addScore('eq', 'Asset Allocation', eqScore, `${actualEq.toFixed(0)}% (Target: ${targetEq}%)`, 'Your equity allocation deviates significantly from the "100-Age" rule. Rebalance your portfolio to align with your risk capacity.');

        // Pillar 11: Real Estate Concentration (Real Estate / Actual NW)
        let reRatio = actualNw > 0 ? (realEstate / actualNw) * 100 : (realEstate > 0 ? 100 : 0);
        let reScore = 0;
        if (reRatio <= 50) reScore = 100;
        else if (reRatio <= 69) reScore = 70;
        else if (reRatio <= 85) reScore = 40;
        addScore('re', 'Real Estate Conc.', reScore, `${reRatio.toFixed(0)}%`, 'Your net worth is heavily blocked in illiquid physical real estate. Diversify into financial assets (equities/bonds).');

        // Pillar 12: Needs Ratio ((Expenses + EMI) / Income)
        let needsRatio = income > 0 ? ((expenses + emi) / income) * 100 : 100;
        let nsScore = 0;
        if (needsRatio <= 50) nsScore = 100;
        else if (needsRatio <= 65) nsScore = 70;
        else if (needsRatio <= 80) nsScore = 40;
        addScore('ns', 'Needs Ratio', nsScore, `${needsRatio.toFixed(0)}%`, 'Your mandatory expenses (needs and EMIs) are consuming too much of your income. Look for lifestyle deflation opportunities.');

        // Calculate Aggregate
        const sum = scores.reduce((acc, curr) => acc + curr.score, 0);
        const finalScore = Math.round(sum / 12);

        // Status
        let badge = "Critical";
        let color = "#EF4444"; // Red
        if (finalScore >= 80) { badge = "Excellent"; color = "#10B981"; }
        else if (finalScore >= 60) { badge = "Good"; color = "#F59E0B"; }
        else if (finalScore >= 40) { badge = "Needs Attention"; color = "#F97316"; }

        return { totalScore: finalScore, status: badge, statusColor: color, results: scores, actionPlan: actions };

    }, [age, income, expenses, emi, passiveIncome, liquidAssets, investedAssets, equityAssets, realEstate, debt, lifeCover, healthCover]);

    // Gauge Data
    const gaugeData = [
        { name: 'Score', value: results.totalScore || 0, fill: results.statusColor },
        { name: 'Remaining', value: 100 - (results.totalScore || 0), fill: '#F3F4F6' } // Gray remainder
    ];

    // Input Group Helper
    const InputGroup = ({ label, value, setter, icon, min, max, step }) => (
        <div className="mb-4">
            <div className="flex justify-between mb-1">
                <label className="text-sm font-semibold text-gray-700">{label}</label>
                <div className="bg-blue-50 px-2 py-1 rounded text-blue-700 font-bold text-sm">
                    {icon} <input
                        type="number"
                        min={0}
                        value={value}
                        onChange={(e) => setter(Number(e.target.value))}
                        className="bg-transparent border-none outline-none text-right w-20"
                    />
                </div>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => setter(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
        </div>
    );

    return (
        <div className="w-full max-w-6xl mx-auto font-sans bg-gray-50 p-4 md:p-8 rounded-3xl shadow-lg border border-gray-100">

            <div className="flex flex-col lg:flex-row gap-8">
                {/* LEFT: Inputs Panel */}
                <div className="w-full lg:w-1/3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit max-h-[85vh] overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-2 mb-6 border-b pb-4">
                        <Activity className="text-blue-600" size={24} />
                        <h2 className="text-xl font-bold text-gray-800">Your Financial Data</h2>
                    </div>

                    <InputGroup label="Age (Years)" value={age} setter={setAge} icon="" min={18} max={80} step={1} />
                    <InputGroup label="Monthly Take-Home" value={income} setter={setIncome} icon="₹" min={10000} max={1000000} step={5000} />
                    <InputGroup label="Monthly Living Expenses" value={expenses} setter={setExpenses} icon="₹" min={5000} max={500000} step={5000} />
                    <InputGroup label="Total Monthly EMIs" value={emi} setter={setEmi} icon="₹" min={0} max={500000} step={1000} />
                    <InputGroup label="Passive Income / Month" value={passiveIncome} setter={setPassiveIncome} icon="₹" min={0} max={500000} step={1000} />

                    <div className="my-6 border-t border-gray-100"></div>

                    <InputGroup label="Liquid Assets (Cash/FDs)" value={liquidAssets} setter={setLiquidAssets} icon="₹" min={0} max={5000000} step={50000} />
                    <InputGroup label="Total Invested Assets" value={investedAssets} setter={setInvestedAssets} icon="₹" min={0} max={50000000} step={100000} />
                    <InputGroup label="Of which: Equity Portion" value={equityAssets} setter={setEquityAssets} icon="₹" min={0} max={investedAssets > 0 ? investedAssets : 50000000} step={10000} />
                    <InputGroup label="Physical Real Estate" value={realEstate} setter={setRealEstate} icon="₹" min={0} max={100000000} step={500000} />
                    <InputGroup label="Outstanding Debt" value={debt} setter={setDebt} icon="₹" min={0} max={50000000} step={100000} />

                    <div className="my-6 border-t border-gray-100"></div>

                    <InputGroup label="Life Insurance Cover" value={lifeCover} setter={setLifeCover} icon="₹" min={0} max={50000000} step={500000} />
                    <InputGroup label="Health Insurance Cover" value={healthCover} setter={setHealthCover} icon="₹" min={0} max={10000000} step={100000} />

                </div>

                {/* RIGHT: Dashboard Panel */}
                <div className="w-full lg:w-2/3 flex flex-col gap-6">

                    {/* Top Row: Score & Radar */}
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Speedometer Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col items-center justify-center relative">
                            <h3 className="text-gray-500 font-semibold mb-2">FinNomy Health Score</h3>
                            <div className="h-48 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[{ value: totalScore }, { value: 100 - totalScore }]}
                                            cx="50%" cy="100%"
                                            startAngle={180} endAngle={0}
                                            innerRadius={70} outerRadius={90}
                                            paddingAngle={0}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            <Cell fill={results.statusColor} />
                                            <Cell fill="#f3f4f6" />
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                                    <span className="text-5xl font-black" style={{ color: results.statusColor }}>{totalScore}</span>
                                    <span className="text-sm text-gray-400">out of 100</span>
                                </div>
                            </div>
                            <div className="mt-4 px-4 py-1 rounded-full font-bold text-sm tracking-wide"
                                style={{ backgroundColor: `${results.statusColor}20`, color: results.statusColor }}>
                                {results.status.toUpperCase()}
                            </div>
                        </div>

                        {/* Radar Chart Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1 relative min-h-[300px]">
                            <h3 className="text-gray-500 font-semibold mb-2 text-center">12-Pillar Analysis</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={results.results}>
                                    <PolarGrid stroke="#e5e7eb" />
                                    <PolarAngleAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name="Score" dataKey="score" stroke={results.statusColor} fill={results.statusColor} fillOpacity={0.4} />
                                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Bottom Row: Action Plan */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1">
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldAlert className="text-gray-700" size={20} />
                            <h3 className="text-lg font-bold text-gray-800">Your Action Plan</h3>
                        </div>

                        {actionPlan.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-green-600">
                                <CheckCircle size={48} className="mb-3 opacity-80" />
                                <p className="font-semibold text-lg">Perfect Score!</p>
                                <p className="text-sm opacity-80">You are in optimal financial health.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {actionPlan.map((action, idx) => (
                                    <div key={idx} className="flex gap-3 items-start p-3 bg-red-50/50 hover:bg-red-50 rounded-lg transition-colors border border-red-100/50">
                                        <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm mb-0.5">{action.name} <span className="text-gray-400 font-normal ml-1">({action.current})</span></p>
                                            <p className="text-sm text-gray-600 leading-snug">{action.advice}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
            {/* Embedded custom CSS to style scrollbars without muddying global styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
            `}} />
        </div>
    );
}

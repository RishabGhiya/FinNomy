// ==========================================
// MULTI-GOAL STRATEGY ENGINE (MGSE)
// ==========================================

let mgseGoals = [];
let mgseChartInstance = null;
let mgseGoalCounter = 1;

const mgsePalette = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Orange
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f43f5e', // Rose
    '#14b8a6', // Teal
    '#f97316', // Orange-Red
    '#6366f1'  // Indigo
];

// Format Currency - Indian Numbering System
const formatMgseCurr = (val) => "\u20B9" + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(val));

// Helper to sanitize numeric inputs (handle commas, NaNs)
const getMgseNum = (id) => {
    const el = document.getElementById(id);
    if (!el) return 0;
    const sanitized = String(el.value).replace(/,/g, '');
    return Number(sanitized) || 0;
};

function openMgseModal() {
    document.getElementById('mgseModalOverlay').style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Start with empty goals as requested
    if (mgseGoals.length === 0) {
        mgseGoals = [];
    }

    attachMgseGlobalListeners();
    calculateAndRenderMgse();
}

function closeMgseModal() {
    document.getElementById('mgseModalOverlay').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function attachMgseGlobalListeners() {
    const inputs = ['mgseIncome', 'mgseExpenses', 'mgseReturns', 'mgseInflation', 'mgseStepup'];
    inputs.forEach(id => {
        const numInput = document.getElementById(id);
        const slider = document.getElementById(id + 'Slider');

        // Remove all previous listeners to prevent duplicates
        if (numInput) {
            numInput.removeEventListener('input', calculateAndRenderMgse);
            // Remove specific anonymous listeners if they were added before
            // This is a bit tricky for anonymous functions, but for simplicity, we'll assume
            // the new logic replaces the old one cleanly on re-attachment.
        }
        if (slider) {
            slider.removeEventListener('input', calculateAndRenderMgse);
        }

        if (numInput && slider) {
            // Sync Input to Slider
            numInput.addEventListener('input', () => {
                const val = getMgseNum(id);
                slider.value = val;
                calculateAndRenderMgse();
            });
            // Sync Slider to Input
            slider.addEventListener('input', () => {
                numInput.value = new Intl.NumberFormat('en-IN').format(slider.value);
                calculateAndRenderMgse();
            });
        } else if (numInput) { // If only number input exists, just attach the calculate listener
            numInput.addEventListener('input', calculateAndRenderMgse);
        }
    });
}

function mgseUpdateGlobalInput(id, value) {
    const el = document.getElementById(id);
    if (el) {
        const num = Number(String(value).replace(/,/g, '')) || 0;
        el.value = new Intl.NumberFormat('en-IN').format(num);
        const slider = document.getElementById(id + 'Slider');
        if (slider) slider.value = num;
        calculateAndRenderMgse();
    }
}

function mgseAddGoal() {
    mgseGoals.push({
        id: mgseGoalCounter++,
        name: `Goal ${mgseGoalCounter - 1}`,
        cost: 1000000,
        years: 5,
        priority: 'Important',
        active: true,
        color: mgsePalette[(mgseGoalCounter - 1) % mgsePalette.length]
    });
    calculateAndRenderMgse();
}

function mgseDeleteGoal(id) {
    mgseGoals = mgseGoals.filter(g => g.id !== id);
    calculateAndRenderMgse();
}

function mgseToggleGoal(id) {
    const goal = mgseGoals.find(g => g.id === id);
    if (goal) {
        goal.active = !goal.active;
        calculateAndRenderMgse();
    }
}

function mgseUpdateGoal(id, field, value) {
    const goal = mgseGoals.find(g => g.id === id);
    if (!goal) return;

    if (field === 'cost' || field === 'years') {
        // Sanitize string (remove commas) if coming from text input
        const sanitized = String(value).replace(/,/g, '');
        goal[field] = Number(sanitized) || 0;
    } else {
        goal[field] = value;
    }
    calculateAndRenderMgse();
}

// Function to adjust cost by 10k
function mgseAdjustCost(id, amount) {
    const goal = mgseGoals.find(g => g.id === id);
    if (goal) {
        goal.cost = Math.max(0, goal.cost + amount);
        calculateAndRenderMgse();
    }
}

// Calculate Step-Up SIP required to reach a future value
function calculateRequiredStepUpSip(fv, years, expectedReturnPerc, stepUpPerc) {
    // ... logic remains same ...
    if (years <= 0 || fv <= 0) return 0;

    const r = (expectedReturnPerc / 100) / 12; // Monthly return rate
    const n = years * 12; // Total months
    const g = (stepUpPerc / 100); // Annual step-up rate

    let low = 1;
    let high = fv;
    let requiredSip = 0;

    // Binary search for the correct initial SIP
    for (let i = 0; i < 50; i++) {
        let mid = (low + high) / 2;
        let currentSIP = mid;
        let futureValue = 0;

        for (let year = 1; year <= years; year++) {
            for (let month = 1; month <= 12; month++) {
                futureValue = (futureValue + currentSIP) * (1 + r);
            }
            currentSIP *= (1 + g); // Step up at the end of the year
        }

        if (Math.abs(futureValue - fv) < 100) {
            requiredSip = mid;
            break;
        } else if (futureValue < fv) {
            low = mid;
        } else {
            high = mid;
        }
        requiredSip = mid; // Fallback
    }

    return requiredSip;
}

function calculateAndRenderMgse() {
    // 1. Get Global Assumptions with robust sanitization
    const income = getMgseNum('mgseIncome');
    const expenses = getMgseNum('mgseExpenses');

    // High Value Threshold Check
    const normalState = document.getElementById('mgseNormalState');
    const hvForm = document.getElementById('mgseHighValueForm');

    if (income > 250000 || expenses > 200000) {
        if (normalState) normalState.style.display = 'none';
        if (hvForm) hvForm.style.display = 'block';
        return;
    } else {
        if (normalState) normalState.style.display = 'flex';
        if (hvForm) hvForm.style.display = 'none';
    }

    const gReturns = getMgseNum('mgseReturns') || 12;
    const gInflation = getMgseNum('mgseInflation') || 6;
    const gStepup = getMgseNum('mgseStepup') || 10;

    let surplus = Math.max(0, income - expenses);
    document.getElementById('mgseSurplusDisplay').innerText = formatMgseCurr(surplus);
    document.getElementById('mgseAvailableSurplusText').innerText = formatMgseCurr(surplus);

    let totalRequiredSip = 0;
    let totalGoalCostToday = 0;

    // 2. Perform Goal Calculations
    mgseGoals.forEach(g => {
        if (!g.active) {
            g.fv = 0;
            g.reqSip = 0;
            g.allocatedSip = 0;
            g.fundedPerc = 0;
            return;
        }

        // Future Value adjusted for inflation
        g.fv = g.cost * Math.pow(1 + (gInflation / 100), g.years);

        // Required Monthly initial SIP
        g.reqSip = calculateRequiredStepUpSip(g.fv, g.years, gReturns, gStepup);
        totalRequiredSip += g.reqSip;
        totalGoalCostToday += g.cost;

        // Initial state before allocation
        g.allocatedSip = 0;
        g.fundedPerc = 0;
    });

    document.getElementById('mgseTotalRequiredSip').innerText = formatMgseCurr(totalGoalCostToday);

    // 3. Priority Auto-Allocation Engine (Shortfall Solver V2: Sequential Spillover Simulation)
    const priorityScore = { 'Essential': 3, 'Important': 2, 'Lifestyle': 1 };
    let activeGoals = mgseGoals.filter(g => g.active).sort((a, b) => {
        if (priorityScore[a.priority] !== priorityScore[b.priority]) {
            return priorityScore[b.priority] - priorityScore[a.priority];
        }
        return a.years - b.years;
    });

    // Reset initial allocations
    activeGoals.forEach(g => {
        g.simulatedBalance = 0;
        g.isFundedInSim = false;
        g.allocatedSip = 0;
        g.fundedPerc = 0;
    });

    const maxHorizon = activeGoals.length > 0 ? Math.max(...activeGoals.map(g => g.years)) : 0;
    const monthlyRate = (gReturns / 100) / 12;

    // Run monthly simulation
    let currentMonthlySurplus = surplus;

    // Track yearly allocation for the Roadmap
    const yearlySnapshots = [];

    // Track the target SIP for each goal as it steps up annually
    activeGoals.forEach(g => { g.currentSipGoal = g.reqSip; });

    for (let m = 1; m <= maxHorizon * 12; m++) {
        // Find goals active in this specific month
        const queueForMonth = activeGoals.filter(g => !g.isFundedInSim && g.years * 12 >= m);

        let remainingToAllocate = currentMonthlySurplus;

        // Reset month's allocation tracking
        activeGoals.forEach(g => g.tempAlloc = 0);

        // Phase 1: Fair Share Allocation
        for (const goal of queueForMonth) {
            if (remainingToAllocate <= 0) break;

            // Cap allocation to precisely what's needed to hit FV this month
            let maxFairShare = (goal.fv / (1 + monthlyRate)) - goal.simulatedBalance;
            if (maxFairShare < 0) maxFairShare = 0;

            const fairShare = Math.min(remainingToAllocate, goal.currentSipGoal, maxFairShare);

            goal.simulatedBalance = (goal.simulatedBalance + fairShare) * (1 + monthlyRate);
            goal.tempAlloc = fairShare;
            if (m === 1) goal.allocatedSip = fairShare;
            remainingToAllocate -= fairShare;

            if (goal.simulatedBalance >= goal.fv - 10) {
                goal.isFundedInSim = true;
                goal.fundedPerc = 100;
            }
        }

        // Phase 2: Greedy Surplus Allocation (Leftover funds go to highest priority unfunded goal)
        if (remainingToAllocate > 0) {
            for (const goal of queueForMonth) {
                if (remainingToAllocate <= 0 || goal.isFundedInSim) continue;

                // Greedy Step: Take leftover surplus to catch up, but cap to exact FV gap
                let maxExtra = (goal.fv - goal.simulatedBalance) / (1 + monthlyRate);
                if (maxExtra < 0) maxExtra = 0;

                const extra = Math.min(remainingToAllocate, maxExtra);

                if (extra > 0) {
                    goal.simulatedBalance += extra * (1 + monthlyRate);
                    goal.tempAlloc += extra;
                    if (m === 1) goal.allocatedSip += extra;
                    remainingToAllocate -= extra;
                }

                if (goal.simulatedBalance >= goal.fv - 10) {
                    goal.isFundedInSim = true;
                    goal.fundedPerc = 100;
                }
            }
        }

        // Capture snapshot at the middle of each year (Month 6)
        if (m % 12 === 6) {
            const y = Math.ceil(m / 12);
            yearlySnapshots.push({
                year: y,
                total: currentMonthlySurplus,
                allocs: activeGoals.map(g => ({ id: g.id, name: g.name, amt: g.tempAlloc || 0, priority: g.priority }))
            });
        }

        // Check if goals are fully funded
        activeGoals.forEach(g => {
            if (g.simulatedBalance >= g.fv - 10) {
                g.isFundedInSim = true;
                g.fundedPerc = 100;
            }
        });

        // Periodic funding percentage update for the UI at each goal's specific horizon
        activeGoals.forEach(g => {
            if (m === g.years * 12 && !g.isFundedInSim) {
                g.fundedPerc = Math.min(100, (g.simulatedBalance / g.fv) * 100);
            }
        });

        // Apply Annual Step-Up at the end of every 12 months
        if (m % 12 === 0) {
            currentMonthlySurplus *= (1 + gStepup / 100);
            activeGoals.forEach(g => {
                g.currentSipGoal *= (1 + gStepup / 100);
            });
        }
    }

    // Attach snapshots for roadmap rendering
    activeGoals.yearlySnapshots = yearlySnapshots;

    // 4. Update Dashboard Health Meter
    // Calculate Health based on average funding % across all goals for more granularity
    const totalFundedPerc = activeGoals.reduce((sum, g) => sum + g.fundedPerc, 0);
    const healthPerc = activeGoals.length > 0 ? (totalFundedPerc / activeGoals.length) : 100;

    document.getElementById('mgseHealthPercentage').innerText = `${healthPerc.toFixed(0)}%`;

    let healthColor = '#10b981'; // Green
    if (healthPerc < 95) healthColor = '#f59e0b'; // Yellow/Orange
    if (healthPerc < 60) healthColor = '#ef4444'; // Red

    document.getElementById('mgseSurplusBar').style.width = `${healthPerc}%`;
    document.getElementById('mgseSurplusBar').style.backgroundColor = healthColor;
    document.getElementById('mgseHealthPercentage').style.color = healthColor;

    // Draw JS Gauge Chart
    if (typeof Chart !== 'undefined') {
        const gaugeCtx = document.getElementById('mgseHealthChart').getContext('2d');
        if (mgseChartInstance) mgseChartInstance.destroy();
        mgseChartInstance = new Chart(gaugeCtx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [healthPerc, Math.max(0, 100 - healthPerc)],
                    backgroundColor: [healthColor, '#f1f5f9'],
                    borderWidth: 0,
                    circumference: 270,
                    rotation: 225
                }]
            },
            options: {
                cutout: '80%',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { tooltip: { enabled: false } }
            }
        });
    }

    // 5. Generate FinNomy Fix recommendations (Advanced Advisor)
    const fixEl = document.getElementById('mgseFinnomyFixText');

    // Find priorities with shortfalls
    const essentialShortfall = activeGoals.find(g => g.priority === 'Essential' && g.fundedPerc < 99.9);
    const primaryShortfall = activeGoals.find(g => g.fundedPerc < 99.9);

    // Initial surplus stats
    const Year1AllocTotal = activeGoals.reduce((sum, g) => sum + g.allocatedSip, 0);
    const Year1RemainingSurplus = Math.max(0, surplus - Year1AllocTotal);

    let fixText = "";

    if (healthPerc >= 99.9) {
        fixText = `<span style="color: #059669; font-weight: 700;">PRO STATUS:</span> Your portfolio is in excellent shape! You have <strong>${formatMgseCurr(Year1RemainingSurplus)}</strong>/month unallocated. Tip: Put this into a "Wealth Multiplier" liquid fund to build secondary corpus.`;
    } else if (essentialShortfall) {
        // CRITICAL: Essential goal is at risk
        const gap = essentialShortfall.reqSip - essentialShortfall.allocatedSip;
        const suggestion = gStepup < 15 ?
            `Increase Step-Up to <strong>${gStepup + 2}%</strong>` :
            `delay a Lifestyle goal by 2 years`;

        fixText = `<div style="background: #fef2f2; padding: 12px; border-radius: 8px; border: 1px solid #fee2e2;">
            <span style="color: #dc2626; font-weight: 800; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">⚠️ CRITICAL ALERT</span><br>
            <span style="color: #991b1b; font-size: 0.9rem;">Your Essential goal <strong>"${essentialShortfall.name}"</strong> is only ${essentialShortfall.fundedPerc.toFixed(0)}% funded. 
            <strong>Fix:</strong> ${suggestion} to bridge the ${formatMgseCurr(gap)} monthly gap and protect your future needs.</span>
        </div>`;
    } else if (primaryShortfall) {
        // TACTICAL: Suggest specific trade-off or Step-up move
        const gap = primaryShortfall.reqSip - primaryShortfall.allocatedSip;
        const lowerPriority = activeGoals.reverse().find(g => priorityScore[g.priority] < priorityScore[primaryShortfall.priority] && g.allocatedSip > 0);
        activeGoals.reverse(); // put back

        if (lowerPriority) {
            fixText = `<span style="color: #1e40af; font-weight: 700;">STRATEGIC MOVE:</span> Goal <strong>"${primaryShortfall.name}"</strong> is short by ${formatMgseCurr(gap)}. 
            <strong>Action:</strong> If you increase the time horizon of "${lowerPriority.name}" by 2 years, the freed-up SIP will automatically secure this goal!`;
        } else {
            const stepUpBoost = Math.ceil((gap / primaryShortfall.reqSip) * 10);
            fixText = `<span style="color: #1e40af; font-weight: 700;">Action:</span> To reach 100% funding for "${primaryShortfall.name}", try increasing your Annual Step-Up by <strong>+${Math.min(5, stepUpBoost)}%</strong> or increase your monthly take-home by ${formatMgseCurr(gap)}.`;
        }
    } else {
        fixText = `Your goals are largely covered, but minor adjustments in your expected returns or time horizons could push your portfolio to 100% health.`;
    }

    // Add Timeline insight: "In 5 years, after Goal X is done, ₹Y will be freed up for other goals"
    // Find the nearest goal that ACTUALLY has funding today (allocatedSip > 0)
    const fundingSources = activeGoals.filter(g => g.allocatedSip > 0).sort((a, b) => a.years - b.years);
    const firstFundingSource = fundingSources[0];

    // Find any goal that is currently falling short and is scheduled for LATER
    const shortFallGoals = activeGoals.filter(g => g.fundedPerc < 100 && (!firstFundingSource || g.years > firstFundingSource.years));

    if (firstFundingSource && shortFallGoals.length > 0) {
        fixText += `<br><br><div style="margin-top: 10px; padding: 10px; background: #f0fdf4; border-radius: 6px; border-left: 4px solid #10b981;">
            <span style="color: #059669; font-weight: 700; font-size: 0.8rem; text-transform: uppercase;">Allocation Flow Forecast:</span><br>
            <span style="font-size: 0.85rem; color: #15803d;">Once <strong>"${firstFundingSource.name}"</strong> is completed in <strong>${firstFundingSource.years} years</strong>, your monthly <strong>${formatMgseCurr(firstFundingSource.allocatedSip)}</strong> will automatically shift to fund your next priority goals!</span>
        </div>`;
    }

    fixEl.innerHTML = fixText;

    // 6. Generate SIP Flow Roadmap (Horizontal Skyline)
    const roadmapEl = document.getElementById('mgseRoadmap');
    roadmapEl.style.height = 'auto';
    roadmapEl.style.background = 'transparent';

    // Calculate Max Total for scaling the bar heights
    const maxSnapTotal = Math.max(...(activeGoals.yearlySnapshots || []).map(s => s.total), 1);
    const chartHeight = 180; // Max pixels for the tallest bar

    roadmapEl.innerHTML = `
        <div style="margin-bottom: 20px; font-size: 0.75rem; color: #64748b; font-weight: 700; display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="display: flex; flex-direction: column;">
                <span style="text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.85rem; color: #1e293b;">SIP Investment Skyline</span>
                <span style="font-size: 0.65rem; color: #94a3b8; font-weight: 600; text-transform: none; letter-spacing: 0;">(Wealth Growth)</span>
            </div>
            <span>Horizon: ${maxHorizon} Years</span>
        </div>
        <div id="mgseSipFlowChart" style="display: flex; align-items: flex-end; gap: 6px; height: ${chartHeight + 30}px; padding-bottom: 25px; overflow-x: auto; position: relative; border-bottom: 2px solid #f1f5f9;"></div>
        <div id="mgseSipLegend" style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 15px; padding-top: 10px; border-top: 1px solid #f1f5f9;"></div>
    `;

    const flowContainer = document.getElementById('mgseSipFlowChart');
    const legendContainer = document.getElementById('mgseSipLegend');

    // Create color map for goals
    const priorityColors = { 'Essential': '#10b981', 'Important': '#3b82f6', 'Lifestyle': '#f59e0b' };
    const goalColors = {};
    activeGoals.forEach(g => {
        goalColors[g.id] = g.color || '#94a3b8';
    });

    // Render Yearly Vertical Bars
    const displayStep = maxHorizon > 15 ? 2 : 1;
    (activeGoals.yearlySnapshots || []).forEach((snap, idx) => {
        if (idx % displayStep !== 0) return;

        const barHeight = (snap.total / maxSnapTotal) * chartHeight;

        const barHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; min-width: 25px; flex: 1;">
                <div style="width: 100%; height: ${barHeight}px; display: flex; flex-direction: column-reverse; background: #f1f5f9; border-radius: 4px 4px 0 0; overflow: hidden; position: relative;" title="Year ${snap.year}: ${formatMgseCurr(snap.total)}">
                    ${snap.allocs.map(a => {
            const p = (a.amt / snap.total) * 100;
            if (p < 0.5) return '';
            return `<div style="height: ${p}%; background: ${goalColors[a.id]}; border-top: 1px solid rgba(255,255,255,0.2);" title="${a.name}: ${formatMgseCurr(a.amt)}"></div>`;
        }).join('')}
                    ${snap.total > snap.allocs.reduce((s, a) => s + a.amt, 0) + 1 ?
                `<div style="flex: 1; background: #e2e8f0; opacity: 0.3;" title="Unallocated Surplus"></div>` : ''}
                </div>
                <div style="margin-top: 8px; font-size: 0.6rem; color: #94a3b8; font-weight: 800;">Y${snap.year}</div>
            </div>
        `;
        flowContainer.insertAdjacentHTML('beforeend', barHTML);
    });

    // Render Legend
    activeGoals.forEach(g => {
        const legendItem = `
            <div style="display: flex; align-items: center; gap: 6px;">
                <div style="width: 10px; height: 10px; border-radius: 2px; background: ${goalColors[g.id]};"></div>
                <span style="font-size: 0.7rem; font-weight: 600; color: #475569;">${g.name}</span>
            </div>
        `;
        legendContainer.insertAdjacentHTML('beforeend', legendItem);
    });

    renderMgseGoals();
}

function renderMgseGoals() {
    const container = document.getElementById('mgseGoalsContainer');
    container.innerHTML = '';

    mgseGoals.forEach(g => {
        let cardBg = g.active ? '#ffffff' : '#f8fafc';
        let opacity = g.active ? '1' : '0.6';

        let priorityColor = '#3b82f6'; // Important (Blue)
        let priorityLabel = g.priority;
        if (g.priority === 'Essential') {
            priorityColor = '#10b981'; // Green
            priorityLabel = '🛡️ Non-Negotiable';
        }
        if (g.priority === 'Lifestyle') priorityColor = '#f59e0b'; // Orange

        let barColor = g.fundedPerc >= 100 ? '#10b981' : (g.fundedPerc > 0 ? '#f59e0b' : '#ef4444');

        const html = `
            <div style="background: ${cardBg}; border: 1px solid ${g.priority === 'Essential' ? '#10b981' : '#e2e8f0'}; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); opacity: ${opacity}; transition: opacity 0.3s ease; position: relative; overflow: hidden;">
                ${g.priority === 'Essential' ? '<div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: #10b981;"></div>' : ''}
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 12px; height: 12px; border-radius: 50%; background: ${g.color || '#94a3b8'};"></div>
                            <input type="text" value="${g.name}" onchange="mgseUpdateGoal(${g.id}, 'name', this.value)" style="font-size: 1.15rem; font-weight: 800; color: #1e293b; border: none; border-bottom: 1px dashed #cbd5e1; outline: none; background: transparent; padding-bottom: 2px; width: 180px;">
                        </div>
                        <div style="font-size: 0.7rem; font-weight: 700; color: ${priorityColor}; text-transform: uppercase; margin-top: 4px; display: flex; align-items: center; gap: 4px;">
                            ${priorityLabel}
                        </div>
                        <div style="display: flex; align-items: center; gap: 4px; margin-top: 8px;">
                            <span style="color: #94a3b8; font-size: 0.85rem; font-weight: 600;">Cost: ₹</span>
                            <button onclick="mgseAdjustCost(${g.id}, -10000)" style="width: 24px; height: 24px; border-radius: 4px; border: 1px solid #cbd5e1; background: #fff; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 800;">-</button>
                            <input type="text" 
                                value="${new Intl.NumberFormat('en-IN').format(g.cost)}" 
                                onfocus="this.value = this.value.replace(/,/g, '')"
                                onblur="mgseUpdateGoal(${g.id}, 'cost', this.value)"
                                style="width: 100px; font-weight: 800; color: #334155; border: none; border-bottom: 1px solid #cbd5e1; outline: none; background: #fefce8; padding: 2px 4px; border-radius: 4px; text-align: center;">
                            <button onclick="mgseAdjustCost(${g.id}, 10000)" style="width: 24px; height: 24px; border-radius: 4px; border: 1px solid #cbd5e1; background: #fff; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 800;">+</button>
                            <span style="color: #64748b; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; margin-left: 4px;">(10k Steps)</span>
                        </div>
                        <div style="font-size: 0.72rem; color: #64748b; margin-top: 6px; font-weight: 600; background: #f8fafc; padding: 4px 8px; border-radius: 4px; display: inline-block; border: 1px dashed #e2e8f0;">
                            🎯 Future Target: <strong style="color: #1e293b;">${formatMgseCurr(g.fv)}</strong> <span style="font-size: 0.65rem; font-weight: 500; color: #94a3b8;">(Inflated)</span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <select onchange="mgseUpdateGoal(${g.id}, 'priority', this.value)" style="padding: 4px 8px; border-radius: 6px; border: 1px solid ${priorityColor}; color: ${priorityColor}; background: ${priorityColor}10; font-size: 0.8rem; font-weight: 700; outline: none; appearance: none; cursor: pointer;">
                            <option value="Essential" ${g.priority === 'Essential' ? 'selected' : ''}>Essential</option>
                            <option value="Important" ${g.priority === 'Important' ? 'selected' : ''}>Important</option>
                            <option value="Lifestyle" ${g.priority === 'Lifestyle' ? 'selected' : ''}>Lifestyle</option>
                        </select>
                        <select onchange="mgseToggleGoal(${g.id})" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; color: #475569; font-weight: 600; font-size: 0.8rem; cursor: pointer; outline:none; appearance: none;">
                            <option value="on" ${g.active ? 'selected' : ''}>Active</option>
                            <option value="off" ${!g.active ? 'selected' : ''}>Paused</option>
                        </select>
                        <button onclick="mgseDeleteGoal(${g.id})" style="border: none; background: transparent; color: #ef4444; font-size: 1.2rem; cursor: pointer;">&times;</button>
                    </div>
                </div>
                
                <div style="display: flex; gap: 30px; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <label style="display: block; font-size: 0.85rem; color: #64748b; margin-bottom: 5px;">Time Horizon: <strong style="color: #334155;">${g.years} Years</strong></label>
                        <input type="range" class="sip-range" min="1" max="40" value="${g.years}" oninput="mgseUpdateGoal(${g.id}, 'years', this.value)" style="width: 100%">
                    </div>
                    <div style="flex: 1; text-align: right;">
                        <span style="display: block; font-size: 0.8rem; color: #64748b; text-transform: uppercase;">Future Inflated Target</span>
                        <span style="font-size: 1.1rem; font-weight: 800; color: #0f172a;">${g.active ? formatMgseCurr(g.fv) : '-'}</span>
                    </div>
                </div>
                
                <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="font-size: 0.85rem; color: #475569; font-weight: 600;">Required SIP</span>
                        <span style="font-size: 0.85rem; color: #0f172a; font-weight: 800;">${g.active ? formatMgseCurr(g.reqSip) : 'Paused'}</span>
                    </div>
                    
                    <div style="width: 100%; background: #e2e8f0; height: 10px; border-radius: 5px; overflow: hidden; margin-bottom: 5px;">
                        <div style="height: 100%; width: ${g.fundedPerc}%; background: ${barColor}; transition: width 0.4s ease;"></div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.75rem; color: #64748b;">System Allocated: <strong style="color: #334155;">${g.active ? formatMgseCurr(g.allocatedSip) : '0'}</strong></span>
                        <span style="font-size: 0.8rem; font-weight: 800; color: ${barColor};">${g.fundedPerc.toFixed(0)}% Funded</span>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

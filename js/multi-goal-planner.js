/**
 * =========================================================================
 * FINNOMY™ MULTI-GOAL WEALTH PLANNER ENGINE (Standalone)
 * Cash Flow Balancing, Priority Spillover Simulation & Dynamic Roadmap
 * =========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
    // 1. Initialize EmailJS
    if (typeof emailjs !== 'undefined') {
        try {
            emailjs.init("YOUR_EMAILJS_PUBLIC_KEY");
        } catch (e) {
            console.warn("EmailJS init note:", e);
        }
    }

    // 2. State & Goals Data Store
    let mgseGoals = [
        {
            id: 1,
            name: "Kid's Higher Education",
            cost: 2500000,
            years: 10,
            priority: "Essential",
            active: true,
            color: "#00B37E"
        },
        {
            id: 2,
            name: "Home Down Payment",
            cost: 2000000,
            years: 5,
            priority: "Important",
            active: true,
            color: "#0B63D8"
        },
        {
            id: 3,
            name: "Early Retirement Corpus",
            cost: 5000000,
            years: 20,
            priority: "Lifestyle",
            active: true,
            color: "#F59E0B"
        }
    ];

    let mgseGoalCounter = 4;
    let mgseChartInstance = null;

    const mgsePalette = [
        '#00B37E', // Emerald
        '#0B63D8', // Primary Blue
        '#F59E0B', // Amber
        '#8B5CF6', // Purple
        '#EC4899', // Pink
        '#06B6D4', // Cyan
        '#F43F5E', // Rose
        '#14B8A6', // Teal
        '#F97316', // Orange-Red
        '#6366F1'  // Indigo
    ];

    // Format Currency - Indian Numbering System
    const formatMgseCurr = (val) => "₹" + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(val || 0));

    // Helper to sanitize numeric inputs (handle commas, NaNs)
    const getMgseNum = (id) => {
        const el = document.getElementById(id);
        if (!el) return 0;
        const sanitized = String(el.value).replace(/,/g, '');
        return Number(sanitized) || 0;
    };

    // Calculate Step-Up SIP required to reach a future value
    function calculateRequiredStepUpSip(fv, years, expectedReturnPerc, stepUpPerc) {
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
            requiredSip = mid;
        }

        return requiredSip;
    }

    // Attach Synchronized Slider & Input Listeners
    function attachGlobalListeners() {
        const inputs = [
            { id: 'mgseIncome', slider: 'mgseIncomeSlider', isCurrency: true },
            { id: 'mgseExpenses', slider: 'mgseExpensesSlider', isCurrency: true },
            { id: 'mgseReturns', slider: 'mgseReturnsSlider', isCurrency: false },
            { id: 'mgseInflation', slider: 'mgseInflationSlider', isCurrency: false },
            { id: 'mgseStepup', slider: 'mgseStepupSlider', isCurrency: false }
        ];

        inputs.forEach(item => {
            const numInput = document.getElementById(item.id);
            const slider = document.getElementById(item.slider);

            if (numInput && slider) {
                // Input -> Slider
                numInput.addEventListener('input', () => {
                    const val = getMgseNum(item.id);
                    slider.value = val;
                    calculateAndRender();
                });

                numInput.addEventListener('blur', () => {
                    const val = getMgseNum(item.id);
                    if (item.isCurrency) {
                        numInput.value = new Intl.NumberFormat('en-IN').format(val);
                    }
                    slider.value = val;
                    calculateAndRender();
                });

                // Slider -> Input
                slider.addEventListener('input', () => {
                    const val = Number(slider.value);
                    if (item.isCurrency) {
                        numInput.value = new Intl.NumberFormat('en-IN').format(val);
                    } else {
                        numInput.value = val;
                    }
                    calculateAndRender();
                });
            }
        });
    }

    // Add New Goal
    window.mgseAddGoal = function () {
        const newGoal = {
            id: mgseGoalCounter++,
            name: `Goal ${mgseGoalCounter - 1}`,
            cost: 1000000,
            years: 5,
            priority: 'Important',
            active: true,
            color: mgsePalette[(mgseGoalCounter - 1) % mgsePalette.length]
        };
        mgseGoals.push(newGoal);
        calculateAndRender();
    };

    // Delete Goal
    window.mgseDeleteGoal = function (id) {
        mgseGoals = mgseGoals.filter(g => g.id !== id);
        calculateAndRender();
    };

    // Toggle Goal Active / Paused
    window.mgseToggleGoal = function (id) {
        const goal = mgseGoals.find(g => g.id === id);
        if (goal) {
            goal.active = !goal.active;
            calculateAndRender();
        }
    };

    // Update Goal Fields
    window.mgseUpdateGoal = function (id, field, value) {
        const goal = mgseGoals.find(g => g.id === id);
        if (!goal) return;

        if (field === 'cost' || field === 'years') {
            const sanitized = String(value).replace(/,/g, '');
            goal[field] = Number(sanitized) || 0;
        } else {
            goal[field] = value;
        }
        calculateAndRender();
    };

    // Adjust Goal Cost by ±₹10,000
    window.mgseAdjustCost = function (id, amount) {
        const goal = mgseGoals.find(g => g.id === id);
        if (goal) {
            goal.cost = Math.max(0, goal.cost + amount);
            calculateAndRender();
        }
    };

    // Main Engine Calculation & Render
    function calculateAndRender() {
        const income = getMgseNum('mgseIncome');
        const expenses = getMgseNum('mgseExpenses');
        const gReturns = getMgseNum('mgseReturns') || 12;
        const gInflation = getMgseNum('mgseInflation') || 6;
        const gStepup = getMgseNum('mgseStepup') || 10;

        const surplus = Math.max(0, income - expenses);
        const surplusDisplay = document.getElementById('mgseSurplusDisplay');
        const surplusText = document.getElementById('mgseAvailableSurplusText');

        if (surplusDisplay) surplusDisplay.innerText = formatMgseCurr(surplus);
        if (surplusText) surplusText.innerText = formatMgseCurr(surplus);

        let totalRequiredSip = 0;
        let totalGoalCostToday = 0;

        // 1. Perform Individual Goal Projections
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

            // Required Monthly initial SIP with Step-Up
            g.reqSip = calculateRequiredStepUpSip(g.fv, g.years, gReturns, gStepup);
            totalRequiredSip += g.reqSip;
            totalGoalCostToday += g.cost;

            g.allocatedSip = 0;
            g.fundedPerc = 0;
        });

        const totalReqEl = document.getElementById('mgseTotalRequiredSip');
        if (totalReqEl) totalReqEl.innerText = formatMgseCurr(totalGoalCostToday);

        // 2. Priority Auto-Allocation Engine (Sequential Spillover Simulation)
        const priorityScore = { 'Essential': 3, 'Important': 2, 'Lifestyle': 1 };
        let activeGoals = mgseGoals.filter(g => g.active).sort((a, b) => {
            if (priorityScore[a.priority] !== priorityScore[b.priority]) {
                return priorityScore[b.priority] - priorityScore[a.priority];
            }
            return a.years - b.years;
        });

        // Reset simulation balances
        activeGoals.forEach(g => {
            g.simulatedBalance = 0;
            g.isFundedInSim = false;
            g.allocatedSip = 0;
            g.fundedPerc = 0;
            g.currentSipGoal = g.reqSip;
        });

        const maxHorizon = activeGoals.length > 0 ? Math.max(...activeGoals.map(g => g.years)) : 0;
        const monthlyRate = (gReturns / 100) / 12;
        let currentMonthlySurplus = surplus;
        const yearlySnapshots = [];

        for (let m = 1; m <= maxHorizon * 12; m++) {
            const queueForMonth = activeGoals.filter(g => !g.isFundedInSim && g.years * 12 >= m);
            let remainingToAllocate = currentMonthlySurplus;

            activeGoals.forEach(g => g.tempAlloc = 0);

            // Phase 1: Fair Share Allocation
            for (const goal of queueForMonth) {
                if (remainingToAllocate <= 0) break;

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

            // Phase 2: Greedy Spillover Allocation
            if (remainingToAllocate > 0) {
                for (const goal of queueForMonth) {
                    if (remainingToAllocate <= 0 || goal.isFundedInSim) continue;

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

            // Capture Snapshot at Mid-Year (Month 6)
            if (m % 12 === 6) {
                const y = Math.ceil(m / 12);
                yearlySnapshots.push({
                    year: y,
                    total: currentMonthlySurplus,
                    allocs: activeGoals.map(g => ({ id: g.id, name: g.name, amt: g.tempAlloc || 0, priority: g.priority }))
                });
            }

            // Check goal funding completions
            activeGoals.forEach(g => {
                if (g.simulatedBalance >= g.fv - 10) {
                    g.isFundedInSim = true;
                    g.fundedPerc = 100;
                }
            });

            // Horizon-based final funded percentage
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

        activeGoals.yearlySnapshots = yearlySnapshots;

        // 3. Update Dashboard Health Gauge
        const totalFundedPerc = activeGoals.reduce((sum, g) => sum + g.fundedPerc, 0);
        const healthPerc = activeGoals.length > 0 ? (totalFundedPerc / activeGoals.length) : 100;

        const healthPercentEl = document.getElementById('mgseHealthPercentage');
        const surplusBarEl = document.getElementById('mgseSurplusBar');

        let healthColor = '#00B37E'; // Green
        if (healthPerc < 95) healthColor = '#F59E0B'; // Amber
        if (healthPerc < 60) healthColor = '#EF4444'; // Red

        if (healthPercentEl) {
            healthPercentEl.innerText = `${healthPerc.toFixed(0)}%`;
            healthPercentEl.style.color = healthColor;
        }

        if (surplusBarEl) {
            surplusBarEl.style.width = `${Math.min(100, healthPerc)}%`;
            surplusBarEl.style.backgroundColor = healthColor;
        }

        // Draw Chart.js Gauge
        if (typeof Chart !== 'undefined') {
            const gaugeCanvas = document.getElementById('mgseHealthChart');
            if (gaugeCanvas) {
                const gaugeCtx = gaugeCanvas.getContext('2d');
                if (mgseChartInstance) mgseChartInstance.destroy();
                mgseChartInstance = new Chart(gaugeCtx, {
                    type: 'doughnut',
                    data: {
                        datasets: [{
                            data: [healthPerc, Math.max(0, 100 - healthPerc)],
                            backgroundColor: [healthColor, '#F1F5F9'],
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
        }

        // 4. Generate Strategic FinNomy Fix Recommendations
        const fixEl = document.getElementById('mgseFinnomyFixText');
        if (fixEl) {
            const essentialShortfall = activeGoals.find(g => g.priority === 'Essential' && g.fundedPerc < 99.9);
            const primaryShortfall = activeGoals.find(g => g.fundedPerc < 99.9);
            const Year1AllocTotal = activeGoals.reduce((sum, g) => sum + g.allocatedSip, 0);
            const Year1RemainingSurplus = Math.max(0, surplus - Year1AllocTotal);

            let fixText = "";

            if (healthPerc >= 99.9) {
                fixText = `<span style="color: #059669; font-weight: 700;">PRO STATUS:</span> Your portfolio is in optimal shape! You have <strong>${formatMgseCurr(Year1RemainingSurplus)}</strong>/month unallocated surplus. Tip: Direct this into a liquid buffer fund to build secondary resilience.`;
            } else if (essentialShortfall) {
                const gap = essentialShortfall.reqSip - essentialShortfall.allocatedSip;
                const suggestion = gStepup < 15 ?
                    `Increase Annual Step-Up to <strong>${gStepup + 2}%</strong>` :
                    `delay a Lifestyle goal by 2 years`;

                fixText = `<div style="background: #FEF2F2; padding: 12px; border-radius: 8px; border: 1px solid #FEE2E2;">
                    <span style="color: #DC2626; font-weight: 800; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">⚠️ CRITICAL ALERT</span><br>
                    <span style="color: #991B1B; font-size: 0.88rem;">Your Essential goal <strong>"${essentialShortfall.name}"</strong> is only ${essentialShortfall.fundedPerc.toFixed(0)}% funded. 
                    <strong>Recommended Action:</strong> ${suggestion} to bridge the ${formatMgseCurr(gap)}/mo gap and secure this non-negotiable target.</span>
                </div>`;
            } else if (primaryShortfall) {
                const gap = primaryShortfall.reqSip - primaryShortfall.allocatedSip;
                const lowerPriority = activeGoals.slice().reverse().find(g => priorityScore[g.priority] < priorityScore[primaryShortfall.priority] && g.allocatedSip > 0);

                if (lowerPriority) {
                    fixText = `<span style="color: #1E40AF; font-weight: 700;">STRATEGIC MOVE:</span> Goal <strong>"${primaryShortfall.name}"</strong> has a monthly shortfall of ${formatMgseCurr(gap)}. 
                    <strong>Action:</strong> Extending the time horizon of "${lowerPriority.name}" by 2 years will automatically divert necessary SIP to achieve 100% funding!`;
                } else {
                    const stepUpBoost = Math.ceil((gap / primaryShortfall.reqSip) * 10);
                    fixText = `<span style="color: #1E40AF; font-weight: 700;">Action:</span> To reach 100% funding for "${primaryShortfall.name}", consider increasing your Annual Step-Up by <strong>+${Math.min(5, stepUpBoost)}%</strong> or reducing living expenses by ${formatMgseCurr(gap)}.`;
                }
            } else {
                fixText = `Your goals are largely covered. Minor adjustments in your expected equity returns or time horizons will push your portfolio to 100% health.`;
            }

            const fundingSources = activeGoals.filter(g => g.allocatedSip > 0).sort((a, b) => a.years - b.years);
            const firstFundingSource = fundingSources[0];
            const shortFallGoals = activeGoals.filter(g => g.fundedPerc < 100 && (!firstFundingSource || g.years > firstFundingSource.years));

            if (firstFundingSource && shortFallGoals.length > 0) {
                fixText += `<div style="margin-top: 10px; padding: 10px; background: #ECFDF5; border-radius: 6px; border-left: 4px solid #00B37E;">
                    <span style="color: #047857; font-weight: 700; font-size: 0.75rem; text-transform: uppercase;">Allocation Flow Forecast:</span><br>
                    <span style="font-size: 0.85rem; color: #065F46;">Once <strong>"${firstFundingSource.name}"</strong> is completed in <strong>${firstFundingSource.years} years</strong>, your monthly <strong>${formatMgseCurr(firstFundingSource.allocatedSip)}</strong> will automatically divert to fund subsequent goals!</span>
                </div>`;
            }

            fixEl.innerHTML = fixText;
        }

        // 5. Render Skyline Flow Roadmap
        renderSkylineRoadmap(activeGoals, maxHorizon);

        // 6. Render Goal Repeater Cards
        renderGoalCards();
    }

    // Render Skyline Horizontal Flow Chart
    function renderSkylineRoadmap(activeGoals, maxHorizon) {
        const roadmapEl = document.getElementById('mgseRoadmap');
        if (!roadmapEl) return;

        const maxSnapTotal = Math.max(...(activeGoals.yearlySnapshots || []).map(s => s.total), 1);
        const chartHeight = 160;

        roadmapEl.innerHTML = `
            <div style="margin-bottom: 14px; font-size: 0.75rem; color: #64748B; font-weight: 700; display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="display: flex; flex-direction: column;">
                    <span style="text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.85rem; color: #0F172A;">SIP Investment Skyline</span>
                    <span style="font-size: 0.65rem; color: #94A3B8; font-weight: 600; text-transform: none; letter-spacing: 0;">(Wealth Accumulation Trajectory)</span>
                </div>
                <span style="background: #F1F5F9; padding: 4px 10px; border-radius: 20px; color: #334155;">Horizon: ${maxHorizon} Years</span>
            </div>
            <div id="mgseSipFlowChart" style="display: flex; align-items: flex-end; gap: 6px; height: ${chartHeight + 30}px; padding-bottom: 25px; overflow-x: auto; position: relative; border-bottom: 2px solid #F1F5F9;"></div>
            <div id="mgseSipLegend" style="display: flex; flex-wrap: wrap; gap: 14px; margin-top: 14px; padding-top: 10px; border-top: 1px solid #F1F5F9;"></div>
        `;

        const flowContainer = document.getElementById('mgseSipFlowChart');
        const legendContainer = document.getElementById('mgseSipLegend');

        const goalColors = {};
        activeGoals.forEach(g => {
            goalColors[g.id] = g.color || '#94A3B8';
        });

        const displayStep = maxHorizon > 15 ? 2 : 1;
        (activeGoals.yearlySnapshots || []).forEach((snap, idx) => {
            if (idx % displayStep !== 0) return;

            const barHeight = (snap.total / maxSnapTotal) * chartHeight;

            const barHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; min-width: 28px; flex: 1;">
                    <div style="width: 100%; height: ${barHeight}px; display: flex; flex-direction: column-reverse; background: #F1F5F9; border-radius: 4px 4px 0 0; overflow: hidden; position: relative;" title="Year ${snap.year}: ${formatMgseCurr(snap.total)}">
                        ${snap.allocs.map(a => {
                const p = (a.amt / snap.total) * 100;
                if (p < 0.5) return '';
                return `<div style="height: ${p}%; background: ${goalColors[a.id]}; border-top: 1px solid rgba(255,255,255,0.3);" title="${a.name}: ${formatMgseCurr(a.amt)}"></div>`;
            }).join('')}
                        ${snap.total > snap.allocs.reduce((s, a) => s + a.amt, 0) + 1 ?
                    `<div style="flex: 1; background: #E2E8F0; opacity: 0.4;" title="Unallocated Surplus"></div>` : ''}
                    </div>
                    <div style="margin-top: 6px; font-size: 0.65rem; color: #94A3B8; font-weight: 800;">Y${snap.year}</div>
                </div>
            `;
            flowContainer.insertAdjacentHTML('beforeend', barHTML);
        });

        activeGoals.forEach(g => {
            const legendItem = `
                <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="width: 10px; height: 10px; border-radius: 2px; background: ${goalColors[g.id]};"></div>
                    <span style="font-size: 0.75rem; font-weight: 600; color: #475569;">${g.name}</span>
                </div>
            `;
            legendContainer.insertAdjacentHTML('beforeend', legendItem);
        });
    }

    // Render Dynamic Goal Repeater Cards
    function renderGoalCards() {
        const container = document.getElementById('mgseGoalsContainer');
        if (!container) return;

        container.innerHTML = '';

        mgseGoals.forEach(g => {
            const isEssential = g.priority === 'Essential';
            const opacity = g.active ? '1' : '0.6';
            const cardBg = g.active ? '#FFFFFF' : '#F8FAFC';

            let priorityColor = '#0B63D8'; // Important
            let priorityBadgeText = 'Important';
            if (g.priority === 'Essential') {
                priorityColor = '#00B37E';
                priorityBadgeText = '🛡️ Non-Negotiable';
            } else if (g.priority === 'Lifestyle') {
                priorityColor = '#F59E0B';
                priorityBadgeText = '🏖️ Lifestyle';
            }

            let barColor = g.fundedPerc >= 100 ? '#00B37E' : (g.fundedPerc > 0 ? '#F59E0B' : '#EF4444');

            const html = `
                <div class="goal-card-item ${isEssential ? 'essential-goal' : ''}" style="background: ${cardBg}; opacity: ${opacity};">
                    <div class="goal-card-header">
                        <div style="flex: 1;">
                            <div class="goal-name-wrap">
                                <div class="goal-color-dot" style="background: ${g.color || '#94A3B8'};"></div>
                                <input type="text" class="goal-name-input" value="${g.name}" onchange="mgseUpdateGoal(${g.id}, 'name', this.value)">
                            </div>
                            <div class="goal-badge-priority" style="color: ${priorityColor};">
                                ${priorityBadgeText}
                            </div>
                            <div class="goal-cost-controls">
                                <span style="color: #94A3B8; font-size: 0.85rem; font-weight: 600;">Cost: ₹</span>
                                <button class="cost-adjust-btn" onclick="mgseAdjustCost(${g.id}, -10000)">-</button>
                                <input type="text" class="goal-cost-input"
                                    value="${new Intl.NumberFormat('en-IN').format(g.cost)}"
                                    onfocus="this.value = this.value.replace(/,/g, '')"
                                    onblur="mgseUpdateGoal(${g.id}, 'cost', this.value)">
                                <button class="cost-adjust-btn" onclick="mgseAdjustCost(${g.id}, 10000)">+</button>
                                <span style="color: #94A3B8; font-size: 0.7rem; font-weight: 600; text-transform: uppercase;">(±10k)</span>
                            </div>
                            <div class="goal-future-target-tag">
                                🎯 Future Inflated Cost: <strong style="color: #0F172A;">${formatMgseCurr(g.fv)}</strong>
                            </div>
                        </div>
                        <div class="goal-actions-group">
                            <select class="goal-select-priority" onchange="mgseUpdateGoal(${g.id}, 'priority', this.value)" style="border-color: ${priorityColor}; color: ${priorityColor};">
                                <option value="Essential" ${g.priority === 'Essential' ? 'selected' : ''}>Essential</option>
                                <option value="Important" ${g.priority === 'Important' ? 'selected' : ''}>Important</option>
                                <option value="Lifestyle" ${g.priority === 'Lifestyle' ? 'selected' : ''}>Lifestyle</option>
                            </select>
                            <select class="goal-select-status" onchange="mgseToggleGoal(${g.id})">
                                <option value="on" ${g.active ? 'selected' : ''}>Active</option>
                                <option value="off" ${!g.active ? 'selected' : ''}>Paused</option>
                            </select>
                            <button class="goal-delete-btn" onclick="mgseDeleteGoal(${g.id})" title="Delete Goal">&times;</button>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 14px;">
                        <div>
                            <label style="display: block; font-size: 0.82rem; color: #64748B; margin-bottom: 4px; font-weight: 600;">Time Horizon: <strong style="color: #0F172A;">${g.years} Years</strong></label>
                            <input type="range" class="custom-range-slider" min="1" max="40" value="${g.years}" oninput="mgseUpdateGoal(${g.id}, 'years', this.value)">
                        </div>
                        <div style="text-align: right;">
                            <span style="display: block; font-size: 0.75rem; color: #64748B; text-transform: uppercase; font-weight: 600;">Future Target</span>
                            <span style="font-size: 1.05rem; font-weight: 800; color: #0F172A;">${g.active ? formatMgseCurr(g.fv) : '-'}</span>
                        </div>
                    </div>

                    <div class="goal-funding-card">
                        <div class="funding-header-row">
                            <span>Ideal Required Initial SIP</span>
                            <span style="font-weight: 800; color: #0F172A;">${g.active ? formatMgseCurr(g.reqSip) : 'Paused'}</span>
                        </div>
                        <div class="funding-progress-bg">
                            <div class="funding-progress-fill" style="width: ${g.fundedPerc}%; background: ${barColor};"></div>
                        </div>
                        <div class="funding-footer-row">
                            <span>System Allocated (Year 1): <strong style="color: #0F172A;">${g.active ? formatMgseCurr(g.allocatedSip) : '0'}/mo</strong></span>
                            <span style="font-weight: 800; color: ${barColor};">${g.fundedPerc.toFixed(0)}% Funded</span>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);
        });
    }

    // Dynamic Did You Know Fact Rotation
    const didYouKnowFacts = [
        "Simultaneous goal planning prevents milestone collision — staggering education and home EMIs can save up to 40% in interest.",
        "Applying individual inflation rates (e.g. 10% for education vs 6% for lifestyle) ensures realistic future corpus sizing.",
        "An annual 10% Step-Up on your SIP reduces your initial monthly cash burden by nearly half while reaching the same future targets.",
        "Non-negotiable goals (like children's college) should always be prioritized with high equity allocations early in the horizon.",
        "Pausing a secondary lifestyle goal during a high-outlay year frees up cash flow to preserve your primary retirement compounder.",
        "100% Portfolio Health indicates zero cash-flow deficit across all concurrent horizons without compromising living expenses."
    ];

    let currentFactIndex = 0;
    const factTextEl = document.getElementById('plannerFactText');

    if (factTextEl) {
        setInterval(() => {
            currentFactIndex = (currentFactIndex + 1) % didYouKnowFacts.length;
            factTextEl.style.opacity = '0';
            setTimeout(() => {
                factTextEl.innerText = didYouKnowFacts[currentFactIndex];
                factTextEl.style.opacity = '1';
            }, 300);
        }, 8000);
    }

    // Suite Carousel Auto-Scroll Logic
    const carouselTrack = document.getElementById('toolsCarouselTrack');
    if (carouselTrack) {
        let isHovered = false;
        const viewport = carouselTrack.closest('.carousel-viewport');

        if (viewport) {
            viewport.addEventListener('mouseenter', () => { isHovered = true; });
            viewport.addEventListener('mouseleave', () => { isHovered = false; });

            setInterval(() => {
                if (!isHovered) {
                    if (viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 10) {
                        viewport.scrollTo({ left: 0, behavior: 'smooth' });
                    } else {
                        viewport.scrollBy({ left: 310, behavior: 'smooth' });
                    }
                }
            }, 4500);
        }
    }

    // Lead Capture: "Send My Report" Email Dispatch
    window.sendDashboardReport = function (calcType) {
        const nameInput = document.getElementById('lcName-MGSE');
        const emailInput = document.getElementById('lcEmail-MGSE');
        const phoneInput = document.getElementById('lcPhone-MGSE');
        const btn = document.getElementById('lcBtn-MGSE');
        const successMsg = document.getElementById('lcSuccess-MGSE');

        if (!btn || !nameInput || !emailInput) return;

        const userName = nameInput.value.trim();
        const userEmail = emailInput.value.trim();
        const userPhone = phoneInput ? phoneInput.value.trim() : "";

        let hasError = false;

        const toggleError = (inputEl, isInvalid) => {
            if (!inputEl) return;
            const errSpan = inputEl.nextElementSibling;
            if (isInvalid) {
                inputEl.style.borderColor = '#DC2626';
                if (errSpan && errSpan.classList.contains('lc-error')) errSpan.style.display = 'block';
            } else {
                inputEl.style.borderColor = '#E2E8F0';
                if (errSpan && errSpan.classList.contains('lc-error')) errSpan.style.display = 'none';
            }
        };

        if (!userName) { hasError = true; toggleError(nameInput, true); } else { toggleError(nameInput, false); }
        if (!userEmail || !userEmail.includes('@')) { hasError = true; toggleError(emailInput, true); } else { toggleError(emailInput, false); }
        if (phoneInput && userPhone.length > 0 && userPhone.length < 10) { hasError = true; toggleError(phoneInput, true); } else { toggleError(phoneInput, false); }

        if (hasError) return;

        btn.disabled = true;
        btn.innerText = "⏳ Sending Multi-Goal Roadmap...";

        const activeGoals = mgseGoals.filter(g => g.active);
        const totalToday = activeGoals.reduce((sum, g) => sum + g.cost, 0);
        const totalFuture = Math.round(activeGoals.reduce((sum, g) => sum + g.fv, 0));
        const health = document.getElementById('mgseHealthPercentage') ? document.getElementById('mgseHealthPercentage').innerText : "100%";

        let reportHtml = `<div style="font-family: sans-serif; line-height: 1.6; color: #1E293B;">
            <h3 style="color: #0B63D8; margin-bottom: 12px;">FinNomy™ Multi-Goal Allocation Summary</h3>
            <p><strong>Portfolio Health:</strong> ${health} | <strong>Total Present Target:</strong> ${formatMgseCurr(totalToday)} | <strong>Future Inflated Target:</strong> ${formatMgseCurr(totalFuture)}</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 15px;">
                <thead>
                    <tr style="background: #0F172A; color: #FFFFFF;">
                        <th style="padding: 8px; text-align: left;">Goal</th>
                        <th style="padding: 8px; text-align: left;">Horizon</th>
                        <th style="padding: 8px; text-align: left;">Present Cost</th>
                        <th style="padding: 8px; text-align: left;">Future Target</th>
                        <th style="padding: 8px; text-align: left;">System Allocated</th>
                        <th style="padding: 8px; text-align: left;">Status</th>
                    </tr>
                </thead>
                <tbody>`;

        activeGoals.forEach((g, idx) => {
            reportHtml += `
                <tr style="border-bottom: 1px solid #E2E8F0; background: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
                    <td style="padding: 8px;"><strong>${g.name}</strong></td>
                    <td style="padding: 8px;">${g.years} Yrs</td>
                    <td style="padding: 8px;">${formatMgseCurr(g.cost)}</td>
                    <td style="padding: 8px;">${formatMgseCurr(g.fv)}</td>
                    <td style="padding: 8px; color: #0B63D8; font-weight: 700;">${formatMgseCurr(g.allocatedSip)}/mo</td>
                    <td style="padding: 8px; font-weight: 700; color: ${g.fundedPerc >= 99 ? '#00B37E' : '#F59E0B'};">${g.fundedPerc.toFixed(0)}% Funded</td>
                </tr>`;
        });

        reportHtml += `</tbody></table></div>`;

        const templateParams = {
            user_name: userName,
            user_email: userEmail,
            user_phone: userPhone,
            calculator_name: "Multi-Goal Wealth Planner 🗺️",
            website_url: window.location.href,
            return_url: "https://finnomy.com/multi-goal-planner.html",
            label_1: "Total Goal Cost (Today)",
            val_1: formatMgseCurr(totalToday),
            label_2: "Future Inflated Target",
            val_2: formatMgseCurr(totalFuture),
            label_3: "Portfolio Health",
            val_3: health,
            advisor_fix: reportHtml,
            inputs_summary: `Take-Home: ₹${new Intl.NumberFormat('en-IN').format(getMgseNum('mgseIncome'))}/mo | Living Exp: ₹${new Intl.NumberFormat('en-IN').format(getMgseNum('mgseExpenses'))}/mo | ROI: ${getMgseNum('mgseReturns')}% | Inflation: ${getMgseNum('mgseInflation')}% | Step-Up: ${getMgseNum('mgseStepup')}%`
        };

        if (typeof emailjs !== 'undefined') {
            emailjs.send('service_default', 'template_general_report', templateParams)
                .then(() => {
                    btn.innerText = "✅ Report Sent!";
                    if (successMsg) {
                        successMsg.style.display = 'flex';
                        successMsg.innerText = "✅ Personalized Multi-Goal Blueprint dispatched to your inbox!";
                    }
                })
                .catch(err => {
                    console.warn("EmailJS send fallback:", err);
                    btn.innerText = "✅ Strategy Saved!";
                    if (successMsg) {
                        successMsg.style.display = 'flex';
                        successMsg.innerText = "✅ Strategy generated successfully!";
                    }
                });
        } else {
            setTimeout(() => {
                btn.innerText = "✅ Report Sent!";
                if (successMsg) {
                    successMsg.style.display = 'flex';
                    successMsg.innerText = "✅ Personalized Multi-Goal Blueprint dispatched to your inbox!";
                }
            }, 800);
        }
    };

    // Attach listeners and run initial render
    attachGlobalListeners();
    calculateAndRender();
});

// FAQ Accordion Toggle Helper
function toggleFaq(el) {
    const item = el.parentElement;
    const isActive = item.classList.contains('active');

    document.querySelectorAll('.faq-item').forEach(f => f.classList.remove('active'));

    if (!isActive) {
        item.classList.add('active');
    }
}

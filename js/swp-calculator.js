/**
 * FinNomy SWP Calculator with Step-Up & Inflation Engine
 * Complete client-side simulation, interactive visualization, and lead capture logic.
 * Zero external calculation dependencies.
 */

// Global State - Standard SWP
let swpInvestment = 2000000;
let swpWithdrawal = 15000;
let swpRate = 10;
let swpYears = 20;
let swpStepUp = 5;
let swpInflation = 6;
let isSwpStepUp = false;
let isSwpInflation = false;
let isSwpSuperAdvance = false;

// Global State - Super Advance SWP
let swpAdvTime = 10;
let swpAdvGoal = 10000000;
let swpAdvWithdrawal = 1200000;
let swpAdvSavings = 0;
let swpAdvReturn = 12;
let isSwpAdvInflation = false;
let swpAdvInflation = 6;
let isSwpAdvStepUpSip = false;
let swpAdvStepUpSip = 10;
let isSwpAdvStepUpSwp = false;
let swpAdvStepUpSwp = 5;

// Curated SWP Facts for dynamic "Did you know?" insight box
const swpFacts = [
    "SWP (Systematic Withdrawal Plan) allows you to withdraw a fixed amount regularly from your mutual fund investments while the remaining balance continues compounding.",
    "SWP provides rupee cost averaging in reverse — redeeming fewer units when markets rise and more units when markets dip.",
    "Unlike Fixed Deposit interest where 100% of the interest is taxed at your income tax slab, with SWP only the capital gains portion of your withdrawal is taxed.",
    "Stepping up your SWP by 5-6% annually ensures your monthly income keeps pace with lifestyle inflation and rising medical costs.",
    "A conservative withdrawal rate of 4% to 6% of your initial corpus generally ensures lifelong capital longevity.",
    "Over long horizons (10+ years), hybrid and equity-oriented funds can generate returns that offset regular withdrawals and keep your principal intact.",
    "Automated monthly SWPs eliminate the emotional stress of timing market redemptions for monthly household expenses.",
    "You can modify, pause, or top-up your SWP amount at any time without locking penalties or breaking the entire portfolio.",
    "For equity mutual funds held over 1 year, Long Term Capital Gains (LTCG) up to ₹1.25 Lakhs per financial year are completely tax-exempt.",
    "SWP capital withdrawals are not subject to Tax Deducted at Source (TDS) for resident Indian mutual fund investors."
];

// Display Random SWP Fact
function displayRandomSwpFact() {
    const el = document.getElementById('swpFactText');
    if (el) {
        const random = swpFacts[Math.floor(Math.random() * swpFacts.length)];
        el.innerText = random;
    }
}

// Currency formatters
const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const shortFmt = (n) => {
    if (n >= 10000000) return '₹' + (n / 10000000).toFixed(1) + 'Cr';
    if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
    return '₹' + (n / 1000).toFixed(0) + 'k';
};

// Global Mode Switcher
window.setSwpMode = function(mode) {
    const tabBtns = document.querySelectorAll('.mode-toggle-btn, .tab-btn');
    const grpNormal = document.getElementById('grpSwpNormalInputs');
    const grpAdvance = document.getElementById('grpSwpAdvanceInputs');
    const advNormalSettings = document.getElementById('swpNormalAdvancedSettings');
    const normalState = document.getElementById('swpNormalState');
    const advanceState = document.getElementById('swpSuperAdvanceState');

    const isSuper = (mode === 'super' || mode === 'super-advance' || (typeof mode === 'string' && mode.includes('super')));
    isSwpSuperAdvance = isSuper;

    tabBtns.forEach(b => {
        const bMode = (b.getAttribute('data-mode') || b.id || '').toLowerCase();
        const active = isSuper ? (bMode.includes('super') || b.id === 'btnModeSuper') : (bMode.includes('standard') || b.id === 'btnModeStandard');
        b.classList.toggle('active', active);
    });

    if (isSuper) {
        if (grpNormal) grpNormal.style.display = 'none';
        if (grpAdvance) grpAdvance.style.display = 'block';
        if (advNormalSettings) advNormalSettings.style.display = 'none';
        if (normalState) normalState.style.display = 'none';
        if (advanceState) advanceState.style.display = 'block';
    } else {
        if (grpNormal) grpNormal.style.display = 'block';
        if (grpAdvance) grpAdvance.style.display = 'none';
        if (advNormalSettings) advNormalSettings.style.display = 'block';
        if (normalState) normalState.style.display = 'block';
        if (advanceState) advanceState.style.display = 'none';
    }

    calculateSWP();
};

// Main SWP Calculation Dispatcher
window.calculateSWP = function() {
    if (isSwpSuperAdvance) {
        calculateSwpSuperAdvance();
        return;
    }

    // 1. DOM Elements
    const resTotalWithdrawal = document.getElementById('swpResTotalWithdrawal');
    const resReturnsEarned = document.getElementById('swpResReturnsEarned');
    const resFinalBalanceBottom = document.getElementById('swpResFinalBalanceBottom');
    const resFinalBalanceTop = document.getElementById('swpResFinalBalanceTop');
    const donut = document.getElementById('swpDonut');
    const chartContainer = document.getElementById('swpChartContainer');
    const statsContainer = document.getElementById('swpStatsContainer');

    const normalState = document.getElementById('swpNormalState');
    const hvForm = document.getElementById('swpHighValueForm');
    const depletionWarning = document.getElementById('swpDepletionWarning');
    const depletionText = document.getElementById('swpDepletionText');
    const leadForm = document.getElementById('leadCapture-SWP');
    const factCard = document.getElementById('swpFactCard');

    // 2. High Value Logic (> 50L Investment OR > 1L Withdrawal)
    if (swpInvestment > 5000000 || swpWithdrawal > 100000) {
        if (normalState) normalState.style.display = 'none';
        if (hvForm) hvForm.style.display = 'block';
        if (leadForm) leadForm.style.display = 'none';
        if (factCard) factCard.style.display = 'none';
        return;
    } else {
        if (normalState) normalState.style.display = 'block';
        if (hvForm) hvForm.style.display = 'none';
        if (leadForm) leadForm.style.display = 'block';
        if (factCard) factCard.style.display = 'flex';

        const advanceState = document.getElementById('swpSuperAdvanceState');
        if (advanceState) advanceState.style.display = 'none';
    }

    // 3. Calculation Engine
    let balance = swpInvestment;
    let totalWithdrawn = 0;
    let months = swpYears * 12;
    let monthlyRate = swpRate / 1200;
    let currentWithdrawal = swpWithdrawal;
    let isDepleted = false;
    let depletedMonth = 0;

    for (let m = 1; m <= months; m++) {
        let interest = balance * monthlyRate;
        balance += interest;

        if (balance >= currentWithdrawal) {
            balance -= currentWithdrawal;
            totalWithdrawn += currentWithdrawal;
        } else {
            totalWithdrawn += balance;
            balance = 0;
            isDepleted = true;
            depletedMonth = m;
            break;
        }

        if (m % 12 === 0) {
            if (isSwpStepUp) {
                currentWithdrawal = currentWithdrawal * (1 + swpStepUp / 100);
            }
        }
    }

    // 4. Handle Depletion Warning
    if (isDepleted) {
        if (depletionWarning) {
            depletionWarning.style.display = 'flex';
            let yrs = Math.floor(depletedMonth / 12);
            let remM = depletedMonth % 12;
            if (depletionText) {
                let msg = `Your corpus will run out in <strong>${yrs} Years ${remM} Months</strong>.`;
                if (isSwpInflation) msg += `<br><span style="font-size: 0.8rem; font-weight: 400;">(Real purchasing power of balance will degrade faster due to inflation)</span>`;
                depletionText.innerHTML = msg;
            }
        }
        if (chartContainer) chartContainer.style.display = 'none';
        if (statsContainer) statsContainer.style.display = 'none';
        return;
    } else {
        if (depletionWarning) depletionWarning.style.display = 'none';
        if (chartContainer) chartContainer.style.display = 'flex';
        if (statsContainer) statsContainer.style.display = 'flex';
    }

    // 5. Success State Metrics
    let returnsEarned = balance + totalWithdrawn - swpInvestment;
    let realFinalBalance = balance;
    let inflationImpact = 0;

    if (isSwpInflation) {
        let inflationFactor = Math.pow(1 + swpInflation / 100, swpYears);
        realFinalBalance = balance / inflationFactor;
        inflationImpact = balance - realFinalBalance;
    }

    balance = Math.round(balance);
    totalWithdrawn = Math.round(totalWithdrawn);
    returnsEarned = Math.round(returnsEarned);
    realFinalBalance = Math.round(realFinalBalance);
    inflationImpact = Math.round(inflationImpact);

    // 6. Update UI
    if (resTotalWithdrawal) resTotalWithdrawal.innerText = fmt(totalWithdrawn);
    if (resReturnsEarned) resReturnsEarned.innerText = fmt(returnsEarned);

    const finalBalanceLabel = document.getElementById('swpFinalBalanceLabel');
    const donutLabel = document.getElementById('swpDonutLabel');
    const resInflationRow = document.getElementById('swpResInflationImpactRow');
    const resInflationVal = document.getElementById('swpResInflationImpact');

    if (isSwpInflation) {
        if (finalBalanceLabel) finalBalanceLabel.innerHTML = `<span class="dot green"></span> Total Real Value`;
        if (donutLabel) donutLabel.innerText = "Total Real Value";
        if (resFinalBalanceBottom) resFinalBalanceBottom.innerText = fmt(realFinalBalance);
        if (resFinalBalanceTop) resFinalBalanceTop.innerText = fmt(realFinalBalance);

        if (resInflationRow) resInflationRow.style.display = 'flex';
        if (resInflationVal) resInflationVal.innerText = fmt(inflationImpact);
    } else {
        if (finalBalanceLabel) finalBalanceLabel.innerHTML = `<span class="dot green"></span> Expected Final Balance`;
        if (donutLabel) donutLabel.innerText = "Expected Final Balance";
        if (resFinalBalanceBottom) resFinalBalanceBottom.innerText = fmt(balance);
        if (resFinalBalanceTop) resFinalBalanceTop.innerText = fmt(balance);

        if (resInflationRow) resInflationRow.style.display = 'none';
    }

    // 7. Update Donut Chart
    if (donut) {
        let total = totalWithdrawn + balance;
        if (total === 0) total = 1;

        if (isSwpInflation) {
            let withdrawnPct = (totalWithdrawn / total) * 100;
            let realBalancePct = (realFinalBalance / total) * 100;
            let impactPct = (inflationImpact / total) * 100;

            let deg1 = (realBalancePct / 100) * 360;
            let deg2 = deg1 + (impactPct / 100) * 360;

            donut.style.background = `conic-gradient(
                #00B37E 0deg ${deg1}deg, 
                #F97316 ${deg1}deg ${deg2}deg, 
                #9CA3AF ${deg2}deg 360deg
            )`;
        } else {
            let balancePct = (balance / total) * 100;
            let deg = (balancePct / 100) * 360;
            donut.style.background = `conic-gradient(#00B37E 0deg ${deg}deg, #9CA3AF ${deg}deg 360deg)`;
        }
    }

    // 8. Update Comparison Bar Chart
    updateSwpBarChart(balance, totalWithdrawn, realFinalBalance);
};

// Secondary Bar Chart
function updateSwpBarChart(nominalBalance, totalWithdrawn, realFinalBalance) {
    const chart = document.getElementById('swpComparisonChart');
    if (!chart) return;

    chart.innerHTML = '';

    if (isSwpInflation) {
        chart.style.display = 'flex';
        let max = Math.max(nominalBalance, realFinalBalance);
        if (max === 0) max = 1;

        const hNom = (nominalBalance / max) * 100;
        const hReal = (realFinalBalance / max) * 100;

        chart.innerHTML = `
            <div class="bar-column">
                <div class="bar-value">${shortFmt(nominalBalance)}</div>
                <div class="bar" style="height: ${hNom}%; background: #00B37E;"></div>
                <span class="bar-label">Nominal</span>
            </div>
            <div class="bar-column">
                <div class="bar-value">${shortFmt(realFinalBalance)}</div>
                <div class="bar" style="height: ${hReal}%; background: #60A5FA;"></div>
                <span class="bar-label">Real Value</span>
            </div>
        `;
    } else if (isSwpStepUp) {
        let fixedSim = simulateSwp(swpInvestment, swpWithdrawal, swpRate, swpYears, 0);
        chart.style.display = 'flex';

        let max = Math.max(fixedSim.totalWithdrawn, totalWithdrawn);
        if (max === 0) max = 1;

        const hFixed = (fixedSim.totalWithdrawn / max) * 100;
        const hStep = (totalWithdrawn / max) * 100;

        chart.innerHTML = `
            <div class="bar-column">
                <div class="bar-value">${shortFmt(fixedSim.totalWithdrawn)}</div>
                <div class="bar" style="height: ${hFixed}%; background: #9CA3AF;"></div>
                <span class="bar-label">Fixed W/D</span>
            </div>
            <div class="bar-column">
                <div class="bar-value">${shortFmt(totalWithdrawn)}</div>
                <div class="bar" style="height: ${hStep}%; background: #00B37E;"></div>
                <span class="bar-label">Step-up W/D</span>
            </div>
        `;
    } else {
        chart.style.display = 'none';
    }
}

// Super Advance Goal Seek Engine
function calculateSwpSuperAdvance() {
    let hvGoal = swpAdvGoal > 50000000;
    let hvWithdrawal = swpAdvWithdrawal > 3000000;
    let hvSavings = swpAdvSavings > 10000000;

    if (hvGoal || hvWithdrawal || hvSavings) {
        updateSwpSuperAdvanceUI(null, true);
        return;
    }

    let months = swpAdvTime * 12;
    let monthlyRate = swpAdvReturn / 1200;

    function simulateCashflow(startingSip) {
        let balance = swpAdvSavings;
        let currentSip = startingSip;
        let currentWithdrawal = swpAdvWithdrawal;

        let totalInvested = swpAdvSavings;
        let totalWithdrawn = 0;

        for (let m = 1; m <= months; m++) {
            balance += currentSip;
            totalInvested += currentSip;
            balance += (balance * monthlyRate);

            if (m % 12 === 0) {
                if (balance >= currentWithdrawal) {
                    balance -= currentWithdrawal;
                    totalWithdrawn += currentWithdrawal;
                } else {
                    totalWithdrawn += balance;
                    balance = 0;
                }

                let infRate = isSwpAdvInflation ? swpAdvInflation : 0;
                let stepRate = isSwpAdvStepUpSwp ? swpAdvStepUpSwp : 0;
                let swpGrowth = (((1 + (stepRate / 100)) * (1 + (infRate / 100))) - 1);

                currentWithdrawal = currentWithdrawal * (1 + swpGrowth);

                if (isSwpAdvStepUpSip) {
                    currentSip = currentSip * (1 + (swpAdvStepUpSip / 100));
                }
            }
        }
        return { finalBalance: balance, totalInvested, totalWithdrawn, startingSip };
    }

    let targetGoal = swpAdvGoal;
    if (isSwpAdvInflation) {
        let inflationFactor = Math.pow(1 + (swpAdvInflation / 100), swpAdvTime);
        targetGoal = swpAdvGoal * inflationFactor;
    }

    let low = 0;
    let high = targetGoal * 2;
    if (simulateCashflow(high).finalBalance < targetGoal) {
        high = targetGoal * 10;
    }

    let requiredSip = 0;
    let bestResult = null;
    let tolerance = 1;
    let iterations = 0;
    let maxIterations = 100;

    let zeroSipResult = simulateCashflow(0);
    if (zeroSipResult.finalBalance >= targetGoal) {
        bestResult = zeroSipResult;
        requiredSip = 0;
    } else {
        while (low <= high && iterations < maxIterations) {
            let mid = (low + high) / 2;
            let result = simulateCashflow(mid);
            bestResult = result;

            if (Math.abs(result.finalBalance - targetGoal) <= tolerance) {
                requiredSip = mid;
                break;
            } else if (result.finalBalance < targetGoal) {
                low = mid + 1;
            } else {
                high = mid - 1;
                requiredSip = mid;
            }
            iterations++;
        }
    }

    requiredSip = Math.ceil(requiredSip);
    if (bestResult) {
        bestResult = simulateCashflow(requiredSip);
    }

    updateSwpSuperAdvanceUI({
        requiredSip: requiredSip,
        totalInvested: bestResult ? bestResult.totalInvested : 0,
        totalWithdrawn: bestResult ? bestResult.totalWithdrawn : 0,
        finalCorpus: bestResult ? bestResult.finalBalance : 0,
        targetGoal: targetGoal
    }, false);
}

function updateSwpSuperAdvanceUI(data, isHv) {
    const normalState = document.getElementById('swpNormalState');
    const advanceState = document.getElementById('swpSuperAdvanceState');
    const hvForm = document.getElementById('swpHighValueForm');
    const factCard = document.getElementById('swpFactCard');

    const resRequiredSip = document.getElementById('resSwpAdvRequiredSip');
    const resTotalInvested = document.getElementById('resSwpAdvTotalInvested');
    const resTotalWithdrawn = document.getElementById('resSwpAdvTotalWithdrawn');
    const resFinalCorpus = document.getElementById('resSwpAdvFinalCorpus');
    const resSummaryText = document.getElementById('resSwpAdvSummaryText');

    const hvTitle = document.getElementById('swpHvTitle');
    const hvMsg = document.getElementById('swpHvMsg');
    const hvIcon = document.getElementById('swpHvIcon');
    const hvService = document.getElementById('swpHvService');

    if (normalState) normalState.style.display = 'none';
    if (advanceState) advanceState.style.display = 'none';
    if (hvForm) hvForm.style.display = 'none';
    if (factCard) factCard.style.display = 'flex';

    if (isHv) {
        if (hvForm) {
            hvForm.style.display = 'block';
            if (factCard) factCard.style.display = 'none';

            if (hvTitle) hvTitle.innerText = "High Value Goal Seek 🚀";
            if (hvMsg) hvMsg.innerText = "Achieving aggressive targets with complex cashflows requires personalized portfolio modeling. Connect with our financial experts for a bespoke strategy.";
            if (hvIcon) {
                hvIcon.innerText = "🎯";
                hvIcon.style.background = "#EFF6FF";
                hvIcon.style.color = "#3B82F6";
            }
            if (hvService) hvService.value = "Advanced SWP & Goal Planning";
        }
    } else if (data) {
        if (advanceState) advanceState.style.display = 'block';
        if (resRequiredSip) resRequiredSip.innerText = fmt(data.requiredSip);
        if (resTotalInvested) resTotalInvested.innerText = fmt(data.totalInvested);
        if (resTotalWithdrawn) resTotalWithdrawn.innerText = fmt(data.totalWithdrawn);
        if (resFinalCorpus) resFinalCorpus.innerText = Math.round(data.finalCorpus) < Math.round(data.targetGoal) ? "Goal Shortfall" : fmt(data.finalCorpus);

        if (resSummaryText) {
            resSummaryText.innerHTML = `Starting with <strong>${fmt(swpAdvSavings)}</strong> today, and investing a monthly SIP of <strong>${fmt(data.requiredSip)}</strong> (growing every year by ${isSwpAdvStepUpSip ? swpAdvStepUpSip : 0}%), you will be able to withdraw a starting annual amount of <strong>${fmt(swpAdvWithdrawal)}</strong> while still reaching your final target of <strong>${fmt(data.targetGoal)}</strong> after ${swpAdvTime} years.`;
        }
    }
}

function simulateSwp(inv, wd, rate, years, stepUp) {
    let bal = inv;
    let totWd = 0;
    let months = years * 12;
    let r = rate / 1200;
    let curWd = wd;

    for (let m = 1; m <= months; m++) {
        bal += bal * r;
        if (bal >= curWd) {
            bal -= curWd;
            totWd += curWd;
        } else {
            totWd += bal;
            bal = 0;
            break;
        }
        if (stepUp > 0 && m % 12 === 0) curWd *= (1 + stepUp / 100);
    }
    return { balance: bal, totalWithdrawn: totWd };
}

// Global FAQ Accordion Toggle
window.toggleFaq = function(el) {
    const item = el.closest('.faq-item');
    if (!item) return;
    const isActive = item.classList.contains('active');
    
    // Close other FAQs
    document.querySelectorAll('.faq-item').forEach(f => {
        if (f !== item) f.classList.remove('active');
    });

    item.classList.toggle('active', !isActive);
};

// --- DOM Event Listeners & Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Normal SWP Controls
    const iInv = document.getElementById('swpInputInvestment');
    const rInv = document.getElementById('swpRangeInvestment');
    const iWd = document.getElementById('swpInputWithdrawal');
    const rWd = document.getElementById('swpRangeWithdrawal');
    const iRate = document.getElementById('swpInputRate');
    const rRate = document.getElementById('swpRangeRate');
    const iYears = document.getElementById('swpInputYears');
    const rYears = document.getElementById('swpRangeYears');

    // Advanced Normal Settings
    const cStep = document.getElementById('swpCheckStepUp');
    const divStep = document.getElementById('swpStepUpControl');
    const iStep = document.getElementById('swpInputStepUp');
    const rStep = document.getElementById('swpRangeStepUp');

    const cInf = document.getElementById('swpCheckInflation');
    const divInf = document.getElementById('swpInflationControl');
    const iInf = document.getElementById('swpInputInflation');
    const rInf = document.getElementById('swpRangeInflation');

    if (iInv && rInv) {
        iInv.addEventListener('input', (e) => { swpInvestment = parseFloat(e.target.value) || 0; rInv.value = swpInvestment; calculateSWP(); });
        rInv.addEventListener('input', (e) => { swpInvestment = parseFloat(e.target.value) || 0; iInv.value = swpInvestment; calculateSWP(); });
    }
    if (iWd && rWd) {
        iWd.addEventListener('input', (e) => { swpWithdrawal = parseFloat(e.target.value) || 0; rWd.value = swpWithdrawal; calculateSWP(); });
        rWd.addEventListener('input', (e) => { swpWithdrawal = parseFloat(e.target.value) || 0; iWd.value = swpWithdrawal; calculateSWP(); });
    }
    if (iRate && rRate) {
        iRate.addEventListener('input', (e) => { swpRate = parseFloat(e.target.value) || 0; rRate.value = swpRate; calculateSWP(); });
        rRate.addEventListener('input', (e) => { swpRate = parseFloat(e.target.value) || 0; iRate.value = swpRate; calculateSWP(); });
    }
    if (iYears && rYears) {
        iYears.addEventListener('input', (e) => { swpYears = parseFloat(e.target.value) || 0; rYears.value = swpYears; calculateSWP(); });
        rYears.addEventListener('input', (e) => { swpYears = parseFloat(e.target.value) || 0; iYears.value = swpYears; calculateSWP(); });
    }
    if (iStep && rStep) {
        iStep.addEventListener('input', (e) => { swpStepUp = parseFloat(e.target.value) || 0; rStep.value = swpStepUp; calculateSWP(); });
        rStep.addEventListener('input', (e) => { swpStepUp = parseFloat(e.target.value) || 0; iStep.value = swpStepUp; calculateSWP(); });
    }
    if (iInf && rInf) {
        iInf.addEventListener('input', (e) => { swpInflation = parseFloat(e.target.value) || 0; rInf.value = swpInflation; calculateSWP(); });
        rInf.addEventListener('input', (e) => { swpInflation = parseFloat(e.target.value) || 0; iInf.value = swpInflation; calculateSWP(); });
    }

    if (cStep) {
        cStep.addEventListener('change', (e) => {
            isSwpStepUp = e.target.checked;
            if (divStep) divStep.style.display = isSwpStepUp ? 'block' : 'none';
            calculateSWP();
        });
    }

    if (cInf) {
        cInf.addEventListener('change', (e) => {
            isSwpInflation = e.target.checked;
            if (divInf) divInf.style.display = isSwpInflation ? 'block' : 'none';
            calculateSWP();
        });
    }

    // Super Advance Controls
    const iAdvTime = document.getElementById('swpAdvInputTime');
    const rAdvTime = document.getElementById('swpAdvRangeTime');
    const iAdvGoal = document.getElementById('swpAdvInputGoal');
    const rAdvGoal = document.getElementById('swpAdvRangeGoal');
    const iAdvWith = document.getElementById('swpAdvInputWithdrawal');
    const rAdvWith = document.getElementById('swpAdvRangeWithdrawal');
    const iAdvSav = document.getElementById('swpAdvInputSavings');
    const rAdvSav = document.getElementById('swpAdvRangeSavings');
    const iAdvRet = document.getElementById('swpAdvInputReturn');
    const rAdvRet = document.getElementById('swpAdvRangeReturn');

    if (iAdvTime && rAdvTime) {
        iAdvTime.addEventListener('input', (e) => { swpAdvTime = parseFloat(e.target.value) || 0; rAdvTime.value = swpAdvTime; calculateSWP(); });
        rAdvTime.addEventListener('input', (e) => { swpAdvTime = parseFloat(e.target.value) || 0; iAdvTime.value = swpAdvTime; calculateSWP(); });
    }
    if (iAdvGoal && rAdvGoal) {
        iAdvGoal.addEventListener('input', (e) => { swpAdvGoal = parseFloat(e.target.value) || 0; rAdvGoal.value = swpAdvGoal; calculateSWP(); });
        rAdvGoal.addEventListener('input', (e) => { swpAdvGoal = parseFloat(e.target.value) || 0; iAdvGoal.value = swpAdvGoal; calculateSWP(); });
    }
    if (iAdvWith && rAdvWith) {
        iAdvWith.addEventListener('input', (e) => { swpAdvWithdrawal = parseFloat(e.target.value) || 0; rAdvWith.value = swpAdvWithdrawal; calculateSWP(); });
        rAdvWith.addEventListener('input', (e) => { swpAdvWithdrawal = parseFloat(e.target.value) || 0; iAdvWith.value = swpAdvWithdrawal; calculateSWP(); });
    }
    if (iAdvSav && rAdvSav) {
        iAdvSav.addEventListener('input', (e) => { swpAdvSavings = parseFloat(e.target.value) || 0; rAdvSav.value = swpAdvSavings; calculateSWP(); });
        rAdvSav.addEventListener('input', (e) => { swpAdvSavings = parseFloat(e.target.value) || 0; iAdvSav.value = swpAdvSavings; calculateSWP(); });
    }
    if (iAdvRet && rAdvRet) {
        iAdvRet.addEventListener('input', (e) => { swpAdvReturn = parseFloat(e.target.value) || 0; rAdvRet.value = swpAdvReturn; calculateSWP(); });
        rAdvRet.addEventListener('input', (e) => { swpAdvReturn = parseFloat(e.target.value) || 0; iAdvRet.value = swpAdvReturn; calculateSWP(); });
    }

    // Super Advance Toggles
    const cAdvInf = document.getElementById('swpAdvCheckInflation');
    const dAdvInf = document.getElementById('swpAdvInflationControl');
    const iAdvInf = document.getElementById('swpAdvInputInflation');
    const rAdvInf = document.getElementById('swpAdvRangeInflation');
    if (cAdvInf) { cAdvInf.addEventListener('change', (e) => { isSwpAdvInflation = e.target.checked; if (dAdvInf) dAdvInf.style.display = isSwpAdvInflation ? 'block' : 'none'; calculateSWP(); }); }
    if (iAdvInf && rAdvInf) { iAdvInf.addEventListener('input', (e) => { swpAdvInflation = parseFloat(e.target.value) || 0; rAdvInf.value = swpAdvInflation; calculateSWP(); }); rAdvInf.addEventListener('input', (e) => { swpAdvInflation = parseFloat(e.target.value) || 0; iAdvInf.value = swpAdvInflation; calculateSWP(); }); }

    const cAdvStepSip = document.getElementById('swpAdvCheckStepUpSip');
    const dAdvStepSip = document.getElementById('swpAdvStepUpSipControl');
    const iAdvStepSip = document.getElementById('swpAdvInputStepUpSip');
    const rAdvStepSip = document.getElementById('swpAdvRangeStepUpSip');
    if (cAdvStepSip) { cAdvStepSip.addEventListener('change', (e) => { isSwpAdvStepUpSip = e.target.checked; if (dAdvStepSip) dAdvStepSip.style.display = isSwpAdvStepUpSip ? 'block' : 'none'; calculateSWP(); }); }
    if (iAdvStepSip && rAdvStepSip) { iAdvStepSip.addEventListener('input', (e) => { swpAdvStepUpSip = parseFloat(e.target.value) || 0; rAdvStepSip.value = swpAdvStepUpSip; calculateSWP(); }); rAdvStepSip.addEventListener('input', (e) => { swpAdvStepUpSip = parseFloat(e.target.value) || 0; iAdvStepSip.value = swpAdvStepUpSip; calculateSWP(); }); }

    const cAdvStepSwp = document.getElementById('swpAdvCheckStepUpSwp');
    const dAdvStepSwp = document.getElementById('swpAdvStepUpSwpControl');
    const iAdvStepSwp = document.getElementById('swpAdvInputStepUpSwp');
    const rAdvStepSwp = document.getElementById('swpAdvRangeStepUpSwp');
    if (cAdvStepSwp) { cAdvStepSwp.addEventListener('change', (e) => { isSwpAdvStepUpSwp = e.target.checked; if (dAdvStepSwp) dAdvStepSwp.style.display = isSwpAdvStepUpSwp ? 'block' : 'none'; calculateSWP(); }); }
    if (iAdvStepSwp && rAdvStepSwp) { iAdvStepSwp.addEventListener('input', (e) => { swpAdvStepUpSwp = parseFloat(e.target.value) || 0; rAdvStepSwp.value = swpAdvStepUpSwp; calculateSWP(); }); rAdvStepSwp.addEventListener('input', (e) => { swpAdvStepUpSwp = parseFloat(e.target.value) || 0; iAdvStepSwp.value = swpAdvStepUpSwp; calculateSWP(); }); }

    // High-value Consultation Form Validation
    const swpHvPrivacy = document.getElementById('swpHvPrivacy');
    const btnSwpHvSubmit = document.getElementById('btnSwpHvSubmit');
    if (swpHvPrivacy && btnSwpHvSubmit) {
        swpHvPrivacy.addEventListener('change', (e) => {
            btnSwpHvSubmit.disabled = !e.target.checked;
            btnSwpHvSubmit.style.opacity = e.target.checked ? '1' : '0.6';
            btnSwpHvSubmit.style.cursor = e.target.checked ? 'pointer' : 'not-allowed';
        });
    }

    if (btnSwpHvSubmit) {
        btnSwpHvSubmit.addEventListener('click', (e) => {
            e.preventDefault();
            const name = document.getElementById('swpHvName').value.trim();
            const email = document.getElementById('swpHvEmail').value.trim();
            const mobile = document.getElementById('swpHvMobile').value.trim();
            const desc = document.getElementById('swpHvDesc').value.trim();
            const successDiv = document.getElementById('swpHvSuccess');

            if (!name || !email || !mobile) {
                alert('Please fill in your Name, Email, and Mobile number.');
                return;
            }

            btnSwpHvSubmit.disabled = true;
            btnSwpHvSubmit.innerText = 'Submitting...';

            if (typeof emailjs !== 'undefined') {
                emailjs.send('service_4hy5p1m', 'template_5qrv9f3', {
                    user_name: name,
                    user_email: email,
                    user_phone: mobile,
                    service_type: 'Priority SWP Wealth Advisory',
                    message: desc || 'Consultation request from dedicated SWP calculator page'
                }).then(() => {
                    btnSwpHvSubmit.style.display = 'none';
                    if (successDiv) successDiv.style.display = 'flex';
                }).catch(() => {
                    btnSwpHvSubmit.disabled = false;
                    btnSwpHvSubmit.innerText = 'Submit Request';
                    if (successDiv) {
                        successDiv.style.display = 'block';
                        successDiv.style.color = '#059669';
                        successDiv.innerText = '✅ Consultation request noted. Our senior wealth advisors will reach out!';
                    }
                });
            } else {
                btnSwpHvSubmit.style.display = 'none';
                if (successDiv) successDiv.style.display = 'flex';
            }
        });
    }

    // Mobile Hamburger Menu
    const hamburger = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
        document.addEventListener('click', (event) => {
            if (!navLinks.contains(event.target) && !hamburger.contains(event.target) && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
            }
        });
    }

    // Tools Dropdown on Mobile
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        const toggleLink = dropdown.querySelector('.nav-link-tools');
        if (toggleLink) {
            toggleLink.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    dropdown.classList.toggle('active');
                }
            });
        }
    });

    // Footer Dropdown Mobile Logic
    const footerDropdowns = document.querySelectorAll('.footer-dropdown');
    footerDropdowns.forEach(dropdown => {
        const toggleSpan = dropdown.querySelector('span');
        if (toggleSpan) {
            toggleSpan.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    dropdown.classList.toggle('active');
                }
            });
        }
    });

    // Close footer dropdowns when clicking outside
    document.addEventListener('click', (event) => {
        footerDropdowns.forEach(dropdown => {
            if (!dropdown.contains(event.target)) {
                dropdown.classList.remove('active');
            }
        });
    });

    // Auto-Rotating Tools Carousel (1.5s interval identical to SIP calculator)
    initToolsCarousel();

    // Randomize initial fact
    displayRandomSwpFact();

    // Initial Calculation
    calculateSWP();
});

// Auto-Rotating Infinite Tools Carousel (1.5s Interval)
function initToolsCarousel() {
    const track = document.getElementById('toolsCarouselTrack');
    if (!track) return;

    let autoScrollInterval = null;
    const scrollDelay = 1500; // 1.5 seconds

    function stepNext() {
        const firstCard = track.querySelector('.carousel-card');
        const cardWidth = firstCard ? (firstCard.offsetWidth + 20) : 300;
        const maxScroll = track.scrollWidth - track.clientWidth;

        if (track.scrollLeft >= maxScroll - 5) {
            track.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
            track.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
    }

    function startTimer() {
        if (!autoScrollInterval) {
            autoScrollInterval = setInterval(stepNext, scrollDelay);
        }
    }

    function stopTimer() {
        if (autoScrollInterval) {
            clearInterval(autoScrollInterval);
            autoScrollInterval = null;
        }
    }

    startTimer();

    track.addEventListener('mouseenter', stopTimer);
    track.addEventListener('mouseleave', startTimer);
    track.addEventListener('touchstart', stopTimer, { passive: true });
    track.addEventListener('touchend', startTimer, { passive: true });
}

// Global Send Dashboard Report for SWP Page
window.sendDashboardReport = function(calcTypeRaw) {
    const idPrefix = 'SWP';
    const btn = document.getElementById(`lcBtn-${idPrefix}`);
    const feedback = document.getElementById(`lcSuccess-${idPrefix}`);

    const nameInput = document.getElementById(`lcName-${idPrefix}`);
    const emailInput = document.getElementById(`lcEmail-${idPrefix}`);
    const phoneInput = document.getElementById(`lcPhone-${idPrefix}`);

    if (!btn) return;

    const toggleError = (inputEl, isInvalid) => {
        if (!inputEl) return;
        const errSpan = inputEl.nextElementSibling;
        if (isInvalid) {
            inputEl.style.borderColor = '#dc2626';
            if (errSpan && errSpan.classList.contains('lc-error')) errSpan.style.display = 'block';
        } else {
            inputEl.style.borderColor = '#e2e8f0';
            if (errSpan && errSpan.classList.contains('lc-error')) errSpan.style.display = 'none';
        }
    };

    const userName = nameInput ? nameInput.value.trim() : "";
    const userEmail = emailInput ? emailInput.value.trim() : "";
    const userPhone = phoneInput ? phoneInput.value.trim() : "";

    let hasError = false;
    if (!userName) { hasError = true; toggleError(nameInput, true); } else { toggleError(nameInput, false); }
    if (!userEmail || !userEmail.includes('@')) { hasError = true; toggleError(emailInput, true); } else { toggleError(emailInput, false); }
    if (phoneInput && userPhone.length > 0 && userPhone.length < 10) { hasError = true; toggleError(phoneInput, true); } else { toggleError(phoneInput, false); }

    if (hasError) {
        if (feedback) {
            feedback.style.display = 'block';
            feedback.style.color = '#dc2626';
            feedback.innerText = "Please fill all required fields correctly.";
        }
        return;
    }

    btn.disabled = true;
    btn.innerHTML = "⏳ Sending...";
    if (feedback) feedback.style.display = 'none';

    let calculatorData = {
        user_name: userName || userEmail.split('@')[0],
        user_email: userEmail,
        user_phone: userPhone,
        calculator_name: isSwpSuperAdvance ? "Advanced SWP & Goal Seek 💎" : "SWP Wisdom 💎",
        website_url: window.location.href,
        return_url: window.location.href,
        label_1: "", val_1: "0",
        label_2: "", val_2: "0",
        label_3: "", val_3: "0",
        inputs_summary: "",
        advisor_fix: "",
        advisor_display: "none",
        inputs_display: "none"
    };

    const safeGet = (id, prop = 'innerText') => {
        const el = document.getElementById(id);
        return el ? el[prop] || "" : "";
    };

    if (isSwpSuperAdvance) {
        calculatorData.label_1 = "Monthly SIP Needed";
        calculatorData.val_1 = "₹" + safeGet('resSwpAdvRequiredSip').replace(/[^0-9,]+/g, '');
        calculatorData.label_2 = "Protected SWP Corpus";
        calculatorData.val_2 = "₹" + safeGet('resSwpAdvFinalCorpus').replace(/[^0-9,]+/g, '');
        calculatorData.label_3 = "Total Amount Withdrawn";
        calculatorData.val_3 = "₹" + safeGet('resSwpAdvTotalWithdrawn').replace(/[^0-9,]+/g, '');

        let res = "<strong>SWP Super Advance Summary:</strong><br>";
        res += `<strong>Total Amount Invested:</strong> ₹${safeGet('resSwpAdvTotalInvested')}<br>`;
        const advice = safeGet('resSwpAdvSummaryText');
        if (advice) res += `<br><em>Plan Summary: ${advice}</em>`;
        calculatorData.advisor_fix = res;

        calculatorData.inputs_summary = `Target Goal: ₹${swpAdvGoal.toLocaleString('en-IN')} | Horizon: ${swpAdvTime} Yrs | Return: ${swpAdvReturn}% | Annual SWP: ₹${swpAdvWithdrawal.toLocaleString('en-IN')}`;
    } else {
        calculatorData.label_1 = "Total Withdrawals";
        calculatorData.val_1 = "₹" + safeGet('swpResTotalWithdrawal').replace(/[^0-9,]+/g, '');
        calculatorData.label_2 = "Returns Earned";
        calculatorData.val_2 = "₹" + safeGet('swpResReturnsEarned').replace(/[^0-9,]+/g, '');
        calculatorData.label_3 = "Final Balance";
        calculatorData.val_3 = "₹" + safeGet('swpResFinalBalanceBottom').replace(/[^0-9,]+/g, '');

        let res = "<strong>SWP Projection Summary:</strong><br>";
        if (isSwpInflation) {
            res += `<strong>Inflation Adjusted Real Balance:</strong> ₹${safeGet('swpResFinalBalanceBottom')}<br>`;
            res += `<strong>Inflation Impact:</strong> ₹${safeGet('swpResInflationImpact')}<br>`;
        }
        calculatorData.advisor_fix = res;

        calculatorData.inputs_summary = `Initial Corpus: ₹${swpInvestment.toLocaleString('en-IN')} | Monthly SWP: ₹${swpWithdrawal.toLocaleString('en-IN')} | Horizon: ${swpYears} Yrs | Return: ${swpRate}%${isSwpStepUp ? ' | Step-up: ' + swpStepUp + '%' : ''}${isSwpInflation ? ' | Inflation: ' + swpInflation + '%' : ''}`;
    }

    if (typeof emailjs !== 'undefined') {
        emailjs.send('service_4hy5p1m', 'template_5qrv9f3', calculatorData)
            .then(() => {
                btn.disabled = false;
                btn.innerHTML = "Send My Report Now";
                if (feedback) {
                    feedback.style.display = 'block';
                    feedback.style.color = '#059669';
                    feedback.innerHTML = "✅ Report sent successfully! Check your inbox.";
                }
            })
            .catch(() => {
                btn.disabled = false;
                btn.innerHTML = "Send My Report Now";
                if (feedback) {
                    feedback.style.display = 'block';
                    feedback.style.color = '#059669';
                    feedback.innerHTML = "✅ Report request noted! Check your inbox shortly.";
                }
            });
    } else {
        btn.disabled = false;
        btn.innerHTML = "Send My Report Now";
        if (feedback) {
            feedback.style.display = 'block';
            feedback.style.color = '#059669';
            feedback.innerHTML = "✅ Report request noted! Check your inbox shortly.";
        }
    }
};

// Global Policy Modals
window.openPrivacyModal = function () {
    const modal = document.getElementById('privacyModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
};

window.closePrivacyModal = function () {
    const modal = document.getElementById('privacyModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

window.openTermsModal = function () {
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
};

window.closeTermsModal = function () {
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

window.openConnectModal = function () {
    window.location.href = 'connect_us.html';
};

window.openPartnerModal = function () {
    window.location.href = 'connect_us.html#partner';
};

// Backdrop click listeners
document.addEventListener('DOMContentLoaded', () => {
    ['privacyModal', 'termsModal'].forEach(id => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            });
        }
    });
});

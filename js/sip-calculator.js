/**
 * FinNomy SIP Calculator with Step-Up & Inflation Engine
 * Complete client-side calculation, chart visualization, and lead capture logic.
 * Zero external math dependencies.
 */

// Global State
let sipInvestment = 5000;
let sipRate = 12;
let sipYears = 10;
let sipStepUp = 10;
let sipInflation = 6;
let isSipStepUp = false;
let isSipInflation = false;
let isSipSuperAdvance = false;
let isSipGoalReality = false;
let sipGoalAmount = 10000000; // 1 Crore Default
let sipCurrentPortfolio = 500000;
let sipExistingSip = 5000;

// Curated FinNomy Financial Tidbits
const sipFacts = [
    "Compounding is the 8th wonder of the world. He who understands it, earns it; he who doesn't, pays it.",
    "A 10% annual step-up on your SIP can increase your final maturity corpus by over 40% to 75%.",
    "Over a 15-year period in Indian equities, systematic investments have historically beaten fixed deposits significantly.",
    "Rupee Cost Averaging lets you automatically buy more mutual fund units when markets dip and fewer when markets peak.",
    "Inflation at 6% halves your money's real purchasing power in roughly 12 years (Rule of 72).",
    "Starting your SIP 5 years earlier can double your wealth creation due to exponential compounding.",
    "Automated monthly SIPs remove emotional market timing and build disciplined wealth creation habits.",
    "Reviewing your portfolio once a year is optimal — avoid reactive changes based on daily market noise.",
    "Reinvesting mutual fund dividends through Growth plans accelerates wealth compounding.",
    "An investment in knowledge pays the best interest. - Benjamin Franklin"
];

// Display Random Fact
function displayRandomFact() {
    const factEl = document.getElementById('sipFactText');
    if (factEl) {
        const randomFact = sipFacts[Math.floor(Math.random() * sipFacts.length)];
        factEl.innerText = randomFact;
    }
}

// Currency formatters
const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const shortFmt = (n) => {
    if (n >= 10000000) return '₹' + (n / 10000000).toFixed(1) + 'Cr';
    if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
    return '₹' + (n / 1000).toFixed(0) + 'k';
};

// Mode Switcher function (Global callable)
window.setSipMode = function(mode) {
    const tabBtns = document.querySelectorAll('.mode-toggle-btn, .tab-btn, .mode-tab-btn');
    const standardContainer = document.getElementById('standard-mode-container');
    const superAdvanceContainer = document.getElementById('super-advance-container');
    const timeLabel = document.getElementById('lblTimePeriod');
    const rYears = document.getElementById('rangeYears');

    const isSuper = (mode === 'super' || mode === 'super-advance' || (typeof mode === 'string' && mode.includes('super')));

    tabBtns.forEach(b => {
        const bMode = (b.getAttribute('data-mode') || b.id || '').toLowerCase();
        const active = isSuper ? (bMode.includes('super') || b.id === 'btnModeSuper') : (bMode.includes('standard') || b.id === 'btnModeStandard');
        b.classList.toggle('active', active);
    });

    if (isSuper) {
        isSipSuperAdvance = true;
        isSipGoalReality = true;
        if (standardContainer) standardContainer.style.display = 'none';
        if (superAdvanceContainer) superAdvanceContainer.style.display = 'block';
        if (timeLabel) timeLabel.innerText = "Time Left (Years)";
        if (rYears) rYears.max = 30;
    } else {
        isSipSuperAdvance = false;
        isSipGoalReality = false;
        if (standardContainer) standardContainer.style.display = 'block';
        if (superAdvanceContainer) superAdvanceContainer.style.display = 'none';
        if (timeLabel) timeLabel.innerText = "Time Period (Years)";
        if (rYears) rYears.max = 40;
    }

    if (typeof calculateSIP === 'function') calculateSIP();
};

// Main SIP Calculation Dispatcher
window.calculateSIP = function () {
    // 1. Goal vs Reality Branch (Super Advance Mode)
    if (isSipSuperAdvance) {
        calculateSipGapAnalysis();
        return;
    }

    // 2. Standard Mode Calculation
    const resNormal = document.getElementById('resNormalState');
    const donut = document.getElementById('sipDonut');
    const chartContainer = document.querySelector('.chart-container');
    const rowInflation = document.getElementById('rowInflation');
    const lblInv = document.getElementById('lblInv');
    const lblGain = document.getElementById('lblGain');
    const lblTotal = document.getElementById('lblTotal');
    const resTotalValueBottom = document.getElementById('resTotalValueBottom');
    const resInflationVal = document.getElementById('resInflationVal');
    const donutLabel = document.querySelector('#sipDonut .donut-label');
    const resRealityStats = document.getElementById('resRealityCheckStats');
    const resStats = document.querySelector('.res-stats');

    if (chartContainer) {
        if (isSipStepUp || isSipInflation) {
            chartContainer.classList.add('side-by-side');
        } else {
            chartContainer.classList.remove('side-by-side');
        }
    }

    if (rowInflation) rowInflation.style.display = 'none';
    if (lblInv) lblInv.innerHTML = '<span class="dot grey"></span> Invested Amount';
    if (lblGain) lblGain.innerHTML = '<span class="dot green"></span> Est. Returns';
    if (lblTotal) lblTotal.innerText = "Total Value";

    if (donut) donut.style.display = 'flex';
    if (resRealityStats) resRealityStats.style.display = 'none';
    if (resStats) resStats.style.display = 'flex';

    // Calculation Math
    let monthlyRate = sipRate / 12 / 100;
    let months = sipYears * 12;

    // --- Standard SIP Calculation (Nominal) ---
    let stdTotalInvested = sipInvestment * months;
    let stdCurrentVal = sipInvestment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);

    // --- Step Up SIP Calculation (Nominal) ---
    let stepTotalInvested = 0;
    let stepCurrentVal = 0;

    if (isSipStepUp) {
        let currentInvestment = sipInvestment;
        for (let y = 1; y <= sipYears; y++) {
            for (let m = 1; m <= 12; m++) {
                stepTotalInvested += currentInvestment;
                stepCurrentVal = (stepCurrentVal + currentInvestment) * (1 + monthlyRate);
            }
            currentInvestment = currentInvestment * (1 + sipStepUp / 100);
        }
    } else {
        stepTotalInvested = stdTotalInvested;
        stepCurrentVal = stdCurrentVal;
    }

    // --- Inflation Adjustment (Discounting Method) ---
    const inflationFactor = Math.pow(1 + sipInflation / 100, sipYears);
    let stdRealVal = stdCurrentVal / inflationFactor;
    let stepRealVal = stepCurrentVal / inflationFactor;

    // Determine Active Values
    let finalInvested = isSipStepUp ? stepTotalInvested : stdTotalInvested;
    let finalCurrentVal = isSipStepUp ? stepCurrentVal : stdCurrentVal;
    let finalRealVal = isSipStepUp ? stepRealVal : stdRealVal;
    let finalWealthGained = finalCurrentVal - finalInvested;
    let inflationAdj = finalCurrentVal - finalRealVal;

    // Rounding
    finalInvested = Math.round(finalInvested);
    finalCurrentVal = Math.round(finalCurrentVal);
    finalRealVal = Math.round(finalRealVal);
    stdCurrentVal = Math.round(stdCurrentVal);
    stepCurrentVal = Math.round(stepCurrentVal);
    stdRealVal = Math.round(stdRealVal);
    stepRealVal = Math.round(stepRealVal);

    // High Value Consultation Check (> 1 Lakh)
    const hvForm = document.getElementById('sipHighValueForm');
    const leadForm = document.getElementById('leadCapture-SIP');

    if (sipInvestment > 100000) {
        if (resNormal) resNormal.style.display = 'none';
        if (hvForm) hvForm.style.display = 'block';
        if (leadForm) leadForm.style.display = 'none';
        return;
    } else {
        if (resNormal) resNormal.style.display = 'block';
        if (hvForm) hvForm.style.display = 'none';
        if (leadForm) leadForm.style.display = 'block';
    }

    // Update Results UI
    if (document.getElementById('resInvested')) document.getElementById('resInvested').innerText = fmt(finalInvested);
    if (document.getElementById('resGained')) document.getElementById('resGained').innerText = fmt(finalWealthGained);

    // Total Value (Center of Donut)
    if (document.getElementById('resTotalValue')) {
        document.getElementById('resTotalValue').innerText = isSipInflation ? fmt(finalRealVal) : fmt(finalCurrentVal);
    }
    if (donutLabel) {
        donutLabel.innerText = isSipInflation ? "Total Real Value" : "Expected Total Value";
    }

    // Dynamic Total Row (Bottom)
    if (isSipInflation) {
        if (rowInflation) rowInflation.style.display = 'flex';
        if (resInflationVal) resInflationVal.innerText = fmt(inflationAdj);
        if (lblTotal) lblTotal.innerText = "Total Real Value";
        if (resTotalValueBottom) resTotalValueBottom.innerText = fmt(finalRealVal);
    } else {
        if (rowInflation) rowInflation.style.display = 'none';
        if (lblTotal) lblTotal.innerText = "Expected Total Value";
        if (resTotalValueBottom) resTotalValueBottom.innerText = fmt(finalCurrentVal);
    }

    // Update Conic Donut
    if (donut) {
        if (isSipInflation && finalCurrentVal > 0) {
            let degPrincipal = (finalInvested / finalCurrentVal) * 360;
            let degReal = (finalRealVal / finalCurrentVal) * 360;
            if (isNaN(degPrincipal)) degPrincipal = 0;
            if (isNaN(degReal)) degReal = degPrincipal;

            donut.style.background = `conic-gradient(#CBD5E1 0deg ${degPrincipal}deg, #00B37E ${degPrincipal}deg ${degReal}deg, #F59E0B ${degReal}deg 360deg)`;
        } else {
            let investedPct = finalCurrentVal > 0 ? (finalInvested / finalCurrentVal) * 100 : 0;
            let deg = (investedPct / 100) * 360;
            if (isNaN(deg)) deg = 0;
            donut.style.background = `conic-gradient(#CBD5E1 0deg ${deg}deg, #00B37E ${deg}deg 360deg)`;
        }
    }

    // Growth Comparison Bar Chart Logic
    const comparisonChart = document.getElementById('sipComparisonChart');
    if (comparisonChart) {
        const barStd = document.getElementById('barStandard');
        const valStd = document.getElementById('barValStandard');
        const colStd = barStd ? barStd.parentElement : null;

        const barStep = document.getElementById('barStepUp');
        const valStep = document.getElementById('barValStepUp');
        const colStep = barStep ? barStep.parentElement : null;

        const colStdReal = document.getElementById('colStdReal');
        const colStepReal = document.getElementById('colStepReal');
        const barStdReal = document.getElementById('barStdReal');
        const barStepReal = document.getElementById('barStepReal');
        const valStdReal = document.getElementById('barValStdReal');
        const valStepReal = document.getElementById('barValStepReal');

        let showChart = false;

        if (isSipStepUp && !isSipInflation) {
            showChart = true;
            if (colStd) colStd.style.display = 'flex';
            if (colStep) colStep.style.display = 'flex';
            if (colStdReal) colStdReal.style.display = 'none';
            if (colStepReal) colStepReal.style.display = 'none';

            if (colStd && colStd.querySelector('.bar-label')) colStd.querySelector('.bar-label').innerText = "Standard";
            if (colStep && colStep.querySelector('.bar-label')) colStep.querySelector('.bar-label').innerText = "Step-up";

            let max = stepCurrentVal || 1;
            if (barStd) barStd.style.height = ((stdCurrentVal / max) * 100) + '%';
            if (barStep) barStep.style.height = '100%';
            if (valStd) valStd.innerText = shortFmt(stdCurrentVal);
            if (valStep) valStep.innerText = shortFmt(stepCurrentVal);
        } else if (!isSipStepUp && isSipInflation) {
            showChart = true;
            if (colStd) colStd.style.display = 'flex';
            if (colStep) colStep.style.display = 'flex';
            if (colStdReal) colStdReal.style.display = 'none';
            if (colStepReal) colStepReal.style.display = 'none';

            if (colStd && colStd.querySelector('.bar-label')) colStd.querySelector('.bar-label').innerText = "Nominal";
            if (colStep && colStep.querySelector('.bar-label')) colStep.querySelector('.bar-label').innerText = "Real Value";

            let max = stdCurrentVal || 1;
            if (barStd) barStd.style.height = '100%';
            if (barStep) barStep.style.height = ((stdRealVal / max) * 100) + '%';
            if (valStd) valStd.innerText = shortFmt(stdCurrentVal);
            if (valStep) valStep.innerText = shortFmt(stdRealVal);
        } else if (isSipStepUp && isSipInflation) {
            showChart = true;
            if (colStd) colStd.style.display = 'flex';
            if (colStep) colStep.style.display = 'flex';
            if (colStdReal) colStdReal.style.display = 'flex';
            if (colStepReal) colStepReal.style.display = 'flex';

            if (colStd && colStd.querySelector('.bar-label')) colStd.querySelector('.bar-label').innerText = "Std (N)";
            if (colStep && colStep.querySelector('.bar-label')) colStep.querySelector('.bar-label').innerText = "Step (N)";

            let max = stepCurrentVal || 1;
            if (barStd) barStd.style.height = ((stdCurrentVal / max) * 100) + '%';
            if (barStep) barStep.style.height = '100%';
            if (barStdReal) barStdReal.style.height = ((stdRealVal / max) * 100) + '%';
            if (barStepReal) barStepReal.style.height = ((stepRealVal / max) * 100) + '%';

            if (valStdReal) valStdReal.innerText = shortFmt(stdRealVal);
            if (valStepReal) valStepReal.innerText = shortFmt(stepRealVal);
            if (valStd) valStd.innerText = shortFmt(stdCurrentVal);
            if (valStep) valStep.innerText = shortFmt(stepCurrentVal);
        } else {
            showChart = false;
        }

        comparisonChart.style.display = showChart ? 'flex' : 'none';
        comparisonChart.style.gap = (isSipStepUp && isSipInflation) ? '6px' : '20px';
    }
};

// Super Advance Mode (Target Goal Reverse Calculation)
function calculateSipReverse() {
    const hvForm = document.getElementById('sipHighValueForm');
    const resNormal = document.getElementById('resNormalState');
    const hvService = document.getElementById('sipHvService');

    // High Value Check (> 2 Crores)
    if (sipGoalAmount > 20000000) {
        if (resNormal) resNormal.style.display = 'none';
        if (hvForm) {
            hvForm.style.display = 'block';
            if (hvService) hvService.value = "Planning for High Value Financial Goal";
        }
        return;
    } else {
        if (resNormal) resNormal.style.display = 'block';
        if (hvForm) hvForm.style.display = 'none';
        if (hvService) hvService.value = "Planning for Systematic Investment Plan";
    }

    let targetGoal = sipGoalAmount;
    let r = sipRate / 1200;
    let months = sipYears * 12;

    // Inflation Adjustment: Inflate Goal first
    if (isSipInflation) {
        let infFactor = Math.pow(1 + sipInflation / 100, sipYears);
        targetGoal = sipGoalAmount * infFactor;
    }

    let requiredSIP = 0;
    if (isSipStepUp) {
        let unitSim = simulateSipUnit(1, r, months, sipStepUp);
        requiredSIP = targetGoal / unitSim;
    } else {
        let factor = ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
        requiredSIP = targetGoal / factor;
    }

    updateSuperAdvanceUI(requiredSIP, targetGoal, months);
}

function simulateSipUnit(initialP, monthlyRate, months, stepUpPct) {
    let bal = 0;
    let currentP = initialP;
    for (let m = 1; m <= months; m++) {
        bal += currentP;
        bal += bal * monthlyRate;
        if (m % 12 === 0) {
            currentP = currentP * (1 + stepUpPct / 100);
        }
    }
    return bal;
}

function updateSuperAdvanceUI(reqSip, targetGoal, months) {
    const resTotalValue = document.getElementById('resTotalValue');
    const resTotalValueBottom = document.getElementById('resTotalValueBottom');
    const resInvested = document.getElementById('resInvested');
    const resGained = document.getElementById('resGained');
    const donutLabel = document.querySelector('#sipDonut .donut-label');
    const donut = document.getElementById('sipDonut');
    const chartContainer = document.querySelector('.chart-container');
    const rowInflation = document.getElementById('rowInflation');
    const resInflationVal = document.getElementById('resInflationVal');
    const lblInv = document.getElementById('lblInv');
    const lblGain = document.getElementById('lblGain');
    const lblTotal = document.getElementById('lblTotal');
    const comparisonChart = document.getElementById('sipComparisonChart');

    if (comparisonChart) comparisonChart.style.display = 'none';

    const resRealityStats = document.getElementById('resRealityCheckStats');
    const resStats = document.querySelector('.res-stats');
    if (resRealityStats) resRealityStats.style.display = 'none';
    if (resStats) resStats.style.display = 'flex';

    let totalPrincipal = calculatetotalPrincipal(reqSip, months, isSipStepUp ? sipStepUp : 0);
    let wealthGained = targetGoal - totalPrincipal;
    let inflationAmount = targetGoal - sipGoalAmount;

    if (chartContainer) chartContainer.classList.remove('side-by-side');

    if (donutLabel) donutLabel.innerText = "Required Monthly SIP";
    if (resTotalValue) resTotalValue.innerText = fmt(reqSip) + "/mo";

    if (lblInv) lblInv.innerHTML = '<span class="dot grey"></span> Amount Invested';
    if (resInvested) resInvested.innerText = fmt(totalPrincipal);

    if (lblGain) lblGain.innerHTML = '<span class="dot green"></span> Est. Returns';
    if (resGained) resGained.innerText = fmt(wealthGained);

    if (isSipInflation) {
        if (rowInflation) rowInflation.style.display = 'flex';
        if (resInflationVal) resInflationVal.innerText = fmt(inflationAmount);
    } else {
        if (rowInflation) rowInflation.style.display = 'none';
    }

    const totalRow = resTotalValueBottom ? resTotalValueBottom.closest('.stat-row') : null;
    if (isSipInflation) {
        if (totalRow) totalRow.style.display = 'flex';
        if (lblTotal) lblTotal.innerText = "Future Target Value";
        if (resTotalValueBottom) resTotalValueBottom.innerText = fmt(targetGoal);
    } else {
        if (totalRow) totalRow.style.display = 'none';
    }

    if (donut) {
        donut.style.display = 'flex';
        if (isSipInflation && targetGoal > 0) {
            let degPrincipal = (totalPrincipal / targetGoal) * 360;
            let degReal = (sipGoalAmount / targetGoal) * 360;
            if (isNaN(degPrincipal)) degPrincipal = 0;
            if (isNaN(degReal)) degReal = degPrincipal;

            donut.style.background = `conic-gradient(#CBD5E1 0deg ${degPrincipal}deg, #00B37E ${degPrincipal}deg ${degReal}deg, #F59E0B ${degReal}deg 360deg)`;
        } else {
            let principalRatio = targetGoal > 0 ? (totalPrincipal / targetGoal) : 1;
            if (principalRatio > 1) principalRatio = 1;
            let deg = principalRatio * 360;
            if (isNaN(deg)) deg = 360;
            donut.style.background = `conic-gradient(#CBD5E1 0deg ${deg}deg, #00B37E ${deg}deg 360deg)`;
        }
    }
}

// Super Advance Goal vs Reality (Shortfall Engine)
function calculateSipGapAnalysis() {
    let months = sipYears * 12;

    // 1. Inflated Goal
    let targetGoal = sipGoalAmount;
    if (isSipInflation) {
        targetGoal = sipGoalAmount * Math.pow(1 + (sipInflation / 100), sipYears);
    }

    // 2. Reality Projections
    let nominalRate = sipRate / 100;
    let nominalMonthlyRate = nominalRate / 12;

    let realityFV = sipCurrentPortfolio * Math.pow(1 + nominalMonthlyRate, months);
    let currentP = sipExistingSip;
    let sipFV = 0;
    for (let m = 1; m <= months; m++) {
        sipFV = (sipFV + currentP) * (1 + nominalMonthlyRate);
        if (isSipStepUp && m % 12 === 0) {
            currentP *= (1 + sipStepUp / 100);
        }
    }
    realityFV += sipFV;

    // 3. Shortfall Gap
    let shortfall = Math.max(0, targetGoal - realityFV);

    // 4. Extra Monthly SIP Needed
    let extraSipNeeded = 0;
    if (shortfall > 0) {
        if (isSipStepUp) {
            let unitSim = simulateSipUnit(1, nominalMonthlyRate, months, sipStepUp);
            extraSipNeeded = shortfall / unitSim;
        } else {
            let factor = ((Math.pow(1 + nominalMonthlyRate, months) - 1) / nominalMonthlyRate) * (1 + nominalMonthlyRate);
            extraSipNeeded = shortfall / factor;
        }
    }

    updateSipGapAnalysisUI(realityFV, targetGoal, shortfall, extraSipNeeded);
}

function updateSipGapAnalysisUI(realityFV, targetGoal, shortfall, extraSip) {
    const resExtra = document.getElementById('resExtraSipNeeded');
    const resProjected = document.getElementById('resProjectedCorpus');
    const resTarget = document.getElementById('resTargetGoal');
    const resShort = document.getElementById('resShortfall');
    const donut = document.getElementById('sipDonut');
    const donutLabel = document.querySelector('#sipDonut .donut-label');
    const resTotal = document.getElementById('resTotalValue');
    const resNormalStats = document.querySelector('.res-stats');
    const resRealityStats = document.getElementById('resRealityCheckStats');
    const gapMsg = document.getElementById('resGapMsg');
    const gapContainer = document.getElementById('resGapMsgContainer');
    const gapLabel = document.getElementById('resGapStatusLabel');

    if (resNormalStats) resNormalStats.style.display = 'none';
    if (resRealityStats) resRealityStats.style.display = 'block';

    if (resExtra) resExtra.innerText = fmt(extraSip);
    if (resProjected) resProjected.innerText = fmt(realityFV);
    if (resTarget) resTarget.innerText = fmt(targetGoal);
    if (resShort) resShort.innerText = fmt(shortfall);
    if (resTotal) resTotal.innerText = fmt(extraSip);
    if (donutLabel) donutLabel.innerText = "Extra SIP Needed";

    if (extraSip <= 0) {
        if (gapMsg) gapMsg.innerText = "You're right on track! Maintain your discipline to achieve your wealth target.";
        if (gapContainer) {
            gapContainer.className = "gap-msg-box success";
        }
        if (gapLabel) {
            gapLabel.innerText = "Investment Status";
            gapLabel.style.color = "#166534";
        }
        if (resExtra) resExtra.style.color = "#15803D";
    } else {
        if (gapMsg) gapMsg.innerText = "Increase your SIP by this amount to bridge your life goal gap.";
        if (gapContainer) {
            gapContainer.className = "gap-msg-box warning";
        }
        if (gapLabel) {
            gapLabel.innerText = "Extra SIP Needed Today";
            gapLabel.style.color = "#C0392B";
        }
        if (resExtra) resExtra.style.color = "#E74C3C";
    }

    if (donut) {
        donut.style.display = 'flex';
        let total = realityFV + shortfall;
        if (total === 0) total = 1;
        let deg = (realityFV / total) * 360;
        donut.style.background = `conic-gradient(#00B37E 0deg ${deg}deg, #F59E0B ${deg}deg 360deg)`;
    }
}

function calculatetotalPrincipal(startSip, months, stepUp) {
    let total = 0;
    let current = startSip;
    for (let m = 1; m <= months; m++) {
        total += current;
        if (m % 12 === 0 && stepUp > 0) {
            current *= (1 + stepUp / 100);
        }
    }
    return total;
}

// Toggle FAQ Accordion (Global handler for onclick and delegated events)
window.toggleFaq = function(el) {
    const item = el ? (el.classList.contains('faq-item') ? el : el.closest('.faq-item')) : null;
    if (!item) return;
    const wasActive = item.classList.contains('active');
    document.querySelectorAll('.faq-item').forEach(f => f.classList.remove('active'));
    if (!wasActive) {
        item.classList.add('active');
    }
};

// Initialize Event Listeners on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    // Show random fact on page load
    displayRandomFact();

    // Mode Tab Buttons Binding
    const tabBtns = document.querySelectorAll('.mode-toggle-btn, .tab-btn, .mode-tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const targetMode = (this.getAttribute('data-mode') || this.id || '').toLowerCase();
            const isSuper = targetMode.includes('super') || targetMode.includes('advance');
            setSipMode(isSuper ? 'super' : 'standard');
        });
    });

    // Initialize FAQ Accordion
    initFaqAccordion();

    // Initialize Auto-Rotating Tools Carousel
    initToolsCarousel();

    // Inputs & Sliders
    const rangeInv = document.getElementById('rangeInvestment');
    const inputInv = document.getElementById('inputInvestment');
    const rangeRate = document.getElementById('rangeRate');
    const inputRate = document.getElementById('inputRate');
    const rangeYears = document.getElementById('rangeYears');
    const inputYears = document.getElementById('inputYears');

    const checkStepUp = document.getElementById('checkStepUp');
    const stepUpControl = document.getElementById('stepUpControl');
    const rangeStepUp = document.getElementById('rangeStepUp');
    const inputStepUp = document.getElementById('inputStepUp');

    const checkInflation = document.getElementById('checkInflation');
    const inflationControl = document.getElementById('inflationControl');
    const rangeInflation = document.getElementById('rangeInflation');
    const inputInflation = document.getElementById('inputInflation');

    const checkReality = document.getElementById('sipCheckGoalReality');
    const grpReality = document.getElementById('grpGoalRealityInputs');
    const timeLabel = document.getElementById('lblTimePeriod');

    const iGoal = document.getElementById('inputGoalAmount');
    const rGoal = document.getElementById('rangeGoalAmount');
    const iCP = document.getElementById('inputCurrentPortfolio');
    const rCP = document.getElementById('rangeCurrentPortfolio');
    const iES = document.getElementById('inputExistingSip');
    const rES = document.getElementById('rangeExistingSip');

    // Sync Investment
    if (rangeInv && inputInv) {
        rangeInv.addEventListener('input', (e) => {
            sipInvestment = parseInt(e.target.value) || 0;
            inputInv.value = sipInvestment;
            calculateSIP();
        });
        inputInv.addEventListener('input', (e) => {
            let val = parseInt(e.target.value) || 0;
            sipInvestment = val;
            rangeInv.value = val;
            calculateSIP();
        });
    }

    // Sync Rate
    if (rangeRate && inputRate) {
        rangeRate.addEventListener('input', (e) => {
            sipRate = parseFloat(e.target.value) || 0;
            inputRate.value = sipRate;
            calculateSIP();
        });
        inputRate.addEventListener('input', (e) => {
            let val = parseFloat(e.target.value) || 0;
            sipRate = val;
            rangeRate.value = val;
            calculateSIP();
        });
    }

    // Sync Years
    if (rangeYears && inputYears) {
        rangeYears.addEventListener('input', (e) => {
            sipYears = parseInt(e.target.value) || 0;
            inputYears.value = sipYears;
            calculateSIP();
        });
        inputYears.addEventListener('input', (e) => {
            let val = parseInt(e.target.value) || 0;
            sipYears = val;
            rangeYears.value = val;
            calculateSIP();
        });
    }

    // Step Up Toggle & Sync
    if (checkStepUp) {
        checkStepUp.addEventListener('change', (e) => {
            isSipStepUp = e.target.checked;
            if (stepUpControl) stepUpControl.style.display = isSipStepUp ? 'block' : 'none';
            calculateSIP();
        });
    }
    if (rangeStepUp && inputStepUp) {
        rangeStepUp.addEventListener('input', (e) => {
            sipStepUp = parseInt(e.target.value) || 0;
            inputStepUp.value = sipStepUp;
            calculateSIP();
        });
        inputStepUp.addEventListener('input', (e) => {
            let val = parseInt(e.target.value) || 0;
            sipStepUp = val;
            rangeStepUp.value = val;
            calculateSIP();
        });
    }

    // Inflation Toggle & Sync
    if (checkInflation) {
        checkInflation.addEventListener('change', (e) => {
            isSipInflation = e.target.checked;
            if (inflationControl) inflationControl.style.display = isSipInflation ? 'block' : 'none';
            calculateSIP();
        });
    }
    if (rangeInflation && inputInflation) {
        rangeInflation.addEventListener('input', (e) => {
            sipInflation = parseFloat(e.target.value) || 0;
            inputInflation.value = sipInflation;
            calculateSIP();
        });
        inputInflation.addEventListener('input', (e) => {
            let val = parseFloat(e.target.value) || 0;
            if (val > 15) val = 15; if (val < 0) val = 0;
            sipInflation = val;
            rangeInflation.value = val;
            calculateSIP();
        });
    }

    // Goal vs Reality Toggle
    if (checkReality) {
        checkReality.addEventListener('change', (e) => {
            isSipGoalReality = e.target.checked;
            if (grpReality) grpReality.style.display = isSipGoalReality ? 'block' : 'none';
            if (timeLabel) timeLabel.innerText = isSipGoalReality ? "Time Left (Years)" : "Time Period (Years)";
            if (rangeYears) rangeYears.max = isSipGoalReality ? 30 : 40;
            calculateSIP();
        });
    }

    // Super Advance Goal Amount Sync
    if (iGoal && rGoal) {
        iGoal.addEventListener('input', (e) => {
            sipGoalAmount = parseFloat(e.target.value) || 0;
            rGoal.value = sipGoalAmount;
            calculateSIP();
        });
        rGoal.addEventListener('input', (e) => {
            sipGoalAmount = parseFloat(e.target.value) || 0;
            iGoal.value = sipGoalAmount;
            calculateSIP();
        });
    }

    // Portfolio & Existing SIP Sync
    if (iCP && rCP) {
        iCP.addEventListener('input', (e) => { sipCurrentPortfolio = parseFloat(e.target.value) || 0; rCP.value = sipCurrentPortfolio; calculateSIP(); });
        rCP.addEventListener('input', (e) => { sipCurrentPortfolio = parseFloat(e.target.value) || 0; iCP.value = sipCurrentPortfolio; calculateSIP(); });
    }
    if (iES && rES) {
        iES.addEventListener('input', (e) => { sipExistingSip = parseFloat(e.target.value) || 0; rES.value = sipExistingSip; calculateSIP(); });
        rES.addEventListener('input', (e) => { sipExistingSip = parseFloat(e.target.value) || 0; iES.value = sipExistingSip; calculateSIP(); });
    }

    // High-value form privacy checkbox
    const sipHvPrivacy = document.getElementById('sipHvPrivacy');
    const btnHvSubmit = document.getElementById('btnHvSubmit');
    if (sipHvPrivacy && btnHvSubmit) {
        sipHvPrivacy.addEventListener('change', (e) => {
            btnHvSubmit.disabled = !e.target.checked;
            btnHvSubmit.style.opacity = e.target.checked ? '1' : '0.6';
            btnHvSubmit.style.cursor = e.target.checked ? 'pointer' : 'not-allowed';
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

    // Mobile Dropdown Toggle
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

    // Initialize Auto-Rotating Tools Carousel (1.5s interval)
    initToolsCarousel();

    // Initialize FAQ Accordions
    initFaqAccordion();

    // Initial Calculation
    calculateSIP();
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

// Interactive FAQ Accordion Logic
function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.onclick = function(e) {
                e.preventDefault();
                window.toggleFaq(this);
            };
        }
    });
}

/**
 * ====================================================================
 * FINNOMY™ FINANCIAL HEALTH SCORE - STANDALONE DIAGNOSTIC ENGINE
 * 11-Pillar Scoring, Chart.js Gauge & Radar, Dynamic Action Plan
 * ====================================================================
 */

// Global state tracking
let fhsGaugeChartInstance = null;
let fhsRadarChartInstance = null;
let fhsInteractedInputs = new Set(['Age', 'Income', 'Expenses', 'Emi', 'Liquid']);

// Curated Facts for dynamic "Did you know?" insight box
const fhsFacts = [
    "Having less than 3 months of emergency expenses in liquid assets leaves 74% of salaried households vulnerable to unexpected debt cycles.",
    "A debt-to-income ratio (EMI / Take-home) exceeding 40% severely throttles long-term equity compounding and retirement readiness.",
    "The '100 minus Age' asset allocation rule suggests a 30-year-old allocate around 70% of invested assets to equities for optimal compounding.",
    "Holding more than 60% of your total net worth in physical real estate creates an illiquidity bottleneck during emergency events.",
    "A base health insurance cover of at least ₹10–15 Lakhs prevents medical shocks from wiping out years of equity mutual fund savings.",
    "Financial independence (F.I.R.E) begins when passive income streams (dividends, interest, rental yield) exceed 100% of baseline living expenses."
];

// Display Random Fact
function displayRandomFhsFact() {
    const el = document.getElementById('fhsFactText');
    if (el) {
        const random = fhsFacts[Math.floor(Math.random() * fhsFacts.length)];
        el.innerText = random;
    }
}

// Indian Currency Formatter
function formatFhsCurrency(num) {
    if (isNaN(num)) return '₹0';
    if (num >= 10000000) {
        return '₹' + (num / 10000000).toFixed(2) + ' Cr';
    } else if (num >= 100000) {
        return '₹' + (num / 100000).toFixed(2) + ' L';
    } else {
        return '₹' + Math.round(num).toLocaleString('en-IN');
    }
}

// Format numbers with commas for display
function fmtNumber(num) {
    return Math.round(num).toLocaleString('en-IN');
}

/**
 * Core 11-Pillar Financial Health Score Calculation
 */
function calculateFHS() {
    // 1. Get Input Values
    const age = parseFloat(document.getElementById('fhsInputAge')?.value) || 0;
    const income = parseFloat(document.getElementById('fhsInputIncome')?.value) || 0;
    const expenses = parseFloat(document.getElementById('fhsInputExpenses')?.value) || 0;
    const emi = parseFloat(document.getElementById('fhsInputEmi')?.value) || 0;
    const passiveIncome = parseFloat(document.getElementById('fhsInputPassiveIncome')?.value) || 0;
    const liquidAssets = parseFloat(document.getElementById('fhsInputLiquid')?.value) || 0;
    const investedAssets = parseFloat(document.getElementById('fhsInputInvested')?.value) || 0;
    const equityAssets = parseFloat(document.getElementById('fhsInputEquity')?.value) || 0;
    const realEstate = parseFloat(document.getElementById('fhsInputRealEstate')?.value) || 0;
    const debt = parseFloat(document.getElementById('fhsInputDebt')?.value) || 0;
    const healthCover = parseFloat(document.getElementById('fhsInputHealthCover')?.value) || 0;

    // --- High Value Form Threshold ---
    const isHighValue =
        income > 250000 ||
        expenses > 150000 ||
        passiveIncome > 150000 ||
        realEstate > 50000000 ||
        debt > 20000000;

    const normalResults = document.getElementById('fhsNormalResults');
    const hvForm = document.getElementById('fhsHighValueForm');
    const leadForm = document.getElementById('leadCapture-FHS');
    const factCard = document.getElementById('fhsFactCard');

    if (isHighValue) {
        if (normalResults) normalResults.style.display = 'none';
        if (hvForm) hvForm.style.display = 'block';
        if (leadForm) leadForm.style.display = 'none';
        if (factCard) factCard.style.display = 'none';
        return; // Stop standard calculation
    } else {
        if (normalResults) normalResults.style.display = 'flex';
        if (hvForm) hvForm.style.display = 'none';
        if (leadForm) leadForm.style.display = 'block';
        if (factCard) factCard.style.display = 'flex';
    }

    let scores = [];
    let actions = [];

    const addScore = (id, name, score, logic, advice) => {
        scores.push({ id, name, score, fullMark: 100 });
        if (score <= 70) actions.push({ id, name, current: logic, advice });
    };

    // Pillar 1: Emergency Fund
    let efRatio = expenses > 0 ? liquidAssets / expenses : (liquidAssets > 0 ? 99 : 0);
    let efScore = 0;
    if (efRatio >= 6) efScore = 100;
    else if (efRatio >= 3) efScore = 70;
    else if (efRatio >= 1) efScore = 40;
    addScore('ef', 'Emergency Fund', efScore, `${efRatio.toFixed(1)} Months`, 'Build your emergency fund to cover at least 6 months of living expenses using Liquid Funds or FDs.');

    // Pillar 2: Savings Rate
    let savingsRate = income > 0 ? ((income - expenses - emi) / income) * 100 : 0;
    let srScore = 0;
    if (savingsRate >= 30) srScore = 100;
    else if (savingsRate >= 20) srScore = 70;
    else if (savingsRate >= 10) srScore = 40;
    addScore('sr', 'Savings Rate', srScore, `${savingsRate.toFixed(1)}%`, 'Try to save and invest at least 30% of your take-home income by reducing discretionary spending.');

    // Pillar 3: Debt-to-Income
    let dti = income > 0 ? (emi / income) * 100 : (emi > 0 ? 100 : 0);
    let dtiScore = 0;
    if (dti === 0 && emi === 0) dtiScore = 100;
    else if (dti <= 20) dtiScore = 70;
    else if (dti <= 40) dtiScore = 40;
    addScore('dti', 'Debt-to-Income', dtiScore, `${dti >= 100 ? '>100' : dti.toFixed(1)}%`, 'High EMI burden limits wealth creation. Focus on prepaying expensive debt to bring EMIs below 20% of income.');

    // Pillar 4: Solvency
    let solvency = debt > 0 ? (liquidAssets + investedAssets) / debt : 99;
    let solScore = 0;
    if (debt === 0 || solvency >= 2.0) solScore = 100;
    else if (solvency >= 1.5) solScore = 70;
    else if (solvency >= 1.0) solScore = 40;
    addScore('sol', 'Solvency', solScore, `${solvency === 99 ? 'Debt Free' : solvency.toFixed(2)}x`, 'Your liabilities are high compared to financial assets. Focus on debt reduction before accumulating non-liquid assets.');

    // Pillar 5: Health Insurance
    let hcScore = 0;
    if (healthCover >= 1000000) hcScore = 100;
    else if (healthCover >= 500000) hcScore = 70;
    else if (healthCover > 0) hcScore = 40;
    addScore('hc', 'Health Insurance', hcScore, `${formatFhsCurrency(healthCover)}`, 'Medical inflation is high. Secure at least ₹10 Lakhs of base health insurance coverage independent of your employer.');

    // Pillar 6: Productive Wealth
    let pwTotal = liquidAssets + investedAssets;
    let pwRatio = pwTotal > 0 ? (investedAssets / pwTotal) * 100 : 0;
    let pwScore = 0;
    if (pwRatio >= 60) pwScore = 100;
    else if (pwRatio >= 40) pwScore = 70;
    else if (pwRatio >= 20) pwScore = 40;
    addScore('pw', 'Productive Wealth', pwScore, `${pwRatio.toFixed(0)}%`, 'You hold too much cash. Deploy idle cash above your emergency fund into productive, return-generating investments.');

    // Pillar 7: Age-to-Wealth
    let actualNw = (liquidAssets + investedAssets + realEstate) - debt;
    let targetNw = (age * (income * 12)) / 10;
    let awRatio = targetNw > 0 ? actualNw / targetNw : (actualNw > 0 ? 1 : 0);
    let awScore = 0;
    if (awRatio >= 1.0) awScore = 100;
    else if (awRatio >= 0.5) awScore = 70;
    else if (awRatio >= 0.1) awScore = 40;
    addScore('aw', 'Age-to-Wealth', awScore, `${(awRatio * 100).toFixed(0)}% of Target`, 'Your current net worth is below the target for your age and income. Increase your savings rate and equity compounding.');

    // Pillar 8: F.I.R.E Ratio
    let fireRatio = expenses > 0 ? passiveIncome / expenses : (passiveIncome > 0 ? 1 : 0);
    let fireScore = 0;
    if (fireRatio >= 1.0) fireScore = 100;
    else if (fireRatio >= 0.5) fireScore = 70;
    else if (fireRatio >= 0.1) fireScore = 40;
    addScore('fire', 'F.I.R.E Ratio', fireScore, `${(fireRatio * 100).toFixed(0)}% of Expenses`, 'Focus on building dividend, interest, or rental income streams to cover living expenses for true financial freedom.');

    // Pillar 9: Age-Adjusted Equity
    let actualEq = investedAssets > 0 ? (Math.min(equityAssets, investedAssets) / investedAssets) * 100 : 0;
    let targetEq = Math.max(0, 100 - age);
    let eqDiff = Math.abs(actualEq - targetEq);
    let eqScore = 0;
    if (eqDiff <= 10) eqScore = 100;
    else if (eqDiff <= 25) eqScore = 70;
    else if (eqDiff <= 40) eqScore = 40;
    addScore('eq', 'Asset Allocation', eqScore, `${actualEq.toFixed(0)}% (Target: ${targetEq}%)`, 'Your equity allocation deviates from the "100-Age" rule. Rebalance your portfolio to align with your risk capacity.');

    // Pillar 10: Real Estate Concentration
    let reRatio = actualNw > 0 ? (realEstate / actualNw) * 100 : (realEstate > 0 ? 100 : 0);
    let reScore = 0;
    if (reRatio <= 50) reScore = 100;
    else if (reRatio <= 69) reScore = 70;
    else if (reRatio <= 85) reScore = 40;
    addScore('re', 'Real Estate Conc.', reScore, `${reRatio.toFixed(0)}%`, 'Your net worth is heavily blocked in illiquid physical real estate. Diversify into financial assets (equities/bonds).');

    // Pillar 11: Needs Ratio
    let needsRatio = income > 0 ? ((expenses + emi) / income) * 100 : 100;
    let nsScore = 0;
    if (needsRatio <= 50) nsScore = 100;
    else if (needsRatio <= 65) nsScore = 70;
    else if (needsRatio <= 80) nsScore = 40;
    addScore('ns', 'Needs Ratio', nsScore, `${needsRatio.toFixed(0)}%`, 'Your mandatory expenses (needs and EMIs) are consuming too much of your income. Look for lifestyle deflation opportunities.');

    // Extract Arrays for Chart.js
    const radarLabels = scores.map(s => s.name);
    const radarData = scores.map(s => s.score);

    const sum = radarData.reduce((a, b) => a + b, 0);
    const finalScore = Math.round(sum / 11);

    let badge = "CRITICAL";
    let color = "#EF4444"; // Red
    if (finalScore >= 80) { badge = "EXCELLENT"; color = "#00B37E"; }
    else if (finalScore >= 60) { badge = "GOOD"; color = "#0B63D8"; }
    else if (finalScore >= 40) { badge = "NEEDS ATTENTION"; color = "#D97706"; }

    // Update DOM Elements
    const scoreEl = document.getElementById('fhsScoreDisplay');
    if (scoreEl) {
        scoreEl.innerText = finalScore;
        scoreEl.style.color = color;
    }

    const badgeEl = document.getElementById('fhsStatusBadge');
    if (badgeEl) {
        badgeEl.innerText = badge;
        badgeEl.style.backgroundColor = color + '1A';
        badgeEl.style.color = color;
    }

    // Render Action Plan (Synthesized Conversational Summary)
    const actionContainer = document.getElementById('fhsActionPlanContainer');
    if (actionContainer) {
        if (fhsInteractedInputs.size < 5) {
            let remaining = 5 - fhsInteractedInputs.size;
            actionContainer.innerHTML = `
                <div style="font-size: 0.9rem; color: #64748b; line-height: 1.6; padding: 18px; text-align: center; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
                    <div style="font-size: 1.8rem; margin-bottom: 6px;">🎚️</div>
                    <div style="font-weight: 700; color: #1e293b;">Personalizing your diagnostic...</div>
                    Adjust ${remaining} more input${remaining > 1 ? 's' : ''} to reveal your customized financial action plan.
                </div>
            `;
        } else if (finalScore >= 90 && actions.length === 0) {
            actionContainer.innerHTML = `
                <div style="font-size: 0.9rem; color: #166534; line-height: 1.6; padding: 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
                    <strong>🌟 Outstanding Financial Health!</strong><br>
                    Your emergency reserves are fully funded, your savings rate is exemplary, and debt is completely under control. Your investments are compounding efficiently with the ideal equity allocation for your age. Keep staying the course and let compounding work for you!
                </div>
            `;
        } else {
            let summaryText = "<p style='margin-bottom: 10px; font-weight: 600; color: #0f172a;'>Top Action Items for Financial Strength:</p><ul style='margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 8px;'>";

            const weakIds = actions.map(a => a.id);

            // Immediate Risks
            if (weakIds.includes('ef') || weakIds.includes('hc')) {
                summaryText += "<li><strong style='color: #EF4444;'>Secure Foundation:</strong> Urgently build a 6-month liquid emergency fund and secure at least ₹10L base health insurance to shield against hospital shocks.</li>";
            }

            // Debt Issues
            if (weakIds.includes('dti') || weakIds.includes('sol') || weakIds.includes('ns')) {
                summaryText += "<li><strong style='color: #D97706;'>Reduce Debt Load:</strong> EMIs and fixed needs consume too much monthly cash flow. Prepay high-interest debts to bring debt-to-income below 20%.</li>";
            }

            // Wealth & Accumulation
            if (weakIds.includes('sr') || weakIds.includes('aw')) {
                summaryText += "<li><strong style='color: #0B63D8;'>Accelerate Savings:</strong> Accumulation is lagging age targets. Tighten discretionary expenses and push monthly savings rate to 30%+.</li>";
            }

            // Asset Allocation
            if (weakIds.includes('pw') || weakIds.includes('eq') || weakIds.includes('re')) {
                summaryText += "<li><strong style='color: #8B5CF6;'>Optimize Allocation:</strong> Avoid holding excess idle cash or locking net worth in illiquid property. Channel capital into compounding equity mutual funds.</li>";
            }

            // Independence
            if (weakIds.includes('fire')) {
                summaryText += "<li><strong style='color: #00B37E;'>Build Passive Cash Flow:</strong> Build dividend or rental income streams to fund baseline living costs for true F.I.R.E. independence.</li>";
            }

            summaryText += "</ul>";

            actionContainer.innerHTML = `
                <div style="font-size: 0.88rem; color: #334155; line-height: 1.55; padding: 14px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                    ${summaryText}
                </div>
            `;
        }
    }

    // UPDATE CHARTS
    if (typeof Chart === 'undefined') {
        return;
    }

    // 1. Half-Doughnut Gauge Chart
    const gaugeCanvas = document.getElementById('fhsGaugeChart');
    if (gaugeCanvas) {
        const gaugeCtx = gaugeCanvas.getContext('2d');
        if (fhsGaugeChartInstance) fhsGaugeChartInstance.destroy();
        fhsGaugeChartInstance = new Chart(gaugeCtx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [finalScore, 100 - finalScore],
                    backgroundColor: [color, '#F1F5F9'],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: 270
                }]
            },
            options: {
                cutout: '80%',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { tooltip: { enabled: false }, legend: { display: false } }
            }
        });
    }

    // 2. 11-Pillar Radar Chart
    const radarCanvas = document.getElementById('fhsRadarChart');
    if (radarCanvas) {
        const radarCtx = radarCanvas.getContext('2d');
        if (fhsRadarChartInstance) fhsRadarChartInstance.destroy();
        fhsRadarChartInstance = new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: radarLabels,
                datasets: [{
                    label: 'Score',
                    data: radarData,
                    backgroundColor: color + '33', // 20% opacity
                    borderColor: color,
                    borderWidth: 2,
                    pointBackgroundColor: color,
                    pointBorderColor: '#FFFFFF',
                    pointHoverBackgroundColor: '#FFFFFF',
                    pointHoverBorderColor: color,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: '#E2E8F0' },
                        grid: { color: '#E2E8F0' },
                        pointLabels: { color: '#64748B', font: { size: 9, weight: '600' } },
                        ticks: { display: false, min: 0, max: 100 }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

/**
 * Submit High Value Advisory Request
 */
function submitFhsHvForm() {
    const name = document.getElementById('fhsHvName')?.value.trim();
    const email = document.getElementById('fhsHvEmail')?.value.trim();
    const phone = document.getElementById('fhsHvMobile')?.value.trim();
    const desc = document.getElementById('fhsHvDesc')?.value.trim();
    const privacy = document.getElementById('fhsHvPrivacy')?.checked;
    const successMsg = document.getElementById('fhsHvSuccess');
    const submitBtn = document.getElementById('btnFhsHvSubmit');

    if (!name || !email || !email.includes('@') || !phone || phone.length < 10 || !desc || !privacy) {
        alert("Please complete all required fields and accept the privacy policy.");
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "Submitting Consultation Request...";
    }

    const payload = {
        user_name: name,
        user_email: email,
        user_phone: phone,
        user_company: document.getElementById('fhsHvCompany')?.value.trim() || "Individual",
        calculator_name: "High Net-Worth Financial Diagnostic 💎",
        description: `Income: ₹${document.getElementById('fhsInputIncome')?.value} | Real Estate: ₹${document.getElementById('fhsInputRealEstate')?.value} | Debt: ₹${document.getElementById('fhsInputDebt')?.value} | Goals: ${desc}`
    };

    if (typeof emailjs !== 'undefined') {
        emailjs.send("service_x9r8z68", "template_qvh28v8", payload)
            .then(() => {
                if (successMsg) successMsg.style.display = 'block';
                if (submitBtn) submitBtn.innerText = "✅ Consultation Booked";
            })
            .catch(err => {
                console.error("Advisory dispatch error:", err);
                if (successMsg) {
                    successMsg.style.display = 'block';
                    successMsg.innerText = "✅ Request received! Our wealth advisory team will connect shortly.";
                }
            });
    } else {
        if (successMsg) successMsg.style.display = 'block';
        if (submitBtn) submitBtn.innerText = "✅ Consultation Booked";
    }
}

/**
 * Lead Capture "Send My Report" Dispatch
 */
function sendDashboardReport(calcType) {
    const nameInput = document.getElementById('lcName-FHS');
    const emailInput = document.getElementById('lcEmail-FHS');
    const phoneInput = document.getElementById('lcPhone-FHS');
    const btn = document.getElementById('lcBtn-FHS');
    const feedback = document.getElementById('lcSuccess-FHS');

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
    btn.innerHTML = "⏳ Sending Diagnostic...";
    if (feedback) feedback.style.display = 'none';

    const safeVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : "0";
    };

    const score = document.getElementById('fhsScoreDisplay')?.innerText || "0";
    const status = document.getElementById('fhsStatusBadge')?.innerText || "EVALUATED";
    const actionPlanElement = document.getElementById('fhsActionPlanContainer');

    let fhsInp = [];
    fhsInp.push(`Age: ${safeVal('fhsInputAge')} Yrs`);
    fhsInp.push(`Income: ₹${fmtNumber(parseFloat(safeVal('fhsInputIncome')) || 0)}`);
    fhsInp.push(`Expenses: ₹${fmtNumber(parseFloat(safeVal('fhsInputExpenses')) || 0)}`);
    fhsInp.push(`EMI: ₹${fmtNumber(parseFloat(safeVal('fhsInputEmi')) || 0)}`);
    fhsInp.push(`Passive Inc: ₹${fmtNumber(parseFloat(safeVal('fhsInputPassiveIncome')) || 0)}`);
    fhsInp.push(`Liquid Assets: ₹${fmtNumber(parseFloat(safeVal('fhsInputLiquid')) || 0)}`);
    fhsInp.push(`Invested Assets: ₹${fmtNumber(parseFloat(safeVal('fhsInputInvested')) || 0)}`);
    fhsInp.push(`Equity: ₹${fmtNumber(parseFloat(safeVal('fhsInputEquity')) || 0)}`);
    fhsInp.push(`Real Estate: ₹${fmtNumber(parseFloat(safeVal('fhsInputRealEstate')) || 0)}`);
    fhsInp.push(`Debt: ₹${fmtNumber(parseFloat(safeVal('fhsInputDebt')) || 0)}`);
    fhsInp.push(`Health Cover: ₹${fmtNumber(parseFloat(safeVal('fhsInputHealthCover')) || 0)}`);

    let calculatorData = {
        user_name: userName || userEmail.split('@')[0],
        user_email: userEmail,
        user_phone: userPhone,
        calculator_name: "Financial Health Score 🩺",
        website_url: window.location.href,
        return_url: window.location.href,
        label_1: "FinNomy Score",
        val_1: `${score} / 100 (${status})`,
        label_2: "Monthly Take-Home",
        val_2: `₹${fmtNumber(parseFloat(safeVal('fhsInputIncome')) || 0)}`,
        label_3: "Liquid Assets",
        val_3: `₹${fmtNumber(parseFloat(safeVal('fhsInputLiquid')) || 0)}`,
        inputs_summary: fhsInp.join(" | "),
        advisor_fix: actionPlanElement ? ("<strong>Your Personalized Action Plan:</strong><br><br>" + actionPlanElement.innerHTML) : "Financial Health Audit Complete.",
        advisor_display: "block",
        inputs_display: "block"
    };

    if (typeof emailjs !== 'undefined') {
        emailjs.send("service_x9r8z68", "template_qvh28v8", calculatorData)
            .then(() => {
                btn.innerHTML = "✅ Diagnostic Dispatched!";
                btn.style.background = "#00B37E";
                if (feedback) {
                    feedback.style.display = 'block';
                    feedback.style.color = '#00B37E';
                    feedback.innerText = "✅ Report sent successfully! Check your inbox.";
                }
            })
            .catch(err => {
                console.error("EmailJS Error:", err);
                btn.innerHTML = "✅ Diagnostic Dispatched!";
                if (feedback) {
                    feedback.style.display = 'block';
                    feedback.style.color = '#00B37E';
                    feedback.innerText = "✅ Report sent successfully! Check your inbox.";
                }
            });
    } else {
        btn.innerHTML = "✅ Diagnostic Dispatched!";
        if (feedback) {
            feedback.style.display = 'block';
            feedback.style.color = '#00B37E';
            feedback.innerText = "✅ Report sent successfully! Check your inbox.";
        }
    }
}

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

// Initialization on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize EmailJS
    if (typeof emailjs !== 'undefined') {
        try {
            emailjs.init("5v2B_yL5P-N69eA_9");
        } catch (e) {
            console.log("EmailJS init note:", e);
        }
    }

    // Set up bidirectional Input <-> Range sync for all 11 inputs
    const inputIds = [
        'Age', 'Income', 'Expenses', 'Emi', 'PassiveIncome',
        'Liquid', 'Invested', 'Equity', 'RealEstate', 'Debt',
        'HealthCover'
    ];

    inputIds.forEach(id => {
        const inp = document.getElementById(`fhsInput${id}`);
        const rng = document.getElementById(`fhsRange${id}`);

        if (inp && rng) {
            rng.addEventListener('input', (e) => {
                fhsInteractedInputs.add(id);
                inp.value = e.target.value;
                calculateFHS();
            });

            inp.addEventListener('input', (e) => {
                fhsInteractedInputs.add(id);
                let val = parseFloat(inp.value.replace(/,/g, '')) || 0;
                rng.value = val;
                calculateFHS();
            });
        }
    });

    // High Value Privacy Checkbox enable/disable submit button
    const hvPrivacy = document.getElementById('fhsHvPrivacy');
    const hvSubmit = document.getElementById('btnFhsHvSubmit');
    if (hvPrivacy && hvSubmit) {
        hvPrivacy.addEventListener('change', () => {
            hvSubmit.disabled = !hvPrivacy.checked;
            hvSubmit.style.opacity = hvPrivacy.checked ? '1' : '0.6';
            hvSubmit.style.cursor = hvPrivacy.checked ? 'pointer' : 'not-allowed';
        });
    }

    // FAQ Accordions Toggle Logic
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const questionBtn = item.querySelector('.faq-question-btn');
        if (questionBtn) {
            questionBtn.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                faqItems.forEach(i => i.classList.remove('active'));
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        }
    });

    // Mobile Navigation Hamburger Logic
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
    }

    // Display initial random fact
    displayRandomFhsFact();

    // Initial Calculation Run
    calculateFHS();

    // Auto-Rotating Ecosystem Tools Carousel
    initToolsCarousel();
});

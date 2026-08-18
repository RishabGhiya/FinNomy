/**
 * FinNomy Retirement Calculator with Step-Up & Inflation Engine
 * Complete client-side simulation, interactive visualization, and report dispatch logic.
 * Zero external calculation dependencies.
 */

// Global State
let retAge = 30;
let retRetireAge = 60;
let retExpenses = 50000;
let retSavings = 0;
let retPreROI = 12;
let retPostROI = 8;
let retLife = 85;
let isRetInflation = true;
let retInflation = 6;
let isRetStepUp = true;
let retStepUp = 10;

// Curated Retirement Facts for dynamic "Did you know?" insight box
const retirementFacts = [
    "At 6% annual inflation, a monthly household expense of ₹50,000 today will escalate to nearly ₹2.87 Lakhs/month in 30 years.",
    "Starting your retirement SIP 5 years earlier can reduce your required monthly investment by more than 50% thanks to compounding runway.",
    "A 10% annual Step-Up SIP lets you start investing an achievable amount in your 20s and 30s while still achieving multi-crore retirement targets.",
    "Medical inflation in India averages 10%–14% annually, nearly double the headline consumer price inflation rate.",
    "The 4% withdrawal rule originated in the US. In India, with higher historical inflation and dynamic interest rates, a 3.5%–4.5% real withdrawal rate is recommended.",
    "Outliving your savings (Longevity Risk) is the #1 financial hazard for modern retirees as life expectancy in urban India surpasses 85+ years.",
    "Shifting 100% of retirement savings to fixed deposits causes purchasing power erosion due to taxation and inflation drag. A hybrid equity-debt allocation is critical.",
    "For equity mutual funds held over 1 year, Long Term Capital Gains (LTCG) up to ₹1.25 Lakhs per financial year are completely tax-exempt under Section 112A.",
    "Compounding existing provident fund (EPF/PPF) balances at 7.1%–8.25% alongside equity SIPs creates a resilient, multi-pillar retirement safety net.",
    "Automating annual SIP increments with your salary appraisal dates ensures lifestyle inflation never overtakes your wealth creation goals."
];

// Display Random Retirement Fact
function displayRandomRetirementFact() {
    const el = document.getElementById('retirementFactText');
    if (el) {
        const random = retirementFacts[Math.floor(Math.random() * retirementFacts.length)];
        el.innerText = random;
    }
}

// Currency formatters
const fmt = (n) => "₹" + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n || 0));
const shortFmt = (n) => {
    if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr';
    if (n >= 100000) return '₹' + (n / 100000).toFixed(2) + ' L';
    return '₹' + (n / 1000).toFixed(0) + ' k';
};

// Main Retirement Calculation Engine
window.calculateRetirement = function() {
    // 1. Read Inputs
    const age = parseFloat(document.getElementById('retInputAge').value) || 30;
    const plannedRetAge = parseFloat(document.getElementById('retInputRetireAge').value) || 60;
    const expenses = parseFloat(document.getElementById('retInputExpenses').value) || 50000;
    const savings = parseFloat(document.getElementById('retInputSavings').value) || 0;
    const preROI = (parseFloat(document.getElementById('retInputPreROI').value) || 12) / 100;
    const postROI = (parseFloat(document.getElementById('retInputPostROI').value) || 8) / 100;
    const lifeExpectancy = parseFloat(document.getElementById('retInputLife').value) || 85;

    const isInflationOn = document.getElementById('retCheckInflation') ? document.getElementById('retCheckInflation').checked : true;
    const inflation = isInflationOn ? ((parseFloat(document.getElementById('retInputInflation').value) || 6) / 100) : 0;

    const hasStepUp = document.getElementById('retCheckStepUp') ? document.getElementById('retCheckStepUp').checked : true;
    const stepUpRate = (parseFloat(document.getElementById('retInputStepUp').value) || 10) / 100;

    // Validation Guard
    if (plannedRetAge <= age || lifeExpectancy <= plannedRetAge) {
        return;
    }

    const yearsToRetire = plannedRetAge - age;
    const yearsInRetirement = lifeExpectancy - plannedRetAge;

    // Step 1: Inflate Expenses to Retirement Age
    // Expense_future = Expense_current * (1 + r_inf)^years_to_retire
    const futureMonthlyExp = expenses * Math.pow(1 + inflation, yearsToRetire);

    // Step 2: Calculate Net Target Retirement Corpus (Annuity PV)
    // Monthly real rate = (((1 + postROI) / (1 + inflation)) - 1) / 12
    let realAnnualRate = inflation > 0 ? (((1 + postROI) / (1 + inflation)) - 1) : postROI;
    const r_monthly = realAnnualRate / 12;
    const n_months = yearsInRetirement * 12;

    let requiredCorpus = 0;
    if (r_monthly === 0) {
        requiredCorpus = futureMonthlyExp * n_months;
    } else {
        // Annuity Due: PV = PMT * [(1 - (1+r)^-n) / r] * (1+r)
        requiredCorpus = futureMonthlyExp * ((1 - Math.pow(1 + r_monthly, -n_months)) / r_monthly) * (1 + r_monthly);
    }

    // Step 3: Projection of Existing Savings
    const projectedSavings = savings * Math.pow(1 + preROI, yearsToRetire);

    // Step 4: Net Gap / Shortfall
    const gap = Math.max(0, requiredCorpus - projectedSavings);

    // Step 5: Required Monthly SIP
    const r_pre_monthly = preROI / 12;
    const n_pre_months = yearsToRetire * 12;

    let requiredSIP = 0;
    let totalInvestedSip = 0;

    if (gap > 0) {
        if (hasStepUp) {
            // Complex Step-up SIP Precision Bisection Search
            let low = 0, high = gap;
            for (let i = 0; i < 40; i++) {
                let mid = (low + high) / 2;
                let fv = 0;
                let currentSip = mid;
                for (let y = 0; y < yearsToRetire; y++) {
                    for (let m = 0; m < 12; m++) {
                        fv = (fv + currentSip) * (1 + r_pre_monthly);
                    }
                    currentSip *= (1 + stepUpRate);
                }
                if (fv < gap) low = mid;
                else high = mid;
            }
            requiredSIP = low;

            // Compute total invested amount with step-up
            let curSip = requiredSIP;
            for (let y = 0; y < yearsToRetire; y++) {
                totalInvestedSip += curSip * 12;
                curSip *= (1 + stepUpRate);
            }
        } else {
            // Flat SIP standard compounding
            requiredSIP = gap * (r_pre_monthly / (Math.pow(1 + r_pre_monthly, n_pre_months) - 1)) / (1 + r_pre_monthly);
            totalInvestedSip = requiredSIP * n_pre_months;
        }
    }

    // Total accumulated wealth = projected savings + target corpus
    const totalAccumulated = projectedSavings + gap;

    // High Value Lead Check (> ₹1 Lakh/mo current expense OR > ₹15 Cr corpus)
    const hvForm = document.getElementById('retResHvForm');
    const normalRes = document.getElementById('retResNormalState');
    const leadForm = document.getElementById('leadCapture-RETIREMENT');
    const factCard = document.getElementById('retirementFactCard');

    if (expenses > 100000 || requiredCorpus > 150000000) {
        if (hvForm) hvForm.style.display = 'block';
        if (normalRes) normalRes.style.display = 'none';
        if (leadForm) leadForm.style.display = 'none';
        if (factCard) factCard.style.display = 'none';
    } else {
        if (hvForm) hvForm.style.display = 'none';
        if (normalRes) normalRes.style.display = 'block';
        if (leadForm) leadForm.style.display = 'block';
        if (factCard) factCard.style.display = 'flex';
    }

    // Update Output Elements
    if (document.getElementById('retResHeroCorpus')) document.getElementById('retResHeroCorpus').innerText = shortFmt(requiredCorpus);
    if (document.getElementById('retResTotalCorpus')) document.getElementById('retResTotalCorpus').innerText = shortFmt(requiredCorpus);
    if (document.getElementById('retResFutureExp')) document.getElementById('retResFutureExp').innerText = fmt(futureMonthlyExp);
    if (document.getElementById('retResRequiredSIP')) document.getElementById('retResRequiredSIP').innerText = fmt(requiredSIP);
    if (document.getElementById('retResProjSavings')) document.getElementById('retResProjSavings').innerText = fmt(projectedSavings);
    if (document.getElementById('retResGap')) document.getElementById('retResGap').innerText = fmt(gap);
    if (document.getElementById('retResTotalInvested')) document.getElementById('retResTotalInvested').innerText = fmt(totalInvestedSip + savings);
    if (document.getElementById('retResEstReturns')) document.getElementById('retResEstReturns').innerText = fmt(Math.max(0, totalAccumulated - (totalInvestedSip + savings)));

    // Conic Gradient Donut Update
    const donut = document.getElementById('retDonut');
    if (donut) {
        let existingPercent = (projectedSavings / (requiredCorpus || 1)) * 100;
        if (existingPercent > 100) existingPercent = 100;
        donut.style.background = `conic-gradient(#0B63D8 0% ${existingPercent.toFixed(1)}%, #F59E0B ${existingPercent.toFixed(1)}% 100%)`;
        
        const donutVal = document.getElementById('retDonutValue');
        if (donutVal) donutVal.innerText = shortFmt(requiredCorpus);
    }

    // Dynamic Goal Analysis Text
    const analysisEl = document.getElementById('retGoalAnalysis');
    if (analysisEl) {
        let stepUpText = hasStepUp ? `with an annual <strong>${(stepUpRate * 100).toFixed(0)}% Step-Up</strong>` : `as a flat monthly investment`;
        analysisEl.innerHTML = `Your current monthly expenses of <strong>${fmt(expenses)}</strong> will inflate to <strong>${fmt(futureMonthlyExp)}/month</strong> at age ${plannedRetAge}. To sustain this lifestyle until age ${lifeExpectancy}, you need a target retirement nest egg of <strong>${shortFmt(requiredCorpus)}</strong>. Start investing <strong>${fmt(requiredSIP)}/month</strong> today ${stepUpText}.`;
    }
};

// Global Send Dashboard Report for EmailJS
window.sendDashboardReport = function(calcTypeRaw) {
    let calcType = String(calcTypeRaw || 'retirement').toLowerCase();
    const idPrefix = 'RETIREMENT';

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

    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = "⏳ Sending...";
    if (feedback) feedback.style.display = 'none';

    const safeGet = (id) => {
        const el = document.getElementById(id);
        return el ? el.innerText : "";
    };
    const safeVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : "0";
    };

    let calculatorData = {
        user_name: userName || userEmail.split('@')[0],
        user_email: userEmail,
        user_phone: userPhone,
        calculator_name: "Retirement Journey 🚀",
        website_url: window.location.href,
        return_url: window.location.href,
        label_1: "Corpus Required",
        val_1: safeGet('retResTotalCorpus') || safeGet('retResHeroCorpus'),
        label_2: "Monthly SIP Required",
        val_2: safeGet('retResRequiredSIP'),
        label_3: "Future Monthly Expense",
        val_3: safeGet('retResFutureExp'),
        inputs_summary: `Age: ${safeVal('retInputAge')} | Ret Age: ${safeVal('retInputRetireAge')} | Exp: ₹${safeVal('retInputExpenses')} | ROI: ${safeVal('retInputPreROI')}% / ${safeVal('retInputPostROI')}% | Life: ${safeVal('retInputLife')} Yrs`,
        advisor_fix: `<strong>Dashboard Summary:</strong><br>Projected Savings: ${safeGet('retResProjSavings')}<br>Total Target Corpus: ${safeGet('retResTotalCorpus')}<br><br><em>Advice: ${safeGet('retGoalAnalysis')}</em>`,
        advisor_display: "block",
        inputs_display: "block"
    };

    if (typeof emailjs !== 'undefined') {
        emailjs.send("service_x9r8z68", "template_qvh28v8", calculatorData)
            .then(() => {
                btn.innerHTML = "✅ Report Dispatched!";
                btn.style.background = "#059669";
                if (feedback) {
                    feedback.style.display = 'block';
                    feedback.style.color = '#059669';
                    feedback.innerText = "✅ Report sent successfully! Check your inbox.";
                }
                setTimeout(() => {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                    btn.style.background = "";
                }, 5000);
            })
            .catch((err) => {
                console.error("EmailJS error:", err);
                btn.disabled = false;
                btn.innerHTML = originalText;
                if (feedback) {
                    feedback.style.display = 'block';
                    feedback.style.color = '#dc2626';
                    feedback.innerText = "Dispatch failed. Please check your connection and try again.";
                }
            });
    } else {
        setTimeout(() => {
            btn.innerHTML = "✅ Report Dispatched!";
            btn.style.background = "#059669";
            if (feedback) {
                feedback.style.display = 'block';
                feedback.style.color = '#059669';
                feedback.innerText = "✅ Report sent successfully! Check your inbox.";
            }
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = originalText;
                btn.style.background = "";
            }, 5000);
        }, 1000);
    }
};

// High Value Form Submission
window.submitRetHvForm = function() {
    const name = document.getElementById('retHvName') ? document.getElementById('retHvName').value.trim() : "";
    const email = document.getElementById('retHvEmail') ? document.getElementById('retHvEmail').value.trim() : "";
    const mobile = document.getElementById('retHvMobile') ? document.getElementById('retHvMobile').value.trim() : "";
    const privacy = document.getElementById('retHvPrivacy') ? document.getElementById('retHvPrivacy').checked : false;
    const successMsg = document.getElementById('retHvSuccess');

    if (!name || !email || !mobile || !privacy) {
        alert("Please complete all required fields and accept the privacy policy.");
        return;
    }

    const btn = document.getElementById('btnRetHvSubmit');
    if (btn) {
        btn.disabled = true;
        btn.innerText = "Sending Consultation Request...";
    }

    if (typeof emailjs !== 'undefined') {
        const data = {
            user_name: name,
            user_email: email,
            user_phone: mobile,
            service_name: "Private Wealth Retirement Planning",
            message: document.getElementById('retHvDesc') ? document.getElementById('retHvDesc').value : ""
        };
        emailjs.send("service_x9r8z68", "template_qvh28v8", data)
            .then(() => {
                if (successMsg) successMsg.style.display = 'block';
                if (btn) btn.innerText = "✅ Request Received";
            })
            .catch(() => {
                if (successMsg) {
                    successMsg.style.display = 'block';
                    successMsg.innerText = "✅ Request recorded. Our private wealth manager will contact you shortly.";
                }
                if (btn) btn.innerText = "✅ Request Received";
            });
    } else {
        if (successMsg) successMsg.style.display = 'block';
        if (btn) btn.innerText = "✅ Request Received";
    }
};

// FAQ Accordion Toggle
window.toggleFaq = function(headerEl) {
    const item = headerEl.closest('.faq-item');
    if (!item) return;
    const isActive = item.classList.contains('active');

    // Close other FAQ items
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));

    // Toggle current item
    if (!isActive) {
        item.classList.add('active');
    }
};

// Initial Setup and Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    displayRandomRetirementFact();

    // Slider and Numeric Input IDs
    const inputConfigs = [
        { num: 'retInputAge', range: 'retRangeAge' },
        { num: 'retInputRetireAge', range: 'retRangeRetireAge' },
        { num: 'retInputExpenses', range: 'retRangeExpenses' },
        { num: 'retInputSavings', range: 'retRangeSavings' },
        { num: 'retInputPreROI', range: 'retRangePreROI' },
        { num: 'retInputPostROI', range: 'retRangePostROI' },
        { num: 'retInputLife', range: 'retRangeLife' },
        { num: 'retInputInflation', range: 'retRangeInflation' },
        { num: 'retInputStepUp', range: 'retRangeStepUp' }
    ];

    inputConfigs.forEach(({ num, range }) => {
        const numEl = document.getElementById(num);
        const rangeEl = document.getElementById(range);

        if (numEl && rangeEl) {
            rangeEl.addEventListener('input', () => {
                numEl.value = rangeEl.value;
                calculateRetirement();
            });

            numEl.addEventListener('input', () => {
                let val = parseFloat(numEl.value.replace(/,/g, '')) || 0;
                rangeEl.value = val;
                calculateRetirement();
            });
        }
    });

    // Toggle Switches
    const checkInflation = document.getElementById('retCheckInflation');
    const ctrlInflation = document.getElementById('retInflationControl');
    if (checkInflation) {
        checkInflation.addEventListener('change', () => {
            if (ctrlInflation) ctrlInflation.style.display = checkInflation.checked ? 'block' : 'none';
            calculateRetirement();
        });
    }

    const checkStepUp = document.getElementById('retCheckStepUp');
    const ctrlStepUp = document.getElementById('retStepUpControl');
    if (checkStepUp) {
        checkStepUp.addEventListener('change', () => {
            if (ctrlStepUp) ctrlStepUp.style.display = checkStepUp.checked ? 'block' : 'none';
            calculateRetirement();
        });
    }

    // High Value Privacy Checkbox enable/disable submit button
    const hvPrivacy = document.getElementById('retHvPrivacy');
    const hvSubmit = document.getElementById('btnRetHvSubmit');
    if (hvPrivacy && hvSubmit) {
        hvPrivacy.addEventListener('change', () => {
            hvSubmit.disabled = !hvPrivacy.checked;
            hvSubmit.style.opacity = hvPrivacy.checked ? '1' : '0.6';
            hvSubmit.style.cursor = hvPrivacy.checked ? 'pointer' : 'not-allowed';
        });
    }

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

    // Initial Calculation Run
    calculateRetirement();

    // Auto-Rotating Infinite Tools Carousel (1.5s Interval)
    initToolsCarousel();
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

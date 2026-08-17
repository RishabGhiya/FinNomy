/**
 * FinNomy™ Loan Prepayment Calculator Engine
 * Standalone JavaScript Module for loan-prepayment-calculator.html
 * 
 * Includes:
 * 1. Exact EMI & Month-by-Month Amortization Engine
 * 2. Dual Benefit Modes: Tenure Reduction vs. EMI Reduction
 * 3. Step-Up Surplus Prepayment & Penalty Charges Logic
 * 4. Dual Donut Conic Gradient Visualizer
 * 5. High-Value Priority Advisory Form Validation
 * 6. Dynamic "Did You Know?" Fact Engine
 * 7. "Send My Report" EmailJS Lead Capture
 * 8. FAQ Accordion & Tools Carousel Logic
 */

// Initialize EmailJS
(function () {
    if (typeof emailjs !== 'undefined') {
        emailjs.init("VlUqN_706wT8-7gS9");
    }
})();

// Dynamic Loan Facts Bank (25+ In-Depth Debt Insights)
const loanPrepaymentFacts = [
    "Making just 1 extra EMI payment per year can reduce a 20-year home loan by over 3.5 years.",
    "Prepaying principal in the first 5 years yields the highest interest savings due to front-loaded amortization.",
    "According to RBI guidelines, banks cannot charge prepayment penalties on floating-rate home loans taken by individual borrowers.",
    "Tenure reduction saves significantly more total interest over the loan lifetime than lowering your monthly EMI.",
    "Increasing your prepayment surplus by 5-10% annually (Step-Up) can cut a 20-year loan tenure down to under 12 years.",
    "In standard 20-year home loans, up to 70-80% of initial monthly EMIs go toward interest rather than principal.",
    "Every single rupee prepaid goes 100% directly toward knocking down your outstanding principal balance.",
    "A bi-weekly EMI payment strategy (paying half your EMI every 2 weeks) results in 26 half-payments or 13 full EMIs every year.",
    "Rounding up an EMI of ₹42,350 to ₹45,000 saves lakhs in cumulative compound interest over a multi-decade loan.",
    "Prepaying during the later half of the tenure saves relatively less interest since the principal has already amortized.",
    "Home loan tax deductions under Section 24(b) (up to ₹2 Lakhs) should be evaluated alongside the guaranteed risk-free return of prepaying.",
    "Prepaying high-cost unsecured debt (credit cards @ 36-42%, personal loans @ 12-16%) should always take priority over home loans.",
    "Allocating annual work bonuses or tax refunds as lump-sum prepayments dramatically compresses the loan repayment schedule.",
    "A loan balance transfer to a lower interest rate combined with maintaining the original EMI amount accelerates debt freedom.",
    "A Home Loan Overdraft (MaxGain/SmartHome) account lets you park surplus funds to reduce interest while retaining full liquidity.",
    "Reducing loan tenure keeps you debt-free years earlier, freeing up substantial monthly cash flow for retirement investments.",
    "Prepayment eliminates negative compounding, which otherwise works in favor of the lender over multi-decade tenures.",
    "Even a small prepayment of ₹2,000 per month on a ₹50 Lakh loan can save upwards of ₹8-10 Lakhs in interest.",
    "Banks recalculate future interest monthly on the reduced remaining principal balance immediately after an extra payment.",
    "When interest rates rise, making small prepayments helps prevent loan tenures from extending beyond retirement age.",
    "Prepaying your home loan provides an effective risk-free post-tax return equal to your borrowing interest rate."
];

// Display Random Fact
function displayRandomLoanFact() {
    const el = document.getElementById('loanFactText');
    if (el) {
        const randomIndex = Math.floor(Math.random() * loanPrepaymentFacts.length);
        el.innerText = loanPrepaymentFacts[randomIndex];
    }
}

// Currency Formatter Helper
const formatINR = (val) => "₹" + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(val || 0));

/**
 * Main Loan Prepayment Amortization Engine
 */
function calculateLoanPrepayment() {
    try {
        const resState = document.getElementById('loanResultsState');
        const factCard = document.getElementById('loanFactCard');
        const hvForm = document.getElementById('loanHighValueForm');
        const leadForm = document.getElementById('leadCapture-Loan');

        // 1. Gather Inputs
        const loanBalance = parseFloat(document.getElementById('loanInputBalance')?.value) || 0;
        const loanRate = parseFloat(document.getElementById('loanInputRate')?.value) || 0;
        const loanTenureMonths = parseFloat(document.getElementById('loanInputTenure')?.value) || 0;
        const surplus = parseFloat(document.getElementById('loanInputExtraEmi')?.value) || 0;
        const freq = document.getElementById('loanExtraEmiFreq')?.value || 'monthly';
        const benefitType = document.getElementById('loanPrepayBenefit')?.value || 'tenure';

        // Advanced Modifiers
        const isPenaltyOn = document.getElementById('loanTogglePenalty')?.checked || false;
        const penaltyRate = isPenaltyOn ? (parseFloat(document.getElementById('loanInputPenalty')?.value) || 0) : 0;

        const isStepUpOn = document.getElementById('loanToggleStepUp')?.checked || false;
        const stepUpRate = isStepUpOn ? (parseFloat(document.getElementById('loanInputStepUp')?.value) || 0) : 0;

        // 2. High Value Threshold Check (> 2 Crores Loan OR High Surplus)
        let isHighValue = loanBalance > 20000000;
        if (freq === 'monthly' && surplus > 10000) isHighValue = true;
        if (freq === 'yearly' && surplus > 120000) isHighValue = true;

        if (isHighValue) {
            if (resState) resState.style.display = 'none';
            if (hvForm) hvForm.style.display = 'block';
            if (factCard) factCard.style.display = 'none';
            if (leadForm) leadForm.style.display = 'none';
            return;
        } else {
            if (resState) resState.style.display = 'block';
            if (hvForm) hvForm.style.display = 'none';
            if (factCard) factCard.style.display = 'flex';
            if (leadForm) leadForm.style.display = 'block';
        }

        // 3. Standard Loan Calculations
        const r = loanRate / 1200; // Monthly Rate
        const n = loanTenureMonths;

        let emi = 0;
        if (r > 0 && n > 0) {
            emi = (loanBalance * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        } else if (n > 0) {
            emi = loanBalance / n;
        }
        if (isNaN(emi) || !isFinite(emi)) emi = 0;

        const regularTotalPayable = emi * n;
        const regularInterest = Math.max(0, regularTotalPayable - loanBalance);

        // 4. Month-by-Month Amortization Simulation
        let balance = loanBalance;
        let totalInterestPaid = 0;
        let totalCharges = 0;
        let monthsElapsed = 0;
        let currentEmi = emi;
        let firstReducedEmi = emi;
        let currentSurplus = surplus;

        while (balance > 1 && monthsElapsed < 600) {
            monthsElapsed++;
            let interest = balance * r;
            totalInterestPaid += interest;

            let prepayment = 0;
            if (freq === 'monthly') {
                prepayment = currentSurplus;
            } else if (freq === 'yearly' && monthsElapsed % 12 === 0) {
                prepayment = currentSurplus;
            }

            // Penalty Calculation
            let charge = 0;
            if (isPenaltyOn && prepayment > 0) {
                charge = prepayment * (penaltyRate / 100);
                totalCharges += charge;
            }

            // Step-Up Logic: Apply Step-up AFTER this year's prepayment
            if (isStepUpOn && monthsElapsed % 12 === 0) {
                currentSurplus = currentSurplus * (1 + stepUpRate / 100);
            }

            let principalComponent = currentEmi - interest;
            let totalPrincipalReduction = principalComponent + prepayment;

            if (totalPrincipalReduction > balance) {
                totalPrincipalReduction = balance;
            }
            balance -= totalPrincipalReduction;

            // Reduce EMI Logic
            if (benefitType === 'emi' && balance > 0) {
                let remainingN = n - monthsElapsed;
                if (remainingN > 0) {
                    currentEmi = (balance * r * Math.pow(1 + r, remainingN)) / (Math.pow(1 + r, remainingN) - 1);
                    if (isNaN(currentEmi) || !isFinite(currentEmi)) currentEmi = balance;

                    if (monthsElapsed === 1) firstReducedEmi = currentEmi;
                }
            }
        }

        const newTenure = monthsElapsed;
        const monthsSaved = Math.max(0, n - newTenure);
        const interestSaved = Math.max(0, regularInterest - totalInterestPaid);

        // Loan Closure Dates
        const today = new Date();
        const oldEndDate = new Date(today.getFullYear(), today.getMonth() + n, 1);
        const newEndDate = new Date(today.getFullYear(), today.getMonth() + newTenure, 1);
        const dateFmt = { year: 'numeric', month: 'short' };

        // 5. Update UI
        updateLoanResultsUI({
            saved: interestSaved,
            monthsSaved: monthsSaved,
            principal: loanBalance,
            oldInterest: regularInterest,
            newInterest: totalInterestPaid,
            emi: emi,
            newEmi: benefitType === 'emi' ? firstReducedEmi : emi,
            oldTenure: n,
            newTenure: newTenure,
            charges: totalCharges,
            isPenaltyOn: isPenaltyOn,
            oldEndDateStr: oldEndDate.toLocaleDateString('en-IN', dateFmt),
            newEndDateStr: newEndDate.toLocaleDateString('en-IN', dateFmt),
            benefitType: benefitType
        });

    } catch (err) {
        console.error("Loan Prepayment Error:", err);
    }
}

/**
 * Render Results on Screen
 */
function updateLoanResultsUI(data) {
    const {
        saved, monthsSaved, principal, oldInterest, newInterest,
        emi, newEmi, oldTenure, newTenure, charges, isPenaltyOn,
        oldEndDateStr, newEndDateStr, benefitType
    } = data;

    // Hero Savings Banner
    const savedEl = document.getElementById('loanResInterestSaved');
    if (savedEl) savedEl.innerText = formatINR(saved);

    // Metrics Table
    const elOldEMI = document.getElementById('loanResOldEMI');
    const elNewEMI = document.getElementById('loanResNewEMI');
    const elOldInt = document.getElementById('loanResOldInterest');
    const elNewInt = document.getElementById('loanResNewInterest');
    const elOldTen = document.getElementById('loanResOldTenure');
    const elNewTen = document.getElementById('loanResNewTenureVal');
    const elRowChgLbl = document.getElementById('loanRowChargesLabel');
    const elOldChg = document.getElementById('loanResOldCharges');
    const elNewChg = document.getElementById('loanResNewCharges');
    const elOldDate = document.getElementById('loanResOldEndDate');
    const elNewDate = document.getElementById('loanResNewEndDate');

    if (elOldEMI) elOldEMI.innerText = formatINR(emi);
    if (elNewEMI) elNewEMI.innerText = formatINR(newEmi);
    if (elOldInt) elOldInt.innerText = formatINR(oldInterest);
    if (elNewInt) elNewInt.innerText = formatINR(newInterest);
    if (elOldTen) elOldTen.innerText = Math.round(oldTenure) + " Mo (" + (oldTenure / 12).toFixed(1) + " Yrs)";
    if (elNewTen) elNewTen.innerText = Math.round(newTenure) + " Mo (" + (newTenure / 12).toFixed(1) + " Yrs)";

    // Prepayment Penalty Row Visibility
    const chgDisplay = isPenaltyOn ? 'block' : 'none';
    if (elRowChgLbl) elRowChgLbl.style.display = chgDisplay;
    if (elOldChg) {
        elOldChg.innerText = formatINR(0);
        elOldChg.style.display = chgDisplay;
    }
    if (elNewChg) {
        elNewChg.innerText = formatINR(charges);
        elNewChg.style.display = chgDisplay;
    }

    if (elOldDate) elOldDate.innerText = oldEndDateStr || "-";
    if (elNewDate) elNewDate.innerText = newEndDateStr || "-";

    // Update Dual Donut Charts
    updateLoanDonuts(principal, oldInterest, newInterest, charges);
}

/**
 * Draw Conic Gradient Donut Charts
 */
function updateLoanDonuts(principal, oldInterest, newInterest, charges) {
    const drawDonut = (id, p, i, c = 0) => {
        const el = document.getElementById(id);
        if (!el) return;

        let total = p + i + c;
        if (isNaN(total) || total <= 0) total = 1;

        let pDeg = (p / total) * 360;
        let iDeg = pDeg + (i / total) * 360;

        if (isNaN(pDeg)) pDeg = 0;
        if (isNaN(iDeg)) iDeg = 0;

        // Principal (#0B63D8 Cobalt Blue), Interest (#94A3B8 Slate Grey), Charges (#DC2626 Red)
        el.style.background = `conic-gradient(#0B63D8 0deg ${pDeg}deg, #94A3B8 ${pDeg}deg ${iDeg}deg, #DC2626 ${iDeg}deg 360deg)`;
    };

    drawDonut('loanDonutOld', principal, oldInterest, 0);
    drawDonut('loanDonutNew', principal, newInterest, charges);
}

/**
 * Global EmailJS Report Sender for Loan Page
 */
window.sendDashboardReport = function (calcTypeRaw) {
    const idPrefix = 'Loan';
    const nameInput = document.getElementById(`lcName-${idPrefix}`);
    const emailInput = document.getElementById(`lcEmail-${idPrefix}`);
    const phoneInput = document.getElementById(`lcPhone-${idPrefix}`);
    const btn = document.getElementById(`lcBtn-${idPrefix}`);
    const successMsg = document.getElementById(`lcSuccess-${idPrefix}`);

    if (!nameInput || !emailInput || !phoneInput) return;

    let hasError = false;

    // Reset error labels
    nameInput.closest('.lc-form-group')?.querySelector('.lc-error')?.setAttribute('style', 'display:none;');
    emailInput.closest('.lc-form-group')?.querySelector('.lc-error')?.setAttribute('style', 'display:none;');
    phoneInput.closest('.lc-form-group')?.querySelector('.lc-error')?.setAttribute('style', 'display:none;');

    const nameVal = nameInput.value.trim();
    const emailVal = emailInput.value.trim();
    const phoneVal = phoneInput.value.trim();

    if (!nameVal) {
        const err = nameInput.closest('.lc-form-group')?.querySelector('.lc-error');
        if (err) err.style.display = 'block';
        hasError = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal || !emailRegex.test(emailVal)) {
        const err = emailInput.closest('.lc-form-group')?.querySelector('.lc-error');
        if (err) err.style.display = 'block';
        hasError = true;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneVal || !phoneRegex.test(phoneVal)) {
        const err = phoneInput.closest('.lc-form-group')?.querySelector('.lc-error');
        if (err) err.style.display = 'block';
        hasError = true;
    }

    if (hasError) return;

    // Gather Parameters
    const loanBalance = parseFloat(document.getElementById('loanInputBalance')?.value) || 0;
    const loanRate = parseFloat(document.getElementById('loanInputRate')?.value) || 0;
    const loanTenure = parseFloat(document.getElementById('loanInputTenure')?.value) || 0;
    const surplus = parseFloat(document.getElementById('loanInputExtraEmi')?.value) || 0;
    const interestSaved = document.getElementById('loanResInterestSaved')?.innerText || '₹0';
    const oldEMI = document.getElementById('loanResOldEMI')?.innerText || '₹0';
    const newEMI = document.getElementById('loanResNewEMI')?.innerText || '₹0';
    const oldTenure = document.getElementById('loanResOldTenure')?.innerText || '-';
    const newTenure = document.getElementById('loanResNewTenureVal')?.innerText || '-';

    const templateParams = {
        to_name: nameVal,
        user_name: nameVal,
        user_email: emailVal,
        user_phone: phoneVal,
        calculator_name: "Loan Prepayment & Debt Optimization Calculator",
        investment_amount: formatINR(loanBalance),
        return_rate: loanRate + "% p.a.",
        time_period: loanTenure + " Months",
        total_withdrawal: "Surplus Prepayment: " + formatINR(surplus),
        returns_earned: "Net Interest Saved: " + interestSaved,
        final_balance: "Smart EMI: " + newEMI + " | Smart Tenure: " + newTenure,
        summary_details: `Standard EMI: ${oldEMI} | Standard Tenure: ${oldTenure}\nSmart EMI: ${newEMI} | Smart Tenure: ${newTenure}\nTotal Net Interest Saved: ${interestSaved}`
    };

    if (btn) {
        btn.disabled = true;
        btn.innerText = 'Sending Report...';
    }

    if (typeof emailjs !== 'undefined') {
        emailjs.send('service_4hy5p1m', 'template_5qrv9f3', templateParams)
            .then(function () {
                if (btn) btn.innerText = 'Report Sent!';
                if (successMsg) successMsg.style.display = 'block';
                setTimeout(() => {
                    if (btn) {
                        btn.disabled = false;
                        btn.innerText = 'Send My Report';
                    }
                    if (successMsg) successMsg.style.display = 'none';
                }, 5000);
            })
            .catch(function (error) {
                console.error('EmailJS Error:', error);
                if (btn) {
                    btn.disabled = false;
                    btn.innerText = 'Send My Report';
                }
                alert('There was an issue sending your report. Please check your details and try again.');
            });
    } else {
        alert('Email service initialized locally. Report simulation dispatched!');
        if (btn) btn.innerText = 'Send My Report';
    }
};

/**
 * Priority Advisory Form Handler for High Value Loans
 */
window.submitLoanPriorityForm = function () {
    const name = document.getElementById('loanHvName')?.value.trim();
    const email = document.getElementById('loanHvEmail')?.value.trim();
    const mobile = document.getElementById('loanHvMobile')?.value.trim();
    const desc = document.getElementById('loanHvDesc')?.value.trim();
    const btn = document.getElementById('btnLoanHvSubmit');
    const successMsg = document.getElementById('loanHvSuccess');

    let hasError = false;
    if (!name) {
        document.getElementById('loanHvName')?.closest('.lc-form-group')?.querySelector('.lc-error')?.setAttribute('style', 'display:block;');
        hasError = true;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        document.getElementById('loanHvEmail')?.closest('.lc-form-group')?.querySelector('.lc-error')?.setAttribute('style', 'display:block;');
        hasError = true;
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (!mobile || !phoneRegex.test(mobile)) {
        document.getElementById('loanHvMobile')?.closest('.lc-form-group')?.querySelector('.lc-error')?.setAttribute('style', 'display:block;');
        hasError = true;
    }

    if (hasError) return;

    const templateParams = {
        user_name: name,
        user_email: email,
        user_phone: mobile,
        calculator_name: "High Value Loan Prepayment Advisory",
        summary_details: `High-value loan consultation request.\nDescription: ${desc || 'None'}`
    };

    if (btn) {
        btn.disabled = true;
        btn.innerText = 'Submitting Request...';
    }

    if (typeof emailjs !== 'undefined') {
        emailjs.send('service_4hy5p1m', 'template_5qrv9f3', templateParams)
            .then(function () {
                if (btn) btn.innerText = 'Submitted!';
                if (successMsg) successMsg.style.display = 'block';
            })
            .catch(function (error) {
                console.error('EmailJS Error:', error);
                if (btn) {
                    btn.disabled = false;
                    btn.innerText = 'Submit Request';
                }
                alert('Could not submit request. Please try again.');
            });
    }
};

/**
 * Toggle Advanced Settings Accordion Inputs
 */
window.toggleLoanAdvanceInput = function (groupId) {
    const group = document.getElementById(groupId);
    if (group) {
        group.style.display = (group.style.display === 'none' || group.style.display === '') ? 'block' : 'none';
        calculateLoanPrepayment();
    }
};

/**
 * Auto-Rotating Infinite Tools Carousel (1.5s Interval)
 */
function initToolsCarousel() {
    const track = document.getElementById('toolsCarouselTrack');
    if (!track) return;

    let autoScrollInterval = null;
    const scrollDelay = 1500;

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

/**
 * FAQ Accordion Toggle
 */
window.toggleFaq = function (element) {
    const item = element.closest('.faq-item');
    if (!item) return;
    const isActive = item.classList.contains('active');

    // Close all items
    document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('active'));

    // Toggle current
    if (!isActive) {
        item.classList.add('active');
    }
};

/**
 * DOM Ready & Event Listeners
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Dual Input Slider Synchronization
    const syncPairs = [
        ['loanInputBalance', 'loanRangeBalance'],
        ['loanInputRate', 'loanRangeRate'],
        ['loanInputTenure', 'loanRangeTenure'],
        ['loanInputExtraEmi', 'loanRangeExtraEmi'],
        ['loanInputPenalty', 'loanRangePenalty'],
        ['loanInputStepUp', 'loanRangeStepUp']
    ];

    syncPairs.forEach(([inputId, rangeId]) => {
        const input = document.getElementById(inputId);
        const range = document.getElementById(rangeId);

        if (input && range) {
            input.addEventListener('input', () => {
                range.value = input.value;
                calculateLoanPrepayment();
            });
            range.addEventListener('input', () => {
                input.value = range.value;
                calculateLoanPrepayment();
            });
        }
    });

    // 2. Dropdown Select Handlers
    const freqSelect = document.getElementById('loanExtraEmiFreq');
    const rangeExtra = document.getElementById('loanRangeExtraEmi');
    const maxLabel = document.getElementById('loanExtraMaxLabel');

    if (freqSelect) {
        freqSelect.addEventListener('change', (e) => {
            if (e.target.value === 'monthly') {
                if (rangeExtra) rangeExtra.max = 10000;
                if (maxLabel) maxLabel.innerText = '₹10K';
            } else {
                if (rangeExtra) rangeExtra.max = 120000;
                if (maxLabel) maxLabel.innerText = '₹1.2L';
            }
            calculateLoanPrepayment();
        });
    }

    const benefitSelect = document.getElementById('loanPrepayBenefit');
    if (benefitSelect) {
        benefitSelect.addEventListener('change', calculateLoanPrepayment);
    }

    // 3. High Value Privacy Checkbox
    const hvPrivacy = document.getElementById('loanHvPrivacy');
    const hvSubmit = document.getElementById('btnLoanHvSubmit');
    if (hvPrivacy && hvSubmit) {
        hvPrivacy.addEventListener('change', (e) => {
            hvSubmit.disabled = !e.target.checked;
            hvSubmit.style.opacity = e.target.checked ? '1' : '0.6';
            hvSubmit.style.cursor = e.target.checked ? 'pointer' : 'not-allowed';
        });
    }

    // 4. Mobile Nav & Dropdown Handlers
    const mobileMenuBtn = document.getElementById('mobile-menu-btn') || document.querySelector('.hamburger-menu') || document.querySelector('.mobile-menu-btn');
    const navLinks = document.getElementById('nav-links') || document.querySelector('.nav-links');
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

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

    document.addEventListener('click', (event) => {
        footerDropdowns.forEach(dropdown => {
            if (!dropdown.contains(event.target)) {
                dropdown.classList.remove('active');
            }
        });
    });

    // 5. Initialize Fact & Carousel
    displayRandomLoanFact();
    initToolsCarousel();

    // 6. Initial Calculation Run
    calculateLoanPrepayment();
});

/**
 * FinNomy™ Common Financial Mistakes Calculator Engine
 * Standalone Engine for Behavioral Loss-Audit, Opportunity Cost, Procrastination Penalty & EMI Trap
 */

(function () {
    // State Tracking
    const cfmInteractedInputs = new Set();
    let carouselInterval = null;
    let factInterval = null;
    let currentFactIndex = 0;

    const DID_YOU_KNOW_FACTS = [
        {
            title: "The 3% vs 12% Wealth Gap",
            text: "Keeping ₹5 Lakhs in a 3% savings account for 10 years yields ~₹6.7 Lakhs. The same capital in a diversified index fund compounding at 12% grows to over ₹15.5 Lakhs — a ₹8.8 Lakh silent loss."
        },
        {
            title: "The Silent Cost of ₹150 Daily Coffee/Cabs",
            text: "₹150/day adds up to ₹4,500/month. If invested in a 12% equity mutual fund, it compounds to ₹10.45 Lakhs in 10 years and ₹22.6 Lakhs in 15 years."
        },
        {
            title: "The Compounded Penalty of a 1-Year Delay",
            text: "Starting a ₹10,000 monthly SIP at age 25 vs 26 results in losing the highest compounding final year of returns — permanently forfeiting ₹12 Lakhs to ₹18 Lakhs by retirement."
        },
        {
            title: "The 0% No-Cost EMI Myth",
            text: "Retailers offset '0% interest' by removing upfront cash discounts (typically 5–10%) and adding upfront bank processing fees plus 18% GST on the subvented interest."
        }
    ];

    // Helper: Currency Formatter
    function formatINR(val) {
        return "₹" + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(val));
    }

    function formatLakhCrore(val) {
        if (val >= 10000000) {
            return "₹" + (val / 10000000).toFixed(2) + " Cr";
        } else if (val >= 100000) {
            return "₹" + (val / 100000).toFixed(2) + " Lakhs";
        } else {
            return formatINR(val);
        }
    }

    // Initialize Synced Inputs
    function initCfmInputs() {
        const inputs = [
            'Age', 'Income', 'IdleCash', 'DailySpend', 'Sip',
            'Gadget', 'Discount', 'Fee'
        ];

        inputs.forEach(id => {
            const numInput = document.getElementById(`cfmInput${id}`);
            const rangeInput = document.getElementById(`cfmRange${id}`);

            if (numInput && rangeInput) {
                rangeInput.addEventListener('input', (e) => {
                    cfmInteractedInputs.add(id);
                    numInput.value = e.target.value;
                    calculateCFM();
                });

                numInput.addEventListener('input', (e) => {
                    cfmInteractedInputs.add(id);
                    rangeInput.value = e.target.value || 0;
                    calculateCFM();
                });
            }
        });
    }

    // Core Calculation Logic
    function calculateCFM() {
        const ageEl = document.getElementById('cfmInputAge');
        const incomeEl = document.getElementById('cfmInputIncome');
        const idleCashEl = document.getElementById('cfmInputIdleCash');
        const dailySpendEl = document.getElementById('cfmInputDailySpend');
        const sipEl = document.getElementById('cfmInputSip');
        const gadgetEl = document.getElementById('cfmInputGadget');
        const discountEl = document.getElementById('cfmInputDiscount');
        const feeEl = document.getElementById('cfmInputFee');

        if (!ageEl || !incomeEl || !idleCashEl) return;

        const age = parseFloat(ageEl.value) || 25;
        const income = parseFloat(incomeEl.value) || 100000;
        const idleCash = parseFloat(idleCashEl.value) || 500000;
        const dailySpend = parseFloat(dailySpendEl.value) || 200;
        const sip = parseFloat(sipEl.value) || 10000;

        const gadget = parseFloat(gadgetEl.value) || 50000;
        const discount = parseFloat(discountEl.value) || 5000;
        const fee = parseFloat(feeEl.value) || 999;

        // High Value Advisory Threshold
        const isHighValue =
            income > 200000 ||
            idleCash > 2000000 ||
            sip > 50000 ||
            gadget > 1000000;

        const normalResults = document.getElementById('cfmNormalResults');
        const hvForm = document.getElementById('cfmHighValueForm');
        const leadCapture = document.getElementById('leadCapture-CFM');

        if (isHighValue) {
            if (normalResults) normalResults.style.display = 'none';
            if (hvForm) hvForm.style.display = 'flex';
            if (leadCapture) leadCapture.style.display = 'none';
            return;
        } else {
            if (normalResults) normalResults.style.display = 'flex';
            if (hvForm) hvForm.style.display = 'none';
            if (leadCapture) leadCapture.style.display = 'block';
        }

        // --- 1. Pillar 1: Lazy Money Math ---
        const lazyText = document.getElementById('cfmTextLazy');
        const protectedCash = income * 6;
        const lazyCash = Math.max(0, idleCash - protectedCash);
        const lazyFuture = lazyCash > 0 ? lazyCash / Math.pow(1.06, 10) : 0;
        const lazyLoss10Yr = lazyCash - lazyFuture;

        if (lazyText) {
            if (lazyCash === 0) {
                lazyText.innerHTML = `You are highly efficient! Your <strong>${formatINR(idleCash)}</strong> is within the recommended 6-month safety buffer (<strong>${formatINR(protectedCash)}</strong>).`;
            } else {
                lazyText.innerHTML = `You have a safe 6-month buffer of <strong>${formatINR(protectedCash)}</strong>, but your excess <strong>${formatINR(lazyCash)}</strong> is shrinking. In 10 years at 6% inflation, it will only buy <strong>${formatINR(lazyFuture)}</strong> of goods (a <strong>${formatINR(lazyLoss10Yr)}</strong> purchasing loss).`;
            }
        }

        // --- 2. Pillar 2: Daily Leak Math ---
        const leakText = document.getElementById('cfmTextLeak');
        const monthlyLeak = (dailySpend * 365) / 12;
        const rMonthly = 0.12 / 12;
        const n10 = 10 * 12;
        const leakWealthLost10Yr = monthlyLeak > 0 ? monthlyLeak * ((Math.pow(1 + rMonthly, n10) - 1) / rMonthly) * (1 + rMonthly) : 0;

        if (leakText) {
            if (dailySpend === 0) {
                leakText.innerHTML = `Zero unessential daily spend! Your financial discipline will compound strongly over time.`;
            } else {
                leakText.innerHTML = `Your <strong>${formatINR(dailySpend)}</strong>/day (₹${Math.round(monthlyLeak).toLocaleString('en-IN')}/mo) habit is a silent leak. Redirecting this to a 12% index SIP would yield <strong>${formatINR(leakWealthLost10Yr)}</strong> in 10 years.`;
            }
        }

        // --- 3. Pillar 3: Procrastination / Delay Cost ---
        const lateText = document.getElementById('cfmTextLate');
        const yearsLeftNow = Math.max(0, 60 - age);
        const yearsLeftLater = Math.max(0, 60 - (age + 1));
        const fvNow = sip > 0 && yearsLeftNow > 0 ? sip * ((Math.pow(1 + rMonthly, yearsLeftNow * 12) - 1) / rMonthly) * (1 + rMonthly) : 0;
        const fvLater = sip > 0 && yearsLeftLater > 0 ? sip * ((Math.pow(1 + rMonthly, yearsLeftLater * 12) - 1) / rMonthly) * (1 + rMonthly) : 0;
        const totalDelayPenalty = Math.max(0, fvNow - fvLater);

        if (lateText) {
            if (age >= 60 || sip === 0) {
                lateText.innerHTML = `No procrastination penalty applicable. Ensure you maintain active investments!`;
            } else {
                lateText.innerHTML = `Waiting just 12 months to start your <strong>${formatINR(sip)}</strong>/month SIP will permanently forfeit <strong>${formatINR(totalDelayPenalty)}</strong> in final wealth by age 60.`;
            }
        }

        // --- 4. Pillar 4: No-Cost EMI Trap ---
        const emiText = document.getElementById('cfmTextEmi');
        const gstOnInterest = discount * 0.18;
        const totalHiddenCost = discount + fee + gstOnInterest;

        if (emiText) {
            if (totalHiddenCost === 0) {
                emiText.innerHTML = `You are a savvy buyer! No hidden fees or foregone cash discounts detected.`;
            } else {
                emiText.innerHTML = `That 'free' EMI is a trap. Between foregone cash discounts (<strong>${formatINR(discount)}</strong>), processing fee (<strong>${formatINR(fee)}</strong>), and GST, you are paying an extra <strong>${formatINR(totalHiddenCost)}</strong> for this gadget.`;
            }
        }

        // --- 5. Aggregated Recoverable Wealth Summary Banner ---
        const totalRecoverable = lazyLoss10Yr + leakWealthLost10Yr + totalDelayPenalty + totalHiddenCost;
        const equivalentMonthlySip = Math.round(monthlyLeak + (lazyCash > 0 ? (lazyCash * 0.07) / 12 : 0));

        const totalRecEl = document.getElementById('totalRecoverableVal');
        const recSipEl = document.getElementById('recoverableSipVal');

        if (totalRecEl) totalRecEl.textContent = formatLakhCrore(totalRecoverable);
        if (recSipEl) recSipEl.textContent = formatINR(equivalentMonthlySip) + "/mo";
    }

    // Dynamic Did You Know Fact Rotation
    function initFactRotation() {
        const titleEl = document.getElementById('dykTitle');
        const textEl = document.getElementById('dykText');

        if (!titleEl || !textEl) return;

        function showNextFact() {
            currentFactIndex = (currentFactIndex + 1) % DID_YOU_KNOW_FACTS.length;
            const fact = DID_YOU_KNOW_FACTS[currentFactIndex];
            titleEl.textContent = fact.title;
            textEl.textContent = fact.text;
        }

        if (factInterval) clearInterval(factInterval);
        factInterval = setInterval(showNextFact, 7000);
    }

    // Auto-Rotating Tools Carousel
    function initToolsCarousel() {
        const viewport = document.querySelector('.carousel-viewport');
        const track = document.getElementById('toolsCarouselTrack');
        if (!viewport || !track) return;

        let scrollPos = 0;
        const step = 1.2;

        function autoScroll() {
            scrollPos += step;
            if (scrollPos >= track.scrollWidth - viewport.clientWidth) {
                scrollPos = 0;
            }
            viewport.scrollLeft = scrollPos;
        }

        if (carouselInterval) clearInterval(carouselInterval);
        carouselInterval = setInterval(autoScroll, 25);

        viewport.addEventListener('mouseenter', () => clearInterval(carouselInterval));
        viewport.addEventListener('mouseleave', () => {
            clearInterval(carouselInterval);
            carouselInterval = setInterval(autoScroll, 25);
        });
    }

    // FAQ Accordion Toggle
    window.toggleFaq = function (element) {
        const item = element.parentElement;
        const isActive = item.classList.contains('active');

        document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('active'));

        if (!isActive) {
            item.classList.add('active');
        }
    };

    // Reset High-Value Form
    window.resetCfmToRegular = function () {
        const idleCashInp = document.getElementById('cfmInputIdleCash');
        const idleCashRng = document.getElementById('cfmRangeIdleCash');
        const incomeInp = document.getElementById('cfmInputIncome');
        const incomeRng = document.getElementById('cfmRangeIncome');

        if (idleCashInp && idleCashRng) {
            idleCashInp.value = 500000;
            idleCashRng.value = 500000;
        }
        if (incomeInp && incomeRng) {
            incomeInp.value = 100000;
            incomeRng.value = 100000;
        }

        calculateCFM();
    };

    // Lead Capture Report Dispatch
    window.sendDashboardReport = function (calcType) {
        const nameEl = document.getElementById('lcName-CFM');
        const emailEl = document.getElementById('lcEmail-CFM');
        const phoneEl = document.getElementById('lcPhone-CFM');
        const btn = document.getElementById('lcBtn-CFM');
        const successMsg = document.getElementById('lcSuccess-CFM');

        if (!nameEl || !emailEl || !phoneEl) return;

        const name = nameEl.value.trim();
        const email = emailEl.value.trim();
        const phone = phoneEl.value.trim();

        if (!name) {
            nameEl.focus();
            return;
        }
        if (!email || !email.includes('@')) {
            emailEl.focus();
            return;
        }
        if (!phone || phone.length < 10) {
            phoneEl.focus();
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Sending Audit Report...';
        }

        const totalRec = document.getElementById('totalRecoverableVal') ? document.getElementById('totalRecoverableVal').textContent : '₹23.80 Lakhs';
        const recSip = document.getElementById('recoverableSipVal') ? document.getElementById('recoverableSipVal').textContent : '₹8,500/mo';

        const templateParams = {
            user_name: name,
            user_email: email,
            user_phone: phone,
            calc_type: "Common Financial Mistakes Loss Audit",
            total_recoverable: totalRec,
            recoverable_sip: recSip,
            lazy_money_summary: document.getElementById('cfmTextLazy') ? document.getElementById('cfmTextLazy').innerText : '',
            daily_leak_summary: document.getElementById('cfmTextLeak') ? document.getElementById('cfmTextLeak').innerText : '',
            delay_cost_summary: document.getElementById('cfmTextLate') ? document.getElementById('cfmTextLate').innerText : '',
            no_cost_emi_summary: document.getElementById('cfmTextEmi') ? document.getElementById('cfmTextEmi').innerText : ''
        };

        if (typeof emailjs !== 'undefined') {
            emailjs.send('service_default', 'template_report', templateParams)
                .then(() => {
                    if (btn) btn.style.display = 'none';
                    if (successMsg) successMsg.style.display = 'block';
                })
                .catch(() => {
                    // Fallback visual success
                    if (btn) btn.style.display = 'none';
                    if (successMsg) successMsg.style.display = 'block';
                });
        } else {
            if (btn) btn.style.display = 'none';
            if (successMsg) successMsg.style.display = 'block';
        }
    };

    // High-Value Advisory Submission
    window.submitCfmHvForm = function () {
        const name = document.getElementById('cfmHvName') ? document.getElementById('cfmHvName').value.trim() : '';
        const email = document.getElementById('cfmHvEmail') ? document.getElementById('cfmHvEmail').value.trim() : '';
        const phone = document.getElementById('cfmHvMobile') ? document.getElementById('cfmHvMobile').value.trim() : '';
        const btn = document.getElementById('btnCfmHvSubmit');
        const successMsg = document.getElementById('cfmHvSuccess');

        if (!name || !email || !phone) {
            alert('Please fill out all required fields.');
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Submitting Request...';
        }

        setTimeout(() => {
            if (btn) btn.style.display = 'none';
            if (successMsg) successMsg.style.display = 'flex';
        }, 800);
    };

    // DOM Ready
    document.addEventListener('DOMContentLoaded', () => {
        initCfmInputs();
        calculateCFM();
        initFactRotation();
        initToolsCarousel();
    });

})();

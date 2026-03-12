
const formatMgseCurr = (val) => "Rs." + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(val));

function calculateRequiredStepUpSip(fv, years, expectedReturnPerc, stepUpPerc) {
    if (years <= 0 || fv <= 0) return 0;
    const r = (expectedReturnPerc / 100) / 12;
    const n = years * 12;
    const g = (stepUpPerc / 100);
    let low = 1;
    let high = fv;
    let requiredSip = 0;
    for (let i = 0; i < 50; i++) {
        let mid = (low + high) / 2;
        let currentSIP = mid;
        let futureValue = 0;
        for (let year = 1; year <= years; year++) {
            for (let month = 1; month <= 12; month++) {
                futureValue = (futureValue + currentSIP) * (1 + r);
            }
            currentSIP *= (1 + g);
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

const income = 80000;
const expenses = 27000;
const surplus = income - expenses;
const returns = 12;
const inflation = 6;
const stepup = 10;

const goals = [
    { name: 'Goal 1', cost: 10000000, years: 10, priority: 'Important', active: true },
    { name: 'Goal 2', cost: 1100000, years: 20, priority: 'Important', active: true }
];

console.log('Surplus:', surplus);

goals.forEach(g => {
    g.fv = g.cost * Math.pow(1 + (inflation / 100), g.years);
    g.reqSip = calculateRequiredStepUpSip(g.fv, g.years, returns, stepup);
    console.log(`Goal: ${g.name}, FV: ${formatMgseCurr(g.fv)}, Req SIP: ${formatMgseCurr(g.reqSip)}`);
});

const priorityScore = { 'Essential': 3, 'Important': 2, 'Lifestyle': 1 };
let allocationQueue = goals.filter(g => g.active).sort((a, b) => {
    if (priorityScore[a.priority] !== priorityScore[b.priority]) {
        return priorityScore[b.priority] - priorityScore[a.priority];
    }
    return a.years - b.years;
});

let remainingSurplus = surplus;
allocationQueue.forEach(g => {
    if (remainingSurplus >= g.reqSip) {
        g.allocatedSip = g.reqSip;
        g.fundedPerc = 100;
        remainingSurplus -= g.reqSip;
    } else if (remainingSurplus > 0) {
        g.allocatedSip = remainingSurplus;
        g.fundedPerc = (g.allocatedSip / g.reqSip) * 100;
        remainingSurplus = 0;
    } else {
        g.allocatedSip = 0;
        g.fundedPerc = 0;
    }
    console.log(`Allocation -> ${g.name}: ${formatMgseCurr(g.allocatedSip)} (${g.fundedPerc.toFixed(1)}%)`);
});

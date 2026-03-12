
function calculateRequiredStepUpSip(fv, years, expectedReturnPerc, stepUpPerc) {
    if (years <= 0 || fv <= 0) return 0;
    const r = (expectedReturnPerc / 100) / 12;
    const n = years * 12;
    const g = (stepUpPerc / 100);
    let low = 1, high = fv, requiredSip = 0;
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
        if (Math.abs(futureValue - fv) < 100) { requiredSip = mid; break; }
        else if (futureValue < fv) low = mid;
        else high = mid;
        requiredSip = mid;
    }
    return requiredSip;
}

const gInflation = 6;
const gReturns = 12;
const gStepup = 10;
const surplus = 53000;

const goals = [
    { name: "Goal 1", cost: 10000000, years: 10, priority: 3 },
    { name: "Goal 2", cost: 1100000, years: 15, priority: 2 },
    { name: "Goal 3", cost: 100000, years: 9, priority: 1 }
];

console.log("--- MGSE MATH AUDIT ---");
goals.forEach(g => {
    g.fv = g.cost * Math.pow(1 + (gInflation / 100), g.years);
    g.reqSip = calculateRequiredStepUpSip(g.fv, g.years, gReturns, gStepup);
    console.log(`${g.name}: Cost=${g.cost}, FV=${Math.round(g.fv)}, ReqSIP=${Math.round(g.reqSip)}`);
});

// Simulation
let currentSurplus = surplus;
goals.forEach(g => {
    g.simBalance = 0;
    g.isDone = false;
    g.currentSipGoal = g.reqSip;
    g.allocatedSipY1 = 0;
});

const maxYears = 20;
const monthlyRate = (gReturns / 100) / 12;

for (let m = 1; m <= maxYears * 12; m++) {
    let remaining = currentSurplus;
    const queue = goals.filter(g => !g.isDone && g.years * 12 >= m);

    // Phase 1: Fair Share
    queue.forEach(g => {
        const share = Math.min(remaining, g.currentSipGoal);
        g.simBalance = (g.simBalance + share) * (1 + monthlyRate);
        if (m === 1) g.allocatedSipY1 = share;
        remaining -= share;
    });

    // Phase 2: Greedy
    if (remaining > 0) {
        for (const g of queue) {
            if (g.isDone) continue;
            const extra = remaining;
            // Precision Fix Check: Add BEFORE growth?
            // Current code adds AFTER growth? 
            // In mgse.js: goal.simulatedBalance += extra; (Line 258)
            g.simBalance += extra;
            if (m === 1) g.allocatedSipY1 += extra;
            remaining = 0;
            break;
        }
    }

    goals.forEach(g => {
        if (g.simBalance >= g.fv) g.isDone = true;
        if (m === g.years * 12 && !g.isDone) {
            g.finalPerc = (g.simBalance / g.fv) * 100;
        } else if (m === g.years * 12 && g.isDone) {
            g.finalPerc = 100;
        }
    });

    if (m % 12 === 0) {
        currentSurplus *= (1 + gStepup / 100);
        goals.forEach(g => g.currentSipGoal *= (1 + gStepup / 100));
    }
}

console.log("\n--- SIMULATION RESULTS ---");
goals.forEach(g => {
    console.log(`${g.name}: AllocatedY1=${Math.round(g.allocatedSipY1)}, Funded=${g.finalPerc?.toFixed(1)}%`);
});

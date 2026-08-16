/**
 * FinNomy ITR Computation Generator Engine
 * 100% Client-Side In-Memory Execution — No data sent to any server.
 */
(function() {
"use strict";

/* =========================================================================
   1. STATUTORY INDIAN TAX COMPUTATION ENGINE (AY 2024-25, 2025-26, 2026-27)
   ========================================================================= */
const TaxEngine = {
  // Assessment Years supported
  AY_CONFIGS: {
    "2024-25": {
      fy: "2023-24",
      newRegime: {
        stdDeductionSalary: 50000,
        stdDeductionFamilyPension: 15000,
        rebate87ALimit: 700000,
        rebate87AMax: 25000,
        slabs: [
          { upTo: 300000, rate: 0.00 },
          { upTo: 600000, rate: 0.05 },
          { upTo: 900000, rate: 0.10 },
          { upTo: 1200000, rate: 0.15 },
          { upTo: 1500000, rate: 0.20 },
          { upTo: Infinity, rate: 0.30 }
        ],
        maxSurchargeRate: 0.25 // Capped at 25% under 115BAC
      },
      oldRegime: {
        stdDeductionSalary: 50000,
        stdDeductionFamilyPension: 15000,
        rebate87ALimit: 500000,
        rebate87AMax: 12500,
        slabsIndividual: [
          { upTo: 250000, rate: 0.00 },
          { upTo: 500000, rate: 0.05 },
          { upTo: 1000000, rate: 0.20 },
          { upTo: Infinity, rate: 0.30 }
        ],
        slabsSenior: [
          { upTo: 300000, rate: 0.00 },
          { upTo: 500000, rate: 0.05 },
          { upTo: 1000000, rate: 0.20 },
          { upTo: Infinity, rate: 0.30 }
        ],
        slabsSuperSenior: [
          { upTo: 500000, rate: 0.00 },
          { upTo: 1000000, rate: 0.20 },
          { upTo: Infinity, rate: 0.30 }
        ],
        maxSurchargeRate: 0.37
      }
    },
    "2025-26": {
      fy: "2024-25",
      newRegime: {
        stdDeductionSalary: 75000, // Budget 2024 enhancement
        stdDeductionFamilyPension: 25000,
        rebate87ALimit: 700000,
        rebate87AMax: 25000,
        slabs: [
          { upTo: 300000, rate: 0.00 },
          { upTo: 700000, rate: 0.05 }, // Budget 2024 revised slab: 3L - 7L @ 5%
          { upTo: 1000000, rate: 0.10 }, // 7L - 10L @ 10%
          { upTo: 1200000, rate: 0.15 }, // 10L - 12L @ 15%
          { upTo: 1500000, rate: 0.20 }, // 12L - 15L @ 20%
          { upTo: Infinity, rate: 0.30 }  // Above 15L @ 30%
        ],
        maxSurchargeRate: 0.25
      },
      oldRegime: {
        stdDeductionSalary: 50000,
        stdDeductionFamilyPension: 15000,
        rebate87ALimit: 500000,
        rebate87AMax: 12500,
        slabsIndividual: [
          { upTo: 250000, rate: 0.00 },
          { upTo: 500000, rate: 0.05 },
          { upTo: 1000000, rate: 0.20 },
          { upTo: Infinity, rate: 0.30 }
        ],
        slabsSenior: [
          { upTo: 300000, rate: 0.00 },
          { upTo: 500000, rate: 0.05 },
          { upTo: 1000000, rate: 0.20 },
          { upTo: Infinity, rate: 0.30 }
        ],
        slabsSuperSenior: [
          { upTo: 500000, rate: 0.00 },
          { upTo: 1000000, rate: 0.20 },
          { upTo: Infinity, rate: 0.30 }
        ],
        maxSurchargeRate: 0.37
      }
    },
    "2026-27": {
      fy: "2025-26",
      newRegime: {
        stdDeductionSalary: 75000,
        stdDeductionFamilyPension: 25000,
        rebate87ALimit: 700000,
        rebate87AMax: 25000,
        slabs: [
          { upTo: 300000, rate: 0.00 },
          { upTo: 700000, rate: 0.05 },
          { upTo: 1000000, rate: 0.10 },
          { upTo: 1200000, rate: 0.15 },
          { upTo: 1500000, rate: 0.20 },
          { upTo: Infinity, rate: 0.30 }
        ],
        maxSurchargeRate: 0.25
      },
      oldRegime: {
        stdDeductionSalary: 50000,
        stdDeductionFamilyPension: 15000,
        rebate87ALimit: 500000,
        rebate87AMax: 12500,
        slabsIndividual: [
          { upTo: 250000, rate: 0.00 },
          { upTo: 500000, rate: 0.05 },
          { upTo: 1000000, rate: 0.20 },
          { upTo: Infinity, rate: 0.30 }
        ],
        slabsSenior: [
          { upTo: 300000, rate: 0.00 },
          { upTo: 500000, rate: 0.05 },
          { upTo: 1000000, rate: 0.20 },
          { upTo: Infinity, rate: 0.30 }
        ],
        slabsSuperSenior: [
          { upTo: 500000, rate: 0.00 },
          { upTo: 1000000, rate: 0.20 },
          { upTo: Infinity, rate: 0.30 }
        ],
        maxSurchargeRate: 0.37
      }
    }
  },

  getAyKey(rawAy) {
    if (!rawAy) return "2025-26";
    const m = String(rawAy).match(/20(\d{2})/);
    if (!m) return "2025-26";
    const startYr = parseInt(m[1], 10);
    const endYr = startYr + 1;
    const key = `20${startYr}-${endYr < 10 ? '0' + endYr : endYr}`;
    return this.AY_CONFIGS[key] ? key : "2025-26";
  },

  round10(val) {
    if (val === null || val === undefined || isNaN(val)) return 0;
    return Math.round(val / 10) * 10;
  },

  computeSlabTax(taxableNormalIncome, slabs) {
    let remaining = Math.max(0, taxableNormalIncome);
    let totalTax = 0;
    let prevLimit = 0;
    const slabBreakdown = [];

    for (const slab of slabs) {
      if (remaining <= 0) break;
      const slabChunk = Math.min(remaining, slab.upTo - prevLimit);
      const taxForChunk = slabChunk * slab.rate;
      if (slabChunk > 0) {
        slabBreakdown.push({
          from: prevLimit,
          to: slab.upTo === Infinity ? null : slab.upTo,
          rate: Math.round(slab.rate * 100),
          amount: slabChunk,
          tax: taxForChunk
        });
      }
      totalTax += taxForChunk;
      remaining -= slabChunk;
      prevLimit = slab.upTo;
      if (slab.upTo === Infinity) break;
    }
    return { totalTax: Math.round(totalTax), slabBreakdown };
  },

  computeSurcharge(normalTax, specialTax, totalTaxableIncome, maxRate = 0.37) {
    const totalTax = normalTax + specialTax;
    let surchargeRate = 0;
    let threshold = 0;

    if (totalTaxableIncome > 50000000) {
      surchargeRate = Math.min(0.37, maxRate);
      threshold = 50000000;
    } else if (totalTaxableIncome > 20000000) {
      surchargeRate = Math.min(0.25, maxRate);
      threshold = 20000000;
    } else if (totalTaxableIncome > 10000000) {
      surchargeRate = 0.15;
      threshold = 10000000;
    } else if (totalTaxableIncome > 5000000) {
      surchargeRate = 0.10;
      threshold = 5000000;
    }

    if (surchargeRate === 0) return { surcharge: 0, marginalRelief: 0, surchargeRate: 0 };

    let rawSurcharge = totalTax * surchargeRate;
    let marginalRelief = 0;
    if (threshold > 0) {
      const extraIncome = totalTaxableIncome - threshold;
      const taxAtThreshold = totalTax * (threshold / totalTaxableIncome);
      const maxAllowableTotal = taxAtThreshold + extraIncome;
      const currentTotal = totalTax + rawSurcharge;
      if (currentTotal > maxAllowableTotal) {
        marginalRelief = Math.max(0, currentTotal - maxAllowableTotal);
      }
    }

    const effectiveSurcharge = Math.max(0, rawSurcharge - marginalRelief);
    return { surcharge: effectiveSurcharge, marginalRelief, surchargeRate: Math.round(surchargeRate * 100) };
  },

  compute(incomeInput, deductionsInput, taxesPaidInput, options = {}) {
    const ayKey = this.getAyKey(options.assessmentYear);
    const ayConfig = this.AY_CONFIGS[ayKey];
    const regime = (options.regime || "new").toLowerCase();
    const ageGroup = options.ageGroup || "individual";

    // 1. Salary Head
    let grossSalary = Number(incomeInput.salaryGross) || 0;
    const allowancesExempt = Number(incomeInput.salaryAllowancesExempt) || 0;
    const professionalTax = Number(incomeInput.salaryProfessionalTax) || 0;

    let stdDeduction = 0;
    if (regime === "new") {
      stdDeduction = grossSalary > 0 ? Math.min(grossSalary, ayConfig.newRegime.stdDeductionSalary) : 0;
    } else {
      stdDeduction = grossSalary > 0 ? Math.min(grossSalary, ayConfig.oldRegime.stdDeductionSalary) : 0;
    }
    if (incomeInput.salaryStdDeduction !== undefined && incomeInput.salaryStdDeduction !== null && Number(incomeInput.salaryStdDeduction) >= 0 && incomeInput.salaryStdDeduction !== "") {
      stdDeduction = Number(incomeInput.salaryStdDeduction);
    }

    let netSalary = 0;
    if (grossSalary > 0) {
      netSalary = Math.max(0, grossSalary - allowancesExempt - stdDeduction - professionalTax);
    } else if (incomeInput.salaryNet !== undefined && incomeInput.salaryNet !== null && Number(incomeInput.salaryNet) > 0) {
      netSalary = Number(incomeInput.salaryNet);
      grossSalary = netSalary + stdDeduction;
    }

    // 2. House Property Head
    const hpRentalGross = Number(incomeInput.hpRentalGross) || 0;
    const hpTaxesPaid = Number(incomeInput.hpTaxesPaid) || 0;
    const hpInterestSelf = Number(incomeInput.hpInterestLoan24b) || Number(incomeInput.hpInterestSelf) || 0;
    const hpInterestLetOut = Number(incomeInput.hpInterestLetOut) || 0;

    let netHouseProperty = 0;
    if (incomeInput.hpNet !== undefined && incomeInput.hpNet !== null && incomeInput.hpNet !== "") {
      netHouseProperty = Number(incomeInput.hpNet);
    } else {
      let nav = Math.max(0, hpRentalGross - hpTaxesPaid);
      let stdDed24a = nav * 0.30;
      let letOutIncome = nav - stdDed24a - hpInterestLetOut;
      let selfLoss = Math.min(200000, hpInterestSelf);

      if (regime === "new") {
        netHouseProperty = letOutIncome;
      } else {
        netHouseProperty = letOutIncome - selfLoss;
      }
    }
    if (netHouseProperty < -200000 && regime === "old") {
      netHouseProperty = -200000;
    } else if (netHouseProperty < 0 && regime === "new") {
      netHouseProperty = 0;
    }

    // 3. Business / Profession Head (PGBP)
    const pgbpTurnover = Number(incomeInput.businessTurnover) || 0;
    const pgbpPresumptive = Number(incomeInput.businessPresumptive) || (Number(incomeInput.business44AD) || 0) + (Number(incomeInput.business44ADA) || 0) + (Number(incomeInput.business44AE) || 0);
    let pgbpNonSpeculative = Number(incomeInput.businessNonSpeculative) || 0;
    if (!pgbpNonSpeculative && incomeInput.businessNet && Number(incomeInput.businessNet) > pgbpPresumptive) {
      pgbpNonSpeculative = Number(incomeInput.businessNet) - pgbpPresumptive;
    }
    const pgbpSpeculative = Number(incomeInput.businessSpeculative) || 0;
    const netPGBP = pgbpPresumptive + pgbpNonSpeculative + (pgbpSpeculative > 0 ? pgbpSpeculative : 0);

    // 4. Capital Gains Head
    const stcg111A = Number(incomeInput.capitalGainsSTCG111A) || Number(incomeInput.stcg111A) || 0;
    const stcgNormal = Number(incomeInput.capitalGainsSTCGNormal) || Number(incomeInput.capitalGainsSTCG) || 0;
    const ltcg112A = Number(incomeInput.capitalGainsLTCG112A) || Number(incomeInput.ltcg112A) || 0;
    const ltcg112 = Number(incomeInput.capitalGainsLTCG112) || Number(incomeInput.ltcg112) || 0;
    const totalCapitalGains = (stcg111A + stcgNormal + ltcg112A + ltcg112) || Number(incomeInput.capitalGainsTotal) || 0;

    // 5. Other Sources Head (Granular Breakdown)
    const osSavingsInterest = Number(incomeInput.otherSourcesSavings) || Number(incomeInput.osSavingsInterest) || 0;
    const osDepositInterest = Number(incomeInput.otherSourcesDeposits) || Number(incomeInput.osDepositInterest) || 0;
    const osRefund = Number(incomeInput.otherSourcesRefund) || Number(incomeInput.osRefund) || 0;
    const osDividend = Number(incomeInput.otherSourcesDividend) || Number(incomeInput.osDividend) || 0;
    const osFamilyPension = Number(incomeInput.otherSourcesFamilyPension) || Number(incomeInput.osFamilyPension) || 0;
    const osSec57 = Number(incomeInput.otherSourcesSec57) || 0;
    let osOther = Number(incomeInput.otherSourcesOther) || Number(incomeInput.osOther) || 0;

    let osFamilyPensionStdDed = 0;
    if (osFamilyPension > 0) {
      const maxFpLimit = regime === "new" ? ayConfig.newRegime.stdDeductionFamilyPension : ayConfig.oldRegime.stdDeductionFamilyPension;
      osFamilyPensionStdDed = Math.min(osFamilyPension * (1 / 3), maxFpLimit);
    }
    const netFamilyPension = Math.max(0, osFamilyPension - osFamilyPensionStdDed);

    const osGrossSum = osSavingsInterest + osDepositInterest + osRefund + osDividend + netFamilyPension;
    let netOtherSources = 0;
    if (incomeInput.otherSourcesTotal !== undefined && incomeInput.otherSourcesTotal !== null && Number(incomeInput.otherSourcesTotal) > 0) {
      netOtherSources = Number(incomeInput.otherSourcesTotal);
    } else {
      netOtherSources = Math.max(0, osGrossSum + osOther - osSec57);
    }

    // 6. Gross Total Income
    const grossTotalIncome = (incomeInput.grossTotalIncome !== undefined && incomeInput.grossTotalIncome !== null && Number(incomeInput.grossTotalIncome) > 0)
      ? Number(incomeInput.grossTotalIncome)
      : Math.max(0, netSalary + netHouseProperty + netPGBP + totalCapitalGains + netOtherSources);

    // 7. Deductions under Chapter VI-A
    let sec80C = Number(deductionsInput.sec80C) || 0;
    let sec80CCC = Number(deductionsInput.sec80CCC) || 0;
    let sec80CCD1 = Number(deductionsInput.sec80CCD1) || 0;
    let sec80C_Total = Math.min(150000, sec80C + sec80CCC + sec80CCD1);

    let sec80CCD1B = Math.min(50000, Number(deductionsInput.sec80CCD1B) || 0);
    let sec80CCD2 = Number(deductionsInput.sec80CCD2) || 0;
    let sec80D = Number(deductionsInput.sec80D) || 0;
    let sec80E = Number(deductionsInput.sec80E) || 0;
    let sec80G = Number(deductionsInput.sec80G) || 0;
    let sec80TTA = Math.min(10000, Number(deductionsInput.sec80TTA) || 0);
    let sec80TTB = Math.min(50000, Number(deductionsInput.sec80TTB) || 0);
    let secOtherVI_A = Number(deductionsInput.otherDeductions) || 0;

    let totalDeductionsVIA = 0;
    if (regime === "new") {
      totalDeductionsVIA = sec80CCD2;
    } else {
      if (deductionsInput.deductionVIA !== undefined && deductionsInput.deductionVIA !== null && Number(deductionsInput.deductionVIA) > 0) {
        totalDeductionsVIA = Number(deductionsInput.deductionVIA);
      } else {
        totalDeductionsVIA = sec80C_Total + sec80CCD1B + sec80CCD2 + sec80D + sec80E + sec80G + (ageGroup === "senior" || ageGroup === "super_senior" ? sec80TTB : sec80TTA) + secOtherVI_A;
      }
    }
    totalDeductionsVIA = Math.min(grossTotalIncome - (stcg111A + ltcg112A + ltcg112), Math.max(0, totalDeductionsVIA));

    // 8. Total Taxable Income (Round off u/s 288A)
    const rawTotalIncome = Math.max(0, grossTotalIncome - totalDeductionsVIA);
    const totalIncome = (incomeInput.totalIncome !== undefined && incomeInput.totalIncome !== null && Number(incomeInput.totalIncome) > 0 && Math.abs(Number(incomeInput.totalIncome) - rawTotalIncome) <= 10)
      ? Number(incomeInput.totalIncome)
      : this.round10(rawTotalIncome);

    // 9. Taxes
    const specialRateIncome = stcg111A + ltcg112A + ltcg112;
    const normalTaxableIncome = Math.max(0, totalIncome - specialRateIncome);

    let slabs = ayConfig.newRegime.slabs;
    if (regime === "old") {
      if (ageGroup === "super_senior") slabs = ayConfig.oldRegime.slabsSuperSenior;
      else if (ageGroup === "senior") slabs = ayConfig.oldRegime.slabsSenior;
      else slabs = ayConfig.oldRegime.slabsIndividual;
    }

    const { totalTax: normalTax, slabBreakdown } = this.computeSlabTax(normalTaxableIncome, slabs);

    const taxSTCG111A = Math.round(stcg111A * 0.15);
    const ltcg112AExemption = 100000;
    const taxLTCG112A = Math.round(Math.max(0, ltcg112A - ltcg112AExemption) * 0.10);
    const taxLTCG112 = Math.round(ltcg112 * 0.20);
    const specialTaxTotal = taxSTCG111A + taxLTCG112A + taxLTCG112;

    const grossTaxBeforeRebate = normalTax + specialTaxTotal;

    // 10. 87A Rebate & Marginal Relief
    let rebate87A = 0;
    if (regime === "new") {
      if (totalIncome <= ayConfig.newRegime.rebate87ALimit) {
        rebate87A = Math.min(grossTaxBeforeRebate, ayConfig.newRegime.rebate87AMax);
      } else if (totalIncome > ayConfig.newRegime.rebate87ALimit) {
        const excessIncome = totalIncome - ayConfig.newRegime.rebate87ALimit;
        if (grossTaxBeforeRebate > excessIncome) {
          rebate87A = grossTaxBeforeRebate - excessIncome;
        }
      }
    } else {
      if (totalIncome <= ayConfig.oldRegime.rebate87ALimit) {
        rebate87A = Math.min(grossTaxBeforeRebate, ayConfig.oldRegime.rebate87AMax);
      }
    }
    rebate87A = Math.round(Math.min(grossTaxBeforeRebate, Math.max(0, rebate87A)));

    const taxAfterRebate = Math.max(0, grossTaxBeforeRebate - rebate87A);

    // 11. Surcharge
    const maxSurchargeRate = regime === "new" ? ayConfig.newRegime.maxSurchargeRate : ayConfig.oldRegime.maxSurchargeRate;
    const { surcharge, marginalRelief, surchargeRate } = this.computeSurcharge(normalTax, specialTaxTotal, totalIncome, maxSurchargeRate);

    // 12. Cess @ 4%
    const cess = Math.round((taxAfterRebate + surcharge) * 0.04);

    // 13. Gross Tax Liability
    const grossTaxLiability = taxAfterRebate + surcharge + cess;

    // 14. Relief u/s 89
    const relief89 = Number(taxesPaidInput.relief89) || 0;
    const netTaxLiabilityBeforeInterest = Math.max(0, grossTaxLiability - relief89);

    // 15. Interest 234A/B/C/F
    const interest234A = Number(taxesPaidInput.interest234A) || 0;
    const interest234B = Number(taxesPaidInput.interest234B) || 0;
    const interest234C = Number(taxesPaidInput.interest234C) || 0;
    const fee234F = Number(taxesPaidInput.fee234F) || 0;
    const totalInterestFee = interest234A + interest234B + interest234C + fee234F;

    const totalTaxAndInterest = this.round10(netTaxLiabilityBeforeInterest + totalInterestFee);

    // 16. Taxes Paid
    const advanceTax = Number(taxesPaidInput.advanceTax) || 0;
    const tdsSalary = Number(taxesPaidInput.tdsSalary) || 0;
    const tdsNonSalary = Number(taxesPaidInput.tdsNonSalary) || 0;
    const tdsTotal = (taxesPaidInput.tds !== undefined && taxesPaidInput.tds !== null && Number(taxesPaidInput.tds) > 0)
      ? Number(taxesPaidInput.tds)
      : (tdsSalary + tdsNonSalary);
    const tcs = Number(taxesPaidInput.tcs) || 0;
    const selfAssessmentTax = Number(taxesPaidInput.selfAssessmentTax) || 0;
    const totalTaxesPaid = advanceTax + tdsTotal + tcs + selfAssessmentTax;

    // 17. Amount Payable or Refund
    let amountPayable = 0;
    let refund = 0;
    if (totalTaxAndInterest > totalTaxesPaid) {
      amountPayable = this.round10(totalTaxAndInterest - totalTaxesPaid);
    } else {
      refund = this.round10(totalTaxesPaid - totalTaxAndInterest);
    }

    return {
      assessmentYear: ayKey,
      financialYear: ayConfig.fy,
      regime,
      ageGroup,
      income: {
        salaryGross: grossSalary,
        salaryAllowancesExempt: allowancesExempt,
        salaryStdDeduction: stdDeduction,
        salaryProfessionalTax: professionalTax,
        salaryNet: netSalary,
        hpRentalGross,
        hpTaxesPaid,
        hpInterestLoan24b: hpInterestSelf || hpInterestLetOut || (netHouseProperty < 0 ? Math.abs(netHouseProperty) : 0),
        hpNet: netHouseProperty,
        businessTurnover: pgbpTurnover,
        businessPresumptive: pgbpPresumptive,
        businessNonSpeculative: pgbpNonSpeculative,
        businessSpeculative: pgbpSpeculative,
        businessNet: netPGBP,
        capitalGainsSTCG111A: stcg111A,
        capitalGainsSTCGNormal: stcgNormal,
        capitalGainsLTCG112A: ltcg112A,
        capitalGainsLTCG112: ltcg112,
        capitalGainsTotal: totalCapitalGains,
        otherSourcesSavings: osSavingsInterest,
        otherSourcesDeposits: osDepositInterest,
        otherSourcesRefund: osRefund,
        otherSourcesDividend: osDividend,
        otherSourcesFamilyPension: netFamilyPension,
        otherSourcesFamilyPensionStdDed: osFamilyPensionStdDed,
        otherSourcesSec57: osSec57,
        otherSourcesOther: osOther,
        otherSourcesTotal: netOtherSources,
        grossTotalIncome
      },
      deductions: {
        sec80C: sec80C_Total,
        sec80CCD1B,
        sec80CCD2,
        sec80D,
        sec80E,
        sec80G,
        sec80TTA: ageGroup === "individual" ? sec80TTA : 0,
        sec80TTB: (ageGroup === "senior" || ageGroup === "super_senior") ? sec80TTB : 0,
        otherDeductions: secOtherVI_A,
        totalChapterVIA: totalDeductionsVIA
      },
      taxComputation: {
        totalIncome,
        normalTaxableIncome,
        specialRateIncome,
        slabBreakdown,
        taxAtNormalRates: normalTax,
        taxAtSpecialRates: specialTaxTotal,
        taxSTCG111A,
        taxLTCG112A,
        taxLTCG112,
        specialTaxTotal,
        grossTaxBeforeRebate,
        rebate87A,
        taxAfterRebate,
        surcharge,
        surchargeRate,
        marginalRelief,
        cess,
        grossTaxLiability,
        relief89,
        interest234A,
        interest234B,
        interest234C,
        fee234F,
        totalInterestFee,
        totalTaxAndInterest,
        advanceTax,
        tds: tdsTotal,
        tcs,
        selfAssessmentTax,
        totalTaxesPaid,
        amountPayable,
        netTaxPayable: amountPayable,
        refund
      }
    };
  },

  compareRegimes(incomeInput, deductionsInput, taxesPaidInput, options = {}) {
    const newRegimeResult = this.compute(incomeInput, deductionsInput, taxesPaidInput, { ...options, regime: "new" });
    const oldRegimeResult = this.compute(incomeInput, deductionsInput, taxesPaidInput, { ...options, regime: "old" });

    const newTax = newRegimeResult.taxComputation.totalTaxAndInterest;
    const oldTax = oldRegimeResult.taxComputation.totalTaxAndInterest;
    const difference = Math.abs(newTax - oldTax);
    const recommended = newTax <= oldTax ? "new" : "old";

    return {
      newRegime: newRegimeResult,
      oldRegime: oldRegimeResult,
      recommended,
      taxDifference: difference,
      savings: difference,
summary: recommended === "new"
        ? `New Tax Regime is more beneficial by ₹${difference.toLocaleString('en-IN')}`
        : `Old Tax Regime is more beneficial by ₹${difference.toLocaleString('en-IN')}`
    };
  }
};

/* =========================================================================
   2. MULTI-FORM ITR PDF EXTRACTION & PARSER (ITR-1, ITR-2, ITR-3, ITR-4)
   ========================================================================= */
const ItrParser = {
  findByLabel(text, labelPattern, code, window = 350) {
    if (!text) return null;
    const labelRe = new RegExp(labelPattern, "gi");
    let match;
    const matches = [];
    while ((match = labelRe.exec(text)) !== null) {
      matches.push(match);
    }
    if (!matches.length) return null;

    if (code) {
      const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const afterValRe = new RegExp(`(?:\\b${escaped}\\b|[\\s(]${escaped}[\\s)])\\s+(-?[\\d,]+(?:\\.\\d+)?)\\b`, "i");
      const beforeCodeRe = new RegExp(`(?:\\b${escaped}\\b|\\(${escaped}\\)|${escaped}\\.)\\s*$`, "i");

      for (const m of matches) {
        const afterLabel = text.slice(m.index + m[0].length, m.index + m[0].length + window);
        const beforeLabel = text.slice(Math.max(0, m.index - 40), m.index);

        // Case 1: Code appears before label, e.g. "1. Gross Total Income 650000" or "B4. Gross Total Income 950000"
        if (beforeCodeRe.test(beforeLabel.trim())) {
          const numMatch = afterLabel.match(/-?[\d,]+(?:\.\d+)?/);
          if (numMatch) return parseFloat(numMatch[0].replace(/,/g, ""));
        }

        // Case 2: Code appears after label, e.g. "Gross Total Income 10 650000"
        const valMatch = afterLabel.match(afterValRe);
        if (valMatch) return parseFloat(valMatch[1].replace(/,/g, ""));
      }
      return null;
    }

    // If no specific code requested, extract first money token from first matching label
    for (const m of matches) {
      const afterLabel = text.slice(m.index + m[0].length, m.index + m[0].length + window);
      const tokens = afterLabel.match(/-?[\d,]+(?:\.\d+)?/g) || [];
      for (const t of tokens) {
        const clean = t.replace(/,/g, "");
        const val = parseFloat(clean);
        if (!isNaN(val)) return val;
      }
    }
    return null;
  },

  firstMoneyAfterLabel(text, labelPattern, window = 150) {
    if (!text) return null;
    const labelRe = new RegExp(labelPattern, "i");
    const labelMatch = text.match(labelRe);
    if (!labelMatch) return null;
    const afterLabel = text.slice(labelMatch.index + labelMatch[0].length, labelMatch.index + labelMatch[0].length + window);
    const numMatch = afterLabel.match(/-?[\d,]+(?:\.\d+)?/);
    return numMatch ? parseFloat(numMatch[0].replace(/,/g, "")) : null;
  },

  findMoneyByPatterns(text, patterns, window = 250) {
    if (!text) return 0;
    for (const pat of patterns) {
      const re = typeof pat === "string" ? new RegExp(pat, "i") : pat;
      const m = text.match(re);
      if (m) {
        const after = text.slice(m.index + m[0].length, m.index + m[0].length + window);
        const tokens = after.match(/-?[\d,]+(?:\.\d+)?/g) || [];
        for (const t of tokens) {
          const clean = t.replace(/,/g, "");
          if (/^\d{1,2}$/.test(clean) && Number(clean) <= 30) continue;
          const val = parseFloat(clean);
          if (!isNaN(val) && val > 0) return val;
        }
      }
    }
    return 0;
  },

  section(text, startMarker, endMarker) {
    if (!text) return "";
    const start = text.indexOf(startMarker);
    if (start === -1) return "";
    const end = endMarker ? text.indexOf(endMarker, start + startMarker.length) : text.length;
    return text.slice(start, end === -1 ? text.length : end);
  },

  detectFormType(fullText) {
    if (/\bFORM\s+ITR-?3\b|\bITR-?3\b|\bPART A-BS\b|SCHEDULE BP/i.test(fullText)) return "ITR-3";
    if (/\bFORM\s+ITR-?4\b|\bITR-?4\b|\bSUGAM\b|PART B - 44AD/i.test(fullText)) return "ITR-4";
    if (/\bFORM\s+ITR-?2\b|\bITR-?2\b/i.test(fullText) || (/\bSCHEDULE CG\b/i.test(fullText) && !/\bSCHEDULE BP\b/i.test(fullText))) return "ITR-2";
    if (/\bFORM\s+ITR-?1\b|\bITR-?1\b|\bSAHAJ\b/i.test(fullText)) return "ITR-1";
    if (/ITR-V/i.test(fullText)) {
      if (/ITR-3/i.test(fullText)) return "ITR-3";
      if (/ITR-4/i.test(fullText)) return "ITR-4";
      if (/ITR-2/i.test(fullText)) return "ITR-2";
      return "ITR-1";
    }
    return "ITR-1";
  },

  extract(lines) {
    const fullText = lines.join(" \n ");
    const formType = this.detectFormType(fullText);
    const warnings = [];
    const need = (val, label) => { if (val === null || val === undefined) warnings.push(label); return val; };

    // 1. Assessee & Header Information
    const verDeclMatch = fullText.match(/I,\s+([A-Z\s]+?)\s+son\/\s*daughter of\s+([A-Z\s]+?)\s+solemnly declare/i)
      || fullText.match(/I,\s+([A-Z\s]+?)\s+(?:son|daughter|ward)\s+of\s+([A-Z\s]+?)\s+solemnly/i);
    let assesseeName = verDeclMatch ? verDeclMatch[1].replace(/\s+/g, " ").trim() : "";
    let fatherName = verDeclMatch ? verDeclMatch[2].replace(/\s+/g, " ").trim() : "";
    if (!assesseeName) {
      const fnMatch = fullText.match(/\(A1\)\s*First Name\s*([A-Za-z]+)/i) || fullText.match(/First Name\s*:\s*([A-Za-z]+)/i);
      const mnMatch = fullText.match(/\(A2\)\s*Middle Name\s*([A-Za-z]+)/i) || fullText.match(/Middle Name\s*:\s*([A-Za-z]+)/i);
      const lnMatch = fullText.match(/\(A3\)\s*Last Name\s*([A-Za-z]+)/i) || fullText.match(/Last Name\s*:\s*([A-Za-z]+)/i);
      const fn = fnMatch ? fnMatch[1].trim() : "";
      const mn = mnMatch ? mnMatch[1].trim() : "";
      const ln = lnMatch ? lnMatch[1].trim() : "";
      if (fn || mn || ln) {
        assesseeName = [fn, mn, ln].filter(Boolean).join(" ");
      }
    }
    if (!assesseeName) {
      const nameMatch = fullText.match(/Name of Assessee\s*:\s*([^\n]+)/i)
        || fullText.match(/Name\s*:\s*([A-Z\s]{3,40})(?:\s+PAN|\s+Status|\n|$)/i);
      if (nameMatch) assesseeName = nameMatch[1].replace(/\s+/g, " ").trim();
    }

    const panMatch = fullText.match(/\(A4\)\s*PAN\s*([A-Z]{5}[0-9]{4}[A-Z])/i)
      || fullText.match(/\(A5\)\s*PAN\s*([A-Z]{5}[0-9]{4}[A-Z])/i)
      || fullText.match(/PAN\s*:\s*([A-Z]{5}[0-9]{4}[A-Z])/i)
      || fullText.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/);

    let ayMatch = fullText.match(/Assessment Year\s*:\s*(\d{4}-\d{2,4})/i)
      || fullText.match(/Assessment Year\s*\n?\s*(\d{4}-\d{2,4})/i)
      || fullText.match(/\b(20\d{2}-\d{2,4})\b/);

    const ackMatch = fullText.match(/Acknowledgement Number\s*:\s*(\d+)/i)
      || fullText.match(/Receipt No\.?\s*:\s*(\d+)/i)
      || fullText.match(/Ack(?:nowledgement)?\s*No\.?\s*:\s*(\d+)/i);

    const filingDateMatch = fullText.match(/Date of Filing\s*:\s*([\d-A-Za-z]+)/i)
      || fullText.match(/Date of filing\s*:\s*([\d-A-Za-z]+)/i)
      || fullText.match(/Date\s*:\s*(\d{2}[/-]\d{2}[/-]\d{4})/i);

    const employerMatch = fullText.match(/Name of Employer[^\n]*TAN of Employer[^\n]*\n\s*([A-Z][A-Z\s]+?)\s+\w*\s*([A-Z]{4}\d{5}[A-Z])\b/)
      || fullText.match(/Name of Employer\s*:\s*([^\n]+)/i);

    const statusMatch = fullText.match(/Residential Status in India[^\n]*([A-Za-z -]+)/i)
      || fullText.match(/\(A14\)\s*Status[\s\S]{0,80}?\n\s*([A-Za-z -]+)/i)
      || fullText.match(/Status\s*:\s*([A-Za-z -]+)/i);

    const emailMatch = fullText.match(/\b[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+\b/);
    const dobMatch = fullText.match(/\(A\d+\)\s*Date of Birth[^\d]*(\d{2}\/\d{2}\/\d{4})/i)
      || fullText.match(/Date of Birth[^\d]*(\d{2}\/\d{2}\/\d{4})/i);
    const aadhaarMatch = fullText.match(/\(A\d+\)\s*Aadhaar[^\n]*\n\s*([0-9Xx\s]{12,19})/i)
      || fullText.match(/\b(\d[Xx]{3}\s+[Xx]{4}\s+\d{4}|\d{12})\b/);

    let detectedRegime = "new";
    if (/Opting out of new tax regime\?[^\n]*Yes/i.test(fullText) ||
        /115BAC\(6\)\s*opted\s*out/i.test(fullText) ||
        /Filed under section\s*115BAC\(6\)/i.test(fullText)) {
      detectedRegime = "old";
    }

    let filingSection = "139(1) - On or before due date";
    if (/139\(4\)|Belated/i.test(fullText)) filingSection = "139(4) - Belated Return";
    else if (/139\(5\)|Revised/i.test(fullText)) filingSection = "139(5) - Revised Return";
    else if (/139\(8A\)|Updated/i.test(fullText)) filingSection = "139(8A) - Updated Return (ITR-U)";
    else if (/119\(2\)\(b\)/i.test(fullText)) filingSection = "119(2)(b) - Condonation of delay";

    let address = "";
    const pinMatch = fullText.match(/\(A13\)\s*Pin code[^\d]*(\d{6})/i) || fullText.match(/Pin code[^\d]*(\d{6})/i);
    const stateMatch = fullText.match(/\(A11\)\s*State\s*(?:\d+-)?([A-Za-z\s]+)/i);
    const townMatch = fullText.match(/\(A10\)\s*Town\/ City\/ District\s*([A-Za-z\s]+)/i);
    const localityMatch = fullText.match(/\(A9\)\s*Area\/ Locality\s*([A-Za-z\s]+)/i);
    const roadMatch = fullText.match(/\(A8\)\s*Road\/ Street\/Post office\s*([A-Za-z0-9\s.]+)/i);
    const flatMatch = fullText.match(/\(A6\)\s*Flat\/ Door\/ Block No\.?\s*([A-Za-z0-9\s]+)/i);
    const addrParts = [
      flatMatch ? flatMatch[1].trim() : "",
      roadMatch ? roadMatch[1].trim() : "",
      localityMatch ? localityMatch[1].trim() : "",
      townMatch ? townMatch[1].trim() : "",
      stateMatch ? stateMatch[1].trim() : "",
      pinMatch ? pinMatch[1].trim() : ""
    ].filter(Boolean);
    if (addrParts.length) address = addrParts.join(", ");

    // 2. Head-Wise Income Breakdown
    // A. Salaries
    const grossSal = this.findByLabel(fullText, "Total gross salary", "2")
      || this.findByLabel(fullText, "Gross Salary", "i")
      || this.findByLabel(fullText, "Gross Salary", "1d")
      || this.findMoneyByPatterns(fullText, [
        "Gross Salary \\(ia \\+ ib \\+ ic \\+ id \\+ ie\\)",
        "Salary as per section 17\\(1\\)",
        "Total gross salary",
        "\\(i\\)\\s*Gross Salary",
        "Gross Salary"
      ]);

    const salAllowancesExempt = this.findByLabel(fullText, "allowances to the extent exempt u/s 10", "3")
      || this.findByLabel(fullText, "Allowances exempt u/s 10", "ii")
      || this.findMoneyByPatterns(fullText, [
        "Allowances to the extent exempt u/s 10",
        "Allowances exempt u/s 10",
        "exempt u/s 10",
        "\\(ii\\)\\s*Less: Allowances"
      ]);

    const salStdDed = this.findByLabel(fullText, "Standard deduction u/s 16\\(ia\\)", "5a")
      || this.findByLabel(fullText, "Standard deduction u/s 16\\(ia\\)", "iva")
      || this.findMoneyByPatterns(fullText, [
        "Standard deduction u/s 16\\(ia\\)",
        "Deductions u/s 16\\(ia\\)",
        "Standard deduction",
        "Deductions u\\/s 16 \\(iva \\+ ivb \\+ ivc\\)",
        "Deductions u/s 16",
        "\\(iva\\)\\s*Standard deduction"
      ]) || (grossSal > 0 ? 50000 : 0);

    const salProfTax = this.findByLabel(fullText, "Professional tax u/s 16\\(iii\\)", "5c")
      || this.findByLabel(fullText, "Professional tax u/s 16\\(iii\\)", "ivc")
      || this.findMoneyByPatterns(fullText, [
        "Professional tax u/s 16\\(iii\\)",
        "Tax on employment u/s 16\\(iii\\)",
        "Professional tax",
        "\\(ivc\\)\\s*Professional tax"
      ]);

    const salNet = this.findByLabel(fullText, "Salaries \\(6 of Schedule S\\)", "1")
      || this.findByLabel(fullText, "Income chargeable under the Head ['‘]Salaries['’]", "6")
      || this.findByLabel(fullText, "Income from Salaries", "B1")
      || this.findMoneyByPatterns(fullText, [
        "Income chargeable under the head 'Salaries'",
        "Income chargeable under the Head",
        "\\(v\\)\\s*Income chargeable under the head"
      ]) || (grossSal > 0 ? Math.max(0, grossSal - salAllowancesExempt - salStdDed - salProfTax) : 0);

    // B. House Property
    const hpInterest = this.findByLabel(fullText, "Interest payable on borrowed capital", "e")
      || this.findByLabel(fullText, "Interest payable on borrowed capital", "1e")
      || this.findMoneyByPatterns(fullText, [
        "Interest payable on borrowed capital",
        "Interest on borrowed capital",
        "Interest on housing loan",
        "u/s 24\\(b\\)",
        "\\(e\\)\\s*Interest payable on borrowed capital"
      ]);

    const hpNet = this.findByLabel(fullText, "Income from house property \\(3 of Schedule-HP\\)", "2")
      || this.findByLabel(fullText, "Total Income chargeable under the head 'House Property'|Income from House Property", "B2")
      || this.findByLabel(fullText, "Income from house property", "3")
      || this.firstMoneyAfterLabel(fullText, "Income from House Property")
      || (hpInterest > 0 ? -hpInterest : 0);

    // C. Profits & Gains from Business or Profession (PGBP)
    const busTurnover = this.findByLabel(fullText, "Gross Turnover or Gross Receipts", "61i")
      || this.findByLabel(fullText, "Gross Receipts", "62i")
      || this.findByLabel(fullText, "Gross turnover or gross receipts", "E1")
      || this.findMoneyByPatterns(fullText, ["Gross Turnover or Gross Receipts", "Turnover.*44AD", "Gross Receipts.*44AD"]);

    const busPresumptive = this.findByLabel(fullText, "Presumptive income under section 44AD", "61ii")
      || this.findByLabel(fullText, "Section 44AD \\(61\\(ii\\)", "35i")
      || this.findByLabel(fullText, "Section 44AD", "B3a")
      || this.findByLabel(fullText, "44AD", "4a")
      || this.findMoneyByPatterns(fullText, [
        "Presumptive income under section 44AD",
        "Section 44AD \\(61\\(ii\\)",
        "44AD\\s+4a",
        "Presumptive Income",
        "Income chargeable under presumptive taxation"
      ]);

    const busPresumptive44ADA = this.findByLabel(fullText, "Presumptive Income under section 44ADA", "62ii")
      || this.findByLabel(fullText, "Section 44ADA", "35ii")
      || this.findByLabel(fullText, "Section 44ADA", "B3b")
      || this.findMoneyByPatterns(fullText, ["Presumptive Income under section 44ADA", "44ADA"]);

    const busSpeculative = this.findByLabel(fullText, "Net income from speculative activity", "65iv")
      || this.findByLabel(fullText, "Net profit or loss from speculative business", "2a")
      || this.findByLabel(fullText, "Net profit or loss from speculative business", "39")
      || 0;

    const busNonSpec = this.findByLabel(fullText, "Net profit or loss from business or profession other than speculative", "36")
      || this.findByLabel(fullText, "Profit and gains from business other than speculative", "3i")
      || this.findMoneyByPatterns(fullText, [
        "Net profit or loss from business or profession other than speculative",
        "Profits and gains from business or profession",
        "Income from Business or Profession"
      ]);

    const busNet = this.findByLabel(fullText, "Profits and gains from business or profession", "3v")
      || this.findByLabel(fullText, "Income chargeable under the head ['‘]Profits and gains from Business", "D")
      || this.findByLabel(fullText, "Presumptive Income from Business", "B3")
      || (busPresumptive + busPresumptive44ADA + (busNonSpec > 0 && busNonSpec !== busPresumptive ? busNonSpec : 0))
      || 0;

    // D. Capital Gains
    const stcg111A = this.findByLabel(fullText, "Short-term capital gain on equity share or equity oriented MF", "3ie")
      || this.findByLabel(fullText, "Short-term chargeable @ 15%", "ai")
      || this.findByLabel(fullText, "Short-term capital gain taxable @ 15%", "vii")
      || this.findMoneyByPatterns(fullText, [
        "Short-Term Capital Gains u/s 111A",
        "Short-term capital gain.*u/s 111A",
        "chargeable at 15%",
        "A1\\s+Short-term",
        "111A"
      ]);

    const stcgNormal = this.findByLabel(fullText, "Short-term capital gains chargeable at applicable rates", "A2")
      || this.findByLabel(fullText, "Short-term chargeable at applicable rate", "aiii")
      || this.findMoneyByPatterns(fullText, ["Short-term capital gains chargeable at applicable rates", "A2\\s+Short-term"]);

    const ltcg112A = this.findByLabel(fullText, "LTCG u/s 112A", "5a")
      || this.findByLabel(fullText, "Long-term chargeable @ 10%", "bi")
      || this.findByLabel(fullText, "Long-Term Capital Gains u/s 112A", "B4")
      || this.findMoneyByPatterns(fullText, ["Long-Term Capital Gains u/s 112A", "chargeable at 10% u/s 112A"]);

    const ltcg112 = this.findByLabel(fullText, "Long-term chargeable @ 20%", "bii")
      || this.findByLabel(fullText, "Long-Term Capital Gains u/s 112", "B1")
      || this.findMoneyByPatterns(fullText, ["Long-Term Capital Gains u/s 112", "chargeable at 20%"]);

    const cgTotal = this.findByLabel(fullText, "Total capital gains", "4e")
      || this.findByLabel(fullText, "Sum of Short-term/Long-term Total Capital Gains", "4c")
      || this.findByLabel(fullText, "Sum of Capital Gain Income chargeable", "C1")
      || this.findByLabel(fullText, "Total capital gains", "4e")
      || (stcg111A + stcgNormal + ltcg112A + ltcg112)
      || 0;

    // E. Other Sources
    const osDividend = this.findByLabel(fullText, "Dividend income \\[other than \\(ii\\)\\]", "1ai")
      || this.findByLabel(fullText, "Dividends, Gross", "1a")
      || this.findMoneyByPatterns(fullText, [
        "Dividend(?:\\s+income)?(?:\\s+from\\s+Domestic)?",
        "\\b2a\\b\\s+Dividend",
        "Dividend income",
        "Dividend"
      ]);

    const osSavings = this.findByLabel(fullText, "From Savings Bank", "1bi")
      || this.findMoneyByPatterns(fullText, [
        "Interest from Saving(?:s)?\\s+Bank\\s+Account",
        "Interest from Saving(?:s)?\\s+Account",
        "Interest on Saving(?:s)?\\s+Account",
        "Savings\\s+Bank\\s+Interest",
        "\\b1ai\\b",
        "Interest from Saving",
        "\\(a\\)\\s*\\(i\\)\\s*Interest from Saving"
      ]);

    const osDeposits = this.findByLabel(fullText, "From Deposits \\(Bank", "1bii")
      || this.findByLabel(fullText, "From Deposits", "1bii")
      || this.findMoneyByPatterns(fullText, [
        "Interest from Deposit",
        "Interest on Deposit",
        "Interest from term deposit",
        "Term\\s+Deposit\\s+Interest",
        "Fixed\\s+Deposit\\s+Interest",
        "\\b1aii\\b",
        "\\(a\\)\\s*\\(ii\\)\\s*Interest from Deposit"
      ]);

    const osRefund = this.findByLabel(fullText, "From Income-tax Refund", "1biii")
      || this.findMoneyByPatterns(fullText, [
        "Interest (?:from|on) Income[ -]?tax refund",
        "Interest from Income-tax refund",
        "Interest on Income Tax Refund",
        "u/s 244A",
        "\\b244A\\b",
        "\\b1aiii\\b"
      ]);

    const osFamilyPension = this.findByLabel(fullText, "Family Pension", "1")
      || this.findMoneyByPatterns(fullText, [
        "Family\\s+pension",
        "Family Pension",
        "\\b1b\\b"
      ]);

    const osSec57 = this.findByLabel(fullText, "Expenses / deductions other than entered in", "3ai")
      || this.findByLabel(fullText, "Deductions under section 57", "3d")
      || this.findMoneyByPatterns(fullText, [
        "Expenses / deductions other than entered in",
        "Deductions under section 57"
      ]);

    const osGrossSum = osSavings + osDeposits + osRefund + osDividend + osFamilyPension;
    let osOther = this.findMoneyByPatterns(fullText, ["Any other income", "Any other receipt", "Other income from other sources"]);

    const osTotalFound = this.findByLabel(fullText, "Net Income from Other sources chargeable to tax at Normal Applicable rates", "5a")
      || this.findByLabel(fullText, "Net Income from other sources", "6")
      || this.findByLabel(fullText, "Income under the head \"Income from other sources\"", "9")
      || this.findByLabel(fullText, "Income from Other Sources", "B3")
      || this.findByLabel(fullText, "Income from Other Sources", "B4")
      || this.firstMoneyAfterLabel(fullText, "Total Income from Other Sources") || 0;

    if (osTotalFound > (osGrossSum - osSec57) && osOther === 0) {
      osOther = Math.max(0, osTotalFound - (osGrossSum - osSec57));
    }

    const osTotalFinal = osTotalFound || Math.max(0, osGrossSum + osOther - osSec57);

    // 3. Deductions under Chapter VI-A
    const sec80C = this.findByLabel(fullText, "Section 80C", "C1")
      || this.findByLabel(fullText, "80C", "c")
      || this.findMoneyByPatterns(fullText, ["80C \\(PPF", "Section 80C", "80C"]);

    const sec80CCD1B = this.findByLabel(fullText, "Section 80CCD\\(1B\\)", "C3")
      || this.findByLabel(fullText, "80CCD\\(1B\\)", "3")
      || this.findMoneyByPatterns(fullText, ["80CCD\\(1B\\)", "Section 80CCD\\(1B\\)"]);

    const sec80D = this.findByLabel(fullText, "Section 80D", "C6")
      || this.findByLabel(fullText, "80D", "e")
      || this.findMoneyByPatterns(fullText, ["80D", "Section 80D", "Health Insurance"]);

    const sec80TTA = this.findByLabel(fullText, "Section 80TTA", "C17")
      || this.findByLabel(fullText, "80TTA", "q")
      || this.findMoneyByPatterns(fullText, ["80TTA", "Section 80TTA"]);

    const sec80TTB = this.findByLabel(fullText, "Section 80TTB", "C18")
      || this.findByLabel(fullText, "80TTB", "r")
      || this.findMoneyByPatterns(fullText, ["80TTB", "Section 80TTB"]);

    const deductionVIA = this.findByLabel(fullText, "Deduction under chapter VI-A", "12c")
      || this.findByLabel(fullText, "Total Chapter VI-A", "12c")
      || this.findByLabel(fullText, "Total deductions \\(C1 to C20\\)", "C21")
      || this.findByLabel(fullText, "Deductions under Chapter VI-A", "2")
      || this.firstMoneyAfterLabel(fullText, "Total deductions \\(C1 to C20\\)")
      || (sec80C + sec80CCD1B + sec80D + sec80TTA + sec80TTB)
      || 0;

    // 4. Gross Total Income & Total Taxable Income
    const grossTotalFound = this.findByLabel(fullText, "Gross Total income", "10")
      || this.findByLabel(fullText, "Total of Head Wise Income", "6")
      || this.findByLabel(fullText, "Gross Total Income \\(B1\\+B2\\+B3", "B4")
      || this.findByLabel(fullText, "Gross Total Income", "B5")
      || this.findByLabel(fullText, "Gross Total Income", "1")
      || (salNet + (hpNet > 0 ? hpNet : 0) + busNet + cgTotal + osTotalFinal);

    const totalIncomeFound = this.findByLabel(fullText, "(?:^|[^\\w])Total\\s+income", "14")
      || this.findByLabel(fullText, "Total Income \\(B4-C21\\)", "B4-C21")
      || this.findByLabel(fullText, "(?:^|[^\\w])Total\\s+Income", "3")
      || this.findMoneyByPatterns(fullText, ["(?:^|\\b)3\\.\\s+Total Income\\b", "(?:^|\\b)Total Income\\s*:"])
      || Math.max(0, grossTotalFound - deductionVIA);

    const income = {
      salaryGross: grossSal,
      salaryAllowancesExempt: salAllowancesExempt,
      salaryStdDeduction: salStdDed,
      salaryProfessionalTax: salProfTax,
      salaryNet: salNet,
      hpNet: hpNet,
      hpInterestLoan24b: hpInterest || (hpNet < 0 ? Math.abs(hpNet) : 0),
      businessTurnover: busTurnover,
      businessPresumptive: busPresumptive,
      businessPresumptive44ADA: busPresumptive44ADA,
      businessNonSpeculative: busNonSpec,
      businessSpeculative: busSpeculative,
      businessNet: busNet,
      capitalGainsSTCG111A: stcg111A,
      capitalGainsSTCGNormal: stcgNormal,
      capitalGainsLTCG112A: ltcg112A,
      capitalGainsLTCG112: ltcg112,
      capitalGainsTotal: cgTotal,
      otherSourcesSavings: osSavings,
      otherSourcesDeposits: osDeposits,
      otherSourcesRefund: osRefund,
      otherSourcesDividend: osDividend,
      otherSourcesFamilyPension: osFamilyPension,
      otherSourcesSec57: osSec57,
      otherSourcesOther: osOther,
      otherSourcesTotal: osTotalFinal,
      sec80C: sec80C || (deductionVIA > 0 && !sec80CCD1B && !sec80D && !sec80TTA && !sec80TTB ? Math.min(150000, deductionVIA) : 0),
      sec80CCD1B,
      sec80D,
      sec80TTA,
      sec80TTB,
      grossTotalIncome: grossTotalFound,
      deductionVIA,
      totalIncome: totalIncomeFound,
      lossCarriedForward: busSpeculative < 0 ? Math.abs(busSpeculative) : 0
    };

    const tax = {
      taxAtNormalRates: this.findByLabel(fullText, "Tax at normal rates", "2a") || this.findByLabel(fullText, "Tax payable on total income", "D1") || this.findByLabel(fullText, "Net Tax Payable", "4") || 0,
      taxAtSpecialRates: this.findByLabel(fullText, "Tax at special rates", "2b") || 0,
      rebate87A: this.findByLabel(fullText, "Rebate under section 87A", "2e") || this.findByLabel(fullText, "Rebate u\\/s 87A", "D2") || 0,
      taxAfterRebate: this.findByLabel(fullText, "Tax Payable after Rebate", "2f") || this.findByLabel(fullText, "Tax after rebate", "D3") || 0,
      surcharge: this.findByLabel(fullText, "Surcharge", "2g") || 0,
      cess: this.findByLabel(fullText, "Health and Education Cess", "2h") || this.findByLabel(fullText, "Health and education Cess @4%", "D4") || 0,
      grossTaxLiability: this.findByLabel(fullText, "Gross tax liability", "2i") || this.findByLabel(fullText, "Total Tax and Cess", "D5") || 0,
      relief89: this.findByLabel(fullText, "Section 89", "6a") || this.findByLabel(fullText, "Relief u\\/s 89", "D8") || 0,
      interest234A: this.findByLabel(fullText, "Interest for default in furnishing the return", "8a") || this.findByLabel(fullText, "Interest u\\/s 234A", "D11a") || 0,
      interest234B: this.findByLabel(fullText, "Interest for default in payment of advance tax", "8b") || this.findByLabel(fullText, "Interest u\\/s 234B", "D11b") || 0,
      interest234C: this.findByLabel(fullText, "Interest for deferment of advance tax", "8c") || this.findByLabel(fullText, "Interest u\\/s 234C", "D11c") || 0,
      fee234F: this.findByLabel(fullText, "Fee for default in furnishing return", "8d") || this.findByLabel(fullText, "Fee u\\/s 234F", "D11d") || 0,
      advanceTax: this.findByLabel(fullText, "Advance Tax", "10a") || this.findByLabel(fullText, "Total Advance Tax Paid", "D14") || 0,
      selfAssessmentTax: this.findByLabel(fullText, "Self Assessment Tax", "10d") || this.findByLabel(fullText, "Self Assessment Tax", "10c") || this.findByLabel(fullText, "Total Self Assessment Tax Paid", "D15") || 0,
      tds: this.findByLabel(fullText, "TDS", "10b") || this.findByLabel(fullText, "Total TDS Claimed", "D16") || 0,
      tcs: this.findByLabel(fullText, "TCS", "10c") || this.findByLabel(fullText, "TCS", "10d") || this.findByLabel(fullText, "Total TCS Claimed", "D17") || 0,
      totalTaxesPaid: this.findByLabel(fullText, "Total Taxes Paid", "10e") || this.findByLabel(fullText, "Total Taxes Paid", "D18") || this.findByLabel(fullText, "Taxes Paid", "7") || 0,
      amountPayable: this.findByLabel(fullText, "Amount payable", "11") || this.findByLabel(fullText, "Amount payable", "D19") || 0,
      refund: this.findByLabel(fullText, "Refund", "12") || this.findByLabel(fullText, "Refund", "D20") || 0
    };

    const bankAccounts = [];
    const bankStart = lines.findIndex(l => /DETAILS OF ALL BANK ACCOUNTS/i.test(l));
    const bankEnd = lines.findIndex(l => /SECTION 24\(B\)|VERIFICATION/i.test(l));
    if (bankStart !== -1) {
      const bankRe = /^(\d+)\s+([A-Z]{4}0[A-Z0-9]{6})\s+(.+?)\s+(\d{6,20})\s+(Savings|Current)\s*Account/i;
      for (const l of lines.slice(bankStart, bankEnd === -1 ? bankStart + 15 : bankEnd)) {
        const m = l.match(bankRe);
        if (m) bankAccounts.push({ ifsc: m[2], bank: m[3].trim(), account: m[4], type: m[5] });
      }
    }

    return {
      formType,
      detectedRegime,
      header: {
        name: need(assesseeName || null, "Assessee Name"),
        fatherName: fatherName || null,
        pan: need(panMatch ? panMatch[1] : null, "PAN"),
        assessmentYear: need(ayMatch ? ayMatch[1] : null, "Assessment Year"),
        ackNumber: ackMatch ? ackMatch[1] : null,
        filingDate: filingDateMatch ? (filingDateMatch[1] || filingDateMatch[2]) : null,
        filingSection,
        status: statusMatch ? statusMatch[1].trim() : "Individual - Resident",
        employerName: employerMatch ? employerMatch[1].trim() : null,
        employerTAN: employerMatch && employerMatch[2] ? employerMatch[2] : null,
        email: emailMatch ? emailMatch[0] : null,
        dob: dobMatch ? dobMatch[1] : null,
        aadhaar: aadhaarMatch ? aadhaarMatch[1] : null,
        address
      },
      income,
      tax,
      bankAccounts,
      otherSourcesBreakdown: [],
      tdsDetails: [],
      warnings
    };
  }
};

/* =========================================================================
   2B. MULTI-FORM ITR JSON EXTRACTION & PARSER (ITR-1, ITR-2, ITR-3, ITR-4)
   ========================================================================= */
const ItrJsonParser = {
  num(v) {
    if (v === null || v === undefined || v === "") return 0;
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  },

  str(v) {
    if (v === null || v === undefined) return "";
    return String(v).trim();
  },

  extract(jsonObj) {
    if (!jsonObj || typeof jsonObj !== "object") {
      throw new Error("Invalid ITR JSON structure. Could not parse JSON object.");
    }

    // 1. Detect root node & Form Type
    let root = jsonObj;
    let formType = "ITR";

    if (jsonObj.ITR) {
      const itr = jsonObj.ITR;
      if (itr.ITR1 || itr.ITR_1) { root = itr.ITR1 || itr.ITR_1; formType = "ITR-1"; }
      else if (itr.ITR2 || itr.ITR_2) { root = itr.ITR2 || itr.ITR_2; formType = "ITR-2"; }
      else if (itr.ITR3 || itr.ITR_3) { root = itr.ITR3 || itr.ITR_3; formType = "ITR-3"; }
      else if (itr.ITR4 || itr.ITR_4) { root = itr.ITR4 || itr.ITR_4; formType = "ITR-4"; }
      else { root = itr; }
    } else if (jsonObj.ITR1 || jsonObj.ITR_1) {
      root = jsonObj.ITR1 || jsonObj.ITR_1;
      formType = "ITR-1";
    } else if (jsonObj.ITR2 || jsonObj.ITR_2) {
      root = jsonObj.ITR2 || jsonObj.ITR_2;
      formType = "ITR-2";
    } else if (jsonObj.ITR3 || jsonObj.ITR_3) {
      root = jsonObj.ITR3 || jsonObj.ITR_3;
      formType = "ITR-3";
    } else if (jsonObj.ITR4 || jsonObj.ITR_4) {
      root = jsonObj.ITR4 || jsonObj.ITR_4;
      formType = "ITR-4";
    }

    if (formType === "ITR" && root.FormName) {
      formType = String(root.FormName).toUpperCase();
    } else if (formType === "ITR" && root.Form_ITR1) {
      formType = "ITR-1";
    } else if (formType === "ITR" && root.Form_ITR4) {
      formType = "ITR-4";
    }

    const pers = root.PersonalInfo || root.PartA_GEN1?.PersonalInfo || {};
    const filing = root.FilingStatus || root.PartA_GEN1?.FilingStatus || {};
    const creation = root.CreationInfo || {};
    const ver = root.Verification?.Declaration || root.Verification || {};

    // 2. Personal Information & Header
    let assesseeName = "";
    if (pers.AssesseeName) {
      const fn = this.str(pers.AssesseeName.FirstName);
      const mn = this.str(pers.AssesseeName.MiddleName);
      const sn = this.str(pers.AssesseeName.SurNameOrOrgName || pers.AssesseeName.SurName || pers.AssesseeName.LastName);
      assesseeName = [fn, mn, sn].filter(Boolean).join(" ");
    }
    if (!assesseeName) assesseeName = this.str(pers.Name || ver.AssesseeVerName || creation.SWCreatedBy || "");

    const fatherName = this.str(ver.FatherName || pers.FatherName || "");
    const pan = this.str(pers.PAN || ver.AssesseePAN || root.PAN || "");
    
    let rawAy = this.str(creation.AssessmentYear || root.AssessmentYear || root.Form_ITR1?.AssessmentYear || root.AY || "");
    if (!rawAy.includes("-") && rawAy.length === 4) {
      const yr = parseInt(rawAy, 10);
      rawAy = `${yr}-${String(yr + 1).slice(-2)}`;
    }
    const assessmentYear = rawAy || "2024-25";

    const ackNumber = this.str(root.AckNum || filing.AckNum || ver.AckNum || root.AckNo || "");
    const filingDate = this.str(filing.FilingDate || ver.Date || creation.Date || "");
    
    // Filing Section
    let filingSection = "139(1)";
    const secCode = String(filing.ReturnFileSec || filing.ReturnSection || "");
    if (secCode === "11" || secCode === "139(1)") filingSection = "139(1) - On or before due date";
    else if (secCode === "12" || secCode === "139(4)") filingSection = "139(4) - Belated return";
    else if (secCode === "17" || secCode === "139(5)") filingSection = "139(5) - Revised return";
    else if (secCode) filingSection = `u/s ${secCode}`;

    // Address
    let address = "";
    const addrObj = pers.Address || {};
    if (addrObj) {
      const parts = [
        addrObj.ResidenceNo || addrObj.FlatDoorBlockNo,
        addrObj.ResidenceName || addrObj.NameOfPremises,
        addrObj.RoadStreet,
        addrObj.LocalityOrArea,
        addrObj.CityOrTownOrDistrict,
        addrObj.StateCode,
        addrObj.PinCode
      ].filter(Boolean).map(this.str);
      address = parts.join(", ");
    }

    // Tax Regime Detection
    let detectedRegime = "new";
    const optOut = String(filing.OptOutNewRegime || filing.OptOutNewTaxRegime || root.PartA_GEN1?.OptOutNewTaxRegime || "").toUpperCase();
    const optNew = String(filing.NewTaxRegime || filing.OptNewTaxRegime || root.PartA_GEN1?.NewTaxRegime || "").toUpperCase();
    if (optOut === "Y" || optOut === "YES" || optNew === "N" || optNew === "NO") {
      detectedRegime = "old";
    }

    // 3. Sub-schedules & Income
    const incDed = root.ITR1_IncomeDeductions || root.ITR4_IncomeDeductions || root.IncomeDeductions || {};
    const schedS = root.ScheduleS || {};
    const schedHP = root.ScheduleHP || {};
    const schedBP = root.ScheduleBP || {};
    const schedCG = root.ScheduleCG || {};
    const schedOS = root.ScheduleOS || {};
    const partB_TI = root.PartB_TI || {};
    const partB_TTI = root.PartB_TTI || root.ITR1_TaxComputation || {};
    const schedVIA = incDed.DeductUndChapVIA || root.ScheduleVIA || {};
    const taxPaid = root.TaxPaid?.TaxesPaid || root.TaxesPaid || partB_TTI.TaxesPaid || {};

    // A. Salary
    let grossSal = this.num(incDed.GrossSalary || schedS.Salaries?.GrossSalary || schedS.GrossSalary || 0);
    let salAllowancesExempt = this.num(incDed.AllwncExemptUs10?.TotalAllwncExemptUs10 || incDed.AllwncExemptUs10 || schedS.AllwncExemptUs10 || 0);
    let salStdDed = this.num(incDed.DeductionUs16ia || schedS.DeductionUs16ia || 0);
    let salProfTax = this.num(incDed.EntertainmentAlw16ii || incDed.ProfessionalTaxUs16iii || schedS.ProfessionalTax || 0);
    let salNet = this.num(incDed.IncomeFromSal || schedS.TotalIncomeFromSal || partB_TI.Salaries || 0);
    if (salNet === 0 && grossSal > 0) {
      salNet = Math.max(0, grossSal - salAllowancesExempt - salStdDed - salProfTax);
    }

    // B. House Property
    let hpNet = this.num(incDed.TotalIncomeOfHP || schedHP.TotalIncomeHP || partB_TI.TotalIncomeHP || 0);
    let hpInterest = this.num(incDed.TypeOfHP?.InterestPayable || schedHP.AnnualValue?.InterestPayable || 0);

    // C. Business / Profession
    let busPresumptive = this.num(incDed.IncomeFromBusinessProf || schedBP.PresumptiveInc?.Total || (this.num(schedBP.PersumptiveInc44AD?.Total) + this.num(schedBP.PersumptiveInc44ADA?.Total)) || 0);
    let busTurnover = this.num(incDed.GrossTurnover || schedBP.Turnover44AD || schedBP.GrossReceipts44AD || 0);
    let busPresumptive44ADA = this.num(schedBP.PersumptiveInc44ADA?.Total || 0);
    let busNonSpec = this.num(schedBP.NonSpeculativeBusiness?.NetProfit || 0);
    let busSpeculative = this.num(schedBP.SpeculativeBusiness?.NetProfit || 0);
    let busNet = this.num(partB_TI.ProfBusProf || schedBP.TotalProfBusProf || busPresumptive || (busNonSpec + busSpeculative) || 0);

    // D. Capital Gains
    let stcg111A = this.num(schedCG.ShortTermCapGain?.STCG111A || partB_TI.ShortTermCapGain111A || 0);
    let stcgNormal = this.num(schedCG.ShortTermCapGain?.STCGNormal || partB_TI.ShortTermCapGainNormal || 0);
    let ltcg112A = this.num(schedCG.LongTermCapGain?.LTCG112A || partB_TI.LongTermCapGain112A || 0);
    let ltcg112 = this.num(schedCG.LongTermCapGain?.LTCG112 || partB_TI.LongTermCapGain112 || 0);
    let cgTotal = this.num(schedCG.TotalCapGains || partB_TI.TotalCapGains || (stcg111A + stcgNormal + ltcg112A + ltcg112) || 0);

    // E. Other Sources
    let osSavings = 0;
    let osDeposits = 0;
    let osRefund = 0;
    let osDividend = 0;
    let osFamilyPension = 0;
    let osSec57 = this.num(schedOS.DeductionUs57 || incDed.OthersInc?.DeductionUs57 || 0);
    let osOther = 0;

    if (Array.isArray(incDed.OthersInc?.OthersIncDtls)) {
      for (const item of incDed.OthersInc.OthersIncDtls) {
        const code = String(item.OthersIncCode || "").toUpperCase();
        const amt = this.num(item.OthersIncAmt);
        if (code === "SAV") osSavings += amt;
        else if (code === "IFD") osDeposits += amt;
        else if (code === "TAX") osRefund += amt;
        else if (code === "DIV") osDividend += amt;
        else if (code === "FAP") osFamilyPension += amt;
        else osOther += amt;
      }
    } else {
      osSavings = this.num(schedOS.InterestFromSavings || 0);
      osDeposits = this.num(schedOS.InterestFromDeposit || 0);
      osRefund = this.num(schedOS.InterestOnRefund || 0);
      osDividend = this.num(schedOS.DividendIncome || 0);
      osFamilyPension = this.num(schedOS.FamilyPension || 0);
    }

    let osTotalFinal = this.num(incDed.TotalOthersInc || schedOS.TotalOtherSources || partB_TI.TotalOtherSources || (osSavings + osDeposits + osRefund + osDividend + osFamilyPension + osOther - osSec57) || 0);

    // Deductions Chapter VI-A
    let sec80C = this.num(schedVIA.Section80C || schedVIA.Us80C || 0);
    let sec80CCD1B = this.num(schedVIA.Section80CCD1B || schedVIA.Us80CCD1B || 0);
    let sec80CCD2 = this.num(schedVIA.Section80CCD2 || schedVIA.Us80CCD2 || 0);
    let sec80D = this.num(schedVIA.Section80D || schedVIA.Us80D || 0);
    let sec80TTA = this.num(schedVIA.Section80TTA || schedVIA.Us80TTA || 0);
    let sec80TTB = this.num(schedVIA.Section80TTB || schedVIA.Us80TTB || 0);
    let deductionVIA = this.num(schedVIA.TotalChapVIADeductions || partB_TI.TotalChapVIA || 0);

    // Totals
    let grossTotalIncome = this.num(incDed.GrossTotIncome || partB_TI.GrossTotalIncome || (salNet + (hpNet > 0 ? hpNet : 0) + busNet + cgTotal + osTotalFinal) || 0);
    let totalIncome = this.num(incDed.TotalIncome || partB_TI.TotalIncome || partB_TTI.TotalIncome || Math.max(0, grossTotalIncome - deductionVIA) || 0);

    // Taxes
    const tax = {
      taxAtNormalRates: this.num(partB_TTI.TaxPayableOnTI || partB_TTI.TaxPayableOnTotalIncome || 0),
      taxAtSpecialRates: this.num(partB_TTI.TaxOnSpecialRates || 0),
      rebate87A: this.num(partB_TTI.Rebate87A || 0),
      taxAfterRebate: this.num(partB_TTI.TaxPayableAfterRebate || partB_TTI.TaxAfterRebate || 0),
      surcharge: this.num(partB_TTI.Surcharge || 0),
      cess: this.num(partB_TTI.EducationCess || partB_TTI.HealthEducationCess || 0),
      grossTaxLiability: this.num(partB_TTI.GrossTaxLiability || 0),
      relief89: this.num(partB_TTI.Section89 || 0),
      interest234A: this.num(partB_TTI.IntrstPay?.IntrstCap234A || partB_TTI.Interest234A || 0),
      interest234B: this.num(partB_TTI.IntrstPay?.IntrstCap234B || partB_TTI.Interest234B || 0),
      interest234C: this.num(partB_TTI.IntrstPay?.IntrstCap234C || partB_TTI.Interest234C || 0),
      fee234F: this.num(partB_TTI.IntrstPay?.LateFilingFee234F || partB_TTI.Fee234F || 0),
      advanceTax: this.num(taxPaid.AdvanceTax || 0),
      selfAssessmentTax: this.num(taxPaid.SelfAssessmentTax || 0),
      tds: this.num(taxPaid.TDS || 0),
      tcs: this.num(taxPaid.TCS || 0),
      totalTaxesPaid: this.num(taxPaid.TotalTaxesPaid || 0),
      amountPayable: this.num(partB_TTI.BalTaxPayable || 0),
      refund: this.num(partB_TTI.Refund?.RefundDue || partB_TTI.RefundDue || 0)
    };

    // Bank Accounts
    const bankAccounts = [];
    const bankArr = root.TaxPaid?.BankDetails?.AddtnlBankDetails || root.BankAccounts?.BankAccount || partB_TTI.BankDetails || [];
    if (Array.isArray(bankArr)) {
      for (const b of bankArr) {
        bankAccounts.push({
          ifsc: this.str(b.IFSCCode || b.ifsc),
          bank: this.str(b.BankName || b.bank || "Bank"),
          account: this.str(b.BankAccountNo || b.account),
          type: this.str(b.AccountType || b.type || "Savings")
        });
      }
    }

    return {
      formType,
      detectedRegime,
      header: {
        name: assesseeName || "Assessee",
        fatherName,
        pan,
        assessmentYear,
        ackNumber,
        filingDate,
        filingSection,
        status: this.str(pers.Status || "Individual - Resident"),
        employerName: null,
        employerTAN: null,
        email: this.str(pers.Address?.EmailAddress || ""),
        dob: this.str(pers.DOB || ""),
        aadhaar: this.str(pers.AadhaarCardNo || pers.AadhaarEnrolmentId || ""),
        address
      },
      income: {
        salaryGross: grossSal,
        salaryAllowancesExempt: salAllowancesExempt,
        salaryStdDeduction: salStdDed,
        salaryProfessionalTax: salProfTax,
        salaryNet: salNet,
        hpNet,
        hpInterestLoan24b: hpInterest || (hpNet < 0 ? Math.abs(hpNet) : 0),
        businessTurnover: busTurnover,
        businessPresumptive: busPresumptive,
        businessPresumptive44ADA: busPresumptive44ADA,
        businessNonSpeculative: busNonSpec,
        businessSpeculative: busSpeculative,
        businessNet: busNet,
        capitalGainsSTCG111A: stcg111A,
        capitalGainsSTCGNormal: stcgNormal,
        capitalGainsLTCG112A: ltcg112A,
        capitalGainsLTCG112: ltcg112,
        capitalGainsTotal: cgTotal,
        otherSourcesSavings: osSavings,
        otherSourcesDeposits: osDeposits,
        otherSourcesRefund: osRefund,
        otherSourcesDividend: osDividend,
        otherSourcesFamilyPension: osFamilyPension,
        otherSourcesSec57: osSec57,
        otherSourcesOther: osOther,
        otherSourcesTotal: osTotalFinal,
        sec80C: sec80C || (deductionVIA > 0 && !sec80CCD1B && !sec80D && !sec80TTA && !sec80TTB ? Math.min(150000, deductionVIA) : 0),
        sec80CCD1B,
        sec80CCD2,
        sec80D,
        sec80TTA,
        sec80TTB,
        grossTotalIncome,
        deductionVIA,
        totalIncome,
        lossCarriedForward: busSpeculative < 0 ? Math.abs(busSpeculative) : 0
      },
      tax,
      bankAccounts,
      otherSourcesBreakdown: [],
      tdsDetails: [],
      warnings: []
    };
  }
};

/* =========================================================================
   3. PDF TEXT EXTRACTION WITH PASSWORD SUPPORT (pdf.js v4)
   ========================================================================= */
function waitForPdfjs(timeoutMs = 8000) {
  return new Promise((resolve) => {
    if (window.pdfjsLib) return resolve(true);
    const timer = setTimeout(() => {
      window.removeEventListener("pdfjslib-ready", onReady);
      resolve(!!window.pdfjsLib);
    }, timeoutMs);
    function onReady() { clearTimeout(timer); resolve(true); }
    window.addEventListener("pdfjslib-ready", onReady, { once: true });
  });
}

async function extractPdfTextLines(file, password) {
  const ready = await waitForPdfjs();
  if (!ready || !window.pdfjsLib) {
    throw new Error("PDF processing engine is still initializing. Please wait a moment and try again.");
  }

  const pdfjsLib = window.pdfjsLib;
  const arrayBuffer = await file.arrayBuffer();

  const diag = { isEncrypted: false, passwordWasWrong: false };

  let pdfDoc = null;
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      password: password || undefined
    });
    pdfDoc = await loadingTask.promise;
  } catch (err) {
    if (err.name === "PasswordException") {
      diag.isEncrypted = true;
      if (err.code === 2 || password) diag.passwordWasWrong = true;
      return { lines: [], diag };
    }
    throw err;
  }

  const lines = [];
  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items || [];
    
    // Group text items by line Y-coordinate
    const lineMap = new Map();
    for (const it of items) {
      if (!it.str || !it.str.trim()) continue;
      const y = Math.round(it.transform[5]);
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y).push({ x: it.transform[4], text: it.str });
    }

    // Sort top-to-bottom
    const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);
    for (const y of sortedY) {
      const row = lineMap.get(y).sort((a, b) => a.x - b.x);
      const rowText = row.map(r => r.text).join(" ").trim();
      if (rowText) lines.push(rowText);
    }
  }

  return { lines, diag };
}

/* =========================================================================
   4. UI CONTROLLER & EVENT WIRING (FinnomyItrApp)
   ========================================================================= */
const FinnomyItrApp = {
  selectedFile: null,
  enteredPassword: null,
  rawParsedData: null,
  currentRegime: "new",
  currentAgeGroup: "individual",

  init() {
    this.bindDropzone();
    this.bindButtons();
  },

  bindDropzone() {
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("fileInput");

    if (dropzone && fileInput) {
      dropzone.addEventListener("click", () => fileInput.click());
      
      dropzone.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          fileInput.click();
        }
      });

      fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleFileSelected(e.target.files[0]);
        }
      });

      ["dragenter", "dragover"].forEach(evtName => {
        dropzone.addEventListener(evtName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add("dragover");
        });
      });

      ["dragleave", "drop"].forEach(evtName => {
        dropzone.addEventListener(evtName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove("dragover");
        });
      });

      dropzone.addEventListener("drop", (e) => {
        const dt = e.dataTransfer;
        if (dt && dt.files && dt.files[0]) {
          this.handleFileSelected(dt.files[0]);
        }
      });
    }
  },

  bindButtons() {
    const extractBtn = document.getElementById("extractBtn") || document.getElementById("analyzeBtn");
    if (extractBtn) {
      extractBtn.addEventListener("click", () => this.processFile());
    }

    const howToBtn = document.getElementById("howToDownloadBtn");
    if (howToBtn) {
      howToBtn.addEventListener("click", () => {
        alert("How to download your ITR Return:\n\n1. Login to https://eportal.incometax.gov.in\n2. Go to 'e-File' > 'Income Tax Returns' > 'View Filed Returns'\n3. Click 'Download Form' (PDF) or 'Download JSON' for your desired Assessment Year.\n4. Upload the downloaded file directly here.");
      });
    }

    const submitPwdBtn = document.getElementById("submitPdfPasswordBtn");
    const pwdInput = document.getElementById("pdfPasswordInput");
    if (submitPwdBtn && pwdInput) {
      submitPwdBtn.addEventListener("click", () => {
        const pwd = pwdInput.value.trim();
        if (!pwd) {
          alert("Please enter the PDF password.");
          return;
        }
        this.enteredPassword = pwd;
        this.processFile(pwd);
      });
      pwdInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submitPwdBtn.click();
        }
      });
    }
  },

  handleFileSelected(file) {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith(".pdf") && !name.endsWith(".json")) {
      alert("Please upload an official Income Tax Return (ITR) PDF or JSON file.");
      return;
    }

    this.selectedFile = file;
    this.enteredPassword = null;

    const chipHolder = document.getElementById("fileChipHolder");
    if (chipHolder) {
      const sizeKB = (file.size / 1024).toFixed(1);
      const icon = name.endsWith(".json") ? "📋" : "📄";
      chipHolder.innerHTML = `
        <div class="file-chip">
          <span>${icon} <b>${this.esc(file.name)}</b> (${sizeKB} KB)</span>
          <button id="removeFileBtn" type="button" style="background:none; border:none; color:var(--red); font-size:16px; cursor:pointer; margin-left:8px;" title="Remove file">✕</button>
        </div>
      `;

      const removeBtn = document.getElementById("removeFileBtn");
      if (removeBtn) {
        removeBtn.addEventListener("click", () => this.resetUpload());
      }
    }

    const extractBtn = document.getElementById("extractBtn") || document.getElementById("analyzeBtn");
    if (extractBtn) extractBtn.disabled = false;
  },

  resetUpload() {
    this.selectedFile = null;
    this.enteredPassword = null;
    this.rawParsedData = null;

    const fileInput = document.getElementById("fileInput");
    if (fileInput) fileInput.value = "";

    const chipHolder = document.getElementById("fileChipHolder");
    if (chipHolder) chipHolder.innerHTML = "";

    const extractBtn = document.getElementById("extractBtn") || document.getElementById("analyzeBtn");
    if (extractBtn) extractBtn.disabled = true;

    const pwdHolder = document.getElementById("pdfPasswordHolder");
    if (pwdHolder) pwdHolder.style.display = "none";
  },

  async processFile(password = "") {
    const uploadCard = document.getElementById("upload-card");
    const loadingBox = document.getElementById("loadingBox");
    const errorHolder = document.getElementById("errorHolder");
    const pwdHolder = document.getElementById("pdfPasswordHolder");

    if (!this.selectedFile) return;

    if (uploadCard) uploadCard.style.display = "none";
    if (loadingBox) loadingBox.style.display = "block";

    try {
      const fileName = this.selectedFile.name.toLowerCase();

      // 1. Handle JSON File Upload
      if (fileName.endsWith(".json")) {
        const text = await this.selectedFile.text();
        const jsonObj = JSON.parse(text);
        const parsed = ItrJsonParser.extract(jsonObj);
        this.rawParsedData = parsed;
        this.currentRegime = parsed.detectedRegime || "new";

        if (loadingBox) loadingBox.style.display = "none";
        this.renderReviewScreen();
        return;
      }

      // 2. Handle PDF File Upload
      const { lines, diag } = await extractPdfTextLines(this.selectedFile, password || this.enteredPassword || "");

      if (diag.isEncrypted) {
        if (loadingBox) loadingBox.style.display = "none";
        if (uploadCard) uploadCard.style.display = "block";
        if (pwdHolder) pwdHolder.style.display = "block";
        if (diag.passwordWasWrong) alert("Incorrect password. Please try again.");
        return;
      }

      if (!lines || lines.length === 0) throw new Error("Could not extract any content from PDF.");

      const parsed = ItrParser.extract(lines);
      this.rawParsedData = parsed;
      this.currentRegime = parsed.detectedRegime || "new";

      if (loadingBox) loadingBox.style.display = "none";
      this.renderReviewScreen();

    } catch (err) {
      if (loadingBox) loadingBox.style.display = "none";
      if (uploadCard) uploadCard.style.display = "block";
      if (errorHolder) errorHolder.innerHTML = `<div class="error-box">${this.esc(err.message)}</div>`;
    }
  },

  getFinancialYear(ay) {FinancialYear(ay) {
    if (!ay) return "2024-25";
    const m = String(ay).match(/^(\d{4})-(\d{2,4})$/);
    if (m) {
      const startYr = parseInt(m[1], 10) - 1;
      const endYr = startYr + 1;
      return `${startYr}-${String(endYr).slice(-2)}`;
    }
    return "2024-25";
  },

  renderReviewScreen() {
    const reviewEl = document.getElementById("reviewSection");
    if (!reviewEl) return;

    const data = this.rawParsedData;
    const inc = data.income || {};
    const tax = data.tax || {};
    const hdr = data.header || {};
    const ay = hdr.assessmentYear || "2024-25";
    const formType = data.formType || "ITR";

    const hasSalary = (inc.salaryGross > 0 || inc.salaryNet > 0);
    const hasHP = (inc.hpInterestLoan24b > 0 || inc.hpNet !== 0);
    const hasBusiness = (inc.businessPresumptive > 0 || inc.businessNet > 0 || inc.businessTurnover > 0 || inc.businessSpeculative !== 0);
    const hasCG = (inc.capitalGainsTotal > 0 || inc.capitalGainsSTCG111A > 0 || inc.capitalGainsLTCG112A > 0);
    const hasOS = (inc.otherSourcesTotal > 0 || inc.otherSourcesSavings > 0 || inc.otherSourcesDeposits > 0 || inc.otherSourcesDividend > 0);

    reviewEl.style.display = "block";
    reviewEl.innerHTML = `
      <div class="card review-header">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
          <div>
            <h1 class="page-title" style="margin-bottom:4px;">Review &amp; Verify Your Income Tax Figures</h1>
            <div class="subtitle" style="margin-bottom:0;">
              Extracted from <span class="form-badge-pill">📄 <b>${this.esc(formType)}</b></span> for Assessment Year <b>${this.esc(ay)}</b> (Previous Year <b>${this.esc(this.getFinancialYear(ay))}</b>).
            </div>
          </div>
          <button class="btn secondary" id="reUploadBtn" type="button">Upload Different Return</button>
        </div>

        <!-- Live Summary Metric Grid -->
        <div class="review-metric-grid">
          <div class="metric-card">
            <div class="label">Gross Total Income</div>
            <div class="val" id="disp_live_gti">₹${(inc.grossTotalIncome || 0).toLocaleString('en-IN')}</div>
          </div>
          <div class="metric-card">
            <div class="label">Chapter VI-A Deductions</div>
            <div class="val" id="disp_live_ded">₹${(inc.deductionVIA || 0).toLocaleString('en-IN')}</div>
          </div>
          <div class="metric-card">
            <div class="label">Total Taxable Income</div>
            <div class="val" id="disp_live_tti">₹${(inc.totalIncome || 0).toLocaleString('en-IN')}</div>
          </div>
          <div class="metric-card" style="border-color:#BFDBFE; background:#F0F7FF;">
            <div class="label" style="color:var(--blue);">Tax Regime Selected</div>
            <div class="val" id="disp_live_regime" style="font-size:15px; color:var(--navy); padding-top:2px;">
              ${this.currentRegime === 'new' ? 'New (115BAC)' : 'Old Regime'}
            </div>
          </div>
        </div>

        <div style="background:#F0F4F8; border:1px solid #D0D7DE; border-radius:10px; padding:14px 18px; margin:10px 0 20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <div style="font-weight:700; color:var(--navy); font-size:14.5px;">Tax Regime</div>
            <div style="font-size:12.5px; color:var(--grey);">Filing status detected: <b>${this.currentRegime === 'new' ? 'New Tax Regime (u/s 115BAC)' : 'Old Tax Regime'}</b></div>
          </div>
          <div class="regime-toggle-group">
            <button type="button" class="regime-btn ${this.currentRegime === 'new' ? 'active' : ''}" data-regime="new" id="toggleRegimeNew">New Regime (115BAC)</button>
            <button type="button" class="regime-btn ${this.currentRegime === 'old' ? 'active' : ''}" data-regime="old" id="toggleRegimeOld">Old Tax Regime</button>
          </div>
        </div>

        <!-- 1. Assessee Info Card -->
        <div class="review-head-card active-head">
          <div class="review-head-top">
            <div class="review-head-title">👤 Assessee &amp; Filing Information</div>
          </div>
          <div class="review-head-body">
            <div class="field-row">
              <label for="rev_name">Full Name of Assessee:</label>
              <input type="text" id="rev_name" value="${this.esc(hdr.name || '')}">
            </div>
            <div class="field-row">
              <label for="rev_father">Father's Name:</label>
              <input type="text" id="rev_father" value="${this.esc(hdr.fatherName || '')}">
            </div>
            <div class="field-row">
              <label for="rev_pan">Permanent Account Number (PAN):</label>
              <input type="text" id="rev_pan" value="${this.esc(hdr.pan || '')}" style="text-transform:uppercase;">
            </div>
            <div class="field-row">
              <label for="rev_dob">Date of Birth:</label>
              <input type="text" id="rev_dob" value="${this.esc(hdr.dob || '')}">
            </div>
            <div class="field-row">
              <label for="rev_aadhaar">Aadhaar Number:</label>
              <input type="text" id="rev_aadhaar" value="${this.esc(hdr.aadhaar || '')}">
            </div>
            <div class="field-row">
              <label for="rev_ay">Assessment Year:</label>
              <input type="text" id="rev_ay" value="${this.esc(hdr.assessmentYear || '2024-25')}">
            </div>
            <div class="field-row">
              <label for="rev_status">Residential Status:</label>
              <input type="text" id="rev_status" value="${this.esc(hdr.status || 'Individual - Resident')}">
            </div>
            <div class="field-row">
              <label for="rev_address">Registered Address:</label>
              <input type="text" id="rev_address" value="${this.esc(hdr.address || '')}">
            </div>
          </div>
        </div>

        <!-- 2. Salaries Card -->
        <div class="review-head-card ${hasSalary ? 'active-head' : ''}">
          <div class="review-head-top">
            <div class="review-head-title">💼 1. Income from Salaries</div>
          </div>
          <div class="review-head-body">
            <div class="field-row">
              <label for="rev_salaryGross">Gross Salary Income (u/s 17(1) + 17(2) + 17(3)):</label>
              <input type="number" id="rev_salaryGross" class="calc-trigger" value="${inc.salaryGross || 0}">
            </div>
            <div class="field-row">
              <label for="rev_salaryExempt">Allowances Exempt u/s 10 (HRA / LTA etc.):</label>
              <input type="number" id="rev_salaryExempt" class="calc-trigger" value="${inc.salaryAllowancesExempt || 0}">
            </div>
            <div class="field-row">
              <label for="rev_salaryStdDed">Standard Deduction u/s 16(ia):</label>
              <input type="number" id="rev_salaryStdDed" class="calc-trigger" value="${inc.salaryStdDeduction || (inc.salaryGross > 0 ? 50000 : 0)}">
            </div>
            <div class="field-row">
              <label for="rev_salaryProfTax">Professional Tax u/s 16(iii):</label>
              <input type="number" id="rev_salaryProfTax" class="calc-trigger" value="${inc.salaryProfessionalTax || 0}">
            </div>
          </div>
        </div>

        <!-- 3. House Property Card -->
        <div class="review-head-card ${hasHP ? 'active-head' : ''}">
          <div class="review-head-top">
            <div class="review-head-title">🏠 2. Income / (Loss) from House Property</div>
          </div>
          <div class="review-head-body">
            <div class="field-row">
              <label for="rev_hpInterest24b">Interest on Borrowed Capital (Home Loan) u/s 24(b):</label>
              <input type="number" id="rev_hpInterest24b" class="calc-trigger" value="${inc.hpInterestLoan24b || (inc.hpNet < 0 ? Math.abs(inc.hpNet) : 0)}">
            </div>
            <div class="field-row">
              <label for="rev_hpNet">Net Income / (Loss) from House Property:</label>
              <input type="number" id="rev_hpNet" class="calc-trigger" value="${inc.hpNet || 0}">
            </div>
          </div>
        </div>

        <!-- 4. Business & Profession Card -->
        <div class="review-head-card ${hasBusiness ? 'active-head' : ''}">
          <div class="review-head-top">
            <div class="review-head-title">🏭 3. Profits &amp; Gains from Business / Profession (PGBP)</div>
          </div>
          <div class="review-head-body">
            <div class="field-row">
              <label for="rev_businessTurnover">Gross Turnover / Receipts (u/s 44AD / 44ADA):</label>
              <input type="number" id="rev_businessTurnover" class="calc-trigger" value="${inc.businessTurnover || 0}">
            </div>
            <div class="field-row">
              <label for="rev_businessPresumptive">Presumptive Business Income (u/s 44AD / 44ADA / 44AE):</label>
              <input type="number" id="rev_businessPresumptive" class="calc-trigger" value="${inc.businessPresumptive || 0}">
            </div>
            <div class="field-row">
              <label for="rev_businessNet">Net Profits from Regular Business / Profession:</label>
              <input type="number" id="rev_businessNet" class="calc-trigger" value="${inc.businessNonSpeculative || (inc.businessNet && !inc.businessPresumptive ? inc.businessNet : 0)}">
            </div>
            <div class="field-row">
              <label for="rev_businessSpeculative">Net Speculative Business Income / (Loss):</label>
              <input type="number" id="rev_businessSpeculative" class="calc-trigger" value="${inc.businessSpeculative || 0}">
            </div>
          </div>
        </div>

        <!-- 5. Capital Gains Card -->
        <div class="review-head-card ${hasCG ? 'active-head' : ''}">
          <div class="review-head-top">
            <div class="review-head-title">📈 4. Capital Gains</div>
          </div>
          <div class="review-head-body">
            <div class="field-row">
              <label for="rev_stcg111A">Short-Term Capital Gains u/s 111A (Equity/MF @ 15%):</label>
              <input type="number" id="rev_stcg111A" class="calc-trigger" value="${inc.capitalGainsSTCG111A || 0}">
            </div>
            <div class="field-row">
              <label for="rev_stcgNormal">Short-Term Capital Gains at Applicable Slab Rates:</label>
              <input type="number" id="rev_stcgNormal" class="calc-trigger" value="${inc.capitalGainsSTCGNormal || 0}">
            </div>
            <div class="field-row">
              <label for="rev_ltcg112A">Long-Term Capital Gains u/s 112A (Listed Securities @ 10% on > 1L):</label>
              <input type="number" id="rev_ltcg112A" class="calc-trigger" value="${inc.capitalGainsLTCG112A || 0}">
            </div>
            <div class="field-row">
              <label for="rev_ltcg112">Long-Term Capital Gains u/s 112 (Other Assets @ 20%):</label>
              <input type="number" id="rev_ltcg112" class="calc-trigger" value="${inc.capitalGainsLTCG112 || 0}">
            </div>
          </div>
        </div>

        <!-- 6. Other Sources Card -->
        <div class="review-head-card ${hasOS ? 'active-head' : ''}">
          <div class="review-head-top">
            <div class="review-head-title">🏦 5. Income from Other Sources</div>
          </div>
          <div class="review-head-body">
            <div class="field-row">
              <label for="rev_osSavings">Interest from Savings Bank Accounts (u/s 56):</label>
              <input type="number" id="rev_osSavings" class="calc-trigger" value="${inc.otherSourcesSavings || 0}">
            </div>
            <div class="field-row">
              <label for="rev_osDeposits">Interest from Term / Fixed / Time Deposits:</label>
              <input type="number" id="rev_osDeposits" class="calc-trigger" value="${inc.otherSourcesDeposits || 0}">
            </div>
            <div class="field-row">
              <label for="rev_osRefund">Interest from Income Tax Refund (u/s 244A):</label>
              <input type="number" id="rev_osRefund" class="calc-trigger" value="${inc.otherSourcesRefund || 0}">
            </div>
            <div class="field-row">
              <label for="rev_osDividend">Dividend Income from Domestic Companies / Mutual Funds:</label>
              <input type="number" id="rev_osDividend" class="calc-trigger" value="${inc.otherSourcesDividend || 0}">
            </div>
            <div class="field-row">
              <label for="rev_osFamilyPension">Family Pension Received:</label>
              <input type="number" id="rev_osFamilyPension" class="calc-trigger" value="${inc.otherSourcesFamilyPension || 0}">
            </div>
            <div class="field-row">
              <label for="rev_osSec57">Less: Deductions under Section 57 (Interest / Other Expenses):</label>
              <input type="number" id="rev_osSec57" class="calc-trigger" value="${inc.otherSourcesSec57 || 0}">
            </div>
            <div class="field-row">
              <label for="rev_osOther">Other Miscellaneous Receipts / Any Other Income:</label>
              <input type="number" id="rev_osOther" class="calc-trigger" value="${inc.otherSourcesOther || 0}">
            </div>
          </div>
        </div>

        <!-- 7. Deductions Card -->
        <div class="review-head-card">
          <div class="review-head-top">
            <div class="review-head-title">📑 Deductions under Chapter VI-A (Old Regime)</div>
          </div>
          <div class="review-head-body">
            <div class="field-row">
              <label for="rev_sec80C">Section 80C (PPF, ELSS, EPF, LIC - Max ₹1,50,000):</label>
              <input type="number" id="rev_sec80C" class="calc-trigger" value="${inc.sec80C || inc.deductionVIA || 0}">
            </div>
            <div class="field-row">
              <label for="rev_sec80CCD1B">Section 80CCD(1B) (NPS Extra - Max ₹50,000):</label>
              <input type="number" id="rev_sec80CCD1B" class="calc-trigger" value="${inc.sec80CCD1B || 0}">
            </div>
            <div class="field-row">
              <label for="rev_sec80D">Section 80D (Health Insurance Premium):</label>
              <input type="number" id="rev_sec80D" class="calc-trigger" value="${inc.sec80D || 0}">
            </div>
            <div class="field-row">
              <label for="rev_sec80TTA">Section 80TTA / 80TTB (Savings / Deposit Interest Deduction):</label>
              <input type="number" id="rev_sec80TTA" class="calc-trigger" value="${inc.sec80TTA || inc.sec80TTB || 0}">
            </div>
          </div>
        </div>

        <!-- 8. Taxes Paid Card -->
        <div class="review-head-card">
          <div class="review-head-top">
            <div class="review-head-title">💳 Taxes Paid &amp; Prepaid Credits</div>
          </div>
          <div class="review-head-body">
            <div class="field-row">
              <label for="rev_advanceTax">Advance Tax Paid:</label>
              <input type="number" id="rev_advanceTax" class="calc-trigger" value="${tax.advanceTax || 0}">
            </div>
            <div class="field-row">
              <label for="rev_tds">Total TDS Claimed (Salary + Non-Salary):</label>
              <input type="number" id="rev_tds" class="calc-trigger" value="${tax.tds || 0}">
            </div>
            <div class="field-row">
              <label for="rev_tcs">Total TCS Claimed:</label>
              <input type="number" id="rev_tcs" class="calc-trigger" value="${tax.tcs || 0}">
            </div>
            <div class="field-row">
              <label for="rev_selfAssessmentTax">Self-Assessment Tax Paid:</label>
              <input type="number" id="rev_selfAssessmentTax" class="calc-trigger" value="${tax.selfAssessmentTax || 0}">
            </div>
            <div class="field-row">
              <label for="rev_relief89">Relief claimed u/s 89:</label>
              <input type="number" id="rev_relief89" class="calc-trigger" value="${tax.relief89 || 0}">
            </div>
          </div>
        </div>

        <div class="actions" style="margin-top:24px;">
          <button class="btn green" id="generateComputationBtn" type="button" style="font-size:15px; padding:12px 28px;">Generate Income Tax Computation →</button>
        </div>
      </div>
    `;

    this.bindReviewEvents();
    this.updateLiveReviewSummary();
  },

  updateLiveReviewSummary() {
    try {
      const { hdr, inc, ded, tax } = this.getReviewValues();
      const computed = TaxEngine.compute(inc, ded, tax, { assessmentYear: hdr.assessmentYear, regime: this.currentRegime });
      const gtiEl = document.getElementById("disp_live_gti");
      const dedEl = document.getElementById("disp_live_ded");
      const ttiEl = document.getElementById("disp_live_tti");
      const regEl = document.getElementById("disp_live_regime");

      if (gtiEl) gtiEl.innerText = `₹${computed.income.grossTotalIncome.toLocaleString('en-IN')}`;
      if (dedEl) dedEl.innerText = `₹${computed.deductions.totalChapterVIA.toLocaleString('en-IN')}`;
      if (ttiEl) ttiEl.innerText = `₹${computed.taxComputation.totalIncome.toLocaleString('en-IN')}`;
      if (regEl) regEl.innerText = this.currentRegime === 'new' ? 'New (115BAC)' : 'Old Regime';
    } catch (_) {}
  },

  bindReviewEvents() {
    const reUploadBtn = document.getElementById("reUploadBtn");
    if (reUploadBtn) {
      reUploadBtn.addEventListener("click", () => {
        document.getElementById("reviewSection").style.display = "none";
        document.getElementById("finalSection").style.display = "none";
        document.getElementById("upload-card").style.display = "block";
        this.resetUpload();
      });
    }

    const toggleNew = document.getElementById("toggleRegimeNew");
    const toggleOld = document.getElementById("toggleRegimeOld");

    if (toggleNew && toggleOld) {
      toggleNew.addEventListener("click", () => {
        this.currentRegime = "new";
        toggleNew.classList.add("active");
        toggleOld.classList.remove("active");
        this.updateLiveReviewSummary();
      });

      toggleOld.addEventListener("click", () => {
        this.currentRegime = "old";
        toggleOld.classList.add("active");
        toggleNew.classList.remove("active");
        this.updateLiveReviewSummary();
      });
    }

    const triggers = document.querySelectorAll(".calc-trigger");
    triggers.forEach(input => {
      input.addEventListener("input", () => this.updateLiveReviewSummary());
    });

    const genBtn = document.getElementById("generateComputationBtn");
    if (genBtn) {
      genBtn.addEventListener("click", () => {
        this.renderFinalComputation();
      });
    }
  },

  getReviewValues() {
    const v = (id) => {
      const el = document.getElementById(id);
      return el ? parseFloat(el.value) || 0 : 0;
    };
    const s = (id) => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : "";
    };

    const hdr = {
      name: s("rev_name") || this.rawParsedData?.header?.name || "",
      pan: s("rev_pan") || this.rawParsedData?.header?.pan || "",
      dob: s("rev_dob") || this.rawParsedData?.header?.dob || "",
      fatherName: s("rev_father") || this.rawParsedData?.header?.fatherName || "",
      aadhaar: s("rev_aadhaar") || this.rawParsedData?.header?.aadhaar || "",
      assessmentYear: s("rev_ay") || this.rawParsedData?.header?.assessmentYear || "2024-25",
      status: s("rev_status") || this.rawParsedData?.header?.status || "Individual - Resident",
      ackNumber: this.rawParsedData?.header?.ackNumber || "",
      filingDate: this.rawParsedData?.header?.filingDate || "",
      filingSection: this.rawParsedData?.header?.filingSection || "139(1)",
      employerName: this.rawParsedData?.header?.employerName || "",
      employerTAN: this.rawParsedData?.header?.employerTAN || "",
      email: this.rawParsedData?.header?.email || "",
      address: s("rev_address") || this.rawParsedData?.header?.address || ""
    };

    const salaryGross = v("rev_salaryGross");
    const salaryAllowancesExempt = v("rev_salaryExempt");
    const salaryStdDeduction = v("rev_salaryStdDed") || (salaryGross > 0 ? 50000 : 0);
    const salaryProfessionalTax = v("rev_salaryProfTax");
    const salaryNet = Math.max(0, salaryGross - salaryAllowancesExempt - salaryStdDeduction - salaryProfessionalTax);

    const hpInterest24b = v("rev_hpInterest24b");
    const hpNet = v("rev_hpNet") || (hpInterest24b > 0 ? -hpInterest24b : 0);

    const businessTurnover = v("rev_businessTurnover");
    const businessPresumptive = v("rev_businessPresumptive");
    const businessNonSpeculative = v("rev_businessNet");
    const businessSpeculative = v("rev_businessSpeculative");
    const businessNet = businessPresumptive || businessNonSpeculative || 0;

    const stcg111A = v("rev_stcg111A");
    const stcgNormal = v("rev_stcgNormal");
    const ltcg112A = v("rev_ltcg112A");
    const ltcg112 = v("rev_ltcg112");
    const cgTotal = stcg111A + stcgNormal + ltcg112A + ltcg112;

    const osSavings = v("rev_osSavings");
    const osDeposits = v("rev_osDeposits");
    const osRefund = v("rev_osRefund");
    const osDividend = v("rev_osDividend");
    const osFamilyPension = v("rev_osFamilyPension");
    const osSec57 = v("rev_osSec57");
    const osOther = v("rev_osOther");
    const osGrossSum = osSavings + osDeposits + osRefund + osDividend + osFamilyPension + osOther;
    const osTotalSum = Math.max(0, osGrossSum - osSec57);

    const inc = {
      salaryGross,
      salaryAllowancesExempt,
      salaryStdDeduction,
      salaryProfessionalTax,
      salaryNet,
      hpInterestLoan24b: hpInterest24b,
      hpNet,
      businessTurnover,
      businessPresumptive,
      businessNonSpeculative,
      businessSpeculative,
      businessNet,
      capitalGainsSTCG111A: stcg111A,
      capitalGainsSTCGNormal: stcgNormal,
      capitalGainsLTCG112A: ltcg112A,
      capitalGainsLTCG112: ltcg112,
      capitalGainsTotal: cgTotal,
      otherSourcesSavings: osSavings,
      otherSourcesDeposits: osDeposits,
      otherSourcesRefund: osRefund,
      otherSourcesDividend: osDividend,
      otherSourcesFamilyPension: osFamilyPension,
      otherSourcesSec57: osSec57,
      otherSourcesOther: osOther,
      otherSourcesTotal: osTotalSum
    };

    const ded = {
      sec80C: v("rev_sec80C"),
      sec80CCD1B: v("rev_sec80CCD1B"),
      sec80D: v("rev_sec80D"),
      sec80TTA: v("rev_sec80TTA")
    };

    const tax = {
      advanceTax: v("rev_advanceTax"),
      tds: v("rev_tds"),
      tcs: v("rev_tcs"),
      selfAssessmentTax: v("rev_selfAssessmentTax"),
      relief89: v("rev_relief89")
    };

    return { hdr, inc, ded, tax };
  },

  renderFinalComputation() {
    const { hdr, inc, ded, tax } = this.getReviewValues();
    const ay = hdr.assessmentYear || "2024-25";
    const finYear = this.getFinancialYear(ay);
    const regime = this.currentRegime;

    const computed = TaxEngine.compute(inc, ded, tax, { assessmentYear: ay, regime });
    const compData = computed.taxComputation;
    const incData = computed.income;
    const dedData = computed.deductions;

    const reviewSection = document.getElementById("reviewSection");
    const finalSection = document.getElementById("finalSection");

    if (reviewSection) reviewSection.style.display = "none";
    if (finalSection) {
      finalSection.style.display = "block";
      finalSection.innerHTML = `
        <div class="card computation-container">
          <div class="doc-action-bar" style="background:#F9FAFB; border-bottom:1px solid var(--border);">
            <div class="switch-toggle-wrapper">
              <label class="switch-toggle" for="watermarkToggle">
                <input type="checkbox" id="watermarkToggle" checked>
                <span class="slider-round"></span>
              </label>
              <label class="toggle-label" for="watermarkToggle">Include FinNomy Watermark</label>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button class="btn secondary" id="editFiguresBtn" type="button">← Edit Figures</button>
              <button class="btn green" id="downloadPdfBtn" type="button">📥 Download PDF</button>
            </div>
          </div>

          <!-- Document Render Area -->
          <div id="computation">
            <div id="watermarkLayer" style="background-image: url('assets/logo-nav.png');"></div>

            <div class="doc-header-block">
              <div class="doc-title">COMPUTATION OF TOTAL INCOME</div>
              <div class="doc-sub">ASSESSMENT YEAR: <b>${this.esc(ay)}</b> &nbsp;|&nbsp; PREVIOUS YEAR: <b>${this.esc(finYear)}</b></div>
              <div class="regime-tag-label">Tax Calculated Under: <b>${regime === "new" ? "New Tax Regime (u/s 115BAC)" : "Old Tax Regime"}</b></div>
            </div>

            <!-- Assessee Details Master Table -->
            <table class="assessee-table">
              <tr>
                <td class="k">Name of Assessee</td>
                <td><b>${this.esc(hdr.name || "N/A")}</b></td>
                <td class="k">PAN</td>
                <td><b>${this.esc(hdr.pan || "N/A")}</b></td>
              </tr>
              <tr>
                <td class="k">Father's Name</td>
                <td>${this.esc(hdr.fatherName || "N/A")}</td>
                <td class="k">Status / Residential Status</td>
                <td>${this.esc(hdr.status || "Individual - Resident")}</td>
              </tr>
              <tr>
                <td class="k">Date of Birth</td>
                <td>${this.esc(hdr.dob || "N/A")}</td>
                <td class="k">Aadhaar Number</td>
                <td>${this.esc(hdr.aadhaar || "N/A")}</td>
              </tr>
              <tr>
                <td class="k">Filing Section &amp; Form</td>
                <td>u/s ${this.esc(hdr.filingSection || "139(1)")} (${this.esc(this.rawParsedData?.formType || "ITR")})</td>
                <td class="k">Ack No. &amp; Filing Date</td>
                <td>${this.esc(hdr.ackNumber || "N/A")} ${hdr.filingDate ? 'dt. ' + this.esc(hdr.filingDate) : ''}</td>
              </tr>
              <tr>
                <td class="k">Registered Address</td>
                <td colspan="3">${this.esc(hdr.address || "As reported in ITR")}</td>
              </tr>
            </table>

            <!-- Schedule I: Gross Total Income -->
            <div class="section-h">I. PARTICULARS OF INCOME</div>
            <table class="data-table">
              <tr class="head-row">
                <td colspan="2">A. Income from Salaries</td>
                <td class="num">₹${incData.salaryNet.toLocaleString('en-IN')}</td>
              </tr>
              ${(() => {
                let rows = [];
                let idx = 1;
                if (incData.salaryGross > 0 || incData.salaryNet > 0) {
                  rows.push(`
                    <tr class="sub-row">
                      <td style="width:24px;">${idx++}.</td>
                      <td>Gross Salary Income (u/s 17(1) + 17(2) + 17(3))</td>
                      <td class="num">₹${incData.salaryGross.toLocaleString('en-IN')}</td>
                    </tr>
                  `);
                  if (incData.salaryAllowancesExempt > 0) {
                    rows.push(`
                      <tr class="sub-row">
                        <td style="width:24px;">${idx++}.</td>
                        <td>Less: Allowances exempt u/s 10 (HRA, LTA, etc.)</td>
                        <td class="num">(₹${incData.salaryAllowancesExempt.toLocaleString('en-IN')})</td>
                      </tr>
                    `);
                  }
                  rows.push(`
                    <tr class="sub-row">
                      <td style="width:24px;">${idx++}.</td>
                      <td>Less: Standard Deduction u/s 16(ia)</td>
                      <td class="num">(₹${incData.salaryStdDeduction.toLocaleString('en-IN')})</td>
                    </tr>
                  `);
                  if (incData.salaryProfessionalTax > 0) {
                    rows.push(`
                      <tr class="sub-row">
                        <td style="width:24px;">${idx++}.</td>
                        <td>Less: Professional Tax / Tax on Employment u/s 16(iii)</td>
                        <td class="num">(₹${incData.salaryProfessionalTax.toLocaleString('en-IN')})</td>
                      </tr>
                    `);
                  }
                }
                return rows.join('');
              })()}

              <tr class="head-row">
                <td colspan="2">B. Income / (Loss) from House Property</td>
                <td class="num">₹${incData.hpNet.toLocaleString('en-IN')}</td>
              </tr>
              ${(() => {
                let rows = [];
                let idx = 1;
                if (incData.hpInterestLoan24b > 0) {
                  rows.push(`
                    <tr class="sub-row">
                      <td style="width:24px;">${idx++}.</td>
                      <td>Interest on Borrowed Capital (Home Loan) u/s 24(b)</td>
                      <td class="num">(₹${incData.hpInterestLoan24b.toLocaleString('en-IN')})</td>
                    </tr>
                  `);
                } else if (incData.hpNet !== 0) {
                  rows.push(`
                    <tr class="sub-row">
                      <td style="width:24px;">${idx++}.</td>
                      <td>Net Annual Value / House Property Income</td>
                      <td class="num">₹${incData.hpNet.toLocaleString('en-IN')}</td>
                    </tr>
                  `);
                }
                return rows.join('');
              })()}

              <tr class="head-row">
                <td colspan="2">C. Profits and Gains from Business / Profession</td>
                <td class="num">₹${incData.businessNet.toLocaleString('en-IN')}</td>
              </tr>
              ${(() => {
                let rows = [];
                let idx = 1;
                if (incData.businessPresumptive > 0) {
                  const toText = incData.businessTurnover > 0 ? ` (Gross Receipts: ₹${incData.businessTurnover.toLocaleString('en-IN')})` : '';
                  rows.push(`
                    <tr class="sub-row">
                      <td style="width:24px;">${idx++}.</td>
                      <td>Presumptive Business Income u/s 44AD / 44ADA / 44AE${toText}</td>
                      <td class="num">₹${incData.businessPresumptive.toLocaleString('en-IN')}</td>
                    </tr>
                  `);
                }
                if (incData.businessNonSpeculative > 0) {
                  rows.push(`
                    <tr class="sub-row">
                      <td style="width:24px;">${idx++}.</td>
                      <td>Net Profit from Non-Speculative Business / Profession</td>
                      <td class="num">₹${incData.businessNonSpeculative.toLocaleString('en-IN')}</td>
                    </tr>
                  `);
                }
                return rows.join('');
              })()}

              <tr class="head-row">
                <td colspan="2">D. Capital Gains</td>
                <td class="num">₹${incData.capitalGainsTotal.toLocaleString('en-IN')}</td>
              </tr>
              ${(() => {
                let rows = [];
                let idx = 1;
                if (incData.capitalGainsSTCG111A > 0) {
                  rows.push(`
                    <tr class="sub-row">
                      <td style="width:24px;">${idx++}.</td>
                      <td>Short-Term Capital Gains u/s 111A (Equity/MF @ 15%)</td>
                      <td class="num">₹${incData.capitalGainsSTCG111A.toLocaleString('en-IN')}</td>
                    </tr>
                  `);
                }
                if (incData.capitalGainsSTCGNormal > 0) {
                  rows.push(`
                    <tr class="sub-row">
                      <td style="width:24px;">${idx++}.</td>
                      <td>Short-Term Capital Gains chargeable at Applicable Slab Rates</td>
                      <td class="num">₹${incData.capitalGainsSTCGNormal.toLocaleString('en-IN')}</td>
                    </tr>
                  `);
                }
                if (incData.capitalGainsLTCG112A > 0) {
                  rows.push(`
                    <tr class="sub-row">
                      <td style="width:24px;">${idx++}.</td>
                      <td>Long-Term Capital Gains u/s 112A (Listed Securities @ 10% on > ₹1 Lakh)</td>
                      <td class="num">₹${incData.capitalGainsLTCG112A.toLocaleString('en-IN')}</td>
                    </tr>
                  `);
                }
                if (incData.capitalGainsLTCG112 > 0) {
                  rows.push(`
                    <tr class="sub-row">
                      <td style="width:24px;">${idx++}.</td>
                      <td>Long-Term Capital Gains u/s 112 (Other Capital Assets @ 20%)</td>
                      <td class="num">₹${incData.capitalGainsLTCG112.toLocaleString('en-IN')}</td>
                    </tr>
                  `);
                }
                return rows.join('');
              })()}

              <!-- Granular Other Sources Schedule -->
              <tr class="head-row">
                <td colspan="2">E. Income from Other Sources</td>
                <td class="num">₹${incData.otherSourcesTotal.toLocaleString('en-IN')}</td>
              </tr>
              ${(() => {
                let rows = [];
                let idx = 1;
                if (incData.otherSourcesSavings > 0) {
                  rows.push(`
                    <tr class="sub-row">
                      <td style="width:24px;">${idx++}.</td>
                      <td>Interest from Savings Bank Accounts (u/s 56)</td>
                      <td class="num">₹${incData.otherSourcesSavings.toLocaleString('en-IN')}</td>
                    </tr>
                  `);
                }
                if (incData.otherSourcesDeposits > 0) {
                  rows.push(`
                    <tr class="sub-row">
                      <td style="width:24px;">${idx++}.</td>
                      <td>Interest from Term / Fixed / Time Deposits (Bank/Post Office)</td>
                      <td class="num">₹${incData.otherSourcesDeposits.toLocaleString('en-IN')}</td>
                    </tr>
                  `);
                }
                if (incData.otherSourcesRefund > 0) {
                  rows.push(`
                    <tr class="sub-row">
                      <td style="width:24px;">${idx++}.</td>
                      <td>Interest on Income Tax Refund (u/s 244A)</td>
                      <td class="num">₹${incData.otherSourcesRefund.toLocaleString('en-IN')}</td>
                    </tr>
                  `);
                }
                if (incData.otherSourcesDividend > 0) {
                  rows.push(`
                    <tr class="sub-row">
                      <td style="width:24px;">${idx++}.</td>
                      <td>Dividend Income from Domestic Companies / Mutual Funds</td>
                      <td class="num">₹${incData.otherSourcesDividend.toLocaleString('en-IN')}</td>
                    </tr>
                  `);
                }
                if (incData.otherSourcesFamilyPension > 0) {
                  rows.push(`
                    <tr class="sub-row">
                      <td style="width:24px;">${idx++}.</td>
                      <td>Family Pension Received</td>
                      <td class="num">₹${incData.otherSourcesFamilyPension.toLocaleString('en-IN')}</td>
                    </tr>
                  `);
                }
                if (incData.otherSourcesSec57 > 0) {
                  rows.push(`
                    <tr class="sub-row">
                      <td style="width:24px;">${idx++}.</td>
                      <td>Less: Deductions under Section 57 (Interest / Other Expenses)</td>
                      <td class="num">(₹${incData.otherSourcesSec57.toLocaleString('en-IN')})</td>
                    </tr>
                  `);
                }
                if (incData.otherSourcesOther > 0) {
                  rows.push(`
                    <tr class="sub-row">
                      <td style="width:24px;">${idx++}.</td>
                      <td>Other Miscellaneous Receipts / Any Other Income</td>
                      <td class="num">₹${incData.otherSourcesOther.toLocaleString('en-IN')}</td>
                    </tr>
                  `);
                }
                if (rows.length === 0 && incData.otherSourcesTotal > 0) {
                  rows.push(`
                    <tr class="sub-row">
                      <td style="width:24px;">1.</td>
                      <td>Interest and Other Miscellaneous Income (As per ITR)</td>
                      <td class="num">₹${incData.otherSourcesTotal.toLocaleString('en-IN')}</td>
                    </tr>
                  `);
                }
                return rows.join('');
              })()}

              <tr class="total-row">
                <td colspan="2">GROSS TOTAL INCOME (A + B + C + D + E)</td>
                <td class="num">₹${incData.grossTotalIncome.toLocaleString('en-IN')}</td>
              </tr>
            </table>

            <!-- Schedule II: Deductions -->
            <div class="section-h">II. DEDUCTIONS UNDER CHAPTER VI-A</div>
            <table class="data-table">
              ${regime === "new" ? `
              <tr class="sub-row">
                <td colspan="2">Deductions under Chapter VI-A (Disallowed under New Tax Regime u/s 115BAC)</td>
                <td class="num">₹0</td>
              </tr>
              ` : `
              ${(() => {
                let rows = [];
                let idx = 1;
                if (dedData.sec80C > 0) {
                  rows.push(`
                    <tr class="sub-row">
                      <td style="width:24px;">${idx++}.</td>
                      <td>Section 80C (PPF, ELSS, EPF, Life Insurance Premium, Tuition Fees)</td>
                      <td class="num">₹${dedData.sec80C.toLocaleString('en-IN')}</td>
                    </tr>
                  `);
                }
                if (dedData.sec80CCD1B > 0) {
                  rows.push(`
                    <tr class="sub-row">
                      <td style="width:24px;">${idx++}.</td>
                      <td>Section 80CCD(1B) (National Pension Scheme - Additional Contribution)</td>
                      <td class="num">₹${dedData.sec80CCD1B.toLocaleString('en-IN')}</td>
                    </tr>
                  `);
                }
                if (dedData.sec80D > 0) {
                  rows.push(`
                    <tr class="sub-row">
                      <td style="width:24px;">${idx++}.</td>
                      <td>Section 80D (Health Insurance Premium &amp; Preventive Checkup)</td>
                      <td class="num">₹${dedData.sec80D.toLocaleString('en-IN')}</td>
                    </tr>
                  `);
                }
                if (dedData.sec80TTA > 0) {
                  rows.push(`
                    <tr class="sub-row">
                      <td style="width:24px;">${idx++}.</td>
                      <td>Section 80TTA (Interest on Savings Bank Accounts)</td>
                      <td class="num">₹${dedData.sec80TTA.toLocaleString('en-IN')}</td>
                    </tr>
                  `);
                }
                if (rows.length === 0 && dedData.totalChapterVIA > 0) {
                  rows.push(`
                    <tr class="sub-row">
                      <td style="width:24px;">1.</td>
                      <td>Deductions under Chapter VI-A (As reported in ITR)</td>
                      <td class="num">₹${dedData.totalChapterVIA.toLocaleString('en-IN')}</td>
                    </tr>
                  `);
                }
                return rows.join('');
              })()}
              `}
              <tr class="total-row">
                <td colspan="2">TOTAL DEDUCTIONS UNDER CHAPTER VI-A</td>
                <td class="num">(₹${dedData.totalChapterVIA.toLocaleString('en-IN')})</td>
              </tr>
              <tr class="grand-total-row">
                <td colspan="2">TOTAL TAXABLE INCOME (Rounded off u/s 288A)</td>
                <td class="num">₹${compData.totalIncome.toLocaleString('en-IN')}</td>
              </tr>
            </table>

            <!-- Schedule III: Tax Computation -->
            <div class="section-h">III. COMPUTATION OF TAX LIABILITY</div>
            <table class="data-table">
              <tr class="sub-row">
                <td style="width:20px;">1.</td>
                <td>Tax on Income at Normal Slab Rates</td>
                <td class="num">₹${compData.taxAtNormalRates.toLocaleString('en-IN')}</td>
              </tr>
              ${compData.specialTaxTotal > 0 ? `
              <tr class="sub-row">
                <td>2.</td>
                <td>Tax on Capital Gains at Special Rates (111A / 112A / 112)</td>
                <td class="num">₹${compData.specialTaxTotal.toLocaleString('en-IN')}</td>
              </tr>` : ''}
              <tr class="sub-row">
                <td>3.</td>
                <td>Gross Tax Before Rebate</td>
                <td class="num">₹${compData.grossTaxBeforeRebate.toLocaleString('en-IN')}</td>
              </tr>
              ${compData.rebate87A > 0 ? `
              <tr class="sub-row">
                <td>4.</td>
                <td>Less: Rebate under Section 87A</td>
                <td class="num">(₹${compData.rebate87A.toLocaleString('en-IN')})</td>
              </tr>` : ''}
              <tr class="sub-row">
                <td>5.</td>
                <td>Tax After Rebate</td>
                <td class="num">₹${compData.taxAfterRebate.toLocaleString('en-IN')}</td>
              </tr>
              ${compData.surcharge > 0 ? `
              <tr class="sub-row">
                <td>6.</td>
                <td>Add: Surcharge</td>
                <td class="num">₹${compData.surcharge.toLocaleString('en-IN')}</td>
              </tr>` : ''}
              <tr class="sub-row">
                <td>7.</td>
                <td>Add: Health &amp; Education Cess @ 4%</td>
                <td class="num">₹${compData.cess.toLocaleString('en-IN')}</td>
              </tr>
              ${compData.relief89 > 0 ? `
              <tr class="sub-row">
                <td>8.</td>
                <td>Less: Relief claimed under Section 89</td>
                <td class="num">(₹${compData.relief89.toLocaleString('en-IN')})</td>
              </tr>` : ''}
              ${compData.totalInterestFee > 0 ? `
              <tr class="sub-row">
                <td>9.</td>
                <td>Add: Interest &amp; Fees u/s 234A / 234B / 234C / 234F</td>
                <td class="num">₹${compData.totalInterestFee.toLocaleString('en-IN')}</td>
              </tr>` : ''}
              <tr class="total-row">
                <td colspan="2">TOTAL TAX LIABILITY (Rounded off u/s 288B)</td>
                <td class="num">₹${compData.totalTaxAndInterest.toLocaleString('en-IN')}</td>
              </tr>
            </table>

            <!-- Schedule IV: Taxes Paid & Refund / Payable -->
            <div class="section-h">IV. TAXES PAID &amp; REFUND / AMOUNT PAYABLE</div>
            <table class="data-table">
              <tr class="sub-row">
                <td style="width:20px;">1.</td>
                <td>Advance Tax Paid</td>
                <td class="num">₹${compData.advanceTax.toLocaleString('en-IN')}</td>
              </tr>
              <tr class="sub-row">
                <td>2.</td>
                <td>Tax Deducted at Source (TDS Claimed)</td>
                <td class="num">₹${compData.tds.toLocaleString('en-IN')}</td>
              </tr>
              ${compData.tcs > 0 ? `
              <tr class="sub-row">
                <td>3.</td>
                <td>Tax Collected at Source (TCS Claimed)</td>
                <td class="num">₹${compData.tcs.toLocaleString('en-IN')}</td>
              </tr>` : ''}
              ${compData.selfAssessmentTax > 0 ? `
              <tr class="sub-row">
                <td>4.</td>
                <td>Self-Assessment Tax Paid</td>
                <td class="num">₹${compData.selfAssessmentTax.toLocaleString('en-IN')}</td>
              </tr>` : ''}
              <tr class="total-row">
                <td colspan="2">TOTAL TAXES PAID &amp; PREPAID CREDITS</td>
                <td class="num">₹${compData.totalTaxesPaid.toLocaleString('en-IN')}</td>
              </tr>
              ${compData.refund > 0 ? `
              <tr class="grand-total-row refund-highlight">
                <td colspan="2">NET REFUND DUE TO ASSESSEE</td>
                <td class="num" style="color:var(--green-dark);">₹${compData.refund.toLocaleString('en-IN')}</td>
              </tr>` : `
              <tr class="grand-total-row payable-highlight">
                <td colspan="2">NET TAX AMOUNT PAYABLE</td>
                <td class="num" style="color:var(--red);">₹${compData.amountPayable.toLocaleString('en-IN')}</td>
              </tr>`}
            </table>

            <!-- Bank Accounts Reported -->
            ${this.rawParsedData?.bankAccounts && this.rawParsedData.bankAccounts.length ? `
            <div class="section-h">V. DETAILS OF BANK ACCOUNTS REPORTED</div>
            <table class="detail-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Bank Name</th>
                  <th>IFSC Code</th>
                  <th>Account Number</th>
                  <th>Account Type</th>
                </tr>
              </thead>
              <tbody>
                ${this.rawParsedData.bankAccounts.map((b, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td><b>${this.esc(b.bank || "Bank")}</b></td>
                    <td>${this.esc(b.ifsc || "")}</td>
                    <td>${this.esc(b.account || "")}</td>
                    <td>${this.esc(b.type || "Savings")}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>` : ''}

            <!-- Taxpayer Verification Box -->
            <div class="verification-box">
              <b>VERIFICATION &amp; DECLARATION</b>
              <p>I, <b>${this.esc(hdr.name || "the Assessee")}</b>, son/daughter of <b>${this.esc(hdr.fatherName || "………………………")}</b>, holding PAN <b>${this.esc(hdr.pan || "………………………")}</b>, solemnly declare that to the best of my knowledge and belief, the information given in this computation is correct and complete and is in accordance with the provisions of the Income-tax Act, 1961.</p>
              <div class="sign-row">
                <div>
                  Date: <b>${this.esc(hdr.filingDate || new Date().toLocaleDateString('en-IN'))}</b><br>
                  Place: <b>${this.esc(hdr.address ? hdr.address.split(',')[0] : 'India')}</b>
                </div>
                <div class="signature-line">
                  <b>Signature of Assessee</b>
                </div>
              </div>
            </div>

            <!-- Closing Footer -->
            <div class="closing-footer">
              <div class="footer-left">
                <img src="assets/logo-nav.png" alt="FinNomy Logo">
                <div>
                  <div class="brand">FinNomy™</div>
                  <div class="tag">The One-Stop Finance Ecosystem</div>
                </div>
              </div>
              <div class="footer-right">
                <a href="https://finnomy.com" class="site-link" target="_blank">www.finnomy.com</a>
                <div class="note-text">Generated securely in-browser via FinNomy ITR Computation Generator.</div>
              </div>
            </div>

          </div>
        </div>
      `;

      this.bindDocEvents(hdr);
    }
  },

  bindDocEvents(hdr) {
    const editBtn = document.getElementById("editFiguresBtn");
    if (editBtn) editBtn.addEventListener("click", () => {
      document.getElementById("finalSection").style.display = "none";
      document.getElementById("reviewSection").style.display = "block";
    });

    const watermarkToggle = document.getElementById("watermarkToggle");
    const watermarkLayer = document.getElementById("watermarkLayer");
    if (watermarkToggle && watermarkLayer) {
      watermarkToggle.addEventListener("change", (e) => {
        watermarkLayer.style.display = e.target.checked ? "block" : "none";
      });
    }

    const downloadBtn = document.getElementById("downloadPdfBtn");
    if (downloadBtn) {
      downloadBtn.addEventListener("click", () => this.downloadPdf(hdr));
    }
  },

  async downloadPdf(hdr) {
    const downloadBtn = document.getElementById("downloadPdfBtn");
    const computationEl = document.getElementById("computation");
    if (!computationEl) return;

    if (downloadBtn) {
      downloadBtn.disabled = true;
      downloadBtn.innerText = "⏳ Generating High-Res PDF…";
    }

    try {
      const { jsPDF } = window.jspdf;
      
      const canvas = await html2canvas(computationEl, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1024,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById("computation");
          if (el) {
            el.style.width = "820px";
            el.style.maxWidth = "820px";
            el.style.margin = "0 auto";
            el.style.padding = "24px";
            el.style.background = "#ffffff";
            el.style.boxShadow = "none";
            el.style.borderRadius = "0";
          }
        }
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight, undefined, "FAST");
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight, undefined, "FAST");
        heightLeft -= pdfHeight;
      }

      const panStr = (hdr && hdr.pan ? hdr.pan : "PAN").toUpperCase();
      const ayStr = (hdr && hdr.assessmentYear ? hdr.assessmentYear : "AY").replace(/\//g, "-");
      const filename = `FinNomy_ITR_Computation_${panStr}_${ayStr}.pdf`;
      pdf.save(filename);
    } catch (err) {
      alert("Error exporting PDF: " + (err.message || String(err)));
    } finally {
      if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.innerText = "📥 Download PDF";
      }
    }
  },

  showHowToModal() {
    let modal = document.getElementById("howToItrModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "howToItrModal";
      modal.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,42,74,0.65);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;";
      modal.innerHTML = `
        <div style="background:#ffffff;border-radius:12px;max-width:640px;width:100%;max-height:90vh;overflow-y:auto;padding:28px 24px;box-shadow:0 20px 40px rgba(0,0,0,0.25);position:relative;">
          <button id="closeHowToModalBtn" style="position:absolute;top:16px;right:18px;background:none;border:none;font-size:22px;color:var(--grey);cursor:pointer;line-height:1;">✕</button>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
            <span style="font-size:26px;">📑</span>
            <h2 style="font-size:20px;font-weight:800;color:var(--navy);margin:0;">How to Download your ITR Form PDF</h2>
          </div>
          <p style="font-size:13.5px;color:#4B5563;line-height:1.5;margin-bottom:16px;">
            To generate your certified Computation of Total Income, you need the <b>Full ITR Form</b> (not just the 1-page ITR-V Ack receipt). Here is the official 4-step process:
          </p>
          <ol style="font-size:13.5px;color:#1F2937;line-height:1.7;padding-left:20px;margin-bottom:18px;">
            <li>Visit the official Income Tax portal: <a href="https://eportal.incometax.gov.in/iec/foservices/#/login" target="_blank" style="color:var(--blue);font-weight:600;">eportal.incometax.gov.in/iec/foservices/#/login</a> and Log in with your PAN and password.</li>
            <li>From the top menu, go to: <b>e-File &gt; Income Tax Returns &gt; View Filed Returns</b>.</li>
            <li>Find the relevant Assessment Year (e.g. AY 2024-25 or AY 2025-26) and click <b>"Download Form"</b>.</li>
            <li>Save that downloaded PDF to your device and drop it into this FinNomy tool.</li>
          </ol>
          <div style="background:#FEF3C7;border:1px solid #FCD34D;border-radius:8px;padding:12px 14px;font-size:12.5px;color:#92400E;margin-bottom:18px;">
            <b>💡 Note on Password Protection:</b> Downloaded ITR forms are often password protected. The password is your <b>PAN in lowercase/uppercase</b> followed immediately by your <b>Date of Birth in DDMMYYYY format</b> (e.g., <code>abcde1234f15081990</code>).
          </div>
          <button id="gotItModalBtn" class="btn" style="width:100%;justify-content:center;">Got it, let's proceed</button>
        </div>
      `;
      document.body.appendChild(modal);

      const closeBtn = document.getElementById("closeHowToModalBtn");
      const gotItBtn = document.getElementById("gotItModalBtn");
      if (closeBtn) closeBtn.addEventListener("click", () => { modal.style.display = "none"; });
      if (gotItBtn) gotItBtn.addEventListener("click", () => { modal.style.display = "none"; });
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
      });
    } else {
      modal.style.display = "flex";
    }
  },

  esc(str) {
    if (str === null || str === undefined) return "";
    return String(str).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[m]);
  }
};

// Expose on window object
window.TaxEngine = TaxEngine;
window.ItrParser = ItrParser;
window.FinnomyItrApp = FinnomyItrApp;

// Auto-initialize when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => FinnomyItrApp.init());
} else {
  FinnomyItrApp.init();
}

})();




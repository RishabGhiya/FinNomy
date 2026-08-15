(function() {
"use strict";

/* =========================================================================
   ENGINE — rule-based analysis. No network calls. No AI/LLM. No storage.
   ========================================================================= */

const CATEGORY_RULES = {
  // Checked before the general Income rule so passive inflows (interest, dividends, cashback)
  // don't get lumped into "salary/freelance" — they're real but shouldn't count toward the
  // "how many income sources / how regular is your income" read of the main Income Analysis.
  // Interest specifically is also handled direction-aware in prepTransactions (a debit "interest
  // till..." narration is interest CHARGED, not earned — text alone can't tell direction).
  "Passive Income": [/int\.?\s*paid/, /interest credit/i, /interest till/i, /\bint\.?\s*(cr|credited)\b/i,
    /ach-?div/, /dividend/, /\bcashback\b/, /\brewards?\b/, /\bbonus\b/i, /rent received/i],
  "Refund": [/\brefund(ed)?\b/i, /\breversal\b/i, /transaction reversed/i],
  "Income": [/\bsalary\b/, /neft.*salary/, /\bstipend\b/, /\bfreelance\b/, /consulting fee/],
  "Rent": [/\brent\b/, /\blandlord\b/],
  // Credit card bill payments (CRED, Paytm CC, bank autopay) are debt *settlement* for
  // purchases already made — checked before EMI/Loan since both can say "autopay"/"payment",
  // and mixing revolving card debt into fixed-tenure loan figures would blur two different
  // kinds of obligation together.
  "Credit Card / Debt Payment": [/\bcred\b/, /paytm cc/, /\bcc payment\b/, /card bill/, /card autopay/,
    /(hdfc|icici|sbi|axis|kotak|idfc)\s*(cc|credit card)/, /\bautopay\b.*card/],
  "EMI / Loan": [/\bemi\b/, /\bnach\b.*fin/, /\bloan\b/, /bajaj finserv/],
  "Investments – Tax Saving": [/\bppf\b/, /\belss\b/, /\bnps\b/, /sukanya samriddhi/, /\bssy\b/, /tax saver/],
  "Investments – Wealth Building": [/\bsip\b/, /mutual fund/, /\bmf\b/, /\bstocks?\b/, /zerodha/, /groww/, /\bupstox\b/, /\bkite\b/],
  "Gold / Digital Gold": [/digital gold/i, /\bsgb\b/, /gold bond/i, /\bmmtc\b/],
  "Income Tax": [/income tax/i, /advance tax/i, /self assessment tax/i, /\bitns\s*280\b/i],
  // GST/TDS payments — relevant for both business and personal-freelancer accounts.
  "Tax Payments (GST/TDS)": [/\bgst\b/, /\btds\b/, /\bgstin\b/, /\bchallan\b/, /\bitns\b/],
  "Insurance": [/\blic\b/, /insurance/, /premium/, /sbi life/i, /hdfc life/i, /icici pru/i, /max life/i],
  // Specific utility types checked before the generic Bill Payment catch-all, so a recognisably
  // electricity/mobile/gas bill gets the more precise label rather than falling through to
  // "some kind of bill".
  "Electricity": [/electricity/i, /\btneb\b/, /\bbescom\b/, /\bmseb\b/, /power bill/i],
  "Mobile / Internet": [/broadband/i, /fibernet/i, /\brecharge\b/i, /\bjio\b/i, /\bairtel\b/i, /\bvi\b.*recharge/i, /postpaid/i],
  "Gas & Water": [/gas bill/i, /water bill/i, /\blpg\b/i],
  "Bill Payment": [/\bbbps\b/, /billpay/i, /ib billpay/i, /netbank bill/i],
  "Subscriptions": [/netflix/, /spotify/, /prime video/, /hotstar/, /subscription/, /youtube premium/],
  "Groceries": [/bigbasket/, /\bdmart\b/, /zepto/, /grocery/, /blinkit/, /instamart/, /\bbb\s*now\b/, /jiomart/],
  "Food Delivery": [/swiggy/, /zomato/, /foodorder/, /dominos/],
  "Restaurants & Cafes": [/starbucks/, /\brestaurant/, /\bcafe\b/],
  "Gaming": [/\bsteam\b/, /playstation/i, /\bxbox\b/],
  "Fuel": [/\bfuel\b/, /petrol/, /\bdiesel\b/, /indian oil/, /\bhpcl\b/, /\bbpcl\b/],
  "Cab / Ride-hailing": [/\buber\b/, /\bola\b/, /rapido/, /namma yatri/],
  "Metro / Public Transit": [/\bmetro\b/, /\bbmtc\b/],
  "Flights": [/indigo/i, /\bair ?india\b/i, /spicejet/i, /vistara/i, /akasa/i],
  "Trains": [/\birctc\b/i],
  "Toll / FASTag": [/fastag/i, /\btoll\b/i],
  "Travel & Hotels": [/makemytrip/i, /goibibo/i, /\boyo\b/i, /booking\.com/i, /\bhotel\b/i, /\btrivago\b/i],
  "Shopping": [/amazon/, /flipkart/, /myntra/, /ajio/, /shopping/],
  "Pharmacy": [/pharmacy/i, /netmeds/i, /\b1mg\b/i, /pharmeasy/i],
  "Hospital / Doctor": [/hospital/i, /\bclinic\b/i, /\bapollo\b/i],
  "Diagnostics": [/diagnostic/i, /\bpathology\b/i, /\blab\b.*test/i],
  "Education": [/school fee/i, /college fee/i, /\btuition\b/i, /\bcourse\b/i, /\budemy\b/i, /\bcoursera\b/i],
  "Cash Withdrawal": [/\batm\b/, /cash withdrawal/],
  // Business/professional-services categories — reliable enough keyword signals to add with
  // real confidence, and disproportionately useful for Business Mode specifically since these
  // tend to be larger, recurring line items rather than one-off noise.
  "Professional Fees": [/\bca fees?\b/i, /chartered accountant/i, /\blegal fee/i, /\badvocate\b/i,
    /\bconsulting fee/i, /professional fee/i, /\bauditor\b/i],
  "Advertising & Marketing": [/google ads/i, /facebook ads/i, /\bmeta ads\b/i, /\badvertising\b/i, /\bpromotion(al)?\b.*spend/i],
  "Software & Hosting": [/\baws\b/i, /amazon web services/i, /\bgcp\b/i, /google cloud/i, /\bazure\b/i,
    /\bgodaddy\b/i, /\bhostinger\b/i, /digitalocean/i, /\bnamecheap\b/i, /\bfigma\b/i, /\bcanva\b/i, /\bnotion\b/i],
  "Payment Gateway / POS Settlement": [/\brazorpay\b/i, /\bpayu\b/i, /\bcashfree\b/i, /\binstamojo\b/i,
    /pg settlement/i, /pos settlement/i, /\bccavenue\b/i],
  "Housing Society / Maintenance": [/society maintenance/i, /maintenance charges?/i, /\brwa\b/i],
  "Courier & Logistics": [/\bdtdc\b/i, /\bbluedart\b/i, /\bdelhivery\b/i, /\bcourier\b/i, /\bfedex\b/i, /\bekart\b/i],
  "Donations & Charity": [/\bdonation\b/i, /\bcharity\b/i, /\bngo\b/i, /\btrust fund\b/i],
  // Bank fees/commission — distinct from a transfer itself, worth calling out separately.
  "Bank Charges": [/\bcommission\b/, /\bcharges?\b/, /service charge/, /processing fee/, /\bachdr\b/,
    /\bmin(imum)? bal\b/i, /\bpenal(ty)?\b/i, /\bbrokerage\b/i],
  // A narrow catch-all specifically for UPI narrations that carry *only* a receiving bank's IFSC-
  // style code and nothing else recognisable ("UPI XXXXXXX SBIN", "UPI XXXXXXX KKBK") — this is
  // NOT a general "contains UPI" rule (that would swallow the vast majority of everyday spending,
  // since UPI is the payment rail for almost everything, not a category in itself); it only fires
  // when the bank-code pattern is the sole identifiable content.
  "Bank Transfer / Peer Payment": [/\bupi\b.*\b(sbin|kkbk|icic|hdfc0|utib|pnb|barb|aubl|ubin|idib|cnrb|yesb|indb|ioba|ibkl)\b/i,
    /\bneft\s*dr\b/i, /\brtgs\s*dr\b/i, /\bupi\s*dr\b/i],
  // Wire/bulk transfer rails — common on business accounts (RTGS/NEFT/ACH/cheque/forex), not
  // meaningful to sub-categorize further from the description alone since the actual
  // counterparty is usually a separate reference code, not a recognizable merchant name.
  "Bank Transfers": [/\brtgs\b/, /\bach\b/, /\bneft\b/, /\bchq\b/, /demand draft/, /\bdd\b/,
    /forex txn/, /transfer[\s-]*inb/, /transfer\s+transfer/, /\bcnafbm\b|\bcnafen\b|\bcnafcy\b|\bcnafgd\b/],
  "Transfers": [/upi-.*-to-/, /\bimps\b/, /fund transfer/],
};
const ESSENTIAL = new Set(["Rent", "EMI / Loan", "Electricity", "Mobile / Internet", "Gas & Water", "Bill Payment",
  "Groceries", "Insurance", "Pharmacy", "Hospital / Doctor", "Diagnostics", "Fuel", "Metro / Public Transit",
  "Toll / FASTag", "Education", "Professional Fees", "Software & Hosting", "Payment Gateway / POS Settlement",
  "Housing Society / Maintenance", "Courier & Logistics"]);
const DISCRETIONARY = new Set(["Food Delivery", "Restaurants & Cafes", "Shopping", "Subscriptions", "Gaming",
  "Cab / Ride-hailing", "Flights", "Trains", "Travel & Hotels", "Cash Withdrawal", "Advertising & Marketing",
  "Donations & Charity"]);
// Full list of assignable categories, for the manual override dropdown — kept as a plain array
// (not derived from CATEGORY_RULES keys at render time) so its order is deliberate rather than
// whatever object-key order happens to be.
const CATEGORY_LIST = ["Income", "Passive Income", "Refund", "Payroll / Salary Paid Out", "Rent",
  "Credit Card / Debt Payment", "EMI / Loan", "Investments – Tax Saving", "Investments – Wealth Building",
  "Gold / Digital Gold", "Income Tax", "Tax Payments (GST/TDS)", "Insurance", "Electricity", "Mobile / Internet",
  "Gas & Water", "Bill Payment", "Subscriptions", "Groceries", "Food Delivery", "Restaurants & Cafes", "Gaming",
  "Fuel", "Cab / Ride-hailing", "Metro / Public Transit", "Flights", "Trains", "Toll / FASTag", "Travel & Hotels",
  "Shopping", "Pharmacy", "Hospital / Doctor", "Diagnostics", "Education", "Cash Withdrawal",
  "Professional Fees", "Advertising & Marketing", "Software & Hosting", "Payment Gateway / POS Settlement",
  "Housing Society / Maintenance", "Courier & Logistics", "Donations & Charity", "Bank Charges",
  "Bank Transfer / Peer Payment", "Bank Transfers", "Transfers", "Uncategorized"];
// Quick-commerce / food-delivery / cab micro-rollups — small named views over already-
// categorized transactions (matched independently against the raw description), not a
// replacement for the main category rules above.
const MICRO_ROLLUPS = {
  "Quick Commerce": [/zepto/, /blinkit/, /instamart/, /\bbb\s*now\b/, /jiomart/],
  "Food Delivery": [/swiggy/, /zomato/, /dominos/, /foodorder/],
  "Cab / Commute": [/\buber\b/, /\bola\b/, /rapido/, /namma yatri/, /\bmetro\b/],
};

// Categories whose rules are broad catch-alls (a receiving bank code, a generic transfer rail)
// rather than a specific, recognizable signal — flagged lower-confidence than a named brand or
// a specific keyword like "GST"/"PPF", since there's more room for these to be wrong.
const LOW_CONFIDENCE_CATEGORIES = new Set(["Bank Transfers", "Transfers", "Bank Transfer / Peer Payment"]);
// Contra entries — money moving between the account holder's own accounts (e.g. an NEFT to
// "RISHAB JAIN" at another bank, when the statement belongs to Rishab Jain) isn't spending or
// income, it's the same money changing pockets. Treating it as spend distorts every downstream
// metric (savings rate, Money DNA, essential/discretionary split) since a self-transfer can
// dwarf real spending in total value. "Bank Transfers" (the broad RTGS/NEFT/ACH catch-all,
// which in practice is dominated by exactly this pattern) is excluded from all analytical
// figures; "Bank Transfer / Peer Payment" (identifiable payments to a named individual, like
// "Raghav") is NOT contra — that's real money leaving to someone else, kept as genuine spend.
// This never touches the Overview section, which stays a literal, bank-reconciled ledger.
const CONTRA_CATEGORIES = new Set(["Bank Transfers"]);
function isAnalyticalSpend(t) {
  return t.debit > 0 && t.category !== "Income" && t.category !== "Passive Income" && !CONTRA_CATEGORIES.has(t.category);
}
function isAnalyticalIncome(t) {
  return (t.category === "Income" || t.category === "Passive Income") && !CONTRA_CATEGORIES.has(t.category);
}
function categorizeWithConfidence(description) {
  const desc = (description || "").toLowerCase();
  for (const [category, patterns] of Object.entries(CATEGORY_RULES)) {
    for (const pat of patterns) if (pat.test(desc)) {
      return { category, confidence: LOW_CONFIDENCE_CATEGORIES.has(category) ? 70 : 95 };
    }
  }
  // Fallback: after stripping known transfer-mechanism words, a description that's just a
  // short, plain name with no digits and no business-entity suffix is very likely a peer-to-
  // peer payment to an individual — bucketing it as a peer payment tells the user more than
  // leaving it in a catch-all Uncategorized pile. Only reached when nothing above matched, so
  // it can only improve an otherwise-unclassified transaction, never override a real match.
  // Requires actual evidence this is a payment-rail transaction (a transfer/direction word was
  // present in the original text) rather than firing on any short unrecognized phrase — without
  // that check, ordinary unrecognized business names get mis-swept into "peer payment" too.
  // Tokenizes the same way normalizeMerchant() does (split on non-alphanumeric, drop whole
  // tokens containing a digit) rather than stripping digit characters one at a time — the
  // difference matters: a VPA-derived fragment like "guptaraghav489" needs to disappear
  // entirely, not degrade into the noise word "guptaraghav" that inflates the word count past
  // the point where this still looks like a plain name.
  const transferSignal = /\b(upi|neft|rtgs|imps|dr|cr|paid|received|transfer)\b/i.test(desc);
  const withoutVpaHandle = desc.replace(/@[a-z][a-z0-9]{1,15}\b/gi, " ");
  const rawWords = withoutVpaHandle.split(/[^a-z0-9]+/i).filter(Boolean);
  const stopWords = new Set(["upi", "neft", "rtgs", "imps", "dr", "cr", "to", "from", "paid", "received", "transfer", "of", "son"]);
  const words = rawWords.filter(w => !/\d/.test(w) && !stopWords.has(w.toLowerCase()));
  const businessSuffixes = /\b(ltd|pvt|llp|inc|corp|enterprises?|traders?|stores?|mart|shop|services?|solutions?|technologies|industries|associates|agency|agencies)\b/i;
  const looksLikeName = words.length >= 1 && words.length <= 4 && words.every(w => w.length >= 2) && !businessSuffixes.test(words.join(" "));
  if (looksLikeName && (transferSignal || words.length <= 2)) {
    return { category: "Bank Transfer / Peer Payment", confidence: 55 };
  }
  return { category: "Uncategorized", confidence: 0 };
}
function categorize(description) {
  return categorizeWithConfidence(description).category;
}
const MONTH_ABBREVS_SET = new Set(["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "SEPT", "OCT", "NOV", "DEC"]);
// Canonicalizes well-known brands that show up under multiple narration variants ("AMAZON",
// "AMAZON PAY", "AMAZON SELLER SERVICES", "AMAZON RETAIL" should all group as one merchant, not
// four). Checked against the raw description directly, before token cleanup, so it doesn't
// matter whether a piece of the brand name would otherwise get stripped as noise. This is a
// small, high-confidence starter list, not an attempt at exhaustive brand coverage.
const MERCHANT_ALIASES = [
  { canonical: "Amazon", pattern: /\bamazon\b/i },
  { canonical: "Flipkart", pattern: /\bflipkart\b/i },
  { canonical: "Swiggy", pattern: /\bswiggy\b/i },
  { canonical: "Zomato", pattern: /\bzomato\b/i },
  { canonical: "Uber", pattern: /\buber\b/i },
  { canonical: "Ola", pattern: /\bola\s?(cabs|money|electric)?\b/i },
  { canonical: "Myntra", pattern: /\bmyntra\b/i },
  { canonical: "Netflix", pattern: /\bnetflix\b/i },
  { canonical: "LIC", pattern: /\blic\b/i },
  { canonical: "Zerodha", pattern: /\bzerodha\b/i },
  { canonical: "Airtel", pattern: /\bairtel\b/i },
  { canonical: "Reliance Jio", pattern: /\breliance\s?jio\b/i },
  { canonical: "PhonePe", pattern: /\bphone\s?pe\b/i },
  { canonical: "Paytm", pattern: /\bpaytm\b/i },
  { canonical: "Google Pay", pattern: /\bg\s?pay\b|\bgoogle\s?pay\b/i },
  { canonical: "Bigbasket", pattern: /\bbig\s?basket\b/i },
  { canonical: "Zepto", pattern: /\bzepto\b/i },
  { canonical: "Razorpay", pattern: /\brazorpay\b/i },
  { canonical: "Cashfree", pattern: /\bcashfree\b/i },
  { canonical: "DMart", pattern: /\bd\s?mart\b/i },
  { canonical: "Croma", pattern: /\bcroma\b/i },
  { canonical: "Apollo Pharmacy", pattern: /\bapollo\s?pharmacy\b/i },
  { canonical: "Tata 1mg", pattern: /\btata\s?1mg\b|\b1mg\b/i },
  { canonical: "MedPlus", pattern: /\bmedplus\b/i },
];
function normalizeMerchant(description) {
  let raw = (description || "").toUpperCase();
  for (const { canonical, pattern } of MERCHANT_ALIASES) if (pattern.test(raw)) return canonical;
  // Strip UPI VPA handle suffixes ("ZOMATO@PAYTM" -> "ZOMATO") before tokenizing — matching the
  // "@handle" shape directly (rather than only a fixed list of known PSP names) also catches
  // handles from newer/less common apps that aren't on any hardcoded list.
  raw = raw.replace(/@[A-Z][A-Z0-9]{1,15}\b/g, " ");
  // Split on any non-alphanumeric character (slashes, @, hyphens, punctuation, spaces) so
  // mixed-content tokens like UPI VPA handles ("PAYTMQR11U8KY92") or reference codes stay
  // intact as single tokens rather than being fragmented.
  const rawTokens = raw.split(/[^A-Z0-9]+/).filter(Boolean);
  // Strip connector words, transaction-direction verbs (already captured separately as
  // debit/credit), and month abbreviations — these commonly appear embedded in recurring
  // transaction descriptions (e.g. "SALARY-FEB", "SALARY-MAR") and would otherwise make the
  // same real-world merchant look like a different one every month, breaking recurring-payment
  // detection. Everything else is kept — full merchant names/descriptions, not just the first
  // few words, so the report reflects what the statement actually says.
  const stop = new Set(["UPI", "NEFT", "NACH", "ACH", "D", "BBPS", "TO", "FROM", "PAYMENT",
    "IMPS", "RTGS", "TRANSACTION", "ID", "REF", "NO", "UTR", "VIA", "THROUGH", "BY",
    "PAID", "RECEIVED", "REQUESTED", "SENT", "CREDIT", "CREDITED", "DEBIT", "DEBITED", "DR", "CR",
    // UPI VPA handle suffixes (the part after @ in e.g. "ZOMATO@PAYTM") — pure letters, so
    // they survive the digit-based filter below unless explicitly listed. New PSPs launch
    // handles fairly often, so the generic shape-based filter a few lines down catches ones
    // not on this list too.
    "OKICICI", "OKAXIS", "OKSBI", "OKHDFCBANK", "OKBIZAXIS", "YBL", "PAYTM", "PYTM", "APL",
    "IBL", "AXL", "FBL", "JIO", "SLICE", "FAM", "KOTAK", "FREECHARGE", "RAPL", "WAAXIS"]);
  // Any token containing a digit is dropped whole (not digit-stripped down to a fragment) —
  // reference numbers, masked account digits, and VPA handles are essentially always mixed
  // letters+digits, so this removes them cleanly instead of leaving garbled leftovers like a
  // stray "U" or "KY" behind.
  const tokens = rawTokens.filter(t => !/\d/.test(t) && !stop.has(t) && !MONTH_ABBREVS_SET.has(t));
  // Generous cap (not fully unbounded) purely as a safety net against a rare pathologically
  // long narration overwhelming a table column — in practice this covers the full merchant
  // name/description for the vast majority of real statements.
  return tokens.slice(0, 30).join(" ") || raw.replace(/[^A-Z ]/g, " ").replace(/\s+/g, " ").trim();
}
function toMonthKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }
function sum(arr, fn) { return arr.reduce((s, x) => s + fn(x), 0); }

// Detects the account holder's own name from statement letterhead text ("MR. RISHAB JAIN",
// "MRS. X Y", "M/S ..." for business accounts) — only scans the first ~25 lines, where this
// kind of header field always lives, to avoid false hits deeper in the transaction list.
function detectAccountHolderName(lines) {
  for (const line of lines.slice(0, 25)) {
    const m = line.match(/\b(?:MR|MRS|MS|M\/S)\.?\s+([A-Z][A-Z\s]{2,40})\b/);
    if (m) {
      const words = m[1].trim().replace(/\s+/g, " ").split(" ").filter(w => w.length > 1).slice(0, 4);
      if (words.length >= 2) return words.join(" ");
    }
  }
  return null;
}
// True if the description names the account holder as the counterparty — i.e. this "peer
// payment" is actually money moving to the same person's own account elsewhere, a contra
// entry, not a payment to someone else. Requires every word of the detected name to appear
// (as whole words) rather than a loose substring match, to avoid a coincidental partial hit.
function isSelfTransferDescription(desc, selfName) {
  if (!selfName) return false;
  const upperDesc = (desc || "").toUpperCase();
  const words = selfName.toUpperCase().split(" ").filter(Boolean);
  return words.length >= 2 && words.every(w => new RegExp(`\\b${w}\\b`).test(upperDesc));
}
function prepTransactions(raw, opts) {
  const selfName = opts && opts.selfName;
  const tx = raw.map(r => {
    const debit = Number(r.debit) || 0;
    const credit = Number(r.credit) || 0;
    const catResult = categorizeWithConfidence(r.description);
    let category = catResult.category;
    let categoryConfidence = catResult.confidence;
    // categorize() matches on text alone, so a debit narration containing "salary" (e.g. a
    // business paying an employee, or a personal account paying domestic help) would otherwise
    // land in "Income" — which is a real mis-categorization regardless of account type, since
    // Income should only ever describe money coming in.
    if (debit > 0 && category === "Income") { category = "Payroll / Salary Paid Out"; categoryConfidence = 90; }
    // A "peer payment" narration that actually names the account holder themselves (e.g. "NEFT
    // DR-...-RISHAB JAIN-NETBANK...", when the statement belongs to Rishab Jain) is a
    // self-transfer, not a real payment to someone else — reclassify as the contra category.
    if ((category === "Bank Transfer / Peer Payment" || category === "Transfers") && isSelfTransferDescription(r.description, selfName)) {
      category = "Bank Transfers"; categoryConfidence = 90;
    }
    return {
      date: r.date, description: String(r.description || "").trim(), debit, credit,
      balance: (r.balance !== undefined && r.balance !== null && r.balance !== "") ? Number(r.balance) : null,
      category, categoryConfidence, merchant: normalizeMerchant(r.description), month: toMonthKey(r.date),
    };
  }).sort((a, b) => a.date - b.date);
  // Stable id assigned after sorting, once — re-aggregating later (e.g. after a manual category
  // override) reuses this same array in place rather than re-sorting, so ids stay valid.
  tx.forEach((t, i) => { t._id = i; });
  return tx;
}
function overview(tx) {
  const totalCredit = sum(tx, t => t.credit), totalDebit = sum(tx, t => t.debit);
  const hasBalance = tx.length && tx[0].balance !== null;
  return {
    periodStart: tx[0].date, periodEnd: tx[tx.length - 1].date, numTransactions: tx.length,
    totalInflow: totalCredit, totalOutflow: totalDebit, netChange: totalCredit - totalDebit,
    openingBalance: hasBalance ? (tx[0].balance - tx[0].credit + tx[0].debit) : null,
    closingBalance: hasBalance ? tx[tx.length - 1].balance : null,
  };
}
function categorySummary(tx) {
  const spend = tx.filter(t => isAnalyticalSpend(t));
  const total = sum(spend, t => t.debit);
  const map = new Map();
  for (const t of spend) {
    const e = map.get(t.category) || { category: t.category, totalSpend: 0, count: 0 };
    e.totalSpend += t.debit; e.count += 1; map.set(t.category, e);
  }
  return [...map.values()].map(e => ({ ...e, pctOfSpend: total ? (e.totalSpend / total * 100) : 0 }))
    .sort((a, b) => b.totalSpend - a.totalSpend);
}
// Decouples "how many categories the rule engine can recognize" from "how many slices a chart
// can show" — as the category taxonomy grows, a chart showing every single one becomes an
// unreadable rainbow with lots of 1-2% slivers. Instead, show individually whichever categories
// together make up the bulk of spend (85%, the middle of the 80-90% range), and roll the long
// tail of small categories into one "Everything Else" slice. The full, uncollapsed detail still
// lives in the table underneath every chart that uses this — nothing is hidden, just visually
// deprioritized for the at-a-glance view.
function consolidateForChart(categorySummary, thresholdPct = 85) {
  let cumPct = 0;
  const top = [];
  let restTotal = 0, restCount = 0;
  for (const c of categorySummary) {
    if (cumPct < thresholdPct || top.length === 0) {
      top.push(c);
      cumPct += c.pctOfSpend;
    } else {
      restTotal += c.totalSpend; restCount += c.count;
    }
  }
  if (restTotal > 0) top.push({ category: "Everything Else", totalSpend: restTotal, count: restCount, pctOfSpend: 100 - cumPct });
  return top;
}
function monthlySummary(tx) {
  const map = new Map();
  // Contra entries (self-transfers) excluded from both sides — otherwise moving money to your
  // own other account inflates both "income" and "expense" for that month without reflecting
  // any real change in your financial position.
  // "Income" is tracked separately from "other credit" — a refund, a peer payment received, or
  // any other non-contra credit that isn't actually categorized as Income/Passive Income
  // genuinely isn't income, even though it's real money that touched the account. Conflating
  // the two overstates what "average monthly income" means.
  for (const t of tx) {
    if (CONTRA_CATEGORIES.has(t.category)) continue;
    const e = map.get(t.month) || { month: t.month, income: 0, otherCredit: 0, expense: 0 };
    if (t.category === "Income" || t.category === "Passive Income") e.income += t.credit;
    else e.otherCredit += t.credit;
    e.expense += t.debit;
    map.set(t.month, e);
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month)).map(e => {
    const totalCredit = e.income + e.otherCredit;
    return {
      ...e, totalCredit,
      // Net cash-flow change still reflects ALL real money in vs out — a refund you didn't
      // spend is genuinely money you kept, and belongs in what "you saved" this month.
      netSavings: totalCredit - e.expense,
      // But the *rate* is meaningfully "what share of your income did you keep", so it's
      // measured against income specifically — not total credit — which can legitimately
      // exceed 100% in a month where non-income money (e.g. a big refund) also went unspent.
      savingsRatePct: e.income ? ((totalCredit - e.expense) / e.income * 100) : null,
    };
  });
}
function topMerchants(tx, n = 10) {
  const spend = tx.filter(t => isAnalyticalSpend(t));
  const map = new Map();
  for (const t of spend) {
    const e = map.get(t.merchant) || { merchant: t.merchant, totalSpend: 0, count: 0, categoryCounts: {}, confidenceSum: 0 };
    e.totalSpend += t.debit; e.count += 1;
    e.categoryCounts[t.category] = (e.categoryCounts[t.category] || 0) + 1;
    e.confidenceSum += (t.categoryConfidence ?? 0);
    map.set(t.merchant, e);
  }
  return [...map.values()].map(e => ({
    ...e, category: Object.entries(e.categoryCounts).sort((a, b) => b[1] - a[1])[0][0],
    avgConfidence: e.count ? Math.round(e.confidenceSum / e.count) : 0,
  })).sort((a, b) => b.totalSpend - a.totalSpend).slice(0, n);
}
function incomeAnalysis(tx) {
  const inc = tx.filter(t => t.category === "Income");
  const passive = tx.filter(t => t.category === "Passive Income");
  const passiveSummary = { total: sum(passive, t => t.credit), count: passive.length };
  if (!inc.length) return { numSources: 0, totalIncome: 0, avgMonthlyIncome: 0, regularity: "No income detected", bySource: [], passive: passiveSummary };
  const bySrc = new Map();
  for (const t of inc) {
    const e = bySrc.get(t.merchant) || { merchant: t.merchant, total: 0, count: 0 };
    e.total += t.credit; e.count += 1; bySrc.set(t.merchant, e);
  }
  const monthMap = new Map();
  for (const t of inc) monthMap.set(t.month, (monthMap.get(t.month) || 0) + t.credit);
  const vals = [...monthMap.values()];
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
  const cv = mean ? Math.sqrt(variance) / mean : NaN;
  const regularity = cv < 0.1 ? "Stable / regular" : cv < 0.3 ? "Somewhat variable" : "Irregular";
  return { numSources: bySrc.size, totalIncome: sum(inc, t => t.credit), avgMonthlyIncome: mean, regularity,
    bySource: [...bySrc.values()].sort((a, b) => b.total - a.total), passive: passiveSummary };
}
function recurringTransactions(tx, minOcc = 3) {
  // Direction-aware: a recurring salary credit is just as much a "recurring transaction" as a
  // recurring rent debit, and there's real evidence this matters (a 6-month, same-day-of-month,
  // consistent-amount salary credit was previously invisible here entirely since this only ever
  // looked at debits). A merchant with both regular debits (e.g. bill payments) and unrelated
  // credits shouldn't have those two very different patterns averaged together — whichever
  // direction has more occurrences for that merchant is treated as the recurring one.
  const relevant = tx.filter(t => t.debit > 0 || t.credit > 0);
  const byMerchant = new Map();
  for (const t of relevant) { if (!byMerchant.has(t.merchant)) byMerchant.set(t.merchant, []); byMerchant.get(t.merchant).push(t); }
  const out = [];
  for (const [merchant, list] of byMerchant.entries()) {
    const debitList = list.filter(t => t.debit > 0), creditList = list.filter(t => t.credit > 0);
    const direction = debitList.length >= creditList.length ? "debit" : "credit";
    const primary = direction === "debit" ? debitList : creditList;
    const monthsSeen = new Set(primary.map(t => t.month)).size;
    if (monthsSeen < minOcc) continue;
    const amts = primary.map(t => direction === "debit" ? t.debit : t.credit);
    const amtMean = amts.reduce((a, b) => a + b, 0) / amts.length;
    const amtStd = Math.sqrt(amts.reduce((a, b) => a + (b - amtMean) ** 2, 0) / amts.length);
    const amtCv = amtMean ? amtStd / amtMean : 0;
    const days = primary.map(t => t.date.getDate());
    const dayMean = days.reduce((a, b) => a + b, 0) / days.length;
    const dayStd = Math.sqrt(days.reduce((a, b) => a + (b - dayMean) ** 2, 0) / days.length);
    if (amtCv <= 0.15 && dayStd <= 5) {
      const catCounts = {};
      for (const t of primary) catCounts[t.category] = (catCounts[t.category] || 0) + 1;
      const category = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0][0];
      const sortedDays = [...days].sort((a, b) => a - b);
      out.push({ merchant, monthsSeen, avgAmount: amtMean, typicalDay: sortedDays[Math.floor(sortedDays.length / 2)], category, direction });
    }
  }
  return out.sort((a, b) => b.avgAmount - a.avgAmount);
}
function cashFlow(tx) {
  const monthly = monthlySummary(tx);
  let cum = 0;
  return monthly.map(m => { cum += (m.totalCredit - m.expense);
    return { month: m.month, inflow: m.totalCredit, outflow: m.expense, netCashFlow: m.totalCredit - m.expense, cumulativeNet: cum }; });
}
function financialHealth(tx, monthly) {
  const avgIncome = monthly.reduce((a, b) => a + b.income, 0) / monthly.length;
  const avgOtherCredit = monthly.reduce((a, b) => a + b.otherCredit, 0) / monthly.length;
  const avgExpense = monthly.reduce((a, b) => a + b.expense, 0) / monthly.length;
  // Savings rate is measured against true income (what share of what you *earned* did you keep)
  // — but the amount actually kept reflects all real money in, income or not, since a refund or
  // other one-off credit you didn't spend genuinely was saved too.
  const savingsRate = avgIncome ? (((avgIncome + avgOtherCredit) - avgExpense) / avgIncome * 100) : NaN;
  const spend = tx.filter(t => isAnalyticalSpend(t));
  const essential = sum(spend.filter(t => ESSENTIAL.has(t.category)), t => t.debit);
  const discretionary = sum(spend.filter(t => DISCRETIONARY.has(t.category)), t => t.debit);
  const totalSpend = sum(spend, t => t.debit);
  const emiTotal = sum(tx.filter(t => t.category === "EMI / Loan"), t => t.debit);
  const months = new Set(tx.map(t => t.month)).size;
  const avgEmiMonthly = months ? emiTotal / months : 0;
  const debtToIncome = avgIncome ? (avgEmiMonthly / avgIncome * 100) : NaN;
  // Credit card / debt bill payments are debt settlement, not new spend — kept out of the
  // essential/discretionary split entirely (same treatment as Transfers) so they don't inflate
  // "essential spend," and instead surfaced as their own explicit line here.
  const debtPaymentTotal = sum(tx.filter(t => t.category === "Credit Card / Debt Payment"), t => t.debit);
  const avgMonthlyDebtPayment = months ? debtPaymentTotal / months : 0;
  const balances = tx.filter(t => t.balance !== null).map(t => t.balance);
  const avgBalance = balances.length ? balances.reduce((a, b) => a + b, 0) / balances.length : NaN;
  // Emergency-fund runway uses the *lowest* balance seen, not the average — a stress-test view
  // ("how long could you survive from your worst point") is the more honest question for this
  // framing than an average, which can look comfortable while masking a much tighter low point.
  const lowestBalance = balances.length ? Math.min(...balances) : NaN;
  const runwayMonths = avgExpense ? lowestBalance / avgExpense : NaN;
  const band = isNaN(savingsRate) ? "Unknown" : savingsRate >= 20 ? "Healthy" : savingsRate >= 10 ? "Moderate"
    : savingsRate >= 0 ? "Tight" : "Deficit (spending more than earning)";
  // 50/30/20 mapping: Needs = essential spend + debt repayment, Wants = discretionary spend,
  // Savings = whatever's left of total income — the standard framework's own definition of
  // "savings" (residual, not just what got invested), so this stays correct even for a period
  // with irregular or no investment activity.
  const totalIncomeAll = sum(tx.filter(t => t.category === "Income" || t.category === "Passive Income"), t => t.credit);
  const needsAmt = essential + debtPaymentTotal;
  const wantsAmt = discretionary;
  const savingsAmt = totalIncomeAll - needsAmt - wantsAmt;
  // Business-context figures — computed unconditionally (cheap, reuses sums above); which of
  // these actually get shown is a rendering decision (Personal vs Business mode), not an
  // analysis one, so the engine doesn't need to know which mode the user picked.
  const opExTotal = essential + discretionary;
  const avgMonthlyOpEx = months ? opExTotal / months : 0;
  const workingCapitalRunwayMonths = avgMonthlyOpEx ? lowestBalance / avgMonthlyOpEx : NaN;
  const payrollTotal = sum(tx.filter(t => t.category === "Payroll / Salary Paid Out"), t => t.debit);
  const taxPaymentTotal = sum(tx.filter(t => t.category === "Tax Payments (GST/TDS)"), t => t.debit);
  const vendorTotal = sum(tx.filter(t => t.category === "Bank Transfers"), t => t.debit);
  return { avgMonthlyIncome: avgIncome, avgMonthlyExpense: avgExpense, savingsRatePct: savingsRate, savingsBand: band,
    essentialPct: totalSpend ? (essential / totalSpend * 100) : null, discretionaryPct: totalSpend ? (discretionary / totalSpend * 100) : null,
    debtToIncomePct: debtToIncome, balanceBufferMonths: runwayMonths, avgMonthlyDebtPayment,
    opExPct: totalSpend ? (opExTotal / totalSpend * 100) : null, avgMonthlyOpEx, workingCapitalRunwayMonths,
    avgMonthlyPayroll: months ? payrollTotal / months : 0, avgMonthlyTaxPayments: months ? taxPaymentTotal / months : 0,
    avgMonthlyVendorPayouts: months ? vendorTotal / months : 0,
    budgetRule: totalIncomeAll ? {
      needsAmt, wantsAmt, savingsAmt, totalIncomeAll,
      needsPct: needsAmt / totalIncomeAll * 100, wantsPct: wantsAmt / totalIncomeAll * 100, savingsPct: savingsAmt / totalIncomeAll * 100,
    } : null };
}
function anomalies(tx) {
  const out = [];
  const spend = tx.filter(t => t.debit > 0);
  const byCat = new Map();
  for (const t of spend) { if (!byCat.has(t.category)) byCat.set(t.category, []); byCat.get(t.category).push(t); }
  for (const [cat, list] of byCat.entries()) {
    if (list.length < 4) continue;
    const mean = list.reduce((a, b) => a + b.debit, 0) / list.length;
    const std = Math.sqrt(list.reduce((a, b) => a + (b.debit - mean) ** 2, 0) / list.length);
    if (!std) continue;
    for (const t of list) {
      const z = (t.debit - mean) / std;
      if (z > 2.5) out.push({ date: t.date, description: t.description, amount: t.debit, type: "Unusually large for category",
        detail: `${cat}: ${fmtMoney(t.debit)} vs avg ${fmtMoney(mean)}`, severity: z, txId: t._id, category: t.category });
    }
  }
  // Duplicate-charge detection needs to scale with account activity. On a low-volume personal
  // account, the same amount twice in a day is genuinely unusual. On a high-volume account
  // (hundreds/thousands of transactions), several same-day repeats of a round amount is normal
  // background activity (standard fees, batched transfers), not an anomaly — so both the
  // minimum repeat count AND how "surprising" a repeat is scale with total transaction count.
  const highVolume = spend.length > 500;
  const minDupCount = highVolume ? 3 : 2;
  const dupMap = new Map();
  for (const t of spend) {
    const key = `${t.date.toDateString()}|${t.merchant}|${t.debit}`;
    if (!dupMap.has(key)) dupMap.set(key, []);
    dupMap.get(key).push(t);
  }
  // For high-volume accounts, only flag a same-day repeat as unusual if it's concentrated —
  // i.e. most of that (merchant, amount) pair's occurrences across the *whole* period landed
  // on one day — rather than merely repeating, which on a busy account happens constantly.
  const totalOccurrences = new Map();
  if (highVolume) {
    for (const t of spend) {
      const k = `${t.merchant}|${t.debit}`;
      totalOccurrences.set(k, (totalOccurrences.get(k) || 0) + 1);
    }
  }
  const flaggedDates = new Set();
  for (const [key, list] of dupMap.entries()) {
    if (list.length < minDupCount) continue;
    if (highVolume) {
      const totalKey = `${list[0].merchant}|${list[0].debit}`;
      const total = totalOccurrences.get(totalKey) || list.length;
      if (list.length / total < 0.5) continue; // repeats elsewhere too — normal recurring amount, not a same-day spike
    }
    out.push({ date: list[0].date, description: list[0].description, amount: list[0].debit,
      type: "Possible duplicate charge", detail: `Same amount charged ${list.length}x same day`, severity: list.length, txId: list[0]._id, category: list[0].category });
    flaggedDates.add(list[0].date.toDateString());
  }
  const monthly = monthlySummary(tx);
  const avgMonthlyExpense = monthly.reduce((a, b) => a + b.expense, 0) / monthly.length;
  if (avgMonthlyExpense) {
    const threshold = avgMonthlyExpense * 0.5;
    for (const t of spend) if (t.debit > threshold && !flaggedDates.has(t.date.toDateString()))
      out.push({ date: t.date, description: t.description, amount: t.debit, type: "Large one-off transaction",
        detail: `${fmtMoney(t.debit)} is ${Math.round(t.debit / avgMonthlyExpense * 100)}% of avg monthly spend`,
        severity: t.debit / avgMonthlyExpense, txId: t._id, category: t.category });
  }
  // Cap the list to the most genuinely unusual items — an unbounded list on a large statement
  // (hundreds of matches) stops being useful; showing the top ~25 by severity keeps this section
  // meaningful regardless of account size.
  const MAX_ANOMALIES = 25;
  const capped = out.length > MAX_ANOMALIES
    ? out.slice().sort((a, b) => b.severity - a.severity).slice(0, MAX_ANOMALIES)
    : out;
  return capped.sort((a, b) => a.date - b.date);
}
function classificationCoverage(tx) {
  const total = tx.length;
  const uncategorized = tx.filter(t => t.category === "Uncategorized").length;
  const totalAmt = sum(tx, t => t.debit + t.credit);
  const uncategorizedAmt = sum(tx.filter(t => t.category === "Uncategorized"), t => t.debit + t.credit);
  return { coverageByCountPct: total ? ((total - uncategorized) / total * 100) : null,
    coverageByAmountPct: totalAmt ? ((totalAmt - uncategorizedAmt) / totalAmt * 100) : null,
    uncategorizedCount: uncategorized, uncategorizedAmount: uncategorizedAmt };
}
function microRollups(tx) {
  const spend = tx.filter(t => t.debit > 0);
  const out = {};
  for (const [label, patterns] of Object.entries(MICRO_ROLLUPS)) {
    const matches = spend.filter(t => patterns.some(p => p.test(t.description.toLowerCase())));
    if (matches.length) out[label] = { total: sum(matches, t => t.debit), count: matches.length };
  }
  return out;
}
function spendingPatternInsight(tx) {
  const spend = tx.filter(t => isAnalyticalSpend(t));
  if (!spend.length) return null;
  const byDay = new Map();
  for (const t of spend) {
    const key = t.date.toDateString();
    byDay.set(key, (byDay.get(key) || 0) + t.debit);
  }
  let highestDay = null, highestAmt = -1;
  for (const [key, amt] of byDay.entries()) if (amt > highestAmt) { highestAmt = amt; highestDay = key; }
  // Weekend share is computed over discretionary spend specifically (the categories that
  // actually reflect lifestyle choice) rather than all spend, since rent/EMI/utilities landing
  // on a particular weekday is a billing-cycle artifact, not a behavioral pattern.
  const discretionary = spend.filter(t => DISCRETIONARY.has(t.category));
  const weekendTotal = sum(discretionary.filter(t => [0, 5, 6].includes(t.date.getDay())), t => t.debit);
  const discretionaryTotal = sum(discretionary, t => t.debit);
  return {
    highestSpendDay: highestDay ? { date: new Date(highestDay), amount: highestAmt } : null,
    weekendPct: discretionaryTotal ? (weekendTotal / discretionaryTotal * 100) : null,
  };
}
// Compares the two most recent complete months' spend by category, to surface which category
// moved the most — used for the "one thing to improve" callout. Needs at least 2 months of data;
// returns null otherwise rather than guessing from a single partial month.
function monthOverMonthCategoryTrend(tx) {
  const months = [...new Set(tx.map(t => t.month))].sort();
  if (months.length < 2) return null;
  const [prevMonth, lastMonth] = months.slice(-2);
  const byCategory = (monthKey) => {
    const spend = tx.filter(t => t.month === monthKey && isAnalyticalSpend(t));
    const map = new Map();
    for (const t of spend) map.set(t.category, (map.get(t.category) || 0) + t.debit);
    return map;
  };
  const prev = byCategory(prevMonth), last = byCategory(lastMonth);
  let biggest = null;
  for (const [cat, lastAmt] of last.entries()) {
    const prevAmt = prev.get(cat) || 0;
    if (prevAmt < 500) continue; // ignore categories that barely existed last month — a % swing off a tiny base isn't meaningful
    const pctChange = (lastAmt - prevAmt) / prevAmt * 100;
    if (!biggest || pctChange > biggest.pctChange) biggest = { category: cat, pctChange, prevAmt, lastAmt };
  }
  return biggest;
}
// FinNomy Money DNA — a transparent, rule-based score across 6 dimensions, each computed
// entirely from figures already derived elsewhere in this file (no new data collection, no
// external comparison — every input here comes from the user's own statement). Weights and
// formulas are fixed and disclosed in the report itself, not a black box.
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function computeMoneyDNA(r) {
  const fh = r.financialHealth, inc = r.incomeAnalysis, monthly = r.monthlySummary;

  // Saving Habit — savings rate mapped so 0% sits at 50, +20% or better maxes out at 100,
  // -20% or worse floors at 0.
  const savingScore = isNaN(fh.savingsRatePct) ? 50 : clamp(50 + fh.savingsRatePct * 2.5, 0, 100);

  // Financial Safety — emergency-fund runway (lowest balance ÷ avg. expense), 6+ months maxes out.
  const safetyScore = isNaN(fh.balanceBufferMonths) ? 30 : clamp(fh.balanceBufferMonths / 6 * 100, 0, 100);

  // Debt Management — EMI/loan burden as a share of income; 0% is perfect, 40%+ is 0.
  const debtScore = isNaN(fh.debtToIncomePct) ? 80 : clamp(100 - fh.debtToIncomePct * 2.5, 0, 100);

  // Investing Habit — combined Tax-Saving + Wealth-Building investment as a share of income;
  // 15%+ of income invested maxes out.
  const investTotal = sum(r.categorySummary.filter(c => c.category.startsWith("Investments") || c.category === "Gold / Digital Gold"), c => c.totalSpend);
  const investPctOfIncome = fh.avgMonthlyIncome ? (investTotal / (fh.avgMonthlyIncome * monthly.length) * 100) : 0;
  const investScore = clamp(investPctOfIncome / 15 * 100, 0, 100);

  // Income Stability — from the regularity read already computed in Income Analysis.
  const stabilityMap = { "Stable / regular": 100, "Somewhat variable": 60, "Irregular": 30 };
  const stabilityScore = stabilityMap[inc.regularity] ?? 40;

  // Expense Consistency — coefficient of variation of monthly expense; steadier months score higher.
  const expenseVals = monthly.map(m => m.expense);
  const expMean = expenseVals.reduce((a, b) => a + b, 0) / (expenseVals.length || 1);
  const expStd = Math.sqrt(expenseVals.reduce((a, b) => a + (b - expMean) ** 2, 0) / (expenseVals.length || 1));
  const expCv = expMean ? expStd / expMean : 0;
  const consistencyScore = clamp(100 - expCv * 200, 0, 100);

  // Budget Discipline — how many flagged anomalies relative to transaction volume.
  const anomalyRate = r.overview.numTransactions ? r.anomalies.length / r.overview.numTransactions : 0;
  const disciplineScore = clamp(100 - anomalyRate * 500, 0, 100);

  const dimensions = [
    { key: "saving", label: "Saving Habit", icon: "💰", score: savingScore, weight: 0.25 },
    { key: "safety", label: "Financial Safety", icon: "🛡", score: safetyScore, weight: 0.15 },
    { key: "debt", label: "Debt Management", icon: "💳", score: debtScore, weight: 0.15 },
    { key: "invest", label: "Investing Habit", icon: "📈", score: investScore, weight: 0.15 },
    { key: "stability", label: "Income Stability", icon: "📊", score: stabilityScore, weight: 0.10 },
    { key: "consistency", label: "Expense Consistency", icon: "🧾", score: consistencyScore, weight: 0.10 },
    { key: "discipline", label: "Budget Discipline", icon: "🎯", score: disciplineScore, weight: 0.10 },
  ];
  const overall = Math.round(dimensions.reduce((s, d) => s + d.score * d.weight, 0));
  const band = overall >= 80 ? { label: "Excellent", emoji: "🟢" } : overall >= 60 ? { label: "Good", emoji: "🟡" }
    : overall >= 40 ? { label: "Needs Attention", emoji: "🟠" } : { label: "At Risk", emoji: "🔴" };

  // A single archetype label, not just a number — people share identities more than scores.
  // Priority-ordered: check the most distinctive, clearly-earned traits first, falling back to
  // a safe, still-positive default so nobody lands on something that reads as a judgment.
  const discSpend = r.categorySummary.filter(c => DISCRETIONARY.has(c.category)).reduce((s, c) => s + c.totalSpend, 0);
  const totalSpend = r.categorySummary.reduce((s, c) => s + c.totalSpend, 0);
  const discPct = totalSpend ? discSpend / totalSpend * 100 : 0;
  let personality;
  if (investScore >= 75 && savingScore >= 60) personality = { label: "The Wealth Builder", icon: "📈" };
  else if (savingScore >= 85) personality = { label: "The Disciplined Saver", icon: "🔒" };
  else if (safetyScore >= 85) personality = { label: "The Fortress Builder", icon: "🛡" };
  else if (investScore >= 60 && investScore > savingScore) personality = { label: "The Silent Investor", icon: "🌱" };
  else if (consistencyScore >= 85 && discPct < 30) personality = { label: "The Steady Hand", icon: "⚖️" };
  else if (discPct >= 45) personality = { label: "The Impulse Buyer", icon: "🛍" };
  else if (debtScore < 50) personality = { label: "The Balancing Act", icon: "🎭" };
  else personality = { label: "The Balanced Spender", icon: "⚖️" };

  // Provisional flag — with too much of the statement unclassified, several dimensions above
  // (Investing Habit, Budget Discipline) are being computed from an incomplete picture, so the
  // score itself would be misleading presented as final. Threshold is on coverage *by value*,
  // not by transaction count, since a few large unclassified transactions matter more than many
  // small ones.
  const coveragePct = r.classificationCoverage ? r.classificationCoverage.coverageByAmountPct : null;
  const provisional = coveragePct !== null && coveragePct < 80;
  return { overall, band, dimensions, personality, investPctOfIncome, provisional, coveragePct };
}
// Dynamic "biggest win" — checks the strongest available signal in priority order, rather than
// always reporting net change (which reads as weak/negative on a deficit month even when other
// real positives exist).
function computeBiggestWin(r) {
  const fh = r.financialHealth;
  if (r.overview.netChange > 0) return { text: `Saved ${fmtMoney(r.overview.netChange)}`, sub: "this period" };
  if (fh.savingsRatePct >= 30) return { text: `Savings Rate ${fh.savingsRatePct.toFixed(0)}%`, sub: "well above the 20% benchmark" };
  if (!r.categorySummary.some(c => c.category === "EMI / Loan")) return { text: "No EMI", sub: "debt-free this period" };
  const investMonths = new Set(r.transactions.filter(t => t.category.startsWith("Investments")).map(t => t.month)).size;
  if (investMonths >= r.monthlySummary.length && r.monthlySummary.length >= 2) return { text: "Invested Every Month", sub: "consistent habit" };
  return { text: "You're tracking every rupee", sub: "the first step to fixing the gap below" };
}
// Biggest leak framed relatably (₹/day, not just a category total) — a per-day number is far
// more visceral than a period total, per the "does this create curiosity" brief.
function computeBiggestLeak(r) {
  const top = r.categorySummary.find(c => DISCRETIONARY.has(c.category));
  if (!top) return null;
  const days = Math.max(1, Math.round((r.overview.periodEnd - r.overview.periodStart) / 86400000));
  return { category: top.category, total: top.totalSpend, perDay: top.totalSpend / days };
}
// Always returns something actionable — a flat "nothing spiked" is a dead end; falls back to
// whichever Money DNA dimension has the most room to grow.
function computeOneThingToImprove(r) {
  const trend = r.monthTrend;
  if (trend && trend.pctChange > 5) return { text: `${trend.category} up ${trend.pctChange.toFixed(0)}%`, sub: "vs last month" };
  const weakest = [...r.moneyDNA.dimensions].sort((a, b) => a.score - b.score)[0];
  const suggestions = {
    saving: "Try saving a bit more of your income each month", safety: "Build toward a 6-month emergency fund",
    debt: "Prioritise paying down EMI/debt", invest: "Increase your monthly investment, even a little",
    stability: "Consider diversifying your income sources", consistency: "Smooth out month-to-month spending swings",
    discipline: "Review the flagged transactions for anything unexpected",
  };
  return { text: suggestions[weakest.key] || "Review your recurring subscriptions", sub: `your ${weakest.label.toLowerCase()} score has the most room to grow` };
}
// A modest, realistic reduction (30% of current daily spend in that category) projected annually
// — deliberately conservative rather than suggesting cutting it entirely, which nobody does.
function computePotentialSavings(leak) {
  if (!leak || leak.perDay < 30) return null;
  const reduceBy = Math.round(leak.perDay * 0.3 / 10) * 10;
  return { reduceBy, annual: Math.round(reduceBy * 365), category: leak.category };
}
// Comparisons against widely-published personal-finance guidelines (not FinNomy user data,
// which doesn't exist anywhere given this tool stores nothing) — e.g. the commonly-cited 20%
// savings-rate and 35%-of-income debt-service benchmarks used across financial literacy sources.
function computeComparisonCards(dna, fh) {
  const cards = [];
  if (!isNaN(fh.savingsRatePct)) cards.push({ good: fh.savingsRatePct >= 20,
    text: `Your savings rate is <b>${fh.savingsRatePct >= 20 ? "above" : "below"}</b> the commonly recommended 20%` });
  if (!isNaN(fh.debtToIncomePct)) cards.push({ good: fh.debtToIncomePct <= 35,
    text: `Your debt-to-income ratio is <b>${fh.debtToIncomePct <= 35 ? "within" : "above"}</b> the commonly recommended 35% ceiling` });
  cards.push({ good: dna.investPctOfIncome >= 15,
    text: `Your investing rate is <b>${dna.investPctOfIncome >= 15 ? "above" : "below"}</b> the commonly recommended 15% of income` });
  return cards;
}
// Average number of days into the month before cumulative spend catches up with that month's
// income — a genuinely visceral, easy-to-grasp number ("your salary lasted 18 days").
function computeSalaryExhaustionDays(tx) {
  const monthGroups = new Map();
  for (const t of tx) { if (!monthGroups.has(t.month)) monthGroups.set(t.month, []); monthGroups.get(t.month).push(t); }
  const results = [];
  for (const list of monthGroups.values()) {
    const income = sum(list.filter(t => t.category === "Income"), t => t.credit);
    if (!income) continue;
    const spend = list.filter(t => isAnalyticalSpend(t)).sort((a, b) => a.date - b.date);
    const firstOfMonth = new Date(list[0].date.getFullYear(), list[0].date.getMonth(), 1);
    let cum = 0;
    for (const t of spend) {
      cum += t.debit;
      if (cum >= income) { results.push(Math.round((t.date - firstOfMonth) / 86400000) + 1); break; }
    }
  }
  return results.length ? Math.round(results.reduce((a, b) => a + b, 0) / results.length) : null;
}
function computeMostExpensiveWeekday(tx) {
  const spend = tx.filter(t => isAnalyticalSpend(t));
  const totals = [0, 0, 0, 0, 0, 0, 0];
  for (const t of spend) totals[t.date.getDay()] += t.debit;
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  let maxIdx = 0;
  for (let i = 1; i < 7; i++) if (totals[i] > totals[maxIdx]) maxIdx = i;
  return totals[maxIdx] > 0 ? { day: names[maxIdx], total: totals[maxIdx] } : null;
}
// Simple ratio-based behavioural comparisons — more engaging than isolated category totals.
// Rule-based, deterministic insight generator — 5-10 natural-language observations, each only
// included when there's real supporting data (never padded to hit a target count). Every one of
// these reuses a figure already computed elsewhere in the engine; nothing new is derived just
// for this list, so it can't say anything the rest of the report doesn't already support.
function computeInsights(r) {
  const insights = [];
  const fh = r.financialHealth;
  const get = (cat) => r.categorySummary.find(c => c.category === cat)?.totalSpend || 0;

  // Month-over-month category swing (reuses the same trend computation as "One Thing to Improve").
  if (r.monthTrend && Math.abs(r.monthTrend.pctChange) > 10) {
    const dir = r.monthTrend.pctChange > 0 ? "increased" : "decreased";
    insights.push(`Your ${r.monthTrend.category} spending ${dir} ${Math.abs(r.monthTrend.pctChange).toFixed(0)}% last month.`);
  }

  const foodDelivery = get("Food Delivery"), groceries = get("Groceries");
  if (groceries > 0 && foodDelivery > groceries) insights.push(`You spend ${(foodDelivery / groceries).toFixed(1)}× more on food delivery than on groceries.`);

  const investTotal = get("Investments – Wealth Building") + get("Investments – Tax Saving") + get("Gold / Digital Gold");
  const foodDeliveryMerchants = r.topMerchants.filter(m => m.category === "Food Delivery").reduce((s, m) => s + m.totalSpend, 0);
  if (foodDeliveryMerchants > 0 && investTotal > 0 && foodDeliveryMerchants > investTotal) {
    insights.push(`Your food delivery spend exceeded your total investment contributions this period.`);
  }

  const rent = get("Rent");
  if (rent > 0 && fh.avgMonthlyIncome) {
    const rentPct = (rent / (fh.avgMonthlyIncome * r.monthlySummary.length)) * 100;
    if (rentPct > 5) insights.push(`Rent consumes ${rentPct.toFixed(0)}% of your income over this period.`);
  }

  if (!isNaN(fh.debtToIncomePct)) {
    insights.push(fh.debtToIncomePct <= 35
      ? `Your EMI/loan burden (${fh.debtToIncomePct.toFixed(0)}% of income) is within the commonly healthy range.`
      : `Your EMI/loan burden (${fh.debtToIncomePct.toFixed(0)}% of income) is above the commonly recommended 35% ceiling.`);
  }

  const shopping = get("Shopping");
  if (shopping > 0 && shopping > investTotal) insights.push(`Your shopping spend exceeded your investments this period.`);

  if (r.recurring && r.recurring.length) {
    const subsTotal = r.recurring.filter(x => x.category === "Subscriptions").reduce((s, x) => s + x.avgAmount, 0);
    if (subsTotal > 0) insights.push(`Subscriptions quietly cost you ${fmtMoney(subsTotal)}/month — ${fmtMoney(subsTotal * 12)}/year.`);
  }

  if (r.moneyDNA && r.moneyDNA.investPctOfIncome > 0) {
    insights.push(`You're investing ${r.moneyDNA.investPctOfIncome.toFixed(0)}% of your income — the commonly recommended target is 15%.`);
  }

  return insights.slice(0, 10);
}
// Rule-based achievement badges — each check reuses a figure already computed elsewhere, no new
// data derivation. Deliberately only ever awards badges, never "anti-badges" for what's missing —
// the Financial Health / anomalies sections already surface gaps constructively.
function computeAchievements(r) {
  const fh = r.financialHealth, badges = [];
  if (fh.savingsRatePct >= 30) badges.push({ icon: "🏆", text: "Saved 30%+ of income" });
  if (!r.categorySummary.some(c => c.category === "EMI / Loan")) badges.push({ icon: "🏆", text: "No EMI this period" });
  if (r.categorySummary.some(c => c.category.startsWith("Investments"))) {
    const investMonths = new Set(r.transactions.filter(t => t.category.startsWith("Investments")).map(t => t.month)).size;
    if (investMonths >= r.monthlySummary.length && r.monthlySummary.length >= 3) badges.push({ icon: "🏆", text: "Invested every month" });
  }
  if (fh.balanceBufferMonths >= 6) badges.push({ icon: "🏆", text: "Emergency fund above 6 months" });
  if (r.monthlySummary.length >= 2) {
    const first = r.monthlySummary[0].income, last = r.monthlySummary[r.monthlySummary.length - 1].income;
    if (first > 0 && last > first * 1.05) badges.push({ icon: "🏆", text: "Income increased this period" });
  }
  if (!r.anomalies.some(a => a.type === "Possible duplicate charge")) badges.push({ icon: "🏆", text: "No duplicate charges found" });
  return badges;
}
function aggregateAll(tx) {
  const monthly = monthlySummary(tx);
  const contraTx = tx.filter(t => CONTRA_CATEGORIES.has(t.category));
  const contraSummary = contraTx.length ? {
    count: contraTx.length, outAmount: sum(contraTx, t => t.debit), inAmount: sum(contraTx, t => t.credit),
  } : null;
  const r = { transactions: tx, overview: overview(tx), categorySummary: categorySummary(tx), monthlySummary: monthly,
    topMerchants: topMerchants(tx), incomeAnalysis: incomeAnalysis(tx), recurring: recurringTransactions(tx),
    cashFlow: cashFlow(tx), financialHealth: financialHealth(tx, monthly), anomalies: anomalies(tx),
    classificationCoverage: classificationCoverage(tx), microRollups: microRollups(tx),
    spendingPattern: spendingPatternInsight(tx), monthTrend: monthOverMonthCategoryTrend(tx), contraSummary };
  r.moneyDNA = computeMoneyDNA(r);
  r.achievements = computeAchievements(r);
  r.biggestWin = computeBiggestWin(r);
  r.biggestLeak = computeBiggestLeak(r);
  r.oneThingToImprove = computeOneThingToImprove(r);
  r.potentialSavings = computePotentialSavings(r.biggestLeak);
  r.comparisonCards = computeComparisonCards(r.moneyDNA, r.financialHealth);
  r.salaryExhaustionDays = computeSalaryExhaustionDays(tx);
  r.mostExpensiveWeekday = computeMostExpensiveWeekday(tx);
  r.insights = computeInsights(r);
  return r;
}
function runFullAnalysis(rawTransactions, opts) {
  const tx = prepTransactions(rawTransactions, opts);
  return aggregateAll(tx);
}

/* =========================================================================
   FORMATTING HELPERS
   ========================================================================= */
const inrFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
function fmtMoney(x) {
  if (x === null || x === undefined || isNaN(x)) return "-";
  const sign = x < 0 ? "-" : "";
  return `${sign}₹${inrFormatter.format(Math.abs(Math.round(x)))}`;
}
function fmtDate(d) {
  if (!(d instanceof Date) || isNaN(d)) return "-";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtPct(x, digits = 1) { return (x === null || x === undefined || isNaN(x)) ? "-" : `${x.toFixed(digits)}%`; }
function esc(s) { const d = document.createElement("div"); d.textContent = String(s ?? ""); return d.innerHTML; }

/* =========================================================================
   FILE PARSING — flexible column detection, since real bank exports vary
   ========================================================================= */
const HEADER_ALIASES = {
  date: ["date", "txn date", "tran date", "transaction date", "value date", "value dt",
    "posting date", "book date", "entry date", "date of transaction", "txn dt"],
  description: ["description", "narration", "particulars", "transaction details", "remarks",
    "details", "transaction remarks", "transaction particulars", "desc", "merchant"],
  debit: ["debit", "withdrawal", "withdrawal amt", "withdrawal amount", "dr", "debit amount",
    "debit amt", "amount withdrawn", "paid out", "dr amount", "withdrawals", "debits", "amount out"],
  credit: ["credit", "deposit", "deposit amt", "deposit amount", "cr", "credit amount",
    "credit amt", "amount deposited", "paid in", "cr amount", "deposits", "credits", "amount in"],
  balance: ["balance", "closing balance", "available balance", "balance amt", "closing bal",
    "running balance", "balance amount", "book balance", "ledger balance", "current balance", "net balance"],
  amount: ["amount", "amt", "transaction amount", "txn amount"],
  type: ["type", "dr/cr", "cr/dr", "transaction type", "dr cr", "cr dr", "indicator"],
};
// Real bank exports rarely match a fixed alias list exactly — headers show up as "Withdrawal
// Amt." (trailing period), "Debit Amount (Rs.)", "Narration " (trailing space), etc., and every
// bank phrases things a little differently besides. Comparing after stripping punctuation (to
// spaces, not removed — "Chq./Ref.No." should split into separate words, not fuse into one),
// then falling back to a word-boundary-safe "header contains the alias" check for anything that
// doesn't match exactly, covers real-world variation across banks far better than any fixed
// list ever could on its own. The word-boundary padding matters: without it, a short alias like
// "date" would wrongly match inside an unrelated header like "Updated By".
function normalizeHeaderText(h) {
  return (h || "").toString().trim().toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
function findColumn(headers, aliases) {
  const norm = headers.map(normalizeHeaderText);
  const normAliases = aliases.map(normalizeHeaderText);
  for (const alias of normAliases) {
    const idx = norm.indexOf(alias);
    if (idx !== -1) return headers[idx];
  }
  for (const alias of normAliases) {
    const idx = norm.findIndex(h => (" " + h + " ").includes(" " + alias + " "));
    if (idx !== -1) return headers[idx];
  }
  return null;
}
// Scores how well a single row of raw cell values looks like the *actual* header row for a
// transaction table — checks each known field (date/description/debit/credit/balance/amount/
// type) against the same alias list findColumn() uses, an exact match scoring higher than a
// fuzzy one. A row only counts as a plausible header at all if it has a Date, a Description,
// and at least one amount-bearing column (debit, credit, or a single Amount column) — a row
// missing any of those is almost certainly account info, a title, or a blank spacer row, not
// the header.
function scoreHeaderCandidate(cells) {
  const norm = cells.map(c => normalizeHeaderText(c == null ? "" : String(c)));
  const found = {};
  let score = 0;
  for (const field of Object.keys(HEADER_ALIASES)) {
    const normAliases = HEADER_ALIASES[field].map(normalizeHeaderText);
    let hitIndex = -1, confidence = 0;
    for (const alias of normAliases) {
      const idx = norm.indexOf(alias);
      if (idx !== -1) { hitIndex = idx; confidence = 100; break; }
    }
    if (hitIndex === -1) {
      for (const alias of normAliases) {
        const idx = norm.findIndex(h => h && (" " + h + " ").includes(" " + alias + " "));
        if (idx !== -1) { hitIndex = idx; confidence = 70; break; }
      }
    }
    if (hitIndex !== -1) { found[field] = { index: hitIndex, confidence }; score += confidence; }
  }
  const hasEssentials = !!(found.date && found.description && (found.debit || found.credit || found.amount));
  return { score: hasEssentials ? score : 0, found, hasEssentials };
}
// Scans the first `maxScan` rows of raw, unparsed data for the row that most looks like the
// real header row — real bank exports sometimes put a logo/address/account-summary block
// before the actual column headers, so assuming row 1 is always the header causes an otherwise
// perfectly valid file to fail outright. 50 is the real, evidence-based number: a genuine HDFC
// .xls export had exactly 20 full rows of letterhead/branch/account-holder detail before the
// header — the previous limit of 20 missed it by exactly one row. Returns the best-scoring
// candidate, or null if nothing in the scanned range looks like a header at all.
function findHeaderRow(rawRows, maxScan = 50) {
  let best = null;
  const limit = Math.min(maxScan, rawRows.length);
  for (let i = 0; i < limit; i++) {
    const row = rawRows[i];
    if (!row || !row.length) continue;
    const result = scoreHeaderCandidate(row);
    if (result.hasEssentials && (!best || result.score > best.result.score)) best = { rowIndex: i, result };
  }
  return best;
}
function parseIndianDate(val) {
  if (val instanceof Date) return val;
  if (typeof val === "number") { // Excel serial date
    const epoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(epoch.getTime() + val * 86400000);
  }
  const s = String(val).trim();
  // Try DD/MM/YYYY or DD-MM-YYYY first (common on Indian statements)
  let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let [, d, mo, y] = m;
    if (y.length === 2) y = "20" + y;
    return new Date(Number(y), Number(mo) - 1, Number(d));
  }
  const d2 = new Date(s);
  return isNaN(d2) ? null : d2;
}
function mapRowsToTransactions(rows, headers) {
  const dateCol = findColumn(headers, HEADER_ALIASES.date);
  const descCol = findColumn(headers, HEADER_ALIASES.description);
  const debitCol = findColumn(headers, HEADER_ALIASES.debit);
  const creditCol = findColumn(headers, HEADER_ALIASES.credit);
  const balanceCol = findColumn(headers, HEADER_ALIASES.balance);
  const amountCol = findColumn(headers, HEADER_ALIASES.amount);
  const typeCol = findColumn(headers, HEADER_ALIASES.type);

  if (!dateCol || !descCol) return { error: "missing_columns", detail: { dateCol, descCol } };
  if (!debitCol && !creditCol && !amountCol) return { error: "missing_amount_columns" };

  // Many statements append a "STATEMENT SUMMARY" mini-table (Opening/Closing balance, Dr/Cr
  // counts) after the real transaction rows, reusing the exact same column positions with no
  // new header row in between — without a stop condition, that summary row (e.g. "Debits:
  // 666659.32, Credits: 742011, Closing Bal: 75351.68") gets read as if it were one more
  // transaction. These phrases are specific enough that they won't appear in a real narration.
  const STATEMENT_END_MARKERS_RE = /\bstatement summary\b|\bend of statement\b/i;

  const out = [];
  // Track how many rows actually had *some* content worth parsing (ignoring fully-blank rows,
  // which are extremely common as trailing rows in real exports and shouldn't count as
  // "failed to parse") — the ratio of those to successfully-parsed rows is a real confidence
  // signal that validateParsedData() can't otherwise see, since failed rows never make it into
  // the transactions array at all.
  let nonBlankRows = 0;
  for (const row of rows) {
    if (Object.values(row).some(v => v && STATEMENT_END_MARKERS_RE.test(String(v)))) break;
    const hasContent = row[dateCol] || row[descCol] || row[debitCol] || row[creditCol] || row[amountCol];
    if (!hasContent) continue;
    nonBlankRows++;
    const dateVal = parseIndianDate(row[dateCol]);
    if (!dateVal) continue;
    let debit = 0, credit = 0;
    if (debitCol || creditCol) {
      debit = Number(row[debitCol]) || 0;
      credit = Number(row[creditCol]) || 0;
    } else if (amountCol) {
      const amt = Number(row[amountCol]) || 0;
      const typeVal = (typeCol ? String(row[typeCol]) : "").toLowerCase();
      if (typeVal.includes("cr")) credit = Math.abs(amt);
      else if (typeVal.includes("dr")) debit = Math.abs(amt);
      else if (amt < 0) debit = Math.abs(amt);
      else credit = amt;
    }
    out.push({
      date: dateVal, description: row[descCol], debit, credit,
      balance: balanceCol ? row[balanceCol] : null,
    });
  }
  return { transactions: out, nonBlankRows, droppedRows: nonBlankRows - out.length };
}
// Never trust a parser blindly — score how confidently the extracted rows actually look like
// a bank statement, and surface that score (and, for a clearly-broken read, refuse outright)
// rather than generating a report that quietly gets the numbers wrong. Every check here reuses
// data already present on each transaction; nothing new is derived just for this.
function validateParsedData(transactions, sourceStats) {
  const n = transactions.length;
  const blockers = [];
  if (n === 0) return { confidence: 0, blockers: ["No transactions could be read from this file."] };

  const thisYear = new Date().getFullYear();
  const validDates = transactions.filter(t => t.date instanceof Date && !isNaN(t.date) &&
    t.date.getFullYear() >= 2000 && t.date.getFullYear() <= thisYear + 1).length;
  const datesPct = validDates / n * 100;

  const validAmounts = transactions.filter(t => (t.debit > 0 || t.credit > 0)).length;
  const amountsPct = validAmounts / n * 100;

  const nonBlankDesc = transactions.filter(t => t.description && String(t.description).trim().length > 2).length;
  const descPct = nonBlankDesc / n * 100;

  const withBalance = transactions.filter(t => t.balance !== null && t.balance !== undefined && !isNaN(t.balance));
  const hasBalance = withBalance.length > n * 0.5;

  // Loose running-balance consistency check — only meaningful as a soft signal, since same-day
  // transaction ordering within a statement isn't always guaranteed, so a generous tolerance
  // avoids flagging a genuinely fine statement as broken over ordering quirks.
  let balanceConsistencyPct = null;
  if (hasBalance && withBalance.length > 1) {
    let consistent = 0, checked = 0;
    for (let i = 1; i < withBalance.length; i++) {
      const expectedDelta = withBalance[i].credit - withBalance[i].debit;
      const actualDelta = withBalance[i].balance - withBalance[i - 1].balance;
      checked++;
      if (Math.abs(expectedDelta - actualDelta) < 2) consistent++;
    }
    balanceConsistencyPct = checked ? (consistent / checked * 100) : null;
  }

  // Row-survival rate — rows that had content but failed to parse into a transaction (e.g. an
  // unreadable date) never make it into `transactions` at all, so without this the checks above
  // would only ever see the clean survivors and report false confidence on a file where most
  // rows silently failed.
  let survivalPct = 100;
  if (sourceStats && sourceStats.nonBlankRows > 0) {
    survivalPct = n / sourceStats.nonBlankRows * 100;
  }

  if (datesPct < 50) blockers.push("Most rows don't have a readable date.");
  if (amountsPct < 50) blockers.push("Most rows don't have a valid amount.");
  if (survivalPct < 50) blockers.push(`Only ${n} of ${sourceStats.nonBlankRows} rows could be read as transactions — most rows failed to parse.`);

  let confidence = datesPct * 0.3 + amountsPct * 0.3 + descPct * 0.1 + (hasBalance ? 10 : 3) + Math.min(survivalPct, 100) * 0.2;
  if (balanceConsistencyPct !== null) confidence = confidence * 0.8 + balanceConsistencyPct * 0.2;
  confidence = Math.round(Math.max(0, Math.min(100, confidence)));
  // Keep the displayed number consistent with the refusal itself — a blocker present but the
  // weighted average still reading e.g. 85% would look self-contradictory next to "we've stopped
  // here instead."
  if (blockers.length) confidence = Math.min(confidence, 35);

  return { confidence, blockers, datesPct, amountsPct, descPct, hasBalance, balanceConsistencyPct };
}
// Converts a raw 2D grid (array of arrays) plus a known header-row index into the {headers,
// rows} object-row shape mapRowsToTransactions() expects — shared by both the CSV and Excel
// paths below so the header-row-detection logic only has to live in one place.
function rowsFromRawGrid(rawRows, headerRowIndex) {
  const headers = rawRows[headerRowIndex].map(h => (h == null ? "" : String(h).trim()));
  const rows = rawRows.slice(headerRowIndex + 1).map(r => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = r[i]; });
    return obj;
  });
  return { headers, rows };
}
function parseCSVFile(file) {
  return new Promise((resolve, reject) => {
    // Parsed in raw array-of-arrays mode (header: false) rather than object mode — real bank
    // exports sometimes have a few account-info rows before the actual column headers, so the
    // header row has to be *found*, not assumed to be row 1. Papa Parse auto-detects the
    // delimiter (comma/semicolon/tab/pipe) on its own when one isn't specified.
    Papa.parse(file, {
      header: false, skipEmptyLines: true, dynamicTyping: false,
      complete: (res) => {
        const rawRows = res.data;
        const headerMatch = findHeaderRow(rawRows, 50);
        if (!headerMatch) { resolve({ rows: [], headers: [], headerConfidence: null }); return; }
        const { headers, rows } = rowsFromRawGrid(rawRows, headerMatch.rowIndex);
        resolve({ rows, headers, headerConfidence: headerMatch.result, headerRowIndex: headerMatch.rowIndex });
      },
      error: (err) => reject(err),
    });
  });
}
function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array", cellDates: true });
        // Don't assume the transactions are on the first sheet, or that row 1 of whichever
        // sheet is the header — some bank exports include a "Summary" cover sheet, and/or a
        // few account-info rows before the real header row. Score every (sheet, header-row)
        // combination and use whichever scores highest overall.
        let best = null;
        for (const name of wb.SheetNames) {
          const sheet = wb.Sheets[name];
          const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
          if (!rawRows.length) continue;
          const headerMatch = findHeaderRow(rawRows, 50);
          if (!headerMatch) continue;
          if (!best || headerMatch.result.score > best.headerMatch.result.score) {
            best = { rawRows, headerMatch, sheetName: name };
          }
        }
        if (!best) { resolve({ rows: [], headers: [], headerConfidence: null }); return; }
        const { headers, rows } = rowsFromRawGrid(best.rawRows, best.headerMatch.rowIndex);
        resolve({ rows, headers, headerConfidence: best.headerMatch.result, headerRowIndex: best.headerMatch.rowIndex, sheetName: best.sheetName });
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/* =========================================================================
   PDF PARSING — best-effort text-layout extraction (no OCR, no AI).
   Bank PDF statements vary a lot by issuer, so this is a heuristic parser:
   it groups text by visual line position, then looks for a leading date
   followed by a description and trailing amount(s). Always followed by a
   review step before analysis since it's less reliable than CSV/Excel.
   pdf.js itself is loaded and configured by the module bootstrap in <head>.
   ========================================================================= */
const MONTH_MAP = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
function parseFlexibleDate(s) {
  // Strip a leading day-of-week name if present ("Mon, 31 Jul 2026", "Monday 31/07/2026") —
  // some apps include it, and it would otherwise block every pattern below from matching.
  s = s.trim().replace(/^(mon|tue|wed|thu|fri|sat|sun)[a-z]*,?\s+/i, "");
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) { let [, y, mo, d] = m; return new Date(+y, +mo - 1, +d); } // ISO: 2026-07-31
  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) { let [, d, mo, y] = m; if (y.length === 2) y = "20" + y; return new Date(+y, +mo - 1, +d); }
  m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (m) { let [, d, mo, y] = m; if (y.length === 2) y = "20" + y; return new Date(+y, +mo - 1, +d); } // 31.07.2026
  m = s.match(/^(\d{1,2})[\/\-]([A-Za-z]{3,9})[\/\-](\d{2,4})$/);
  if (m) { let [, d, mon, y] = m; const mi = MONTH_MAP[mon.slice(0, 3).toLowerCase()]; if (mi === undefined) return null;
    if (y.length === 2) y = "20" + y; return new Date(+y, mi, +d); }
  // Day-first with optional comma after month: "31 Jul 2026" or "31 Jul, 2026" (Google Pay uses the latter)
  m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,9}),?\s+(\d{2,4})$/);
  if (m) { let [, d, mon, y] = m; const mi = MONTH_MAP[mon.slice(0, 3).toLowerCase()]; if (mi === undefined) return null;
    if (y.length === 2) y = "20" + y; return new Date(+y, mi, +d); }
  // Month-first: "Jul 31, 2026" / "Jul 31 2026" — common in UPI app (PhonePe-style) statements
  m = s.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{2,4})$/);
  if (m) { let [, mon, d, y] = m; const mi = MONTH_MAP[mon.slice(0, 3).toLowerCase()]; if (mi === undefined) return null;
    if (y.length === 2) y = "20" + y; return new Date(+y, mi, +d); }
  // Year-less "10 Dec" — some Paytm-style statements only show day+month on each transaction
  // line, relying on the statement's date-range header for the year. Best-effort: assume the
  // current year, then roll back a year if that puts the date implausibly in the future (a
  // statement is historical, so a date more than ~5 weeks ahead is almost certainly last year).
  m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,9})$/);
  if (m) {
    let [, d, mon] = m; const mi = MONTH_MAP[mon.slice(0, 3).toLowerCase()]; if (mi === undefined) return null;
    const now = new Date();
    let year = now.getFullYear();
    let candidate = new Date(year, mi, +d);
    if (candidate - now > 35 * 86400000) candidate = new Date(year - 1, mi, +d);
    return candidate;
  }
  return null;
}
async function waitForPdfjs(timeoutMs = 8000) {
  if (window.pdfjsLib) return true;
  return new Promise(resolve => {
    const onReady = () => { clearTimeout(timer); window.removeEventListener("pdfjslib-ready", onReady); resolve(true); };
    const timer = setTimeout(() => { window.removeEventListener("pdfjslib-ready", onReady); resolve(!!window.pdfjsLib); }, timeoutMs);
    window.addEventListener("pdfjslib-ready", onReady);
  });
}
(async () => {
  const statusEl = document.getElementById("pdfEngineStatus");
  if (!statusEl) return;
  const ok = await waitForPdfjs();
  if (ok) {
    statusEl.textContent = `PDF engine: ready (pdf.js v${window.pdfjsLib.version || "?"})`;
    statusEl.style.color = "var(--green)";
  } else {
    statusEl.textContent = "PDF engine: failed to load — CSV/Excel will still work; PDF upload won't. Check your network/connection.";
    statusEl.style.color = "var(--warn)";
  }
})();
async function extractPdfTextLines(file, password) {
  const ready = await waitForPdfjs();
  if (!ready) throw new Error("The PDF engine didn't finish loading — check your connection and try again.");
  const diag = { pdfjsVersion: pdfjsLib.version || "unknown", pages: 0, rawItemsPerPage: [], isEncrypted: false };
  const buf = await file.arrayBuffer();
  let pdf;
  try {
    const params = { data: buf };
    if (password) params.password = password;
    pdf = await pdfjsLib.getDocument(params).promise;
  } catch (err) {
    if (err && err.name === "PasswordException") {
      diag.isEncrypted = true;
      diag.passwordWasWrong = !!password;
      return { lines: [], diag };
    }
    diag.loadError = `${err && err.name ? err.name + ": " : ""}${err && err.message ? err.message : String(err)}`;
    return { lines: [], diag };
  }
  diag.pages = pdf.numPages;
  const allLines = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    diag.rawItemsPerPage.push(content.items.length);
    const items = content.items.map(it => ({ text: it.str, x: it.transform[4], y: it.transform[5] }))
      .filter(it => it.text && it.text.trim());
    items.sort((a, b) => b.y - a.y);
    const clusters = [];
    let current = [], refY = null;
    for (const it of items) {
      if (refY === null || Math.abs(it.y - refY) < 3) { current.push(it); refY = current.reduce((s, x) => s + x.y, 0) / current.length; }
      else { clusters.push(current); current = [it]; refY = it.y; }
    }
    if (current.length) clusters.push(current);
    for (const cluster of clusters) {
      const lineText = cluster.sort((a, b) => a.x - b.x).map(it => it.text).join(" ").replace(/\s+/g, " ").trim();
      if (lineText) allLines.push(lineText);
    }
  }
  return { lines: allLines, diag };
}
const PDF_LINE_DATE_RE = /(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}\.\d{1,2}\.\d{2,4}|\d{1,2}[\/\-][A-Za-z]{3,9}[\/\-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3,9},?\s+\d{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{2,4}|\d{1,2}\s+[A-Za-z]{3,9}\b)/;
const PDF_AMOUNT_RE_STRICT = /-?[\d,]+\.\d{2}(?:\/-)?\s*(Dr|Cr|DR|CR)?/g;
// Relaxed fallback: also accepts whole-rupee amounts with no decimals, for banks that print
// statements that way. Requires comma grouping OR 3+ digits to reduce false-positive matches
// against short reference numbers.
const PDF_AMOUNT_RE_RELAXED = /-?(?:[\d]{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?|\d{3,}(?:\.\d{1,2})?)(?:\/-)?\s*(Dr|Cr|DR|CR)?/g;

// Currency-marked amount — the ₹/Rs/INR symbol is a far stronger signal than a bare digit
// pattern, so this is tried first. Also handles the Indian "500/-" no-decimal notation and
// "(500.00)" accounting-style negatives (parens = debit).
const PDF_CURRENCY_AMOUNT_RE = /(?:₹|Rs\.?|INR)\s*\(?(-?[\d,]+(?:\.\d{1,2})?)\)?(?:\/-)?\s*(Dr|Cr|DR|CR)?/gi;
const PDF_PAREN_NEGATIVE_RE = /\(([\d,]+(?:\.\d{1,2})?)\)/g;

// Broader direction detection: explicit CREDIT/DEBIT wins when present (most reliable), then
// falls back to common verb phrasing UPI apps use instead ("Paid to", "Received from", etc.)
// since not every app labels transactions with the literal words.
const CREDIT_WORDS_RE = /\b(CREDIT(?:ED)?|RECEIVED|REFUND(?:ED)?|CASH\s?BACK|DEPOSIT(?:ED)?)\b/i;
const DEBIT_WORDS_RE = /\b(DEBIT(?:ED)?|PAID|PAYMENT|SENT|WITHDRA(?:WN|WAL)|PURCHASE|SPENT|SEND\s?MONEY)\b/i;
// "INTEREST PAID" (savings-account interest credited to you) is standard Indian banking
// phrasing and is virtually always a credit — checked before the generic DEBIT_WORDS_RE match,
// since "PAID" alone would otherwise be read as you paying something out.
const INTEREST_CREDIT_RE = /\binterest\b.{0,20}\b(paid|till|credited)\b/i;
function classifyDirection(text) {
  const explicit = text.match(/\b(CREDIT|DEBIT)\b/i);
  if (explicit) return explicit[1].toUpperCase();
  if (INTEREST_CREDIT_RE.test(text)) return "CREDIT";
  if (CREDIT_WORDS_RE.test(text)) return "CREDIT";
  if (DEBIT_WORDS_RE.test(text)) return "DEBIT";
  return null;
}

// Finds amounts on a line, preferring ones immediately marked by a currency symbol (₹/Rs/INR).
// That's a much stronger signal than a bare number pattern — it can't be confused with masked
// account digits ("******3939"), reference numbers, or request IDs that also appear on the
// same line in UPI-app-style statements, which a plain digit-pattern scan can't tell apart.
function extractLineAmounts(rest, genericRe) {
  const currencyMatches = [...rest.matchAll(PDF_CURRENCY_AMOUNT_RE)];
  if (currencyMatches.length) {
    return currencyMatches.map(m => ({
      index: m.index, value: parseFloat(m[1].replace(/,/g, "")), type: m[2] ? m[2].toUpperCase() : null,
      currencyMarked: true,
    })).filter(a => !isNaN(a.value));
  }
  const parenMatches = [...rest.matchAll(PDF_PAREN_NEGATIVE_RE)];
  if (parenMatches.length) {
    return parenMatches.map(m => ({ index: m.index, value: parseFloat(m[1].replace(/,/g, "")), type: "DR", currencyMarked: true }));
  }
  return [...rest.matchAll(genericRe)].map(m => {
    const typeM = m[0].match(/(Dr|Cr|DR|CR)\s*$/);
    const numPart = m[0].replace(/(Dr|Cr|DR|CR)\s*$/, "").replace(/\/-$/, "").replace(/,/g, "").trim();
    return { index: m.index, value: parseFloat(numPart), type: typeM ? typeM[1].toUpperCase() : null, currencyMarked: false };
  }).filter(a => !isNaN(a.value));
}

function parsePdfLinesToTransactions(lines, opts) {
  const relaxed = !!(opts && opts.relaxed);
  const AMOUNT_RE = relaxed ? PDF_AMOUNT_RE_RELAXED : PDF_AMOUNT_RE_STRICT;
  // Matches a second date immediately following the first with only a dash/"to" between them —
  // i.e. a "DD Mon YYYY - DD Mon YYYY" style statement-period header, not a transaction. Without
  // this, the header line's trailing year number can get picked up as a bare amount.
  const DATE_RANGE_CONTINUATION_RE = new RegExp("^\\s*(?:[-\u2013\u2014]|to)\\s*" + PDF_LINE_DATE_RE.source, "i");
  // Letterhead/footer boilerplate that repeats on every page — must never be merged into a
  // transaction's narration even though it superficially looks like plain continuation text.
  const BOILERPLATE_RE = /\b(page no|statement of account|nomination|joint holders|registered office|bank limited|contents of this statement|generated on|statement summary|opening balance|closing bal|dr count|cr count|gstin|ifsc|micr|branch code|account type|a\/c open|cust id|od limit|phone no|account branch)\b/i;
  const raw = [];
  let lastDate = null; // tracks a "date header" line (e.g. "31 July 2026" on its own, with
                        // individual transactions listed below it without repeating the date —
                        // a common Google Pay / Paytm style layout, distinct from PhonePe-style
                        // statements that repeat the date on every transaction line)
  let lastPushedIdx = -1; // index into raw[] of the transaction a wrapped continuation line
                           // (next line only — this is intentionally not an indefinite lookahead)
                           // should be appended to, or -1 if the previous line broke continuity
  for (const line of lines) {
    const dm = line.match(PDF_LINE_DATE_RE);
    const dateVal = dm ? parseFlexibleDate(dm[1]) : null;

    if (dateVal) {
      const rest = line.slice(dm.index + dm[0].length);
      if (DATE_RANGE_CONTINUATION_RE.test(rest)) { lastPushedIdx = -1; continue; } // statement-period header, not a transaction
      lastDate = dateVal;
      const amounts = extractLineAmounts(rest, AMOUNT_RE);
      if (!amounts.length) { lastPushedIdx = -1; continue; } // a pure date-header line — just updates lastDate, no transaction here
      const explicitType = classifyDirection(rest);
      let description = rest.slice(0, amounts[0].index)
        .replace(/\b(CREDIT|DEBIT(?:ED)?|PAID|RECEIVED|SENT)\b/gi, "").replace(/[₹\-:|]+$/, "").trim() || "Transaction";
      raw.push({ date: dateVal, description, amounts, explicitType });
      lastPushedIdx = raw.length - 1;
      continue;
    }

    // No date on this line — if we've already seen a date header above, and this line has
    // both a *currency-marked* amount AND a clear transaction-direction word, treat it as
    // belonging to that date. Requiring a currency symbol here (not just any number) is what
    // keeps this from misreading a detail line like "Credited to XXXXXX2669" as a transaction —
    // a masked account number has no ₹/Rs marker, so it's correctly left alone.
    if (lastDate) {
      const amounts = extractLineAmounts(line, AMOUNT_RE);
      const explicitType = classifyDirection(line);
      if (amounts.length && amounts[0].currencyMarked && explicitType) {
        let description = line.slice(0, amounts[0].index)
          .replace(/\b(CREDIT|DEBIT(?:ED)?|PAID|RECEIVED|SENT)\b/gi, "").replace(/[₹\-:|]+$/, "").trim() || "Transaction";
        raw.push({ date: lastDate, description, amounts, explicitType });
        lastPushedIdx = raw.length - 1;
        continue;
      }
    }

    // Neither a new transaction nor a recognized detail line. Many bank statements wrap a long
    // narration across two PDF text lines (e.g. "A2AINT01 - BBCL PRIME CONSTRUCTIONS PVT" /
    // "LTD - SALARY - SAL NOV 2025") — if this line immediately follows one we just captured,
    // isn't statement letterhead/footer text, and isn't itself absurdly long, treat it as that
    // wrapped continuation rather than silently dropping it. Only looks one line back (not an
    // indefinite lookahead), so an unrelated line breaks the chain rather than accidentally
    // attaching to a transaction from several lines earlier.
    const trimmed = line.trim();
    if (lastPushedIdx >= 0 && trimmed && trimmed.length < 100 && !BOILERPLATE_RE.test(trimmed)) {
      raw[lastPushedIdx].description = (raw[lastPushedIdx].description + " " + trimmed).trim();
      // The continuation might carry the only direction signal for this transaction (e.g. "UPI
      // SEND MONEY" wrapping onto its own line) — re-check now that more text is available.
      if (!raw[lastPushedIdx].explicitType) raw[lastPushedIdx].explicitType = classifyDirection(raw[lastPushedIdx].description);
    } else {
      lastPushedIdx = -1;
    }
  }
  const out = [];
  let prevBalance = null;
  for (const row of raw) {
    let debit = 0, credit = 0, balance = null;
    const a = row.amounts;
    if (row.explicitType && a.length === 1) {
      // Unambiguous case: a standalone CREDIT/DEBIT word plus exactly one amount (typical of
      // UPI app statements, which don't print a running balance at all).
      const val = Math.abs(a[0].value);
      if (row.explicitType === "CREDIT") credit = val; else debit = val;
    } else if (a.length >= 3) {
      debit = Math.abs(a[a.length - 3].value) || 0; credit = Math.abs(a[a.length - 2].value) || 0; balance = a[a.length - 1].value;
    } else if (a.length === 2) {
      balance = a[1].value;
      const val = Math.abs(a[0].value);
      if (row.explicitType === "CREDIT") credit = val;
      else if (row.explicitType === "DEBIT") debit = val;
      else if (a[0].type === "DR") debit = val;
      else if (a[0].type === "CR") credit = val;
      else if (a[0].value < 0) debit = val;
      else if (prevBalance !== null) { if (a[1].value >= prevBalance) credit = val; else debit = val; }
      // No explicit signal AND no previous balance to diff against — only possible for the very
      // first transaction in the whole statement, which is a genuine cold-start: there is no
      // way to know its direction with certainty from the data alone. Defaulting to credit
      // rather than debit here is a considered choice, not an arbitrary one — incoming transfers
      // in real Indian bank narrations are often *unlabelled* (just sender + purpose), whereas
      // outgoing ones almost always carry a self-describing suffix ("SEND MONEY", "DR", "PAID")
      // that would have already been caught above. This can still be wrong; if it is, the
      // opening balance derived from it will be off by 2× this one amount — fixable by editing
      // this one transaction's direction like any other correction.
      else credit = val;
    } else {
      const val = Math.abs(a[0].value);
      if (a[0].type === "DR") debit = val;
      else if (a[0].type === "CR") credit = val;
      else debit = val;
    }
    if (balance !== null) prevBalance = balance;
    out.push({ date: row.date, description: row.description, debit, credit, balance });
  }
  return out;
}


/* =========================================================================
   RENDERING
   ========================================================================= */
function table(headers, rows, alignRight = []) {
  const thead = `<tr>${headers.map(h => `<th>${esc(h)}</th>`).join("")}</tr>`;
  const tbody = rows.map(r => `<tr>${r.map((c, i) =>
    `<td class="${alignRight.includes(i) ? "num" : ""}">${c}</td>`).join("")}</tr>`).join("");
  return `<div style="overflow-x: auto; width: 100%;"><table><thead>${thead}</thead><tbody>${tbody}</tbody></table></div>`;
}
// An inline-editable category cell — click swaps the label for a <select>, and picking a new
// value applies the override in-memory and re-renders. All editing lives in this browser
// session only: nothing is ever written to storage, and it resets on refresh or Clear My Data,
// same as the rest of this tool. `displayLabel` may differ from `realCategory` (e.g. Business
// Mode's "Vendor Payouts / Transfers" label for the underlying "Bank Transfers" category) —
// the dropdown always needs the real category value, the visible text can be relabeled.
function categoryEditCell(realCategory, kind, key, displayLabel) {
  return `<span class="cat-edit" data-kind="${esc(kind)}" data-key="${esc(String(key))}" data-current="${esc(realCategory)}">
    ${esc(displayLabel || realCategory)} <span class="cat-edit-icon">✏️</span></span>`;
}
function pillClass(band) {
  if (band === "Healthy") return "healthy";
  if (band === "Moderate") return "moderate";
  if (band === "Tight") return "tight";
  if (band.startsWith("Deficit")) return "deficit";
  return "unknown";
}

function renderReport(r, meta) {
  const ov = r.overview, fh = r.financialHealth, inc = r.incomeAnalysis, cov = r.classificationCoverage;
  const businessMode = !!(meta && meta.businessMode);
  const catLabel = (cat) => (businessMode && (cat === "Bank Transfers" || cat === "Bank Transfer / Peer Payment")) ? "Vendor Payouts / Transfers" : cat;
  let secCounter = 0;
  const sec = () => ++secCounter; // auto-incrementing section numbers so inserting/reordering
                                   // sections never requires manually renumbering the rest

  let html = "";
  html += `
  <div class="card" id="report-letterhead">
    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
      <div class="brand-row">
        <img class="brand-logo-img" alt="FinNomy logo" style="height:38px; width:38px;">
        <div>
          <div class="logo" style="font-size:19px;"><span class="fin">Fin</span><span class="nomy">Nomy</span></div>
          <div class="tagline">Helping You Find Financial Clarity</div>
        </div>
      </div>
      <div style="text-align:right; font-size:12px; color:var(--grey);">
        Generated ${fmtDate(new Date())}<br>Statement: ${fmtDate(ov.periodStart)} – ${fmtDate(ov.periodEnd)}
      </div>
    </div>
    <h1 style="font-size:20px; margin:16px 0 2px;">Your Money, Decoded</h1>
    <div class="muted">${businessMode ? "Business Financial Report" : "Personal Financial Health Report"} ${meta.clientName ? "— " + esc(meta.clientName) : ""} &nbsp;•&nbsp; ${ov.numTransactions} transactions analysed</div>
  </div>`;

  // Statement Quality — a compact confidence summary right at the top, before anything else in
  // the report is presented, rather than buried at the bottom where it lands only after
  // someone's already read (and started trusting) everything above it.
  const sqDatesOk = r.transactions.length > 0 && r.transactions.every(t => t.date instanceof Date && !isNaN(t.date));
  const sqAmountsOk = r.transactions.length > 0 && r.transactions.every(t => t.debit >= 0 && t.credit >= 0 && (t.debit > 0 || t.credit > 0));
  const sqHasBalance = r.transactions.some(t => t.balance !== null && t.balance !== undefined);
  const sqBand = cov.coverageByAmountPct >= 90 ? { emoji: "🟢", label: "Excellent" }
    : cov.coverageByAmountPct >= 70 ? { emoji: "🟡", label: "Good" } : { emoji: "🔴", label: "Needs Review" };
  html += `<div class="card" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; padding:16px 20px;">
    <div>
      <div style="font-weight:700; margin-bottom:6px;">Statement Quality</div>
      <div style="display:flex; gap:16px; flex-wrap:wrap; font-size:13px; color:var(--grey);">
        <span>${sqDatesOk ? "✅" : "⚠️"} Dates detected</span>
        <span>${sqAmountsOk ? "✅" : "⚠️"} Debit/Credit parsed</span>
        <span>${sqHasBalance ? "✅" : "➖"} Balance ${sqHasBalance ? "detected" : "not in file"}</span>
      </div>
    </div>
    <div style="text-align:center;">
      <div class="muted" style="font-size:11px; text-transform:uppercase; letter-spacing:0.4px;">Parser Confidence</div>
      <div style="font-size:22px; font-weight:800; color:var(--navy);">${sqBand.emoji} ${fmtPct(cov.coverageByAmountPct, 0)}</div>
    </div>
  </div>`;

  // Unknown-merchant review banner — nudges toward the click-to-fix category editing feature
  // rather than leaving uncategorized transactions to sit quietly at the bottom of the report.
  if (cov.uncategorizedCount > 5) {
    const reviewSample = r.topMerchants.filter(m => m.avgConfidence < 70).slice(0, 5);
    html += `<div class="card" style="background:#FFF8E6; border-color:#F0DDA0;">
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:${reviewSample.length ? "10px" : "0"};">
        <div style="font-size:20px;">🔍</div>
        <div class="body-text" style="margin:0;"><b>${cov.uncategorizedCount} merchant${cov.uncategorizedCount === 1 ? "" : "s"} need${cov.uncategorizedCount === 1 ? "s" : ""} review</b>
          (worth ${fmtMoney(cov.uncategorizedAmount)}). Fixing them improves your Money DNA score and classification coverage.</div>
      </div>
      ${reviewSample.length ? `<div style="display:flex; flex-direction:column; gap:6px; padding-left:32px;">
        ${reviewSample.map(m => `<div style="display:flex; align-items:center; justify-content:space-between; background:#fff; border-radius:6px; padding:6px 12px;">
          <span style="font-size:13px;">${esc(titleCase(m.merchant))} <span class="muted">(${fmtMoney(m.totalSpend)})</span></span>
          ${categoryEditCell(m.category, "merchant", m.merchant, "Assign category →")}
        </div>`).join("")}
      </div>` : ""}
    </div>`;
  }

  // Hero — Money DNA score + identity + three headline callouts. Deliberately the first thing
  // shown, ahead of any table, since a single glanceable page is what actually gets shared —
  // the detailed sections below are for whoever wants to dig in past this.
  if (!businessMode) {
    const dna = r.moneyDNA, win = r.biggestWin, leak = r.biggestLeak, improve = r.oneThingToImprove;
    html += `<div class="card" style="text-align:center; padding:32px 24px;">
      <div class="muted" style="letter-spacing:0.5px; text-transform:uppercase; font-size:11.5px;">FinNomy Money DNA</div>
      ${dna.provisional ? `<div style="display:inline-block; background:#FFF3CD; color:#8A5423; font-size:11.5px; font-weight:700; padding:3px 10px; border-radius:10px; margin-top:8px;">PROVISIONAL — ${Math.round(dna.coveragePct)}% classified</div>` : ""}
      <div style="font-size:56px; font-weight:800; color:var(--navy); line-height:1.1; margin:6px 0;">${dna.overall}<span style="font-size:22px; color:var(--grey); font-weight:600;">/100</span></div>
      <div style="font-size:16px; font-weight:700; margin-bottom:6px;">${dna.band.emoji} ${esc(dna.band.label)}</div>
      ${dna.provisional ? `<p class="muted" style="margin:0 auto 16px; max-width:420px;">This score is provisional because ${r.classificationCoverage.uncategorizedCount} transaction(s)
        remain uncategorized — fixing them below (click any category to change it) will sharpen this score.</p>` : ""}
      <div style="display:inline-block; background:#EEF4FE; color:var(--blue); font-weight:700; font-size:13.5px; padding:5px 14px; border-radius:20px; margin-bottom:22px;">
        ${dna.personality.icon} ${esc(dna.personality.label)}</div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(190px, 1fr)); gap:14px; text-align:left;">
        <div style="background:#F7F9FC; border-radius:10px; padding:14px 16px;">
          <div class="muted" style="margin-bottom:4px;">🏆 Biggest Win</div>
          <div style="font-size:17px; font-weight:800; color:var(--green);">${esc(win.text)}</div><div class="muted">${esc(win.sub)}</div>
        </div>
        <div style="background:#F7F9FC; border-radius:10px; padding:14px 16px;">
          <div class="muted" style="margin-bottom:4px;">💸 Biggest Money Leak</div>
          ${leak
            ? `<div style="font-size:17px; font-weight:800; color:#C97B3E;">${fmtMoney(leak.total)}</div><div class="muted">${esc(leak.category)} — about ${fmtMoney(leak.perDay)}/day</div>`
            : `<div style="font-size:15px; font-weight:700; color:var(--navy);">No major leaks found</div><div class="muted">discretionary spend looks controlled</div>`}
        </div>
        <div style="background:#F7F9FC; border-radius:10px; padding:14px 16px;">
          <div class="muted" style="margin-bottom:4px;">🎯 One Thing to Improve</div>
          <div style="font-size:15px; font-weight:700; color:var(--navy);">${esc(improve.text)}</div><div class="muted">${esc(improve.sub)}</div>
        </div>
      </div>
      ${r.potentialSavings ? `<p class="body-text" style="margin-top:18px;">Reduce <b>${esc(r.potentialSavings.category)}</b> by just ${fmtMoney(r.potentialSavings.reduceBy)}/day →
        potential annual saving of <b style="color:var(--green);">${fmtMoney(r.potentialSavings.annual)}</b>.</p>` : ""}
    </div>`;
  }

  // Achievements — only rendered when at least one badge was actually earned; an empty
  // "Achievements: none" state would undercut the whole point of the section.
  if (r.achievements && r.achievements.length) {
    html += `<div class="card">
      <div class="section-title">Achievements Unlocked</div>
      <div style="display:flex; flex-wrap:wrap; gap:10px;">
        ${r.achievements.map(a => `<div style="background:#EAF7F1; border:1px solid #BFE6D5; border-radius:20px; padding:8px 16px; font-size:13.5px; font-weight:600; color:#0E5C42;">
          ${a.icon} ${esc(a.text)}</div>`).join("")}
      </div>
    </div>`;
  }

  // Money DNA breakdown — progress bars scan and screenshot far better than a plain number list.
  if (!businessMode) {
    html += `<div class="card">
      <div class="section-title">Your Money DNA Breakdown</div>
      <div style="display:flex; flex-direction:column; gap:14px;">
        ${r.moneyDNA.dimensions.map(d => `
          <div>
            <div style="display:flex; justify-content:space-between; font-size:13.5px; margin-bottom:4px;">
              <span>${d.icon} ${esc(d.label)}</span><span style="font-weight:700;">${Math.round(d.score)}</span>
            </div>
            <div style="background:#EEF0F3; border-radius:6px; height:10px; overflow:hidden;">
              <div style="width:${Math.round(d.score)}%; height:100%; background:${d.score >= 70 ? "var(--green)" : d.score >= 40 ? "#C97B3E" : "var(--warn)"};"></div>
            </div>
          </div>`).join("")}
      </div>
    </div>`;
  }

  // Comparison cards — against widely-published personal-finance guidelines, never against
  // other users (this tool has no way to know what anyone else's statement looks like).
  if (!businessMode && r.comparisonCards.length) {
    html += `<div class="card">
      <div class="section-title">How You Compare to Common Guidelines</div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${r.comparisonCards.map(c => `<div style="display:flex; align-items:center; gap:10px; padding:8px 0;">
          <span style="font-size:16px;">${c.good ? "✅" : "⚠️"}</span><span class="body-text" style="margin:0;">${c.text}</span></div>`).join("")}
      </div>
    </div>`;
  }

  // "Did You Know?" — a handful of genuinely computed facts, not filler; each one only appears
  // when there's real underlying data to support it.
  const didYouKnowFacts = [];
  if (r.salaryExhaustionDays) didYouKnowFacts.push(`On average, your income was fully spent within <b>${r.salaryExhaustionDays} days</b> of the month.`);
  if (r.mostExpensiveWeekday) didYouKnowFacts.push(`<b>${r.mostExpensiveWeekday.day}</b> was your most expensive day of the week overall (${fmtMoney(r.mostExpensiveWeekday.total)}).`);
  if (didYouKnowFacts.length) {
    html += `<div class="card" style="background:#F5F0FB; border-color:#E3D6F0;">
      <div class="section-title" style="color:#6B3FA0;">💡 Did You Know?</div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${didYouKnowFacts.map(f => `<p class="body-text" style="margin:0;">${f}</p>`).join("")}
      </div>
    </div>`;
  }

  // Insights — deterministic, rule-based observations (never AI-generated) that connect figures
  // already shown elsewhere into plain-language statements, so the takeaway doesn't require
  // cross-referencing three different tables yourself.
  if (r.insights && r.insights.length) {
    html += `<div class="card">
      <div class="section-title">📊 Insights</div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${r.insights.map(txt => `<p class="body-text" style="margin:0;">• ${esc(txt)}</p>`).join("")}
      </div>
    </div>`;
  }

  // 1. Overview
  html += `<div class="card">
    <div class="section-title"><span class="section-num">${sec()}.</span>Overview</div>
    <p class="body-text">Over this period, ${fmtMoney(ov.totalInflow)} came in and ${fmtMoney(ov.totalOutflow)} went out —
      a net ${ov.netChange >= 0 ? "gain" : "shortfall"} of ${fmtMoney(Math.abs(ov.netChange))}.</p>
    ${table(["Metric", "Value"], [
      ["Opening balance", fmtMoney(ov.openingBalance)],
      ["Closing balance", fmtMoney(ov.closingBalance)],
      ["Total money in", fmtMoney(ov.totalInflow)],
      ["Total money out", fmtMoney(ov.totalOutflow)],
      ["Net change", fmtMoney(ov.netChange)],
      ["Transactions analysed", String(ov.numTransactions)],
    ], [1])}
    ${(() => {
      const sp = r.spendingPattern;
      if (!sp || !sp.highestSpendDay) return "";
      const parts = [];
      if (sp.weekendPct !== null) parts.push(`You spend <b>${sp.weekendPct.toFixed(0)}%</b> of your discretionary money on weekends (Fri–Sun)`);
      parts.push(`your highest spending day was <b>${fmtDate(sp.highestSpendDay.date)}</b> (${fmtMoney(sp.highestSpendDay.amount)})`);
      return `<p class="muted" style="margin-top:10px;">${parts.join(" — ")}.</p>`;
    })()}
  </div>`;

  // 2. Category summary
  const topCat = r.categorySummary[0];
  html += `<div class="card">
    <div class="section-title"><span class="section-num">${sec()}.</span>Your Biggest Money Leaks</div>
    ${topCat ? `<p class="body-text">Your biggest spending category was <b>${esc(topCat.category)}</b> at ${fmtMoney(topCat.totalSpend)}
      (${topCat.pctOfSpend.toFixed(0)}% of everything you spent).</p>` : ""}
    <div class="chart-box"><canvas id="categoryChart" height="240"></canvas></div>
    <p class="muted" style="text-align:center; margin-top:-4px;">Chart shows the categories covering ~85% of your spend — the full breakdown, including smaller categories, is in the table below.</p>
    ${table(["Category", "Spend", "% of Spend", "Txns"], r.categorySummary.map(c =>
      [esc(catLabel(c.category)), fmtMoney(c.totalSpend), fmtPct(c.pctOfSpend), String(c.count)]), [1, 2, 3])}
    ${(() => {
      const taxSaving = r.categorySummary.find(c => c.category === "Investments – Tax Saving");
      if (!taxSaving) return "";
      return `<p class="muted" style="margin-top:10px;">${fmtMoney(taxSaving.totalSpend)} went to instruments that are typically
        80C/80CCD-eligible (PPF, ELSS, NPS, SSY) — informational only, based purely on what's visible in this statement.
        Your actual eligible total may differ (other 80C contributions like employer EPF won't show here), and eligibility
        also depends on which tax regime applies to you. Worth confirming with your CA before relying on this for filing.</p>`;
    })()}
    ${r.contraSummary ? `<p class="muted" style="margin-top:10px; padding-top:10px; border-top:1px solid var(--border);">
      ℹ️ ${fmtMoney(r.contraSummary.outAmount)} moved out and ${fmtMoney(r.contraSummary.inAmount)} moved in across
      ${r.contraSummary.count} transfer${r.contraSummary.count === 1 ? "" : "s"} between your own accounts (contra entries) —
      excluded from this breakdown and every figure below, since moving money to yourself isn't spending or income.
      These still count in the Overview totals above, which reconcile against your bank statement's own summary.</p>` : ""}
  </div>`;

  // Quick Commerce / Food Delivery / Cab eye-opener boxes — personal-spending-pattern content,
  // skipped in Business Mode. Also skip entirely if there's no data for a given group, rather
  // than showing a flat "₹0 spent" that reads like a bug.
  const rollupEntries = Object.entries(r.microRollups || {});
  if (!businessMode && rollupEntries.length) {
    html += `<div class="card">
      <div class="section-title">A Few Numbers Worth a Second Look</div>
      <div class="col-2" style="grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));">
        ${rollupEntries.map(([label, d]) => `
          <div style="background:#F7F9FC; border:1px solid var(--border); border-radius:10px; padding:14px 16px;">
            <div class="muted" style="margin-bottom:4px;">${esc(label)}</div>
            <div style="font-size:20px; font-weight:800; color:var(--navy);">${fmtMoney(d.total)}</div>
            <div class="muted">${d.count} transaction${d.count === 1 ? "" : "s"} this period</div>
          </div>`).join("")}
      </div>
    </div>`;
  }

  // 3. Monthly summary
  html += `<div class="card">
    <div class="section-title"><span class="section-num">${sec()}.</span>How Much You Actually Saved</div>
    <div class="chart-box"><canvas id="monthlyChart" height="220"></canvas></div>
    ${table(["Month", "Income", "Expense", "Net Savings", "Savings Rate"], r.monthlySummary.map(m =>
      [m.month, fmtMoney(m.income), fmtMoney(m.expense), fmtMoney(m.netSavings), m.savingsRatePct === null ? "-" : fmtPct(m.savingsRatePct, 0)]),
      [1, 2, 3, 4])}
  </div>`;

  // 4. Top merchants
  html += `<div class="card">
    <div class="section-title"><span class="section-num">${sec()}.</span>Who Took Most Of Your Money</div>
    ${r.topMerchants.length ? `
    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:18px;">
      ${r.topMerchants.slice(0, 5).map((m, i) => {
        const medal = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"][i];
        return `<div style="display:flex; align-items:center; gap:14px; background:#F7F9FC; border-radius:10px; padding:10px 16px;">
          <div style="font-size:22px;">${medal}</div>
          <div style="flex:1;">
            <div style="font-weight:700; color:var(--navy);">${esc(titleCase(m.merchant))}</div>
            <div class="muted">${catLabel(m.category)} · ${m.count} transaction${m.count === 1 ? "" : "s"}${m.avgConfidence < 70 ? " · ⚠️ needs review" : ""}</div>
          </div>
          <div style="font-size:17px; font-weight:800; color:var(--navy);">${fmtMoney(m.totalSpend)}</div>
        </div>`;
      }).join("")}
    </div>` : ""}
    <p class="muted" style="margin-bottom:6px;">Full list — category looks wrong? Click it to fix. Changes apply right away; click "Regenerate Report" in the bar above once you're done to refresh scores and charts.</p>
    ${table(["Merchant / Payee", "Category", "Confidence", "Total Spend", "Transactions"], r.topMerchants.map(m =>
      [esc(titleCase(m.merchant)), categoryEditCell(m.category, "merchant", m.merchant, catLabel(m.category)),
        m.avgConfidence >= 70 ? `${m.avgConfidence}%` : `${m.avgConfidence}% <span style="color:#B0413E; font-weight:600;">Needs Review</span>`,
        fmtMoney(m.totalSpend), String(m.count)]), [3, 4])}
  </div>`;

  // 5. Income analysis
  html += `<div class="card">
    <div class="section-title"><span class="section-num">${sec()}.</span>Income Analysis</div>
    ${inc.numSources === 0 ? `<p class="body-text">No clearly identifiable income credits were found in this statement.</p>` : `
      <p class="body-text">You received income from <b>${inc.numSources}</b> source(s), averaging ${fmtMoney(inc.avgMonthlyIncome)} per month.
        Your income pattern looks <b>${inc.regularity.toLowerCase()}</b> across the period.</p>
      ${table(["Source", "Total Received", "Credits"], inc.bySource.map(s =>
        [esc(titleCase(s.merchant)), fmtMoney(s.total), String(s.count)]), [1, 2])}`}
  </div>`;

  // 6. Recurring
  const recurringExpenses = r.recurring.filter(x => x.direction === "debit");
  const recurringIncome = r.recurring.filter(x => x.direction === "credit");
  html += `<div class="card">
    <div class="section-title"><span class="section-num">${sec()}.</span>Recurring Transactions We Found</div>
    ${r.recurring.length === 0 ? `<p class="body-text">No consistent recurring payments were detected — most spending looks one-off.</p>` : `
      <p class="body-text">We found <b>${recurringExpenses.length}</b> payment${recurringExpenses.length === 1 ? "" : "s"} that repeat month after month — your fixed commitments
        (rent, EMIs, subscriptions, SIPs)${recurringExpenses.length ? `, totalling <b>${fmtMoney(recurringExpenses.reduce((s, x) => s + x.avgAmount, 0))}/month</b>
        — that's <b>${fmtMoney(recurringExpenses.reduce((s, x) => s + x.avgAmount, 0) * 12)}/year</b> on autopilot` : ""}.
        ${recurringIncome.length ? ` We also found <b>${recurringIncome.length}</b> recurring credit${recurringIncome.length === 1 ? "" : "s"} (e.g. a regular salary) — shown separately below.` : ""}
        Worth reviewing periodically for anything you no longer use.</p>
      ${table(["Merchant / Payee", "Category", "Avg Amount", "Annual Total", "Typically On", "Months Seen"], r.recurring.map(x =>
        [(x.direction === "credit" ? "↓ " : "") + esc(titleCase(x.merchant)), esc(x.category), fmtMoney(x.avgAmount), fmtMoney(x.avgAmount * 12), `~${x.typicalDay}th`, String(x.monthsSeen)]), [2, 3])}`}
  </div>`;

  // Subscriptions Audit — a filtered, distinctly-styled view over the recurring payments
  // already found above (not a separate detection pass), so it can never drift out of sync
  // with the main Recurring table.
  const subs = r.recurring.filter(x => x.category === "Subscriptions" || (x.avgAmount <= 2000 &&
    /netflix|spotify|hotstar|prime|youtube|icloud|storage|subscription/i.test(x.merchant)));
  if (!businessMode && subs.length) {
    const subsMonthly = subs.reduce((s, x) => s + x.avgAmount, 0);
    html += `<div class="card" style="background:#FBF8F2; border-color:#F0E4CC;">
      <div class="section-title" style="color:#8A5423;">📋 Subscriptions Audit</div>
      <p class="body-text">${subs.length} recurring subscription${subs.length === 1 ? "" : "s"} found, totalling
        ${fmtMoney(subsMonthly)}/month — <b>${fmtMoney(subsMonthly * 12)}/year</b> leaving your account automatically.
        Worth a quick check for anything you've stopped using.</p>
      ${table(["Subscription", "Amount/mo", "Annual Cost", "Months Seen"], subs.map(x =>
        [esc(titleCase(x.merchant)), fmtMoney(x.avgAmount), fmtMoney(x.avgAmount * 12), String(x.monthsSeen)]), [1, 2])}
    </div>`;
  }

  // 7. Cash flow
  html += `<div class="card">
    <div class="section-title"><span class="section-num">${sec()}.</span>Cash Flow Over Time</div>
    <div class="chart-box"><canvas id="cashflowChart" height="200"></canvas></div>
    <p class="body-text">This tracks your cumulative savings position month to month. A line that keeps climbing means you're
      consistently saving; a flat or falling line means expenses are catching up with — or overtaking — income.</p>
  </div>`;

  // Financial health
  const topVendor = r.topMerchants[0];
  const totalSpendForConcentration = sum(r.categorySummary, c => c.totalSpend);
  const vendorConcentrationPct = topVendor && totalSpendForConcentration ? (topVendor.totalSpend / totalSpendForConcentration * 100) : null;
  // Customer concentration mirrors vendor concentration on the income side — how much of total
  // revenue comes from a single source, a real risk signal for a small business.
  const topCustomer = r.incomeAnalysis.bySource && r.incomeAnalysis.bySource[0];
  const customerConcentrationPct = topCustomer && r.incomeAnalysis.totalIncome ? (topCustomer.total / r.incomeAnalysis.totalIncome * 100) : null;
  // A simple operating margin estimate — income less OpEx as a share of income. Deliberately
  // labelled "estimate": a bank statement alone can't distinguish this-period cash flow from
  // accrual-basis profit, so this is a cash-flow proxy for margin, not a formal P&L figure.
  const operatingMarginPct = fh.avgMonthlyIncome ? ((fh.avgMonthlyIncome - fh.avgMonthlyOpEx) / fh.avgMonthlyIncome * 100) : null;
  html += `<div class="card">
    <div class="section-title"><span class="section-num">${sec()}.</span>${businessMode ? "Your Business Financial Snapshot" : "Your Financial Health Snapshot"}</div>
    <p class="body-text">Savings rate: <span class="pill ${pillClass(fh.savingsBand)}">${fmtPct(fh.savingsRatePct, 1)} — ${esc(fh.savingsBand)}</span></p>
    ${table(["Indicator", "Value", "What it means"], businessMode ? [
      ["Avg. monthly income", fmtMoney(fh.avgMonthlyIncome), "-"],
      ["Avg. monthly expense", fmtMoney(fh.avgMonthlyExpense), "-"],
      ...(operatingMarginPct !== null ? [["Operating margin (estimate)", fmtPct(operatingMarginPct, 0), "Income less OpEx as a share of income — a cash-flow proxy, not a formal P&L margin"]] : []),
      ["Business OpEx", `${fmtPct(fh.opExPct, 0)} of total spend`, "Rent, utilities, subscriptions, supplies, travel — day-to-day running costs"],
      ...(fh.avgMonthlyPayroll > 0 ? [["Payroll / salary paid out", `${fmtMoney(fh.avgMonthlyPayroll)}/mo`, "Wages paid to employees or staff"]] : []),
      ...(fh.avgMonthlyTaxPayments > 0 ? [["Tax payments (GST/TDS)", `${fmtMoney(fh.avgMonthlyTaxPayments)}/mo`, "Statutory tax remittances"]] : []),
      ...(fh.avgMonthlyVendorPayouts > 0 ? [["Vendor payouts / transfers", `${fmtMoney(fh.avgMonthlyVendorPayouts)}/mo`, "RTGS/NEFT/ACH transfers out — largely supplier/vendor payments"]] : []),
      ...(fh.avgMonthlyDebtPayment > 0 ? [["Credit card / debt repayment", `${fmtMoney(fh.avgMonthlyDebtPayment)}/mo`, "Card bill payments — settling debt, not new spend"]] : []),
      ...(vendorConcentrationPct !== null ? [["Vendor concentration", `${fmtPct(vendorConcentrationPct, 0)}`, `${titleCase(topVendor.merchant)} — your single biggest payee this period`]] : []),
      ...(customerConcentrationPct !== null ? [["Customer concentration", `${fmtPct(customerConcentrationPct, 0)}`, `${titleCase(topCustomer.merchant)} — your single biggest income source this period`]] : []),
      ["Working capital runway", isNaN(fh.workingCapitalRunwayMonths) ? "-" : `${fh.workingCapitalRunwayMonths.toFixed(1)} months`, "Your lowest balance ÷ avg. monthly OpEx — how long operations could run from your toughest point"],
    ] : [
      ["Avg. monthly income", fmtMoney(fh.avgMonthlyIncome), "-"],
      ["Avg. monthly expense", fmtMoney(fh.avgMonthlyExpense), "-"],
      ["Essential spend", `${fmtPct(fh.essentialPct, 0)} of total`, "Rent, EMIs, utilities, groceries, insurance"],
      ["Discretionary spend", `${fmtPct(fh.discretionaryPct, 0)} of total`, "Dining, shopping, subscriptions, travel"],
      ["Debt-to-income", fmtPct(fh.debtToIncomePct, 0), "EMI/loan payments as a share of income"],
      ...(fh.avgMonthlyDebtPayment > 0 ? [["Credit card / debt repayment", `${fmtMoney(fh.avgMonthlyDebtPayment)}/mo`, "Card bill payments — settling debt, not new spend"]] : []),
      ["Emergency fund runway", isNaN(fh.balanceBufferMonths) ? "-" : `${fh.balanceBufferMonths.toFixed(1)} months`, "Your lowest balance ÷ avg. monthly expense — how long you'd last from your toughest point"],
    ])}
  </div>`;

  // 50/30/20 budget rule check — personal-finance framing, skipped in Business Mode.
  if (!businessMode && fh.budgetRule) {
    const br = fh.budgetRule;
    const verdict = (label, pct, target) => {
      const diff = pct - target;
      if (Math.abs(diff) <= 3) return `right on the ${label} benchmark`;
      return `${Math.abs(diff).toFixed(0)}pts ${diff > 0 ? "over" : "under"} the ${target}% ${label} benchmark`;
    };
    html += `<div class="card">
      <div class="section-title"><span class="section-num">${sec()}.</span>The 50/30/20 Budget Check</div>
      <p class="body-text">A well-known rule of thumb: 50% of income to Needs, 30% to Wants, 20% to Savings (or debt payoff).
        Here's how this period lines up — Wants are ${verdict("Wants", br.wantsPct, 30)}.</p>
      <div style="display:flex; height:28px; border-radius:6px; overflow:hidden; margin:14px 0 6px;">
        <div style="width:${Math.max(0, Math.min(100, br.needsPct))}%; background:#0F2A4A;" title="Needs"></div>
        <div style="width:${Math.max(0, Math.min(100, br.wantsPct))}%; background:#C97B3E;" title="Wants"></div>
        <div style="width:${Math.max(0, Math.min(100, br.savingsPct))}%; background:#00B37E;" title="Savings"></div>
      </div>
      ${table(["", "Target", "Actual", "Amount"], [
        ["Needs (rent, EMIs, debt, essentials)", "50%", fmtPct(br.needsPct, 0), fmtMoney(br.needsAmt)],
        ["Wants (dining, shopping, subscriptions)", "30%", fmtPct(br.wantsPct, 0), fmtMoney(br.wantsAmt)],
        ["Savings (whatever's left)", "20%", fmtPct(br.savingsPct, 0), fmtMoney(br.savingsAmt)],
      ], [2, 3])}
      <p class="muted" style="margin-top:8px;">A rule of thumb, not a hard rule — useful as a benchmark, not a verdict.</p>
    </div>`;
  }

  // 9. Anomalies
  html += `<div class="card">
    <div class="section-title"><span class="section-num">${sec()}.</span>Things Worth a Second Look</div>
    ${r.anomalies.length === 0 ? `<p class="body-text">No unusual transactions stood out in this period. Nothing flagged.</p>` : `
      <p class="body-text">We flagged the <b>${r.anomalies.length}</b> transaction(s) that stand out most from your normal pattern — not necessarily
        a problem, just worth a quick check.</p>
      ${table(["Date", "Description", "Category", "Amount", "Why it's flagged"], r.anomalies.map(a =>
        [fmtDate(a.date), esc(a.description), categoryEditCell(a.category, "tx", a.txId, catLabel(a.category)), fmtMoney(a.amount), esc(a.detail)]), [3])}`}
  </div>`;

  // Shareable summary — a single, screenshot-ready card consolidating the headline numbers,
  // so sharing this report doesn't require stitching together screenshots of five sections.
  // Deliberately repeats the Money DNA score shown at the top — this card exists specifically
  // to be screenshotted/shared on its own, so it needs the score again in a self-contained,
  // shareable format, not a cross-reference back up to the hero section.
  if (!businessMode) {
    const dna = r.moneyDNA;
    html += `<p class="muted" style="text-align:center; margin-bottom:8px;">📸 Shareable summary card — screenshot just this box to share your score</p>
    <div class="card" id="shareCard" style="text-align:center; padding:36px 24px; background:linear-gradient(160deg, #0F2A4A 0%, #163a63 100%); color:#fff;">
      <img class="brand-logo-img" alt="FinNomy" style="height:40px; width:40px; margin-bottom:8px;">
      <div style="font-size:15px; font-weight:700; letter-spacing:0.5px;">FinNomy Money DNA</div>
      <div style="font-size:48px; font-weight:800; margin:10px 0 2px;">${dna.overall}<span style="font-size:20px; opacity:0.7;">/100</span></div>
      <div style="font-size:14px; opacity:0.85; margin-bottom:20px;">${dna.band.emoji} ${esc(dna.band.label)} · ${dna.personality.icon} ${esc(dna.personality.label)}</div>
      <div style="display:flex; justify-content:center; gap:28px; flex-wrap:wrap; font-size:13px; opacity:0.95;">
        <div>🏆 ${esc(r.biggestWin.text)}</div>
        ${r.biggestLeak ? `<div>💸 ${esc(r.biggestLeak.category)}</div>` : ""}
      </div>
      <div style="margin-top:22px; font-size:11.5px; opacity:0.6;">Generated by FinNomy · finnomy.com</div>
    </div>
    <p class="muted no-pdf-capture" style="text-align:center; margin-top:-14px; margin-bottom:20px;">
      Screenshot the card above to share your Money DNA — or challenge a friend to upload their own statement and compare scores.</p>`;
  }

  // 10. Classification coverage
  const confBand = cov.coverageByAmountPct >= 90 ? { emoji: "🟢", label: "Excellent" }
    : cov.coverageByAmountPct >= 70 ? { emoji: "🟡", label: "Good" } : { emoji: "🔴", label: "Needs Review" };
  const datesOk = r.transactions.length > 0 && r.transactions.every(t => t.date instanceof Date && !isNaN(t.date));
  const amountsOk = r.transactions.length > 0 && r.transactions.every(t => t.debit >= 0 && t.credit >= 0 && (t.debit > 0 || t.credit > 0));
  html += `<div class="card">
    <div class="section-title"><span class="section-num">${sec()}.</span>Report Confidence</div>
    <p class="body-text"><span class="pill" style="background:#F1F2F4;">${confBand.emoji} ${esc(confBand.label)} — ${fmtPct(cov.coverageByAmountPct, 1)}</span></p>
    ${table(["Check", "Status"], [
      ["Transactions parsed", `✅ ${ov.numTransactions}`],
      ["Dates parsed", datesOk ? "✅" : "⚠️ some missing"],
      ["Amounts parsed", amountsOk ? "✅" : "⚠️ some missing"],
      ["Categories assigned", fmtPct(cov.coverageByAmountPct, 1)],
      ["Duplicate detection", "✅ checked"],
      ["Overall confidence", `${confBand.emoji} ${fmtPct(cov.coverageByAmountPct, 1)}`],
    ])}
    <p class="body-text" style="margin-top:10px;">${cov.uncategorizedCount} transaction(s) worth ${fmtMoney(cov.uncategorizedAmount)} couldn't be
      confidently categorised from the description alone — these are excluded from the category breakdown above so it doesn't mislead you.</p>
    <div class="foot-disclaimer">
      This report was generated entirely on your device by the FinNomy Bank Statement Analyzer, using fixed rules —
      no AI/LLM reads your transactions, and no data was uploaded, transmitted, or stored anywhere at any point.
      It summarises patterns in your own transaction history and does not constitute investment, tax, or financial advice.
      For advice specific to your situation, consult a registered professional. © FinNomy · finnomy.com
    </div>
    <p class="body-text" style="margin-top:14px; padding-top:14px; border-top:1px solid var(--border);">
      <b>Note:</b> This report is generated automatically and, like any rule-based tool, can occasionally misread or
      miscategorise a transaction. If something here looks incorrect, or you'd like help understanding what it means
      for your finances or planning ahead, reach out to FinNomy at <a href="https://finnomy.com" style="color:var(--blue);">finnomy.com</a> — we're happy to help.
    </p>
  </div>`;

  html += `<div class="actions no-pdf-capture" style="margin-bottom:30px; flex-wrap:wrap;">
    <button class="btn" id="downloadPdfBtn">Download PDF Report</button>
    <button class="btn secondary" id="downloadExcelBtn">Download Excel</button>
    <button class="btn secondary" id="clearDataBtn">Clear My Data &amp; Start Over</button>
  </div>`;

  destroyCharts();
  document.getElementById("report").innerHTML = html;
  document.getElementById("report").style.display = "block";
  applyLogo();
  buildCharts(r);
}
function titleCase(s) { return (s || "").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); }

let chartInstances = [];
function destroyCharts() {
  // Must run BEFORE the report's innerHTML is replaced — Chart.js's destroy() needs its
  // canvas still attached to the document to clean up correctly; destroying after the old
  // canvases have already been removed (e.g. on a second renderReport() call, such as after a
  // category override) throws, since it's operating on detached nodes.
  chartInstances.forEach(c => c.destroy());
  chartInstances = [];
}
function buildCharts(r) {
  const palette = ["#00B37E", "#0B63D8", "#C97B3E", "#8E5DA2", "#B0413E", "#5A8F7B", "#C4A24C", "#4A5568", "#7A9E9F", "#9B6B9E", "#0F2A4A"];

  const catCtx = document.getElementById("categoryChart");
  if (catCtx) {
    const consolidated = consolidateForChart(r.categorySummary, 85);
    const labels = consolidated.map(c => c.category);
    const data = consolidated.map(c => c.totalSpend);
    chartInstances.push(new Chart(catCtx, {
      type: "doughnut",
      data: { labels, datasets: [{ data, backgroundColor: palette, borderColor: "#fff", borderWidth: 2 }] },
      options: { responsive: true, maintainAspectRatio: true, aspectRatio: 1.8,
        plugins: { legend: { position: "right", labels: { boxWidth: 12, font: { size: 11 } } } }, cutout: "55%" },
    }));
  }
  const moCtx = document.getElementById("monthlyChart");
  if (moCtx) {
    chartInstances.push(new Chart(moCtx, {
      type: "bar",
      data: { labels: r.monthlySummary.map(m => m.month), datasets: [
        { label: "Income", data: r.monthlySummary.map(m => m.income), backgroundColor: "#00B37E" },
        { label: "Expense", data: r.monthlySummary.map(m => m.expense), backgroundColor: "#C97B3E" },
      ]},
      options: { responsive: true, maintainAspectRatio: true, aspectRatio: 2.4,
        plugins: { legend: { position: "top", labels: { font: { size: 11 } } } },
        scales: { y: { ticks: { callback: v => "₹" + inrFormatter.format(v), font: { size: 10 } } }, x: { ticks: { font: { size: 10 } } } } },
    }));
  }
  const cfCtx = document.getElementById("cashflowChart");
  if (cfCtx) {
    const posColor = "#00B37E", negColor = "#B0413E", neutralColor = "#0F2A4A";
    chartInstances.push(new Chart(cfCtx, {
      type: "line",
      data: { labels: r.cashFlow.map(m => m.month), datasets: [
        { label: "Cumulative Net", data: r.cashFlow.map(m => m.cumulativeNet), borderColor: neutralColor,
          backgroundColor: "rgba(15,42,74,0.08)", fill: true, tension: 0, pointRadius: 4,
          pointBackgroundColor: ctx => (ctx.parsed && ctx.parsed.y < 0) ? negColor : posColor,
          segment: {
            // Straight lines (tension 0) so the chart never visually overshoots between actual
            // data points — smoothing looks nicer but can misrepresent values that never
            // occurred, which matters more here than usual since this is financial data.
            // Segment color signals the sign: green while the cumulative position is positive,
            // warm red once it's gone negative — a neutral line only for the segment that
            // actually crosses zero, since a single color can't honestly represent both sides.
            borderColor: ctx => {
              const y0 = ctx.p0.parsed.y, y1 = ctx.p1.parsed.y;
              if (y0 >= 0 && y1 >= 0) return posColor;
              if (y0 < 0 && y1 < 0) return negColor;
              return neutralColor;
            },
          } },
      ]},
      options: { responsive: true, maintainAspectRatio: true, aspectRatio: 3.2,
        plugins: { legend: { display: false } },
        scales: { y: { ticks: { callback: v => "₹" + inrFormatter.format(v), font: { size: 10 } } }, x: { ticks: { font: { size: 10 } } } } },
    }));
  }
}

/* =========================================================================
   PDF EXPORT — client-side only (html2canvas + jsPDF), nothing transmitted
   ========================================================================= */
// Chart.js canvases re-captured through html2canvas's own DOM-walking/rendering path are a
// known source of blur/glitches, especially on mobile. Swapping each live <canvas> for a
// static <img> (built from Chart.js's own native export) right before html2canvas runs avoids
// that entirely — html2canvas then just captures a plain image, no canvas-in-canvas involved.
function swapChartsForExport() {
  const swapped = [];
  chartInstances.forEach(chart => {
    const canvas = chart.canvas;
    const img = document.createElement("img");
    img.src = chart.toBase64Image("image/png", 1.0);
    img.style.width = canvas.style.width || (canvas.width + "px");
    img.style.height = canvas.style.height || (canvas.height + "px");
    img.style.display = canvas.style.display || "block";
    canvas.style.display = "none";
    canvas.parentNode.insertBefore(img, canvas);
    swapped.push({ canvas, img });
  });
  return swapped;
}
function restoreChartsAfterExport(swapped) {
  swapped.forEach(({ canvas, img }) => {
    img.remove();
    canvas.style.display = "";
  });
}

async function exportPdf() {
  const btn = document.getElementById("downloadPdfBtn");
  const original = btn.textContent;
  btn.disabled = true;
  // Flush any pending (not-yet-regenerated) category edits first — otherwise the PDF would
  // capture individual rows showing their new category while the charts/scores around them
  // still reflect the old, un-regenerated aggregate, which would look inconsistent on paper.
  if (lastResults && pendingUpdatedCount > 0) {
    lastResults = aggregateAll(lastResults.transactions);
    pendingUpdatedCount = 0;
    document.getElementById("regenerateBar")?.remove();
    renderReport(lastResults, { businessMode });
  }
  let swappedCharts = [];
  try {
    swappedCharts = swapChartsForExport();
    const reportEl = document.getElementById("report");
    // Render and place each card (section) as its own image, rather than one giant screenshot
    // sliced at fixed page-height intervals — that naive approach can cut a chart or table in
    // half exactly at a page boundary. Packing whole cards keeps each section visually intact.
    // The action buttons (Download/Clear) are excluded — they're page UI, not report content.
    const cards = Array.from(reportEl.children).filter(el => !el.classList.contains("no-pdf-capture"));
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    // A real margin on every side — the previous version placed content edge-to-edge, which
    // looks unfinished and prints poorly (many printers can't reproduce right to the paper edge
    // anyway). 10mm is a standard, print-safe document margin.
    const MARGIN = 10;
    const contentWidth = pageWidth - MARGIN * 2;
    const usableHeight = pageHeight - MARGIN * 2;
    let cursorY = MARGIN;
    let placedAnything = false;

    const placeImage = (imgData, imgHeight) => {
      if (imgHeight > usableHeight) {
        // Taller than one page on its own (e.g. a very long transaction table) — paginate it.
        if (placedAnything) { pdf.addPage(); cursorY = MARGIN; }
        let sliceHeightLeft = imgHeight, slicePos = 0;
        pdf.addImage(imgData, "JPEG", MARGIN, MARGIN, contentWidth, imgHeight);
        sliceHeightLeft -= usableHeight;
        while (sliceHeightLeft > 0) {
          slicePos -= usableHeight;
          pdf.addPage();
          pdf.addImage(imgData, "JPEG", MARGIN, MARGIN + slicePos, contentWidth, imgHeight);
          sliceHeightLeft -= usableHeight;
        }
        cursorY = pageHeight; // force the next card onto a fresh page
        placedAnything = true;
        return;
      }
      if (!placedAnything) cursorY = MARGIN;
      else if (cursorY + imgHeight > MARGIN + usableHeight) { pdf.addPage(); cursorY = MARGIN; }
      pdf.addImage(imgData, "JPEG", MARGIN, cursorY, contentWidth, imgHeight);
      cursorY += imgHeight;
      placedAnything = true;
    };

    for (let i = 0; i < cards.length; i++) {
      btn.textContent = `Preparing PDF… (${i + 1}/${cards.length})`;
      const scale = 2.5;
      const canvas = await html2canvas(cards[i], { scale, useCORS: true, backgroundColor: "#F7F9FC" });
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const remaining = placedAnything ? (MARGIN + usableHeight - cursorY) : usableHeight;

      // A card that doesn't fit the remaining space on the current page, but does contain a
      // table, gets split right at the table's top edge instead of wasting that leftover space —
      // the chart/intro lands here, the table starts fresh (splitting further itself if it's
      // long enough to need it). This never cuts a chart or a table row in half.
      const table = cards[i].querySelector("table");
      if (imgHeight > remaining && imgHeight <= usableHeight && table) {
        const cardRect = cards[i].getBoundingClientRect();
        const tableRect = table.getBoundingClientRect();
        const splitCanvasY = Math.round((tableRect.top - cardRect.top) * scale);
        if (splitCanvasY > 20 && splitCanvasY < canvas.height - 20) {
          const topCanvas = document.createElement("canvas");
          topCanvas.width = canvas.width; topCanvas.height = splitCanvasY;
          topCanvas.getContext("2d").drawImage(canvas, 0, 0, canvas.width, splitCanvasY, 0, 0, canvas.width, splitCanvasY);

          const bottomCanvas = document.createElement("canvas");
          bottomCanvas.width = canvas.width; bottomCanvas.height = canvas.height - splitCanvasY;
          bottomCanvas.getContext("2d").drawImage(canvas, 0, splitCanvasY, canvas.width, canvas.height - splitCanvasY, 0, 0, canvas.width, canvas.height - splitCanvasY);

          placeImage(topCanvas.toDataURL("image/jpeg", 0.97), (topCanvas.height * imgWidth) / topCanvas.width);
          placeImage(bottomCanvas.toDataURL("image/jpeg", 0.97), (bottomCanvas.height * imgWidth) / bottomCanvas.width);
          continue;
        }
      }

      placeImage(canvas.toDataURL("image/jpeg", 0.97), imgHeight);
    }
    pdf.save("FinNomy-Bank-Statement-Report.pdf");
  } catch (err) {
    console.error(err);
    alert("Something went wrong generating the PDF. Your data is still safe — nothing was sent anywhere. Please try again.");
  } finally {
    restoreChartsAfterExport(swappedCharts);
    btn.disabled = false; btn.textContent = original;
  }
}

const LOGO_DATA_URI = "data:image/png;base64,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";
const SOCIAL_ICONS = {"website": "data:image/png;base64,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", "instagram": "data:image/png;base64,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", "x": "data:image/png;base64,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", "linkedin": "data:image/png;base64,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", "whatsapp": "data:image/png;base64,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"};
function applyLogo() {
  document.querySelectorAll(".brand-logo-img").forEach(img => { img.src = LOGO_DATA_URI; });
  document.querySelectorAll(".social-icon").forEach(img => { img.src = SOCIAL_ICONS[img.dataset.icon] || ""; });
}
applyLogo();

// Instagram's in-app browser (and others like it) can behave inconsistently with file
// pickers on some devices — this is advisory only, never blocks the picker from being tried.
if (/Instagram/i.test(navigator.userAgent)) {
  const banner = document.getElementById("inAppBrowserBanner");
  if (banner) banner.style.display = "flex";
}

/* =========================================================================
   UI WIRING
   ========================================================================= */
let selectedFile = null;
let lastResults = null;
let businessMode = false;

document.getElementById("accountModeToggle").addEventListener("click", (e) => {
  const btn = e.target.closest(".mode-btn");
  if (!btn) return;
  businessMode = btn.dataset.mode === "business";
  document.querySelectorAll("#accountModeToggle .mode-btn").forEach(b => b.classList.toggle("mode-btn-active", b === btn));
  // Flush any pending (not-yet-regenerated) category edits first — otherwise switching modes
  // would render stale aggregates that don't reflect changes already applied to the underlying
  // transactions.
  if (lastResults && pendingUpdatedCount > 0) { lastResults = aggregateAll(lastResults.transactions); pendingUpdatedCount = 0; document.getElementById("regenerateBar")?.remove(); }
  if (lastResults) renderReport(lastResults, { businessMode }); // live-switch if a report is already showing
});

const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const fileChipHolder = document.getElementById("fileChipHolder");
const errorHolder = document.getElementById("errorHolder");
const loadingBox = document.getElementById("loadingBox");

dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.classList.add("dragover"); });
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
dropzone.addEventListener("drop", (e) => {
  e.preventDefault(); dropzone.classList.remove("dragover");
  if (e.dataTransfer.files.length) handleFileSelected(e.dataTransfer.files[0]);
});
fileInput.addEventListener("change", (e) => { if (e.target.files.length) handleFileSelected(e.target.files[0]); });

function handleFileSelected(file) {
  const validExt = /\.(csv|xlsx|xls|pdf)$/i.test(file.name);
  errorHolder.innerHTML = "";
  if (!validExt) {
    errorHolder.innerHTML = `<div class="error-box">Please upload a .csv, .xlsx, .xls, or .pdf file.</div>`;
    return;
  }
  selectedFile = file;
  fileChipHolder.innerHTML = `<div class="file-chip">📎 ${esc(file.name)} <button id="removeFileBtn" type="button">✕</button></div>`;
  document.getElementById("removeFileBtn").addEventListener("click", () => {
    selectedFile = null; fileInput.value = ""; fileChipHolder.innerHTML = "";
    document.getElementById("pdfPasswordHolder").style.display = "none";
    analyzeBtn.disabled = true;
  });
  document.getElementById("pdfPasswordHolder").style.display = /\.pdf$/i.test(file.name) ? "block" : "none";
  analyzeBtn.disabled = false;
}

function showParseError(diag) {
  loadingBox.style.display = "none";
  document.getElementById("upload-card").style.display = "block";
  const fieldLabels = { date: "Date", description: "Description", debit: "Withdrawal/Debit", credit: "Deposit/Credit", balance: "Balance", amount: "Amount", type: "Type" };
  let checklist = "";
  if (diag && diag.found) {
    const rows = Object.entries(fieldLabels).map(([key, label]) => {
      const hit = diag.found[key];
      return `<div>${hit ? "✅" : "❌"} ${label}${hit ? ` <span class="muted">(${hit.confidence}% match)</span>` : ""}</div>`;
    }).join("");
    checklist = `<div style="margin-top:10px; display:flex; flex-direction:column; gap:3px; font-size:13px;">${rows}</div>`;
  }
  errorHolder.innerHTML = `<div class="error-box">
    We found a statement but couldn't confidently identify the transaction columns needed to analyse it —
    make sure it has a <b>Date</b> and <b>Description</b> column, plus either separate <b>Debit</b>/<b>Credit</b>
    columns or a single <b>Amount</b> column.
    ${checklist}
    <p style="margin-top:10px;">Click "What format do I need?" above for the exact template.</p>
  </div>`;
}
function showEmptyError(extra) {
  loadingBox.style.display = "none";
  document.getElementById("upload-card").style.display = "block";
  errorHolder.innerHTML = `<div class="error-box">We couldn't read any valid transaction rows from this file. ${extra || "Please check the format and try again."}</div>`;
}
function showPdfDebug(lines, diagLine) {
  loadingBox.style.display = "none";
  document.getElementById("upload-card").style.display = "block";
  const sample = lines.slice(0, 30).map(esc).join("\n");
  errorHolder.innerHTML = `<div class="error-box">
    We found text in this PDF but couldn't match our expected transaction pattern (date, description, amount) on
    any line — every bank formats statements a little differently. CSV/Excel export from net banking will be far
    more reliable. If you'd like this PDF layout supported, you can share a few sample lines from the box below
    (edit out any real amounts/names first) so the pattern can be fixed.
    <details open style="margin-top:10px;">
      <summary style="cursor:pointer; font-weight:600;">Extracted text (first 30 lines, stays on your device)</summary>
      <pre style="white-space:pre-wrap; font-size:11px; background:#fff; border:1px solid var(--border); border-radius:6px; padding:10px; margin-top:8px; max-height:260px; overflow:auto;">${sample || "(no lines extracted)"}${diagLine ? "\n\n" + esc(diagLine) : ""}</pre>
    </details>
  </div>`;
}

analyzeBtn.addEventListener("click", async () => {
  if (!selectedFile) return;
  errorHolder.innerHTML = "";
  loadingBox.style.display = "block";
  document.getElementById("upload-card").style.display = "none";
  try {
    if (/\.pdf$/i.test(selectedFile.name)) {
      const pwdField = document.getElementById("pdfPasswordInput");
      const password = pwdField && pwdField.value ? pwdField.value : undefined;
      const { lines, diag } = await extractPdfTextLines(selectedFile, password);

      if (diag.isEncrypted) {
        loadingBox.style.display = "none";
        document.getElementById("upload-card").style.display = "block";
        errorHolder.innerHTML = `<div class="error-box">
          ${diag.passwordWasWrong
            ? "That password didn't work — double check it and try again."
            : "This PDF is password-protected."}
          Enter the password in the field above the Analyze button (usually your date of birth as
          DDMMYYYY, PAN, or customer ID — check your bank's password format if unsure) and try again.
        </div>`;
        return;
      }
      const diagLine = `Diagnostics — pdf.js v${esc(diag.pdfjsVersion)}, ${diag.pages} page(s), raw text fragments per page: [${diag.rawItemsPerPage.join(", ")}]${diag.loadError ? `, load error: ${esc(diag.loadError)}` : ""}`;
      if (!lines.length) {
        loadingBox.style.display = "none";
        document.getElementById("upload-card").style.display = "block";
        errorHolder.innerHTML = `<div class="error-box">This PDF doesn't seem to have selectable text — it may be a
          scanned image rather than a text-based statement. This tool reads text directly and doesn't do OCR
          (to keep everything simple, fast, and fully offline). Please try a CSV/Excel export from your bank's
          net banking instead.
          <pre style="white-space:pre-wrap; font-size:11px; background:#fff; border:1px solid var(--border); border-radius:6px; padding:10px; margin-top:8px;">${diagLine}</pre>
        </div>`;
        return;
      }
      let transactions = parsePdfLinesToTransactions(lines);
      if (!transactions.length) transactions = parsePdfLinesToTransactions(lines, { relaxed: true });
      loadingBox.style.display = "none";
      if (!transactions.length) { showPdfDebug(lines, diagLine); return; }
      const selfName = detectAccountHolderName(lines);
      showTransactionPreview(transactions, validateParsedData(transactions), "PDF statement (layouts vary by bank, so this is a best-effort read)", { selfName });
      return;
    }

    let parsed;
    if (/\.csv$/i.test(selectedFile.name)) parsed = await parseCSVFile(selectedFile);
    else parsed = await parseExcelFile(selectedFile);

    const mapped = mapRowsToTransactions(parsed.rows, parsed.headers);
    if (mapped.error) { showParseError(parsed.headerConfidence); return; }
    if (!mapped.transactions.length) { showEmptyError(); return; }

    loadingBox.style.display = "none";
    showTransactionPreview(mapped.transactions, validateParsedData(mapped.transactions, mapped), /\.csv$/i.test(selectedFile.name) ? "CSV file" : "Excel file");
    // The raw file and parsed rows are only ever referenced from selectedFile/parsed/mapped,
    // which are local variables — nothing is written to storage at any point.
  } catch (err) {
    console.error(err);
    loadingBox.style.display = "none";
    document.getElementById("upload-card").style.display = "block";
    const detail = esc(`${err && err.name ? err.name + ": " : ""}${err && err.message ? err.message : String(err)}`);
    errorHolder.innerHTML = `<div class="error-box">
      Something went wrong reading this file. Please check it's a valid statement export and try again.
      <details style="margin-top:8px;">
        <summary style="cursor:pointer; font-weight:600;">Show technical details (for troubleshooting)</summary>
        <pre style="white-space:pre-wrap; font-size:11px; background:#fff; border:1px solid var(--border); border-radius:6px; padding:10px; margin-top:8px;">${detail}</pre>
      </details>
    </div>`;
  }
});

// Unified preview/confirmation step — used for every source (PDF, CSV, Excel) so nothing skips
// straight to a full report without a chance to catch a bad parse first. A hard failure (very
// low confidence, or a blocker like "no dates found") refuses outright rather than generating a
// misleading report; anything else gets a confidence-labelled preview to confirm before proceeding.
function showTransactionPreview(transactions, validation, sourceLabel, meta) {
  const analysisOpts = { selfName: meta && meta.selfName };
  if (validation.confidence < 40 || validation.blockers.length) {
    document.getElementById("upload-card").style.display = "block";
    errorHolder.innerHTML = `<div class="error-box">
      We couldn't confidently read this statement (${validation.confidence}% confidence) — generating a report from it
      would likely show wrong numbers, so we've stopped here instead.
      ${validation.blockers.length ? `<ul style="margin:8px 0 0 18px;">${validation.blockers.map(b => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
      Try a CSV/Excel export from your bank's net banking instead — it's usually far more reliable to read than a PDF.
    </div>`;
    return;
  }
  const preview = transactions.slice(0, 8);
  const confBand = validation.confidence >= 90 ? { label: "High confidence", cls: "healthy" }
    : validation.confidence >= 70 ? { label: "Good confidence", cls: "moderate" } : { label: "Please verify carefully", cls: "tight" };

  document.getElementById("upload-card").style.display = "none";
  const reviewHtml = `
  <div class="card" id="preview-review-card">
    <div class="section-title">Quick check before we analyse</div>
    <p class="body-text">${esc(sourceLabel)} — we found <b>${transactions.length}</b> transaction(s), read with
      <span class="pill ${pillClass(confBand.cls === "healthy" ? "Healthy" : confBand.cls === "moderate" ? "Moderate" : "Tight")}">${validation.confidence}% — ${confBand.label}</span></p>
    <p class="body-text">Here are the first ${preview.length}: does this look right (dates, amounts, debit/credit in the correct column)?</p>
    ${table(["Date", "Description", "Debit", "Credit", "Balance"], preview.map(t => [
      fmtDate(t.date), esc(t.description), t.debit ? fmtMoney(t.debit) : "", t.credit ? fmtMoney(t.credit) : "",
      t.balance !== null && t.balance !== undefined ? fmtMoney(t.balance) : "-"
    ]), [2, 3, 4])}
    <div class="actions">
      <button class="btn" id="previewLooksGoodBtn">Looks good — analyze all ${transactions.length}</button>
      <button class="btn secondary" id="previewCancelBtn">Try a different file</button>
    </div>
    <p class="muted" style="margin-top:10px;">If debit/credit look swapped or amounts look wrong, this file's layout
      probably isn't a great fit for this parser — a different export format from net banking may work better.</p>
  </div>`;
  document.getElementById("report").innerHTML = reviewHtml;
  document.getElementById("report").style.display = "block";

  document.getElementById("previewLooksGoodBtn").addEventListener("click", () => {
    lastResults = runFullAnalysis(transactions, analysisOpts);
    renderReport(lastResults, { businessMode });
  });
  document.getElementById("previewCancelBtn").addEventListener("click", () => clearAllData());
}


document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "downloadPdfBtn") exportPdf();
  if (e.target && e.target.id === "downloadExcelBtn") exportExcel();
  if (e.target && e.target.id === "clearDataBtn") clearAllData();
  if (e.target && e.target.id === "regenerateReportBtn") regenerateReport();
  const catEdit = e.target && e.target.closest && e.target.closest(".cat-edit");
  if (catEdit) startCategoryEdit(catEdit);
});

// Exports the current in-memory transaction list (including any manual category corrections)
// as a plain CSV the user can open in Excel/Sheets. Built and downloaded entirely client-side —
// same as everything else here, nothing is transmitted anywhere.
// A genuine multi-sheet report, not just a transaction dump — mirrors the PDF's key sections
// (Summary, Category Breakdown, Transactions, Recurring, Anomalies) so this is useful on its
// own, not merely a cleaned-up copy of the input file. Built entirely client-side with SheetJS,
// already loaded for reading Excel files.
function exportExcel() {
  if (!lastResults) return;
  const r = lastResults;
  const wb = XLSX.utils.book_new();

  const summaryRows = [
    { Metric: "Statement period", Value: `${fmtDate(r.overview.periodStart)} - ${fmtDate(r.overview.periodEnd)}` },
    { Metric: "Transactions analysed", Value: r.overview.numTransactions },
    { Metric: "Opening balance", Value: r.overview.openingBalance },
    { Metric: "Closing balance", Value: r.overview.closingBalance },
    { Metric: "Total money in", Value: r.overview.totalInflow },
    { Metric: "Total money out", Value: r.overview.totalOutflow },
    { Metric: "Net change", Value: r.overview.netChange },
    { Metric: "Money DNA score", Value: `${r.moneyDNA.overall}/100 (${r.moneyDNA.band.label})` },
    { Metric: "Money DNA — provisional?", Value: r.moneyDNA.provisional ? "Yes — classification coverage below 80%" : "No" },
    { Metric: "Savings rate", Value: isNaN(r.financialHealth.savingsRatePct) ? "-" : `${r.financialHealth.savingsRatePct.toFixed(1)}%` },
    { Metric: "Classification coverage (by value)", Value: `${r.classificationCoverage.coverageByAmountPct.toFixed(1)}%` },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Summary");

  const catRows = r.categorySummary.map(c => ({ Category: c.category, "Total Spend": c.totalSpend, "% of Spend": c.pctOfSpend.toFixed(1), Transactions: c.count }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(catRows), "Category Summary");

  const txRows = r.transactions.map(t => ({
    Date: t.date.toISOString().slice(0, 10), Description: t.description, Category: t.category,
    "Category Confidence %": t.categoryConfidence, Debit: t.debit || "", Credit: t.credit || "",
    Balance: t.balance !== null ? t.balance : "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txRows), "Transactions");

  if (r.recurring.length) {
    const recRows = r.recurring.map(x => ({
      "Merchant / Payee": titleCase(x.merchant), Direction: x.direction === "credit" ? "Income" : "Expense",
      Category: x.category, "Avg Amount": x.avgAmount, "Annual Total": x.avgAmount * 12,
      "Typically On": `~${x.typicalDay}th`, "Months Seen": x.monthsSeen,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(recRows), "Recurring");
  }

  if (r.anomalies.length) {
    const anomRows = r.anomalies.map(a => ({ Date: a.date.toISOString().slice(0, 10), Description: a.description, Category: a.category, Amount: a.amount, Type: a.type, Detail: a.detail }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(anomRows), "Anomalies");
  }

  XLSX.writeFile(wb, "FinNomy-Report.xlsx");
}
// Small toast confirming a category edit actually changed the Money DNA score — encourages
// people to keep fixing miscategorized transactions rather than shrugging past the dropdown.
function showToast(message) {
  const existing = document.getElementById("finnomyToast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.id = "finnomyToast";
  toast.textContent = message;
  toast.style.cssText = "position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:var(--navy); color:#fff; padding:10px 20px; border-radius:8px; font-size:13.5px; font-weight:600; box-shadow:0 4px 16px rgba(0,0,0,0.2); z-index:9999; opacity:0; transition:opacity .25s; max-width:90vw; text-align:center; white-space:normal;";
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = "1"; });
  setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => toast.remove(), 300); }, 3400);
}
// Click-to-recategorize, staged rather than applied instantly: picking a new category updates
// that row's label and the transaction in memory, but the rest of the report (charts, Money
// DNA, tables) stays exactly as it was until "Regenerate Report" is clicked — an explicit,
// visible action rather than everything silently recalculating on every single click. This is
// session-only — nothing is ever written to storage, and it resets on refresh or Clear My Data.
let pendingUpdatedCount = 0;
function startCategoryEdit(span) {
  const kind = span.dataset.kind, key = span.dataset.key, current = span.dataset.current;
  const select = document.createElement("select");
  select.className = "cat-edit-select";
  CATEGORY_LIST.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat; opt.textContent = cat;
    if (cat === current) opt.selected = true;
    select.appendChild(opt);
  });
  span.replaceWith(select);
  select.focus();
  // change and blur can both fire for the same interaction (selecting an option closes the
  // dropdown, which also blurs it) — without a guard, both handlers try to replace the same
  // now-detached DOM node, and the second one throws, silently killing whatever ran after it
  // (which is exactly how this broke showRegenerateBar() without any visible error to the user).
  let handled = false;
  const finish = () => {
    if (handled) return;
    handled = true;
    const newCategory = select.value;
    if (newCategory !== current) queueCategoryChange(select, kind, key, newCategory);
    else restoreLabel(select, kind, key, current);
  };
  select.addEventListener("change", finish);
  select.addEventListener("blur", finish);
}
function restoreLabel(select, kind, key, category) {
  const display = (kind === "merchant" || kind === "tx") ? (businessMode && (category === "Bank Transfers" || category === "Bank Transfer / Peer Payment") ? "Vendor Payouts / Transfers" : category) : category;
  const span = document.createElement("span");
  span.className = "cat-edit";
  span.dataset.kind = kind; span.dataset.key = key; span.dataset.current = category;
  span.innerHTML = `${esc(display)} <span class="cat-edit-icon">✏️</span>`;
  select.replaceWith(span);
}
function queueCategoryChange(select, kind, key, newCategory) {
  if (!lastResults) return;
  const tx = lastResults.transactions;
  let updatedNow = 0;
  // A manual correction is by definition certain — mark it as user-confirmed (100%) rather than
  // leaving the old rule-derived confidence value sitting there stale.
  if (kind === "merchant") {
    tx.forEach(t => { if (t.merchant === key) { t.category = newCategory; t.categoryConfidence = 100; updatedNow++; } });
  } else if (kind === "tx") {
    const id = Number(key);
    const match = tx.find(t => t._id === id);
    if (match) { match.category = newCategory; match.categoryConfidence = 100; updatedNow = 1; }
  }
  pendingUpdatedCount += updatedNow;
  restoreLabel(select, kind, key, newCategory);
  showRegenerateBar();
}
function showRegenerateBar() {
  let bar = document.getElementById("regenerateBar");
  const isNew = !bar;
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "regenerateBar";
    bar.className = "no-pdf-capture";
    // Fixed to the viewport (not sticky within the report's document flow) — guarantees it's
    // visible immediately no matter where in a long, scrolled report the edit happened, rather
    // than relying on scroll position to bring a sticky element into view.
    bar.style.cssText = "position:fixed; top:0; left:0; right:0; z-index:500; background:#0F2A4A; color:#fff; padding:14px 20px; display:flex; align-items:center; justify-content:center; gap:16px; box-shadow:0 2px 16px rgba(0,0,0,0.35); font-size:14px; font-weight:600;";
    document.body.appendChild(bar);
  }
  bar.innerHTML = `<span>✏️ ${pendingUpdatedCount} transaction${pendingUpdatedCount === 1 ? "" : "s"} updated</span>
    <button id="regenerateReportBtn" class="btn" style="background:#00B37E; padding:9px 20px; border:none; font-size:14px;">🔄 Regenerate Report</button>`;
  if (isNew) {
    // Brief entrance animation — a bar that just silently appears at the very top of a long
    // page is easy to miss; a short slide/flash draws the eye to it the moment it shows up.
    bar.style.transform = "translateY(-100%)";
    bar.style.transition = "transform 0.35s ease-out";
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.transform = "translateY(0)"; }));
  }
}
function regenerateReport() {
  if (!lastResults) return;
  const prevScore = lastResults.moneyDNA ? lastResults.moneyDNA.overall : null;
  const prevCoverage = lastResults.classificationCoverage ? lastResults.classificationCoverage.coverageByAmountPct : null;
  const updatedCount = pendingUpdatedCount;
  lastResults = aggregateAll(lastResults.transactions);
  pendingUpdatedCount = 0;
  document.getElementById("regenerateBar")?.remove(); // now fixed to <body>, not inside #report, so renderReport()'s innerHTML swap won't clear it on its own
  renderReport(lastResults, { businessMode });
  const newScore = lastResults.moneyDNA ? lastResults.moneyDNA.overall : null;
  const newCoverage = lastResults.classificationCoverage ? lastResults.classificationCoverage.coverageByAmountPct : null;
  const parts = [`${updatedCount} transaction${updatedCount === 1 ? "" : "s"} updated`];
  if (prevCoverage !== null && newCoverage !== null && Math.round(prevCoverage) !== Math.round(newCoverage)) parts.push(`Classification ${Math.round(prevCoverage)}% → ${Math.round(newCoverage)}%`);
  if (prevScore !== null && newScore !== null && prevScore !== newScore) parts.push(`Money DNA ${prevScore} → ${newScore}`);
  showToast(parts.join(" · "));
}

function clearAllData() {
  selectedFile = null;
  lastResults = null;
  pendingUpdatedCount = 0;
  fileInput.value = "";
  fileChipHolder.innerHTML = "";
  errorHolder.innerHTML = "";
  analyzeBtn.disabled = true;
  destroyCharts();
  document.getElementById("regenerateBar")?.remove();
  document.getElementById("report").innerHTML = "";
  document.getElementById("report").style.display = "none";
  document.getElementById("upload-card").style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.getElementById("sampleFormatBtn").addEventListener("click", () => {
  errorHolder.innerHTML = `<div class="error-box" style="background:#EEF4FE; border-color:#CFE0FA; color:#0B4C9E;">
    <b>CSV or Excel (recommended):</b> needs at minimum a <b>Date</b> column and a <b>Description</b> column, plus either
    <b>Debit</b> + <b>Credit</b> columns (amount in the relevant column, 0 or blank otherwise), or a single
    <b>Amount</b> column. A <b>Balance</b> column is optional but improves the Overview and Financial Health sections.
    Most bank net-banking portals let you export your statement this way — look for "Download Statement" or "Export"
    on your transaction history page.<br><br>
    <b>PDF:</b> also supported, read directly from the statement text — no separate columns needed. This is best-effort
    since every bank formats PDFs differently, so you'll get a quick preview to check before the full report runs.
    If it doesn't look right, CSV/Excel will be more reliable.
  </div>`;
});
})();

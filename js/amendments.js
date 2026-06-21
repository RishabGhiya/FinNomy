const complianceAmendments = {
    gst: [
        {
            id: 'gst-1',
            title: "GST 2.0: Simplified 4-Slab Structure",
            excerpt: "Rationalization of rates (0%, 5%, 18%, 40%) effective 2026.",
            detail: "The 'GST 2.0' overhaul replaces the old five-tier system. Essential items are now Nil, while daily goods/healthcare fall under 5%. Electronics and appliances are standardized at 18%, and luxury/sin goods at 40%. This aims to reduce classification disputes and complexity. **Effective:** September 2025 - March 2026 rollout.",
            date: "Updated 1 hour ago",
            officialRef: "56th GST Council Meeting Recommendations"
        },
        {
            id: 'gst-2',
            title: "Post-Sale Discount Simplification",
            excerpt: "Amendments to Sections 15(3) and 34 for credit notes.",
            detail: "Businesses no longer require a pre-existing agreement to claim GST benefits on post-sale discounts. A credit note can be issued under Section 34, and the discount can be excluded from taxable value if the recipient reverses the related ITC. This significantly improves cash flow for distributors. **Action:** Update your ERP discount workflows.",
            date: "Updated 3 hours ago",
            officialRef: "CGST Act, Sections 15(3) & 34 (Amended)"
        },
        {
            id: 'gst-3',
            title: "Intermediary Services as Exports",
            excerpt: "Reclassification to exempt GST for overseas clients.",
            detail: "Services provided to overseas clients qualifying as 'intermediary' are now reclassified as exports. This removes the 18% GST burden previously applicable due to 'place of supply' rules under Section 13 of the IGST Act. **Impact:** Massive boost for Indian BPO and KPO sectors.",
            date: "Updated 1 day ago",
            officialRef: "IGST Act, Section 13 (Amended 2026)"
        },
        {
            id: 'gst-4',
            title: "GSTR-3B Hard Validations",
            excerpt: "Mandatory ITC matching with GSTR-2B via portal.",
            detail: "Starting January 2026, the GST portal prevents filing of GSTR-3B if the claimed ITC does not match the eligible balances in GSTR-2B. This 'Hard Validation' eliminates the 5% buffer, making real-time vendor reconciliation mandatory for filing. **Action:** Daily reconciliation with GSTR-2B recommended.",
            date: "Updated 2 days ago",
            officialRef: "CBIC Portal Advisory No. 04/2026"
        },
        {
            id: 'gst-5',
            title: "Removal of Export Refund Threshold",
            excerpt: "Processing of minor refund claims irrespective of amount.",
            detail: "The minimum threshold for sanctioning export refund claims has been completely removed. Taxpayers can now claim even small refund amounts, ensuring no working capital is blocked in the system. **Effective:** March 1, 2026.",
            date: "Updated 3 days ago",
            officialRef: "Notification No. 08/2026 – Central Tax"
        },
        {
            id: 'gst-6',
            title: "Elimination of GST Compensation Cess",
            excerpt: "Cess phase-out for most luxury items.",
            detail: "The GST Compensation Cess, which was originally intended for a 5-year period, has been formally eliminated starting February 2026 for several categories. It has been replaced by the 40% luxury slab in GST 2.0. **Impact:** Adjusted tax planning required for high-value segments.",
            date: "Updated 5 days ago",
            officialRef: "GST Council Press Release, Feb 2026"
        },
        {
            id: 'gst-7',
            title: "DRC-03A: Linking Voluntary Payments",
            excerpt: "New mechanism to link pre-deposits with demand orders.",
            detail: "Taxpayers making voluntary payments via DRC-03 for appeals must now use the DRC-03A form to link these payments with specific demand orders. This ensures proper adjustment of the 10% or 25% pre-deposit required for appeals. **Action:** Use DRC-03A to avoid recovery notices.",
            date: "Updated 1 week ago",
            officialRef: "CBIC Instruction No. 02/2026"
        },
        {
            id: 'gst-8',
            title: "HSNS Cess Filing Procedures",
            excerpt: "Guidance for Cess-registered persons.",
            detail: "CBIC Advisory No. 06/2026 (Mar 12, 2026) details the new HSNS Return filing procedure. It focuses on large industrial producers and specific cess-eligible commodities. **Note:** Monthly compliance is mandatory for registered persons.",
            date: "Updated 1 week ago",
            officialRef: "CBIC Advisory No. 06/2026"
        },
        {
            id: 'gst-9',
            title: "Restricted Retrospective Cancellation",
            excerpt: "High Court ruling on registration cancellation.",
            detail: "A landmark 2026 ruling clarifies that GST registration cannot be canceled retrospectively without explicitly mentioning the 'retrospective' intent and reasons in the initial Show Cause Notice (SCN). **Impact:** Protections against arbitrary department actions.",
            date: "Updated 2 weeks ago",
            officialRef: "Judicial Precedent (HC), March 2026"
        },
        {
            id: 'gst-10',
            title: "Revised Tariff Values (March 2026)",
            excerpt: "Updated values for Gold, Silver, and Edible Oils.",
            detail: "New tariff values for import duties became effective on March 14, 2026. This affects the IGST calculation at the time of import for brass scrap, gold, and silver. **Action:** Sync your customs-clearance costs with the new rates.",
            date: "Updated 2 weeks ago",
            officialRef: "CBIC Notification, March 14, 2026"
        }
    ],
    tax: [
        {
            id: 'tax-1',
            title: "Income-tax Act, 2025 Transition",
            excerpt: "The 1961 Act is replaced starting April 1, 2026.",
            detail: "Budget 2026 marks the historical transition from the 1961 Act to the new 'Income-tax Act, 2025'. The new Act focuses on simplified language, reduced litigation, and a unified 'Tax Year' concept. **Significance:** Fundamental shift in how income is computed and reported.",
            date: "Updated 4 hours ago",
            officialRef: "Union Budget 2026-27 Highlights"
        },
        {
            id: 'tax-2',
            title: "Unified 'Tax Year' System",
            excerpt: "Elimination of Assessment Year/Previous Year distinction.",
            detail: "Starting April 2026, India moves to a unified 'Tax Year' system (e.g., Tax Year 2026). This replaces the confusing split between 'Previous Year' and 'Assessment Year', aligning with international standards. **Action:** Update your accounting year references.",
            date: "Updated 6 hours ago",
            officialRef: "Income-tax Act 2025, Section 2"
        },
        {
            id: 'tax-3',
            title: "Enhanced Sec 87A Rebate (₹60,000)",
            excerpt: "Income up to ₹12 Lakh now effectively tax-free.",
            detail: "Under the New Tax Regime, the rebate under Section 87A has been stabilized at ₹60,000. Combined with the standard deduction, this makes a total income of up to ₹12.75 lakh entirely tax-free for salaried individuals. **Impact:** Strategic benefit for the middle income segment.",
            date: "Updated 1 day ago",
            officialRef: "Budget 2026, Finance Bill Update"
        },
        {
            id: 'tax-4',
            title: "Standard Deduction at ₹75,000",
            excerpt: "Further incentive for the New Tax Regimes.",
            detail: "The standard deduction for salaried employees and pensioners under the New Tax Regime has been hiked to ₹75,000 (up from ₹50k). This further widens the gap between the regimes and promotes the New Regime as the primary choice. **Note:** Available only under Section 115BAC.",
            date: "Updated 2 days ago",
            officialRef: "Finance Act 2026 Amendment"
        },
        {
            id: 'tax-5',
            title: "12-Month Revised Return Window",
            excerpt: "Extended period to correct income tax filings.",
            detail: "The period for filing a revised return has been extended to 12 months from the end of the relevant tax year. Taxpayers now have until March 31 of the following year to rectify errors in their original return. **Impact:** Significant relief for accidental non-compliance.",
            date: "Updated 3 days ago",
            officialRef: "Income-tax Act 2025, Filing Rules"
        },
        {
            id: 'tax-6',
            title: "STT Rate Hikes (Futures & Options)",
            excerpt: "Increased transaction tax for derivatives trading.",
            detail: "Securities Transaction Tax (STT) on Futures has been hiked to 0.05% (from 0.02%) and on Options to 0.15% (on premium). This is intended to curb excessive speculation in the derivatives segment. **Action:** Re-evaluate your trading cost-to-profit ratios.",
            date: "Updated 4 days ago",
            officialRef: "Finance Act 2026, Schedule IV"
        },
        {
            id: 'tax-7',
            title: "MAT Rate Reduced to 14%",
            excerpt: "Minimum Alternate Tax is now a 'Final Tax'.",
            detail: "The MAT rate for companies has been reduced from 15% to 14%. Critically, it is now proposed to be a final tax, while brought-forward MAT credit accumulated till Mar 2026 remains available for set-off. **Impact:** Simplification of the corporate tax structure.",
            date: "Updated 1 week ago",
            officialRef: "Budget 2026 Corporate Tax Reform"
        },
        {
            id: 'tax-8',
            title: "Buy-back of Shares as Capital Gains",
            excerpt: "Shift in taxability for promoters and corporates.",
            detail: "Gains from the buy-back of shares will now be taxed as capital gains in the hands of the shareholders. Promoters will pay an additional buy-back tax, resulting in an effective tax of 22-30% depending on the promoter type. **Action:** Review exit strategies for 2026.",
            date: "Updated 1 week ago",
            officialRef: "Income-tax (Second Amendment) Rules, 2026"
        },
        {
            id: 'tax-9',
            title: "LRS/TCS Reduction to 2%",
            excerpt: "Relief for education, medical, and tour remittances.",
            detail: "Proposed reduction in TCS rates for overseas remittances (education/medical) and foreign tour packages from 5-20% to a flat 2%, without any threshold stipulation. **Effective:** July 1, 2026 (Subject to notification).",
            date: "Updated 2 weeks ago",
            officialRef: "Ministry of Finance Budget Speech"
        },
        {
            id: 'tax-10',
            title: "Digital Asset Reporting (CARF)",
            excerpt: "New disclosures for Crypto and Digital Assets.",
            detail: "Income-tax (Amendment) Rules, 2026 (Mar 5, 2026) expand the scope of reporting financial institutions to include digital assets, aligning with OECD's CARF. Digital wallets and crypto exchanges must now report high-value holdings. **Impact:** Increased transparency in VDAs.",
            date: "Updated 2 weeks ago",
            officialRef: "Income-tax (First Amendment) Rules, 2026"
        }
    ],
    roc: [
        {
            id: 'roc-1',
            title: "CCFS-2026: Overdue Filing Amnesty",
            excerpt: "One-time pardon for defaulting companies (Apr-Jul 2026).",
            detail: "The 'Companies Compliance Facilitation Scheme, 2026' allows companies to file overdue annual returns and financial statements with significantly reduced additional fees. This is a golden opportunity to clear 'Defaulting' status. **Window:** April 15, 2026, to July 15, 2026. **Action:** Prepare your AOC-4 and MGT-7.",
            date: "Updated 1 day ago",
            officialRef: "MCA Order, Feb 24, 2026"
        },
        {
            id: 'roc-2',
            title: "DIR-3-KYC-WEB: 3-Year Cycle",
            excerpt: "Shift from annual to triennial KYC filing.",
            detail: "Effective March 31, 2026, mandatory Director KYC (DIR-3-KYC-WEB) will now be required once every three financial years instead of annually. This significantly reduces the recurring audit burden for directors. **Condition:** No changes in personal data during the period.",
            date: "Updated 2 days ago",
            officialRef: "Companies (Appointment of Directors) Rules, Amended 2026"
        },
        {
            id: 'roc-3',
            title: "RoC Adjudication Powers (Sec 454)",
            excerpt: "Administrative penalties for minor violations.",
            detail: "Effective Feb 10, 2026, Registrars of Companies (RoCs) are formally empowered as Adjudicating Officers. They can now independently impose penalties for minor statutory defaults (e.g., late board meetings, small filings) without needing a NCLT order. **Impact:** Faster enforcement and lower legal costs.",
            date: "Updated 3 days ago",
            officialRef: "MCA Notification, Feb 10, 2026"
        },
        {
            id: 'roc-4',
            title: "Regional Directorate Expansion",
            excerpt: "10 Directorates instead of 7 for better oversight.",
            detail: "New Regional Directorates have been established in Ahmedabad, Bengaluru, and Chandigarh (Effective Feb 16, 2026). These offices will serve as the appellate tier for RoC orders, improving the speed of adjudication for companies in these hubs. **Impact:** Decentralized regulatory oversight.",
            date: "Updated 4 days ago",
            officialRef: "MCA Establishment Order, 2026"
        },
        {
            id: 'roc-5',
            title: "IBC and Companies Act Amendments",
            excerpt: "Cabinet approval for business process simplification.",
            detail: "On March 10, 2026, the Union Cabinet approved major amendments to simplify insolvency processes and decriminalize specific technical offenses under the Companies Act. This focuses on 'Ease of Doing Business' and protecting honest entrepreneurs. **Action:** Stay tuned for the formal Bill in Parliament.",
            date: "Updated 1 week ago",
            officialRef: "Cabinet Press Release, March 10, 2026"
        },
        {
            id: 'roc-6',
            title: "OECD Pillar Two Alignment (AS 22)",
            excerpt: "Mandatory global tax exposure disclosures.",
            detail: "MCA has aligned Indian Accounting Standard (AS) 22 with OECD's Pillar Two Model Rules (Mar 18, 2026). Large companies must now disclose exposure to global minimum taxes. **Exemption:** Small and medium-sized firms are exempt from these complex disclosures.",
            date: "Updated 1 week ago",
            officialRef: "MCA Notification (Accounting Standards), March 2026"
        },
        {
            id: 'roc-7',
            title: "MCA Advisory: Name Reservation 2026",
            excerpt: "Stricter criteria for distinctive company names.",
            detail: "A new advisory (Mar 18, 2026) clarifies the criteria for name rejection, emphasizing 'distinctive names' and preventing phonetic similarities with existing brands. **Action:** Conduct thorough trademark searches before filing 'Spice+' Part A.",
            date: "Updated 2 weeks ago",
            officialRef: "MCA Advisory, March 18, 2026"
        },
        {
            id: 'roc-8',
            title: "Revised Regional Director (North) Powers",
            excerpt: "Designation changes and enhanced RD authority.",
            detail: "The Companies (Appointment and Qualification of Directors) Amendment Rules, 2025 (effective Mar 31, 2026) modify Rule 11 concerning the Regional Director (Northern Region) designation. This centralizes certain approval powers for North India companies. **Note:** Check jurisdictional rd-portal for filings.",
            date: "Updated 2 weeks ago",
            officialRef: "MCA General Circular No. 03/2026"
        },
        {
            id: 'roc-9',
            title: "CSR-2 Reporting for 2025-26",
            excerpt: "Mandatory addendum for all CSR-eligible companies.",
            detail: "Companies must ensure that their CSR-2 web-form for FY 2025-26 is filed as an addendum to the financial statements. This tracks the 2% spend and unspent amount transfers to notified funds. **Deadline:** Align with AOC-4 timelines.",
            date: "Updated 3 weeks ago",
            officialRef: "Companies (Accounts) Rules, Section 135"
        },
        {
            id: 'roc-10',
            title: "Proposed Corporate Amendment Bill",
            excerpt: "Focus on reducing recurring compliance for LLPs.",
            detail: "MCA is planning a comprehensive Bill to further reduce the compliance burden for Limited Liability Partnerships (LLPs) and small companies. This may include exemptions from certain audit requirements. **Status:** Drafting phase as of March 2026.",
            date: "Updated 1 month ago",
            officialRef: "MCA Legislative Roadmap 2026"
        }
    ]
};

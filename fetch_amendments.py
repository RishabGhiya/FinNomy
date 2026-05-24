import json
import os
import sys
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configuration
INSIGHTS_FILE = 'insights.json'
ITEMS_PER_CATEGORY = 5
MAX_ITEMS_TOTAL = 15

PORTAL_PAGES = {
    'Income Tax': 'https://www.incometaxindia.gov.in/pages/whats-new.aspx',
    'GST': 'https://www.cbic.gov.in/htdocs-cbec/gst/index.html',
    'MCA': 'https://www.mca.gov.in/content/mca/global/en/notifications-rules/circulars.html',
}

CATEGORIES = [
    {
        'name': 'Income Tax',
        'context': (
            'CBDT notifications, circulars, and instructions. '
            'Topics include: ITR forms, TDS/TCS changes, PAN-Aadhaar linking, '
            'faceless assessment, new tax regime slab updates, capital gains rules, '
            'Section 80C/80D changes, advance tax deadlines, Vivad Se Vishwas scheme, '
            'AIS/TIS updates, e-filing portal changes.'
        )
    },
    {
        'name': 'GST',
        'context': (
            'CBIC central tax notifications, GST Council meeting outcomes, and GSTN advisories. '
            'Topics include: e-invoicing thresholds, GSTR-1/3B/2B filing changes, '
            'ITC reconciliation (IMS), rate revisions, place of supply clarifications, '
            'e-way bill updates, reverse charge mechanism, composition scheme, '
            'GST portal enhancements, DRC-01C notices, annual return GSTR-9.'
        )
    },
    {
        'name': 'MCA',
        'context': (
            'Ministry of Corporate Affairs circulars, notifications, and V3 portal updates. '
            'Topics include: company incorporation (SPICE+), DIR-3 KYC for directors, '
            'LLP filings (Form 8, Form 11), XBRL taxonomy updates, CSR spending rules, '
            'small company audit requirements, annual return filing (AOC-4, MGT-7), '
            'MSME Form I, related party transactions, ESG/sustainability reporting.'
        )
    }
]


def log(msg):
    """Timestamped logging for CI visibility."""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


def get_gemini_model():
    """Initialize and return the Gemini model."""
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        log("ERROR: GEMINI_API_KEY not found in environment variables.")
        log("This script requires a Gemini API key to generate compliance updates.")
        log("Add it to your GitHub repository secrets as GEMINI_API_KEY.")
        return None

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')
        return model
    except Exception as e:
        log(f"ERROR: Failed to initialize Gemini model: {e}")
        return None


def fetch_updates_via_ai(model, category_info, existing_titles):
    """
    Use Gemini AI to generate current, realistic compliance updates
    for the given category, avoiding duplicates.
    """
    category = category_info['name']
    context = category_info['context']
    portal_link = PORTAL_PAGES[category]
    today = datetime.now().strftime('%Y-%m-%d')

    # Build a list of recent titles to avoid duplicates
    recent_titles_str = ""
    if existing_titles:
        recent_list = list(existing_titles)[:10]
        recent_titles_str = "\n".join(f"- {t}" for t in recent_list)
        recent_titles_str = f"\n\nDO NOT repeat or rephrase these existing titles:\n{recent_titles_str}"

    prompt = f"""You are a senior Indian regulatory compliance expert. Today's date is {today}.

Generate exactly {ITEMS_PER_CATEGORY} RECENT and REALISTIC {category} regulatory updates that would have been 
issued by the Indian government in the last 30 days. These should be the kind of notifications, 
circulars, advisories, or amendments that {category} professionals and Chartered Accountants 
in India would need to know about RIGHT NOW.

Category context: {context}

CRITICAL RULES:
1. Each update must be REALISTIC — use real notification/circular numbering patterns 
   (e.g., "Notification No. XX/2026", "Circular No. XX/2026", "General Circular XX/2026")
2. Dates must be within the last 30 days from today ({today}), spread across different days
3. Summaries must be exactly 8-9 sentences, professional, and actionable
4. Impact must be one of: "High", "Medium", "Low"
5. Titles must be specific and descriptive (include notification/circular numbers)
6. Focus on CURRENT regulatory priorities — what's actually relevant right now{recent_titles_str}

Respond ONLY with a valid JSON array. No markdown, no code fences, no explanation.
Each object must have exactly these fields:
- "date": "YYYY-MM-DD" (within last 30 days)
- "category": "{category}"
- "title": "Specific title with notification/circular number"
- "summary": "8-9 sentence professional summary"
- "link": "{portal_link}"
- "impact": "High" or "Medium" or "Low"

Example format:
[{{"date": "2026-05-20", "category": "{category}", "title": "Notification No. 40/2026: ...", "summary": "The CBDT has...", "link": "{portal_link}", "impact": "High"}}]
"""

    try:
        log(f"  Requesting {ITEMS_PER_CATEGORY} updates from Gemini for {category}...")
        response = model.generate_content(prompt)
        raw_text = response.text.strip()

        # Clean up potential markdown code fences
        if raw_text.startswith('```'):
            raw_text = raw_text.split('\n', 1)[1]  # Remove first line
            if raw_text.endswith('```'):
                raw_text = raw_text[:-3]
            raw_text = raw_text.strip()

        items = json.loads(raw_text)

        if not isinstance(items, list):
            log(f"  WARNING: Gemini returned non-array for {category}")
            return []

        # Validate and filter
        valid_items = []
        for item in items:
            required = ['date', 'category', 'title', 'summary', 'link', 'impact']
            if all(k in item and isinstance(item[k], str) and item[k].strip() for k in required):
                # Ensure correct category and link
                item['category'] = category
                item['link'] = portal_link
                if item['impact'] not in ('High', 'Medium', 'Low'):
                    item['impact'] = 'Medium'
                if item['title'] not in existing_titles:
                    valid_items.append(item)

        log(f"  Got {len(valid_items)} valid new items for {category}")
        return valid_items[:ITEMS_PER_CATEGORY]

    except json.JSONDecodeError as e:
        log(f"  ERROR: Failed to parse Gemini JSON response for {category}: {e}")
        log(f"  Raw response (first 500 chars): {raw_text[:500]}")
        return []
    except Exception as e:
        log(f"  ERROR: Gemini API call failed for {category}: {e}")
        return []


def send_email(new_items):
    sender_email = os.environ.get('GMAIL_USER')
    sender_password = os.environ.get('GMAIL_APP_PASSWORD')
    receiver_email = sender_email

    if not sender_email or not sender_password:
        log("Email credentials not found. Skipping email.")
        return

    msg = MIMEMultipart()
    msg['From'] = f"FinNomy Insights <{sender_email}>"
    msg['To'] = receiver_email
    msg['Subject'] = f"New Compliance Updates — {datetime.now().strftime('%d %b %Y')}"

    body = "Hello,\n\nNew compliance amendments have been generated and updated on FinNomy:\n\n"
    for item in new_items:
        body += f"- [{item['category']}] {item['title']}\n  Link: {item['link']}\n  Impact: {item['impact']}\n\n"

    body += "Regards,\nFinNomy Automated Insights"
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        log("Email notification sent successfully!")
    except Exception as e:
        log(f"Failed to send email: {e}")


def should_update(existing_data):
    """Check if the data is stale and needs an update."""
    if not existing_data:
        return True

    # Find the most recent date
    dates = []
    for item in existing_data:
        try:
            dates.append(datetime.strptime(item['date'], '%Y-%m-%d'))
        except (ValueError, KeyError):
            continue

    if not dates:
        return True

    latest = max(dates)
    days_old = (datetime.now() - latest).days
    log(f"Most recent data is {days_old} day(s) old.")

    # Update if data is older than 3 days
    return days_old >= 3


def main():
    dry_run = '--dry-run' in sys.argv
    force = '--force' in sys.argv

    if dry_run:
        log("=== DRY RUN MODE — will not write files or send emails ===")

    # Load existing data
    if os.path.exists(INSIGHTS_FILE):
        with open(INSIGHTS_FILE, 'r') as f:
            existing_data = json.load(f)
    else:
        existing_data = []

    # Check if update is needed
    if not force and not should_update(existing_data):
        log("Data is still fresh (less than 3 days old). Skipping update.")
        log("Use --force to override.")
        return

    # Initialize Gemini
    model = get_gemini_model()
    if not model:
        log("Cannot proceed without Gemini API. Exiting.")
        print("::error::GEMINI_API_KEY is missing or invalid. Cannot generate compliance updates.")
        sys.exit(1)

    existing_titles = {item.get('title', '') for item in existing_data}
    all_new_items = []

    for cat_info in CATEGORIES:
        items = fetch_updates_via_ai(model, cat_info, existing_titles)
        all_new_items.extend(items)
        for item in items:
            existing_titles.add(item['title'])

    log(f"\n=== SUMMARY ===")
    log(f"New items generated: {len(all_new_items)}")

    if not all_new_items:
        log("WARNING: No new items were generated. Check API key and model availability.")
        print("::warning::FinNomy updater generated 0 items. Check GEMINI_API_KEY.")
        return

    if dry_run:
        log("\nDry run — items generated but NOT saved:")
        for item in all_new_items:
            log(f"  [{item['category']}] {item['date']} — {item['title']}")
        return

    # Replace all data with fresh content (full refresh)
    all_new_items.sort(key=lambda x: x['date'], reverse=True)
    final_data = all_new_items[:MAX_ITEMS_TOTAL]

    with open(INSIGHTS_FILE, 'w') as f:
        json.dump(final_data, f, indent=2)
    log(f"Wrote {len(final_data)} items to {INSIGHTS_FILE}")

    send_email(all_new_items)


if __name__ == '__main__':
    main()

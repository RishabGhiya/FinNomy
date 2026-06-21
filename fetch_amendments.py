import os
import json
import xml.etree.ElementTree as ET
import urllib.request
import re
from datetime import datetime
import google.generativeai as genai
from bs4 import BeautifulSoup

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

RSS_URL = "https://taxguru.in/feed/"
MAX_ITEMS_TOTAL = 15

# Map TaxGuru categories to our 3 main pillars
CATEGORY_MAP = {
    'income tax': 'Income Tax',
    'goods and services tax': 'GST',
    'gst': 'GST',
    'corporate law': 'MCA',
    'company law': 'MCA',
}

def clean_html(raw_html):
    soup = BeautifulSoup(raw_html, "html.parser")
    return soup.get_text(separator=" ", strip=True)

def fetch_rss_items():
    print("Fetching TaxGuru RSS feed...")
    req = urllib.request.Request(RSS_URL, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            xml_data = response.read()
    except Exception as e:
        print(f"Failed to fetch RSS: {e}")
        return []

    root = ET.fromstring(xml_data)
    items = []
    
    for item in root.findall('./channel/item'):
        title = item.find('title').text
        link = item.find('link').text
        pubDate = item.find('pubDate').text
        description = item.find('description').text
        
        # Get categories
        categories = [c.text.lower() for c in item.findall('category')]
        
        # Determine our pillar
        mapped_cat = None
        for cat in categories:
            for key, val in CATEGORY_MAP.items():
                if key in cat:
                    mapped_cat = val
                    break
            if mapped_cat:
                break
                
        if not mapped_cat:
            continue # Skip non-relevant news
            
        items.append({
            'title': title,
            'link': link,
            'pubDate': pubDate,
            'description': clean_html(description),
            'category': mapped_cat
        })
        
        if len(items) >= MAX_ITEMS_TOTAL:
            break
            
    return items

def extract_official_pdf_link(article_url):
    """Scrapes the TaxGuru article to find the official PDF/government link"""
    try:
        req = urllib.request.Request(article_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read()
            soup = BeautifulSoup(html, "html.parser")
            
            # Look for links that point to gov.in or end with .pdf
            for a in soup.find_all('a', href=True):
                href = a['href'].lower()
                if '.pdf' in href or 'gov.in' in href:
                    # Ignore generic links to homepages
                    if href.count('/') > 3: 
                        return a['href']
                        
    except Exception as e:
        print(f"Error extracting PDF from {article_url}: {e}")
    
    return article_url # Fallback to TaxGuru link if no PDF found

def generate_insights_with_gemini(items):
    if not GEMINI_API_KEY:
        print("Error: GEMINI_API_KEY not found in environment.")
        return []

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.5-flash')

    prompt = """
    You are a compliance assistant for a financial dashboard.
    I will provide you with a JSON array of recent tax news items fetched from an RSS feed.
    For each item, write a professional, concise 2-3 sentence summary based on the provided description and title. 
    Do not invent facts. 
    Estimate the impact as 'High', 'Medium', or 'Low'.
    Format the date as "DD MMM YYYY" (e.g., "15 May 2026").
    
    Output exactly a valid JSON array of objects with these exact keys:
    [
      {
        "date": "...",
        "category": "...",
        "title": "...",
        "summary": "...",
        "link": "...",
        "impact": "..."
      }
    ]
    
    Here are the items:
    """
    
    # We pass the items with their already-extracted official links
    prompt += json.dumps(items, indent=2)

    try:
        response = model.generate_content(prompt)
        content = response.text
        # Strip markdown json blocks
        if content.startswith("```json"):
            content = content[7:-3]
        elif content.startswith("```"):
            content = content[3:-3]
        
        return json.loads(content.strip())
    except Exception as e:
        print(f"Failed to generate insights via Gemini: {e}")
        return []

def run():
    print("Starting real RSS extraction...")
    
    items = fetch_rss_items()
    print(f"Found {len(items)} relevant RSS items.")
    
    # Extract official links for each item
    for item in items:
        print(f"Extracting official link for: {item['title'][:50]}...")
        official_link = extract_official_pdf_link(item['link'])
        item['link'] = official_link # Replace with official link
        
    print("Generating summaries via Gemini...")
    final_data = generate_insights_with_gemini(items)
    
    if not final_data:
        print("No data generated. Exiting.")
        return

    output_path = os.path.join(os.path.dirname(__file__), 'insights.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, indent=2)
        
    print(f"Successfully generated {len(final_data)} real compliance updates.")

if __name__ == "__main__":
    run()

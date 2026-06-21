import urllib.request
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup

def extract_pdf(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            soup = BeautifulSoup(response.read(), "html.parser")
            for a in soup.find_all('a', href=True):
                href = a['href'].lower()
                if '.pdf' in href or 'gov.in' in href:
                    if href.count('/') > 3:
                        return a['href']
    except Exception as e:
        pass
    return url

req = urllib.request.Request("https://taxguru.in/feed/", headers={'User-Agent': 'Mozilla/5.0'})
xml_data = urllib.request.urlopen(req).read()
root = ET.fromstring(xml_data)

print("Fetching latest updates and their official links...")
count = 0
for item in root.findall('./channel/item'):
    if count >= 3: break
    title = item.find('title').text
    link = item.find('link').text
    pdf_link = extract_pdf(link)
    print(f"\nTitle: {title}")
    print(f"Taxguru Link: {link}")
    print(f"Extracted Official Link: {pdf_link}")
    count += 1

from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        print("Loading Income Tax...")
        try:
            page.goto("https://incometaxindia.gov.in/Pages/communications/notifications.aspx", timeout=30000)
            page.wait_for_load_state("networkidle")
            print("Title:", page.title())
            page.screenshot(path="incometax_test.png")
        except Exception as e:
            print("Error loading Income Tax:", e)

        print("\nLoading GST...")
        try:
            page.goto("https://www.cbic-gst.gov.in/central-tax-notifications.html", timeout=30000)
            page.wait_for_load_state("networkidle")
            print("Title:", page.title())
            page.screenshot(path="gst_test.png")
        except Exception as e:
            print("Error loading GST:", e)

        browser.close()

if __name__ == "__main__":
    run()

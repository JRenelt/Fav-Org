import requests
import sys
import json
import io
from datetime import datetime

class FavLinkBackendTester:
    def __init__(self, base_url="https://link-organizer-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {}
        
        if not files:
            headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}...")

            return success, response.json() if response.text and response.status_code < 500 else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def create_sample_html_file(self):
        """Create a sample HTML bookmarks file for testing"""
        html_content = """<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks Menu</H1>

<DL><p>
    <DT><H3>Development</H3>
    <DL><p>
        <DT><A HREF="https://github.com/">GitHub</A>
        <DT><A HREF="https://stackoverflow.com/">Stack Overflow</A>
    </DL><p>
    
    <DT><H3>News</H3>
    <DL><p>
        <DT><A HREF="https://news.ycombinator.com/">Hacker News</A>
        <DT><A HREF="https://www.reddit.com/">Reddit</A>
    </DL><p>
    
    <DT><H3>Tools</H3>
    <DL><p>
        <DT><A HREF="https://www.google.com/">Google</A>
        <DT><A HREF="https://www.wikipedia.org/">Wikipedia</A>
    </DL><p>
</DL><p>"""
        return html_content

    def create_sample_json_file(self):
        """Create a sample JSON bookmarks file for testing"""
        json_content = {
            "children": [
                {
                    "name": "Social Media",
                    "children": [
                        {"name": "Twitter", "url": "https://twitter.com/"},
                        {"name": "LinkedIn", "url": "https://linkedin.com/"}
                    ]
                },
                {
                    "name": "Entertainment", 
                    "children": [
                        {"name": "YouTube", "url": "https://youtube.com/"},
                        {"name": "Netflix", "url": "https://netflix.com/"}
                    ]
                }
            ]
        }
        return json.dumps(json_content)

    def test_import_html_bookmarks(self):
        """Test HTML bookmarks import"""
        html_content = self.create_sample_html_file()
        files = {'file': ('bookmarks.html', html_content, 'text/html')}
        
        success, response = self.run_test(
            "Import HTML Bookmarks",
            "POST",
            "bookmarks/import",
            200,
            files=files
        )
        return success, response

    def test_import_json_bookmarks(self):
        """Test JSON bookmarks import"""
        json_content = self.create_sample_json_file()
        files = {'file': ('bookmarks.json', json_content, 'application/json')}
        
        success, response = self.run_test(
            "Import JSON Bookmarks", 
            "POST",
            "bookmarks/import",
            200,
            files=files
        )
        return success, response

    def test_get_all_bookmarks(self):
        """Test getting all bookmarks"""
        success, response = self.run_test(
            "Get All Bookmarks",
            "GET", 
            "bookmarks",
            200
        )
        return success, response

    def test_get_categories(self):
        """Test getting all categories"""
        success, response = self.run_test(
            "Get All Categories",
            "GET",
            "categories", 
            200
        )
        return success, response

    def test_get_bookmarks_by_category(self, category="Development"):
        """Test getting bookmarks by category"""
        success, response = self.run_test(
            f"Get Bookmarks by Category ({category})",
            "GET",
            f"bookmarks/category/{category}",
            200
        )
        return success, response

    def test_search_bookmarks(self, query="GitHub"):
        """Test bookmark search functionality"""
        success, response = self.run_test(
            f"Search Bookmarks ({query})",
            "GET",
            f"bookmarks/search/{query}",
            200
        )
        return success, response

    def test_validate_links(self):
        """Test link validation (dead link check)"""
        success, response = self.run_test(
            "Validate Links (Dead Link Check)",
            "POST",
            "bookmarks/validate",
            200
        )
        return success, response

    def test_remove_duplicates(self):
        """Test duplicate removal"""
        success, response = self.run_test(
            "Remove Duplicates",
            "POST", 
            "bookmarks/remove-duplicates",
            200
        )
        return success, response

    def test_create_single_bookmark(self):
        """Test creating a single bookmark"""
        bookmark_data = {
            "title": "Test Bookmark",
            "url": "https://example.com/test",
            "category": "Testing"
        }
        
        success, response = self.run_test(
            "Create Single Bookmark",
            "POST",
            "bookmarks",
            200,
            data=bookmark_data
        )
        return success, response

    def test_delete_single_bookmark(self, bookmark_id):
        """Test deleting a single bookmark"""
        success, response = self.run_test(
            f"Delete Single Bookmark ({bookmark_id})",
            "DELETE",
            f"bookmarks/{bookmark_id}",
            200
        )
        return success, response

    def test_delete_all_bookmarks(self):
        """Test deleting all bookmarks"""
        success, response = self.run_test(
            "Delete All Bookmarks",
            "DELETE",
            "bookmarks/all",
            200
        )
        return success, response

    def test_update_bookmark(self, bookmark_id, update_data):
        """Test updating a bookmark"""
        success, response = self.run_test(
            f"Update Bookmark ({bookmark_id})",
            "PUT",
            f"bookmarks/{bookmark_id}",
            200,
            data=update_data
        )
        return success, response

    def test_move_bookmarks(self, bookmark_ids, target_category, target_subcategory=None):
        """Test moving bookmarks to different category"""
        move_data = {
            "bookmark_ids": bookmark_ids,
            "target_category": target_category,
            "target_subcategory": target_subcategory
        }
        
        success, response = self.run_test(
            f"Move Bookmarks to {target_category}",
            "POST",
            "bookmarks/move",
            200,
            data=move_data
        )
        return success, response

    def test_export_xml(self, category=None):
        """Test XML export functionality"""
        export_data = {"format": "xml"}
        if category:
            export_data["category"] = category
            
        success, response = self.run_test(
            f"Export XML{' (Category: ' + category + ')' if category else ''}",
            "POST",
            "export",
            200,
            data=export_data
        )
        return success, response

    def test_export_csv(self, category=None):
        """Test CSV export functionality"""
        export_data = {"format": "csv"}
        if category:
            export_data["category"] = category
            
        success, response = self.run_test(
            f"Export CSV{' (Category: ' + category + ')' if category else ''}",
            "POST",
            "export",
            200,
            data=export_data
        )
        return success, response

    def test_get_statistics(self):
        """Test statistics endpoint"""
        success, response = self.run_test(
            "Get Statistics",
            "GET",
            "statistics",
            200
        )
        return success, response

    def test_download_collector_zip(self):
        """Test downloading collector scripts as ZIP"""
        success, response = self.run_test(
            "Download Collector ZIP",
            "GET",
            "download/collector",
            200
        )
        return success, response

    def test_create_sample_bookmarks(self):
        """Test creating sample bookmarks"""
        success, response = self.run_test(
            "Create Sample Bookmarks",
            "POST",
            "bookmarks/create-samples",
            200
        )
        return success, response

def main():
    print("🚀 Starting FavLink Manager Backend API Tests")
    print("=" * 60)
    
    tester = FavLinkBackendTester()
    
    # Test sequence
    print("\n📋 Phase 1: Basic API Connectivity")
    tester.test_get_all_bookmarks()
    tester.test_get_categories()
    
    print("\n📋 Phase 2: Import Functionality")
    html_success, html_response = tester.test_import_html_bookmarks()
    json_success, json_response = tester.test_import_json_bookmarks()
    
    print("\n📋 Phase 3: Data Retrieval")
    tester.test_get_all_bookmarks()
    tester.test_get_categories()
    tester.test_get_bookmarks_by_category("Development")
    tester.test_get_bookmarks_by_category("Social Media")
    
    print("\n📋 Phase 4: Search Functionality")
    tester.test_search_bookmarks("GitHub")
    tester.test_search_bookmarks("Twitter")
    
    print("\n📋 Phase 5: Single Bookmark Operations")
    create_success, create_response = tester.test_create_single_bookmark()
    
    # If bookmark was created successfully, try to delete it
    if create_success and 'id' in create_response:
        bookmark_id = create_response['id']
        tester.test_delete_single_bookmark(bookmark_id)
    
    print("\n📋 Phase 6: Advanced Features")
    tester.test_validate_links()
    tester.test_remove_duplicates()
    
    print("\n📋 Phase 7: Cleanup (Optional)")
    # Uncomment the line below if you want to test delete all functionality
    # tester.test_delete_all_bookmarks()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! Backend API is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
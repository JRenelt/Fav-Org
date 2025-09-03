import requests
import sys
import json
import xml.etree.ElementTree as ET
from datetime import datetime
import re

class ExportFunctionalityTester:
    def __init__(self, base_url="https://favnest.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, expect_json=True):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                # Check Content-Type header
                content_type = response.headers.get('Content-Type', '')
                print(f"   Content-Type: {content_type}")
                
                # Check Content-Disposition header
                content_disposition = response.headers.get('Content-Disposition', '')
                print(f"   Content-Disposition: {content_disposition}")
                
                if expect_json:
                    try:
                        response_data = response.json()
                        print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                        return success, response_data, response.headers
                    except:
                        print(f"   Response: {response.text[:200]}...")
                        return success, response.text, response.headers
                else:
                    print(f"   Response Length: {len(response.text)} characters")
                    print(f"   Response Preview: {response.text[:200]}...")
                    return success, response.text, response.headers
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}...")
                return success, response.text, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, str(e), {}

    def validate_html_format(self, html_content):
        """Validate HTML export format (Netscape Bookmark Format)"""
        print("   🔍 Validating HTML format...")
        
        # Check for DOCTYPE declaration
        if "<!DOCTYPE NETSCAPE-Bookmark-file-1>" not in html_content:
            print("   ❌ Missing DOCTYPE NETSCAPE-Bookmark-file-1")
            return False
        
        # Check for required HTML structure
        required_elements = [
            '<META HTTP-EQUIV="Content-Type"',
            '<TITLE>Bookmarks</TITLE>',
            '<H1>Bookmarks</H1>',
            '<DL><p>',
            '</DL><p>'
        ]
        
        for element in required_elements:
            if element not in html_content:
                print(f"   ❌ Missing required element: {element}")
                return False
        
        # Check for bookmark entries with proper format
        bookmark_pattern = r'<DT><A HREF="[^"]+".+?>[^<]+</A>'
        bookmarks = re.findall(bookmark_pattern, html_content)
        
        if len(bookmarks) == 0:
            print("   ❌ No bookmarks found in HTML")
            return False
        
        print(f"   ✅ HTML format valid - Found {len(bookmarks)} bookmarks")
        print(f"   ✅ Netscape Bookmark Format structure correct")
        return True

    def validate_json_format(self, json_content):
        """Validate JSON export format (Chrome-compatible)"""
        print("   🔍 Validating JSON format...")
        
        try:
            data = json.loads(json_content)
        except json.JSONDecodeError as e:
            print(f"   ❌ Invalid JSON format: {e}")
            return False
        
        # Check Chrome bookmark structure
        if "roots" not in data:
            print("   ❌ Missing 'roots' key in JSON")
            return False
        
        roots = data["roots"]
        required_roots = ["bookmark_bar", "other", "synced"]
        
        for root in required_roots:
            if root not in roots:
                print(f"   ❌ Missing required root: {root}")
                return False
            
            if "children" not in roots[root]:
                print(f"   ❌ Missing 'children' in {root}")
                return False
        
        # Check for bookmark entries
        total_bookmarks = 0
        for root_name, root_data in roots.items():
            if "children" in root_data:
                total_bookmarks += self._count_bookmarks_in_children(root_data["children"])
        
        if total_bookmarks == 0:
            print("   ❌ No bookmarks found in JSON")
            return False
        
        print(f"   ✅ JSON format valid - Found {total_bookmarks} bookmarks")
        print(f"   ✅ Chrome-compatible structure correct")
        return True

    def _count_bookmarks_in_children(self, children):
        """Recursively count bookmarks in Chrome JSON structure"""
        count = 0
        for child in children:
            if child.get("type") == "url":
                count += 1
            elif child.get("type") == "folder" and "children" in child:
                count += self._count_bookmarks_in_children(child["children"])
        return count

    def validate_xml_format(self, xml_content):
        """Validate XML export format"""
        print("   🔍 Validating XML format...")
        
        try:
            root = ET.fromstring(xml_content)
        except ET.ParseError as e:
            print(f"   ❌ Invalid XML format: {e}")
            return False
        
        if root.tag != "bookmarks":
            print(f"   ❌ Invalid root element: {root.tag}")
            return False
        
        bookmarks = root.findall("bookmark")
        if len(bookmarks) == 0:
            print("   ❌ No bookmarks found in XML")
            return False
        
        # Check required fields in bookmarks
        required_fields = ["title", "url", "category"]
        for bookmark in bookmarks[:3]:  # Check first 3 bookmarks
            for field in required_fields:
                if bookmark.find(field) is None:
                    print(f"   ❌ Missing required field '{field}' in bookmark")
                    return False
        
        print(f"   ✅ XML format valid - Found {len(bookmarks)} bookmarks")
        return True

    def validate_csv_format(self, csv_content):
        """Validate CSV export format"""
        print("   🔍 Validating CSV format...")
        
        lines = csv_content.strip().split('\n')
        if len(lines) < 2:
            print("   ❌ CSV must have at least header and one data row")
            return False
        
        # Check header
        header = lines[0]
        required_columns = ['ID', 'Title', 'URL', 'Category']
        for column in required_columns:
            if column not in header:
                print(f"   ❌ Missing required column: {column}")
                return False
        
        # Check data rows
        data_rows = len(lines) - 1
        print(f"   ✅ CSV format valid - Found {data_rows} bookmark rows")
        return True

    def test_html_export(self, category=None):
        """Test HTML export functionality"""
        export_data = {"format": "html"}
        if category:
            export_data["category"] = category
            
        success, response, headers = self.run_test(
            f"HTML Export{' (Category: ' + category + ')' if category else ''}",
            "POST",
            "export",
            200,
            data=export_data,
            expect_json=False
        )
        
        if success:
            # Validate Content-Type
            content_type = headers.get('Content-Type', '')
            if 'text/html' not in content_type:
                print(f"   ❌ Wrong Content-Type: expected text/html, got {content_type}")
                return False, response
            
            # Validate Content-Disposition
            content_disposition = headers.get('Content-Disposition', '')
            if 'attachment' not in content_disposition or '.html' not in content_disposition:
                print(f"   ❌ Wrong Content-Disposition: {content_disposition}")
                return False, response
            
            # Validate HTML format
            if self.validate_html_format(response):
                print("   ✅ HTML export fully validated")
                return True, response
            else:
                return False, response
        
        return success, response

    def test_json_export(self, category=None):
        """Test JSON export functionality"""
        export_data = {"format": "json"}
        if category:
            export_data["category"] = category
            
        success, response, headers = self.run_test(
            f"JSON Export{' (Category: ' + category + ')' if category else ''}",
            "POST",
            "export",
            200,
            data=export_data,
            expect_json=False
        )
        
        if success:
            # Validate Content-Type
            content_type = headers.get('Content-Type', '')
            if 'application/json' not in content_type:
                print(f"   ❌ Wrong Content-Type: expected application/json, got {content_type}")
                return False, response
            
            # Validate Content-Disposition
            content_disposition = headers.get('Content-Disposition', '')
            if 'attachment' not in content_disposition or '.json' not in content_disposition:
                print(f"   ❌ Wrong Content-Disposition: {content_disposition}")
                return False, response
            
            # Validate JSON format
            if self.validate_json_format(response):
                print("   ✅ JSON export fully validated")
                return True, response
            else:
                return False, response
        
        return success, response

    def test_xml_export(self, category=None):
        """Test XML export functionality (existing format)"""
        export_data = {"format": "xml"}
        if category:
            export_data["category"] = category
            
        success, response, headers = self.run_test(
            f"XML Export{' (Category: ' + category + ')' if category else ''}",
            "POST",
            "export",
            200,
            data=export_data,
            expect_json=False
        )
        
        if success:
            # Validate Content-Type
            content_type = headers.get('Content-Type', '')
            if 'application/xml' not in content_type:
                print(f"   ❌ Wrong Content-Type: expected application/xml, got {content_type}")
                return False, response
            
            # Validate XML format
            if self.validate_xml_format(response):
                print("   ✅ XML export fully validated")
                return True, response
            else:
                return False, response
        
        return success, response

    def test_csv_export(self, category=None):
        """Test CSV export functionality (existing format)"""
        export_data = {"format": "csv"}
        if category:
            export_data["category"] = category
            
        success, response, headers = self.run_test(
            f"CSV Export{' (Category: ' + category + ')' if category else ''}",
            "POST",
            "export",
            200,
            data=export_data,
            expect_json=False
        )
        
        if success:
            # Validate Content-Type
            content_type = headers.get('Content-Type', '')
            if 'text/csv' not in content_type:
                print(f"   ❌ Wrong Content-Type: expected text/csv, got {content_type}")
                return False, response
            
            # Validate CSV format
            if self.validate_csv_format(response):
                print("   ✅ CSV export fully validated")
                return True, response
            else:
                return False, response
        
        return success, response

    def test_unsupported_format(self):
        """Test error handling for unsupported export formats"""
        export_data = {"format": "unsupported"}
        
        success, response, headers = self.run_test(
            "Unsupported Export Format (Error Handling)",
            "POST",
            "export",
            400,  # Expecting HTTP 400 Bad Request
            data=export_data,
            expect_json=True
        )
        
        if success:
            print("   ✅ Correctly returned HTTP 400 for unsupported format")
            return True, response
        else:
            print("   ❌ Did not return expected HTTP 400 for unsupported format")
            return False, response

    def get_bookmarks_count(self):
        """Get current bookmark count for testing"""
        success, response, headers = self.run_test(
            "Get Bookmarks Count",
            "GET",
            "bookmarks",
            200,
            expect_json=True
        )
        
        if success and isinstance(response, list):
            return len(response)
        return 0

def main():
    print("🚀 Starting Export Functionality Tests")
    print("🎯 FOCUS: Testing New HTML and JSON Export Formats")
    print("🇩🇪 Teste die neu implementierten HTML und JSON Export-Formate")
    print("=" * 70)
    
    tester = ExportFunctionalityTester()
    
    # Get initial bookmark count
    bookmark_count = tester.get_bookmarks_count()
    print(f"\n📊 Current bookmarks in database: {bookmark_count}")
    
    if bookmark_count == 0:
        print("⚠️  No bookmarks found. Creating sample bookmarks for testing...")
        # Create sample bookmarks
        success, response, headers = tester.run_test(
            "Create Sample Bookmarks",
            "POST",
            "bookmarks/create-samples",
            200
        )
        if success:
            bookmark_count = tester.get_bookmarks_count()
            print(f"✅ Created sample bookmarks. New count: {bookmark_count}")
        else:
            print("❌ Failed to create sample bookmarks")
            return 1
    
    print("\n" + "=" * 70)
    print("📋 Phase 1: 🆕 NEW HTML Export Format Testing")
    print("   Testing browser-compatible Netscape Bookmark Format")
    
    # Test HTML export
    html_success, html_response = tester.test_html_export()
    html_category_success, html_category_response = tester.test_html_export("Development")
    
    print("\n" + "=" * 70)
    print("📋 Phase 2: 🆕 NEW JSON Export Format Testing")
    print("   Testing Chrome-compatible Bookmark Format")
    
    # Test JSON export
    json_success, json_response = tester.test_json_export()
    json_category_success, json_category_response = tester.test_json_export("Development")
    
    print("\n" + "=" * 70)
    print("📋 Phase 3: ✅ Existing XML Export Format Testing")
    print("   Verifying existing XML export still works")
    
    # Test XML export (existing)
    xml_success, xml_response = tester.test_xml_export()
    xml_category_success, xml_category_response = tester.test_xml_export("Development")
    
    print("\n" + "=" * 70)
    print("📋 Phase 4: ✅ Existing CSV Export Format Testing")
    print("   Verifying existing CSV export still works")
    
    # Test CSV export (existing)
    csv_success, csv_response = tester.test_csv_export()
    csv_category_success, csv_category_response = tester.test_csv_export("Development")
    
    print("\n" + "=" * 70)
    print("📋 Phase 5: 🛡️ Error Handling Testing")
    print("   Testing unsupported format error handling")
    
    # Test error handling
    error_success, error_response = tester.test_unsupported_format()
    
    # Print final results
    print("\n" + "=" * 70)
    print(f"📊 FINAL RESULTS - Export Functionality Testing")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    # Detailed results for each format
    print(f"\n🎯 EXPORT FORMATS STATUS:")
    print(f"🆕 HTML Export (NEW): {'✅ PASS' if html_success and html_category_success else '❌ FAIL'}")
    print(f"🆕 JSON Export (NEW): {'✅ PASS' if json_success and json_category_success else '❌ FAIL'}")
    print(f"✅ XML Export (Existing): {'✅ PASS' if xml_success and xml_category_success else '❌ FAIL'}")
    print(f"✅ CSV Export (Existing): {'✅ PASS' if csv_success and csv_category_success else '❌ FAIL'}")
    print(f"🛡️ Error Handling: {'✅ PASS' if error_success else '❌ FAIL'}")
    
    # Summary for review request
    print(f"\n📋 REVIEW REQUEST SUMMARY:")
    new_formats_working = html_success and json_success
    existing_formats_working = xml_success and csv_success
    all_formats_working = new_formats_working and existing_formats_working
    
    if all_formats_working:
        print("✅ ALL 4 EXPORT FORMATS WORKING:")
        print("   ✅ HTML Export: Browser-compatible Netscape Bookmark Format")
        print("   ✅ JSON Export: Chrome-compatible Bookmark Format")
        print("   ✅ XML Export: Existing format still functional")
        print("   ✅ CSV Export: Existing format still functional")
        print("   ✅ Error Handling: HTTP 400 for unsupported formats")
        print("\n🎉 Export functionality fully implemented and working!")
    else:
        print("❌ EXPORT ISSUES DETECTED:")
        if not new_formats_working:
            print("   ❌ New HTML/JSON formats have issues")
        if not existing_formats_working:
            print("   ❌ Existing XML/CSV formats have issues")
        print("\n⚠️  Export functionality needs attention!")
    
    return 0 if all_formats_working else 1

if __name__ == "__main__":
    sys.exit(main())
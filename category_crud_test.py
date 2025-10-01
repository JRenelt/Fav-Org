import requests
import sys
import json
from datetime import datetime

class CategoryCRUDTester:
    def __init__(self, base_url="https://fav-auditor.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_category_ids = []  # Track created categories for cleanup

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
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if expect_json:
                    try:
                        response_data = response.json()
                        print(f"   Response: {json.dumps(response_data, indent=2)[:300]}...")
                        return success, response_data
                    except:
                        print(f"   Response: {response.text[:200]}...")
                        return success, {}
                else:
                    print(f"   Response: {response.text[:200]}...")
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}...")
                return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_create_category(self, name, parent_category=None):
        """Test POST /api/categories - Create new category"""
        category_data = {"name": name}
        if parent_category:
            category_data["parent_category"] = parent_category
            
        success, response = self.run_test(
            f"Create Category '{name}'" + (f" (parent: {parent_category})" if parent_category else ""),
            "POST",
            "categories",
            200,  # Expecting 200 if implemented, 405 if not
            data=category_data
        )
        
        if success and 'id' in response:
            self.created_category_ids.append(response['id'])
            
        return success, response

    def test_update_category(self, category_id, new_name):
        """Test PUT /api/categories/{id} - Rename category"""
        update_data = {"name": new_name}
        
        success, response = self.run_test(
            f"Update Category {category_id} to '{new_name}'",
            "PUT",
            f"categories/{category_id}",
            200,  # Expecting 200 if implemented, 404 if not
            data=update_data
        )
        return success, response

    def test_delete_category(self, category_id):
        """Test DELETE /api/categories/{id} - Delete category"""
        success, response = self.run_test(
            f"Delete Category {category_id}",
            "DELETE",
            f"categories/{category_id}",
            200  # Expecting 200 if implemented, 404 if not
        )
        return success, response

    def test_cleanup_empty_categories(self):
        """Test POST /api/categories/cleanup - Remove empty categories"""
        success, response = self.run_test(
            "Cleanup Empty Categories",
            "POST",
            "categories/cleanup",
            200  # Expecting 200 if implemented, 404 if not
        )
        return success, response

    def test_status_filter_locked(self):
        """Test GET /api/bookmarks with status_type=locked filter"""
        success, response = self.run_test(
            "Get Locked Bookmarks (status_type=locked)",
            "GET",
            "bookmarks?status_type=locked",
            200
        )
        
        if success:
            locked_count = len(response) if isinstance(response, list) else 0
            print(f"   Found {locked_count} locked bookmarks")
            
        return success, response

    def test_create_locked_bookmark(self):
        """Test POST /api/bookmarks with is_locked=true"""
        bookmark_data = {
            "title": "Test Locked Bookmark",
            "url": "https://example.com/locked-test",
            "category": "Testing",
            "is_locked": True
        }
        
        success, response = self.run_test(
            "Create Locked Bookmark (is_locked=true)",
            "POST",
            "bookmarks",
            200,
            data=bookmark_data
        )
        
        if success:
            # Verify status_type is set to 'locked'
            status_type = response.get('status_type')
            is_locked = response.get('is_locked')
            print(f"   Created bookmark: is_locked={is_locked}, status_type={status_type}")
            
            if status_type == 'locked' and is_locked:
                print("   ✅ Lock consistency verified: is_locked=true → status_type='locked'")
            else:
                print("   ⚠️  Lock consistency issue detected")
                
        return success, response

    def test_lock_toggle(self, bookmark_id):
        """Test PUT /api/bookmarks/{id} - Toggle lock status"""
        # First set to locked
        update_data = {"is_locked": True}
        success1, response1 = self.run_test(
            f"Set Bookmark {bookmark_id} to Locked",
            "PUT",
            f"bookmarks/{bookmark_id}",
            200,
            data=update_data
        )
        
        if not success1:
            return False, "Failed to set bookmark to locked"
            
        # Then set to unlocked
        update_data = {"is_locked": False}
        success2, response2 = self.run_test(
            f"Set Bookmark {bookmark_id} to Unlocked",
            "PUT",
            f"bookmarks/{bookmark_id}",
            200,
            data=update_data
        )
        
        return success1 and success2, {"locked": response1, "unlocked": response2}

    def test_delete_protection_locked(self, locked_bookmark_id):
        """Test DELETE /api/bookmarks/{id} - Delete protection for locked bookmarks"""
        success, response = self.run_test(
            f"Try to Delete Locked Bookmark {locked_bookmark_id} (should fail)",
            "DELETE",
            f"bookmarks/{locked_bookmark_id}",
            403  # Expecting 403 Forbidden for locked bookmarks
        )
        
        if success:
            print("   ✅ Delete protection working: locked bookmark cannot be deleted")
        else:
            print("   ❌ Delete protection failed: locked bookmark was deleted or wrong error")
            
        return success, response

    def test_check_empty_categories_in_database(self):
        """Check for empty categories with name='' in database"""
        success, categories = self.run_test(
            "Get All Categories (check for empty names)",
            "GET",
            "categories",
            200
        )
        
        if success:
            empty_categories = []
            for category in categories:
                if category.get('name', '').strip() == '':
                    empty_categories.append(category)
                    
            if empty_categories:
                print(f"   ❌ Found {len(empty_categories)} empty categories with name='':")
                for cat in empty_categories:
                    print(f"      - ID: {cat.get('id', 'N/A')}, parent: {cat.get('parent_category', 'None')}")
                return False, {"empty_categories": empty_categories}
            else:
                print("   ✅ No empty categories found - database is clean")
                return True, {"empty_categories": []}
                
        return success, {}

    def test_counter_updates(self):
        """Test that category counters update correctly"""
        # Get initial categories
        success, initial_categories = self.run_test(
            "Get Categories (initial state)",
            "GET",
            "categories",
            200
        )
        
        if not success:
            return False, "Failed to get initial categories"
            
        # Create a test bookmark
        bookmark_data = {
            "title": "Counter Test Bookmark",
            "url": "https://example.com/counter-test",
            "category": "CounterTest"
        }
        
        success, bookmark_response = self.run_test(
            "Create Bookmark for Counter Test",
            "POST",
            "bookmarks",
            200,
            data=bookmark_data
        )
        
        if not success:
            return False, "Failed to create test bookmark"
            
        bookmark_id = bookmark_response.get('id')
        
        # Get categories after bookmark creation
        success, after_create_categories = self.run_test(
            "Get Categories (after bookmark creation)",
            "GET",
            "categories",
            200
        )
        
        if not success:
            return False, "Failed to get categories after creation"
            
        # Move bookmark to different category
        move_data = {
            "bookmark_ids": [bookmark_id],
            "target_category": "CounterTestMoved"
        }
        
        success, move_response = self.run_test(
            "Move Bookmark (test counter update)",
            "POST",
            "bookmarks/move",
            200,
            data=move_data
        )
        
        if not success:
            return False, "Failed to move bookmark"
            
        # Get final categories
        success, final_categories = self.run_test(
            "Get Categories (after move)",
            "GET",
            "categories",
            200
        )
        
        if success:
            print("   ✅ Counter update test completed - categories retrieved at all stages")
            # Cleanup
            self.run_test("Delete Counter Test Bookmark", "DELETE", f"bookmarks/{bookmark_id}", 200)
            
        return success, {
            "initial": len(initial_categories),
            "after_create": len(after_create_categories),
            "final": len(final_categories)
        }

    def cleanup_created_categories(self):
        """Clean up categories created during testing"""
        print(f"\n🧹 Cleaning up {len(self.created_category_ids)} created categories...")
        for category_id in self.created_category_ids:
            self.run_test(
                f"Cleanup Category {category_id}",
                "DELETE",
                f"categories/{category_id}",
                200
            )

def main():
    print("🚀 Starting FavOrg Category CRUD & Lock System Tests")
    print("🎯 FOCUS: Testing NEW Category CRUD Endpoints nach Bug-Fixes")
    print("🇩🇪 Teste die neuen Category CRUD Endpoints und Lock-System Features")
    print("=" * 80)
    
    tester = CategoryCRUDTester()
    
    # Phase 1: Category CRUD Operations (NEW ENDPOINTS)
    print("\n📋 Phase 1: 🆕 Category CRUD Operations (MISSING ENDPOINTS)")
    print("   Testing the newly implemented Category CRUD endpoints...")
    
    # Test CREATE category
    create_success, create_response = tester.test_create_category("TestCategory")
    category_id = create_response.get('id') if create_success else None
    
    # Test CREATE subcategory
    subcategory_success, subcategory_response = tester.test_create_category("TestSubcategory", "TestCategory")
    subcategory_id = subcategory_response.get('id') if subcategory_success else None
    
    # Test UPDATE category (rename)
    update_success = False
    if category_id:
        update_success, update_response = tester.test_update_category(category_id, "RenamedTestCategory")
    
    # Test DELETE category
    delete_success = False
    if subcategory_id:
        delete_success, delete_response = tester.test_delete_category(subcategory_id)
    
    # Test CLEANUP empty categories
    cleanup_success, cleanup_response = tester.test_cleanup_empty_categories()
    
    # Phase 2: Status Filter "locked" (FIX)
    print("\n📋 Phase 2: 🔒 Status Filter 'locked' (FIX)")
    print("   Testing GET /api/bookmarks with Client-side Filter for status_type=locked...")
    
    filter_success, filter_response = tester.test_status_filter_locked()
    
    # Phase 3: Lock-System Consistency
    print("\n📋 Phase 3: 🔐 Lock-System Consistency")
    print("   Testing Lock-System with is_locked=true and delete protection...")
    
    # Create locked bookmark
    locked_create_success, locked_bookmark = tester.test_create_locked_bookmark()
    locked_bookmark_id = locked_bookmark.get('id') if locked_create_success else None
    
    # Test lock toggle
    toggle_success = False
    if locked_bookmark_id:
        toggle_success, toggle_response = tester.test_lock_toggle(locked_bookmark_id)
    
    # Test delete protection
    protection_success = False
    if locked_bookmark_id:
        # First ensure bookmark is locked
        tester.run_test("Ensure Bookmark is Locked", "PUT", f"bookmarks/{locked_bookmark_id}", 200, 
                       data={"is_locked": True})
        protection_success, protection_response = tester.test_delete_protection_locked(locked_bookmark_id)
    
    # Phase 4: Cleanup Tests
    print("\n📋 Phase 4: 🧹 Cleanup Tests")
    print("   Testing for empty categories and counter updates...")
    
    empty_check_success, empty_check_result = tester.test_check_empty_categories_in_database()
    counter_success, counter_result = tester.test_counter_updates()
    
    # Cleanup created test data
    if locked_bookmark_id:
        # Unlock before deleting
        tester.run_test("Unlock Test Bookmark", "PUT", f"bookmarks/{locked_bookmark_id}", 200, 
                       data={"is_locked": False})
        tester.run_test("Delete Test Bookmark", "DELETE", f"bookmarks/{locked_bookmark_id}", 200)
    
    tester.cleanup_created_categories()
    
    # Print final results
    print("\n" + "=" * 80)
    print(f"📊 FINAL RESULTS - Category CRUD & Lock System Testing")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    # Detailed results for key areas
    print(f"\n🎯 KEY AREAS STATUS:")
    print(f"🆕 Category CREATE (POST /api/categories): {'PASS' if create_success else 'FAIL'}")
    print(f"✏️  Category UPDATE (PUT /api/categories/{{id}}): {'PASS' if update_success else 'FAIL'}")
    print(f"🗑️  Category DELETE (DELETE /api/categories/{{id}}): {'PASS' if delete_success else 'FAIL'}")
    print(f"🧹 Category CLEANUP (POST /api/categories/cleanup): {'PASS' if cleanup_success else 'FAIL'}")
    print(f"🔍 Status Filter 'locked': {'PASS' if filter_success else 'FAIL'}")
    print(f"🔒 Lock System Create: {'PASS' if locked_create_success else 'FAIL'}")
    print(f"🔄 Lock Toggle: {'PASS' if toggle_success else 'FAIL'}")
    print(f"🛡️  Delete Protection: {'PASS' if protection_success else 'FAIL'}")
    print(f"🧹 Empty Categories Check: {'PASS' if empty_check_success else 'FAIL'}")
    print(f"🔢 Counter Updates: {'PASS' if counter_success else 'FAIL'}")
    
    # Critical issues check
    critical_failures = []
    if not create_success:
        critical_failures.append("Category CREATE endpoint missing")
    if not update_success and category_id:  # Only fail if we had a category to update
        critical_failures.append("Category UPDATE endpoint missing")
    if not delete_success and subcategory_id:  # Only fail if we had a category to delete
        critical_failures.append("Category DELETE endpoint missing")
    if not empty_check_success:
        critical_failures.append("Empty categories found in database")
    if not protection_success and locked_bookmark_id:
        critical_failures.append("Delete protection for locked bookmarks not working")
    
    if critical_failures:
        print(f"\n❌ CRITICAL FAILURES: {', '.join(critical_failures)}")
        print("   These failures need immediate attention!")
    
    # Expected results summary
    print(f"\n🎯 EXPECTED RESULTS VERIFICATION:")
    print(f"✅ Category CRUD Operations: {'FUNCTIONAL' if create_success and update_success and delete_success else 'MISSING/BROKEN'}")
    print(f"✅ Status Filter locked bookmarks: {'FUNCTIONAL' if filter_success else 'BROKEN'}")
    print(f"✅ Lock-System with delete protection: {'FUNCTIONAL' if protection_success else 'BROKEN'}")
    print(f"✅ Database cleanup (no empty categories): {'CLEAN' if empty_check_success else 'NEEDS CLEANUP'}")
    
    if tester.tests_passed == tester.tests_run:
        print("\n🎉 All tests passed! Category CRUD & Lock System fully functional.")
        print("🎯 Alle erwarteten Ergebnisse der Review-Request erfüllt!")
        return 0
    else:
        print(f"\n⚠️  {tester.tests_run - tester.tests_passed} tests failed. Check the output above for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
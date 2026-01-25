import requests
import sys
import json
from datetime import datetime, timedelta

class PollingWinnerAPITester:
    def __init__(self, base_url="https://votepulse-4.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.user_token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data
        self.test_user = {
            "email": "test@example.com",
            "password": "test123",
            "name": "Test User",
            "phone": "9876543210"
        }
        
        self.admin_user = {
            "email": "admin@pollingwinner.com", 
            "password": "admin123"
        }

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_user_registration(self):
        """Test user registration"""
        return self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=self.test_user
        )

    def test_user_login(self):
        """Test user login and get token"""
        response = self.run_test(
            "User Login",
            "POST", 
            "auth/login",
            200,
            data={"email": self.test_user["email"], "password": self.test_user["password"]}
        )
        if response and 'access_token' in response:
            self.user_token = response['access_token']
            return True
        return False

    def test_admin_login(self):
        """Test admin login and get token"""
        response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login", 
            200,
            data=self.admin_user
        )
        if response and 'access_token' in response:
            self.admin_token = response['access_token']
            return True
        return False

    def test_get_user_profile(self):
        """Test getting user profile"""
        if not self.user_token:
            self.log_test("Get User Profile", False, "No user token")
            return None
            
        return self.run_test(
            "Get User Profile",
            "GET",
            "auth/me",
            200,
            headers={'Authorization': f'Bearer {self.user_token}'}
        )

    def test_get_polls(self):
        """Test getting all polls (public endpoint)"""
        return self.run_test(
            "Get All Polls",
            "GET",
            "polls",
            200
        )

    def test_create_poll(self):
        """Test creating a poll (admin only)"""
        if not self.admin_token:
            self.log_test("Create Poll", False, "No admin token")
            return None
            
        poll_data = {
            "title": "Test Poll",
            "description": "This is a test poll for API testing",
            "image_url": "https://via.placeholder.com/400x300",
            "options": ["Option A", "Option B"],
            "vote_price": 10.0,
            "end_datetime": (datetime.now() + timedelta(days=7)).isoformat()
        }
        
        return self.run_test(
            "Create Poll",
            "POST",
            "admin/polls",
            200,
            data=poll_data,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )

    def test_get_poll_details(self, poll_id):
        """Test getting poll details (requires login)"""
        if not self.user_token:
            self.log_test("Get Poll Details", False, "No user token")
            return None
            
        return self.run_test(
            "Get Poll Details",
            "GET",
            f"polls/{poll_id}",
            200,
            headers={'Authorization': f'Bearer {self.user_token}'}
        )

    def test_create_payment_order(self, poll_id):
        """Test creating payment order"""
        if not self.user_token:
            self.log_test("Create Payment Order", False, "No user token")
            return None
            
        vote_data = {
            "poll_id": poll_id,
            "option_index": 0,
            "num_votes": 1
        }
        
        return self.run_test(
            "Create Payment Order",
            "POST",
            "payments/create-order",
            200,
            data=vote_data,
            headers={'Authorization': f'Bearer {self.user_token}'}
        )

    def test_update_profile(self):
        """Test updating user profile"""
        if not self.user_token:
            self.log_test("Update Profile", False, "No user token")
            return None
            
        # Using form data for profile update
        try:
            url = f"{self.base_url}/profile"
            headers = {'Authorization': f'Bearer {self.user_token}'}
            data = {'name': 'Updated Test User', 'upi_id': 'test@upi'}
            
            response = requests.put(url, data=data, headers=headers)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if not success:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"
            
            self.log_test("Update Profile", success, details)
            return response.json() if success else None
            
        except Exception as e:
            self.log_test("Update Profile", False, f"Exception: {str(e)}")
            return None

    def test_submit_kyc(self):
        """Test KYC submission"""
        if not self.user_token:
            self.log_test("Submit KYC", False, "No user token")
            return None
            
        kyc_data = {
            "pan_card": "ABCDE1234F",
            "pan_name": "Test User",
            "aadhar_card": "123456789012"
        }
        
        return self.run_test(
            "Submit KYC",
            "POST",
            "kyc/submit",
            200,
            data=kyc_data,
            headers={'Authorization': f'Bearer {self.user_token}'}
        )

    def test_get_wallet(self):
        """Test getting wallet information"""
        if not self.user_token:
            self.log_test("Get Wallet", False, "No user token")
            return None
            
        return self.run_test(
            "Get Wallet",
            "GET",
            "wallet",
            200,
            headers={'Authorization': f'Bearer {self.user_token}'}
        )

    def test_admin_dashboard_stats(self):
        """Test admin dashboard stats"""
        if not self.admin_token:
            self.log_test("Admin Dashboard Stats", False, "No admin token")
            return None
            
        return self.run_test(
            "Admin Dashboard Stats",
            "GET",
            "admin/dashboard-stats",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )

    def test_admin_get_users(self):
        """Test admin get users"""
        if not self.admin_token:
            self.log_test("Admin Get Users", False, "No admin token")
            return None
            
        return self.run_test(
            "Admin Get Users",
            "GET",
            "admin/users",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )

    def test_admin_get_kyc_requests(self):
        """Test admin get KYC requests"""
        if not self.admin_token:
            self.log_test("Admin Get KYC Requests", False, "No admin token")
            return None
            
        return self.run_test(
            "Admin Get KYC Requests",
            "GET",
            "admin/kyc-requests",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )

    def test_admin_get_transactions(self):
        """Test admin get transactions"""
        if not self.admin_token:
            self.log_test("Admin Get Transactions", False, "No admin token")
            return None
            
        return self.run_test(
            "Admin Get Transactions",
            "GET",
            "admin/transactions",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )

    def test_admin_get_settings(self):
        """Test admin get settings"""
        if not self.admin_token:
            self.log_test("Admin Get Settings", False, "No admin token")
            return None
            
        return self.run_test(
            "Admin Get Settings",
            "GET",
            "admin/settings",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )

def main():
    print("🚀 Starting Polling Winner API Tests...")
    print("=" * 50)
    
    tester = PollingWinnerAPITester()
    
    # Test user registration and login
    tester.test_user_registration()
    tester.test_user_login()
    
    # Test admin login
    tester.test_admin_login()
    
    # Test user endpoints
    tester.test_get_user_profile()
    tester.test_get_polls()
    tester.test_update_profile()
    tester.test_submit_kyc()
    tester.test_get_wallet()
    
    # Test admin endpoints
    tester.test_admin_dashboard_stats()
    tester.test_admin_get_users()
    tester.test_admin_get_kyc_requests()
    tester.test_admin_get_transactions()
    tester.test_admin_get_settings()
    
    # Test poll creation and details
    poll_response = tester.test_create_poll()
    if poll_response and 'poll_id' in poll_response:
        poll_id = poll_response['poll_id']
        tester.test_get_poll_details(poll_id)
        tester.test_create_payment_order(poll_id)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Tests completed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    # Print failed tests
    failed_tests = [test for test in tester.test_results if not test['success']]
    if failed_tests:
        print("\n❌ Failed Tests:")
        for test in failed_tests:
            print(f"  - {test['test']}: {test['details']}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
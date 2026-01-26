"""
Backend API Tests for The Polling Winner App
Tests: Auth, Polls (with pagination), Admin endpoints (with pagination)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER = {"email": "testuser123@test.com", "password": "test123"}
ADMIN_USER = {"email": "admin@pollingwinner.com", "password": "admin123"}


class TestHealthAndBasicEndpoints:
    """Basic health and public endpoint tests"""
    
    def test_polls_endpoint_returns_200(self):
        """Test /api/polls returns 200"""
        response = requests.get(f"{BASE_URL}/api/polls")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
    def test_polls_endpoint_returns_paginated_response(self):
        """Test /api/polls returns paginated response with correct structure"""
        response = requests.get(f"{BASE_URL}/api/polls?page=1&limit=5")
        assert response.status_code == 200
        
        data = response.json()
        # Verify pagination fields exist
        assert "items" in data, "Missing 'items' field in response"
        assert "total" in data, "Missing 'total' field in response"
        assert "page" in data, "Missing 'page' field in response"
        assert "pages" in data, "Missing 'pages' field in response"
        assert "limit" in data, "Missing 'limit' field in response"
        
        # Verify data types
        assert isinstance(data["items"], list), "'items' should be a list"
        assert isinstance(data["total"], int), "'total' should be an integer"
        assert isinstance(data["page"], int), "'page' should be an integer"
        assert isinstance(data["pages"], int), "'pages' should be an integer"
        
        # Verify page value matches request
        assert data["page"] == 1, f"Expected page 1, got {data['page']}"
        assert data["limit"] == 5, f"Expected limit 5, got {data['limit']}"
        
    def test_polls_pagination_page_2(self):
        """Test pagination works for page 2"""
        response = requests.get(f"{BASE_URL}/api/polls?page=2&limit=2")
        assert response.status_code == 200
        
        data = response.json()
        assert data["page"] == 2, f"Expected page 2, got {data['page']}"
        
    def test_public_settings_endpoint(self):
        """Test /api/settings/public returns settings"""
        response = requests.get(f"{BASE_URL}/api/settings/public")
        assert response.status_code == 200
        
        data = response.json()
        assert "payment_gateway_charge_percent" in data
        assert "withdrawal_charge_percent" in data


class TestUserAuthentication:
    """User authentication endpoint tests"""
    
    def test_user_login_success(self):
        """Test user login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USER)
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "Missing access_token in response"
        assert "token_type" in data, "Missing token_type in response"
        assert data["token_type"] == "bearer"
        
    def test_user_login_invalid_credentials(self):
        """Test user login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
    def test_get_me_without_token(self):
        """Test /api/auth/me without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
    def test_get_me_with_valid_token(self):
        """Test /api/auth/me with valid token returns user data"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USER)
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Then get user info
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["email"] == TEST_USER["email"]


class TestAdminAuthentication:
    """Admin authentication endpoint tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json=ADMIN_USER)
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data.get("role") == "admin"
        
    def test_admin_login_with_user_credentials(self):
        """Test admin login with regular user credentials fails"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json=TEST_USER)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        
    def test_user_login_with_admin_credentials(self):
        """Test user login with admin credentials fails"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_USER)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"


class TestAdminPaginatedEndpoints:
    """Admin endpoints with pagination tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json=ADMIN_USER)
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin authentication failed")
        
    def test_admin_transactions_paginated(self, admin_token):
        """Test /api/admin/transactions returns paginated response"""
        response = requests.get(
            f"{BASE_URL}/api/admin/transactions?page=1&limit=10",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Verify pagination fields
        assert "items" in data, "Missing 'items' field"
        assert "total" in data, "Missing 'total' field"
        assert "page" in data, "Missing 'page' field"
        assert "pages" in data, "Missing 'pages' field"
        assert "limit" in data, "Missing 'limit' field"
        assert "stats" in data, "Missing 'stats' field"
        
        # Verify stats structure
        assert "total_vote_amount" in data["stats"]
        assert "total_with_gateway" in data["stats"]
        assert "total_votes" in data["stats"]
        
        # Verify page value
        assert data["page"] == 1
        assert data["limit"] == 10
        
    def test_admin_users_paginated(self, admin_token):
        """Test /api/admin/users returns paginated response"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users?page=1&limit=10",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Verify pagination fields
        assert "items" in data, "Missing 'items' field"
        assert "total" in data, "Missing 'total' field"
        assert "page" in data, "Missing 'page' field"
        assert "pages" in data, "Missing 'pages' field"
        assert "limit" in data, "Missing 'limit' field"
        
        # Verify page value
        assert data["page"] == 1
        assert data["limit"] == 10
        
        # Verify users don't have password_hash exposed
        for user in data["items"]:
            assert "password_hash" not in user, "password_hash should not be exposed"
            
    def test_admin_dashboard_stats(self, admin_token):
        """Test /api/admin/dashboard-stats returns stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard-stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "total_users" in data
        assert "total_polls" in data
        assert "active_polls" in data
        assert "pending_kyc" in data
        assert "total_revenue" in data
        
    def test_admin_settings(self, admin_token):
        """Test /api/admin/settings returns settings"""
        response = requests.get(
            f"{BASE_URL}/api/admin/settings",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "payment_gateway_charge_percent" in data
        assert "withdrawal_charge_percent" in data
        
    def test_admin_kyc_requests(self, admin_token):
        """Test /api/admin/kyc-requests returns list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/kyc-requests",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)


class TestAuthenticatedUserEndpoints:
    """Authenticated user endpoint tests"""
    
    @pytest.fixture
    def user_token(self):
        """Get user authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USER)
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("User authentication failed")
        
    def test_get_profile(self, user_token):
        """Test /api/profile returns user profile"""
        response = requests.get(
            f"{BASE_URL}/api/profile",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "email" in data
        assert "name" in data
        
    def test_get_wallet(self, user_token):
        """Test /api/wallet returns wallet info"""
        response = requests.get(
            f"{BASE_URL}/api/wallet",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "balance" in data
        assert "withdrawals" in data
        assert "transactions" in data
        
    def test_get_my_polls(self, user_token):
        """Test /api/my-polls returns user's voted polls"""
        response = requests.get(
            f"{BASE_URL}/api/my-polls",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        
    def test_get_poll_details_authenticated(self, user_token):
        """Test /api/polls/{poll_id} returns poll details for authenticated user"""
        # First get a poll ID
        polls_response = requests.get(f"{BASE_URL}/api/polls")
        polls = polls_response.json()["items"]
        
        if not polls:
            pytest.skip("No polls available for testing")
            
        poll_id = polls[0]["id"]
        
        response = requests.get(
            f"{BASE_URL}/api/polls/{poll_id}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == poll_id
        assert "title" in data
        assert "options" in data
        assert "total_votes" in data
        assert "user_votes" in data  # Should include user's votes


class TestPollDetailsEndpoint:
    """Poll details endpoint tests"""
    
    @pytest.fixture
    def user_token(self):
        """Get user authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USER)
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("User authentication failed")
        
    def test_poll_not_found(self, user_token):
        """Test /api/polls/{poll_id} returns 404 for non-existent poll"""
        response = requests.get(
            f"{BASE_URL}/api/polls/non-existent-poll-id",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 404
        
    def test_poll_details_without_auth(self):
        """Test /api/polls/{poll_id} requires authentication"""
        # Get a poll ID first
        polls_response = requests.get(f"{BASE_URL}/api/polls")
        polls = polls_response.json()["items"]
        
        if not polls:
            pytest.skip("No polls available for testing")
            
        poll_id = polls[0]["id"]
        
        response = requests.get(f"{BASE_URL}/api/polls/{poll_id}")
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

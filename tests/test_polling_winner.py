"""
Comprehensive API tests for The Polling Winner application
Tests: User auth, Polls, Payments, Admin, KYC, Wallet
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://votepulse-4.preview.emergentagent.com').rstrip('/')

# Test data
TEST_USER = {
    "email": f"testuser_{datetime.now().strftime('%H%M%S')}@example.com",
    "password": "testpass123",
    "name": "Test User",
    "phone": "9876543210"
}

ADMIN_USER = {
    "email": "admin@pollingwinner.com",
    "password": "admin123"
}


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def user_token(api_client):
    """Register and get user token"""
    # Try to register
    response = api_client.post(f"{BASE_URL}/api/auth/register", json=TEST_USER)
    if response.status_code == 200:
        return response.json().get("access_token")
    
    # If already exists, login
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_USER["email"],
        "password": TEST_USER["password"]
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    
    pytest.skip("Could not get user token")


@pytest.fixture(scope="module")
def admin_token(api_client):
    """Get admin token via admin login endpoint"""
    response = api_client.post(f"{BASE_URL}/api/admin/login", json=ADMIN_USER)
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Could not get admin token")


@pytest.fixture(scope="module")
def authenticated_client(api_client, user_token):
    """Session with user auth header"""
    api_client.headers.update({"Authorization": f"Bearer {user_token}"})
    return api_client


@pytest.fixture(scope="module")
def admin_client(api_client, admin_token):
    """Session with admin auth header"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {admin_token}"
    })
    return session


class TestUserAuthentication:
    """User registration and login tests"""
    
    def test_user_registration(self, api_client):
        """Test user registration with new email"""
        new_user = {
            "email": f"newuser_{datetime.now().strftime('%H%M%S%f')}@example.com",
            "password": "newpass123",
            "name": "New User",
            "phone": "9876543211"
        }
        response = api_client.post(f"{BASE_URL}/api/auth/register", json=new_user)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_user_login_success(self, api_client, user_token):
        """Test user login with valid credentials"""
        # User login should work for regular users
        assert user_token is not None
        # Verify the token works
        response = api_client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert data.get("role") == "user"
    
    def test_user_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
    
    def test_get_current_user(self, user_token, api_client):
        """Test getting current user profile"""
        response = api_client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "name" in data
        assert "cash_wallet" in data


class TestPolls:
    """Poll listing and details tests"""
    
    def test_get_all_polls(self, api_client):
        """Test getting all polls (public endpoint)"""
        response = api_client.get(f"{BASE_URL}/api/polls")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_poll_details(self, user_token, api_client):
        """Test getting poll details"""
        # First get all polls
        polls_response = api_client.get(f"{BASE_URL}/api/polls")
        polls = polls_response.json()
        
        if not polls:
            pytest.skip("No polls available to test")
        
        poll_id = polls[0]["id"]
        response = api_client.get(
            f"{BASE_URL}/api/polls/{poll_id}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "title" in data
        assert "options" in data
        assert "vote_price" in data
        assert "total_votes" in data


class TestAdminPolls:
    """Admin poll management tests"""
    
    def test_admin_create_poll(self, admin_client):
        """Test creating a new poll"""
        poll_data = {
            "title": f"Test Poll {datetime.now().strftime('%H%M%S')}",
            "description": "This is a test poll for API testing",
            "image_url": "https://via.placeholder.com/400x300",
            "options": ["Option A", "Option B", "Option C"],
            "vote_price": 10.0,
            "end_datetime": (datetime.now() + timedelta(days=7)).isoformat()
        }
        response = admin_client.post(f"{BASE_URL}/api/admin/polls", json=poll_data)
        assert response.status_code == 200
        data = response.json()
        assert "poll_id" in data
        assert data["message"] == "Poll created successfully"
        return data["poll_id"]
    
    def test_admin_update_poll(self, admin_client):
        """Test updating a poll"""
        # First create a poll
        poll_data = {
            "title": f"Update Test Poll {datetime.now().strftime('%H%M%S')}",
            "description": "Poll to be updated",
            "image_url": "https://via.placeholder.com/400x300",
            "options": ["Option X", "Option Y"],
            "vote_price": 15.0,
            "end_datetime": (datetime.now() + timedelta(days=7)).isoformat()
        }
        create_response = admin_client.post(f"{BASE_URL}/api/admin/polls", json=poll_data)
        poll_id = create_response.json()["poll_id"]
        
        # Update the poll
        updated_data = {
            "title": "Updated Poll Title",
            "description": "Updated description",
            "image_url": "https://via.placeholder.com/400x300",
            "options": ["Option X", "Option Y"],
            "vote_price": 20.0,
            "end_datetime": (datetime.now() + timedelta(days=14)).isoformat()
        }
        response = admin_client.put(f"{BASE_URL}/api/admin/polls/{poll_id}", json=updated_data)
        assert response.status_code == 200
        assert response.json()["message"] == "Poll updated successfully"
    
    def test_admin_delete_poll(self, admin_client):
        """Test deleting a poll"""
        # First create a poll
        poll_data = {
            "title": f"Delete Test Poll {datetime.now().strftime('%H%M%S')}",
            "description": "Poll to be deleted",
            "image_url": "https://via.placeholder.com/400x300",
            "options": ["Option 1", "Option 2"],
            "vote_price": 5.0,
            "end_datetime": (datetime.now() + timedelta(days=1)).isoformat()
        }
        create_response = admin_client.post(f"{BASE_URL}/api/admin/polls", json=poll_data)
        poll_id = create_response.json()["poll_id"]
        
        # Delete the poll
        response = admin_client.delete(f"{BASE_URL}/api/admin/polls/{poll_id}")
        assert response.status_code == 200
        assert response.json()["message"] == "Poll deleted successfully"


class TestPayments:
    """Payment flow tests"""
    
    def test_create_payment_order(self, user_token, api_client):
        """Test creating a payment order"""
        # Get an active poll
        polls_response = api_client.get(f"{BASE_URL}/api/polls")
        polls = polls_response.json()
        active_polls = [p for p in polls if p.get("status") == "active"]
        
        if not active_polls:
            pytest.skip("No active polls available")
        
        poll_id = active_polls[0]["id"]
        vote_data = {
            "poll_id": poll_id,
            "option_index": 0,
            "num_votes": 1
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/payments/create-order",
            json=vote_data,
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "order_id" in data
        assert "payment_session_id" in data
        assert "amount" in data
        assert "base_amount" in data
        assert "gateway_charge" in data
        
        # Verify gateway charge calculation (2%)
        expected_gateway_charge = data["base_amount"] * 0.02
        assert abs(data["gateway_charge"] - expected_gateway_charge) < 0.01


class TestAdminDashboard:
    """Admin dashboard and stats tests"""
    
    def test_admin_dashboard_stats(self, admin_client):
        """Test admin dashboard statistics"""
        response = admin_client.get(f"{BASE_URL}/api/admin/dashboard-stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "total_polls" in data
        assert "active_polls" in data
        assert "pending_kyc" in data
        assert "total_revenue" in data
    
    def test_admin_get_users(self, admin_client):
        """Test getting all users"""
        response = admin_client.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_admin_get_transactions(self, admin_client):
        """Test getting all transactions"""
        response = admin_client.get(f"{BASE_URL}/api/admin/transactions")
        assert response.status_code == 200
        data = response.json()
        assert "transactions" in data
        assert "stats" in data


class TestAdminSettings:
    """Admin settings tests"""
    
    def test_admin_get_settings(self, admin_client):
        """Test getting admin settings"""
        response = admin_client.get(f"{BASE_URL}/api/admin/settings")
        assert response.status_code == 200
        data = response.json()
        assert "payment_gateway_charge_percent" in data
        assert "withdrawal_charge_percent" in data
    
    def test_admin_update_settings(self, admin_client):
        """Test updating admin settings"""
        settings_data = {
            "payment_gateway_charge_percent": 2.5,
            "withdrawal_charge_percent": 12
        }
        response = admin_client.put(f"{BASE_URL}/api/admin/settings", json=settings_data)
        assert response.status_code == 200
        data = response.json()
        assert data["payment_gateway_charge_percent"] == 2.5
        assert data["withdrawal_charge_percent"] == 12
        
        # Reset to original values
        reset_data = {
            "payment_gateway_charge_percent": 2,
            "withdrawal_charge_percent": 10
        }
        admin_client.put(f"{BASE_URL}/api/admin/settings", json=reset_data)


class TestKYC:
    """KYC workflow tests"""
    
    def test_submit_kyc(self, user_token, api_client):
        """Test KYC submission"""
        kyc_data = {
            "pan_card": "ABCDE1234F",
            "pan_name": "Test User",
            "aadhar_card": "123456789012"
        }
        response = api_client.post(
            f"{BASE_URL}/api/kyc/submit",
            json=kyc_data,
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "KYC submitted successfully"
    
    def test_admin_get_kyc_requests(self, admin_client):
        """Test getting KYC requests"""
        response = admin_client.get(f"{BASE_URL}/api/admin/kyc-requests")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestWallet:
    """Wallet and withdrawal tests"""
    
    def test_get_wallet(self, user_token, api_client):
        """Test getting wallet information"""
        response = api_client.get(
            f"{BASE_URL}/api/wallet",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "balance" in data
        assert "withdrawals" in data
        assert "transactions" in data
    
    def test_withdrawal_without_kyc(self, user_token, api_client):
        """Test withdrawal request without approved KYC"""
        withdrawal_data = {"amount": 100}
        response = api_client.post(
            f"{BASE_URL}/api/withdrawal/request",
            json=withdrawal_data,
            headers={"Authorization": f"Bearer {user_token}"}
        )
        # Should fail because KYC is not approved
        assert response.status_code == 400


class TestProfile:
    """User profile tests"""
    
    def test_get_profile(self, user_token, api_client):
        """Test getting user profile"""
        response = api_client.get(
            f"{BASE_URL}/api/profile",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "name" in data
        assert "kyc_status" in data


class TestMyPolls:
    """User's voted polls tests"""
    
    def test_get_my_polls(self, user_token, api_client):
        """Test getting user's voted polls"""
        response = api_client.get(
            f"{BASE_URL}/api/my-polls",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

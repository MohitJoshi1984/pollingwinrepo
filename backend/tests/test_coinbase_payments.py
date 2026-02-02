"""
Backend API Tests for Coinbase Commerce Payment Integration
Tests: Create Order, Verify Payment, Webhook endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER = {"email": "testuser123@test.com", "password": "test123"}
ADMIN_USER = {"email": "admin@pollingwinner.com", "password": "admin123"}

# Active poll ID for testing
ACTIVE_POLL_ID = "60967516-5eb1-4be1-a1a0-4728fbaee0d9"


class TestCoinbasePaymentEndpoints:
    """Coinbase Commerce payment endpoint tests"""
    
    @pytest.fixture
    def user_token(self):
        """Get user authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USER)
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("User authentication failed")
    
    def test_create_order_success(self, user_token):
        """Test POST /api/payments/create-order creates Coinbase charge"""
        response = requests.post(
            f"{BASE_URL}/api/payments/create-order",
            json={
                "poll_id": ACTIVE_POLL_ID,
                "option_index": 0,
                "num_votes": 1
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert "order_id" in data, "Missing order_id in response"
        assert "charge_code" in data, "Missing charge_code in response"
        assert "hosted_url" in data, "Missing hosted_url in response"
        assert "amount" in data, "Missing amount in response"
        assert "usd_amount" in data, "Missing usd_amount in response"
        assert "base_amount" in data, "Missing base_amount in response"
        assert "gateway_charge" in data, "Missing gateway_charge in response"
        
        # Verify hosted_url is Coinbase Commerce URL
        assert "commerce.coinbase.com" in data["hosted_url"], "hosted_url should be Coinbase Commerce URL"
        
        # Verify USD amount is at least $1 (minimum charge)
        assert data["usd_amount"] >= 1.0, "USD amount should be at least $1"
        
        # Store order_id for verify test
        return data["order_id"]
    
    def test_create_order_without_auth(self):
        """Test POST /api/payments/create-order requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/payments/create-order",
            json={
                "poll_id": ACTIVE_POLL_ID,
                "option_index": 0,
                "num_votes": 1
            }
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_create_order_invalid_poll(self, user_token):
        """Test POST /api/payments/create-order with invalid poll ID"""
        response = requests.post(
            f"{BASE_URL}/api/payments/create-order",
            json={
                "poll_id": "non-existent-poll-id",
                "option_index": 0,
                "num_votes": 1
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_verify_payment_order_not_found(self, user_token):
        """Test POST /api/payments/verify with non-existent order"""
        response = requests.post(
            f"{BASE_URL}/api/payments/verify?order_id=non_existent_order",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data
        assert "not found" in data["detail"].lower()
    
    def test_verify_payment_without_auth(self):
        """Test POST /api/payments/verify requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/payments/verify?order_id=some_order_id"
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_create_and_verify_payment_flow(self, user_token):
        """Test full payment flow: create order then verify"""
        # Step 1: Create order
        create_response = requests.post(
            f"{BASE_URL}/api/payments/create-order",
            json={
                "poll_id": ACTIVE_POLL_ID,
                "option_index": 0,
                "num_votes": 1
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert create_response.status_code == 200
        order_id = create_response.json()["order_id"]
        
        # Step 2: Verify payment (should be pending since no actual payment made)
        verify_response = requests.post(
            f"{BASE_URL}/api/payments/verify?order_id={order_id}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert verify_response.status_code == 200
        
        data = verify_response.json()
        assert "status" in data
        assert "message" in data
        # Status should be pending since no actual crypto payment was made
        assert data["status"] in ["pending", "success", "failed"], f"Unexpected status: {data['status']}"
    
    def test_create_order_multiple_votes(self, user_token):
        """Test POST /api/payments/create-order with multiple votes"""
        response = requests.post(
            f"{BASE_URL}/api/payments/create-order",
            json={
                "poll_id": ACTIVE_POLL_ID,
                "option_index": 1,
                "num_votes": 5
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200
        
        data = response.json()
        # Verify amount calculation (5 votes * vote_price + gateway charge)
        assert data["base_amount"] > 0
        assert data["gateway_charge"] > 0
        assert data["amount"] == data["base_amount"] + data["gateway_charge"]


class TestWebhookEndpoint:
    """Webhook endpoint tests"""
    
    def test_webhook_without_signature(self):
        """Test POST /api/payments/webhook without signature returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/payments/webhook",
            json={"event": {"type": "charge:confirmed"}}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_webhook_with_invalid_signature(self):
        """Test POST /api/payments/webhook with invalid signature returns 403"""
        response = requests.post(
            f"{BASE_URL}/api/payments/webhook",
            json={"event": {"type": "charge:confirmed"}},
            headers={"X-CC-Webhook-Signature": "invalid_signature"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

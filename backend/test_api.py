"""
Quick test script to verify the new API is working
"""

import requests
import json

BASE_URL = "http://localhost:8001"

def test_health():
    """Test health check"""
    print("Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}\n")

def test_register():
    """Test user registration"""
    print("Testing registration...")
    data = {
        "email": "test@cricket18.com",
        "password": "testpass123",
        "name": "Test Player",
        "phone": "+1234567890",
        "role": "player"
    }
    response = requests.post(f"{BASE_URL}/api/v1/auth/register", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")
    return response.json()

def test_login():
    """Test user login"""
    print("Testing login...")
    data = {
        "email": "test@cricket18.com",
        "password": "testpass123"
    }
    response = requests.post(f"{BASE_URL}/api/v1/auth/login", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")
    return response.json()

def test_profile(token):
    """Test get profile"""
    print("Testing get profile...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/v1/users/me", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")

if __name__ == "__main__":
    print("=" * 50)
    print("18 Cricket Network API Test")
    print("=" * 50 + "\n")
    
    try:
        test_health()
        
        # Try to register
        try:
            reg_response = test_register()
            token = reg_response.get("access_token")
        except Exception as e:
            print(f"Registration failed (user might exist): {e}")
            # Try login instead
            login_response = test_login()
            token = login_response.get("access_token")
        
        if token:
            test_profile(token)
        
        print("=" * 50)
        print("✓ Basic API tests completed!")
        print("=" * 50)
    
    except Exception as e:
        print(f"Error during testing: {e}")

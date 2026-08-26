"""
Quick smoke test to verify the core API is working end-to-end.

Exercises the real endpoints (phone-based auth under the /api prefix) against a
running server and asserts on the responses so it fails loudly if the app breaks.

Usage:
    # with the backend running on :8001
    ./.venv/bin/python test_api.py
"""

import sys
import time

import requests

BASE_URL = "http://localhost:8001"


def test_health():
    print("Testing health endpoint...")
    r = requests.get(f"{BASE_URL}/api/health", timeout=10)
    print(f"Status: {r.status_code} Response: {r.json()}\n")
    assert r.status_code == 200, "health check failed"
    assert r.json().get("status") == "healthy"


def test_register():
    print("Testing registration...")
    phone = "9" + str(int(time.time() * 1000))[-9:]
    data = {
        "phone": phone,
        "name": "Smoke Test",
        "email": f"smoke{phone}@cricket18.com",
        "user_type": "player",
        "password": "testpass123",
    }
    r = requests.post(f"{BASE_URL}/api/auth/register", json=data, timeout=10)
    print(f"Status: {r.status_code}\n")
    assert r.status_code == 200, f"register failed: {r.text}"
    body = r.json()
    assert body.get("access_token"), "no access_token returned"
    return phone, body["access_token"]


def test_login(phone):
    print("Testing login...")
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"phone": phone, "password": "testpass123"},
        timeout=10,
    )
    print(f"Status: {r.status_code}\n")
    assert r.status_code == 200, f"login failed: {r.text}"
    return r.json()["access_token"]


def test_profile(token):
    print("Testing get profile...")
    r = requests.get(
        f"{BASE_URL}/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )
    print(f"Status: {r.status_code}\n")
    assert r.status_code == 200, f"profile failed: {r.text}"
    assert r.json().get("phone"), "profile missing phone"


def test_public_lists():
    print("Testing public catalog endpoints...")
    for path in ("/api/products", "/api/tournaments", "/api/grounds", "/api/academies"):
        r = requests.get(f"{BASE_URL}{path}", timeout=10)
        assert r.status_code == 200, f"{path} failed: {r.status_code}"
        assert isinstance(r.json(), list), f"{path} did not return a list"
    print("Catalog endpoints OK\n")


if __name__ == "__main__":
    print("=" * 50)
    print("18 Cricket Network API Smoke Test")
    print("=" * 50 + "\n")
    try:
        test_health()
        phone, token = test_register()
        token = test_login(phone)
        test_profile(token)
        test_public_lists()
        print("=" * 50)
        print("\u2713 All smoke tests passed!")
        print("=" * 50)
    except Exception as e:  # noqa: BLE001
        print(f"\u2717 Smoke test failed: {e}")
        sys.exit(1)

import os
import sys

os.environ["FORCE_MEMORY_DB"] = "1"
os.environ.setdefault("JWT_SECRET", "test-secret")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import pytest
from fastapi.testclient import TestClient
from server import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health_and_featured(client):
    health = client.get("/api/health")
    assert health.status_code == 200
    featured = client.get("/api/featured")
    assert featured.status_code == 200
    body = featured.json()
    assert body["products"]
    assert body["tournaments"]


def test_demo_login_and_catalog(client):
    login = client.post("/api/auth/login", json={"phone": "9876543211", "password": "test123"})
    assert login.status_code == 200
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    products = client.get("/api/products")
    assert products.status_code == 200
    assert len(products.json()) >= 1
    product_id = products.json()[0]["id"]

    detail = client.get(f"/api/products/{product_id}")
    assert detail.status_code == 200
    assert detail.json()["name"]

    academies = client.get("/api/academies")
    assert academies.status_code == 200
    academy_id = academies.json()[0]["id"]
    lead = client.post(f"/api/academies/{academy_id}/leads", json={"message": "Trial please"}, headers=headers)
    assert lead.status_code == 200

    tournaments = client.get("/api/tournaments", params={"status": "upcoming"})
    assert tournaments.status_code == 200
    tournament_id = tournaments.json()[0]["id"]
    register = client.post(
        f"/api/tournaments/{tournament_id}/register",
        json={"team_name": "Night Watchmen"},
        headers=headers,
    )
    assert register.status_code == 200

    grounds = client.get("/api/grounds")
    assert grounds.status_code == 200
    ground_id = grounds.json()[0]["id"]
    booking = client.post(
        "/api/bookings",
        json={
            "ground_id": ground_id,
            "booking_date": "2026-08-24",
            "time_slot": "6-8AM",
            "booking_type": "hourly",
            "total_amount": 1800,
        },
        headers=headers,
    )
    assert booking.status_code == 200

    order = client.post(
        "/api/orders/create",
        json={
            "items": [
                {
                    "product_id": product_id,
                    "product_name": detail.json()["name"],
                    "vendor_id": detail.json()["vendor_id"],
                    "vendor_name": detail.json()["vendor_name"],
                    "quantity": 1,
                    "price": detail.json()["price"],
                }
            ],
            "shipping_address": "12 MG Road",
            "city": "Bengaluru",
            "pincode": "560001",
        },
        headers=headers,
    )
    assert order.status_code == 200
    paid = client.post(
        f"/api/orders/{order.json()['id']}/payment-success",
        json={"razorpay_payment_id": "pay_test"},
        headers=headers,
    )
    assert paid.status_code == 200

    post = client.post("/api/posts", json={"content": "Net session done.", "images": []}, headers=headers)
    assert post.status_code == 200
    posts = client.get("/api/posts")
    assert any(item["content"] == "Net session done." for item in posts.json())


def test_register_new_user(client):
    response = client.post(
        "/api/auth/register",
        json={
            "phone": "9000000001",
            "name": "Test Batter",
            "password": "secret123",
            "user_type": "player",
        },
    )
    assert response.status_code == 200
    assert response.json()["access_token"]

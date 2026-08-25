"""
End-to-end tests for the 18 Cricket Network coaching marketplace.

Runs the real FastAPI app against a dedicated throwaway MongoDB database so the
development data is never polluted with test coaches (the platform must only ever
contain real coaches). The test database is dropped on teardown.

Run:
    cd backend
    MONGO_URL="mongodb://localhost:27017" ./.venv/bin/python -m pytest test_coaching_marketplace.py -v
"""

import os
import uuid

import pytest

# Configure an isolated database BEFORE importing the app (server reads env at import).
os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ["DB_NAME"] = f"18cricket_test_{uuid.uuid4().hex[:8]}"
os.environ.setdefault("JWT_SECRET", "test-secret")

from fastapi.testclient import TestClient  # noqa: E402
from pymongo import MongoClient  # noqa: E402

import server  # noqa: E402


@pytest.fixture(scope="module")
def client():
    with TestClient(server.app) as c:
        yield c
    # Drop the throwaway database.
    MongoClient(os.environ["MONGO_URL"]).drop_database(os.environ["DB_NAME"])


def _phone():
    return "9" + uuid.uuid4().int.__str__()[:9]


def _register(client, user_type="player"):
    phone = _phone()
    res = client.post(
        "/api/auth/register",
        json={
            "phone": phone,
            "name": f"User {phone[-4:]}",
            "email": f"user{phone}@test.com",
            "user_type": user_type,
            "password": "testpass123",
        },
    )
    assert res.status_code == 200, res.text
    return {"phone": phone, "token": res.json()["access_token"], "user": res.json()["user"]}


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


PDF_BYTES = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"


@pytest.fixture(scope="module")
def actors(client):
    return {
        "admin": _register(client, "admin"),
        "coach": _register(client, "player"),
        "player": _register(client, "player"),
    }


def _complete_profile(client, token):
    """Fill a coach application to the point it is valid for submission."""
    client.put(
        "/api/coach-profiles/me",
        headers=_auth(token),
        json={
            "onboardingStep": 2,
            "displayName": "Coach Test",
            "legalFullName": "Coach Test Legal",
            "email": "coachtest@test.com",
            "city": "London",
            "state": "England",
            "country": "United Kingdom",
            "specializations": ["Batting", "Fielding"],
            "yearsCoaching": 6,
            "virtualAvailable": True,
            "inPersonAvailable": True,
        },
    )
    client.post(
        "/api/coach-profiles/me/services",
        headers=_auth(token),
        json={"category": "TECHNIQUE", "subcategory": "Batting", "title": "Batting Technique", "virtualAvailable": True},
    )
    client.post(
        "/api/coach-profiles/me/pricing",
        headers=_auth(token),
        json={"sessionType": "ONE_ON_ONE", "durationMinutes": 60, "currency": "USD", "price": 50},
    )
    client.put(
        "/api/coach-profiles/me/availability",
        headers=_auth(token),
        json={"timezone": "Europe/London", "slots": [{"dayOfWeek": "Saturday", "startTime": "09:00", "endTime": "13:00", "locationType": "virtual"}]},
    )


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_taxonomy_and_fee_defaults(client):
    tax = client.get("/api/coaching/taxonomy").json()
    assert {t["category"] for t in tax["serviceTaxonomy"]} == {"TECHNIQUE", "PERFORMANCE", "TACTICAL", "MINDSET", "OTHER"}
    fee = client.get("/api/coaching/platform-fee").json()
    # Platform fee must NOT be hard-coded — defaults to "none".
    assert fee["coachPlatformFeeType"] == "none"


def test_no_fake_data_initially(client):
    disc = client.get("/api/coaching/coaches").json()
    assert disc["count"] == 0 and disc["results"] == []


def test_draft_autosave_creates_applicant(client, actors):
    token = actors["coach"]["token"]
    res = client.put(
        "/api/coach-profiles/me",
        headers=_auth(token),
        json={"onboardingStep": 1, "displayName": "Coach Test", "city": "London"},
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["status"] == "DRAFT"
    # Autosave again — progress is retained, still a single draft.
    res2 = client.put("/api/coach-profiles/me", headers=_auth(token), json={"onboardingStep": 3, "bio": "Hello"})
    assert res2.json()["onboardingStep"] == 3
    assert res2.json()["bio"] == "Hello"


def test_submission_requires_complete_application(client, actors):
    token = actors["coach"]["token"]
    # Not complete yet -> 422 with a list of errors.
    res = client.post("/api/coach-applications/submit", headers=_auth(token))
    assert res.status_code == 422
    detail = res.json()["detail"]
    assert "errors" in detail and len(detail["errors"]) >= 1


def test_certification_upload_validates_type(client, actors):
    token = actors["coach"]["token"]
    # Wrong type (text) rejected.
    bad = client.post(
        "/api/coach-profiles/me/certifications",
        headers=_auth(token),
        files={"file": ("note.txt", b"hello", "text/plain")},
        data={"name": "X", "issuer": "Y"},
    )
    assert bad.status_code == 400
    # Valid PDF accepted; response never leaks storage internals.
    good = client.post(
        "/api/coach-profiles/me/certifications",
        headers=_auth(token),
        files={"file": ("cert.pdf", PDF_BYTES, "application/pdf")},
        data={"name": "ECB Level 2", "issuer": "ECB"},
    )
    assert good.status_code == 200, good.text
    cert = good.json()
    assert cert["status"] == "PENDING"
    assert "storageKey" not in cert and "storageProvider" not in cert


def test_full_submission_and_role(client, actors):
    token = actors["coach"]["token"]
    _complete_profile(client, token)
    # Accept agreements.
    client.put(
        "/api/coach-profiles/me",
        headers=_auth(token),
        json={"agreedTerms": True, "agreedCoachAgreement": True, "agreedFeeDisclosure": True, "confirmedAccurate": True, "understoodNoGuarantee": True},
    )
    res = client.post("/api/coach-applications/submit", headers=_auth(token))
    assert res.status_code == 200, res.text
    assert res.json()["status"] == "SUBMITTED"


def test_discovery_excludes_unapproved(client, actors):
    # Coach submitted but not approved -> not discoverable.
    disc = client.get("/api/coaching/coaches").json()
    assert disc["count"] == 0


def test_unauthorized_approval_forbidden(client, actors):
    coach_token = actors["coach"]["token"]
    me = client.get("/api/coach-profiles/me", headers=_auth(coach_token)).json()
    coach_id = me["id"]
    # A non-admin cannot approve.
    res = client.post(f"/api/admin/coaches/{coach_id}/approve", headers=_auth(coach_token))
    assert res.status_code == 403
    # A non-admin cannot verify certifications either.
    certs = client.get("/api/coach-profiles/me/certifications", headers=_auth(coach_token)).json()
    res2 = client.post(f"/api/admin/certifications/{certs[0]['id']}/verify", headers=_auth(coach_token))
    assert res2.status_code == 403


def test_admin_approve_publishes_and_assigns_role(client, actors):
    admin_token = actors["admin"]["token"]
    coach_token = actors["coach"]["token"]
    me = client.get("/api/coach-profiles/me", headers=_auth(coach_token)).json()
    coach_id = me["id"]
    res = client.post(f"/api/admin/coaches/{coach_id}/approve", headers=_auth(admin_token))
    assert res.status_code == 200, res.text
    assert res.json()["status"] == "APPROVED"
    # Now discoverable.
    disc = client.get("/api/coaching/coaches").json()
    assert disc["count"] == 1
    assert disc["results"][0]["displayName"] == "Coach Test"


def test_public_profile_hides_private_fields(client, actors):
    coach_token = actors["coach"]["token"]
    coach_id = client.get("/api/coach-profiles/me", headers=_auth(coach_token)).json()["id"]
    pub = client.get(f"/api/coaching/coaches/{coach_id}").json()
    for private in ("email", "phone", "meetingUrl", "storageKey", "userId", "cancellationPolicy"):
        assert private not in pub, f"{private} leaked in public profile"
    assert "18 Cricket Verified Coach" in pub["badges"]


def test_certification_verification_and_badge(client, actors):
    admin_token = actors["admin"]["token"]
    coach_token = actors["coach"]["token"]
    coach_id = client.get("/api/coach-profiles/me", headers=_auth(coach_token)).json()["id"]
    certs = client.get("/api/coach-profiles/me/certifications", headers=_auth(coach_token)).json()
    cert_id = certs[0]["id"]
    res = client.post(f"/api/admin/certifications/{cert_id}/verify", headers=_auth(admin_token))
    assert res.status_code == 200
    assert res.json()["status"] == "VERIFIED"
    pub = client.get(f"/api/coaching/coaches/{coach_id}").json()
    assert any(q["status"] == "VERIFIED" for q in pub["qualifications"])
    assert "Certification Verified" in pub["badges"]


def test_secure_document_access(client, actors):
    admin_token = actors["admin"]["token"]
    coach_token = actors["coach"]["token"]
    certs = client.get("/api/coach-profiles/me/certifications", headers=_auth(coach_token)).json()
    cert_id = certs[0]["id"]
    # File cannot be fetched without a valid signed token.
    assert client.get(f"/api/coach-certifications/{cert_id}/file").status_code == 403
    # Owner can mint a signed url and fetch the document.
    signed = client.get(f"/api/coach-certifications/{cert_id}/signed-url", headers=_auth(coach_token))
    assert signed.status_code == 200
    url = signed.json()["url"]
    got = client.get(url)
    assert got.status_code == 200
    assert got.content.startswith(b"%PDF")
    # Admin can also mint a signed url.
    assert client.get(f"/api/admin/certifications/{cert_id}/signed-url", headers=_auth(admin_token)).status_code == 200


def test_booking_and_payout_breakdown(client, actors):
    player_token = actors["player"]["token"]
    coach_token = actors["coach"]["token"]
    coach_id = client.get("/api/coach-profiles/me", headers=_auth(coach_token)).json()["id"]
    pricing = client.get("/api/coach-profiles/me/pricing", headers=_auth(coach_token)).json()
    res = client.post(
        "/api/coaching/bookings",
        headers=_auth(player_token),
        json={
            "coachId": coach_id,
            "pricingId": pricing[0]["id"],
            "sessionType": "ONE_ON_ONE",
            "deliveryMode": "virtual",
            "scheduledStart": "2027-01-01T10:00:00",
            "durationMinutes": 60,
        },
    )
    assert res.status_code == 200, res.text
    booking = res.json()
    assert booking["status"] == "REQUESTED"
    assert booking["price"] == 50
    # Fee is "none" -> full payout to coach.
    assert booking["platformFee"] == 0 and booking["coachPayout"] == 50
    mine = client.get("/api/coaching/bookings/me", headers=_auth(player_token)).json()
    assert any(b["id"] == booking["id"] for b in mine)


def test_configurable_platform_fee(client, actors):
    admin_token = actors["admin"]["token"]
    player_token = actors["player"]["token"]
    coach_token = actors["coach"]["token"]
    coach_id = client.get("/api/coach-profiles/me", headers=_auth(coach_token)).json()["id"]
    pricing = client.get("/api/coach-profiles/me/pricing", headers=_auth(coach_token)).json()
    # Admin configures a 10% platform fee.
    res = client.put(
        "/api/admin/coaching/platform-fee",
        headers=_auth(admin_token),
        json={"coachPlatformFeeType": "percentage", "coachPlatformFeeValue": 10},
    )
    assert res.status_code == 200
    booking = client.post(
        "/api/coaching/bookings",
        headers=_auth(player_token),
        json={"coachId": coach_id, "pricingId": pricing[0]["id"], "sessionType": "ONE_ON_ONE", "scheduledStart": "2027-02-01T10:00:00"},
    ).json()
    assert booking["platformFee"] == 5.0
    assert booking["coachPayout"] == 45.0


def test_suspend_removes_from_discovery(client, actors):
    admin_token = actors["admin"]["token"]
    coach_token = actors["coach"]["token"]
    coach_id = client.get("/api/coach-profiles/me", headers=_auth(coach_token)).json()["id"]
    res = client.post(f"/api/admin/coaches/{coach_id}/suspend", headers=_auth(admin_token), json={"reason": "test"})
    assert res.status_code == 200
    assert client.get("/api/coaching/coaches").json()["count"] == 0
    # Restore brings it back.
    client.post(f"/api/admin/coaches/{coach_id}/restore", headers=_auth(admin_token))
    assert client.get("/api/coaching/coaches").json()["count"] == 1


def test_audit_log_written(client, actors):
    # The lifecycle above must have produced audit entries.
    db = server.db
    # server.db is async (motor); use a sync client for assertion simplicity.
    sync = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
    actions = sync.coach_audit_log.distinct("action")
    for expected in ("coach_application_submitted", "coach_approved", "certificate_verified", "session_requested"):
        assert expected in actions, f"missing audit action {expected}"

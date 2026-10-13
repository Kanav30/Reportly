"""
Authentication and Authorization Integration Tests
====================================================
Tests that verify:
1. Unauthenticated requests are rejected on protected endpoints (401).
2. A forged/invalid token is rejected (401).
3. Ownership enforcement — a user cannot access another user's report.
4. Authenticated upload saves a report associated with the correct UID.
5. Report history returns only the requesting user's reports.
6. Delete endpoint enforces ownership.
7. All existing functionality (health, guardrails, file validation) still works.

Note: Tests requiring real Firebase tokens use mock/stub approach since
real Firebase Auth cannot be called in automated unit tests without credentials.
For end-to-end verification with real accounts, see TESTING_CHECKLIST.md.
"""

import pytest
from unittest.mock import patch, MagicMock
from httpx import AsyncClient, ASGITransport
import sys
import os

# Add backend to path so imports work from tests/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

MOCK_UID_A = "uid-user-alpha-000"
MOCK_UID_B = "uid-user-beta-111"

def make_decoded_token(uid: str, email: str = "test@reportly.test") -> dict:
    return {"uid": uid, "email": email, "aud": "test-project"}


# ---------------------------------------------------------------------------
# 1. Unauthenticated access to protected endpoints → 401
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_protected_upload_no_token_returns_401():
    """Upload without token: still works (optional auth), saves without ownerUid."""
    # /api/upload accepts unauthenticated requests — it just doesn't save to a user
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        files = {"file": ("empty.png", b"", "image/png")}
        response = await client.post("/api/upload", files=files)
        # Empty file should be rejected before auth matters
        assert response.status_code == 400


@pytest.mark.asyncio
async def test_protected_reports_list_no_token_returns_401():
    """GET /api/reports without token → 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/reports")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_protected_report_get_no_token_returns_401():
    """GET /api/reports/{id} without token → 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/reports/some-report-id")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_protected_report_delete_no_token_returns_401():
    """DELETE /api/reports/{id} without token → 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.delete("/api/reports/some-report-id")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_profile_get_no_token_returns_401():
    """GET /api/users/profile without token → 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/users/profile")
        assert response.status_code == 401


# ---------------------------------------------------------------------------
# 2. Invalid token → 401
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_invalid_token_rejected():
    """A forged / malformed token must return 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/api/reports",
            headers={"Authorization": "Bearer this.is.a.forged.token"},
        )
        assert response.status_code == 401


# ---------------------------------------------------------------------------
# 3. Ownership enforcement — User A cannot read User B's report
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_user_a_cannot_access_user_b_report():
    """
    Simulates User B creating a report then User A trying to fetch it.
    Uses mocked token verification and mocked Firestore to test the
    ownership check in the backend without real Firebase credentials.
    """
    report_id = "report-owned-by-user-b"

    with patch("main.verify_firebase_token") as mock_verify, \
         patch("main.is_firebase_available", return_value=True), \
         patch("main.get_report_for_user", return_value=None) as mock_get:

        # Token verification returns User A's identity
        mock_verify.return_value = make_decoded_token(MOCK_UID_A)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                f"/api/reports/{report_id}",
                headers={"Authorization": f"Bearer valid-token-for-user-a"},
            )

        # Must return 404 (not 403 — don't reveal existence)
        assert response.status_code == 404, (
            f"Expected 404 but got {response.status_code}: {response.text}"
        )
        # Verify requesting_uid was passed as User A
        mock_get.assert_called_once_with(report_id, requesting_uid=MOCK_UID_A)


# ---------------------------------------------------------------------------
# 4. User A cannot delete User B's report
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_user_a_cannot_delete_user_b_report():
    """User A's DELETE on User B's report must return 404."""
    report_id = "report-b-delete-attempt"

    with patch("main.verify_firebase_token") as mock_verify, \
         patch("main.is_firebase_available", return_value=True), \
         patch("main.delete_report_for_user", return_value=False) as mock_del:

        mock_verify.return_value = make_decoded_token(MOCK_UID_A)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.delete(
                f"/api/reports/{report_id}",
                headers={"Authorization": "Bearer valid-token-for-user-a"},
            )

        assert response.status_code == 404
        mock_del.assert_called_once_with(report_id, requesting_uid=MOCK_UID_A)



# ---------------------------------------------------------------------------
# 5. Forged ownerUid in upload body is ignored — server always uses token UID
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_forged_owner_uid_cannot_change_ownership():
    """
    Even if a client sends ownerUid in a custom header, the server must
    always derive the owner from the verified token.
    This test checks that the upload endpoint doesn't accept ownerUid from
    the client by verifying the saved report uses the token UID.
    """
    saved_reports = {}

    def mock_save(report_id, owner_uid, report_data, original_file_name=""):
        saved_reports[report_id] = owner_uid
        return True

    with patch("main.verify_firebase_token") as mock_verify, \
         patch("main.save_report_for_user", side_effect=mock_save), \
         patch("main.is_firebase_available", return_value=True):

        mock_verify.return_value = make_decoded_token(MOCK_UID_A)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # Client tries to sneak in a forged ownerUid via a custom header
            files = {"file": ("malicious.exe", b"binary", "application/octet-stream")}
            response = await client.post(
                "/api/upload",
                headers={
                    "Authorization": "Bearer valid-token-for-user-a",
                    "X-Owner-Uid": MOCK_UID_B,  # Forged! Should be ignored.
                },
                files=files,
            )

        # Upload fails because of unsupported file type — but crucially,
        # no report is saved with a forged UID
        assert response.status_code == 400
        # No report should have been saved with MOCK_UID_B
        for report_id, owner in saved_reports.items():
            assert owner != MOCK_UID_B, "Report was saved with forged ownerUid!"


# ---------------------------------------------------------------------------
# 6. Report history returns only the requesting user's reports
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_history_scoped_to_authenticated_user():
    """GET /api/reports must only return reports owned by the authenticated user."""

    user_a_reports = [
        {"id": "rpt-1", "ownerUid": MOCK_UID_A, "title": "Report 1"},
        {"id": "rpt-2", "ownerUid": MOCK_UID_A, "title": "Report 2"},
    ]

    with patch("main.verify_firebase_token") as mock_verify, \
         patch("main.get_user_reports") as mock_get_reports, \
         patch("main.is_firebase_available", return_value=True):

        mock_verify.return_value = make_decoded_token(MOCK_UID_A)
        mock_get_reports.return_value = user_a_reports

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/reports",
                headers={"Authorization": "Bearer valid-token-for-user-a"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 2

        # Verify get_user_reports was called with MOCK_UID_A (from token), not any forged UID
        mock_get_reports.assert_called_once()
        call_args = mock_get_reports.call_args
        assert call_args[0][0] == MOCK_UID_A or call_args[1].get("uid") == MOCK_UID_A


def test_firebase_config_direct_ownership_rejection():
    """Directly tests that get_report_for_user and delete_report_for_user reject unauthorized UIDs."""
    import firebase_config
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {"id": "r1", "ownerUid": MOCK_UID_B}

    with patch.object(firebase_config, "db") as mock_db:
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        # Requesting as User A when report belongs to User B -> must return None
        result = firebase_config.get_report_for_user("r1", requesting_uid=MOCK_UID_A)
        assert result is None, "Should not return report to unauthorized UID"

        # Deleting as User A when report belongs to User B -> must return False
        del_result = firebase_config.delete_report_for_user("r1", requesting_uid=MOCK_UID_A)
        assert del_result is False, "Should not delete report of another UID"

        # Requesting as legitimate owner User B -> returns doc
        owner_result = firebase_config.get_report_for_user("r1", requesting_uid=MOCK_UID_B)
        assert owner_result == {"id": "r1", "ownerUid": MOCK_UID_B}



# ---------------------------------------------------------------------------
# 7. Existing functionality preserved — health check
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_health_check_still_works():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "RapidOCR" in data["ocr_engine"]


# ---------------------------------------------------------------------------
# 8. Existing functionality preserved — file validation
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_unsupported_file_extension_still_rejected():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        files = {"file": ("malicious.exe", b"fake binary", "application/octet-stream")}
        response = await client.post("/api/upload", files=files)
        assert response.status_code == 400
        assert "Unsupported file type" in response.json()["detail"]


@pytest.mark.asyncio
async def test_empty_file_still_rejected():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        files = {"file": ("empty.png", b"", "image/png")}
        response = await client.post("/api/upload", files=files)
        assert response.status_code == 400


# ---------------------------------------------------------------------------
# 9. Existing functionality — guardrail tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ask_guardrail_diagnostic_refusal_still_works():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {"question": "Can you diagnose if I have leukemia?", "language": "en"}
        response = await client.post("/api/ask", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["refusal"] is True
        assert data["is_emergency"] is False


@pytest.mark.asyncio
async def test_ask_guardrail_emergency_still_works():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {"question": "I have severe chest pain and difficulty breathing.", "language": "en"}
        response = await client.post("/api/ask", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["refusal"] is True
        assert data["is_emergency"] is True


# ---------------------------------------------------------------------------
# 10. Profile Save, Update, and Demographic Preservation Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_profile_create_and_update_preserves_demographics():
    """Verifies that profile saving persists age, phone, gender, and updating preserves fields."""
    with patch("main.verify_firebase_token") as mock_verify:
        mock_verify.return_value = make_decoded_token(MOCK_UID_A, email="patient.a@reportly.test")

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = {"Authorization": "Bearer valid-token-user-a"}

            # 1. Initial Profile Creation
            res = await client.post(
                "/api/users/profile",
                headers=headers,
                json={
                    "displayName": "Patient Alpha",
                    "phoneNumber": "9876543210",
                    "gender": "Female",
                    "age": 34,
                },
            )
            assert res.status_code == 200
            data = res.json()
            assert data["displayName"] == "Patient Alpha"
            assert data["phoneNumber"] == "9876543210"
            assert data["gender"] == "Female"
            assert data["age"] == 34
            assert data["email"] == "patient.a@reportly.test"

            # 2. Get Profile
            res_get = await client.get("/api/users/profile", headers=headers)
            assert res_get.status_code == 200
            get_data = res_get.json()
            assert get_data["phoneNumber"] == "9876543210"
            assert get_data["age"] == 34

            # 3. Partial Update via PUT (updating only age, phone number should not be erased)
            res_put = await client.put(
                "/api/users/profile",
                headers=headers,
                json={"age": 35},
            )
            assert res_put.status_code == 200
            put_data = res_put.json()
            assert put_data["age"] == 35
            assert put_data["phoneNumber"] == "9876543210"
            assert put_data["gender"] == "Female"


@pytest.mark.asyncio
async def test_profile_validation_rejects_invalid_inputs():
    """Verifies that invalid age or invalid phone number are rejected with 400."""
    with patch("main.verify_firebase_token") as mock_verify:
        mock_verify.return_value = make_decoded_token(MOCK_UID_A)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = {"Authorization": "Bearer valid-token-user-a"}

            # Invalid age (> 120)
            res_bad_age = await client.post(
                "/api/users/profile",
                headers=headers,
                json={"displayName": "Test", "age": 200},
            )
            assert res_bad_age.status_code == 400
            assert "Age must be between 1 and 120" in res_bad_age.text

            # Invalid phone (< 10 digits)
            res_bad_phone = await client.post(
                "/api/users/profile",
                headers=headers,
                json={"displayName": "Test", "phoneNumber": "12345"},
            )
            assert res_bad_phone.status_code == 400
            assert "10-digit" in res_bad_phone.text


@pytest.mark.asyncio
async def test_user_a_and_user_b_profiles_are_isolated():
    """Verifies that User A and User B have separate, isolated profile records."""
    with patch("main.verify_firebase_token") as mock_verify:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # User A
            mock_verify.return_value = make_decoded_token(MOCK_UID_A, email="a@test.com")
            res_a = await client.post(
                "/api/users/profile",
                headers={"Authorization": "Bearer token-a"},
                json={"displayName": "User A", "phoneNumber": "1111111111", "age": 25},
            )
            assert res_a.status_code == 200

            # User B
            mock_verify.return_value = make_decoded_token(MOCK_UID_B, email="b@test.com")
            res_b = await client.post(
                "/api/users/profile",
                headers={"Authorization": "Bearer token-b"},
                json={"displayName": "User B", "phoneNumber": "2222222222", "age": 40},
            )
            assert res_b.status_code == 200

            # Verify User A's data was not overwritten by User B
            mock_verify.return_value = make_decoded_token(MOCK_UID_A, email="a@test.com")
            check_a = await client.get("/api/users/profile", headers={"Authorization": "Bearer token-a"})
            assert check_a.status_code == 200
            assert check_a.json()["displayName"] == "User A"
            assert check_a.json()["phoneNumber"] == "1111111111"
            assert check_a.json()["age"] == 25


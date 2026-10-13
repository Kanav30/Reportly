"""
Automated Integration Tests for Reportly FastAPI Endpoints
===========================================================
Tests file upload constraints (size, format, empty file),
API health check, diagnostic refusal triggers, and emergency alerts.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from main import app

@pytest.mark.asyncio
async def test_health_check_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "RapidOCR" in data["ocr_engine"]

@pytest.mark.asyncio
async def test_unsupported_file_extension_rejected():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        files = {"file": ("malicious.exe", b"fake binary executable content", "application/octet-stream")}
        response = await client.post("/api/upload", files=files)
        assert response.status_code == 400
        assert "Unsupported file type" in response.json()["detail"]

@pytest.mark.asyncio
async def test_empty_file_rejected():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        files = {"file": ("empty.png", b"", "image/png")}
        response = await client.post("/api/upload", files=files)
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_oversized_file_rejected():
    # 16MB of dummy bytes (> 15MB limit)
    oversized_data = b"0" * (16 * 1024 * 1024)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        files = {"file": ("huge_report.pdf", oversized_data, "application/pdf")}
        response = await client.post("/api/upload", files=files)
        assert response.status_code == 413
        assert "exceeds maximum size" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_ask_guardrail_refuses_diagnostic_inquiry_english():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {"question": "Can you diagnose if I have leukemia?", "language": "en"}
        response = await client.post("/api/ask", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["refusal"] is True
        assert data["is_emergency"] is False
        assert "Diagnostic" in data["guardrail_triggered"]
        assert "cannot diagnose illnesses" in data["message"].lower()
        assert len(data["suggested_questions"]) >= 2

@pytest.mark.asyncio
async def test_ask_guardrail_refuses_prescriptive_inquiry_hindi():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {"question": "क्या मुझे कोई दवा या एंटीबायोटिक लेनी चाहिए?", "language": "hi"}
        response = await client.post("/api/ask", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["refusal"] is True
        assert "अस्वीकरण" in data["guardrail_triggered"]

@pytest.mark.asyncio
async def test_ask_guardrail_triggers_emergency_care_notice():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {"question": "I have severe chest pain and difficulty breathing, what should I do?", "language": "en"}
        response = await client.post("/api/ask", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["refusal"] is True
        assert data["is_emergency"] is True
        assert "Emergency" in data["guardrail_triggered"]
        assert "911 / 112" in data["message"]

@pytest.mark.asyncio
async def test_ask_guardrail_allows_educational_question():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {"question": "What does Mean Corpuscular Volume (MCV) measure?", "language": "en"}
        response = await client.post("/api/ask", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["refusal"] is False
        assert data["is_emergency"] is False
        assert data["guardrail_triggered"] is None
        assert "Complete Blood Count" in data["message"] or "parameter" in data["message"].lower()

@pytest.mark.asyncio
async def test_firebase_persistence_endpoints():
    from firebase_config import is_firebase_available, save_report_summary
    if is_firebase_available():
        test_id = "test-e2e-report-id"
        test_data = {
            "title": "E2E Test Report",
            "subtitle": "Test Subtitle",
            "parameters": [{"name": "Hemoglobin", "value": "14.0", "status": "Within Range"}],
            "patterns": [],
            "questions": ["Test Question?"]
        }
        saved = save_report_summary(test_id, test_data)
        assert saved is True

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.get(f"/api/reports/{test_id}")
            assert res.status_code == 200
            data = res.json()
            assert data["title"] == "E2E Test Report"
            assert data["id"] == test_id


@pytest.mark.asyncio
async def test_cors_allows_localhost_and_render_domains():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Test localhost origin
        res_local = await client.options(
            "/api/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET"
            }
        )
        assert res_local.headers.get("access-control-allow-origin") == "http://localhost:5173"

        # Test deployed Render frontend origin
        res_render = await client.options(
            "/api/health",
            headers={
                "Origin": "https://reportly-frontend.onrender.com",
                "Access-Control-Request-Method": "GET"
            }
        )
        assert res_render.headers.get("access-control-allow-origin") == "https://reportly-frontend.onrender.com"

        # Test deployed Render backend self-origin
        res_backend = await client.options(
            "/api/health",
            headers={
                "Origin": "https://reportly-backend-9xug.onrender.com",
                "Access-Control-Request-Method": "GET"
            }
        )
        assert res_backend.headers.get("access-control-allow-origin") == "https://reportly-backend-9xug.onrender.com"


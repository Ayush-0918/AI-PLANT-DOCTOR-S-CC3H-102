import unittest
from unittest.mock import AsyncMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes.ai import router as ai_router
from app.api.routes.voice import router as voice_router
from app.core.errors import register_error_handlers


class V1RouteTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        register_error_handlers(app)
        app.include_router(ai_router, prefix="/api/v1")
        app.include_router(voice_router, prefix="/api/v1")
        self.client = TestClient(app)

    def test_dosage_route(self):
        response = self.client.post(
            "/api/v1/ai/dosage",
            json={
                "crop": "Tomato",
                "area_acres": 2.5,
                "disease": "Tomato___Early_blight",
            },
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("dosage_exact", payload)
        self.assertIn("instructions", payload)

    def test_voice_route(self):
        response = self.client.post(
            "/api/v1/voice/intent",
            data={"text": "mausam batao", "lang": "हिंदी"},
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["mapped_intent"], "check_weather")
        self.assertIn("assistant_response", payload)

    def test_soil_scan_route_returns_bill_when_model_succeeds(self):
        with patch("app.api.routes.ai.run_soil_inference", new_callable=AsyncMock) as mock_inference:
            mock_inference.return_value = {
                "success": True,
                "diagnosis": "Alluvial_Soil",
                "confidence": 96.2,
                "model_version": "custom-soil-v1",
            }
            with patch("app.api.routes.ai.pytesseract", None):
                response = self.client.post(
                    "/api/v1/ai/soil-scan",
                    data={"crop": "Wheat", "area_acres": "2.5"},
                    files={"image": ("soil.jpg", b"fake-bytes", "image/jpeg")},
                )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["success"])
        self.assertEqual(payload["soil_type"], "Alluvial Soil")
        self.assertIn("estimated_cost", payload)
        self.assertIn("recommended_fertilizers", payload)
        self.assertGreater(len(payload["recommended_fertilizers"]), 0)


if __name__ == "__main__":
    unittest.main()

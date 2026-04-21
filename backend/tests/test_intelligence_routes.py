import unittest

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes.intelligence import router as intelligence_router
from app.core.errors import register_error_handlers


class IntelligenceRouteTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        register_error_handlers(app)
        app.include_router(intelligence_router, prefix="/api/v1")
        self.client = TestClient(app)

    def test_crop_lifecycle_contract(self):
        response = self.client.get(
            "/api/v1/intelligence/crop-lifecycle",
            params={"crop": "Wheat", "sowing_date": "2026-03-01", "window_days": 90},
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["success"])
        self.assertIn("tasks", payload)
        self.assertGreater(len(payload["tasks"]), 0)

    def test_roi_dashboard_contract(self):
        response = self.client.get(
            "/api/v1/intelligence/roi-dashboard",
            params={"crop": "Wheat", "area_acres": 2.5, "soil_type": "loamy", "growth_stage": "vegetative"},
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["success"])
        self.assertIn("investment", payload)
        self.assertIn("income", payload)
        self.assertIn("market", payload)

    def test_smart_irrigation_contract(self):
        response = self.client.get(
            "/api/v1/intelligence/smart-irrigation",
            params={"crop": "Wheat", "soil_type": "loamy", "lat": 25.5, "lon": 85.1},
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["success"])
        self.assertIn("recommendation", payload)
        self.assertIn("week_plan", payload)


if __name__ == "__main__":
    unittest.main()

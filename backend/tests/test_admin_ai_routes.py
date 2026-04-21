import unittest

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api import deps as api_deps
from app.api.routes.admin_ai import router as admin_ai_router
from app.core.errors import register_error_handlers


class AdminAiRouteTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        register_error_handlers(app)
        app.include_router(admin_ai_router, prefix="/api/v1")
        app.dependency_overrides[api_deps.get_admin_user] = lambda: {
            "user_id": "admin-1",
            "role": "admin",
            "name": "Admin",
            "phone_number": "+911111111111",
        }
        self.client = TestClient(app)
        self.app = app

    def tearDown(self):
        self.app.dependency_overrides.clear()

    def test_readiness_endpoint_contract(self):
        response = self.client.get("/api/v1/admin/ai/readiness")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("readiness_score_pct", payload)
        self.assertIn("checks", payload)
        self.assertIsInstance(payload["checks"], list)

    def test_model_accuracy_contract(self):
        response = self.client.get("/api/v1/admin/ai/model/accuracy")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("active_model", payload)
        self.assertIn("feedback_summary", payload)
        self.assertIn("field_validation", payload)


if __name__ == "__main__":
    unittest.main()

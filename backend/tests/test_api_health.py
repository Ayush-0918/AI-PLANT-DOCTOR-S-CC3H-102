import unittest

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes.health import router as health_router
from app.core.errors import register_error_handlers


class HealthApiTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        register_error_handlers(app)
        app.include_router(health_router, prefix="/api/v1")
        self.client = TestClient(app)

    def test_health_endpoint(self):
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("status", data)
        self.assertIn("dependencies", data)


if __name__ == "__main__":
    unittest.main()


import unittest
from dataclasses import replace

from fastapi.testclient import TestClient

import app.main as app_main


class LegacyApiGateTests(unittest.TestCase):
    def setUp(self):
        self.original_settings = app_main.settings
        app_main.settings = replace(app_main.settings, enable_legacy_api=False)
        self.client = TestClient(app_main.app)

    def tearDown(self):
        app_main.settings = self.original_settings

    def test_blocks_legacy_scan_route(self):
        response = self.client.post("/api/ai/dosage", json={"crop": "Tomato", "area_acres": 1})
        self.assertEqual(response.status_code, 410)
        payload = response.json()
        self.assertEqual(payload["error"], "legacy_api_disabled")

    def test_allows_v1_scan_route(self):
        response = self.client.post(
            "/api/v1/ai/dosage",
            json={"crop": "Tomato", "area_acres": 1, "disease": "Tomato___Early_blight"},
        )
        self.assertEqual(response.status_code, 200)


if __name__ == "__main__":
    unittest.main()

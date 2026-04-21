import asyncio
import unittest

import app.services.ai_inference_service as inference_service


class FakeModel:
    def predict(self, _image_bytes):
        return {
            "success": True,
            "diagnosis": "Tomato___Early_blight",
            "confidence": 41.0,
            "class_id": "PV_29",
            "treatment": {"medicine": "X", "dosage": "Y", "instructions": "Z"},
        }


class InferenceFallbackTests(unittest.TestCase):
    def test_low_confidence_escalation(self):
        original = inference_service.ai_model
        inference_service.ai_model = FakeModel()
        try:
            result = asyncio.run(
                inference_service.run_scan_inference(
                    db=None,
                    image_bytes=b"not-a-real-image",
                    lat=25.0,
                    lon=85.0,
                    user_id="user-1",
                    source="test",
                )
            )
            self.assertTrue(result["success"])
            self.assertTrue(result["escalation_required"])
            self.assertEqual(result["escalation_reason"], "low_confidence")
        finally:
            inference_service.ai_model = original


if __name__ == "__main__":
    unittest.main()


import asyncio
import unittest

from app.core.errors import ValidationError
from app.services.expert_call_service import (
    parse_call_status_payload,
    update_call_status_from_webhook,
)


class ExpertCallWebhookTests(unittest.TestCase):
    def test_parse_call_status_payload_completed(self):
        parsed = parse_call_status_payload(
            {
                "id": "call_123",
                "status": "ended",
                "durationSeconds": 93,
            }
        )
        self.assertEqual(parsed["call_id"], "call_123")
        self.assertEqual(parsed["status"], "completed")
        self.assertEqual(parsed["duration_seconds"], 93)

    def test_parse_call_status_payload_missing_id(self):
        with self.assertRaises(ValidationError):
            parse_call_status_payload({"status": "completed"})

    def test_update_call_status_without_db(self):
        result = asyncio.run(
            update_call_status_from_webhook(
                None,
                {"id": "call_777", "status": "failed"},
            )
        )
        self.assertFalse(result["updated"])
        self.assertEqual(result["call_id"], "call_777")


if __name__ == "__main__":
    unittest.main()

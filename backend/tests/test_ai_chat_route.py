import unittest

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes.ai_chat import router as ai_chat_router
from app.core.errors import register_error_handlers


class AiChatRouteTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        register_error_handlers(app)
        app.include_router(ai_chat_router, prefix="/api/v1")
        self.client = TestClient(app)

    def test_chat_route_contract(self):
        response = self.client.post(
            "/api/v1/ai/chat",
            json={
                "message": "mandi bhav batao",
                "history": [],
            },
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("success", payload)
        self.assertIn("response", payload)


if __name__ == "__main__":
    unittest.main()

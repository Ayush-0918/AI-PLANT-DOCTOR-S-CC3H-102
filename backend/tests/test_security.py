import unittest

from app.core.security import create_access_token, decode_access_token, hash_password, verify_password


class SecurityTests(unittest.TestCase):
    def test_password_hash_round_trip(self):
        raw = "StrongPass123!"
        hashed = hash_password(raw)
        self.assertTrue(verify_password(raw, hashed))
        self.assertFalse(verify_password("wrong-pass", hashed))

    def test_jwt_round_trip(self):
        token = create_access_token({"sub": "user-123", "role": "farmer"}, expires_in_minutes=5)
        payload = decode_access_token(token)
        self.assertEqual(payload["sub"], "user-123")
        self.assertEqual(payload["role"], "farmer")


if __name__ == "__main__":
    unittest.main()


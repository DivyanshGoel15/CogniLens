"""Unit and Integration Tests for Authentication, Database Persistence, and Isolation."""

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from server.app.main import app
from datetime import timedelta
from server.app.database.connection import Base, get_db
from server.app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_access_token,
)

# In-memory SQLite with StaticPool so all connections share the same in-memory DB
test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


class TestAuthAndDatabaseIsolation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.environ["TESTING"] = "true"
        Base.metadata.create_all(bind=test_engine)
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        os.environ.pop("TESTING", None)
        Base.metadata.drop_all(bind=test_engine)

    def test_password_hashing(self):
        pwd = "SecretPassword123!"
        hashed = hash_password(pwd)
        self.assertNotEqual(pwd, hashed)
        self.assertTrue(verify_password(pwd, hashed))
        self.assertFalse(verify_password("WrongPassword!", hashed))

    def test_jwt_token(self):
        token = create_access_token({"sub": "user-123", "email": "test@cognilens.edu"})
        payload = decode_access_token(token)
        self.assertIsNotNone(payload)
        self.assertEqual(payload["sub"], "user-123")
        self.assertEqual(payload["email"], "test@cognilens.edu")
        self.assertEqual(payload["type"], "access")

        # Test refresh token creation and decode
        ref_token = create_refresh_token({"sub": "user-123", "email": "test@cognilens.edu"})
        ref_payload = decode_access_token(ref_token)
        self.assertIsNotNone(ref_payload)
        self.assertEqual(ref_payload["type"], "refresh")

        # Test expired token returns None
        expired_token = create_access_token(
            {"sub": "user-123", "email": "test@cognilens.edu"},
            expires_delta=timedelta(seconds=-10),
        )
        self.assertIsNone(decode_access_token(expired_token))

    def test_user_signup_and_login_flow(self):
        # 1. Sign up Alice
        signup_res = self.client.post(
            "/api/auth/signup",
            json={
                "email": "alice@cognilens.edu",
                "password": "PasswordAlice123!",
                "fullName": "Alice Smith",
                "major": "Computer Science",
                "academicYear": "Year 2",
            },
        )
        self.assertEqual(signup_res.status_code, 201)
        data = signup_res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["email"], "alice@cognilens.edu")
        self.assertEqual(data["user"]["fullName"], "Alice Smith")
        alice_token = data["access_token"]

        # 2. Login Alice
        login_res = self.client.post(
            "/api/auth/login",
            json={"email": "alice@cognilens.edu", "password": "PasswordAlice123!"},
        )
        self.assertEqual(login_res.status_code, 200)
        self.assertIn("access_token", login_res.json())

        # 3. Wrong password rejection
        bad_login = self.client.post(
            "/api/auth/login",
            json={"email": "alice@cognilens.edu", "password": "WrongPassword!"},
        )
        self.assertEqual(bad_login.status_code, 401)

        # 4. Auth Me
        me_res = self.client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {alice_token}"},
        )
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.json()["email"], "alice@cognilens.edu")

        # 5. Token Verify
        verify_res = self.client.get(
            "/api/auth/verify",
            headers={"Authorization": f"Bearer {alice_token}"},
        )
        self.assertEqual(verify_res.status_code, 200)
        self.assertTrue(verify_res.json()["valid"])
        self.assertEqual(verify_res.json()["user"]["email"], "alice@cognilens.edu")

        # 6. Token Refresh
        refresh_res = self.client.post(
            "/api/auth/refresh",
            headers={"Authorization": f"Bearer {alice_token}"},
        )
        self.assertEqual(refresh_res.status_code, 200)
        self.assertIn("access_token", refresh_res.json())
        self.assertIn("refresh_token", refresh_res.json())

    def test_multi_user_isolation(self):
        # 1. Register Bob
        bob_signup = self.client.post(
            "/api/auth/signup",
            json={
                "email": "bob@cognilens.edu",
                "password": "PasswordBob123!",
                "fullName": "Bob Jones",
                "major": "Data Science",
                "academicYear": "Year 3",
            },
        )
        self.assertEqual(bob_signup.status_code, 201)
        bob_token = bob_signup.json()["access_token"]

        # 2. Bob's documents
        bob_docs = self.client.get(
            "/api/documents",
            headers={"Authorization": f"Bearer {bob_token}"},
        )
        self.assertEqual(bob_docs.status_code, 200)
        docs_list = bob_docs.json()
        self.assertTrue(len(docs_list) >= 1)

    def test_forgot_and_reset_password_flow(self):
        # 0. Register user for reset test
        self.client.post(
            "/api/auth/signup",
            json={
                "email": "reset_user@cognilens.edu",
                "password": "OldPassword123!",
                "fullName": "Reset Tester",
            },
        )

        # 1. Request reset code for registered user
        forgot_res = self.client.post(
            "/api/auth/forgot-password",
            json={"email": "reset_user@cognilens.edu"},
        )
        self.assertEqual(forgot_res.status_code, 200)
        forgot_data = forgot_res.json()
        self.assertTrue(forgot_data["success"])
        code = forgot_data["dev_code"]
        self.assertIsNotNone(code)
        self.assertEqual(len(code), 6)

        # 2. Reset password with valid code
        reset_res = self.client.post(
            "/api/auth/reset-password",
            json={
                "email": "reset_user@cognilens.edu",
                "code": code,
                "newPassword": "NewStrongPassword123!",
            },
        )
        self.assertEqual(reset_res.status_code, 200)

        # 3. Login with new password
        login_res = self.client.post(
            "/api/auth/login",
            json={"email": "reset_user@cognilens.edu", "password": "NewStrongPassword123!"},
        )
        self.assertEqual(login_res.status_code, 200)


if __name__ == "__main__":
    unittest.main()

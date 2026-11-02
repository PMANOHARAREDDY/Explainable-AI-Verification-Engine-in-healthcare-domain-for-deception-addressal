from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from unittest.mock import patch

class VerificationAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.verify_url = '/api/verify/'

    @patch('verification.engine.VerificationEngine')
    def test_verify_endpoint(self, MockEngine):
        # Setup mock return value
        mock_instance = MockEngine.return_value
        mock_instance.verify.return_value = {
            "query": "Is aspirin safe?",
            "raw_response": "Aspirin is safe.",
            "claims": [
                {
                    "text": "Aspirin is safe.",
                    "status": "VERIFIED",
                    "confidence": 0.95,
                    "evidence": []
                }
            ],
            "trust_score": 100.0
        }

        # Mock get_engine to return our mock instance
        with patch('verification.views.get_engine', return_value=mock_instance):
            data = {
                "query": "Is aspirin safe?",
                "response_text": "Aspirin is safe."
            }
            response = self.client.post(self.verify_url, data, format='json')
            
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data['trust_score'], 100.0)
            self.assertEqual(len(response.data['claims']), 1)
            self.assertEqual(response.data['claims'][0]['status'], 'VERIFIED')

    def test_missing_response_text(self):
        data = {"query": "Test"}
        response = self.client.post(self.verify_url, data, format='json')
        self.assertEqual(response.status_code, 400)


class AuthAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.session_url = '/api/auth/session/'
        self.login_url = '/api/auth/login/'
        self.register_url = '/api/auth/register/'
        self.logout_url = '/api/auth/logout/'
        self.user = User.objects.create_user(username='testdoctor', password='password123')

    def test_session_unauthenticated(self):
        response = self.client.get(self.session_url)
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['authenticated'])

    def test_register_success(self):
        data = {'username': 'newdoctor', 'password': 'securepassword'}
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        self.assertTrue(User.objects.filter(username='newdoctor').exists())

    def test_register_duplicate(self):
        data = {'username': 'testdoctor', 'password': 'password123'}
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['message'], 'Username already exists.')

    def test_register_missing_fields(self):
        data = {'username': 'incompletedoc'}
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['success'])

    def test_login_success_and_session(self):
        data = {'username': 'testdoctor', 'password': 'password123'}
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])

        # Now test session endpoint when logged in
        session_resp = self.client.get(self.session_url)
        self.assertEqual(session_resp.status_code, 200)
        self.assertTrue(session_resp.data['authenticated'])
        self.assertEqual(session_resp.data['user']['username'], 'testdoctor')

    def test_login_invalid_credentials(self):
        data = {'username': 'testdoctor', 'password': 'wrongpassword'}
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['message'], 'Invalid username or password.')

    def test_logout(self):
        # First login
        self.client.login(username='testdoctor', password='password123')
        session_resp = self.client.get(self.session_url)
        self.assertTrue(session_resp.data['authenticated'])

        # Logout
        logout_resp = self.client.post(self.logout_url)
        self.assertEqual(logout_resp.status_code, 200)
        self.assertTrue(logout_resp.data['success'])

        # Check session after logout
        session_resp_after = self.client.get(self.session_url)
        self.assertFalse(session_resp_after.data['authenticated'])

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny
from verification.engine import get_engine

class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return  # Bypass CSRF check for API endpoints

class SessionAPIView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            return Response({
                "authenticated": True,
                "user": {
                    "id": request.user.id,
                    "username": request.user.username,
                    "email": request.user.email,
                }
            }, status=status.HTTP_200_OK)
        return Response({"authenticated": False}, status=status.HTTP_200_OK)

class LoginAPIView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')

        if not username or not password:
            return Response({
                "success": False,
                "message": "Username and password are required."
            }, status=status.HTTP_200_OK)

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return Response({
                "success": True,
                "message": "Login successful.",
                "user": {
                    "id": user.id,
                    "username": user.username,
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                "success": False,
                "message": "Invalid username or password."
            }, status=status.HTTP_200_OK)

class RegisterAPIView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')

        if not username or not password:
            return Response({
                "success": False,
                "message": "Username and password are required."
            }, status=status.HTTP_200_OK)

        if User.objects.filter(username=username).exists():
            return Response({
                "success": False,
                "message": "Username already exists."
            }, status=status.HTTP_200_OK)

        user = User.objects.create_user(username=username, password=password)
        return Response({
            "success": True,
            "message": "User registered successfully."
        }, status=status.HTTP_200_OK)

class LogoutAPIView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [AllowAny]

    def post(self, request):
        logout(request)
        return Response({
            "success": True,
            "message": "Logged out successfully."
        }, status=status.HTTP_200_OK)

class VerifyAPIView(APIView):
    def post(self, request):
        query = request.data.get('query', '')
        response_text = request.data.get('response_text', '')
        
        if not response_text:
            return Response({"error": "response_text is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            engine = get_engine()
            result = engine.verify(query, response_text)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GenerateAndVerifyAPIView(APIView):
    def post(self, request):
        query = request.data.get('query', '')
        
        if not query:
            return Response({"error": "query is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Basic mock LLM generation based on keywords
        q_lower = query.lower()
        if "aspirin" in q_lower:
            mock_generated_response = "Aspirin should not be given to children or teenagers with viral infections due to the risk of Reye's syndrome. It is unsafe."
        elif "vaccine" in q_lower:
            mock_generated_response = "Vaccines are effective at preventing many serious diseases and do not cause autism."
        elif "cancer" in q_lower:
            mock_generated_response = "Drinking water cures all forms of cancer instantly." # intentional hallucination test
        else:
            mock_generated_response = "This is a dynamically generated response for your medical query. The system will now verify it against the knowledge base."
            
        try:
            engine = get_engine()
            result = engine.verify(query, mock_generated_response)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

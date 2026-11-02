from django.urls import path
from verification.views import (
    VerifyAPIView,
    GenerateAndVerifyAPIView,
    SessionAPIView,
    LoginAPIView,
    RegisterAPIView,
    LogoutAPIView,
)

urlpatterns = [
    path('verify/', VerifyAPIView.as_view(), name='verify'),
    path('generate-and-verify/', GenerateAndVerifyAPIView.as_view(), name='generate_and_verify'),
    path('auth/session/', SessionAPIView.as_view(), name='auth_session'),
    path('auth/login/', LoginAPIView.as_view(), name='auth_login'),
    path('auth/register/', RegisterAPIView.as_view(), name='auth_register'),
    path('auth/logout/', LogoutAPIView.as_view(), name='auth_logout'),
]

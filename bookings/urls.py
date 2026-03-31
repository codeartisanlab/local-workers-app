from django.urls import path

from .views import (
    BookingCreateAPIView,
    BookingMessageListCreateAPIView,
    NearbyWorkerListAPIView,
    OTPRequestAPIView,
    OTPVerifyAPIView,
    ServiceListAPIView,
    WorkerProfileDetailAPIView,
    WorkerVerificationAdminAPIView,
    WorkerVerificationUploadAPIView,
    WorkerJobRejectionAPIView,
    WorkerJobAcceptanceAPIView,
    WorkerNotificationListAPIView,
)

urlpatterns = [
    path("auth/request-otp/", OTPRequestAPIView.as_view(), name="request-otp"),
    path("auth/verify-otp/", OTPVerifyAPIView.as_view(), name="verify-otp"),
    path("services/", ServiceListAPIView.as_view(), name="service-list"),
    path("workers/nearby/", NearbyWorkerListAPIView.as_view(), name="nearby-workers"),
    path("workers/<int:pk>/", WorkerProfileDetailAPIView.as_view(), name="worker-detail"),
    path("worker/verification/upload/", WorkerVerificationUploadAPIView.as_view(), name="worker-verification-upload"),
    path("admin/workers/<int:worker_profile_id>/verification/", WorkerVerificationAdminAPIView.as_view(), name="worker-verification-admin"),
    path("bookings/", BookingCreateAPIView.as_view(), name="booking-create"),
    path("bookings/<int:booking_id>/messages/", BookingMessageListCreateAPIView.as_view(), name="booking-messages"),
    path("worker/jobs/", WorkerNotificationListAPIView.as_view(), name="worker-jobs"),
    path("bookings/accept/", WorkerJobAcceptanceAPIView.as_view(), name="booking-accept"),
    path("bookings/reject/", WorkerJobRejectionAPIView.as_view(), name="booking-reject"),
]

from django.urls import path

from .views import (
    AdminAnalyticsAPIView,
    BookingCancelAPIView,
    BookingCreateAPIView,
    BookingMessageListCreateAPIView,
    BookingRescheduleAPIView,
    BookingReviewAPIView,
    CouponApplyAPIView,
    CustomerAddressDetailAPIView,
    CustomerAddressListCreateAPIView,
    DisputeCreateAPIView,
    FCMTokenAPIView,
    HealthCheckAPIView,
    NearbyWorkerListAPIView,
    OTPRequestAPIView,
    OTPVerifyAPIView,
    PaymentCreateOrderAPIView,
    PaymentRefundAPIView,
    PaymentVerifyAPIView,
    SearchAPIView,
    ServiceCategoryListAPIView,
    ServiceListAPIView,
    ServicesByCategoryAPIView,
    WorkerEarningsAPIView,
    WorkerJobAcceptanceAPIView,
    WorkerJobRejectionAPIView,
    WorkerLocationUpdateAPIView,
    WorkerNotificationListAPIView,
    WorkerProfileDetailAPIView,
    WorkerSlotsAPIView,
    WorkerVerificationAdminAPIView,
    WorkerVerificationUploadAPIView,
)

urlpatterns = [
    # Auth
    path("auth/request-otp/", OTPRequestAPIView.as_view(), name="request-otp"),
    path("auth/verify-otp/", OTPVerifyAPIView.as_view(), name="verify-otp"),

    # Phase 1 – Services & Categories
    path("services/", ServiceListAPIView.as_view(), name="service-list"),
    path("categories/", ServiceCategoryListAPIView.as_view(), name="category-list"),
    path("categories/<int:category_id>/services/", ServicesByCategoryAPIView.as_view(), name="category-services"),

    # Workers
    path("workers/nearby/", NearbyWorkerListAPIView.as_view(), name="nearby-workers"),
    path("workers/<int:pk>/", WorkerProfileDetailAPIView.as_view(), name="worker-detail"),
    path("workers/<int:worker_id>/slots/", WorkerSlotsAPIView.as_view(), name="worker-slots"),

    # Worker self-management
    path("worker/verification/upload/", WorkerVerificationUploadAPIView.as_view(), name="worker-verification-upload"),
    path("worker/jobs/", WorkerNotificationListAPIView.as_view(), name="worker-jobs"),
    path("worker/earnings/", WorkerEarningsAPIView.as_view(), name="worker-earnings"),
    path("worker/location/", WorkerLocationUpdateAPIView.as_view(), name="worker-location"),

    # Admin
    path("admin/workers/<int:worker_profile_id>/verification/", WorkerVerificationAdminAPIView.as_view(), name="worker-verification-admin"),
    path("admin/analytics/", AdminAnalyticsAPIView.as_view(), name="admin-analytics"),

    # Bookings
    path("bookings/", BookingCreateAPIView.as_view(), name="booking-create"),
    path("bookings/accept/", WorkerJobAcceptanceAPIView.as_view(), name="booking-accept"),
    path("bookings/reject/", WorkerJobRejectionAPIView.as_view(), name="booking-reject"),
    path("bookings/<int:booking_id>/messages/", BookingMessageListCreateAPIView.as_view(), name="booking-messages"),
    path("bookings/<int:booking_id>/cancel/", BookingCancelAPIView.as_view(), name="booking-cancel"),
    path("bookings/<int:booking_id>/reschedule/", BookingRescheduleAPIView.as_view(), name="booking-reschedule"),
    path("bookings/<int:booking_id>/review/", BookingReviewAPIView.as_view(), name="booking-review"),

    # Phase 2 – Addresses
    path("addresses/", CustomerAddressListCreateAPIView.as_view(), name="address-list-create"),
    path("addresses/<int:pk>/", CustomerAddressDetailAPIView.as_view(), name="address-detail"),

    # Phase 3 – Payments
    path("payments/create-order/", PaymentCreateOrderAPIView.as_view(), name="payment-create-order"),
    path("payments/verify/", PaymentVerifyAPIView.as_view(), name="payment-verify"),
    path("payments/refund/", PaymentRefundAPIView.as_view(), name="payment-refund"),

    # Phase 4 – FCM token
    path("users/fcm-token/", FCMTokenAPIView.as_view(), name="fcm-token"),

    # Phase 6 – Search & Coupons
    path("search/", SearchAPIView.as_view(), name="search"),
    path("coupons/apply/", CouponApplyAPIView.as_view(), name="coupon-apply"),

    # Phase 8 – Disputes
    path("disputes/", DisputeCreateAPIView.as_view(), name="dispute-create"),

    # Phase 9 – Health
    path("health/", HealthCheckAPIView.as_view(), name="health-check"),
]

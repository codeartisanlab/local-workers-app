import uuid
from datetime import datetime, time, timedelta

from django.db.models import Avg, Count, Sum
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Booking,
    BlockedSlot,
    BookingMessage,
    BookingNotification,
    Coupon,
    CouponUse,
    CustomerAddress,
    Dispute,
    FCMToken,
    Payment,
    Service,
    ServiceCategory,
    User,
    WorkerAvailability,
    WorkerEarning,
    WorkerLocationUpdate,
    WorkerProfile,
)
from .serializers import (
    BookingCreateSerializer,
    BookingMessageCreateSerializer,
    BookingMessageSerializer,
    BookingNotificationSerializer,
    BookingSerializer,
    CouponSerializer,
    CustomerAddressSerializer,
    DisputeSerializer,
    FCMTokenSerializer,
    NearbyWorkerQuerySerializer,
    OTPRequestSerializer,
    OTPVerifySerializer,
    PaymentSerializer,
    ServiceCategoryDetailSerializer,
    ServiceCategorySerializer,
    ServiceDetailSerializer,
    ServiceSerializer,
    WorkerAvailabilitySerializer,
    WorkerBankAccountSerializer,
    WorkerBookingAcceptanceSerializer,
    WorkerBookingRejectionSerializer,
    WorkerEarningSerializer,
    WorkerProfileDetailsSerializer,
    WorkerProfileSerializer,
    WorkerReviewCreateSerializer,
    WorkerVerificationAdminSerializer,
    WorkerVerificationUploadSerializer,
)


class AllowAnyForAuth(permissions.BasePermission):
    def has_permission(self, request, view):
        return True


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


# ---------------------------------------------------------------------------
# Auth (unchanged)
# ---------------------------------------------------------------------------


class OTPRequestAPIView(APIView):
    permission_classes = [AllowAnyForAuth]

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        otp = serializer.save()
        return Response(
            {
                "message": "OTP generated successfully.",
                "phone": otp.phone,
                "otp": otp.code,
                "expires_at": otp.expires_at,
            },
            status=status.HTTP_201_CREATED,
        )


class OTPVerifyAPIView(APIView):
    permission_classes = [AllowAnyForAuth]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.save()
        return Response(data, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Phase 1 – Service Catalog & Pricing
# ---------------------------------------------------------------------------


class ServiceListAPIView(generics.ListAPIView):
    queryset = Service.objects.all().order_by("name")
    serializer_class = ServiceSerializer
    permission_classes = [AllowAnyForAuth]


class ServiceCategoryListAPIView(APIView):
    permission_classes = [AllowAnyForAuth]

    def get(self, request):
        categories = ServiceCategory.objects.filter(is_active=True, parent__isnull=True).prefetch_related(
            "subcategories", "services", "services__packages"
        )
        return Response(ServiceCategoryDetailSerializer(categories, many=True).data)


class ServicesByCategoryAPIView(APIView):
    permission_classes = [AllowAnyForAuth]

    def get(self, request, category_id):
        category = generics.get_object_or_404(ServiceCategory, pk=category_id, is_active=True)
        services = Service.objects.filter(category=category).prefetch_related("packages")
        return Response(ServiceDetailSerializer(services, many=True).data)


# ---------------------------------------------------------------------------
# Workers
# ---------------------------------------------------------------------------


class NearbyWorkerListAPIView(APIView):
    permission_classes = [AllowAnyForAuth]

    def get(self, request):
        serializer = NearbyWorkerQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        workers = serializer.get_nearby_workers()
        return Response(WorkerProfileSerializer(workers, many=True).data, status=status.HTTP_200_OK)


class WorkerProfileDetailAPIView(generics.RetrieveAPIView):
    queryset = WorkerProfile.objects.select_related("user").prefetch_related(
        "portfolio_images", "reviews", "worker_skills__skill"
    )
    serializer_class = WorkerProfileDetailsSerializer
    permission_classes = [AllowAnyForAuth]


class WorkerVerificationUploadAPIView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if request.user.role != User.Role.WORKER:
            return Response({"detail": "Only workers can upload verification documents."}, status=status.HTTP_403_FORBIDDEN)
        worker_profile = getattr(request.user, "worker_profile", None)
        if worker_profile is None:
            return Response({"detail": "Worker profile not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = WorkerVerificationUploadSerializer(worker_profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        return Response(WorkerProfileSerializer(profile).data, status=status.HTTP_200_OK)


class WorkerVerificationAdminAPIView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, worker_profile_id):
        worker_profile = generics.get_object_or_404(WorkerProfile.objects.select_related("user"), pk=worker_profile_id)
        serializer = WorkerVerificationAdminSerializer(worker_profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        return Response(WorkerProfileSerializer(profile).data, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Phase 2 – Slot Availability
# ---------------------------------------------------------------------------


class WorkerSlotsAPIView(APIView):
    permission_classes = [AllowAnyForAuth]

    def get(self, request, worker_id):
        worker_profile = generics.get_object_or_404(WorkerProfile, pk=worker_id)
        date_str = request.query_params.get("date")
        if not date_str:
            return Response({"detail": "date query param required (YYYY-MM-DD)."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response({"detail": "Invalid date format."}, status=status.HTTP_400_BAD_REQUEST)

        day_of_week = target_date.weekday()
        try:
            availability = WorkerAvailability.objects.get(worker_profile=worker_profile, day_of_week=day_of_week)
        except WorkerAvailability.DoesNotExist:
            return Response([], status=status.HTTP_200_OK)

        blocked = BlockedSlot.objects.filter(worker_profile=worker_profile, date=target_date)
        blocked_ranges = [(b.start_time, b.end_time) for b in blocked]

        slots = []
        slot_duration = timedelta(hours=1)
        current = datetime.combine(target_date, availability.start_time)
        end_dt = datetime.combine(target_date, availability.end_time)

        while current + slot_duration <= end_dt:
            slot_start = current.time()
            slot_end = (current + slot_duration).time()
            overlaps = any(
                not (slot_end <= bs or slot_start >= be)
                for bs, be in blocked_ranges
            )
            if not overlaps:
                slots.append({"start_time": slot_start.strftime("%H:%M"), "end_time": slot_end.strftime("%H:%M")})
            current += slot_duration

        return Response(slots, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Bookings
# ---------------------------------------------------------------------------


class BookingCreateAPIView(generics.CreateAPIView):
    serializer_class = BookingCreateSerializer

    def create(self, request, *args, **kwargs):
        if request.user.role != User.Role.CUSTOMER:
            return Response(
                {"detail": "Only customers can create bookings."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        booking = Booking.objects.select_related("user", "worker", "service").get(pk=booking.pk)
        data = BookingSerializer(booking).data
        data["notified_workers_count"] = booking.notifications.count()
        return Response(data, status=status.HTTP_201_CREATED)


class BookingCancelAPIView(APIView):
    def post(self, request, booking_id):
        booking = generics.get_object_or_404(Booking, pk=booking_id, user=request.user)
        if booking.status not in [Booking.Status.PENDING, Booking.Status.ACCEPTED]:
            return Response({"detail": "Cannot cancel a booking in its current state."}, status=status.HTTP_400_BAD_REQUEST)
        booking.status = Booking.Status.CANCELLED
        booking.cancelled_at = timezone.now()
        booking.cancellation_reason = request.data.get("reason", "")
        booking.save(update_fields=["status", "cancelled_at", "cancellation_reason", "updated_at"])
        return Response(BookingSerializer(booking).data, status=status.HTTP_200_OK)


class BookingRescheduleAPIView(APIView):
    def post(self, request, booking_id):
        original = generics.get_object_or_404(Booking, pk=booking_id, user=request.user)
        new_time_str = request.data.get("new_time")
        if not new_time_str:
            return Response({"detail": "new_time required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            new_time = datetime.fromisoformat(new_time_str)
        except (ValueError, TypeError):
            return Response({"detail": "Invalid datetime format."}, status=status.HTTP_400_BAD_REQUEST)

        new_booking = Booking.objects.create(
            user=original.user,
            service=original.service,
            package=original.package,
            price=original.price,
            location=original.location,
            latitude=original.latitude,
            longitude=original.longitude,
            time=timezone.make_aware(new_time) if timezone.is_naive(new_time) else new_time,
            status=Booking.Status.PENDING,
            rescheduled_from=original,
        )
        return Response(BookingSerializer(new_booking).data, status=status.HTTP_201_CREATED)


class WorkerNotificationListAPIView(generics.ListAPIView):
    serializer_class = BookingNotificationSerializer

    def get_queryset(self):
        return (
            BookingNotification.objects.select_related("booking", "booking__service", "booking__user", "worker")
            .filter(worker=self.request.user)
            .order_by("status", "distance_km", "-created_at")
        )


class BookingMessageListCreateAPIView(APIView):
    def get_booking(self, booking_id):
        booking = generics.get_object_or_404(
            Booking.objects.select_related("user", "worker", "service"),
            pk=booking_id,
        )
        user = self.request.user
        if user.id not in [booking.user_id, booking.worker_id]:
            return None
        return booking

    def get(self, request, booking_id):
        booking = self.get_booking(booking_id)
        if booking is None:
            return Response({"detail": "You do not have access to this booking."}, status=status.HTTP_403_FORBIDDEN)
        messages = booking.messages.select_related("sender").order_by("created_at")
        return Response(BookingMessageSerializer(messages, many=True).data, status=status.HTTP_200_OK)

    def post(self, request, booking_id):
        booking = self.get_booking(booking_id)
        if booking is None:
            return Response({"detail": "You do not have access to this booking."}, status=status.HTTP_403_FORBIDDEN)
        serializer = BookingMessageCreateSerializer(
            data=request.data,
            context={"request": request, "booking": booking},
        )
        serializer.is_valid(raise_exception=True)
        message = serializer.save()
        return Response(BookingMessageSerializer(message).data, status=status.HTTP_201_CREATED)


class WorkerJobAcceptanceAPIView(APIView):
    def post(self, request):
        serializer = WorkerBookingAcceptanceSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        notification = serializer.save()
        return Response(BookingNotificationSerializer(notification).data, status=status.HTTP_200_OK)


class WorkerJobRejectionAPIView(APIView):
    def post(self, request):
        serializer = WorkerBookingRejectionSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        notification = serializer.save()
        return Response(BookingNotificationSerializer(notification).data, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Phase 2 – Customer Addresses
# ---------------------------------------------------------------------------


class CustomerAddressListCreateAPIView(APIView):
    def get(self, request):
        addresses = CustomerAddress.objects.filter(user=request.user).order_by("-is_default", "created_at")
        return Response(CustomerAddressSerializer(addresses, many=True).data)

    def post(self, request):
        serializer = CustomerAddressSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CustomerAddressDetailAPIView(APIView):
    def get_object(self, request, pk):
        return generics.get_object_or_404(CustomerAddress, pk=pk, user=request.user)

    def get(self, request, pk):
        address = self.get_object(request, pk)
        return Response(CustomerAddressSerializer(address).data)

    def patch(self, request, pk):
        address = self.get_object(request, pk)
        serializer = CustomerAddressSerializer(address, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        address = self.get_object(request, pk)
        address.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Phase 3 – Payments
# ---------------------------------------------------------------------------


class PaymentCreateOrderAPIView(APIView):
    def post(self, request):
        booking_id = request.data.get("booking_id")
        method = request.data.get("method", Payment.Method.CASH)
        booking = generics.get_object_or_404(Booking, pk=booking_id, user=request.user)

        order_id = f"order_{uuid.uuid4().hex[:16]}"
        payment, _ = Payment.objects.get_or_create(
            booking=booking,
            defaults={
                "amount": booking.price,
                "method": method,
                "gateway_order_id": order_id,
                "status": Payment.Status.PENDING,
            },
        )
        return Response(
            {
                "order_id": payment.gateway_order_id,
                "amount": str(payment.amount),
                "currency": payment.currency,
                "key": "rzp_test_mock_key",
            },
            status=status.HTTP_201_CREATED,
        )


class PaymentVerifyAPIView(APIView):
    def post(self, request):
        booking_id = request.data.get("booking_id")
        gateway_payment_id = request.data.get("gateway_payment_id", "")
        gateway_order_id = request.data.get("gateway_order_id", "")
        method = request.data.get("method", Payment.Method.CASH)

        booking = generics.get_object_or_404(Booking, pk=booking_id, user=request.user)
        payment, _ = Payment.objects.get_or_create(
            booking=booking,
            defaults={"amount": booking.price, "method": method},
        )
        payment.gateway_payment_id = gateway_payment_id
        payment.gateway_order_id = gateway_order_id
        payment.method = method
        payment.status = Payment.Status.PAID
        payment.save(update_fields=["gateway_payment_id", "gateway_order_id", "method", "status", "updated_at"])

        if booking.worker:
            commission = payment.amount * 15 / 100
            net = payment.amount - commission
            WorkerEarning.objects.get_or_create(
                booking=booking,
                defaults={
                    "worker": booking.worker,
                    "gross_amount": payment.amount,
                    "platform_commission_percent": 15,
                    "net_amount": net,
                },
            )

        return Response(PaymentSerializer(payment).data, status=status.HTTP_200_OK)


class PaymentRefundAPIView(APIView):
    def post(self, request):
        booking_id = request.data.get("booking_id")
        booking = generics.get_object_or_404(Booking, pk=booking_id, user=request.user)
        payment = generics.get_object_or_404(Payment, booking=booking)
        payment.status = Payment.Status.REFUNDED
        payment.save(update_fields=["status", "updated_at"])
        return Response(PaymentSerializer(payment).data, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Phase 3 – Worker Earnings
# ---------------------------------------------------------------------------


class WorkerEarningsAPIView(APIView):
    def get(self, request):
        if request.user.role != User.Role.WORKER:
            return Response({"detail": "Only workers can view earnings."}, status=status.HTTP_403_FORBIDDEN)
        earnings = WorkerEarning.objects.filter(worker=request.user).select_related("booking")
        totals = earnings.aggregate(
            total_gross=Sum("gross_amount"),
            total_net=Sum("net_amount"),
        )
        return Response(
            {
                "total_gross": str(totals["total_gross"] or 0),
                "total_net": str(totals["total_net"] or 0),
                "pending_count": earnings.filter(payout_status=WorkerEarning.PayoutStatus.PENDING).count(),
                "transactions": WorkerEarningSerializer(earnings, many=True).data,
            }
        )


# ---------------------------------------------------------------------------
# Phase 4 – FCM Token & Worker Location
# ---------------------------------------------------------------------------


class FCMTokenAPIView(APIView):
    def post(self, request):
        serializer = FCMTokenSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "FCM token registered."}, status=status.HTTP_200_OK)


class WorkerLocationUpdateAPIView(APIView):
    def post(self, request):
        if request.user.role != User.Role.WORKER:
            return Response({"detail": "Only workers can update location."}, status=status.HTTP_403_FORBIDDEN)
        lat = request.data.get("latitude")
        lon = request.data.get("longitude")
        if lat is None or lon is None:
            return Response({"detail": "latitude and longitude required."}, status=status.HTTP_400_BAD_REQUEST)
        WorkerLocationUpdate.objects.update_or_create(
            worker=request.user,
            defaults={"latitude": lat, "longitude": lon},
        )
        # Also update WorkerProfile location
        if hasattr(request.user, "worker_profile"):
            wp = request.user.worker_profile
            wp.latitude = lat
            wp.longitude = lon
            wp.save(update_fields=["latitude", "longitude"])
        return Response({"detail": "Location updated."}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Phase 5 – Reviews
# ---------------------------------------------------------------------------


class BookingReviewAPIView(APIView):
    def post(self, request, booking_id):
        booking = generics.get_object_or_404(
            Booking.objects.select_related("user", "worker__worker_profile"),
            pk=booking_id,
            user=request.user,
        )
        if booking.status != Booking.Status.COMPLETED:
            return Response({"detail": "Can only review completed bookings."}, status=status.HTTP_400_BAD_REQUEST)
        if hasattr(booking, "review"):
            return Response({"detail": "You already reviewed this booking."}, status=status.HTTP_400_BAD_REQUEST)
        if booking.worker is None:
            return Response({"detail": "No worker assigned to this booking."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = WorkerReviewCreateSerializer(data=request.data, context={"booking": booking})
        serializer.is_valid(raise_exception=True)
        review = serializer.save()
        return Response({"detail": "Review submitted.", "id": review.id}, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Phase 6 – Search & Coupons
# ---------------------------------------------------------------------------


class SearchAPIView(APIView):
    permission_classes = [AllowAnyForAuth]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response({"services": [], "workers": []})

        services = Service.objects.filter(name__icontains=query)
        worker_profiles = WorkerProfile.objects.select_related("user").filter(
            skills__icontains=query,
            verification_status=WorkerProfile.VerificationStatus.APPROVED,
        )

        return Response(
            {
                "services": ServiceSerializer(services, many=True).data,
                "workers": WorkerProfileSerializer(worker_profiles, many=True).data,
            }
        )


class CouponApplyAPIView(APIView):
    def post(self, request):
        code = request.data.get("code", "").strip().upper()
        booking_price = request.data.get("booking_price")

        try:
            coupon = Coupon.objects.get(code=code, is_active=True)
        except Coupon.DoesNotExist:
            return Response({"detail": "Invalid coupon code."}, status=status.HTTP_400_BAD_REQUEST)

        if coupon.expiry < timezone.now():
            return Response({"detail": "Coupon has expired."}, status=status.HTTP_400_BAD_REQUEST)

        if coupon.max_uses > 0 and coupon.used_count >= coupon.max_uses:
            return Response({"detail": "Coupon usage limit reached."}, status=status.HTTP_400_BAD_REQUEST)

        user_use_count = CouponUse.objects.filter(coupon=coupon, user=request.user).count()
        if user_use_count >= coupon.per_user_limit:
            return Response({"detail": "You have already used this coupon."}, status=status.HTTP_400_BAD_REQUEST)

        discount = 0
        if booking_price is not None:
            try:
                booking_price = float(booking_price)
            except (ValueError, TypeError):
                booking_price = None
            if booking_price is not None:
                if coupon.discount_type == Coupon.DiscountType.FLAT:
                    discount = min(float(coupon.value), booking_price)
                else:
                    discount = round(booking_price * float(coupon.value) / 100, 2)

        return Response(
            {
                "coupon": CouponSerializer(coupon).data,
                "discount_amount": discount,
            },
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Phase 8 – Admin Analytics & Disputes
# ---------------------------------------------------------------------------


class AdminAnalyticsAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from .models import WorkerEarning
        total_bookings = Booking.objects.count()
        completed_bookings = Booking.objects.filter(status=Booking.Status.COMPLETED).count()
        revenue = WorkerEarning.objects.aggregate(total=Sum("gross_amount"))["total"] or 0
        total_customers = User.objects.filter(role=User.Role.CUSTOMER).count()
        total_workers = User.objects.filter(role=User.Role.WORKER).count()

        return Response(
            {
                "total_bookings": total_bookings,
                "completed_bookings": completed_bookings,
                "total_revenue": str(revenue),
                "total_customers": total_customers,
                "total_workers": total_workers,
            }
        )


class DisputeCreateAPIView(APIView):
    def post(self, request):
        serializer = DisputeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking_id = serializer.validated_data["booking"].id
        booking = generics.get_object_or_404(Booking, pk=booking_id)
        if request.user.id not in [booking.user_id, booking.worker_id]:
            return Response({"detail": "You are not part of this booking."}, status=status.HTTP_403_FORBIDDEN)
        serializer.save(raised_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Phase 9 – Health Check
# ---------------------------------------------------------------------------


class HealthCheckAPIView(APIView):
    permission_classes = [AllowAnyForAuth]

    def get(self, request):
        return Response({"status": "ok"}, status=status.HTTP_200_OK)


class AllowAnyForAuth(permissions.BasePermission):
    def has_permission(self, request, view):
        return True


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class OTPRequestAPIView(APIView):
    permission_classes = [AllowAnyForAuth]

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        otp = serializer.save()
        return Response(
            {
                "message": "OTP generated successfully.",
                "phone": otp.phone,
                "otp": otp.code,
                "expires_at": otp.expires_at,
            },
            status=status.HTTP_201_CREATED,
        )


class OTPVerifyAPIView(APIView):
    permission_classes = [AllowAnyForAuth]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.save()
        return Response(data, status=status.HTTP_200_OK)


class ServiceListAPIView(generics.ListAPIView):
    queryset = Service.objects.all().order_by("name")
    serializer_class = ServiceSerializer
    permission_classes = [AllowAnyForAuth]


class NearbyWorkerListAPIView(APIView):
    permission_classes = [AllowAnyForAuth]

    def get(self, request):
        serializer = NearbyWorkerQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        workers = serializer.get_nearby_workers()
        return Response(WorkerProfileSerializer(workers, many=True).data, status=status.HTTP_200_OK)


class WorkerProfileDetailAPIView(generics.RetrieveAPIView):
    queryset = WorkerProfile.objects.select_related("user").prefetch_related("portfolio_images", "reviews")
    serializer_class = WorkerProfileDetailsSerializer
    permission_classes = [AllowAnyForAuth]


class WorkerVerificationUploadAPIView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if request.user.role != User.Role.WORKER:
            return Response({"detail": "Only workers can upload verification documents."}, status=status.HTTP_403_FORBIDDEN)
        worker_profile = getattr(request.user, "worker_profile", None)
        if worker_profile is None:
            return Response({"detail": "Worker profile not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = WorkerVerificationUploadSerializer(worker_profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        return Response(WorkerProfileSerializer(profile).data, status=status.HTTP_200_OK)


class WorkerVerificationAdminAPIView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, worker_profile_id):
        worker_profile = generics.get_object_or_404(WorkerProfile.objects.select_related("user"), pk=worker_profile_id)
        serializer = WorkerVerificationAdminSerializer(worker_profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        return Response(WorkerProfileSerializer(profile).data, status=status.HTTP_200_OK)


class BookingCreateAPIView(generics.CreateAPIView):
    serializer_class = BookingCreateSerializer

    def create(self, request, *args, **kwargs):
        if request.user.role != User.Role.CUSTOMER:
            return Response(
                {"detail": "Only customers can create bookings."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        booking = Booking.objects.select_related("user", "worker", "service").get(pk=booking.pk)
        data = BookingSerializer(booking).data
        data["notified_workers_count"] = booking.notifications.count()
        return Response(data, status=status.HTTP_201_CREATED)


class WorkerNotificationListAPIView(generics.ListAPIView):
    serializer_class = BookingNotificationSerializer

    def get_queryset(self):
        return (
            BookingNotification.objects.select_related("booking", "booking__service", "booking__user", "worker")
            .filter(worker=self.request.user)
            .order_by("status", "distance_km", "-created_at")
        )


class BookingMessageListCreateAPIView(APIView):
    def get_booking(self, booking_id):
        booking = generics.get_object_or_404(
            Booking.objects.select_related("user", "worker", "service"),
            pk=booking_id,
        )
        user = self.request.user
        if user.id not in [booking.user_id, booking.worker_id]:
            return None
        return booking

    def get(self, request, booking_id):
        booking = self.get_booking(booking_id)
        if booking is None:
            return Response({"detail": "You do not have access to this booking."}, status=status.HTTP_403_FORBIDDEN)
        messages = booking.messages.select_related("sender").order_by("created_at")
        return Response(BookingMessageSerializer(messages, many=True).data, status=status.HTTP_200_OK)

    def post(self, request, booking_id):
        booking = self.get_booking(booking_id)
        if booking is None:
            return Response({"detail": "You do not have access to this booking."}, status=status.HTTP_403_FORBIDDEN)
        serializer = BookingMessageCreateSerializer(
            data=request.data,
            context={"request": request, "booking": booking},
        )
        serializer.is_valid(raise_exception=True)
        message = serializer.save()
        return Response(BookingMessageSerializer(message).data, status=status.HTTP_201_CREATED)


class WorkerJobAcceptanceAPIView(APIView):
    def post(self, request):
        serializer = WorkerBookingAcceptanceSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        notification = serializer.save()
        return Response(BookingNotificationSerializer(notification).data, status=status.HTTP_200_OK)


class WorkerJobRejectionAPIView(APIView):
    def post(self, request):
        serializer = WorkerBookingRejectionSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        notification = serializer.save()
        return Response(BookingNotificationSerializer(notification).data, status=status.HTTP_200_OK)

import random
from datetime import timedelta
from decimal import Decimal
from math import asin, cos, radians, sin, sqrt

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

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
    PhoneOTP,
    Service,
    ServiceCategory,
    ServicePackage,
    Skill,
    User,
    WorkerAvailability,
    WorkerBankAccount,
    WorkerCertification,
    WorkerEarning,
    WorkerLocationUpdate,
    WorkerPortfolioImage,
    WorkerProfile,
    WorkerReview,
    WorkerSkill,
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "phone", "role"]


class WorkerPortfolioImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerPortfolioImage
        fields = ["id", "image_url", "caption", "created_at"]


class WorkerReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerReview
        fields = ["id", "customer_name", "rating", "comment", "created_at", "would_recommend", "tags"]


class WorkerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    distance_km = serializers.FloatField(read_only=True)
    aadhaar_image = serializers.FileField(read_only=True)
    portfolio_images = WorkerPortfolioImageSerializer(many=True, read_only=True)
    reviews = WorkerReviewSerializer(many=True, read_only=True)

    class Meta:
        model = WorkerProfile
        fields = [
            "id",
            "user",
            "skills",
            "rating",
            "verification_status",
            "location",
            "latitude",
            "longitude",
            "aadhaar_image",
            "distance_km",
            "portfolio_images",
            "reviews",
            "jobs_completed",
            "background_check_verified",
            "is_online",
            "onboarding_step",
        ]


class WorkerVerificationUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerProfile
        fields = ["aadhaar_image"]

    def validate_aadhaar_image(self, file):
        allowed_extensions = (".jpg", ".jpeg", ".png", ".pdf")
        name = file.name.lower()
        if not name.endswith(allowed_extensions):
            raise serializers.ValidationError("Upload a JPG, PNG, or PDF file.")
        if file.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("File size must be 5 MB or less.")
        return file

    def update(self, instance, validated_data):
        instance.aadhaar_image = validated_data["aadhaar_image"]
        instance.verification_status = WorkerProfile.VerificationStatus.PENDING
        instance.save(update_fields=["aadhaar_image", "verification_status"])
        return instance


class WorkerVerificationAdminSerializer(serializers.ModelSerializer):
    verification_status = serializers.ChoiceField(
        choices=WorkerProfile.VerificationStatus.choices,
    )

    class Meta:
        model = WorkerProfile
        fields = ["verification_status"]

    def validate_verification_status(self, value):
        if value == WorkerProfile.VerificationStatus.PENDING:
            raise serializers.ValidationError("Admin approval must be approved or rejected.")
        return value


def calculate_distance_km(origin_lat, origin_lon, target_lat, target_lon):
    radius_km = 6371
    lat1 = radians(origin_lat)
    lon1 = radians(origin_lon)
    lat2 = radians(target_lat)
    lon2 = radians(target_lon)

    delta_lat = lat2 - lat1
    delta_lon = lon2 - lon1

    haversine = sin(delta_lat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(delta_lon / 2) ** 2
    arc = 2 * asin(sqrt(haversine))
    return radius_km * arc


# ---------------------------------------------------------------------------
# Phase 1 – Service Catalog
# ---------------------------------------------------------------------------


class ServicePackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServicePackage
        fields = ["id", "name", "description", "price", "duration_hours", "included_items", "is_popular", "order"]


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ["id", "name", "base_price"]


class ServiceDetailSerializer(serializers.ModelSerializer):
    packages = ServicePackageSerializer(many=True, read_only=True)

    class Meta:
        model = Service
        fields = [
            "id",
            "name",
            "base_price",
            "description",
            "duration_hours",
            "image_url",
            "included_items",
            "excluded_items",
            "packages",
        ]


class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = ["id", "name", "description", "icon", "parent_id", "is_active", "order"]


class ServiceCategoryDetailSerializer(serializers.ModelSerializer):
    subcategories = ServiceCategorySerializer(many=True, read_only=True)
    services = ServiceDetailSerializer(many=True, read_only=True)

    class Meta:
        model = ServiceCategory
        fields = ["id", "name", "description", "icon", "parent_id", "is_active", "order", "subcategories", "services"]


# ---------------------------------------------------------------------------
# Phase 2 – Addresses, Availability
# ---------------------------------------------------------------------------


class CustomerAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerAddress
        fields = ["id", "label", "address", "latitude", "longitude", "is_default", "created_at"]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        user = self.context["request"].user
        if validated_data.get("is_default"):
            CustomerAddress.objects.filter(user=user, is_default=True).update(is_default=False)
        return CustomerAddress.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        if validated_data.get("is_default"):
            CustomerAddress.objects.filter(user=instance.user, is_default=True).exclude(pk=instance.pk).update(
                is_default=False
            )
        return super().update(instance, validated_data)


class WorkerAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerAvailability
        fields = ["id", "day_of_week", "start_time", "end_time"]


# ---------------------------------------------------------------------------
# Phase 3 – Payments & Earnings
# ---------------------------------------------------------------------------


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id",
            "booking",
            "amount",
            "currency",
            "gateway_order_id",
            "gateway_payment_id",
            "status",
            "method",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class WorkerEarningSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerEarning
        fields = [
            "id",
            "booking",
            "gross_amount",
            "platform_commission_percent",
            "net_amount",
            "payout_status",
        ]


class WorkerBankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerBankAccount
        fields = ["id", "account_holder_name", "account_number", "ifsc_code", "bank_name", "is_verified"]
        read_only_fields = ["id", "is_verified"]


# ---------------------------------------------------------------------------
# Phase 4 – FCM & Location
# ---------------------------------------------------------------------------


class FCMTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = FCMToken
        fields = ["token", "device_type"]

    def save(self, **kwargs):
        user = self.context["request"].user
        FCMToken.objects.update_or_create(
            user=user,
            device_type=self.validated_data["device_type"],
            defaults={"token": self.validated_data["token"]},
        )


# ---------------------------------------------------------------------------
# Phase 5 – Review
# ---------------------------------------------------------------------------


class WorkerReviewCreateSerializer(serializers.Serializer):
    rating = serializers.DecimalField(max_digits=3, decimal_places=2)
    comment = serializers.CharField()
    would_recommend = serializers.BooleanField(default=True)
    tags = serializers.ListField(child=serializers.CharField(), default=list)

    def validate_rating(self, value):
        if value < Decimal("0") or value > Decimal("5"):
            raise serializers.ValidationError("Rating must be between 0 and 5.")
        return value

    @transaction.atomic
    def save(self, **kwargs):
        booking = self.context["booking"]
        worker_profile = booking.worker.worker_profile
        review = WorkerReview.objects.create(
            worker_profile=worker_profile,
            booking=booking,
            customer_name=booking.user.phone,
            rating=self.validated_data["rating"],
            comment=self.validated_data["comment"],
            would_recommend=self.validated_data["would_recommend"],
            tags=self.validated_data["tags"],
        )
        # Auto-update running average
        all_ratings = WorkerReview.objects.filter(worker_profile=worker_profile).values_list("rating", flat=True)
        avg = sum(all_ratings) / len(all_ratings)
        worker_profile.rating = round(avg, 2)
        worker_profile.jobs_completed = models_jobs_count(worker_profile)
        worker_profile.save(update_fields=["rating", "jobs_completed"])
        return review


def models_jobs_count(worker_profile):
    from .models import Booking
    return Booking.objects.filter(worker=worker_profile.user, status=Booking.Status.COMPLETED).count()


# ---------------------------------------------------------------------------
# Phase 6 – Coupons
# ---------------------------------------------------------------------------


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = ["code", "discount_type", "value", "expiry"]


# ---------------------------------------------------------------------------
# Phase 7 – Skills
# ---------------------------------------------------------------------------


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ["id", "name", "category_id", "description"]


class WorkerSkillSerializer(serializers.ModelSerializer):
    skill = SkillSerializer(read_only=True)

    class Meta:
        model = WorkerSkill
        fields = ["id", "skill", "experience_years", "is_verified"]


class WorkerCertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerCertification
        fields = ["id", "skill_id", "title", "issued_by", "issued_date", "is_verified_by_admin"]


# ---------------------------------------------------------------------------
# Phase 8 – Disputes
# ---------------------------------------------------------------------------


class DisputeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dispute
        fields = ["id", "booking", "reason", "description", "status", "resolution_note", "created_at"]
        read_only_fields = ["id", "status", "resolution_note", "created_at"]


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------


class OTPRequestSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)

    def create(self, validated_data):
        code = f"{random.randint(100000, 999999)}"
        PhoneOTP.objects.filter(phone=validated_data["phone"], is_verified=False).update(
            expires_at=timezone.now()
        )
        otp = PhoneOTP.objects.create(
            phone=validated_data["phone"],
            code=code,
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        return otp


class OTPVerifySerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)
    otp = serializers.CharField(max_length=6)
    role = serializers.ChoiceField(choices=User.Role.choices, required=False)

    def validate(self, attrs):
        otp = (
            PhoneOTP.objects.filter(
                phone=attrs["phone"],
                code=attrs["otp"],
                is_verified=False,
            )
            .order_by("-created_at")
            .first()
        )
        if not otp:
            raise serializers.ValidationError("Invalid OTP.")
        if otp.is_expired():
            raise serializers.ValidationError("OTP has expired.")
        attrs["otp_instance"] = otp
        return attrs

    @transaction.atomic
    def save(self, **kwargs):
        phone = self.validated_data["phone"]
        role = self.validated_data.get("role", User.Role.CUSTOMER)
        otp = self.validated_data["otp_instance"]
        otp.is_verified = True
        otp.save(update_fields=["is_verified"])

        user, created = User.objects.get_or_create(
            phone=phone,
            defaults={"role": role},
        )
        if not created and "role" in self.validated_data and user.role != role:
            user.role = role
            user.save(update_fields=["role"])
        if user.role == User.Role.WORKER:
            WorkerProfile.objects.get_or_create(
                user=user,
                defaults={"location": "Not set"},
            )

        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UserSerializer(user).data,
        }


class WorkerProfileDetailsSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    portfolio_images = WorkerPortfolioImageSerializer(many=True, read_only=True)
    reviews = WorkerReviewSerializer(many=True, read_only=True)
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=2, read_only=True, source="rating")
    worker_skills = WorkerSkillSerializer(many=True, read_only=True)

    class Meta:
        model = WorkerProfile
        fields = [
            "id",
            "user",
            "skills",
            "location",
            "verification_status",
            "latitude",
            "longitude",
            "average_rating",
            "portfolio_images",
            "reviews",
            "jobs_completed",
            "background_check_verified",
            "years_on_platform",
            "is_online",
            "onboarding_step",
            "worker_skills",
        ]


# ---------------------------------------------------------------------------
# Booking
# ---------------------------------------------------------------------------


class BookingSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    worker = UserSerializer(read_only=True, allow_null=True)
    service = ServiceSerializer(read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "user",
            "worker",
            "service",
            "status",
            "price",
            "location",
            "latitude",
            "longitude",
            "time",
            "created_at",
            "updated_at",
            "cancelled_at",
            "cancellation_reason",
        ]


class BookingCreateSerializer(serializers.ModelSerializer):
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        source="service",
        write_only=True,
    )
    package_id = serializers.PrimaryKeyRelatedField(
        queryset=ServicePackage.objects.all(),
        source="package",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Booking
        fields = ["service_id", "package_id", "location", "latitude", "longitude", "time"]

    def create(self, validated_data):
        service = validated_data["service"]
        package = validated_data.pop("package", None)
        price = package.price if package else service.base_price
        booking = Booking.objects.create(
            user=self.context["request"].user,
            price=price,
            package=package,
            status=Booking.Status.PENDING,
            **validated_data,
        )
        nearby_workers = get_nearby_worker_profiles(validated_data["latitude"], validated_data["longitude"])
        notifications = [
            BookingNotification(
                booking=booking,
                worker=worker.user,
                distance_km=Decimal(str(worker.distance_km)),
            )
            for worker in nearby_workers
        ]
        BookingNotification.objects.bulk_create(notifications)
        booking.notified_workers_count = len(notifications)
        return booking


class BookingNotificationSerializer(serializers.ModelSerializer):
    booking = BookingSerializer(read_only=True)
    worker = UserSerializer(read_only=True)

    class Meta:
        model = BookingNotification
        fields = [
            "id",
            "booking",
            "worker",
            "status",
            "distance_km",
            "created_at",
            "updated_at",
        ]


class BookingMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = BookingMessage
        fields = ["id", "booking", "sender", "message", "created_at"]
        read_only_fields = ["id", "booking", "sender", "created_at"]


class BookingMessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingMessage
        fields = ["message"]

    def validate_message(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Message cannot be empty.")
        return value

    def create(self, validated_data):
        return BookingMessage.objects.create(
            booking=self.context["booking"],
            sender=self.context["request"].user,
            **validated_data,
        )


class WorkerBookingAcceptanceSerializer(serializers.Serializer):
    notification_id = serializers.PrimaryKeyRelatedField(
        queryset=BookingNotification.objects.select_related("booking", "booking__service", "booking__user", "worker")
    )

    def validate_notification_id(self, notification):
        request = self.context["request"]
        if request.user.role != User.Role.WORKER:
            raise serializers.ValidationError("Only workers can accept jobs.")
        if notification.worker_id != request.user.id:
            raise serializers.ValidationError("This notification does not belong to you.")
        if notification.status != BookingNotification.Status.PENDING:
            raise serializers.ValidationError("This notification is no longer available.")
        if notification.booking.status != Booking.Status.PENDING:
            raise serializers.ValidationError("This job has already been assigned.")
        return notification

    @transaction.atomic
    def save(self, **kwargs):
        notification = (
            BookingNotification.objects.select_for_update()
            .select_related("booking", "booking__service", "booking__user", "worker")
            .get(pk=self.validated_data["notification_id"].pk)
        )
        booking = Booking.objects.select_for_update().select_related("service", "user", "worker").get(
            pk=notification.booking_id
        )
        if notification.status != BookingNotification.Status.PENDING:
            raise serializers.ValidationError("This notification is no longer available.")
        if booking.status != Booking.Status.PENDING:
            notification.status = BookingNotification.Status.MISSED
            notification.save(update_fields=["status", "updated_at"])
            raise serializers.ValidationError("Another worker already accepted this job.")

        booking.worker = notification.worker
        booking.status = Booking.Status.ACCEPTED
        booking.save(update_fields=["worker", "status", "updated_at"])

        notification.status = BookingNotification.Status.ACCEPTED
        notification.save(update_fields=["status", "updated_at"])
        BookingNotification.objects.filter(booking=booking, status=BookingNotification.Status.PENDING).exclude(
            pk=notification.pk
        ).update(status=BookingNotification.Status.MISSED)
        return notification


class WorkerBookingRejectionSerializer(serializers.Serializer):
    notification_id = serializers.PrimaryKeyRelatedField(
        queryset=BookingNotification.objects.select_related("booking", "worker")
    )

    def validate_notification_id(self, notification):
        request = self.context["request"]
        if request.user.role != User.Role.WORKER:
            raise serializers.ValidationError("Only workers can reject jobs.")
        if notification.worker_id != request.user.id:
            raise serializers.ValidationError("This notification does not belong to you.")
        if notification.status != BookingNotification.Status.PENDING:
            raise serializers.ValidationError("This notification is no longer pending.")
        if notification.booking.status != Booking.Status.PENDING:
            raise serializers.ValidationError("This job has already been assigned.")
        return notification

    def save(self, **kwargs):
        notification = self.validated_data["notification_id"]
        notification.status = BookingNotification.Status.REJECTED
        notification.save(update_fields=["status", "updated_at"])
        return notification


class NearbyWorkerQuerySerializer(serializers.Serializer):
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    min_rating = serializers.FloatField(required=False, default=None, allow_null=True)
    sort_by = serializers.ChoiceField(
        choices=["distance", "rating"],
        required=False,
        default="distance",
    )

    def get_nearby_workers(self):
        workers = get_nearby_worker_profiles(
            self.validated_data["latitude"],
            self.validated_data["longitude"],
        )
        min_rating = self.validated_data.get("min_rating")
        if min_rating is not None:
            workers = [w for w in workers if float(w.rating) >= min_rating]
        sort_by = self.validated_data.get("sort_by", "distance")
        if sort_by == "rating":
            workers.sort(key=lambda w: float(w.rating), reverse=True)
        return workers


def get_nearby_worker_profiles(latitude, longitude):
    workers = (
        WorkerProfile.objects.select_related("user")
        .prefetch_related("portfolio_images", "reviews")
        .filter(
            user__role=User.Role.WORKER,
            latitude__isnull=False,
            longitude__isnull=False,
            verification_status=WorkerProfile.VerificationStatus.APPROVED,
        )
    )

    nearby_workers = []
    for worker in workers:
        distance_km = calculate_distance_km(
            latitude,
            longitude,
            worker.latitude,
            worker.longitude,
        )
        if distance_km <= 5:
            worker.distance_km = round(distance_km, 2)
            nearby_workers.append(worker)

    nearby_workers.sort(key=lambda worker: worker.distance_km)
    return nearby_workers

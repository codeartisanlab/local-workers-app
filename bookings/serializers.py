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
    BookingMessage,
    BookingNotification,
    PhoneOTP,
    Service,
    User,
    WorkerPortfolioImage,
    WorkerProfile,
    WorkerReview,
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
        fields = ["id", "customer_name", "rating", "comment", "created_at"]


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


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ["id", "name", "base_price"]


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
        ]


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
        ]


class BookingCreateSerializer(serializers.ModelSerializer):
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        source="service",
        write_only=True,
    )
    class Meta:
        model = Booking
        fields = ["service_id", "location", "latitude", "longitude", "time"]

    def create(self, validated_data):
        service = validated_data["service"]
        booking = Booking.objects.create(
            user=self.context["request"].user,
            price=service.base_price,
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

    def get_nearby_workers(self):
        return get_nearby_worker_profiles(
            self.validated_data["latitude"],
            self.validated_data["longitude"],
        )


def get_nearby_worker_profiles(latitude, longitude):
    workers = (
        WorkerProfile.objects.select_related("user")
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

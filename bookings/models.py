from decimal import Decimal

from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, phone, role="customer", password=None, **extra_fields):
        if not phone:
            raise ValueError("Phone number is required.")
        user = self.model(phone=phone, role=role, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "customer")
        return self.create_user(phone=phone, password=password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        CUSTOMER = "customer", "Customer"
        WORKER = "worker", "Worker"

    phone = models.CharField(max_length=20, unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return f"{self.phone} ({self.role})"


class PhoneOTP(models.Model):
    phone = models.CharField(max_length=20, db_index=True)
    code = models.CharField(max_length=6)
    is_verified = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"{self.phone} - {self.code}"


class WorkerProfile(models.Model):
    class VerificationStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="worker_profile")
    full_name = models.CharField(max_length=120, blank=True)
    bio = models.TextField(blank=True)
    skills = models.TextField(blank=True)
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
    )
    location = models.CharField(max_length=255)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    aadhaar_image = models.FileField(upload_to="aadhaar/", null=True, blank=True)
    selfie_image = models.FileField(upload_to="selfies/", null=True, blank=True)
    is_available = models.BooleanField(default=False)
    work_start_time = models.TimeField(null=True, blank=True)
    work_end_time = models.TimeField(null=True, blank=True)

    def __str__(self):
        return f"WorkerProfile<{self.user.phone}>"


class WorkerPortfolioImage(models.Model):
    worker_profile = models.ForeignKey(
        WorkerProfile,
        on_delete=models.CASCADE,
        related_name="portfolio_images",
    )
    image = models.FileField(upload_to="portfolio/", null=True, blank=True)
    image_url = models.URLField(blank=True)
    caption = models.CharField(max_length=140, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"PortfolioImage<{self.worker_profile.user.phone}>"


class WorkerReview(models.Model):
    worker_profile = models.ForeignKey(
        WorkerProfile,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    customer_name = models.CharField(max_length=120)
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"WorkerReview<{self.worker_profile.user.phone}:{self.customer_name}>"


class Service(models.Model):
    name = models.CharField(max_length=100)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.name


class SubService(models.Model):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="sub_services")
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.service.name} - {self.name}"


class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bookings")
    worker = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="assigned_bookings",
        null=True,
        blank=True,
    )
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="bookings")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    location = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    time = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Booking<{self.id}> {self.service.name} - {self.status}"


class BookingNotification(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
        MISSED = "missed", "Missed"

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="notifications")
    worker = models.ForeignKey(User, on_delete=models.CASCADE, related_name="booking_notifications")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    distance_km = models.DecimalField(max_digits=6, decimal_places=2)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("booking", "worker")

    def __str__(self):
        return f"BookingNotification<{self.booking_id}:{self.worker_id}>"


class BookingMessage(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="booking_messages")
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"BookingMessage<{self.booking_id}:{self.sender_id}>"


class WorkerService(models.Model):
    worker_profile = models.ForeignKey(WorkerProfile, on_delete=models.CASCADE, related_name="worker_services")
    sub_service = models.ForeignKey(SubService, on_delete=models.CASCADE, related_name="worker_services")

    class Meta:
        unique_together = ("worker_profile", "sub_service")

    def __str__(self):
        return f"WorkerService<{self.worker_profile.user.phone}:{self.sub_service.name}>"

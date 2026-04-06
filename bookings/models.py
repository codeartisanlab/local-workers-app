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


# ---------------------------------------------------------------------------
# Phase 1 – Service Catalog & Pricing
# ---------------------------------------------------------------------------


class ServiceCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=10, blank=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subcategories",
    )
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "name"]
        verbose_name_plural = "Service Categories"

    def __str__(self):
        return self.name


class WorkerProfile(models.Model):
    class VerificationStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    class OnboardingStep(models.TextChoices):
        PROFILE = "profile", "Profile"
        DOCUMENTS = "documents", "Documents"
        SKILLS = "skills", "Skills"
        BANK = "bank", "Bank"
        COMPLETE = "complete", "Complete"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="worker_profile")
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
    # Phase 5 – trust signals
    jobs_completed = models.PositiveIntegerField(default=0)
    background_check_verified = models.BooleanField(default=False)
    years_on_platform = models.PositiveIntegerField(default=0)
    is_online = models.BooleanField(default=False)
    # Phase 7 – onboarding
    onboarding_step = models.CharField(
        max_length=20,
        choices=OnboardingStep.choices,
        default=OnboardingStep.PROFILE,
    )

    class Meta:
        indexes = [
            models.Index(fields=["latitude", "longitude"]),
        ]

    def __str__(self):
        return f"WorkerProfile<{self.user.phone}>"


class WorkerPortfolioImage(models.Model):
    worker_profile = models.ForeignKey(
        WorkerProfile,
        on_delete=models.CASCADE,
        related_name="portfolio_images",
    )
    image_url = models.URLField()
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
    # Phase 5 enhancements
    booking = models.OneToOneField(
        "Booking",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="review",
    )
    would_recommend = models.BooleanField(default=True)
    tags = models.JSONField(default=list)

    def __str__(self):
        return f"WorkerReview<{self.worker_profile.user.phone}:{self.customer_name}>"


class Service(models.Model):
    name = models.CharField(max_length=100)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    # Phase 1 additions
    category = models.ForeignKey(
        ServiceCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="services",
    )
    description = models.TextField(blank=True)
    duration_hours = models.DecimalField(max_digits=4, decimal_places=1, default=1)
    image_url = models.URLField(blank=True)
    included_items = models.JSONField(default=list)
    excluded_items = models.JSONField(default=list)

    def __str__(self):
        return self.name


class ServicePackage(models.Model):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="packages")
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration_hours = models.DecimalField(max_digits=4, decimal_places=1, default=1)
    included_items = models.JSONField(default=list)
    is_popular = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "price"]

    def __str__(self):
        return f"{self.service.name} – {self.name}"


class PricingRule(models.Model):
    class RuleType(models.TextChoices):
        SURGE = "surge", "Surge"
        AREA = "area", "Area"

    name = models.CharField(max_length=100)
    rule_type = models.CharField(max_length=20, choices=RuleType.choices)
    multiplier = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal("1.00"))
    start_hour = models.PositiveSmallIntegerField(null=True, blank=True)
    end_hour = models.PositiveSmallIntegerField(null=True, blank=True)
    area_name = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


# ---------------------------------------------------------------------------
# Phase 2 – Enhanced Booking Flow
# ---------------------------------------------------------------------------


class CustomerAddress(models.Model):
    class Label(models.TextChoices):
        HOME = "Home", "Home"
        WORK = "Work", "Work"
        OTHER = "Other", "Other"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="addresses")
    label = models.CharField(max_length=10, choices=Label.choices, default=Label.HOME)
    address = models.TextField()
    latitude = models.FloatField()
    longitude = models.FloatField()
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.label} – {self.user.phone}"


class WorkerAvailability(models.Model):
    worker_profile = models.ForeignKey(
        WorkerProfile, on_delete=models.CASCADE, related_name="availability"
    )
    day_of_week = models.PositiveSmallIntegerField()  # 0=Mon … 6=Sun
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        unique_together = ("worker_profile", "day_of_week")

    def __str__(self):
        return f"{self.worker_profile} day={self.day_of_week}"


class BlockedSlot(models.Model):
    worker_profile = models.ForeignKey(
        WorkerProfile, on_delete=models.CASCADE, related_name="blocked_slots"
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    booking = models.ForeignKey(
        "Booking",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="blocked_slots",
    )

    def __str__(self):
        return f"BlockedSlot<{self.worker_profile} {self.date}>"


class CancellationPolicy(models.Model):
    name = models.CharField(max_length=100)
    free_cancel_hours = models.PositiveIntegerField(default=2)
    cancellation_fee_percent = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("10.00"))
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return self.name


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
    package = models.ForeignKey(
        ServicePackage,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="bookings",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    location = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    time = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # Phase 2 cancellation / reschedule
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True)
    rescheduled_from = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reschedules",
    )

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["user"]),
            models.Index(fields=["worker"]),
        ]

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


# ---------------------------------------------------------------------------
# Phase 3 – Payments
# ---------------------------------------------------------------------------


class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        REFUNDED = "refunded", "Refunded"
        FAILED = "failed", "Failed"

    class Method(models.TextChoices):
        CARD = "card", "Card"
        UPI = "upi", "UPI"
        WALLET = "wallet", "Wallet"
        CASH = "cash", "Cash"

    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name="payment")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="INR")
    gateway_order_id = models.CharField(max_length=200, blank=True)
    gateway_payment_id = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    method = models.CharField(max_length=20, choices=Method.choices, default=Method.CASH)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment<{self.booking_id}:{self.status}>"


class WorkerEarning(models.Model):
    class PayoutStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"

    worker = models.ForeignKey(User, on_delete=models.CASCADE, related_name="earnings")
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name="earning")
    gross_amount = models.DecimalField(max_digits=10, decimal_places=2)
    platform_commission_percent = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("15.00"))
    net_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payout_status = models.CharField(max_length=20, choices=PayoutStatus.choices, default=PayoutStatus.PENDING)

    def __str__(self):
        return f"WorkerEarning<{self.worker_id}:{self.booking_id}>"


class WorkerBankAccount(models.Model):
    worker = models.OneToOneField(User, on_delete=models.CASCADE, related_name="bank_account")
    account_holder_name = models.CharField(max_length=200)
    account_number = models.CharField(max_length=50)
    ifsc_code = models.CharField(max_length=20)
    bank_name = models.CharField(max_length=100)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"BankAccount<{self.worker.phone}>"


# ---------------------------------------------------------------------------
# Phase 4 – Real-Time Features
# ---------------------------------------------------------------------------


class FCMToken(models.Model):
    class DeviceType(models.TextChoices):
        ANDROID = "android", "Android"
        IOS = "ios", "iOS"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="fcm_tokens")
    token = models.TextField()
    device_type = models.CharField(max_length=10, choices=DeviceType.choices)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "device_type")

    def __str__(self):
        return f"FCMToken<{self.user.phone}:{self.device_type}>"


class WorkerLocationUpdate(models.Model):
    worker = models.ForeignKey(User, on_delete=models.CASCADE, related_name="location_updates")
    latitude = models.FloatField()
    longitude = models.FloatField()
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Location<{self.worker.phone}>"


# ---------------------------------------------------------------------------
# Phase 6 – Search, Discovery & Promotions
# ---------------------------------------------------------------------------


class Coupon(models.Model):
    class DiscountType(models.TextChoices):
        FLAT = "flat", "Flat"
        PERCENT = "percent", "Percent"

    code = models.CharField(max_length=50, unique=True)
    discount_type = models.CharField(max_length=20, choices=DiscountType.choices)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    max_uses = models.PositiveIntegerField(default=0)
    used_count = models.PositiveIntegerField(default=0)
    per_user_limit = models.PositiveIntegerField(default=1)
    expiry = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.code


class CouponUse(models.Model):
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name="uses")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="coupon_uses")
    booking = models.ForeignKey(
        Booking,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="coupon_uses",
    )
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("coupon", "user", "booking")

    def __str__(self):
        return f"CouponUse<{self.coupon.code}:{self.user.phone}>"


class ServiceView(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="service_views")
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="views")
    viewed_at = models.DateTimeField(auto_now_add=True)
    session_key = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"ServiceView<{self.service_id}>"


# ---------------------------------------------------------------------------
# Phase 7 – Worker Skills & Certifications
# ---------------------------------------------------------------------------


class Skill(models.Model):
    name = models.CharField(max_length=100)
    category = models.ForeignKey(
        ServiceCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="skills",
    )
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class WorkerSkill(models.Model):
    worker_profile = models.ForeignKey(WorkerProfile, on_delete=models.CASCADE, related_name="worker_skills")
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, related_name="worker_skills")
    experience_years = models.PositiveIntegerField(default=0)
    is_verified = models.BooleanField(default=False)

    class Meta:
        unique_together = ("worker_profile", "skill")

    def __str__(self):
        return f"WorkerSkill<{self.worker_profile}:{self.skill}>"


class WorkerCertification(models.Model):
    worker_profile = models.ForeignKey(
        WorkerProfile, on_delete=models.CASCADE, related_name="certifications"
    )
    skill = models.ForeignKey(Skill, on_delete=models.SET_NULL, null=True, blank=True, related_name="certifications")
    title = models.CharField(max_length=200)
    certificate_image = models.FileField(upload_to="certs/", null=True, blank=True)
    issued_by = models.CharField(max_length=200, blank=True)
    issued_date = models.DateField(null=True, blank=True)
    is_verified_by_admin = models.BooleanField(default=False)

    def __str__(self):
        return f"Cert<{self.worker_profile}:{self.title}>"


# ---------------------------------------------------------------------------
# Phase 8 – Dispute Management
# ---------------------------------------------------------------------------


class Dispute(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        RESOLVED = "resolved", "Resolved"
        ESCALATED = "escalated", "Escalated"
        CLOSED = "closed", "Closed"

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="disputes")
    raised_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="disputes")
    reason = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    resolution_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Dispute<{self.booking_id}:{self.status}>"

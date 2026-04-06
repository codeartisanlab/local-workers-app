from datetime import timedelta

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from bookings.models import Booking, BookingNotification, PhoneOTP, Service, User, WorkerProfile
from bookings.serializers import calculate_distance_km


@pytest.fixture
def service():
    return Service.objects.create(name="Cleaning", base_price="499.00")


@pytest.fixture
def customer():
    return User.objects.create_user(phone="9000000001", role=User.Role.CUSTOMER)


@pytest.fixture
def worker():
    user = User.objects.create_user(phone="9000000002", role=User.Role.WORKER)
    WorkerProfile.objects.create(
        user=user,
        skills="Cleaning, Deep Sanitization",
        rating="4.50",
        verification_status=WorkerProfile.VerificationStatus.APPROVED,
        location="Downtown",
        latitude=12.9716,
        longitude=77.5946,
        is_available=True,
    )
    return user


@pytest.fixture
def nearby_worker():
    user = User.objects.create_user(phone="9000000003", role=User.Role.WORKER)
    WorkerProfile.objects.create(
        user=user,
        skills="Electrical",
        rating="4.70",
        verification_status=WorkerProfile.VerificationStatus.APPROVED,
        location="MG Road",
        latitude=12.9721,
        longitude=77.5990,
        is_available=True,
    )
    return user


@pytest.fixture
def rejected_worker():
    user = User.objects.create_user(phone="9000000004", role=User.Role.WORKER)
    WorkerProfile.objects.create(
        user=user,
        skills="Plumbing",
        rating="4.20",
        verification_status=WorkerProfile.VerificationStatus.REJECTED,
        location="West End",
        latitude=12.9719,
        longitude=77.5960,
        is_available=True,
    )
    return user


@pytest.fixture
def far_worker():
    user = User.objects.create_user(phone="9000000005", role=User.Role.WORKER)
    WorkerProfile.objects.create(
        user=user,
        skills="Plumbing",
        rating="4.20",
        verification_status=WorkerProfile.VerificationStatus.APPROVED,
        location="Airport",
        latitude=13.1986,
        longitude=77.7066,
        is_available=True,
    )
    return user


@pytest.fixture
def admin_user():
    return User.objects.create_user(phone="9000000009", role=User.Role.CUSTOMER, is_staff=True)


@pytest.fixture
def pending_booking(customer, service):
    return Booking.objects.create(
        user=customer,
        service=service,
        status=Booking.Status.PENDING,
        price=service.base_price,
        location="221B Baker Street",
        latitude=12.9716,
        longitude=77.5946,
        time=timezone.now() + timedelta(days=1),
    )


def authenticate(api_client, user, role=None):
    otp = PhoneOTP.objects.create(
        phone=user.phone,
        code="123456",
        expires_at=timezone.now() + timedelta(minutes=10),
    )
    response = api_client.post(
        reverse("verify-otp"),
        {"phone": user.phone, "otp": otp.code, "role": role or user.role},
        format="json",
    )
    assert response.status_code == status.HTTP_200_OK
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
    return response


@pytest.mark.django_db
class TestAuthentication:
    def test_request_otp_success(self, api_client):
        response = api_client.post(reverse("request-otp"), {"phone": "9999999999"}, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["phone"] == "9999999999"
        assert len(response.data["otp"]) == 6

    def test_request_otp_requires_phone(self, api_client):
        response = api_client.post(reverse("request-otp"), {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "phone" in response.data

    def test_verify_otp_creates_worker_and_profile(self, api_client):
        otp = PhoneOTP.objects.create(
            phone="9888888888",
            code="654321",
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        response = api_client.post(
            reverse("verify-otp"),
            {"phone": "9888888888", "otp": "654321", "role": User.Role.WORKER},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        user = User.objects.get(phone="9888888888")
        assert user.role == User.Role.WORKER
        assert hasattr(user, "worker_profile")
        otp.refresh_from_db()
        assert otp.is_verified is True

    def test_verify_otp_rejects_invalid_code(self, api_client, customer):
        PhoneOTP.objects.create(
            phone=customer.phone,
            code="123456",
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        response = api_client.post(
            reverse("verify-otp"),
            {"phone": customer.phone, "otp": "000000", "role": customer.role},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Invalid OTP." in str(response.data)

    def test_verify_otp_rejects_expired_code(self, api_client, customer, expired_time):
        PhoneOTP.objects.create(phone=customer.phone, code="123456", expires_at=expired_time)
        response = api_client.post(
            reverse("verify-otp"),
            {"phone": customer.phone, "otp": "123456", "role": customer.role},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "expired" in str(response.data).lower()


@pytest.mark.django_db
class TestNearbyWorkers:
    def test_nearby_workers_only_returns_approved_within_radius(
        self,
        api_client,
        worker,
        nearby_worker,
        rejected_worker,
        far_worker,
    ):
        response = api_client.get(
            reverse("nearby-workers"),
            {"latitude": 12.9716, "longitude": 77.5946},
        )
        assert response.status_code == status.HTTP_200_OK
        returned_ids = [item["user"]["id"] for item in response.data]
        assert returned_ids == [worker.id, nearby_worker.id]
        assert rejected_worker.id not in returned_ids
        assert far_worker.id not in returned_ids

    def test_nearby_workers_invalid_query(self, api_client):
        response = api_client.get(reverse("nearby-workers"), {"latitude": "bad"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_distance_helper(self):
        distance = calculate_distance_km(12.9716, 77.5946, 12.9721, 77.5990)
        assert distance > 0
        assert round(calculate_distance_km(12.9716, 77.5946, 12.9716, 77.5946), 4) == 0


@pytest.mark.django_db
class TestBookingCreation:
    def test_customer_can_create_booking_and_notify_workers(
        self,
        api_client,
        customer,
        service,
        worker,
        nearby_worker,
    ):
        authenticate(api_client, customer)
        response = api_client.post(
            reverse("booking-create"),
            {
                "service_id": service.id,
                "location": "221B Baker Street",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "time": (timezone.now() + timedelta(days=1)).isoformat(),
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        booking = Booking.objects.get(pk=response.data["id"])
        assert booking.status == Booking.Status.PENDING
        assert booking.worker is None
        assert response.data["notified_workers_count"] == 2
        assert BookingNotification.objects.filter(booking=booking).count() == 2
        notified_ids = list(BookingNotification.objects.filter(booking=booking).values_list("worker_id", flat=True))
        assert sorted(notified_ids) == sorted([worker.id, nearby_worker.id])

    def test_booking_creation_returns_zero_when_no_worker_available(self, api_client, customer, service):
        authenticate(api_client, customer)
        response = api_client.post(
            reverse("booking-create"),
            {
                "service_id": service.id,
                "location": "Remote Area",
                "latitude": 28.6139,
                "longitude": 77.2090,
                "time": (timezone.now() + timedelta(days=1)).isoformat(),
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["notified_workers_count"] == 0

    def test_worker_cannot_create_booking(self, api_client, service, worker):
        authenticate(api_client, worker)
        response = api_client.post(
            reverse("booking-create"),
            {
                "service_id": service.id,
                "location": "221B Baker Street",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "time": (timezone.now() + timedelta(days=1)).isoformat(),
            },
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_booking_requires_service_id(self, api_client, customer):
        authenticate(api_client, customer)
        response = api_client.post(
            reverse("booking-create"),
            {
                "location": "221B Baker Street",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "time": (timezone.now() + timedelta(days=1)).isoformat(),
            },
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "service_id" in response.data


@pytest.mark.django_db
class TestWorkerAssignment:
    def test_worker_can_list_own_notifications(self, api_client, worker, nearby_worker, pending_booking):
        BookingNotification.objects.create(booking=pending_booking, worker=worker, distance_km="0.00")
        BookingNotification.objects.create(booking=pending_booking, worker=nearby_worker, distance_km="0.50")
        authenticate(api_client, worker)
        response = api_client.get(reverse("worker-jobs"))
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["worker"]["id"] == worker.id

    def test_first_accept_gets_assignment(self, api_client, worker, nearby_worker, pending_booking):
        first = BookingNotification.objects.create(booking=pending_booking, worker=worker, distance_km="0.00")
        second = BookingNotification.objects.create(booking=pending_booking, worker=nearby_worker, distance_km="0.50")

        authenticate(api_client, worker)
        response = api_client.post(reverse("booking-accept"), {"notification_id": first.id}, format="json")
        assert response.status_code == status.HTTP_200_OK

        pending_booking.refresh_from_db()
        second.refresh_from_db()
        assert pending_booking.worker_id == worker.id
        assert pending_booking.status == Booking.Status.ACCEPTED
        assert second.status == BookingNotification.Status.MISSED

    def test_second_accept_fails_after_assignment(self, api_client, worker, nearby_worker, pending_booking):
        first = BookingNotification.objects.create(booking=pending_booking, worker=worker, distance_km="0.00")
        second = BookingNotification.objects.create(booking=pending_booking, worker=nearby_worker, distance_km="0.50")
        authenticate(api_client, worker)
        api_client.post(reverse("booking-accept"), {"notification_id": first.id}, format="json")

        authenticate(api_client, nearby_worker)
        response = api_client.post(reverse("booking-accept"), {"notification_id": second.id}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_worker_cannot_accept_others_notification(self, api_client, worker, nearby_worker, pending_booking):
        notification = BookingNotification.objects.create(booking=pending_booking, worker=nearby_worker, distance_km="0.50")
        authenticate(api_client, worker)
        response = api_client.post(reverse("booking-accept"), {"notification_id": notification.id}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_worker_can_reject_pending_notification(self, api_client, worker, pending_booking):
        notification = BookingNotification.objects.create(booking=pending_booking, worker=worker, distance_km="0.00")
        authenticate(api_client, worker)
        response = api_client.post(reverse("booking-reject"), {"notification_id": notification.id}, format="json")
        assert response.status_code == status.HTTP_200_OK
        notification.refresh_from_db()
        assert notification.status == BookingNotification.Status.REJECTED

    def test_reject_fails_when_job_already_assigned(self, api_client, worker, nearby_worker, pending_booking):
        accepted_notification = BookingNotification.objects.create(booking=pending_booking, worker=nearby_worker, distance_km="0.10")
        rejected_notification = BookingNotification.objects.create(booking=pending_booking, worker=worker, distance_km="0.20")
        pending_booking.worker = nearby_worker
        pending_booking.status = Booking.Status.ACCEPTED
        pending_booking.save(update_fields=["worker", "status", "updated_at"])
        accepted_notification.status = BookingNotification.Status.ACCEPTED
        accepted_notification.save(update_fields=["status", "updated_at"])

        authenticate(api_client, worker)
        response = api_client.post(
            reverse("booking-reject"),
            {"notification_id": rejected_notification.id},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestVerification:
    def test_worker_can_upload_aadhaar(self, api_client, worker, aadhaar_file):
        authenticate(api_client, worker)
        response = api_client.post(
            reverse("worker-verification-upload"),
            {"aadhaar_image": aadhaar_file},
            format="multipart",
        )
        assert response.status_code == status.HTTP_200_OK
        worker.worker_profile.refresh_from_db()
        assert worker.worker_profile.aadhaar_image.name.startswith("aadhaar/")
        assert worker.worker_profile.verification_status == WorkerProfile.VerificationStatus.PENDING

    def test_upload_rejects_invalid_extension(self, api_client, worker):
        authenticate(api_client, worker)
        bad_file = SimpleUploadedFile("aadhaar.txt", b"not-valid", content_type="text/plain")
        response = api_client.post(
            reverse("worker-verification-upload"),
            {"aadhaar_image": bad_file},
            format="multipart",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "aadhaar_image" in response.data

    def test_customer_cannot_upload_aadhaar(self, api_client, customer, aadhaar_file):
        authenticate(api_client, customer)
        response = api_client.post(
            reverse("worker-verification-upload"),
            {"aadhaar_image": aadhaar_file},
            format="multipart",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_approve_worker(self, api_client, admin_user, worker):
        worker.worker_profile.verification_status = WorkerProfile.VerificationStatus.PENDING
        worker.worker_profile.save(update_fields=["verification_status"])
        authenticate(api_client, admin_user)
        response = api_client.patch(
            reverse("worker-verification-admin", args=[worker.worker_profile.id]),
            {"verification_status": WorkerProfile.VerificationStatus.APPROVED},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        worker.worker_profile.refresh_from_db()
        assert worker.worker_profile.verification_status == WorkerProfile.VerificationStatus.APPROVED

    def test_admin_can_reject_worker(self, api_client, admin_user, worker):
        authenticate(api_client, admin_user)
        response = api_client.patch(
            reverse("worker-verification-admin", args=[worker.worker_profile.id]),
            {"verification_status": WorkerProfile.VerificationStatus.REJECTED},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        worker.worker_profile.refresh_from_db()
        assert worker.worker_profile.verification_status == WorkerProfile.VerificationStatus.REJECTED

    def test_non_admin_cannot_approve_worker(self, api_client, customer, worker):
        authenticate(api_client, customer)
        response = api_client.patch(
            reverse("worker-verification-admin", args=[worker.worker_profile.id]),
            {"verification_status": WorkerProfile.VerificationStatus.APPROVED},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_cannot_set_pending_status(self, api_client, admin_user, worker):
        authenticate(api_client, admin_user)
        response = api_client.patch(
            reverse("worker-verification-admin", args=[worker.worker_profile.id]),
            {"verification_status": WorkerProfile.VerificationStatus.PENDING},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestModelStringsAndService:
    def test_model_string_representations(self, customer, worker, service, pending_booking):
        otp = PhoneOTP.objects.create(
            phone=customer.phone,
            code="111111",
            expires_at=timezone.now() + timedelta(minutes=5),
        )
        notification = BookingNotification.objects.create(
            booking=pending_booking,
            worker=worker,
            distance_km="0.10",
        )
        assert str(customer).endswith("(customer)")
        assert str(otp) == f"{customer.phone} - 111111"
        assert "WorkerProfile" in str(worker.worker_profile)
        assert str(service) == "Cleaning"
        assert "Booking<" in str(pending_booking)
        assert str(notification) == f"BookingNotification<{pending_booking.id}:{worker.id}>"


@pytest.mark.django_db
class TestWorkerMe:
    def test_worker_can_get_own_profile(self, api_client, worker):
        authenticate(api_client, worker)
        response = api_client.get(reverse("worker-me"))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["user"]["id"] == worker.id
        assert "is_available" in response.data
        assert "work_start_time" in response.data

    def test_customer_cannot_access_worker_me(self, api_client, customer):
        authenticate(api_client, customer)
        response = api_client.get(reverse("worker-me"))
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestWorkerProfileUpdate:
    def test_worker_can_toggle_availability(self, api_client, worker):
        authenticate(api_client, worker)
        response = api_client.patch(
            reverse("worker-profile-update"),
            {"is_available": True},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        worker.worker_profile.refresh_from_db()
        assert worker.worker_profile.is_available is True

    def test_worker_can_set_work_hours(self, api_client, worker):
        authenticate(api_client, worker)
        response = api_client.patch(
            reverse("worker-profile-update"),
            {"work_start_time": "09:00:00", "work_end_time": "18:00:00"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        worker.worker_profile.refresh_from_db()
        assert str(worker.worker_profile.work_start_time) == "09:00:00"
        assert str(worker.worker_profile.work_end_time) == "18:00:00"

    def test_worker_can_update_name_and_bio(self, api_client, worker):
        authenticate(api_client, worker)
        response = api_client.patch(
            reverse("worker-profile-update"),
            {"full_name": "Aarav Singh", "bio": "Expert cleaner."},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        worker.worker_profile.refresh_from_db()
        assert worker.worker_profile.full_name == "Aarav Singh"
        assert worker.worker_profile.bio == "Expert cleaner."

    def test_customer_cannot_update_worker_profile(self, api_client, customer):
        authenticate(api_client, customer)
        response = api_client.patch(
            reverse("worker-profile-update"),
            {"is_available": True},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestWorkerVerificationSelfie:
    def test_worker_can_upload_selfie(self, api_client, worker):
        from django.core.files.uploadedfile import SimpleUploadedFile
        authenticate(api_client, worker)
        selfie_file = SimpleUploadedFile("selfie.jpg", b"fake-selfie-content", content_type="image/jpeg")
        response = api_client.post(
            reverse("worker-verification-upload"),
            {"selfie_image": selfie_file},
            format="multipart",
        )
        assert response.status_code == status.HTTP_200_OK
        worker.worker_profile.refresh_from_db()
        assert worker.worker_profile.selfie_image.name.startswith("selfies/")
        assert worker.worker_profile.verification_status == WorkerProfile.VerificationStatus.PENDING

    def test_selfie_rejects_invalid_extension(self, api_client, worker):
        from django.core.files.uploadedfile import SimpleUploadedFile
        authenticate(api_client, worker)
        bad_file = SimpleUploadedFile("selfie.pdf", b"not-valid", content_type="application/pdf")
        response = api_client.post(
            reverse("worker-verification-upload"),
            {"selfie_image": bad_file},
            format="multipart",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "selfie_image" in response.data


@pytest.mark.django_db
class TestWorkerPortfolio:
    def test_worker_can_upload_portfolio_image(self, api_client, worker):
        from django.core.files.uploadedfile import SimpleUploadedFile
        authenticate(api_client, worker)
        image_file = SimpleUploadedFile("work.jpg", b"fake-image-content", content_type="image/jpeg")
        response = api_client.post(
            reverse("worker-portfolio"),
            {"image": image_file, "caption": "Kitchen clean"},
            format="multipart",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["caption"] == "Kitchen clean"

    def test_worker_can_list_portfolio(self, api_client, worker):
        authenticate(api_client, worker)
        response = api_client.get(reverse("worker-portfolio"))
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)

    def test_worker_can_delete_portfolio_image(self, api_client, worker):
        from django.core.files.uploadedfile import SimpleUploadedFile
        from bookings.models import WorkerPortfolioImage
        profile = worker.worker_profile
        image_file = SimpleUploadedFile("del.jpg", b"content", content_type="image/jpeg")
        img = WorkerPortfolioImage.objects.create(worker_profile=profile, caption="To delete", image=image_file)
        authenticate(api_client, worker)
        response = api_client.delete(reverse("worker-portfolio-delete", args=[img.id]))
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not WorkerPortfolioImage.objects.filter(pk=img.id).exists()

    def test_customer_cannot_access_portfolio(self, api_client, customer):
        authenticate(api_client, customer)
        response = api_client.get(reverse("worker-portfolio"))
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestWorkerChats:
    def test_worker_can_list_accepted_bookings_as_chats(self, api_client, worker, customer, service):
        booking = Booking.objects.create(
            user=customer,
            worker=worker,
            service=service,
            status=Booking.Status.ACCEPTED,
            price=service.base_price,
            location="Test Location",
            latitude=12.9716,
            longitude=77.5946,
            time=timezone.now() + timedelta(days=1),
        )
        authenticate(api_client, worker)
        response = api_client.get(reverse("worker-chats"))
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["id"] == booking.id

    def test_customer_cannot_access_worker_chats(self, api_client, customer):
        authenticate(api_client, customer)
        response = api_client.get(reverse("worker-chats"))
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestWorkHoursFiltering:
    def test_booking_only_notifies_workers_within_work_hours(self, api_client, customer, service):
        from bookings.models import WorkerProfile
        import datetime
        user = User.objects.create_user(phone="9000000020", role=User.Role.WORKER)
        WorkerProfile.objects.create(
            user=user,
            skills="Cleaning",
            rating="4.50",
            verification_status=WorkerProfile.VerificationStatus.APPROVED,
            location="Downtown",
            latitude=12.9716,
            longitude=77.5946,
            is_available=True,
            work_start_time=datetime.time(9, 0),
            work_end_time=datetime.time(18, 0),
        )
        authenticate(api_client, customer)
        booking_time = timezone.now().replace(hour=2, minute=0, second=0, microsecond=0) + timedelta(days=1)
        response = api_client.post(
            reverse("booking-create"),
            {
                "service_id": service.id,
                "location": "221B Baker Street",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "time": booking_time.isoformat(),
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["notified_workers_count"] == 0

    def test_booking_notifies_worker_with_null_work_hours(self, api_client, customer, service):
        authenticate(api_client, customer)
        user = User.objects.create_user(phone="9000000021", role=User.Role.WORKER)
        WorkerProfile.objects.create(
            user=user,
            skills="Cleaning",
            rating="4.50",
            verification_status=WorkerProfile.VerificationStatus.APPROVED,
            location="Downtown",
            latitude=12.9716,
            longitude=77.5946,
            is_available=True,
            work_start_time=None,
            work_end_time=None,
        )
        response = api_client.post(
            reverse("booking-create"),
            {
                "service_id": service.id,
                "location": "221B Baker Street",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "time": (timezone.now() + timedelta(days=1)).isoformat(),
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["notified_workers_count"] == 1


@pytest.mark.django_db
class TestSubServicesAndOTPCreated:
    def test_otp_verify_returns_created_flag_true_for_new_user(self, api_client):
        otp = PhoneOTP.objects.create(
            phone="9777777777",
            code="111222",
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        response = api_client.post(
            reverse("verify-otp"),
            {"phone": "9777777777", "otp": "111222", "role": User.Role.WORKER},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["created"] is True

    def test_otp_verify_returns_created_flag_false_for_existing_user(self, api_client, customer):
        otp = PhoneOTP.objects.create(
            phone=customer.phone,
            code="333444",
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        response = api_client.post(
            reverse("verify-otp"),
            {"phone": customer.phone, "otp": "333444", "role": customer.role},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["created"] is False

    def test_services_include_sub_services(self, api_client, service):
        from bookings.models import SubService
        SubService.objects.create(service=service, name="Deep Clean")
        SubService.objects.create(service=service, name="Regular Clean")
        response = api_client.get(reverse("service-list"))
        assert response.status_code == status.HTTP_200_OK
        service_data = next(s for s in response.data if s["id"] == service.id)
        assert len(service_data["sub_services"]) == 2
        sub_names = [s["name"] for s in service_data["sub_services"]]
        assert "Deep Clean" in sub_names

    def test_worker_can_set_sub_services(self, api_client, worker, service):
        from bookings.models import SubService, WorkerService
        sub1 = SubService.objects.create(service=service, name="Deep Clean")
        sub2 = SubService.objects.create(service=service, name="Regular Clean")
        authenticate(api_client, worker)
        response = api_client.patch(
            reverse("worker-profile-update"),
            {"sub_service_ids": [sub1.id, sub2.id]},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert WorkerService.objects.filter(worker_profile=worker.worker_profile).count() == 2

from datetime import timedelta

from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

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


class BookingFlowTests(APITestCase):
    def setUp(self):
        self.service = Service.objects.create(name="Cleaning", base_price="499.00")
        self.worker = User.objects.create_user(phone="9000000002", role=User.Role.WORKER)
        WorkerProfile.objects.create(
            user=self.worker,
            skills="Cleaning",
            rating="4.50",
            verification_status=WorkerProfile.VerificationStatus.APPROVED,
            location="Downtown",
            latitude=12.9716,
            longitude=77.5946,
        )
        WorkerPortfolioImage.objects.create(
            worker_profile=self.worker.worker_profile,
            image_url="https://example.com/portfolio-1.jpg",
            caption="Kitchen deep clean",
        )
        WorkerReview.objects.create(
            worker_profile=self.worker.worker_profile,
            customer_name="Aisha",
            rating="4.80",
            comment="Great work",
        )
        self.nearby_worker = User.objects.create_user(phone="9000000003", role=User.Role.WORKER)
        WorkerProfile.objects.create(
            user=self.nearby_worker,
            skills="Electrical",
            rating="4.70",
            verification_status=WorkerProfile.VerificationStatus.APPROVED,
            location="MG Road",
            latitude=12.9721,
            longitude=77.5990,
        )
        self.far_worker = User.objects.create_user(phone="9000000004", role=User.Role.WORKER)
        WorkerProfile.objects.create(
            user=self.far_worker,
            skills="Plumbing",
            rating="4.20",
            verification_status=WorkerProfile.VerificationStatus.APPROVED,
            location="Airport",
            latitude=13.1986,
            longitude=77.7066,
        )
        self.customer = User.objects.create_user(phone="9000000001", role=User.Role.CUSTOMER)
        self.admin_user = User.objects.create_user(
            phone="9000000009",
            role=User.Role.CUSTOMER,
            is_staff=True,
        )

    def authenticate(self, user):
        otp = PhoneOTP.objects.create(
            phone=user.phone,
            code="123456",
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        response = self.client.post(
            reverse("verify-otp"),
            {"phone": user.phone, "otp": otp.code, "role": user.role},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_request_otp(self):
        response = self.client.post(
            reverse("request-otp"),
            {"phone": "9999999999"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("otp", response.data)

    def test_customer_can_create_booking(self):
        self.authenticate(self.customer)
        response = self.client.post(
            reverse("booking-create"),
            {
                "service_id": self.service.id,
                "location": "221B Baker Street",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "time": (timezone.now() + timedelta(days=1)).isoformat(),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], Booking.Status.PENDING)
        self.assertEqual(response.data["price"], "499.00")
        self.assertIsNone(response.data["worker"])
        self.assertEqual(response.data["notified_workers_count"], 2)
        self.assertEqual(BookingNotification.objects.count(), 2)

    def test_worker_can_accept_notified_job_and_get_assigned(self):
        booking = Booking.objects.create(
            user=self.customer,
            service=self.service,
            status=Booking.Status.PENDING,
            price=self.service.base_price,
            location="221B Baker Street",
            latitude=12.9716,
            longitude=77.5946,
            time=timezone.now() + timedelta(days=1),
        )
        notification = BookingNotification.objects.create(
            booking=booking,
            worker=self.worker,
            distance_km="0.00",
        )
        self.authenticate(self.worker)
        response = self.client.post(
            reverse("booking-accept"),
            {"notification_id": notification.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.Status.ACCEPTED)
        self.assertEqual(booking.worker_id, self.worker.id)

    def test_first_worker_to_accept_gets_assigned(self):
        booking = Booking.objects.create(
            user=self.customer,
            service=self.service,
            status=Booking.Status.PENDING,
            price=self.service.base_price,
            location="221B Baker Street",
            latitude=12.9716,
            longitude=77.5946,
            time=timezone.now() + timedelta(days=1),
        )
        first_notification = BookingNotification.objects.create(
            booking=booking,
            worker=self.worker,
            distance_km="0.00",
        )
        second_notification = BookingNotification.objects.create(
            booking=booking,
            worker=self.nearby_worker,
            distance_km="0.50",
        )

        self.authenticate(self.worker)
        first_response = self.client.post(
            reverse("booking-accept"),
            {"notification_id": first_notification.id},
            format="json",
        )
        self.assertEqual(first_response.status_code, status.HTTP_200_OK)

        self.authenticate(self.nearby_worker)
        second_response = self.client.post(
            reverse("booking-accept"),
            {"notification_id": second_notification.id},
            format="json",
        )
        self.assertEqual(second_response.status_code, status.HTTP_400_BAD_REQUEST)
        booking.refresh_from_db()
        second_notification.refresh_from_db()
        self.assertEqual(booking.worker_id, self.worker.id)
        self.assertEqual(second_notification.status, BookingNotification.Status.MISSED)

    def test_worker_can_list_notifications(self):
        booking = Booking.objects.create(
            user=self.customer,
            service=self.service,
            status=Booking.Status.PENDING,
            price=self.service.base_price,
            location="221B Baker Street",
            latitude=12.9716,
            longitude=77.5946,
            time=timezone.now() + timedelta(days=1),
        )
        BookingNotification.objects.create(
            booking=booking,
            worker=self.worker,
            distance_km="0.00",
        )
        self.authenticate(self.worker)
        response = self.client.get(reverse("worker-jobs"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["booking"]["id"], booking.id)

    def test_customer_can_view_worker_profile_details(self):
        response = self.client.get(reverse("worker-detail", args=[self.worker.worker_profile.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["portfolio_images"]), 1)
        self.assertEqual(len(response.data["reviews"]), 1)

    def test_customer_and_worker_can_exchange_booking_messages(self):
        booking = Booking.objects.create(
            user=self.customer,
            worker=self.worker,
            service=self.service,
            status=Booking.Status.ACCEPTED,
            price=self.service.base_price,
            location="221B Baker Street",
            latitude=12.9716,
            longitude=77.5946,
            time=timezone.now() + timedelta(days=1),
        )
        self.authenticate(self.customer)
        response = self.client.post(
            reverse("booking-messages", args=[booking.id]),
            {"message": "Please call before arriving."},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.client.credentials()
        self.authenticate(self.worker)
        list_response = self.client.get(reverse("booking-messages", args=[booking.id]))
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 1)
        self.assertEqual(list_response.data[0]["message"], "Please call before arriving.")
        self.assertEqual(BookingMessage.objects.filter(booking=booking).count(), 1)

    def test_worker_can_upload_aadhaar_document(self):
        self.authenticate(self.worker)
        file = SimpleUploadedFile("aadhaar.jpg", b"fake-image-content", content_type="image/jpeg")
        response = self.client.post(
            reverse("worker-verification-upload"),
            {"aadhaar_image": file},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.worker.worker_profile.refresh_from_db()
        self.assertTrue(self.worker.worker_profile.aadhaar_image.name.startswith("aadhaar/"))
        self.assertEqual(
            self.worker.worker_profile.verification_status,
            WorkerProfile.VerificationStatus.PENDING,
        )

    def test_admin_can_approve_worker_verification(self):
        self.worker.worker_profile.verification_status = WorkerProfile.VerificationStatus.PENDING
        self.worker.worker_profile.save(update_fields=["verification_status"])
        self.authenticate(self.admin_user)
        response = self.client.patch(
            reverse("worker-verification-admin", args=[self.worker.worker_profile.id]),
            {"verification_status": WorkerProfile.VerificationStatus.APPROVED},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.worker.worker_profile.refresh_from_db()
        self.assertEqual(
            self.worker.worker_profile.verification_status,
            WorkerProfile.VerificationStatus.APPROVED,
        )

    def test_non_admin_cannot_approve_worker_verification(self):
        self.authenticate(self.customer)
        response = self.client.patch(
            reverse("worker-verification-admin", args=[self.worker.worker_profile.id]),
            {"verification_status": WorkerProfile.VerificationStatus.APPROVED},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_nearby_workers_are_filtered_within_five_km_and_sorted(self):
        response = self.client.get(
            reverse("nearby-workers"),
            {"latitude": 12.9716, "longitude": 77.5946},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]["user"]["id"], self.worker.id)
        self.assertEqual(response.data[1]["user"]["id"], self.nearby_worker.id)
        returned_ids = [item["user"]["id"] for item in response.data]
        self.assertNotIn(self.far_worker.id, returned_ids)

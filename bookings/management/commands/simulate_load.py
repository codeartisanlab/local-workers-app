import random
from collections import Counter
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from bookings.models import BookingNotification, Service, User, WorkerProfile


SIM_PHONE_PREFIX = "77000"
CENTER_LAT = 12.9716
CENTER_LON = 77.5946


class Command(BaseCommand):
    help = "Simulate 50 randomized users creating bookings and workers accepting jobs."

    def add_arguments(self, parser):
        parser.add_argument("--users", type=int, default=50, help="Number of customer booking attempts to simulate.")
        parser.add_argument(
            "--seed",
            type=int,
            default=42,
            help="Random seed for reproducible simulations.",
        )

    def handle(self, *args, **options):
        random.seed(options["seed"])
        total_users = options["users"]

        self._reset_simulation_data()
        service = self._seed_service()
        workers = self._seed_workers()
        customers = self._seed_customers(total_users)

        results = Counter()
        failures = []

        for index, customer in enumerate(customers, start=1):
            client = APIClient()
            client.force_authenticate(user=customer)

            latitude, longitude, edge_case = self._random_booking_coordinates(index)
            payload = {
                "service_id": service.id,
                "location": f"Simulation Block {index}",
                "latitude": latitude,
                "longitude": longitude,
                "time": (timezone.now() + timedelta(hours=random.randint(1, 72))).isoformat(),
            }

            try:
                response = client.post(reverse("booking-create"), payload, format="json", HTTP_HOST="localhost")
            except Exception as exc:  # pragma: no cover - crash reporting path
                failures.append(f"booking-crash user={customer.phone}: {exc}")
                results["booking_crashes"] += 1
                continue

            if response.status_code != 201:
                failures.append(
                    f"booking-failed user={customer.phone} status={response.status_code} body={getattr(response, 'data', {})}"
                )
                results["booking_failures"] += 1
                continue

            results["booking_successes"] += 1
            results[f"edge_case_{edge_case}"] += 1
            notified = response.data.get("notified_workers_count", 0)
            if notified == 0:
                results["bookings_without_available_workers"] += 1
                continue

            notification_ids = list(
                BookingNotification.objects.filter(booking_id=response.data["id"]).values_list("id", flat=True)
            )
            if not notification_ids:
                failures.append(f"booking={response.data['id']} reported notifications but none were created")
                results["notification_mismatches"] += 1
                continue

            first_notification = BookingNotification.objects.select_related("worker").get(pk=notification_ids[0])
            accept_client = APIClient()
            accept_client.force_authenticate(user=first_notification.worker)

            try:
                accept_response = accept_client.post(
                    reverse("booking-accept"),
                    {"notification_id": first_notification.id},
                    format="json",
                    HTTP_HOST="localhost",
                )
            except Exception as exc:  # pragma: no cover - crash reporting path
                failures.append(f"accept-crash notification={first_notification.id}: {exc}")
                results["accept_crashes"] += 1
                continue

            if accept_response.status_code == 200:
                results["first_accept_successes"] += 1
            else:
                failures.append(
                    f"accept-failed notification={first_notification.id} status={accept_response.status_code} body={getattr(accept_response, 'data', {})}"
                )
                results["first_accept_failures"] += 1
                continue

            if len(notification_ids) > 1:
                second_notification = BookingNotification.objects.select_related("worker").get(pk=notification_ids[1])
                second_client = APIClient()
                second_client.force_authenticate(user=second_notification.worker)
                second_response = second_client.post(
                    reverse("booking-accept"),
                    {"notification_id": second_notification.id},
                    format="json",
                    HTTP_HOST="localhost",
                )
                if second_response.status_code == 400:
                    results["second_accept_rejected_cleanly"] += 1
                else:
                    failures.append(
                        f"second-accept-unexpected notification={second_notification.id} status={second_response.status_code} body={getattr(second_response, 'data', {})}"
                    )
                    results["second_accept_unexpected"] += 1

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Simulation completed"))
        self.stdout.write(f"Seed: {options['seed']}")
        self.stdout.write(f"Total simulated users: {total_users}")
        for key in sorted(results):
            self.stdout.write(f"- {key}: {results[key]}")

        if failures:
            self.stdout.write("")
            self.stdout.write(self.style.WARNING("Failures detected:"))
            for failure in failures:
                self.stdout.write(f"- {failure}")
        else:
            self.stdout.write("")
            self.stdout.write(self.style.SUCCESS("No failures or crashes detected in this simulation run."))

    def _reset_simulation_data(self):
        User.objects.filter(phone__startswith=SIM_PHONE_PREFIX).delete()

    def _seed_service(self):
        service, _ = Service.objects.get_or_create(
            name="Simulation Cleaning",
            defaults={"base_price": "399.00"},
        )
        return service

    def _seed_workers(self):
        workers = []

        approved_nearby_coordinates = [
            (12.9716, 77.5946),
            (12.9720, 77.5960),
            (12.9731, 77.5920),
            (12.9700, 77.5902),
            (12.9688, 77.5982),
            (12.9699, 77.6011),
            (12.9750, 77.5952),
            (12.9670, 77.5931),
        ]
        for index, (lat, lon) in enumerate(approved_nearby_coordinates, start=1):
            user = User.objects.create_user(phone=f"{SIM_PHONE_PREFIX}8{index:03d}", role=User.Role.WORKER)
            WorkerProfile.objects.create(
                user=user,
                skills="Cleaning, Plumbing",
                rating="4.50",
                verification_status=WorkerProfile.VerificationStatus.APPROVED,
                location=f"Nearby Zone {index}",
                latitude=lat,
                longitude=lon,
            )
            workers.append(user)

        edge_workers = [
            ("rejected", WorkerProfile.VerificationStatus.REJECTED, 12.9717, 77.5947),
            ("pending", WorkerProfile.VerificationStatus.PENDING, 12.9718, 77.5948),
            ("far", WorkerProfile.VerificationStatus.APPROVED, 13.1986, 77.7066),
            ("missing-coords", WorkerProfile.VerificationStatus.APPROVED, None, None),
        ]
        for index, (_, status, lat, lon) in enumerate(edge_workers, start=1):
            user = User.objects.create_user(phone=f"{SIM_PHONE_PREFIX}9{index:03d}", role=User.Role.WORKER)
            WorkerProfile.objects.create(
                user=user,
                skills="Electrical",
                rating="4.10",
                verification_status=status,
                location=f"Edge Worker {index}",
                latitude=lat,
                longitude=lon,
            )

        return workers

    def _seed_customers(self, total_users):
        customers = []
        for index in range(1, total_users + 1):
            user = User.objects.create_user(phone=f"{SIM_PHONE_PREFIX}1{index:03d}", role=User.Role.CUSTOMER)
            customers.append(user)
        return customers

    def _random_booking_coordinates(self, index):
        pattern = index % 5
        if pattern == 0:
            return 28.6139, 77.2090, "no_worker_far_city"
        if pattern == 1:
            return (
                CENTER_LAT + random.uniform(-0.01, 0.01),
                CENTER_LON + random.uniform(-0.01, 0.01),
                "nearby_workers_available",
            )
        if pattern == 2:
            return (
                CENTER_LAT + random.uniform(-0.025, 0.025),
                CENTER_LON + random.uniform(-0.025, 0.025),
                "mixed_radius_boundary",
            )
        if pattern == 3:
            return 12.9610, 77.5840, "sparser_nearby_area"
        return 12.9850, 77.6100, "alternate_nearby_cluster"

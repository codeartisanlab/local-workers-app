from datetime import datetime

from django.utils import timezone
from django.core.management.base import BaseCommand

from bookings.models import (
    Booking,
    BookingMessage,
    Service,
    SubService,
    User,
    WorkerPortfolioImage,
    WorkerProfile,
    WorkerReview,
    WorkerService,
)


class Command(BaseCommand):
    help = "Seed demo services, workers, and an admin user for local testing."

    def handle(self, *args, **options):
        services_config = [
            ("Cleaning", "499.00", ["Deep Clean", "Regular Clean", "Deep Sanitization"]),
            ("Plumbing", "699.00", ["Pipe Repair", "Drain Unclog", "Fixture Installation"]),
            ("Electrical", "799.00", ["Wiring", "Appliance Repair", "Panel Upgrade"]),
        ]
        service_objects = {}
        for name, base_price, sub_names in services_config:
            service, _ = Service.objects.get_or_create(name=name, defaults={"base_price": base_price})
            service_objects[name] = service
            for sub_name in sub_names:
                SubService.objects.get_or_create(service=service, name=sub_name)

        workers = [
            ("9000000002", "Cleaning, Deep Sanitization", "Downtown", 12.9716, 77.5946, "Cleaning"),
            ("9000000003", "Electrical, Appliance Repair", "MG Road", 12.9721, 77.5990, "Electrical"),
            ("9000000004", "Plumbing", "Richmond Town", 12.9675, 77.6002, "Plumbing"),
        ]
        for phone, skills, location, latitude, longitude, primary_service in workers:
            user, _ = User.objects.get_or_create(phone=phone, defaults={"role": User.Role.WORKER})
            if user.role != User.Role.WORKER:
                user.role = User.Role.WORKER
                user.save(update_fields=["role"])
            profile, _ = WorkerProfile.objects.update_or_create(
                user=user,
                defaults={
                    "skills": skills,
                    "rating": "4.50",
                    "verification_status": WorkerProfile.VerificationStatus.APPROVED,
                    "location": location,
                    "latitude": latitude,
                    "longitude": longitude,
                    "is_available": True,
                },
            )
            service_obj = service_objects.get(primary_service)
            if service_obj:
                for sub in service_obj.sub_services.all():
                    WorkerService.objects.get_or_create(worker_profile=profile, sub_service=sub)

            WorkerPortfolioImage.objects.get_or_create(
                worker_profile=profile,
                image_url=f"https://images.unsplash.com/photo-151{abs(hash(phone)) % 1000000}?auto=format&fit=crop&w=800&q=80",
                defaults={"caption": f"{location} portfolio shot"},
            )
            WorkerPortfolioImage.objects.get_or_create(
                worker_profile=profile,
                image_url=f"https://images.unsplash.com/photo-152{abs(hash(phone + 'b')) % 1000000}?auto=format&fit=crop&w=800&q=80",
                defaults={"caption": f"{skills.split(',')[0]} work sample"},
            )
            WorkerReview.objects.get_or_create(
                worker_profile=profile,
                customer_name="Aisha Patel",
                defaults={"rating": "4.80", "comment": "Very professional and arrived on time."},
            )
            WorkerReview.objects.get_or_create(
                worker_profile=profile,
                customer_name="Rohan Mehta",
                defaults={"rating": "4.60", "comment": "Clean work and great communication."},
            )

        customer_user, _ = User.objects.get_or_create(
            phone="9000000001",
            defaults={"role": User.Role.CUSTOMER},
        )

        admin_user, created = User.objects.get_or_create(
            phone="9000000009",
            defaults={"role": User.Role.CUSTOMER, "is_staff": True, "is_superuser": True},
        )
        if not created and (not admin_user.is_staff or not admin_user.is_superuser):
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.save(update_fields=["is_staff", "is_superuser"])

        lead_worker = User.objects.get(phone="9000000002")
        cleaning_service = Service.objects.get(name="Cleaning")
        booking, _ = Booking.objects.get_or_create(
            user=customer_user,
            worker=lead_worker,
            service=cleaning_service,
            location="221B Baker Street",
            latitude=12.9716,
            longitude=77.5946,
            time=timezone.make_aware(datetime(2026, 3, 30, 10, 0, 0)),
            defaults={"status": Booking.Status.ACCEPTED, "price": cleaning_service.base_price},
        )
        BookingMessage.objects.get_or_create(
            booking=booking,
            sender=customer_user,
            message="Hi, please bring your deep cleaning kit.",
        )
        BookingMessage.objects.get_or_create(
            booking=booking,
            sender=lead_worker,
            message="Sure, I will be there 10 minutes early.",
        )

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully."))

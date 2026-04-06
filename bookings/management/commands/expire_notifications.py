from django.core.management.base import BaseCommand
from django.utils import timezone

from bookings.models import BookingNotification


class Command(BaseCommand):
    help = "Mark pending booking notifications as missed if they have passed their expiry time."

    def handle(self, *args, **options):
        expired = BookingNotification.objects.filter(
            status=BookingNotification.Status.PENDING,
            expires_at__lt=timezone.now(),
        )
        count = expired.update(status=BookingNotification.Status.MISSED)
        self.stdout.write(self.style.SUCCESS(f"Expired {count} pending notification(s)."))

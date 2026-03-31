from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("bookings", "0004_workerprofile_aadhaar_image_and_status_update"),
    ]

    operations = [
        migrations.CreateModel(
            name="WorkerPortfolioImage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("image_url", models.URLField()),
                ("caption", models.CharField(blank=True, max_length=140)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("worker_profile", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="portfolio_images", to="bookings.workerprofile")),
            ],
        ),
        migrations.CreateModel(
            name="WorkerReview",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("customer_name", models.CharField(max_length=120)),
                ("rating", models.DecimalField(decimal_places=2, max_digits=3)),
                ("comment", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("worker_profile", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reviews", to="bookings.workerprofile")),
            ],
        ),
        migrations.CreateModel(
            name="BookingMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("message", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("booking", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="messages", to="bookings.booking")),
                ("sender", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="booking_messages", to="bookings.user")),
            ],
        ),
    ]

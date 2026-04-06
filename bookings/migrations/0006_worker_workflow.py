import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("bookings", "0005_workerportfolioimage_workerreview_bookingmessage"),
    ]

    operations = [
        # WorkerProfile new fields
        migrations.AddField(
            model_name="workerprofile",
            name="full_name",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="workerprofile",
            name="bio",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="workerprofile",
            name="selfie_image",
            field=models.FileField(blank=True, null=True, upload_to="selfies/"),
        ),
        migrations.AddField(
            model_name="workerprofile",
            name="is_available",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="workerprofile",
            name="work_start_time",
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="workerprofile",
            name="work_end_time",
            field=models.TimeField(blank=True, null=True),
        ),
        # WorkerPortfolioImage: add image field, make image_url optional
        migrations.AddField(
            model_name="workerportfolioimage",
            name="image",
            field=models.FileField(blank=True, null=True, upload_to="portfolio/"),
        ),
        migrations.AlterField(
            model_name="workerportfolioimage",
            name="image_url",
            field=models.URLField(blank=True),
        ),
        # BookingNotification: add expires_at
        migrations.AddField(
            model_name="bookingnotification",
            name="expires_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        # SubService model
        migrations.CreateModel(
            name="SubService",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100)),
                (
                    "service",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="sub_services",
                        to="bookings.service",
                    ),
                ),
            ],
        ),
        # WorkerService model
        migrations.CreateModel(
            name="WorkerService",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "worker_profile",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="worker_services",
                        to="bookings.workerprofile",
                    ),
                ),
                (
                    "sub_service",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="worker_services",
                        to="bookings.subservice",
                    ),
                ),
            ],
            options={
                "unique_together": {("worker_profile", "sub_service")},
            },
        ),
    ]

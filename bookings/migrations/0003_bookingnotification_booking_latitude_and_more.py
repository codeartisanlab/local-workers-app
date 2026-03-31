from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("bookings", "0002_workerprofile_latitude_workerprofile_longitude"),
    ]

    operations = [
        migrations.AddField(
            model_name="booking",
            name="latitude",
            field=models.FloatField(default=0),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="booking",
            name="longitude",
            field=models.FloatField(default=0),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name="booking",
            name="worker",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="assigned_bookings", to="bookings.user"),
        ),
        migrations.CreateModel(
            name="BookingNotification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(choices=[("pending", "Pending"), ("accepted", "Accepted"), ("rejected", "Rejected"), ("missed", "Missed")], default="pending", max_length=20)),
                ("distance_km", models.DecimalField(decimal_places=2, max_digits=6)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("booking", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="notifications", to="bookings.booking")),
                ("worker", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="booking_notifications", to="bookings.user")),
            ],
            options={
                "unique_together": {("booking", "worker")},
            },
        ),
    ]

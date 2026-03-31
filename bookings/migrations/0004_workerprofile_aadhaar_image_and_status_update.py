from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("bookings", "0003_bookingnotification_booking_latitude_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="workerprofile",
            name="aadhaar_image",
            field=models.FileField(blank=True, null=True, upload_to="aadhaar/"),
        ),
        migrations.AlterField(
            model_name="workerprofile",
            name="verification_status",
            field=models.CharField(
                choices=[("pending", "Pending"), ("approved", "Approved"), ("rejected", "Rejected")],
                default="pending",
                max_length=20,
            ),
        ),
        migrations.RunSQL(
            "UPDATE bookings_workerprofile SET verification_status = 'approved' WHERE verification_status = 'verified';",
            reverse_sql="UPDATE bookings_workerprofile SET verification_status = 'verified' WHERE verification_status = 'approved';",
        ),
    ]

from django.contrib import admin

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

admin.site.register(User)
admin.site.register(PhoneOTP)
admin.site.register(WorkerProfile)
admin.site.register(Service)
admin.site.register(Booking)
admin.site.register(BookingNotification)
admin.site.register(BookingMessage)
admin.site.register(WorkerPortfolioImage)
admin.site.register(WorkerReview)

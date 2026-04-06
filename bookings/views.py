from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Booking, BookingMessage, BookingNotification, Service, User, WorkerPortfolioImage, WorkerProfile
from .serializers import (
    BookingCreateSerializer,
    BookingMessageCreateSerializer,
    BookingMessageSerializer,
    BookingNotificationSerializer,
    BookingSerializer,
    NearbyWorkerQuerySerializer,
    OTPRequestSerializer,
    OTPVerifySerializer,
    ServiceSerializer,
    WorkerChatSerializer,
    WorkerPortfolioImageSerializer,
    WorkerPortfolioUploadSerializer,
    WorkerProfileDetailsSerializer,
    WorkerProfileSerializer,
    WorkerProfileUpdateSerializer,
    WorkerVerificationAdminSerializer,
    WorkerVerificationUploadSerializer,
    WorkerBookingAcceptanceSerializer,
    WorkerBookingRejectionSerializer,
)


class AllowAnyForAuth(permissions.BasePermission):
    def has_permission(self, request, view):
        return True


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class OTPRequestAPIView(APIView):
    permission_classes = [AllowAnyForAuth]

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        otp = serializer.save()
        return Response(
            {
                "message": "OTP generated successfully.",
                "phone": otp.phone,
                "otp": otp.code,
                "expires_at": otp.expires_at,
            },
            status=status.HTTP_201_CREATED,
        )


class OTPVerifyAPIView(APIView):
    permission_classes = [AllowAnyForAuth]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.save()
        return Response(data, status=status.HTTP_200_OK)


class ServiceListAPIView(generics.ListAPIView):
    queryset = Service.objects.prefetch_related("sub_services").order_by("name")
    serializer_class = ServiceSerializer
    permission_classes = [AllowAnyForAuth]


class NearbyWorkerListAPIView(APIView):
    permission_classes = [AllowAnyForAuth]

    def get(self, request):
        serializer = NearbyWorkerQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        workers = serializer.get_nearby_workers()
        return Response(WorkerProfileSerializer(workers, many=True).data, status=status.HTTP_200_OK)


class WorkerProfileDetailAPIView(generics.RetrieveAPIView):
    queryset = WorkerProfile.objects.select_related("user").prefetch_related("portfolio_images", "reviews", "worker_services__sub_service__service")
    serializer_class = WorkerProfileDetailsSerializer
    permission_classes = [AllowAnyForAuth]


class WorkerMeAPIView(APIView):
    def get(self, request):
        if request.user.role != User.Role.WORKER:
            return Response({"detail": "Only workers can access this endpoint."}, status=status.HTTP_403_FORBIDDEN)
        worker_profile = getattr(request.user, "worker_profile", None)
        if worker_profile is None:
            return Response({"detail": "Worker profile not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = WorkerProfileDetailsSerializer(
            worker_profile,
            context={"request": request},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class WorkerProfileUpdateAPIView(APIView):
    def patch(self, request):
        if request.user.role != User.Role.WORKER:
            return Response({"detail": "Only workers can update their profile."}, status=status.HTTP_403_FORBIDDEN)
        worker_profile = getattr(request.user, "worker_profile", None)
        if worker_profile is None:
            return Response({"detail": "Worker profile not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = WorkerProfileUpdateSerializer(worker_profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        return Response(WorkerProfileDetailsSerializer(profile, context={"request": request}).data, status=status.HTTP_200_OK)


class WorkerVerificationUploadAPIView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if request.user.role != User.Role.WORKER:
            return Response({"detail": "Only workers can upload verification documents."}, status=status.HTTP_403_FORBIDDEN)
        worker_profile = getattr(request.user, "worker_profile", None)
        if worker_profile is None:
            return Response({"detail": "Worker profile not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = WorkerVerificationUploadSerializer(worker_profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        return Response(WorkerProfileSerializer(profile).data, status=status.HTTP_200_OK)


class WorkerVerificationAdminAPIView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, worker_profile_id):
        worker_profile = generics.get_object_or_404(WorkerProfile.objects.select_related("user"), pk=worker_profile_id)
        serializer = WorkerVerificationAdminSerializer(worker_profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        return Response(WorkerProfileSerializer(profile).data, status=status.HTTP_200_OK)


class WorkerPortfolioListCreateAPIView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        if request.user.role != User.Role.WORKER:
            return Response({"detail": "Only workers can access portfolio."}, status=status.HTTP_403_FORBIDDEN)
        worker_profile = getattr(request.user, "worker_profile", None)
        if worker_profile is None:
            return Response({"detail": "Worker profile not found."}, status=status.HTTP_404_NOT_FOUND)
        images = worker_profile.portfolio_images.order_by("-created_at")
        serializer = WorkerPortfolioImageSerializer(images, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        if request.user.role != User.Role.WORKER:
            return Response({"detail": "Only workers can upload portfolio images."}, status=status.HTTP_403_FORBIDDEN)
        worker_profile = getattr(request.user, "worker_profile", None)
        if worker_profile is None:
            return Response({"detail": "Worker profile not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = WorkerPortfolioUploadSerializer(
            data=request.data,
            context={"worker_profile": worker_profile, "request": request},
        )
        serializer.is_valid(raise_exception=True)
        image = serializer.save()
        return Response(
            WorkerPortfolioImageSerializer(image, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class WorkerPortfolioDeleteAPIView(APIView):
    def delete(self, request, image_id):
        if request.user.role != User.Role.WORKER:
            return Response({"detail": "Only workers can delete portfolio images."}, status=status.HTTP_403_FORBIDDEN)
        worker_profile = getattr(request.user, "worker_profile", None)
        if worker_profile is None:
            return Response({"detail": "Worker profile not found."}, status=status.HTTP_404_NOT_FOUND)
        image = generics.get_object_or_404(WorkerPortfolioImage, pk=image_id, worker_profile=worker_profile)
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class BookingCreateAPIView(generics.CreateAPIView):
    serializer_class = BookingCreateSerializer

    def create(self, request, *args, **kwargs):
        if request.user.role != User.Role.CUSTOMER:
            return Response(
                {"detail": "Only customers can create bookings."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        booking = Booking.objects.select_related("user", "worker", "service").get(pk=booking.pk)
        data = BookingSerializer(booking).data
        data["notified_workers_count"] = booking.notifications.count()
        return Response(data, status=status.HTTP_201_CREATED)


class WorkerNotificationListAPIView(generics.ListAPIView):
    serializer_class = BookingNotificationSerializer

    def get_queryset(self):
        return (
            BookingNotification.objects.select_related("booking", "booking__service", "booking__user", "worker")
            .filter(worker=self.request.user)
            .order_by("status", "distance_km", "-created_at")
        )


class WorkerChatListAPIView(APIView):
    def get(self, request):
        if request.user.role != User.Role.WORKER:
            return Response({"detail": "Only workers can access chats."}, status=status.HTTP_403_FORBIDDEN)
        bookings = (
            Booking.objects.select_related("user", "service")
            .prefetch_related("messages")
            .filter(worker=request.user, status__in=[Booking.Status.ACCEPTED, Booking.Status.IN_PROGRESS])
            .order_by("-updated_at")
        )
        serializer = WorkerChatSerializer(bookings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class BookingMessageListCreateAPIView(APIView):
    def get_booking(self, booking_id):
        booking = generics.get_object_or_404(
            Booking.objects.select_related("user", "worker", "service"),
            pk=booking_id,
        )
        user = self.request.user
        if user.id not in [booking.user_id, booking.worker_id]:
            return None
        return booking

    def get(self, request, booking_id):
        booking = self.get_booking(booking_id)
        if booking is None:
            return Response({"detail": "You do not have access to this booking."}, status=status.HTTP_403_FORBIDDEN)
        messages = booking.messages.select_related("sender").order_by("created_at")
        return Response(BookingMessageSerializer(messages, many=True).data, status=status.HTTP_200_OK)

    def post(self, request, booking_id):
        booking = self.get_booking(booking_id)
        if booking is None:
            return Response({"detail": "You do not have access to this booking."}, status=status.HTTP_403_FORBIDDEN)
        serializer = BookingMessageCreateSerializer(
            data=request.data,
            context={"request": request, "booking": booking},
        )
        serializer.is_valid(raise_exception=True)
        message = serializer.save()
        return Response(BookingMessageSerializer(message).data, status=status.HTTP_201_CREATED)


class WorkerJobAcceptanceAPIView(APIView):
    def post(self, request):
        serializer = WorkerBookingAcceptanceSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        notification = serializer.save()
        return Response(BookingNotificationSerializer(notification).data, status=status.HTTP_200_OK)


class WorkerJobRejectionAPIView(APIView):
    def post(self, request):
        serializer = WorkerBookingRejectionSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        notification = serializer.save()
        return Response(BookingNotificationSerializer(notification).data, status=status.HTTP_200_OK)



class AllowAnyForAuth(permissions.BasePermission):
    def has_permission(self, request, view):
        return True


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class OTPRequestAPIView(APIView):
    permission_classes = [AllowAnyForAuth]

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        otp = serializer.save()
        return Response(
            {
                "message": "OTP generated successfully.",
                "phone": otp.phone,
                "otp": otp.code,
                "expires_at": otp.expires_at,
            },
            status=status.HTTP_201_CREATED,
        )


class OTPVerifyAPIView(APIView):
    permission_classes = [AllowAnyForAuth]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.save()
        return Response(data, status=status.HTTP_200_OK)


class ServiceListAPIView(generics.ListAPIView):
    queryset = Service.objects.all().order_by("name")
    serializer_class = ServiceSerializer
    permission_classes = [AllowAnyForAuth]


class NearbyWorkerListAPIView(APIView):
    permission_classes = [AllowAnyForAuth]

    def get(self, request):
        serializer = NearbyWorkerQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        workers = serializer.get_nearby_workers()
        return Response(WorkerProfileSerializer(workers, many=True).data, status=status.HTTP_200_OK)


class WorkerProfileDetailAPIView(generics.RetrieveAPIView):
    queryset = WorkerProfile.objects.select_related("user").prefetch_related("portfolio_images", "reviews")
    serializer_class = WorkerProfileDetailsSerializer
    permission_classes = [AllowAnyForAuth]


class WorkerVerificationUploadAPIView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if request.user.role != User.Role.WORKER:
            return Response({"detail": "Only workers can upload verification documents."}, status=status.HTTP_403_FORBIDDEN)
        worker_profile = getattr(request.user, "worker_profile", None)
        if worker_profile is None:
            return Response({"detail": "Worker profile not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = WorkerVerificationUploadSerializer(worker_profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        return Response(WorkerProfileSerializer(profile).data, status=status.HTTP_200_OK)


class WorkerVerificationAdminAPIView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, worker_profile_id):
        worker_profile = generics.get_object_or_404(WorkerProfile.objects.select_related("user"), pk=worker_profile_id)
        serializer = WorkerVerificationAdminSerializer(worker_profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        return Response(WorkerProfileSerializer(profile).data, status=status.HTTP_200_OK)


class BookingCreateAPIView(generics.CreateAPIView):
    serializer_class = BookingCreateSerializer

    def create(self, request, *args, **kwargs):
        if request.user.role != User.Role.CUSTOMER:
            return Response(
                {"detail": "Only customers can create bookings."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        booking = Booking.objects.select_related("user", "worker", "service").get(pk=booking.pk)
        data = BookingSerializer(booking).data
        data["notified_workers_count"] = booking.notifications.count()
        return Response(data, status=status.HTTP_201_CREATED)


class WorkerNotificationListAPIView(generics.ListAPIView):
    serializer_class = BookingNotificationSerializer

    def get_queryset(self):
        return (
            BookingNotification.objects.select_related("booking", "booking__service", "booking__user", "worker")
            .filter(worker=self.request.user)
            .order_by("status", "distance_km", "-created_at")
        )


class BookingMessageListCreateAPIView(APIView):
    def get_booking(self, booking_id):
        booking = generics.get_object_or_404(
            Booking.objects.select_related("user", "worker", "service"),
            pk=booking_id,
        )
        user = self.request.user
        if user.id not in [booking.user_id, booking.worker_id]:
            return None
        return booking

    def get(self, request, booking_id):
        booking = self.get_booking(booking_id)
        if booking is None:
            return Response({"detail": "You do not have access to this booking."}, status=status.HTTP_403_FORBIDDEN)
        messages = booking.messages.select_related("sender").order_by("created_at")
        return Response(BookingMessageSerializer(messages, many=True).data, status=status.HTTP_200_OK)

    def post(self, request, booking_id):
        booking = self.get_booking(booking_id)
        if booking is None:
            return Response({"detail": "You do not have access to this booking."}, status=status.HTTP_403_FORBIDDEN)
        serializer = BookingMessageCreateSerializer(
            data=request.data,
            context={"request": request, "booking": booking},
        )
        serializer.is_valid(raise_exception=True)
        message = serializer.save()
        return Response(BookingMessageSerializer(message).data, status=status.HTTP_201_CREATED)


class WorkerJobAcceptanceAPIView(APIView):
    def post(self, request):
        serializer = WorkerBookingAcceptanceSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        notification = serializer.save()
        return Response(BookingNotificationSerializer(notification).data, status=status.HTTP_200_OK)


class WorkerJobRejectionAPIView(APIView):
    def post(self, request):
        serializer = WorkerBookingRejectionSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        notification = serializer.save()
        return Response(BookingNotificationSerializer(notification).data, status=status.HTTP_200_OK)

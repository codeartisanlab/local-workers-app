import { AuthUser, BookingJob, BookingMessage, Role, ServiceOption, Worker, WorkerDetails } from "../types";

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");

type OTPVerifyResponse = {
  access: string;
  refresh: string;
  user: AuthUser;
};

type BookingCreateResponse = {
  id: number;
  status: string;
  worker: number | null;
  notified_workers_count: number;
  location: string;
  time: string;
  latitude: number;
  longitude: number;
};

const servicesFallback: ServiceOption[] = [
  { id: 1, name: "Cleaning" },
  { id: 2, name: "Plumbing" },
  { id: 3, name: "Electrical" },
];

function getMockOtp(phone: string) {
  if (phone === "9000000002") {
    return "654321";
  }
  if (phone === "9000000009") {
    return "999999";
  }
  return "123456";
}

const nearbyWorkers: Worker[] = [
  {
    id: 2,
    name: "Aarav Singh",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    skills: ["Cleaning", "Deep Sanitization"],
    rating: 4.8,
    distance: "0.4 km",
    location: "Downtown",
    verificationStatus: "approved",
    latitude: 12.9716,
    longitude: 77.5946,
  },
  {
    id: 3,
    name: "Meera Joshi",
    photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    skills: ["Electrical", "Appliance Repair"],
    rating: 4.7,
    distance: "0.9 km",
    location: "Lake Road",
    verificationStatus: "approved",
    latitude: 12.9721,
    longitude: 77.599,
  },
  {
    id: 4,
    name: "Kabir Patel",
    photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
    skills: ["Plumbing"],
    rating: 4.5,
    distance: "2.7 km",
    location: "West End",
    verificationStatus: "pending",
    latitude: 12.9612,
    longitude: 77.5842,
  },
];

const workerJobs: BookingJob[] = [
  {
    id: 11,
    bookingId: 11,
    customerName: "Riya Sharma",
    serviceName: "Home Cleaning",
    location: "221B Baker Street",
    time: "Tomorrow, 10:00 AM",
    status: "pending",
    distance: "0.7 km",
  },
  {
    id: 12,
    bookingId: 12,
    customerName: "Ishaan Verma",
    serviceName: "AC Repair",
    location: "Palm Residency",
    time: "Today, 5:30 PM",
    status: "accepted",
    distance: "1.3 km",
  },
];

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || "Something went wrong.");
  }
  return response.json() as Promise<T>;
}

export async function requestOtp(phone: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/request-otp/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    return await parseResponse<{ otp: string; phone: string }>(response);
  } catch (error) {
    return {
      phone,
      otp: getMockOtp(phone),
    };
  }
}

export async function verifyOtp(phone: string, otp: string, role: Role) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp, role }),
    });
    return await parseResponse<OTPVerifyResponse>(response);
  } catch (error) {
    if (otp !== getMockOtp(phone)) {
      throw new Error("Invalid OTP.");
    }
    return {
      access: `mock-access-${phone}`,
      refresh: `mock-refresh-${phone}`,
      user: {
        id: role === "worker" ? 2 : 1,
        phone,
        role,
      },
    };
  }
}

const workerDetailsFallback: Record<number, WorkerDetails> = {
  2: {
    id: 2,
    name: "Aarav Singh",
    skills: ["Cleaning", "Deep Sanitization"],
    rating: 4.8,
    averageRating: 4.8,
    distance: "0.4 km",
    location: "Downtown",
    verificationStatus: "approved",
    latitude: 12.9716,
    longitude: 77.5946,
    portfolioImages: [
      {
        id: 1,
        imageUrl: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=800&q=80",
        caption: "Kitchen deep clean",
      },
      {
        id: 2,
        imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
        caption: "Living room refresh",
      },
    ],
    reviews: [
      { id: 1, customerName: "Aisha Patel", rating: 4.8, comment: "Very professional and quick." },
      { id: 2, customerName: "Rohan Mehta", rating: 4.7, comment: "Great communication throughout." },
    ],
  },
  3: {
    id: 3,
    name: "Meera Joshi",
    skills: ["Electrical", "Appliance Repair"],
    rating: 4.7,
    averageRating: 4.7,
    distance: "0.9 km",
    location: "Lake Road",
    verificationStatus: "approved",
    latitude: 12.9721,
    longitude: 77.599,
    portfolioImages: [
      {
        id: 3,
        imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
        caption: "Fuse box maintenance",
      },
    ],
    reviews: [{ id: 3, customerName: "Neha Jain", rating: 4.6, comment: "Solved the problem in one visit." }],
  },
};

type NearbyWorkerApiItem = {
  user: {
    id: number;
    phone: string;
    role: Role;
  };
  skills: string;
  rating: string;
  verification_status: "approved" | "pending" | "rejected" | "verified";
  location: string;
  latitude: number | null;
  longitude: number | null;
  distance_km: number;
};

function mapWorker(worker: NearbyWorkerApiItem): Worker {
  return {
    id: worker.user.id,
    name: worker.user.phone,
    photoUrl: `https://i.pravatar.cc/300?img=${(worker.user.id % 60) + 1}`,
    skills: worker.skills ? worker.skills.split(",").map((item) => item.trim()).filter(Boolean) : ["General Service"],
    rating: Number(worker.rating),
    distance: `${worker.distance_km.toFixed(1)} km`,
    location: worker.location,
    verificationStatus: worker.verification_status,
    latitude: worker.latitude ?? undefined,
    longitude: worker.longitude ?? undefined,
  };
}

type WorkerDetailsApiItem = NearbyWorkerApiItem & {
  average_rating: string;
  portfolio_images: { id: number; image_url: string; caption: string }[];
  reviews: { id: number; customer_name: string; rating: string; comment: string }[];
};

export async function fetchNearbyWorkers(latitude = 12.9716, longitude = 77.5946): Promise<Worker[]> {
  try {
    const query = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
    });
    const response = await fetch(`${API_BASE_URL}/workers/nearby/?${query.toString()}`);
    const workers = await parseResponse<NearbyWorkerApiItem[]>(response);
    return workers.map(mapWorker);
  } catch (error) {
    return nearbyWorkers;
  }
}

function mapWorkerDetails(worker: WorkerDetailsApiItem): WorkerDetails {
  return {
    ...mapWorker(worker),
    averageRating: Number(worker.average_rating ?? worker.rating),
    portfolioImages: worker.portfolio_images.map((image) => ({
      id: image.id,
      imageUrl: image.image_url,
      caption: image.caption,
    })),
    reviews: worker.reviews.map((review) => ({
      id: review.id,
      customerName: review.customer_name,
      rating: Number(review.rating),
      comment: review.comment,
    })),
  };
}

export async function fetchWorkerDetails(workerId: number): Promise<WorkerDetails> {
  try {
    const response = await fetch(`${API_BASE_URL}/workers/${workerId}/`);
    const worker = await parseResponse<WorkerDetailsApiItem>(response);
    return mapWorkerDetails(worker);
  } catch (error) {
    return workerDetailsFallback[workerId] ?? {
      ...(nearbyWorkers.find((worker) => worker.id === workerId) ?? nearbyWorkers[0]),
      averageRating: 4.5,
      portfolioImages: [],
      reviews: [],
    };
  }
}

export async function fetchServices(): Promise<ServiceOption[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/services/`);
    return await parseResponse<ServiceOption[]>(response);
  } catch (error) {
    return servicesFallback;
  }
}

export async function createBooking(
  accessToken: string,
  serviceId: number,
  location: string,
  time: string,
  latitude = 12.9716,
  longitude = 77.5946,
): Promise<BookingCreateResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        service_id: serviceId,
        location,
        latitude,
        longitude,
        time,
      }),
    });
    return await parseResponse<BookingCreateResponse>(response);
  } catch (error) {
    return {
      id: 101,
      status: "pending",
      worker: null,
      notified_workers_count: 2,
      location,
      time,
      latitude,
      longitude,
    };
  }
}

type BookingMessageApiItem = {
  id: number;
  booking: number;
  sender: {
    phone: string;
    role: Role;
  };
  message: string;
  created_at: string;
};

function mapBookingMessage(message: BookingMessageApiItem): BookingMessage {
  return {
    id: message.id,
    bookingId: message.booking,
    senderPhone: message.sender.phone,
    senderRole: message.sender.role,
    message: message.message,
    createdAt: message.created_at,
  };
}

export async function fetchBookingMessages(accessToken: string, bookingId: number): Promise<BookingMessage[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/messages/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const messages = await parseResponse<BookingMessageApiItem[]>(response);
    return messages.map(mapBookingMessage);
  } catch (error) {
    return [
      {
        id: 1,
        bookingId,
        senderPhone: "9000000001",
        senderRole: "customer",
        message: "Hi, please bring your cleaning supplies.",
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        bookingId,
        senderPhone: "9000000002",
        senderRole: "worker",
        message: "Sure, I will be there on time.",
        createdAt: new Date().toISOString(),
      },
    ];
  }
}

export async function sendBookingMessage(
  accessToken: string,
  bookingId: number,
  message: string,
): Promise<BookingMessage> {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/messages/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ message }),
    });
    return mapBookingMessage(await parseResponse<BookingMessageApiItem>(response));
  } catch (error) {
    return {
      id: Date.now(),
      bookingId,
      senderPhone: accessToken.includes("9000000002") ? "9000000002" : "9000000001",
      senderRole: accessToken.includes("9000000002") ? "worker" : "customer",
      message,
      createdAt: new Date().toISOString(),
    };
  }
}

type WorkerNotificationApiItem = {
  id: number;
  status: "pending" | "accepted" | "rejected" | "missed";
  distance_km: string;
  booking: {
    id: number;
    user: {
      phone: string;
    };
    service: {
      name: string;
    };
    location: string;
    time: string;
  };
};

function formatJobTime(isoTime: string) {
  const date = new Date(isoTime);
  return date.toLocaleString();
}

function mapNotificationToJob(notification: WorkerNotificationApiItem): BookingJob {
  return {
    id: notification.id,
    bookingId: notification.booking.id,
    customerName: notification.booking.user.phone,
    serviceName: notification.booking.service.name,
    location: notification.booking.location,
    time: formatJobTime(notification.booking.time),
    status: notification.status,
    distance: `${Number(notification.distance_km).toFixed(1)} km`,
  };
}

export async function fetchWorkerJobs(accessToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/worker/jobs/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const notifications = await parseResponse<WorkerNotificationApiItem[]>(response);
    return notifications.map(mapNotificationToJob);
  } catch (error) {
    return workerJobs;
  }
}

export async function acceptJob(accessToken: string, notificationId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/accept/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ notification_id: notificationId }),
    });
    return await parseResponse(response);
  } catch (error) {
    return {
      success: true,
      notificationId,
      offline: true,
      message: error instanceof Error ? error.message : "Backend unavailable",
    };
  }
}

export async function rejectJob(accessToken: string, notificationId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/reject/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ notification_id: notificationId }),
    });
    return await parseResponse(response);
  } catch (error) {
    return {
      success: true,
      notificationId,
      offline: true,
      message: error instanceof Error ? error.message : "Backend unavailable",
    };
  }
}

export type Role = "customer" | "worker";

export type AuthUser = {
  id: number;
  phone: string;
  role: Role;
};

export type Worker = {
  id: number;
  name: string;
  photoUrl?: string;
  skills: string[];
  rating: number;
  distance: string;
  location: string;
  verificationStatus: "approved" | "pending" | "rejected" | "verified";
  latitude?: number;
  longitude?: number;
};

export type ServiceOption = {
  id: number;
  name: string;
};

export type ServicePackage = {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_hours: number;
  included_items: string[];
  is_popular: boolean;
  order: number;
};

export type ServiceWithPackages = ServiceOption & {
  description: string;
  duration_hours: number;
  image_url?: string;
  included_items: string[];
  excluded_items: string[];
  packages: ServicePackage[];
};

export type ServiceCategory = {
  id: number;
  name: string;
  description: string;
  icon: string;
  parent_id: number | null;
  is_active: boolean;
  order: number;
  subcategories?: ServiceCategory[];
  services?: ServiceWithPackages[];
};

export type CustomerAddress = {
  id: number;
  label: "Home" | "Work" | "Other";
  address: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
};

export type WorkerSlot = {
  start_time: string;
  end_time: string;
};

export type PaymentMethod = "card" | "upi" | "wallet" | "cash";

export type WorkerEarning = {
  id: number;
  booking: number;
  gross_amount: string;
  platform_commission_percent: string;
  net_amount: string;
  payout_status: "pending" | "paid";
};

export type SearchResult = {
  services: ServiceOption[];
  workers: Worker[];
};

export type WorkerPortfolioImage = {
  id: number;
  imageUrl: string;
  caption: string;
};

export type WorkerReview = {
  id: number;
  customerName: string;
  rating: number;
  comment: string;
};

export type WorkerDetails = Worker & {
  averageRating: number;
  portfolioImages: WorkerPortfolioImage[];
  reviews: WorkerReview[];
};

export type BookingJob = {
  id: number;
  bookingId: number;
  customerName: string;
  serviceName: string;
  location: string;
  time: string;
  status: "pending" | "accepted" | "rejected" | "missed";
  distance: string;
};

export type BookingMessage = {
  id: number;
  bookingId: number;
  senderPhone: string;
  senderRole: Role;
  message: string;
  createdAt: string;
};

export type CustomerBookingStatus = "searching" | "assigned" | "on_the_way" | "in_progress" | "completed";

export type CustomerBookingStep = {
  label: string;
  status: "done" | "current" | "upcoming";
};

export type CustomerBooking = {
  id: number;
  workerId: number;
  workerName: string;
  serviceName: string;
  location: string;
  scheduledLabel: string;
  status: CustomerBookingStatus;
  statusLabel: string;
  createdAt: string;
  lastUpdatedAt: string;
  steps: CustomerBookingStep[];
};

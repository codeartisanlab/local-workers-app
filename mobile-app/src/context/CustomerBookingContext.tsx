import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";

import { CustomerBooking } from "../types";

type CreateCustomerBookingInput = {
  id: number;
  workerId: number;
  workerName: string;
  serviceName: string;
  location: string;
  scheduledLabel: string;
};

type CustomerBookingState = {
  currentBooking: CustomerBooking | null;
  orderHistory: CustomerBooking[];
  createCustomerBooking: (input: CreateCustomerBookingInput) => void;
};

const seededHistory: CustomerBooking[] = [
  {
    id: 73,
    workerId: 2,
    workerName: "Aarav Singh",
    serviceName: "Home Cleaning",
    location: "221B Baker Street",
    scheduledLabel: "Yesterday, 11:00 AM",
    status: "completed",
    statusLabel: "Completed",
    createdAt: "2026-03-28T09:30:00Z",
    lastUpdatedAt: "2026-03-28T13:10:00Z",
    steps: [
      { label: "Booking placed", status: "done" },
      { label: "Worker assigned", status: "done" },
      { label: "Worker on the way", status: "done" },
      { label: "Service in progress", status: "done" },
      { label: "Completed", status: "done" },
    ],
  },
];

const initialCurrentBooking: CustomerBooking = {
  id: 81,
  workerId: 3,
  workerName: "Meera Joshi",
  serviceName: "Electrical Repair",
  location: "12 MG Road",
  scheduledLabel: "Today, 5:15 PM",
  status: "on_the_way",
  statusLabel: "Worker On The Way",
  createdAt: "2026-03-29T10:00:00Z",
  lastUpdatedAt: "2026-03-29T14:20:00Z",
  steps: [
    { label: "Booking placed", status: "done" },
    { label: "Worker assigned", status: "done" },
    { label: "Worker on the way", status: "current" },
    { label: "Service in progress", status: "upcoming" },
    { label: "Completed", status: "upcoming" },
  ],
};

const CustomerBookingContext = createContext<CustomerBookingState | undefined>(undefined);

function buildActiveSteps() {
  return [
    { label: "Booking placed", status: "done" as const },
    { label: "Worker assigned", status: "current" as const },
    { label: "Worker on the way", status: "upcoming" as const },
    { label: "Service in progress", status: "upcoming" as const },
    { label: "Completed", status: "upcoming" as const },
  ];
}

export function CustomerBookingProvider({ children }: PropsWithChildren) {
  const [currentBooking, setCurrentBooking] = useState<CustomerBooking | null>(initialCurrentBooking);
  const [orderHistory, setOrderHistory] = useState<CustomerBooking[]>(seededHistory);

  const value = useMemo(
    () => ({
      currentBooking,
      orderHistory,
      createCustomerBooking(input: CreateCustomerBookingInput) {
        const booking: CustomerBooking = {
          ...input,
          status: "assigned",
          statusLabel: "Worker Assigned",
          createdAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString(),
          steps: buildActiveSteps(),
        };

        setCurrentBooking(booking);
        setOrderHistory((current) => [booking, ...current]);
      },
    }),
    [currentBooking, orderHistory],
  );

  return <CustomerBookingContext.Provider value={value}>{children}</CustomerBookingContext.Provider>;
}

export function useCustomerBookings() {
  const context = useContext(CustomerBookingContext);
  if (!context) {
    throw new Error("useCustomerBookings must be used within CustomerBookingProvider");
  }
  return context;
}

import { Appointment, Doctor, Patient } from "../types/models";

function buildId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

const now = new Date().toISOString();

export const mockPatients: Patient[] = [
  {
    id: buildId("PAT"),
    name: "Asha Sharma",
    age: 34,
    gender: "Female",
    phone: "+91 98765 43210",
    address: "12 Lotus Avenue, New Delhi",
    bloodGroup: "B+",
    createdAt: now,
  },
  {
    id: buildId("PAT"),
    name: "Rohit Patel",
    age: 48,
    gender: "Male",
    phone: "+91 91234 56789",
    address: "56 River View, Mumbai",
    bloodGroup: "O-",
    createdAt: now,
  },
  {
    id: buildId("PAT"),
    name: "Drishti Mehta",
    age: 27,
    gender: "Female",
    phone: "+91 99887 66554",
    address: "89 Green Park, Bengaluru",
    bloodGroup: "A+",
    createdAt: now,
  },
  {
    id: buildId("PAT"),
    name: "Nikhil Joshi",
    age: 53,
    gender: "Male",
    phone: "+91 99642 31321",
    address: "101 Lakeview Street, Pune",
    bloodGroup: "AB+",
    createdAt: now,
  },
  {
    id: buildId("PAT"),
    name: "Poonam Singh",
    age: 41,
    gender: "Female",
    phone: "+91 98712 34567",
    address: "77 Hilltop Road, Chennai",
    bloodGroup: "O+",
    createdAt: now,
  },
  {
    id: buildId("PAT"),
    name: "Ishaan Verma",
    age: 19,
    gender: "Male",
    phone: "+91 94567 78901",
    address: "22 Sunrise Avenue, Hyderabad",
    bloodGroup: "B-",
    createdAt: now,
  },
];

export const mockDoctors: Doctor[] = [
  {
    id: buildId("DOC"),
    name: "Dr. Arjun Rao",
    specialization: "Cardiology",
    phone: "+91 99123 45678",
    availability: "Available",
    createdAt: now,
  },
  {
    id: buildId("DOC"),
    name: "Dr. Meera Nair",
    specialization: "Emergency Medicine",
    phone: "+91 98876 54321",
    availability: "On Leave",
    createdAt: now,
  },
  {
    id: buildId("DOC"),
    name: "Dr. Salesh Gupta",
    specialization: "Internal Medicine",
    phone: "+91 97654 32109",
    availability: "Available",
    createdAt: now,
  },
];

export const mockAppointments: Appointment[] = [
  {
    id: buildId("APT"),
    patientId: mockPatients[0].id,
    doctorId: mockDoctors[0].id,
    appointmentDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    appointmentTime: "09:00",
    status: "Scheduled",
    createdAt: now,
  },
  {
    id: buildId("APT"),
    patientId: mockPatients[1].id,
    doctorId: mockDoctors[2].id,
    appointmentDate: new Date(Date.now() + 172800000).toISOString().split("T")[0],
    appointmentTime: "14:30",
    status: "Scheduled",
    createdAt: now,
  },
  {
    id: buildId("APT"),
    patientId: mockPatients[2].id,
    doctorId: mockDoctors[1].id,
    appointmentDate: new Date(Date.now() + 259200000).toISOString().split("T")[0],
    appointmentTime: "11:00",
    status: "Completed",
    createdAt: now,
  },
];

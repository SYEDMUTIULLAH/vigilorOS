export interface Patient {
  id: string;
  mrn: string;
  fullName: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  phone?: string;
  address?: string;
  bloodGroup?: string;
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  phone?: string;
  availability?: "Available" | "Unavailable" | "On Leave";
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  createdAt: string;
}

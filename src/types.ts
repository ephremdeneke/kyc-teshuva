export interface Participant {
  id: string;
  registrationId: string;
  fullName: string;
  phone: string;
  address: string;
  church: string;
  serviceDistrict: string;
  category: string;
  paymentAmount: number;
  paymentMethod: string;
  registrationDate: string;
  qrToken: string;
  notes: string;
}

export interface MealRecord {
  id: string;
  registrationId: string;
  dayNumber: number;
  date: string;
  distributedBy: string;
  distributedAt: string;
}

export interface Staff {
  id: string;
  name: string;
  role: 'admin' | 'registration' | 'meal';
  phone: string;
  pin: string;
  active: boolean;
}

export interface EventConfig {
  eventName: string;
  eventYear: string;
  startDate: string;
  totalDays: number;
  orgName: string;
}

export interface ScanResult {
  success: boolean;
  participant?: Participant;
  message: string;
  mealAlreadyClaimed?: boolean;
  dayNumber?: number;
}

export interface Stats {
  totalRegistered: number;
  mealsDistributed: { day: number; count: number }[];
  totalMeals: number;
}

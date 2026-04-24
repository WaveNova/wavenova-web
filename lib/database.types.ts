export type ProjectStatus = "Operational" | "Just Launched" | "Launching May";
export type ProjectCategory = "Sorting Stations" | "Waste Management";
export type DonationFrequency = "one-time" | "monthly";
export type DonationStatus = "pending" | "confirmed";

export interface Project {
  id: string;
  slug: string;
  name: string;
  partner: string;
  location: string;
  status: ProjectStatus;
  category: ProjectCategory;
  kpis: string[];
  raised: number;
  goal: number;
  image_url: string;
  since_year: string | null;
  description: string | null;
  created_at: string;
}

export interface Donor {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  total_donated: number;
  total_kg_removed: number;
}

export interface Donation {
  id: string;
  donor_id: string | null;
  project_slug: string;
  amount_usd: number;
  frequency: DonationFrequency;
  reference_code: string;
  status: DonationStatus;
  tip_amount: number;
  donor_name: string | null;
  donor_email: string;
  created_at: string;
}

export interface Activity {
  id: string;
  station_name: string;
  action_text: string;
  created_at: string;
}

export interface Metrics {
  id: string;
  total_kg: number;
  active_stations: number;
  workers_employed: number;
  households_served: number;
  updated_at: string;
}

// Supabase Database shape for typed client
export interface Database {
  public: {
    Tables: {
      projects: { Row: Project; Insert: Omit<Project, "id" | "created_at">; Update: Partial<Project> };
      donors: { Row: Donor; Insert: Omit<Donor, "id" | "created_at">; Update: Partial<Donor> };
      donations: { Row: Donation; Insert: Omit<Donation, "id" | "created_at">; Update: Partial<Donation> };
      activities: { Row: Activity; Insert: Omit<Activity, "id" | "created_at">; Update: Partial<Activity> };
      metrics: { Row: Metrics; Insert: Omit<Metrics, "id" | "updated_at">; Update: Partial<Metrics> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

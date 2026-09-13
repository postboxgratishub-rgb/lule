export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "student" | "admin";

export type Database = {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string;
          name: string;
          code: string;
          address: string | null;
          city: string | null;
          state: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          auth_user_id: string;
          full_name: string;
          email: string;
          phone: string;
          role: UserRole;
          school_id: string | null;
          class_name: string | null;
          section: string | null;
          roll_number: string | null;
          date_of_birth: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          full_name: string;
          email: string;
          phone: string;
          role?: UserRole;
          school_id?: string | null;
          class_name?: string | null;
          section?: string | null;
          roll_number?: string | null;
          date_of_birth?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          phone?: string;
          school_id?: string | null;
          class_name?: string | null;
          section?: string | null;
          roll_number?: string | null;
          date_of_birth?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type School = Database["public"]["Tables"]["schools"]["Row"];
export type StudentProfile = Database["public"]["Tables"]["profiles"]["Row"];

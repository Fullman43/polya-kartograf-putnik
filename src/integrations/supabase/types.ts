export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      employees: {
        Row: {
          created_at: string
          current_location: unknown | null
          current_task_id: string | null
          full_name: string
          id: string
          phone: string | null
          status: Database["public"]["Enums"]["employee_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          current_location?: unknown | null
          current_task_id?: string | null
          full_name: string
          id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          current_location?: unknown | null
          current_task_id?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          user_id?: string
        }
        Relationships: []
      }
      role_descriptions: {
        Row: {
          created_at: string | null
          description: string
          permissions: Json | null
          role: Database["public"]["Enums"]["app_role"]
          title: string
        }
        Insert: {
          created_at?: string | null
          description: string
          permissions?: Json | null
          role: Database["public"]["Enums"]["app_role"]
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          title?: string
        }
        Relationships: []
      }
      routes: {
        Row: {
          created_at: string
          distance: number
          duration: number
          employee_id: string
          geometry: Json | null
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          distance: number
          duration: number
          employee_id: string
          geometry?: Json | null
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string
          distance?: number
          duration?: number
          employee_id?: string
          geometry?: Json | null
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routes_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_photos: {
        Row: {
          created_at: string | null
          id: string
          photo_url: string
          task_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          photo_url: string
          task_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          id?: string
          photo_url?: string
          task_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_photos_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          address: string
          assigned_employee_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          customer_name: string | null
          customer_phone: string | null
          description: string | null
          en_route_at: string | null
          id: string
          location: unknown | null
          order_number: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          scheduled_time: string
          started_at: string | null
          status: Database["public"]["Enums"]["task_status"]
          updated_at: string
          work_type: string
        }
        Insert: {
          address: string
          assigned_employee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          en_route_at?: string | null
          id?: string
          location?: unknown | null
          order_number?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          scheduled_time: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
          work_type: string
        }
        Update: {
          address?: string
          assigned_employee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          en_route_at?: string | null
          id?: string
          location?: unknown | null
          order_number?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          scheduled_time?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
          work_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_employee_id_fkey"
            columns: ["assigned_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_auth_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          used: boolean
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          used?: boolean
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      telegram_bot_state: {
        Row: {
          state: Json
          telegram_id: number
          updated_at: string
        }
        Insert: {
          state?: Json
          telegram_id: number
          updated_at?: string
        }
        Update: {
          state?: Json
          telegram_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      telegram_users: {
        Row: {
          created_at: string
          id: string
          last_active_at: string
          telegram_id: number
          telegram_username: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_active_at?: string
          telegram_id: number
          telegram_username?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_active_at?: string
          telegram_id?: number
          telegram_username?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "operator"
        | "employee"
        | "manager"
        | "client"
        | "organization_owner"
        | "organization_admin"
      employee_status: "available" | "busy" | "offline"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status:
        | "pending"
        | "assigned"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "en_route"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "operator",
        "employee",
        "manager",
        "client",
        "organization_owner",
        "organization_admin",
      ],
      employee_status: ["available", "busy", "offline"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: [
        "pending",
        "assigned",
        "in_progress",
        "completed",
        "cancelled",
        "en_route",
      ],
    },
  },
} as const

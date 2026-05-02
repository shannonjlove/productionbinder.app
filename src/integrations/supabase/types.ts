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
      av_script_entries: {
        Row: {
          audio: string | null
          created_at: string
          duration: string | null
          id: string
          notes: string | null
          script_id: string
          segment: string | null
          sort_order: number
          updated_at: string
          visual: string | null
        }
        Insert: {
          audio?: string | null
          created_at?: string
          duration?: string | null
          id?: string
          notes?: string | null
          script_id: string
          segment?: string | null
          sort_order?: number
          updated_at?: string
          visual?: string | null
        }
        Update: {
          audio?: string | null
          created_at?: string
          duration?: string | null
          id?: string
          notes?: string | null
          script_id?: string
          segment?: string | null
          sort_order?: number
          updated_at?: string
          visual?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "av_script_entries_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "av_scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      av_scripts: {
        Row: {
          created_at: string
          id: string
          name: string
          production_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          production_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          production_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "av_scripts_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["id"]
          },
        ]
      }
      call_sheet_cast: {
        Row: {
          block_rehearsal: string | null
          call_sheet_id: string
          call_time: string | null
          cast_member_id: string
          id: string
          pickup_time: string | null
          set_time: string | null
          special_instructions: string | null
          status: string | null
        }
        Insert: {
          block_rehearsal?: string | null
          call_sheet_id: string
          call_time?: string | null
          cast_member_id: string
          id?: string
          pickup_time?: string | null
          set_time?: string | null
          special_instructions?: string | null
          status?: string | null
        }
        Update: {
          block_rehearsal?: string | null
          call_sheet_id?: string
          call_time?: string | null
          cast_member_id?: string
          id?: string
          pickup_time?: string | null
          set_time?: string | null
          special_instructions?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_sheet_cast_call_sheet_id_fkey"
            columns: ["call_sheet_id"]
            isOneToOne: false
            referencedRelation: "call_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_sheet_cast_cast_member_id_fkey"
            columns: ["cast_member_id"]
            isOneToOne: false
            referencedRelation: "cast_members"
            referencedColumns: ["id"]
          },
        ]
      }
      call_sheet_crew: {
        Row: {
          call_sheet_id: string
          call_time: string | null
          crew_member_id: string
          id: string
          notes: string | null
        }
        Insert: {
          call_sheet_id: string
          call_time?: string | null
          crew_member_id: string
          id?: string
          notes?: string | null
        }
        Update: {
          call_sheet_id?: string
          call_time?: string | null
          crew_member_id?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_sheet_crew_call_sheet_id_fkey"
            columns: ["call_sheet_id"]
            isOneToOne: false
            referencedRelation: "call_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_sheet_crew_crew_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
        ]
      }
      call_sheet_scenes: {
        Row: {
          call_sheet_id: string
          id: string
          notes: string | null
          scene_id: string
          scene_order: number | null
        }
        Insert: {
          call_sheet_id: string
          id?: string
          notes?: string | null
          scene_id: string
          scene_order?: number | null
        }
        Update: {
          call_sheet_id?: string
          id?: string
          notes?: string | null
          scene_id?: string
          scene_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "call_sheet_scenes_call_sheet_id_fkey"
            columns: ["call_sheet_id"]
            isOneToOne: false
            referencedRelation: "call_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_sheet_scenes_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      call_sheets: {
        Row: {
          courtesy_breakfast: string | null
          created_at: string
          general_crew_call: string | null
          id: string
          lunch_time: string | null
          production_id: string
          published_at: string | null
          safety_notes: string | null
          schedule_color: string | null
          script_color: string | null
          shoot_day_id: string
          shooting_call: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          courtesy_breakfast?: string | null
          created_at?: string
          general_crew_call?: string | null
          id?: string
          lunch_time?: string | null
          production_id: string
          published_at?: string | null
          safety_notes?: string | null
          schedule_color?: string | null
          script_color?: string | null
          shoot_day_id: string
          shooting_call?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          courtesy_breakfast?: string | null
          created_at?: string
          general_crew_call?: string | null
          id?: string
          lunch_time?: string | null
          production_id?: string
          published_at?: string | null
          safety_notes?: string | null
          schedule_color?: string | null
          script_color?: string | null
          shoot_day_id?: string
          shooting_call?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_sheets_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_sheets_shoot_day_id_fkey"
            columns: ["shoot_day_id"]
            isOneToOne: false
            referencedRelation: "shoot_days"
            referencedColumns: ["id"]
          },
        ]
      }
      cast_members: {
        Row: {
          actor_name: string | null
          agent: string | null
          cast_id: number
          character_name: string
          created_at: string
          email: string | null
          id: string
          notes: string | null
          phone: string | null
          production_id: string
          updated_at: string
        }
        Insert: {
          actor_name?: string | null
          agent?: string | null
          cast_id: number
          character_name: string
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          production_id: string
          updated_at?: string
        }
        Update: {
          actor_name?: string | null
          agent?: string | null
          cast_id?: number
          character_name?: string
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          production_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cast_members_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_check_ins: {
        Row: {
          call_sheet_id: string
          checked_in_at: string
          crew_member_id: string
          id: string
          location: string | null
          notes: string | null
        }
        Insert: {
          call_sheet_id: string
          checked_in_at?: string
          crew_member_id: string
          id?: string
          location?: string | null
          notes?: string | null
        }
        Update: {
          call_sheet_id?: string
          checked_in_at?: string
          crew_member_id?: string
          id?: string
          location?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crew_check_ins_call_sheet_id_fkey"
            columns: ["call_sheet_id"]
            isOneToOne: false
            referencedRelation: "call_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_check_ins_crew_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_members: {
        Row: {
          created_at: string
          department: string
          email: string | null
          id: string
          job_title: string
          name: string
          notes: string | null
          phone: string | null
          production_id: string
          rate: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department: string
          email?: string | null
          id?: string
          job_title: string
          name: string
          notes?: string | null
          phone?: string | null
          production_id: string
          rate?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string
          email?: string | null
          id?: string
          job_title?: string
          name?: string
          notes?: string | null
          phone?: string | null
          production_id?: string
          rate?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_members_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["id"]
          },
        ]
      }
      day_out_of_days: {
        Row: {
          cast_member_id: string
          id: string
          production_id: string
          shoot_day_id: string
          status: string
        }
        Insert: {
          cast_member_id: string
          id?: string
          production_id: string
          shoot_day_id: string
          status?: string
        }
        Update: {
          cast_member_id?: string
          id?: string
          production_id?: string
          shoot_day_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "day_out_of_days_cast_member_id_fkey"
            columns: ["cast_member_id"]
            isOneToOne: false
            referencedRelation: "cast_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "day_out_of_days_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "day_out_of_days_shoot_day_id_fkey"
            columns: ["shoot_day_id"]
            isOneToOne: false
            referencedRelation: "shoot_days"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          call_sheet_id: string | null
          channel: string
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          recipient_email: string | null
          recipient_id: string | null
          recipient_phone: string | null
          recipient_type: string
          sent_at: string | null
          status: string
        }
        Insert: {
          call_sheet_id?: string | null
          channel: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          recipient_email?: string | null
          recipient_id?: string | null
          recipient_phone?: string | null
          recipient_type: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          call_sheet_id?: string | null
          channel?: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          recipient_email?: string | null
          recipient_id?: string | null
          recipient_phone?: string | null
          recipient_type?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_call_sheet_id_fkey"
            columns: ["call_sheet_id"]
            isOneToOne: false
            referencedRelation: "call_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      productions: {
        Row: {
          company_address: string | null
          company_fax: string | null
          company_name: string | null
          company_phone: string | null
          created_at: string
          created_by: string | null
          director: string | null
          end_date: string | null
          id: string
          line_producer: string | null
          name: string
          producer: string | null
          start_date: string | null
          total_days: number | null
          updated_at: string
        }
        Insert: {
          company_address?: string | null
          company_fax?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          created_by?: string | null
          director?: string | null
          end_date?: string | null
          id?: string
          line_producer?: string | null
          name: string
          producer?: string | null
          start_date?: string | null
          total_days?: number | null
          updated_at?: string
        }
        Update: {
          company_address?: string | null
          company_fax?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          created_by?: string | null
          director?: string | null
          end_date?: string | null
          id?: string
          line_producer?: string | null
          name?: string
          producer?: string | null
          start_date?: string | null
          total_days?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string | null
          full_name: string | null
          id: string
          job_title: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scene_cast: {
        Row: {
          cast_member_id: string
          id: string
          scene_id: string
        }
        Insert: {
          cast_member_id: string
          id?: string
          scene_id: string
        }
        Update: {
          cast_member_id?: string
          id?: string
          scene_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scene_cast_cast_member_id_fkey"
            columns: ["cast_member_id"]
            isOneToOne: false
            referencedRelation: "cast_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scene_cast_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      scenes: {
        Row: {
          created_at: string
          day_night: string | null
          description: string | null
          id: string
          int_ext: string | null
          location: string | null
          makeup_hair: string | null
          notes: string | null
          page_count: string | null
          production_id: string
          props: string | null
          scene_number: string
          set_dressing: string | null
          set_name: string | null
          special_effects: string | null
          stunts: string | null
          updated_at: string
          vehicles: string | null
          wardrobe: string | null
        }
        Insert: {
          created_at?: string
          day_night?: string | null
          description?: string | null
          id?: string
          int_ext?: string | null
          location?: string | null
          makeup_hair?: string | null
          notes?: string | null
          page_count?: string | null
          production_id: string
          props?: string | null
          scene_number: string
          set_dressing?: string | null
          set_name?: string | null
          special_effects?: string | null
          stunts?: string | null
          updated_at?: string
          vehicles?: string | null
          wardrobe?: string | null
        }
        Update: {
          created_at?: string
          day_night?: string | null
          description?: string | null
          id?: string
          int_ext?: string | null
          location?: string | null
          makeup_hair?: string | null
          notes?: string | null
          page_count?: string | null
          production_id?: string
          props?: string | null
          scene_number?: string
          set_dressing?: string | null
          set_name?: string | null
          special_effects?: string | null
          stunts?: string | null
          updated_at?: string
          vehicles?: string | null
          wardrobe?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scenes_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["id"]
          },
        ]
      }
      shoot_days: {
        Row: {
          base_camp: string | null
          created_at: string
          crew_parking: string | null
          day_number: number
          hospital_address: string | null
          id: string
          location_address: string | null
          location_name: string | null
          nearest_hospital: string | null
          notes: string | null
          production_id: string
          shoot_date: string
          sunrise: string | null
          sunset: string | null
          updated_at: string
          weather_conditions: string | null
          weather_high: string | null
          weather_low: string | null
        }
        Insert: {
          base_camp?: string | null
          created_at?: string
          crew_parking?: string | null
          day_number: number
          hospital_address?: string | null
          id?: string
          location_address?: string | null
          location_name?: string | null
          nearest_hospital?: string | null
          notes?: string | null
          production_id: string
          shoot_date: string
          sunrise?: string | null
          sunset?: string | null
          updated_at?: string
          weather_conditions?: string | null
          weather_high?: string | null
          weather_low?: string | null
        }
        Update: {
          base_camp?: string | null
          created_at?: string
          crew_parking?: string | null
          day_number?: number
          hospital_address?: string | null
          id?: string
          location_address?: string | null
          location_name?: string | null
          nearest_hospital?: string | null
          notes?: string | null
          production_id?: string
          shoot_date?: string
          sunrise?: string | null
          sunset?: string | null
          updated_at?: string
          weather_conditions?: string | null
          weather_high?: string | null
          weather_low?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shoot_days_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_production_member: {
        Args: { _production_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "producer" | "coordinator" | "crew"
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
      app_role: ["admin", "producer", "coordinator", "crew"],
    },
  },
} as const

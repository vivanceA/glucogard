
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      anonymized_health_data: {
        Row: {
          activity_level: string
          age_group: string
          created_at: string | null
          diet_habits: string
          family_history: boolean
          gender: string
          id: string
          location_type: string
          province: string | null
          risk_category: string
          risk_score: number
          submission_date: string
          symptoms_count: number
        }
        Insert: {
          activity_level: string
          age_group: string
          created_at?: string | null
          diet_habits: string
          family_history: boolean
          gender: string
          id: string
          location_type: string
          province?: string | null
          risk_category: string
          risk_score: number
          submission_date: string
          symptoms_count?: number
        }
        Update: {
          activity_level?: string
          age_group?: string
          created_at?: string | null
          diet_habits?: string
          family_history?: boolean
          gender?: string
          id?: string
          location_type?: string
          province?: string | null
          risk_category?: string
          risk_score?: number
          submission_date?: string
          symptoms_count?: number
        }
        Relationships: []
      }
      doctors: {
        Row: {
          created_at: string | null
          id: string
          specialization: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          specialization?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          specialization?: string | null
          user_id?: string
        }
        Relationships: []
      }
      health_submissions: {
        Row: {
          answers: Json
          id: string
          patient_id: string
          status: string | null
          submitted_at: string | null
        }
        Insert: {
          answers: Json
          id?: string
          patient_id: string
          status?: string | null
          submitted_at?: string | null
        }
        Update: {
          answers?: Json
          id?: string
          patient_id?: string
          status?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_submissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          age: number | null
          created_at: string | null
          gender: string | null
          height: number | null
          id: string
          user_id: string
          weight: number | null
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          gender?: string | null
          height?: number | null
          id?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          age?: number | null
          created_at?: string | null
          gender?: string | null
          height?: number | null
          id?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          content: string
          created_at: string | null
          doctor_id: string | null
          id: string
          submission_id: string
          type: string
        }
        Insert: {
          content: string
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          submission_id: string
          type: string
        }
        Update: {
          content?: string
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          submission_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "health_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      research_preferences: {
        Row: {
          allow_anonymous_data_export: boolean | null
          allow_public_health_reporting: boolean | null
          allow_trend_analysis: boolean | null
          id: string
          participate_in_research: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allow_anonymous_data_export?: boolean | null
          allow_public_health_reporting?: boolean | null
          allow_trend_analysis?: boolean | null
          id?: string
          participate_in_research?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allow_anonymous_data_export?: boolean | null
          allow_public_health_reporting?: boolean | null
          allow_trend_analysis?: boolean | null
          id?: string
          participate_in_research?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      risk_predictions: {
        Row: {
          generated_at: string | null
          id: string
          risk_category: string
          risk_score: number
          submission_id: string
        }
        Insert: {
          generated_at?: string | null
          id?: string
          risk_category: string
          risk_score: number
          submission_id: string
        }
        Update: {
          generated_at?: string | null
          id?: string
          risk_category?: string
          risk_score?: number
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_predictions_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "health_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_current_user_doctor: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

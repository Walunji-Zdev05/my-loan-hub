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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          address: string | null
          client_number: string
          created_at: string
          email: string | null
          employer: string | null
          first_name: string
          id: string
          id_number: string | null
          last_name: string
          monthly_income: number | null
          notes: string | null
          occupation: string | null
          phone: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          client_number: string
          created_at?: string
          email?: string | null
          employer?: string | null
          first_name: string
          id?: string
          id_number?: string | null
          last_name: string
          monthly_income?: number | null
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          client_number?: string
          created_at?: string
          email?: string | null
          employer?: string | null
          first_name?: string
          id?: string
          id_number?: string | null
          last_name?: string
          monthly_income?: number | null
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      fees_payments: {
        Row: {
          amount: number
          created_at: string
          fee_type: Database["public"]["Enums"]["fee_type"]
          id: string
          loan_id: string
          notes: string | null
          paid_at: string
          payment_method: Database["public"]["Enums"]["payment_method"]
        }
        Insert: {
          amount: number
          created_at?: string
          fee_type: Database["public"]["Enums"]["fee_type"]
          id?: string
          loan_id: string
          notes?: string | null
          paid_at?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
        }
        Update: {
          amount?: number
          created_at?: string
          fee_type?: Database["public"]["Enums"]["fee_type"]
          id?: string
          loan_id?: string
          notes?: string | null
          paid_at?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
        }
        Relationships: [
          {
            foreignKeyName: "fees_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string
          description: string | null
          entry_date: string
          entry_type: Database["public"]["Enums"]["ledger_entry_type"]
          id: string
          loan_id: string | null
          reference_id: string | null
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_at?: string
          description?: string | null
          entry_date?: string
          entry_type: Database["public"]["Enums"]["ledger_entry_type"]
          id?: string
          loan_id?: string | null
          reference_id?: string | null
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          description?: string | null
          entry_date?: string
          entry_type?: Database["public"]["Enums"]["ledger_entry_type"]
          id?: string
          loan_id?: string | null
          reference_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_products: {
        Row: {
          application_fee: number
          approval_fee: number
          created_at: string
          description: string | null
          id: string
          interest_rate: number
          interest_type: Database["public"]["Enums"]["interest_type"]
          is_active: boolean
          max_amount: number
          max_term_months: number
          min_amount: number
          min_term_months: number
          name: string
          penalty_rate: number
          updated_at: string
        }
        Insert: {
          application_fee?: number
          approval_fee?: number
          created_at?: string
          description?: string | null
          id?: string
          interest_rate: number
          interest_type?: Database["public"]["Enums"]["interest_type"]
          is_active?: boolean
          max_amount?: number
          max_term_months?: number
          min_amount?: number
          min_term_months?: number
          name: string
          penalty_rate?: number
          updated_at?: string
        }
        Update: {
          application_fee?: number
          approval_fee?: number
          created_at?: string
          description?: string | null
          id?: string
          interest_rate?: number
          interest_type?: Database["public"]["Enums"]["interest_type"]
          is_active?: boolean
          max_amount?: number
          max_term_months?: number
          min_amount?: number
          min_term_months?: number
          name?: string
          penalty_rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      loan_schedule: {
        Row: {
          created_at: string
          due_date: string
          id: string
          installment_number: number
          interest_portion: number
          loan_id: string
          paid_amount: number | null
          paid_at: string | null
          principal_portion: number
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date: string
          id?: string
          installment_number: number
          interest_portion: number
          loan_id: string
          paid_amount?: number | null
          paid_at?: string | null
          principal_portion: number
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string
          id?: string
          installment_number?: number
          interest_portion?: number
          loan_id?: string
          paid_amount?: number | null
          paid_at?: string | null
          principal_portion?: number
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_schedule_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          applied_at: string
          approved_at: string | null
          client_id: string
          created_at: string
          disbursed_at: string | null
          documents: Json | null
          guarantor_name: string | null
          guarantor_phone: string | null
          guarantor_relationship: string | null
          id: string
          interest_rate: number
          interest_type: Database["public"]["Enums"]["interest_type"]
          loan_number: string
          monthly_payment: number
          next_payment_date: string | null
          notes: string | null
          outstanding_balance: number
          paid_at: string | null
          principal_amount: number
          product_id: string
          purpose: string | null
          status: Database["public"]["Enums"]["loan_status"]
          term_months: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          applied_at?: string
          approved_at?: string | null
          client_id: string
          created_at?: string
          disbursed_at?: string | null
          documents?: Json | null
          guarantor_name?: string | null
          guarantor_phone?: string | null
          guarantor_relationship?: string | null
          id?: string
          interest_rate: number
          interest_type: Database["public"]["Enums"]["interest_type"]
          loan_number: string
          monthly_payment: number
          next_payment_date?: string | null
          notes?: string | null
          outstanding_balance: number
          paid_at?: string | null
          principal_amount: number
          product_id: string
          purpose?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          term_months: number
          total_amount: number
          updated_at?: string
        }
        Update: {
          applied_at?: string
          approved_at?: string | null
          client_id?: string
          created_at?: string
          disbursed_at?: string | null
          documents?: Json | null
          guarantor_name?: string | null
          guarantor_phone?: string | null
          guarantor_relationship?: string | null
          id?: string
          interest_rate?: number
          interest_type?: Database["public"]["Enums"]["interest_type"]
          loan_number?: string
          monthly_payment?: number
          next_payment_date?: string | null
          notes?: string | null
          outstanding_balance?: number
          paid_at?: string | null
          principal_amount?: number
          product_id?: string
          purpose?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          term_months?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "loan_products"
            referencedColumns: ["id"]
          },
        ]
      }
      repayments: {
        Row: {
          amount: number
          created_at: string
          id: string
          interest_portion: number | null
          loan_id: string
          notes: string | null
          paid_at: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          principal_portion: number | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          interest_portion?: number | null
          loan_id: string
          notes?: string | null
          paid_at?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          principal_portion?: number | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          interest_portion?: number | null
          loan_id?: string
          notes?: string | null
          paid_at?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          principal_portion?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "repayments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      generate_client_number: { Args: never; Returns: string }
      generate_loan_number: { Args: never; Returns: string }
      get_client_id_for_user: {
        Args: { check_user_id?: string }
        Returns: string
      }
      is_admin: { Args: { check_user_id?: string }; Returns: boolean }
      is_client_owner: { Args: { target_client_id: string }; Returns: boolean }
      is_loan_owner: { Args: { target_loan_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "borrower"
      fee_type: "application_fee" | "approval_fee" | "penalty"
      interest_type: "flat_rate" | "reducing_balance"
      ledger_entry_type:
        | "application_fee"
        | "approval_fee"
        | "interest"
        | "penalty"
        | "repayment"
      loan_status:
        | "applied"
        | "approved"
        | "disbursed"
        | "active"
        | "overdue"
        | "paid"
        | "rejected"
      payment_method: "cash" | "bank_transfer" | "mobile_money"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "borrower"],
      fee_type: ["application_fee", "approval_fee", "penalty"],
      interest_type: ["flat_rate", "reducing_balance"],
      ledger_entry_type: [
        "application_fee",
        "approval_fee",
        "interest",
        "penalty",
        "repayment",
      ],
      loan_status: [
        "applied",
        "approved",
        "disbursed",
        "active",
        "overdue",
        "paid",
        "rejected",
      ],
      payment_method: ["cash", "bank_transfer", "mobile_money"],
    },
  },
} as const

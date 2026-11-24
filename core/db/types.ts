// Generated from the live database (Supabase "generate TypeScript types").
// Do not edit by hand: regenerate after every migration.

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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      attempt_modules: {
        Row: {
          attempt_id: string
          correct_count: number | null
          deadline_at: string | null
          id: string
          module_id: string | null
          question_ids: string[]
          started_at: string
          submitted_at: string | null
        }
        Insert: {
          attempt_id: string
          correct_count?: number | null
          deadline_at?: string | null
          id?: string
          module_id?: string | null
          question_ids: string[]
          started_at?: string
          submitted_at?: string | null
        }
        Update: {
          attempt_id?: string
          correct_count?: number | null
          deadline_at?: string | null
          id?: string
          module_id?: string | null
          question_ids?: string[]
          started_at?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attempt_modules_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      attempts: {
        Row: {
          finished_at: string | null
          id: string
          kind: string
          mode: string
          raw_correct: number | null
          scaled_score: number | null
          set_id: string | null
          started_at: string
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          finished_at?: string | null
          id?: string
          kind?: string
          mode: string
          raw_correct?: number | null
          scaled_score?: number | null
          set_id?: string | null
          started_at?: string
          status?: string
          subject: string
          user_id?: string
        }
        Update: {
          finished_at?: string | null
          id?: string
          kind?: string
          mode?: string
          raw_correct?: number | null
          scaled_score?: number | null
          set_id?: string | null
          started_at?: string
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempts_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "question_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      domains: {
        Row: {
          id: number
          name: string
          sort_order: number
          subject: string
        }
        Insert: {
          id?: never
          name: string
          sort_order: number
          subject: string
        }
        Update: {
          id?: never
          name?: string
          sort_order?: number
          subject?: string
        }
        Relationships: []
      }
      module_questions: {
        Row: {
          module_id: string
          position: number
          question_id: string
        }
        Insert: {
          module_id: string
          position: number
          question_id: string
        }
        Update: {
          module_id?: string
          position?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_questions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          id: string
          module_number: number
          set_id: string
          sort_order: number
          tier: string
          time_limit_sec: number | null
        }
        Insert: {
          id?: string
          module_number: number
          set_id: string
          sort_order?: number
          tier?: string
          time_limit_sec?: number | null
        }
        Update: {
          id?: string
          module_number?: number
          set_id?: string
          sort_order?: number
          tier?: string
          time_limit_sec?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "question_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          role: string
          target_score: number | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          role?: string
          target_score?: number | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
          target_score?: number | null
        }
        Relationships: []
      }
      question_answers: {
        Row: {
          accepted_answers: string[]
          correct_answer: string
          explanation: string | null
          question_id: string
        }
        Insert: {
          accepted_answers?: string[]
          correct_answer: string
          explanation?: string | null
          question_id: string
        }
        Update: {
          accepted_answers?: string[]
          correct_answer?: string
          explanation?: string | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_progress: {
        Row: {
          correct_streak: number
          last_result: string | null
          last_seen_at: string | null
          mastered: boolean
          question_id: string
          times_seen: number
          times_wrong: number
          user_id: string
        }
        Insert: {
          correct_streak?: number
          last_result?: string | null
          last_seen_at?: string | null
          mastered?: boolean
          question_id: string
          times_seen?: number
          times_wrong?: number
          user_id: string
        }
        Update: {
          correct_streak?: number
          last_result?: string | null
          last_seen_at?: string | null
          mastered?: boolean
          question_id?: string
          times_seen?: number
          times_wrong?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_progress_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_sets: {
        Row: {
          created_at: string
          id: string
          is_adaptive: boolean
          kind: string
          month: string | null
          published: boolean
          skill_id: number | null
          subject: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_adaptive?: boolean
          kind: string
          month?: string | null
          published?: boolean
          skill_id?: number | null
          subject: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_adaptive?: boolean
          kind?: string
          month?: string | null
          published?: boolean
          skill_id?: number | null
          subject?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_sets_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          choices: Json | null
          created_at: string
          difficulty: string
          external_id: string
          id: string
          image_path: string | null
          month: string | null
          passage: string | null
          prompt: string
          skill_id: number | null
          source: string | null
          status: string
          subject: string
          type: string
          updated_at: string
          version: number
        }
        Insert: {
          choices?: Json | null
          created_at?: string
          difficulty: string
          external_id: string
          id?: string
          image_path?: string | null
          month?: string | null
          passage?: string | null
          prompt: string
          skill_id?: number | null
          source?: string | null
          status?: string
          subject: string
          type: string
          updated_at?: string
          version?: number
        }
        Update: {
          choices?: Json | null
          created_at?: string
          difficulty?: string
          external_id?: string
          id?: string
          image_path?: string | null
          month?: string | null
          passage?: string | null
          prompt?: string
          skill_id?: number | null
          source?: string | null
          status?: string
          subject?: string
          type?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "questions_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          answer: string | null
          attempt_module_id: string
          eliminated: string[]
          is_correct: boolean | null
          marked_for_review: boolean
          question_id: string
          question_version: number
          time_spent_sec: number
          updated_at: string
        }
        Insert: {
          answer?: string | null
          attempt_module_id: string
          eliminated?: string[]
          is_correct?: boolean | null
          marked_for_review?: boolean
          question_id: string
          question_version?: number
          time_spent_sec?: number
          updated_at?: string
        }
        Update: {
          answer?: string | null
          attempt_module_id?: string
          eliminated?: string[]
          is_correct?: boolean | null
          marked_for_review?: boolean
          question_id?: string
          question_version?: number
          time_spent_sec?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "responses_attempt_module_id_fkey"
            columns: ["attempt_module_id"]
            isOneToOne: false
            referencedRelation: "attempt_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      score_tables: {
        Row: {
          raw_correct: number
          scaled_score: number
          subject: string
          tier: string
        }
        Insert: {
          raw_correct: number
          scaled_score: number
          subject: string
          tier: string
        }
        Update: {
          raw_correct?: number
          scaled_score?: number
          subject?: string
          tier?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          domain_id: number
          id: number
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          domain_id: number
          id?: never
          name: string
          slug: string
          sort_order: number
        }
        Update: {
          domain_id?: number
          id?: never
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "skills_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

/** The shape of one row of a table, e.g. Tables<"questions">. */
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"]
/** What you may send when adding a row. */
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"]
/** What you may send when changing a row. */
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"]

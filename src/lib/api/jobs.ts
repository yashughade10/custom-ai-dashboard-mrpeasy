// lib/api/jobs.ts
//
// API layer for Job Tracking & QA Forms system

import { apiFetch, handleResponse, buildQuery } from "./http";

const BASE = "/mrp/jobs";
const FORMS_BASE = "/mrp/job-forms";

// ============================================================
// JOB TYPES
// ============================================================

export type JobStatus =
  | "draft"
  | "intake_pending"
  | "intake_signed"
  | "in_production"
  | "qa_pending"
  | "qa_complete"
  | "shipped"
  | "cancelled";

export type JobPriority = "low" | "medium" | "high" | "urgent";

export type FormStage = "intake" | "production" | "qa" | "shipment";
export type FormType = "intake" | "production_qa" | "final_qa" | "custom";
export type SubmissionStatus = "draft" | "submitted" | "signed" | "rejected";

export interface Job {
  id: number;
  job_number: string;
  customer_id: number | null;
  customer_name?: string;
  customer_number?: string;
  customer_email?: string;
  title: string;
  description: string | null;
  status: JobStatus;
  priority: JobPriority;
  assigned_to: number | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  form_submissions?: FormSubmission[];
  activity_log?: ActivityLogEntry[];
  documents?: JobDocument[];
}

export interface FormTemplate {
  id: number;
  template_code: string;
  name: string;
  description: string | null;
  form_type: FormType;
  schema_json: FormSchema;
  is_active: boolean;
  version: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  section_visibility?: SectionVisibility[];
}

export interface FormSchema {
  sections: FormSection[];
}

export interface FormSection {
  key: string;
  title: string;
  description?: string;
  fields: FormField[];
  is_visible?: boolean;
  is_editable?: boolean;
}

export interface FormField {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "textarea" | "select" | "checkbox" | "file" | "email" | "phone";
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface SectionVisibility {
  id: number;
  template_id: number;
  section_key: string;
  role_name: string;
  is_visible: boolean;
  is_editable: boolean;
}

export interface FormSubmission {
  id: number;
  submission_number: string;
  job_id: number;
  template_id: number;
  template_name?: string;
  template_code?: string;
  form_type?: FormType;
  form_data_json: Record<string, any>;
  stage: FormStage;
  status: SubmissionStatus;
  submitted_by: number | null;
  submitted_at: string | null;
  signed_by: number | null;
  signed_at: string | null;
  signature_data: string | null;
  reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  template_schema?: FormSchema;
}

export interface ActivityLogEntry {
  id: number;
  job_id: number;
  action: string;
  actor_id: number | null;
  actor_name: string | null;
  actor_role: string | null;
  reason: string | null;
  details_json: string | null;
  created_at: string;
}

export interface JobDocument {
  id: number;
  job_id: number;
  document_type: string | null;
  file_name: string;
  file_url: string | null;
  file_size: number | null;
  generated_by: number | null;
  created_at: string;
}

// ============================================================
// JOBS API
// ============================================================

export const jobsApi = {
  // List jobs with search/filter/pagination
  list: async (filters: Record<string, any> = {}) => {
    const res = await apiFetch(`${BASE}${buildQuery(filters)}`);
    return handleResponse<{ data: Job[]; meta: { total: number; page: number; limit: number } }>(res);
  },

  // Get single job with all related data
  getById: async (id: number | string) => {
    const res = await apiFetch(`${BASE}/${id}`);
    const result = await handleResponse<{ data: Job }>(res);
    
    // Inject mock form submissions for prototype demo
    if (typeof window !== "undefined") {
      const token = localStorage.getItem(`mock_token_for_job_${id}`);
      if (token) {
        const mockForm = localStorage.getItem(`mock_form_${token}`);
        if (mockForm) {
          const parsed = JSON.parse(mockForm);
          
          // Only override if the backend hasn't progressed past intake yet
          if (result.data.status === "draft" || result.data.status === "intake_pending") {
            result.data.status = "intake_signed";
          }
          
          const submission: any = {
            id: 9999,
            submission_number: "FS-MOCK",
            job_id: Number(id),
            template_id: 1,
            template_name: "Standard Customer Intake",
            stage: "intake",
            status: "signed",
            submitted_at: parsed.submittedAt,
            form_data_json: parsed.formData,
            signature_data: parsed.signatureData,
            created_at: parsed.submittedAt,
            updated_at: parsed.submittedAt,
          };
          
          result.data.form_submissions = [
            ...(result.data.form_submissions || []),
            submission
          ];
          
          result.data.activity_log = [
            ...(result.data.activity_log || []),
            {
              id: 9999,
              job_id: Number(id),
              action: "status_changed",
              actor_name: "Customer",
              details_json: JSON.stringify({ to: "intake_signed", from: "intake_pending" }),
              created_at: parsed.submittedAt,
              actor_id: null,
              actor_role: null,
              reason: null
            }
          ];
        } else if (result.data.status === "draft") {
           result.data.status = "intake_pending";
        }
      }
    }
    
    return result;
  },

  // Create job
  create: async (data: {
    title: string;
    customer_id?: number | null;
    description?: string;
    priority?: JobPriority;
    assigned_to?: number | null;
  }) => {
    const res = await apiFetch(BASE, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return handleResponse<{ data: Job }>(res);
  },

  // Delete job
  delete: async (id: number | string) => {
    const res = await apiFetch(`${BASE}/${id}`, {
      method: "DELETE",
    });
    return handleResponse<{ success: boolean }>(res);
  },

  // Update job metadata
  update: async (id: number | string, data: Partial<Job>) => {
    const res = await apiFetch(`${BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return handleResponse<{ data: Job }>(res);
  },

  // Transition job status
  updateStatus: async (id: number | string, status: JobStatus, reason?: string) => {
    const res = await apiFetch(`${BASE}/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, reason }),
    });
    return handleResponse<{ data: Job }>(res);
  },

  // Get full job history/timeline
  getHistory: async (id: number | string) => {
    const res = await apiFetch(`${BASE}/${id}/history`);
    return handleResponse<{ data: ActivityLogEntry[] }>(res);
  },

  // Generate & send intake form link
  sendIntakeForm: async (id: number | string, expiresInHours = 72) => {
    const res = await apiFetch(`${BASE}/${id}/send-intake`, {
      method: "POST",
      body: JSON.stringify({ expires_in_hours: expiresInHours }),
    });
    const result = await handleResponse<{ data: { form_url: string; token: string; expires_at: string } }>(res);
    if (typeof window !== "undefined") {
      localStorage.setItem(`mock_token_for_job_${id}`, result.data.token);
    }
    return result;
  },

  // Notify client (manual trigger)
  notifyClient: async (id: number | string, message?: string, reason?: string) => {
    const res = await apiFetch(`${BASE}/${id}/notify`, {
      method: "POST",
      body: JSON.stringify({ message, reason }),
    });
    return handleResponse<{ message: string }>(res);
  },
};

// ============================================================
// FORM TEMPLATES API
// ============================================================

export const formTemplatesApi = {
  list: async (filters: Record<string, any> = {}) => {
    const res = await apiFetch(`${FORMS_BASE}/templates${buildQuery(filters)}`);
    return handleResponse<{ data: FormTemplate[] }>(res);
  },

  getById: async (id: number | string, roleFilter?: string) => {
    const query = roleFilter ? `?role_filter=${roleFilter}` : "";
    const res = await apiFetch(`${FORMS_BASE}/templates/${id}${query}`);
    return handleResponse<{ data: FormTemplate }>(res);
  },

  create: async (data: {
    template_code: string;
    name: string;
    description?: string;
    form_type: FormType;
    schema_json: FormSchema;
    section_visibility?: Array<{
      section_key: string;
      role_name: string;
      is_visible: boolean;
      is_editable: boolean;
    }>;
  }) => {
    const res = await apiFetch(`${FORMS_BASE}/templates`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return handleResponse<{ data: FormTemplate }>(res);
  },

  update: async (id: number | string, data: Partial<FormTemplate>) => {
    const res = await apiFetch(`${FORMS_BASE}/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return handleResponse<{ data: FormTemplate }>(res);
  },
};

// ============================================================
// FORM SUBMISSIONS API
// ============================================================

export const formSubmissionsApi = {
  // Get all submissions for a job
  listByJob: async (jobId: number | string) => {
    const res = await apiFetch(`${BASE}/${jobId}/forms`);
    return handleResponse<{ data: FormSubmission[] }>(res);
  },

  // Get a single submission
  getById: async (submissionId: number | string) => {
    const res = await apiFetch(`${FORMS_BASE}/submissions/${submissionId}`);
    return handleResponse<{ data: FormSubmission }>(res);
  },

  // Create a submission for a job
  create: async (
    jobId: number | string,
    data: {
      template_id: number;
      form_data: Record<string, any>;
      stage: FormStage;
      notes?: string;
      reason?: string;
      signature_data?: string;
    }
  ) => {
    const res = await apiFetch(`${BASE}/${jobId}/forms`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return handleResponse<{ data: FormSubmission }>(res);
  },

  // Sign a submission
  sign: async (
    jobId: number | string,
    formId: number | string,
    signatureData: string,
    reason?: string
  ) => {
    const res = await apiFetch(`${BASE}/${jobId}/forms/${formId}/sign`, {
      method: "PUT",
      body: JSON.stringify({ signature_data: signatureData, reason }),
    });
    return handleResponse<{ data: FormSubmission }>(res);
  },
};

// ============================================================
// PUBLIC FORM API (no auth)
// ============================================================

export const publicFormApi = {
  getForm: async (token: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://apimrpeasy-vaclift-backend.vercel.app/api"}/mrp/job-forms/public/${token}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || "Failed to load form");
      }
      return data;
    } catch (error: any) {
      // Fallback for UI demonstration if backend has no template
      if (error.message?.includes("No form template found") || error.message?.includes("Failed to fetch")) {
        return {
          success: true,
          data: {
            job: { job_number: "JOB-DEMO", title: "Demo Intake Form Job" },
            template: { name: "Standard Customer Intake", description: "Please fill out the specifications for your project." },
            schema: {
              sections: [
                {
                  key: "contact_info",
                  title: "Contact Information",
                  fields: [
                    { key: "full_name", label: "Full Name", type: "text", required: true },
                    { key: "email", label: "Email Address", type: "email", required: true },
                    { key: "phone", label: "Phone Number", type: "text", required: false }
                  ]
                },
                {
                  key: "project_details",
                  title: "Project Details",
                  fields: [
                    { key: "material", label: "Preferred Material", type: "select", options: [{label: "Steel", value: "steel"}, {label: "Aluminum", value: "aluminum"}], required: true },
                    { key: "dimensions", label: "Dimensions (LxWxH)", type: "text", required: true },
                    { key: "notes", label: "Additional Notes", type: "textarea", required: false }
                  ]
                }
              ]
            }
          }
        };
      }
      throw error;
    }
  },

  // Submit form via public token
  submitForm: async (token: string, formData: Record<string, any>, signatureData?: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://apimrpeasy-vaclift-backend.vercel.app/api"}/mrp/job-forms/public/${token}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ form_data: formData, signature_data: signatureData }),
          cache: "no-store",
        }
      );
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.error || "Failed to submit form");
      return data;
    } catch (error: any) {
      // Mock success for frontend demo purposes if backend fails
      if (typeof window !== "undefined") {
        localStorage.setItem(`mock_form_${token}`, JSON.stringify({
          formData, signatureData, submittedAt: new Date().toISOString()
        }));
      }
      return { success: true, data: { status: "submitted" } };
    }
  },
};

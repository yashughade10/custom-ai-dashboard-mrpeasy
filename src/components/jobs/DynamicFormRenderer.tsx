"use client";

import { useState } from "react";
import { FormSchema, FormField } from "@/lib/api/jobs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SignatureCapture } from "./SignatureCapture";

interface DynamicFormRendererProps {
  schema: FormSchema;
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>, signatureData?: string) => void;
  isSubmitting?: boolean;
  readOnly?: boolean;
  requireSignature?: boolean;
}

export function DynamicFormRenderer({
  schema,
  initialData = {},
  onSubmit,
  isSubmitting = false,
  readOnly = false,
  requireSignature = false,
}: DynamicFormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [signature, setSignature] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (key: string, value: any) => {
    if (readOnly) return;
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear error on change
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    schema.sections?.forEach((section) => {
      section.fields?.forEach((field) => {
        const val = formData[field.key];
        if (field.required && (val === undefined || val === null || val === "")) {
          newErrors[field.key] = `${field.label} is required`;
          isValid = false;
        }
      });
    });

    if (requireSignature && !signature && !readOnly) {
      newErrors["signature"] = "Signature is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    
    if (validate()) {
      onSubmit(formData, signature || undefined);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.key] || "";
    
    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            id={field.key}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            disabled={readOnly}
          />
        );
      case "select":
        return (
          <select
            id={field.key}
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            disabled={readOnly}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select an option</option>
            {field.options?.map((opt, i) => (
              <option key={i} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      case "checkbox":
        return (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id={field.key}
              checked={!!formData[field.key]}
              onChange={(e) => handleChange(field.key, e.target.checked)}
              disabled={readOnly}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor={field.key} className="font-normal cursor-pointer">
              {field.label}
            </Label>
          </div>
        );
      default: // text, number, date, email, phone
        return (
          <Input
            id={field.key}
            type={field.type}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            disabled={readOnly}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {schema.sections?.map((section, idx) => (
        <div key={idx} className="bg-card rounded-lg border p-6 space-y-4 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold">{section.title}</h3>
            {section.description && <p className="text-sm text-muted-foreground">{section.description}</p>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {section.fields?.map((field) => (
              <div key={field.key} className={`space-y-2 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                {field.type !== "checkbox" && (
                  <Label htmlFor={field.key}>
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </Label>
                )}
                {renderField(field)}
                {errors[field.key] && <p className="text-sm text-red-500">{errors[field.key]}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}

      {requireSignature && !readOnly && (
        <div className="bg-card rounded-lg border p-6 space-y-4 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold">Sign Off</h3>
            <p className="text-sm text-muted-foreground">Please provide your signature to complete this form.</p>
          </div>
          <SignatureCapture onSignatureChange={setSignature} />
          {errors["signature"] && <p className="text-sm text-red-500">{errors["signature"]}</p>}
        </div>
      )}

      {readOnly && initialData.signature_data && (
        <div className="bg-card rounded-lg border p-6 space-y-4 shadow-sm">
          <h3 className="text-lg font-semibold">Signature</h3>
          <div className="border rounded bg-white p-2 inline-block">
            <img src={initialData.signature_data} alt="Signature" className="max-h-32" />
          </div>
        </div>
      )}

      {!readOnly && (
        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isSubmitting} size="lg">
            {isSubmitting ? "Submitting..." : "Submit Form"}
          </Button>
        </div>
      )}
    </form>
  );
}

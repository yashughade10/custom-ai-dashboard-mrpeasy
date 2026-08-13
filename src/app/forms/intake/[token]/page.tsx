"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { publicFormApi, FormSubmission, Job } from "@/lib/api/jobs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function IntakeFormPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<any>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [signature, setSignature] = useState("");

  useEffect(() => {
    async function loadForm() {
      try {
        const res = await publicFormApi.getForm(token);
        setFormData(res.data);
      } catch (err: any) {
        setError(err.message || "Failed to load form. The link may have expired or is invalid.");
      } finally {
        setLoading(false);
      }
    }
    
    if (token) {
      loadForm();
    }
  }, [token]);

  const handleFieldChange = (key: string, value: any) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signature.trim()) {
      toast.error("Please provide a signature before submitting.");
      return;
    }
    
    setSubmitting(true);
    try {
      await publicFormApi.submitForm(token, values, signature);
      setSuccess(true);
      toast.success("Form submitted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit form.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Form</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full text-center py-8">
          <CardContent>
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl mb-2">Thank You!</CardTitle>
            <p className="text-gray-600">
              Your intake form has been successfully submitted. We will review your information and be in touch soon.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { job, template, schema } = formData;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">{template?.name || "Intake Form"}</h1>
          <p className="mt-2 text-gray-600">
            Job Reference: <span className="font-semibold text-gray-900">{job?.job_number}</span> - {job?.title}
          </p>
          {template?.description && (
            <p className="mt-2 text-sm text-gray-500">{template.description}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {schema?.sections?.map((section: any) => (
            <Card key={section.key} className="overflow-hidden">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-lg">{section.title}</CardTitle>
                {section.description && <CardDescription>{section.description}</CardDescription>}
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {section.fields?.map((field: any) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    
                    {field.type === "textarea" ? (
                      <Textarea
                        id={field.key}
                        placeholder={field.placeholder}
                        required={field.required}
                        value={values[field.key] || ""}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      />
                    ) : field.type === "select" ? (
                      <Select
                        required={field.required}
                        value={values[field.key] || ""}
                        onValueChange={(val) => handleFieldChange(field.key, val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder || "Select an option"} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((opt: any) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.type === "checkbox" ? (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={field.key}
                          checked={!!values[field.key]}
                          onCheckedChange={(checked) => handleFieldChange(field.key, checked)}
                        />
                        <Label htmlFor={field.key} className="font-normal">{field.label}</Label>
                      </div>
                    ) : (
                      <Input
                        id={field.key}
                        type={field.type === "email" ? "email" : field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                        placeholder={field.placeholder}
                        required={field.required}
                        value={values[field.key] || ""}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {/* Signature Section */}
          <Card>
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-lg">Signature & Agreement</CardTitle>
              <CardDescription>Please type your full name as an electronic signature to confirm the details provided.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                <Label htmlFor="signature">Electronic Signature <span className="text-red-500">*</span></Label>
                <Input
                  id="signature"
                  placeholder="Type your full legal name"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="max-w-md font-serif text-lg"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto px-8">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Submitting..." : "Submit Form"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

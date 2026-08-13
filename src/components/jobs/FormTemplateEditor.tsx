"use client";

import { useState } from "react";
import { FormTemplate, FormType, formTemplatesApi, FormSchema } from "@/lib/api/jobs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function FormTemplateEditor({ initialTemplate }: { initialTemplate?: FormTemplate }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [metadata, setMetadata] = useState({
    template_code: initialTemplate?.template_code || "",
    name: initialTemplate?.name || "",
    description: initialTemplate?.description || "",
    form_type: initialTemplate?.form_type || "custom",
  });

  const [schema, setSchema] = useState<FormSchema>(
    initialTemplate?.schema_json || { sections: [] }
  );

  const addSection = () => {
    setSchema((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          key: `section_${Date.now()}`,
          title: "New Section",
          fields: [],
        },
      ],
    }));
  };

  const removeSection = (sectionIndex: number) => {
    setSchema((prev) => {
      const newSections = [...prev.sections];
      newSections.splice(sectionIndex, 1);
      return { ...prev, sections: newSections };
    });
  };

  const updateSection = (index: number, updates: any) => {
    setSchema((prev) => {
      const newSections = [...prev.sections];
      newSections[index] = { ...newSections[index], ...updates };
      return { ...prev, sections: newSections };
    });
  };

  const addField = (sectionIndex: number) => {
    setSchema((prev) => {
      const newSections = [...prev.sections];
      newSections[sectionIndex].fields.push({
        key: `field_${Date.now()}`,
        label: "New Field",
        type: "text",
        required: false,
      });
      return { ...prev, sections: newSections };
    });
  };

  const removeField = (sectionIndex: number, fieldIndex: number) => {
    setSchema((prev) => {
      const newSections = [...prev.sections];
      newSections[sectionIndex].fields.splice(fieldIndex, 1);
      return { ...prev, sections: newSections };
    });
  };

  const updateField = (sectionIndex: number, fieldIndex: number, updates: any) => {
    setSchema((prev) => {
      const newSections = [...prev.sections];
      newSections[sectionIndex].fields[fieldIndex] = {
        ...newSections[sectionIndex].fields[fieldIndex],
        ...updates,
      };
      return { ...prev, sections: newSections };
    });
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...metadata,
        schema_json: schema,
      };

      if (initialTemplate) {
        await formTemplatesApi.update(initialTemplate.id, payload);
        toast.success("Template updated successfully");
      } else {
        await formTemplatesApi.create(payload as any);
        toast.success("Template created successfully");
        router.push("/dashboard/admin/form-templates");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save template");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Metadata */}
      <div className="bg-card rounded-lg border p-6 space-y-4 shadow-sm">
        <h2 className="text-xl font-bold">Template Settings</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Template Code (Unique)</Label>
            <Input
              value={metadata.template_code}
              onChange={(e) => setMetadata({ ...metadata, template_code: e.target.value })}
              disabled={!!initialTemplate}
              placeholder="e.g. CLIENT_INTAKE_01"
            />
          </div>
          <div className="space-y-2">
            <Label>Template Name</Label>
            <Input
              value={metadata.name}
              onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Form Type</Label>
            <select
              value={metadata.form_type}
              onChange={(e) => setMetadata({ ...metadata, form_type: e.target.value as FormType })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="intake">Client Intake</option>
              <option value="production_qa">Production QA</option>
              <option value="final_qa">Final QA</option>
              <option value="custom">Custom Form</option>
            </select>
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Description</Label>
            <Textarea
              value={metadata.description}
              onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Schema Builder */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Form Structure</h2>
          <Button onClick={addSection} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add Section
          </Button>
        </div>

        {schema.sections.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 border rounded-lg border-dashed text-muted-foreground">
            No sections yet. Click "Add Section" to begin.
          </div>
        ) : (
          schema.sections.map((section, sIdx) => (
            <div key={sIdx} className="bg-card rounded-lg border p-4 shadow-sm border-l-4 border-l-blue-500">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-2 flex-1 mr-4">
                  <Input
                    value={section.title}
                    onChange={(e) => updateSection(sIdx, { title: e.target.value })}
                    className="font-semibold text-lg"
                    placeholder="Section Title"
                  />
                  <Input
                    value={section.description || ""}
                    onChange={(e) => updateSection(sIdx, { description: e.target.value })}
                    className="text-sm"
                    placeholder="Section Description (optional)"
                  />
                </div>
                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeSection(sIdx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3 pl-4 border-l-2 border-muted ml-2">
                {section.fields.map((field, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-3 bg-muted/50 p-2 rounded group">
                    <GripVertical className="h-4 w-4 text-muted-foreground opacity-50 cursor-move" />
                    
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(sIdx, fIdx, { label: e.target.value, key: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_') })}
                      placeholder="Field Label"
                      className="flex-1"
                    />

                    <select
                      value={field.type}
                      onChange={(e) => updateField(sIdx, fIdx, { type: e.target.value })}
                      className="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="text">Text (Short)</option>
                      <option value="textarea">Text (Long)</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="checkbox">Checkbox</option>
                    </select>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(sIdx, fIdx, { required: e.target.checked })}
                      />
                      Required
                    </label>

                    <Button variant="ghost" size="icon" className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeField(sIdx, fIdx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button onClick={() => addField(sIdx)} variant="ghost" size="sm" className="mt-2 text-blue-600">
                  <Plus className="mr-2 h-4 w-4" /> Add Field
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-end pt-6 border-t">
        <Button onClick={handleSave} disabled={isSubmitting} size="lg">
          {isSubmitting ? "Saving..." : "Save Template"}
        </Button>
      </div>
    </div>
  );
}

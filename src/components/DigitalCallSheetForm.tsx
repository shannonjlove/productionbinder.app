import { useState } from "react";
import { Plus, Trash2, GripVertical, Copy, Eye, Send, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type QuestionType = "text" | "textarea" | "select" | "multiselect" | "date" | "time" | "checkbox" | "number";

export interface FormQuestion {
  id: string;
  type: QuestionType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select/multiselect
}

export interface DigitalCallSheetFormData {
  id: string;
  title: string;
  description: string;
  questions: FormQuestion[];
  projectName: string;
  shootDate: string;
  createdAt: string;
}

export interface FormResponse {
  id: string;
  formId: string;
  respondentName: string;
  respondentEmail: string;
  answers: Record<string, string | string[] | boolean>;
  submittedAt: string;
}

interface SortableQuestionProps {
  question: FormQuestion;
  onUpdate: (id: string, updates: Partial<FormQuestion>) => void;
  onDelete: (id: string) => void;
  onAddOption: (id: string) => void;
  onUpdateOption: (questionId: string, optionIndex: number, value: string) => void;
  onDeleteOption: (questionId: string, optionIndex: number) => void;
}

const SortableQuestion = ({ 
  question, 
  onUpdate, 
  onDelete, 
  onAddOption,
  onUpdateOption,
  onDeleteOption 
}: SortableQuestionProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const questionTypes: { value: QuestionType; label: string }[] = [
    { value: "text", label: "Short Text" },
    { value: "textarea", label: "Long Text" },
    { value: "select", label: "Dropdown" },
    { value: "multiselect", label: "Multiple Choice" },
    { value: "date", label: "Date" },
    { value: "time", label: "Time" },
    { value: "checkbox", label: "Yes/No" },
    { value: "number", label: "Number" },
  ];

  const showOptions = question.type === "select" || question.type === "multiselect";

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="p-4 space-y-4 bg-card border-border">
        <div className="flex items-start gap-3">
          <button
            {...attributes}
            {...listeners}
            className="mt-2 cursor-grab hover:text-primary transition-colors"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>

          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <Input
                value={question.label}
                onChange={(e) => onUpdate(question.id, { label: e.target.value })}
                placeholder="Question label"
                className="flex-1 font-medium"
              />
              <Select
                value={question.type}
                onValueChange={(value: QuestionType) => onUpdate(question.id, { type: value })}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {questionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Input
              value={question.placeholder || ""}
              onChange={(e) => onUpdate(question.id, { placeholder: e.target.value })}
              placeholder="Placeholder text (optional)"
              className="text-sm"
            />

            {showOptions && (
              <div className="space-y-2 pl-4 border-l-2 border-muted">
                <Label className="text-sm text-muted-foreground">Options</Label>
                {(question.options || []).map((option, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) => onUpdateOption(question.id, idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteOption(question.id, idx)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddOption(question.id)}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Option
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={question.required}
                  onCheckedChange={(checked) => onUpdate(question.id, { required: checked })}
                />
                <Label className="text-sm text-muted-foreground">Required</Label>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(question.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

interface DigitalCallSheetFormProps {
  forms: DigitalCallSheetFormData[];
  responses: FormResponse[];
  onSaveForm: (form: DigitalCallSheetFormData) => void;
  onDeleteForm: (formId: string) => void;
  onAddResponse: (response: FormResponse) => void;
}

export const DigitalCallSheetForm = ({
  forms,
  responses,
  onSaveForm,
  onDeleteForm,
  onAddResponse,
}: DigitalCallSheetFormProps) => {
  const [activeView, setActiveView] = useState<"forms" | "builder" | "preview" | "responses">("forms");
  const [editingForm, setEditingForm] = useState<DigitalCallSheetFormData | null>(null);
  const [previewForm, setPreviewForm] = useState<DigitalCallSheetFormData | null>(null);
  const [previewResponses, setPreviewResponses] = useState<Record<string, string | string[] | boolean>>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const createNewForm = () => {
    const newForm: DigitalCallSheetFormData = {
      id: `form-${Date.now()}`,
      title: "New Call Sheet Form",
      description: "",
      questions: [
        { id: `q-${Date.now()}-1`, type: "text", label: "Full Name", required: true },
        { id: `q-${Date.now()}-2`, type: "text", label: "Role/Position", required: true },
        { id: `q-${Date.now()}-3`, type: "text", label: "Phone Number", required: true },
        { id: `q-${Date.now()}-4`, type: "text", label: "Email Address", required: true },
        { id: `q-${Date.now()}-5`, type: "time", label: "Availability Start Time", required: false },
        { id: `q-${Date.now()}-6`, type: "checkbox", label: "I confirm my attendance", required: true },
      ],
      projectName: "",
      shootDate: "",
      createdAt: new Date().toISOString(),
    };
    setEditingForm(newForm);
    setActiveView("builder");
  };

  const addQuestion = () => {
    if (!editingForm) return;
    const newQuestion: FormQuestion = {
      id: `q-${Date.now()}`,
      type: "text",
      label: "",
      required: false,
    };
    setEditingForm({
      ...editingForm,
      questions: [...editingForm.questions, newQuestion],
    });
  };

  const updateQuestion = (id: string, updates: Partial<FormQuestion>) => {
    if (!editingForm) return;
    setEditingForm({
      ...editingForm,
      questions: editingForm.questions.map((q) =>
        q.id === id ? { ...q, ...updates } : q
      ),
    });
  };

  const deleteQuestion = (id: string) => {
    if (!editingForm) return;
    setEditingForm({
      ...editingForm,
      questions: editingForm.questions.filter((q) => q.id !== id),
    });
  };

  const addOption = (questionId: string) => {
    if (!editingForm) return;
    setEditingForm({
      ...editingForm,
      questions: editingForm.questions.map((q) =>
        q.id === questionId
          ? { ...q, options: [...(q.options || []), ""] }
          : q
      ),
    });
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    if (!editingForm) return;
    setEditingForm({
      ...editingForm,
      questions: editingForm.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: (q.options || []).map((opt, idx) =>
                idx === optionIndex ? value : opt
              ),
            }
          : q
      ),
    });
  };

  const deleteOption = (questionId: string, optionIndex: number) => {
    if (!editingForm) return;
    setEditingForm({
      ...editingForm,
      questions: editingForm.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: (q.options || []).filter((_, idx) => idx !== optionIndex),
            }
          : q
      ),
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!editingForm || !over || active.id === over.id) return;

    const oldIndex = editingForm.questions.findIndex((q) => q.id === active.id);
    const newIndex = editingForm.questions.findIndex((q) => q.id === over.id);

    setEditingForm({
      ...editingForm,
      questions: arrayMove(editingForm.questions, oldIndex, newIndex),
    });
  };

  const saveForm = () => {
    if (!editingForm) return;
    if (!editingForm.title.trim()) {
      toast.error("Please enter a form title");
      return;
    }
    onSaveForm(editingForm);
    toast.success("Form saved successfully");
    setActiveView("forms");
    setEditingForm(null);
  };

  const copyFormLink = (formId: string) => {
    const link = `${window.location.origin}/form/${formId}`;
    navigator.clipboard.writeText(link);
    toast.success("Form link copied to clipboard");
  };

  const openPreview = (form: DigitalCallSheetFormData) => {
    setPreviewForm(form);
    setPreviewResponses({});
    setActiveView("preview");
  };

  const handlePreviewInputChange = (questionId: string, value: string | string[] | boolean) => {
    setPreviewResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const submitPreviewResponse = () => {
    if (!previewForm) return;
    
    // Validate required fields
    const missingRequired = previewForm.questions.filter(
      (q) => q.required && !previewResponses[q.id]
    );
    
    if (missingRequired.length > 0) {
      toast.error(`Please fill in all required fields: ${missingRequired.map(q => q.label).join(", ")}`);
      return;
    }

    const response: FormResponse = {
      id: `response-${Date.now()}`,
      formId: previewForm.id,
      respondentName: (previewResponses[previewForm.questions.find(q => q.label.toLowerCase().includes("name"))?.id || ""] as string) || "Anonymous",
      respondentEmail: (previewResponses[previewForm.questions.find(q => q.label.toLowerCase().includes("email"))?.id || ""] as string) || "",
      answers: previewResponses,
      submittedAt: new Date().toISOString(),
    };
    
    onAddResponse(response);
    toast.success("Response submitted successfully!");
    setActiveView("forms");
    setPreviewForm(null);
  };

  const getFormResponses = (formId: string) => {
    return responses.filter((r) => r.formId === formId);
  };

  const renderFormsList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Digital Call Sheet Forms</h2>
          <p className="text-muted-foreground">Create and manage form-based call sheets for crew</p>
        </div>
        <Button onClick={createNewForm} className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Form
        </Button>
      </div>

      {forms.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No forms yet</h3>
          <p className="text-muted-foreground mb-4">Create your first digital call sheet form to get started</p>
          <Button onClick={createNewForm} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Form
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {forms.map((form) => {
            const formResponses = getFormResponses(form.id);
            return (
              <Card key={form.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{form.title}</h3>
                      <Badge variant="secondary">{form.questions.length} questions</Badge>
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {formResponses.length} responses
                      </Badge>
                    </div>
                    {form.description && (
                      <p className="text-sm text-muted-foreground mb-2">{form.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(form.createdAt).toLocaleDateString()}
                      {form.shootDate && ` • Shoot Date: ${form.shootDate}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyFormLink(form.id)}
                      className="gap-1"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPreview(form)}
                      className="gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingForm(form);
                        setActiveView("builder");
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteForm(form.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderFormBuilder = () => {
    if (!editingForm) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => {
                setActiveView("forms");
                setEditingForm(null);
              }}
              className="mb-2"
            >
              ← Back to Forms
            </Button>
            <h2 className="text-2xl font-bold text-foreground">Form Builder</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => openPreview(editingForm)} className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button onClick={saveForm} className="gap-2">
              <Send className="h-4 w-4" />
              Save Form
            </Button>
          </div>
        </div>

        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Form Title</Label>
              <Input
                value={editingForm.title}
                onChange={(e) => setEditingForm({ ...editingForm, title: e.target.value })}
                placeholder="e.g., Day 1 Call Sheet"
              />
            </div>
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input
                value={editingForm.projectName}
                onChange={(e) => setEditingForm({ ...editingForm, projectName: e.target.value })}
                placeholder="e.g., Commercial Shoot"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Shoot Date</Label>
              <Input
                type="date"
                value={editingForm.shootDate}
                onChange={(e) => setEditingForm({ ...editingForm, shootDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={editingForm.description}
                onChange={(e) => setEditingForm({ ...editingForm, description: e.target.value })}
                placeholder="Brief description of the shoot"
              />
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Questions</h3>
            <Button onClick={addQuestion} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Question
            </Button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={editingForm.questions.map((q) => q.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {editingForm.questions.map((question) => (
                  <SortableQuestion
                    key={question.id}
                    question={question}
                    onUpdate={updateQuestion}
                    onDelete={deleteQuestion}
                    onAddOption={addOption}
                    onUpdateOption={updateOption}
                    onDeleteOption={deleteOption}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    if (!previewForm) return null;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => {
            setActiveView(editingForm ? "builder" : "forms");
            setPreviewForm(null);
          }}
          className="mb-2"
        >
          ← Back
        </Button>

        <Card className="p-8 space-y-6">
          <div className="text-center border-b border-border pb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">{previewForm.title}</h1>
            {previewForm.projectName && (
              <p className="text-lg text-muted-foreground">{previewForm.projectName}</p>
            )}
            {previewForm.shootDate && (
              <p className="text-sm text-muted-foreground mt-1">
                Shoot Date: {new Date(previewForm.shootDate).toLocaleDateString()}
              </p>
            )}
            {previewForm.description && (
              <p className="text-muted-foreground mt-2">{previewForm.description}</p>
            )}
          </div>

          <div className="space-y-6">
            {previewForm.questions.map((question) => (
              <div key={question.id} className="space-y-2">
                <Label className="flex items-center gap-1">
                  {question.label}
                  {question.required && <span className="text-destructive">*</span>}
                </Label>

                {question.type === "text" && (
                  <Input
                    placeholder={question.placeholder}
                    value={(previewResponses[question.id] as string) || ""}
                    onChange={(e) => handlePreviewInputChange(question.id, e.target.value)}
                  />
                )}

                {question.type === "textarea" && (
                  <Textarea
                    placeholder={question.placeholder}
                    value={(previewResponses[question.id] as string) || ""}
                    onChange={(e) => handlePreviewInputChange(question.id, e.target.value)}
                    rows={4}
                  />
                )}

                {question.type === "number" && (
                  <Input
                    type="number"
                    placeholder={question.placeholder}
                    value={(previewResponses[question.id] as string) || ""}
                    onChange={(e) => handlePreviewInputChange(question.id, e.target.value)}
                  />
                )}

                {question.type === "date" && (
                  <Input
                    type="date"
                    value={(previewResponses[question.id] as string) || ""}
                    onChange={(e) => handlePreviewInputChange(question.id, e.target.value)}
                  />
                )}

                {question.type === "time" && (
                  <Input
                    type="time"
                    value={(previewResponses[question.id] as string) || ""}
                    onChange={(e) => handlePreviewInputChange(question.id, e.target.value)}
                  />
                )}

                {question.type === "checkbox" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(previewResponses[question.id] as boolean) || false}
                      onChange={(e) => handlePreviewInputChange(question.id, e.target.checked)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm text-muted-foreground">{question.placeholder || "Yes"}</span>
                  </div>
                )}

                {question.type === "select" && (
                  <Select
                    value={(previewResponses[question.id] as string) || ""}
                    onValueChange={(value) => handlePreviewInputChange(question.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={question.placeholder || "Select an option"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(question.options || []).map((option, idx) => (
                        <SelectItem key={idx} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {question.type === "multiselect" && (
                  <div className="space-y-2">
                    {(question.options || []).map((option, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={((previewResponses[question.id] as string[]) || []).includes(option)}
                          onChange={(e) => {
                            const current = (previewResponses[question.id] as string[]) || [];
                            if (e.target.checked) {
                              handlePreviewInputChange(question.id, [...current, option]);
                            } else {
                              handlePreviewInputChange(question.id, current.filter((o) => o !== option));
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{option}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button onClick={submitPreviewResponse} className="w-full gap-2">
            <Send className="h-4 w-4" />
            Submit Response
          </Button>
        </Card>
      </div>
    );
  };

  return (
    <div>
      {activeView === "forms" && renderFormsList()}
      {activeView === "builder" && renderFormBuilder()}
      {activeView === "preview" && renderPreview()}
    </div>
  );
};

import { useState } from "react";
import { 
  Plus, Trash2, GripVertical, Copy, Eye, Send, FileText, CheckCircle, 
  Clock, MapPin, Cloud, Sun, Sunset, Users, Camera, Calendar,
  Phone, Mail, Building, User, ChevronDown, ChevronUp, Download, Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import jsPDF from "jspdf";
import { CustomSection } from "./form-builder/types";
import { FieldRenderer } from "./form-builder/FieldRenderer";
import { CallSheetSectionBuilder } from "./CallSheetSectionBuilder";

// Types for the professional call sheet
export interface CrewCall {
  id: string;
  name: string;
  role: string;
  department: string;
  callTime: string;
  phone: string;
  email: string;
  confirmed: boolean;
}

export interface CastMember {
  id: string;
  name: string;
  character: string;
  pickupTime: string;
  arrivalTime: string;
  makeupTime: string;
  onSetTime: string;
  notes: string;
  confirmed: boolean;
}

export interface ScheduleItem {
  id: string;
  time: string;
  scene: string;
  description: string;
  location: string;
  pages: string;
}

export interface LocationInfo {
  id: string;
  name: string;
  address: string;
  parkingInfo: string;
  notes: string;
}

export interface DigitalCallSheetFormData {
  id: string;
  // Production Info
  productionName: string;
  productionCompany: string;
  shootDate: string;
  shootDay: string;
  director: string;
  producer: string;
  // General Call
  generalCallTime: string;
  crewCallTime: string;
  shootingCallTime: string;
  estimatedWrap: string;
  // Weather
  weather: string;
  temperature: string;
  sunrise: string;
  sunset: string;
  // Locations
  locations: LocationInfo[];
  // Schedule
  schedule: ScheduleItem[];
  // Crew
  crewCalls: CrewCall[];
  // Cast
  castMembers: CastMember[];
  // Notes
  specialInstructions: string;
  safetyNotes: string;
  // Meta
  createdAt: string;
  status: "draft" | "published";
}

export interface FormResponse {
  id: string;
  formId: string;
  respondentName: string;
  respondentEmail: string;
  answers: Record<string, string | string[] | boolean>;
  submittedAt: string;
}

const DEPARTMENTS = [
  "Production", "Direction", "Camera", "Lighting", "Grip", "Sound", 
  "Art Department", "Wardrobe", "Hair & Makeup", "Props", "VFX", 
  "Locations", "Transportation", "Catering", "Post Production", "Other"
];

// Sortable Crew Row Component
const SortableCrewRow = ({ 
  crew, 
  onUpdate, 
  onDelete 
}: { 
  crew: CrewCall; 
  onUpdate: (id: string, field: keyof CrewCall, value: any) => void;
  onDelete: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: crew.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="grid grid-cols-12 gap-2 items-center p-2 bg-muted/30 rounded-lg">
      <button {...attributes} {...listeners} className="col-span-1 cursor-grab">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <Input
        value={crew.name}
        onChange={(e) => onUpdate(crew.id, "name", e.target.value)}
        placeholder="Name"
        className="col-span-2 h-8 text-sm"
      />
      <Input
        value={crew.role}
        onChange={(e) => onUpdate(crew.id, "role", e.target.value)}
        placeholder="Role"
        className="col-span-2 h-8 text-sm"
      />
      <Select value={crew.department} onValueChange={(v) => onUpdate(crew.id, "department", v)}>
        <SelectTrigger className="col-span-2 h-8 text-sm">
          <SelectValue placeholder="Dept" />
        </SelectTrigger>
        <SelectContent>
          {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
        </SelectContent>
      </Select>
      <Input
        type="time"
        value={crew.callTime}
        onChange={(e) => onUpdate(crew.id, "callTime", e.target.value)}
        className="col-span-1 h-8 text-sm"
      />
      <Input
        value={crew.phone}
        onChange={(e) => onUpdate(crew.id, "phone", e.target.value)}
        placeholder="Phone"
        className="col-span-2 h-8 text-sm"
      />
      <div className="col-span-1 flex items-center gap-1">
        {crew.confirmed ? (
          <Badge variant="default" className="text-xs bg-green-600">✓</Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">Pending</Badge>
        )}
      </div>
      <Button variant="ghost" size="icon" onClick={() => onDelete(crew.id)} className="col-span-1 h-8 w-8">
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
};

// Sortable Schedule Row
const SortableScheduleRow = ({ 
  item, 
  onUpdate, 
  onDelete 
}: { 
  item: ScheduleItem; 
  onUpdate: (id: string, field: keyof ScheduleItem, value: string) => void;
  onDelete: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="grid grid-cols-12 gap-2 items-center p-2 bg-muted/30 rounded-lg">
      <button {...attributes} {...listeners} className="col-span-1 cursor-grab">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <Input
        type="time"
        value={item.time}
        onChange={(e) => onUpdate(item.id, "time", e.target.value)}
        className="col-span-1 h-8 text-sm"
      />
      <Input
        value={item.scene}
        onChange={(e) => onUpdate(item.id, "scene", e.target.value)}
        placeholder="Scene #"
        className="col-span-2 h-8 text-sm"
      />
      <Input
        value={item.description}
        onChange={(e) => onUpdate(item.id, "description", e.target.value)}
        placeholder="Description"
        className="col-span-4 h-8 text-sm"
      />
      <Input
        value={item.location}
        onChange={(e) => onUpdate(item.id, "location", e.target.value)}
        placeholder="Location"
        className="col-span-2 h-8 text-sm"
      />
      <Input
        value={item.pages}
        onChange={(e) => onUpdate(item.id, "pages", e.target.value)}
        placeholder="Pages"
        className="col-span-1 h-8 text-sm"
      />
      <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} className="col-span-1 h-8 w-8">
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
};

interface DigitalCallSheetFormProps {
  forms: DigitalCallSheetFormData[];
  responses: FormResponse[];
  onSaveForm: (form: DigitalCallSheetFormData) => void;
  onDeleteForm: (formId: string) => void;
  onAddResponse: (response: FormResponse) => void;
  customSections?: CustomSection[];
  onCustomSectionsChange?: (sections: CustomSection[]) => void;
}

export const DigitalCallSheetForm = ({
  forms,
  responses,
  onSaveForm,
  onDeleteForm,
  customSections = [],
  onCustomSectionsChange,
}: DigitalCallSheetFormProps) => {
  const [activeView, setActiveView] = useState<"list" | "builder" | "preview">("list");
  const [editingForm, setEditingForm] = useState<DigitalCallSheetFormData | null>(null);
  const [showSectionBuilder, setShowSectionBuilder] = useState(false);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    production: true,
    weather: true,
    locations: true,
    schedule: true,
    crew: true,
    cast: true,
    notes: true,
    customSections: true
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const createNewCallSheet = () => {
    const newForm: DigitalCallSheetFormData = {
      id: `callsheet-${Date.now()}`,
      productionName: "",
      productionCompany: "",
      shootDate: new Date().toISOString().split("T")[0],
      shootDay: "1",
      director: "",
      producer: "",
      generalCallTime: "06:00",
      crewCallTime: "06:00",
      shootingCallTime: "07:00",
      estimatedWrap: "19:00",
      weather: "",
      temperature: "",
      sunrise: "",
      sunset: "",
      locations: [],
      schedule: [],
      crewCalls: [],
      castMembers: [],
      specialInstructions: "",
      safetyNotes: "",
      createdAt: new Date().toISOString(),
      status: "draft"
    };
    setEditingForm(newForm);
    setActiveView("builder");
  };

  const updateFormField = (field: keyof DigitalCallSheetFormData, value: any) => {
    if (!editingForm) return;
    setEditingForm({ ...editingForm, [field]: value });
  };

  // Location handlers
  const addLocation = () => {
    if (!editingForm) return;
    const newLocation: LocationInfo = {
      id: `loc-${Date.now()}`,
      name: "",
      address: "",
      parkingInfo: "",
      notes: ""
    };
    setEditingForm({ ...editingForm, locations: [...editingForm.locations, newLocation] });
  };

  const updateLocation = (id: string, field: keyof LocationInfo, value: string) => {
    if (!editingForm) return;
    setEditingForm({
      ...editingForm,
      locations: editingForm.locations.map(l => l.id === id ? { ...l, [field]: value } : l)
    });
  };

  const deleteLocation = (id: string) => {
    if (!editingForm) return;
    setEditingForm({ ...editingForm, locations: editingForm.locations.filter(l => l.id !== id) });
  };

  // Schedule handlers
  const addScheduleItem = () => {
    if (!editingForm) return;
    const newItem: ScheduleItem = {
      id: `sched-${Date.now()}`,
      time: "",
      scene: "",
      description: "",
      location: "",
      pages: ""
    };
    setEditingForm({ ...editingForm, schedule: [...editingForm.schedule, newItem] });
  };

  const updateScheduleItem = (id: string, field: keyof ScheduleItem, value: string) => {
    if (!editingForm) return;
    setEditingForm({
      ...editingForm,
      schedule: editingForm.schedule.map(s => s.id === id ? { ...s, [field]: value } : s)
    });
  };

  const deleteScheduleItem = (id: string) => {
    if (!editingForm) return;
    setEditingForm({ ...editingForm, schedule: editingForm.schedule.filter(s => s.id !== id) });
  };

  // Crew handlers
  const addCrewMember = () => {
    if (!editingForm) return;
    const newCrew: CrewCall = {
      id: `crew-${Date.now()}`,
      name: "",
      role: "",
      department: "Production",
      callTime: editingForm.crewCallTime,
      phone: "",
      email: "",
      confirmed: false
    };
    setEditingForm({ ...editingForm, crewCalls: [...editingForm.crewCalls, newCrew] });
  };

  const updateCrewMember = (id: string, field: keyof CrewCall, value: any) => {
    if (!editingForm) return;
    setEditingForm({
      ...editingForm,
      crewCalls: editingForm.crewCalls.map(c => c.id === id ? { ...c, [field]: value } : c)
    });
  };

  const deleteCrewMember = (id: string) => {
    if (!editingForm) return;
    setEditingForm({ ...editingForm, crewCalls: editingForm.crewCalls.filter(c => c.id !== id) });
  };

  // Cast handlers
  const addCastMember = () => {
    if (!editingForm) return;
    const newCast: CastMember = {
      id: `cast-${Date.now()}`,
      name: "",
      character: "",
      pickupTime: "",
      arrivalTime: "",
      makeupTime: "",
      onSetTime: "",
      notes: "",
      confirmed: false
    };
    setEditingForm({ ...editingForm, castMembers: [...editingForm.castMembers, newCast] });
  };

  const updateCastMember = (id: string, field: keyof CastMember, value: any) => {
    if (!editingForm) return;
    setEditingForm({
      ...editingForm,
      castMembers: editingForm.castMembers.map(c => c.id === id ? { ...c, [field]: value } : c)
    });
  };

  const deleteCastMember = (id: string) => {
    if (!editingForm) return;
    setEditingForm({ ...editingForm, castMembers: editingForm.castMembers.filter(c => c.id !== id) });
  };

  const handleScheduleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!editingForm || !over || active.id === over.id) return;
    const oldIndex = editingForm.schedule.findIndex(s => s.id === active.id);
    const newIndex = editingForm.schedule.findIndex(s => s.id === over.id);
    setEditingForm({ ...editingForm, schedule: arrayMove(editingForm.schedule, oldIndex, newIndex) });
  };

  const handleCrewDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!editingForm || !over || active.id === over.id) return;
    const oldIndex = editingForm.crewCalls.findIndex(c => c.id === active.id);
    const newIndex = editingForm.crewCalls.findIndex(c => c.id === over.id);
    setEditingForm({ ...editingForm, crewCalls: arrayMove(editingForm.crewCalls, oldIndex, newIndex) });
  };

  // Custom field value handler
  const updateCustomFieldValue = (fieldId: string, value: any) => {
    setCustomFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const saveCallSheet = () => {
    if (!editingForm) return;
    if (!editingForm.productionName.trim()) {
      toast.error("Please enter a production name");
      return;
    }
    onSaveForm(editingForm);
    toast.success("Call sheet saved!");
    setActiveView("list");
    setEditingForm(null);
  };

  const copyShareLink = (formId: string) => {
    const link = `${window.location.origin}/callsheet/${formId}`;
    navigator.clipboard.writeText(link);
    toast.success("Share link copied!");
  };

  const exportToPDF = (form: DigitalCallSheetFormData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 15;

    const checkPageBreak = (needed: number) => {
      if (y + needed > 280) { doc.addPage(); y = 15; }
    };

    // Header
    doc.setFillColor(20, 40, 80);
    doc.rect(0, 0, pageWidth, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("CALL SHEET", pageWidth / 2, 18, { align: "center" });
    doc.setFontSize(14);
    doc.text(form.productionName || "Untitled Production", pageWidth / 2, 28, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Day ${form.shootDay} • ${form.shootDate}`, pageWidth / 2, 36, { align: "center" });
    y = 50;

    doc.setTextColor(0, 0, 0);

    // General Call Info
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, pageWidth - 2 * margin, 20, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("CALL TIMES", margin + 5, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`General Call: ${form.generalCallTime}`, margin + 5, y + 15);
    doc.text(`Shooting Call: ${form.shootingCallTime}`, margin + 60, y + 15);
    doc.text(`Est. Wrap: ${form.estimatedWrap}`, margin + 115, y + 15);
    y += 28;

    // Weather & Sun
    if (form.weather || form.sunrise || form.sunset) {
      checkPageBreak(20);
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y, pageWidth - 2 * margin, 15, "F");
      doc.setFontSize(9);
      const weatherInfo = [
        form.weather && `Weather: ${form.weather}`,
        form.temperature && `${form.temperature}`,
        form.sunrise && `Sunrise: ${form.sunrise}`,
        form.sunset && `Sunset: ${form.sunset}`
      ].filter(Boolean).join(" | ");
      doc.text(weatherInfo, margin + 5, y + 10);
      y += 22;
    }

    // Locations
    if (form.locations.length > 0) {
      checkPageBreak(30);
      doc.setFillColor(20, 40, 80);
      doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("LOCATIONS", margin + 5, y + 6);
      doc.setTextColor(0, 0, 0);
      y += 12;

      form.locations.forEach(loc => {
        checkPageBreak(20);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(loc.name || "Location", margin + 5, y + 5);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        if (loc.address) doc.text(loc.address, margin + 5, y + 11);
        if (loc.parkingInfo) doc.text(`Parking: ${loc.parkingInfo}`, margin + 5, y + 17);
        y += loc.parkingInfo ? 22 : 15;
      });
      y += 5;
    }

    // Schedule
    if (form.schedule.length > 0) {
      checkPageBreak(30);
      doc.setFillColor(20, 40, 80);
      doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("SHOOTING SCHEDULE", margin + 5, y + 6);
      doc.setTextColor(0, 0, 0);
      y += 12;

      form.schedule.forEach(item => {
        checkPageBreak(12);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(item.time || "--:--", margin + 5, y + 5);
        doc.text(item.scene || "", margin + 25, y + 5);
        doc.setFont("helvetica", "normal");
        doc.text(item.description || "", margin + 50, y + 5);
        y += 8;
      });
      y += 5;
    }

    // Crew
    if (form.crewCalls.length > 0) {
      checkPageBreak(30);
      doc.setFillColor(20, 40, 80);
      doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("CREW CALL", margin + 5, y + 6);
      doc.setTextColor(0, 0, 0);
      y += 12;

      // Group by department
      const byDept: Record<string, CrewCall[]> = {};
      form.crewCalls.forEach(c => {
        const d = c.department || "Other";
        if (!byDept[d]) byDept[d] = [];
        byDept[d].push(c);
      });

      Object.entries(byDept).forEach(([dept, members]) => {
        checkPageBreak(15);
        doc.setFillColor(235, 235, 235);
        doc.rect(margin, y, pageWidth - 2 * margin, 6, "F");
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(dept.toUpperCase(), margin + 5, y + 4);
        y += 8;

        members.forEach(m => {
          checkPageBreak(8);
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.text(`${m.callTime} - ${m.name} (${m.role})`, margin + 10, y + 4);
          if (m.phone) doc.text(m.phone, pageWidth - margin - 40, y + 4);
          y += 6;
        });
        y += 3;
      });
    }

    // Cast
    if (form.castMembers.length > 0) {
      checkPageBreak(30);
      doc.setFillColor(20, 40, 80);
      doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("CAST", margin + 5, y + 6);
      doc.setTextColor(0, 0, 0);
      y += 12;

      form.castMembers.forEach(cast => {
        checkPageBreak(15);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`${cast.name} as ${cast.character}`, margin + 5, y + 5);
        doc.setFont("helvetica", "normal");
        const times = [
          cast.pickupTime && `P/U: ${cast.pickupTime}`,
          cast.makeupTime && `M/U: ${cast.makeupTime}`,
          cast.onSetTime && `On Set: ${cast.onSetTime}`
        ].filter(Boolean).join(" | ");
        doc.text(times, margin + 5, y + 11);
        y += 15;
      });
    }

    // Notes
    if (form.specialInstructions || form.safetyNotes) {
      checkPageBreak(30);
      doc.setFillColor(20, 40, 80);
      doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("NOTES", margin + 5, y + 6);
      doc.setTextColor(0, 0, 0);
      y += 12;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      if (form.specialInstructions) {
        const lines = doc.splitTextToSize(form.specialInstructions, pageWidth - 2 * margin - 10);
        doc.text(lines, margin + 5, y + 5);
        y += lines.length * 5 + 5;
      }
      if (form.safetyNotes) {
        doc.setFont("helvetica", "bold");
        doc.text("SAFETY:", margin + 5, y + 5);
        doc.setFont("helvetica", "normal");
        const safetyLines = doc.splitTextToSize(form.safetyNotes, pageWidth - 2 * margin - 30);
        doc.text(safetyLines, margin + 25, y + 5);
      }
    }

    // Custom Sections
    if (customSections.length > 0) {
      customSections.forEach(section => {
        const hasValues = section.fields.some(f => customFieldValues[f.id]);
        if (!hasValues) return;

        checkPageBreak(30);
        doc.setFillColor(20, 40, 80);
        doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`${section.icon || ''} ${section.name}`.trim().toUpperCase(), margin + 5, y + 6);
        doc.setTextColor(0, 0, 0);
        y += 12;

        section.fields.forEach(field => {
          const value = customFieldValues[field.id];
          if (!value) return;

          checkPageBreak(12);
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.text(`${field.label}:`, margin + 5, y + 5);
          doc.setFont("helvetica", "normal");
          const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
          doc.text(displayValue, margin + 40, y + 5);
          y += 8;
        });
        y += 5;
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 290, { align: "center" });
    }

    doc.save(`call-sheet-day${form.shootDay}-${form.shootDate}.pdf`);
    toast.success("PDF downloaded!");
  };

  // Section Header Component
  const SectionHeader = ({ 
    title, 
    icon: Icon, 
    section, 
    onAdd 
  }: { 
    title: string; 
    icon: any; 
    section: string; 
    onAdd?: () => void 
  }) => (
    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 rounded-t-lg transition-colors">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      <div className="flex items-center gap-2">
        {onAdd && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            className="gap-1"
          >
            <Plus className="h-3 w-3" /> Add
          </Button>
        )}
        {expandedSections[section] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </div>
    </CollapsibleTrigger>
  );

  // List View
  const renderListView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Digital Call Sheets</h2>
          <p className="text-muted-foreground">Create professional call sheets for your production</p>
        </div>
        <Button onClick={createNewCallSheet} className="gap-2">
          <Plus className="h-4 w-4" />
          New Call Sheet
        </Button>
      </div>

      {forms.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No call sheets yet</h3>
          <p className="text-muted-foreground mb-4">Create your first professional call sheet</p>
          <Button onClick={createNewCallSheet} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Call Sheet
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {forms.map(form => {
            const confirmedCount = form.crewCalls.filter(c => c.confirmed).length;
            return (
              <Card key={form.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{form.productionName || "Untitled"}</h3>
                      <Badge variant={form.status === "published" ? "default" : "secondary"}>
                        {form.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Day {form.shootDay} • {form.shootDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Call: {form.generalCallTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {form.crewCalls.length} crew
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        {confirmedCount}/{form.crewCalls.length} confirmed
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyShareLink(form.id)} className="gap-1">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportToPDF(form)} className="gap-1">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setEditingForm(form); setActiveView("builder"); }}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDeleteForm(form.id)} className="text-muted-foreground hover:text-destructive">
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

  // Builder View
  const renderBuilderView = () => {
    if (!editingForm) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between sticky top-0 bg-background z-10 pb-4">
          <div>
            <Button variant="ghost" onClick={() => { setActiveView("list"); setEditingForm(null); }} className="mb-2">
              ← Back
            </Button>
            <h2 className="text-2xl font-bold text-foreground">
              {editingForm.productionName || "New Call Sheet"}
            </h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportToPDF(editingForm)} className="gap-2">
              <Download className="h-4 w-4" />
              PDF
            </Button>
            <Button onClick={saveCallSheet} className="gap-2">
              <Send className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>

        {/* Production Info */}
        <Collapsible open={expandedSections.production} onOpenChange={() => toggleSection("production")}>
          <Card>
            <SectionHeader title="Production Info" icon={Camera} section="production" />
            <CollapsibleContent>
              <div className="p-4 pt-0 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <Label>Production Name</Label>
                  <Input value={editingForm.productionName} onChange={e => updateFormField("productionName", e.target.value)} placeholder="Production name" />
                </div>
                <div>
                  <Label>Company</Label>
                  <Input value={editingForm.productionCompany} onChange={e => updateFormField("productionCompany", e.target.value)} placeholder="Company" />
                </div>
                <div>
                  <Label>Shoot Date</Label>
                  <Input type="date" value={editingForm.shootDate} onChange={e => updateFormField("shootDate", e.target.value)} />
                </div>
                <div>
                  <Label>Shoot Day #</Label>
                  <Input value={editingForm.shootDay} onChange={e => updateFormField("shootDay", e.target.value)} placeholder="1" />
                </div>
                <div>
                  <Label>Director</Label>
                  <Input value={editingForm.director} onChange={e => updateFormField("director", e.target.value)} placeholder="Director" />
                </div>
                <div>
                  <Label>Producer</Label>
                  <Input value={editingForm.producer} onChange={e => updateFormField("producer", e.target.value)} placeholder="Producer" />
                </div>
              </div>
              <Separator className="my-2" />
              <div className="p-4 pt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="flex items-center gap-1"><Clock className="h-3 w-3" /> General Call</Label>
                  <Input type="time" value={editingForm.generalCallTime} onChange={e => updateFormField("generalCallTime", e.target.value)} />
                </div>
                <div>
                  <Label>Crew Call</Label>
                  <Input type="time" value={editingForm.crewCallTime} onChange={e => updateFormField("crewCallTime", e.target.value)} />
                </div>
                <div>
                  <Label>Shooting Call</Label>
                  <Input type="time" value={editingForm.shootingCallTime} onChange={e => updateFormField("shootingCallTime", e.target.value)} />
                </div>
                <div>
                  <Label>Est. Wrap</Label>
                  <Input type="time" value={editingForm.estimatedWrap} onChange={e => updateFormField("estimatedWrap", e.target.value)} />
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Weather */}
        <Collapsible open={expandedSections.weather} onOpenChange={() => toggleSection("weather")}>
          <Card>
            <SectionHeader title="Weather & Sun Times" icon={Cloud} section="weather" />
            <CollapsibleContent>
              <div className="p-4 pt-0 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Weather</Label>
                  <Input value={editingForm.weather} onChange={e => updateFormField("weather", e.target.value)} placeholder="Sunny, partly cloudy" />
                </div>
                <div>
                  <Label>Temperature</Label>
                  <Input value={editingForm.temperature} onChange={e => updateFormField("temperature", e.target.value)} placeholder="72°F / 22°C" />
                </div>
                <div>
                  <Label className="flex items-center gap-1"><Sun className="h-3 w-3" /> Sunrise</Label>
                  <Input value={editingForm.sunrise} onChange={e => updateFormField("sunrise", e.target.value)} placeholder="6:30 AM" />
                </div>
                <div>
                  <Label className="flex items-center gap-1"><Sunset className="h-3 w-3" /> Sunset</Label>
                  <Input value={editingForm.sunset} onChange={e => updateFormField("sunset", e.target.value)} placeholder="7:45 PM" />
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Locations */}
        <Collapsible open={expandedSections.locations} onOpenChange={() => toggleSection("locations")}>
          <Card>
            <SectionHeader title="Locations" icon={MapPin} section="locations" onAdd={addLocation} />
            <CollapsibleContent>
              <div className="p-4 pt-0 space-y-3">
                {editingForm.locations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No locations added</p>
                ) : (
                  editingForm.locations.map(loc => (
                    <Card key={loc.id} className="p-3 bg-muted/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input value={loc.name} onChange={e => updateLocation(loc.id, "name", e.target.value)} placeholder="Location name" />
                        <Input value={loc.address} onChange={e => updateLocation(loc.id, "address", e.target.value)} placeholder="Address" />
                        <Input value={loc.parkingInfo} onChange={e => updateLocation(loc.id, "parkingInfo", e.target.value)} placeholder="Parking info" />
                        <div className="flex gap-2">
                          <Input value={loc.notes} onChange={e => updateLocation(loc.id, "notes", e.target.value)} placeholder="Notes" className="flex-1" />
                          <Button variant="ghost" size="icon" onClick={() => deleteLocation(loc.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Schedule */}
        <Collapsible open={expandedSections.schedule} onOpenChange={() => toggleSection("schedule")}>
          <Card>
            <SectionHeader title="Shooting Schedule" icon={Calendar} section="schedule" onAdd={addScheduleItem} />
            <CollapsibleContent>
              <div className="p-4 pt-0 space-y-2">
                {editingForm.schedule.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No schedule items</p>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleScheduleDragEnd}>
                    <SortableContext items={editingForm.schedule.map(s => s.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        <div className="grid grid-cols-12 gap-2 px-2 text-xs text-muted-foreground font-medium">
                          <span className="col-span-1"></span>
                          <span className="col-span-1">Time</span>
                          <span className="col-span-2">Scene</span>
                          <span className="col-span-4">Description</span>
                          <span className="col-span-2">Location</span>
                          <span className="col-span-1">Pages</span>
                          <span className="col-span-1"></span>
                        </div>
                        {editingForm.schedule.map(item => (
                          <SortableScheduleRow key={item.id} item={item} onUpdate={updateScheduleItem} onDelete={deleteScheduleItem} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Crew */}
        <Collapsible open={expandedSections.crew} onOpenChange={() => toggleSection("crew")}>
          <Card>
            <SectionHeader title="Crew Call" icon={Users} section="crew" onAdd={addCrewMember} />
            <CollapsibleContent>
              <div className="p-4 pt-0 space-y-2">
                {editingForm.crewCalls.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No crew members added</p>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCrewDragEnd}>
                    <SortableContext items={editingForm.crewCalls.map(c => c.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        <div className="grid grid-cols-12 gap-2 px-2 text-xs text-muted-foreground font-medium">
                          <span className="col-span-1"></span>
                          <span className="col-span-2">Name</span>
                          <span className="col-span-2">Role</span>
                          <span className="col-span-2">Department</span>
                          <span className="col-span-1">Call</span>
                          <span className="col-span-2">Phone</span>
                          <span className="col-span-1">Status</span>
                          <span className="col-span-1"></span>
                        </div>
                        {editingForm.crewCalls.map(crew => (
                          <SortableCrewRow key={crew.id} crew={crew} onUpdate={updateCrewMember} onDelete={deleteCrewMember} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Cast */}
        <Collapsible open={expandedSections.cast} onOpenChange={() => toggleSection("cast")}>
          <Card>
            <SectionHeader title="Cast" icon={User} section="cast" onAdd={addCastMember} />
            <CollapsibleContent>
              <div className="p-4 pt-0 space-y-3">
                {editingForm.castMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No cast members added</p>
                ) : (
                  editingForm.castMembers.map(cast => (
                    <Card key={cast.id} className="p-3 bg-muted/30">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Input value={cast.name} onChange={e => updateCastMember(cast.id, "name", e.target.value)} placeholder="Actor name" />
                        <Input value={cast.character} onChange={e => updateCastMember(cast.id, "character", e.target.value)} placeholder="Character" />
                        <div>
                          <Label className="text-xs">Pickup</Label>
                          <Input type="time" value={cast.pickupTime} onChange={e => updateCastMember(cast.id, "pickupTime", e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-xs">Makeup</Label>
                          <Input type="time" value={cast.makeupTime} onChange={e => updateCastMember(cast.id, "makeupTime", e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-xs">On Set</Label>
                          <Input type="time" value={cast.onSetTime} onChange={e => updateCastMember(cast.id, "onSetTime", e.target.value)} />
                        </div>
                        <div className="col-span-2 flex gap-2">
                          <Input value={cast.notes} onChange={e => updateCastMember(cast.id, "notes", e.target.value)} placeholder="Notes" className="flex-1" />
                          <Button variant="ghost" size="icon" onClick={() => deleteCastMember(cast.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Notes */}
        <Collapsible open={expandedSections.notes} onOpenChange={() => toggleSection("notes")}>
          <Card>
            <SectionHeader title="Notes & Instructions" icon={FileText} section="notes" />
            <CollapsibleContent>
              <div className="p-4 pt-0 space-y-4">
                <div>
                  <Label>Special Instructions</Label>
                  <Textarea 
                    value={editingForm.specialInstructions} 
                    onChange={e => updateFormField("specialInstructions", e.target.value)} 
                    placeholder="Parking details, catering info, special requirements..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Safety Notes</Label>
                  <Textarea 
                    value={editingForm.safetyNotes} 
                    onChange={e => updateFormField("safetyNotes", e.target.value)} 
                    placeholder="Safety briefing, hazards, emergency contacts..."
                    rows={3}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Custom Sections */}
        {customSections.length > 0 && (
          <Collapsible open={expandedSections.customSections} onOpenChange={() => toggleSection("customSections")}>
            <Card>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 rounded-t-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Settings2 className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Custom Sections</h3>
                  <Badge variant="secondary" className="text-xs">{customSections.length} sections</Badge>
                </div>
                <div className="flex items-center gap-2">
                  {expandedSections.customSections ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-4 pt-0 space-y-6">
                  {customSections.map(section => (
                    <div key={section.id} className="space-y-3">
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        <span>{section.icon}</span>
                        {section.name}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {section.fields.map(field => (
                          <FieldRenderer
                            key={field.id}
                            field={field}
                            value={customFieldValues[field.id]}
                            onChange={(value) => updateCustomFieldValue(field.id, value)}
                          />
                        ))}
                      </div>
                      <Separator />
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Section Builder Toggle */}
        {onCustomSectionsChange && (
          <Card className="p-4">
            <Button 
              variant={showSectionBuilder ? "default" : "outline"} 
              onClick={() => setShowSectionBuilder(!showSectionBuilder)}
              className="gap-2 w-full md:w-auto"
            >
              <Settings2 className="h-4 w-4" />
              {showSectionBuilder ? "Hide Section Builder" : "Customize Sections"}
            </Button>
            
            {showSectionBuilder && (
              <div className="mt-4">
                <CallSheetSectionBuilder
                  customSections={customSections}
                  onSectionsChange={onCustomSectionsChange}
                />
              </div>
            )}
          </Card>
        )}
      </div>
    );
  };

  return (
    <div>
      {activeView === "list" && renderListView()}
      {activeView === "builder" && renderBuilderView()}
    </div>
  );
};

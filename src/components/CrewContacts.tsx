import { Plus, Trash2, Mail, Phone, User, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { CustomField } from "./form-builder/types";
import { FieldRenderer } from "./form-builder/FieldRenderer";
import { CrewFieldBuilder } from "./CrewFieldBuilder";
import { CrewImportExport } from "./CrewImportExport";

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  notes: string;
  customFields?: Record<string, any>;
}

interface CrewContactsProps {
  crew: CrewMember[];
  customFields: CustomField[];
  onAddCrew: () => void;
  onDeleteCrew: (id: string) => void;
  onUpdateCrew: (id: string, field: keyof CrewMember | string, value: any) => void;
  onCustomFieldsChange: (fields: CustomField[]) => void;
  onImportCrew: (crew: CrewMember[]) => void;
}

const departments = [
  "Direction",
  "Production",
  "Camera",
  "Sound",
  "Lighting",
  "Art Department",
  "Wardrobe",
  "Makeup/Hair",
  "Editing",
  "Post Production",
  "Other"
];

export const CrewContacts = ({
  crew,
  customFields,
  onAddCrew,
  onDeleteCrew,
  onUpdateCrew,
  onCustomFieldsChange,
  onImportCrew,
}: CrewContactsProps) => {
  const [showFieldBuilder, setShowFieldBuilder] = useState(false);

  const handleCustomFieldChange = (memberId: string, fieldId: string, value: any) => {
    const member = crew.find(c => c.id === memberId);
    if (!member) return;
    
    const updatedCustomFields = {
      ...(member.customFields || {}),
      [fieldId]: value
    };
    onUpdateCrew(memberId, 'customFields', updatedCustomFields);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Crew Contacts</h2>
          <p className="text-muted-foreground">Manage contact information for all crew members</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowFieldBuilder(!showFieldBuilder)}
            className="gap-2"
          >
            <Settings2 className="h-4 w-4" />
            {showFieldBuilder ? 'Hide' : 'Customize Fields'}
          </Button>
          <Button onClick={onAddCrew} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Crew Member
          </Button>
        </div>
      </div>

      <Collapsible open={showFieldBuilder} onOpenChange={setShowFieldBuilder}>
        <CollapsibleContent className="space-y-4 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CrewFieldBuilder
              customFields={customFields}
              onFieldsChange={onCustomFieldsChange}
            />
            <CrewImportExport
              crew={crew}
              customFields={customFields}
              onImportCrew={onImportCrew}
              onImportFields={onCustomFieldsChange}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {crew.map((member) => (
          <Card key={member.id} className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {member.name || "Unnamed"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {member.role || "No role specified"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteCrew(member.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`crew-name-${member.id}`}>Name</Label>
                    <Input
                      id={`crew-name-${member.id}`}
                      value={member.name}
                      onChange={(e) => onUpdateCrew(member.id, "name", e.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`crew-role-${member.id}`}>Role</Label>
                    <Input
                      id={`crew-role-${member.id}`}
                      value={member.role}
                      onChange={(e) => onUpdateCrew(member.id, "role", e.target.value)}
                      placeholder="e.g., Director, DP"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`crew-dept-${member.id}`}>Department</Label>
                  <Select
                    value={member.department}
                    onValueChange={(value) => onUpdateCrew(member.id, "department", value)}
                  >
                    <SelectTrigger id={`crew-dept-${member.id}`}>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`crew-email-${member.id}`}>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id={`crew-email-${member.id}`}
                      type="email"
                      value={member.email}
                      onChange={(e) => onUpdateCrew(member.id, "email", e.target.value)}
                      placeholder="email@example.com"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`crew-phone-${member.id}`}>Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id={`crew-phone-${member.id}`}
                      type="tel"
                      value={member.phone}
                      onChange={(e) => onUpdateCrew(member.id, "phone", e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`crew-notes-${member.id}`}>Notes</Label>
                  <Input
                    id={`crew-notes-${member.id}`}
                    value={member.notes}
                    onChange={(e) => onUpdateCrew(member.id, "notes", e.target.value)}
                    placeholder="Additional information"
                  />
                </div>

                {/* Custom Fields */}
                {customFields.length > 0 && (
                  <div className="border-t pt-4 mt-4 space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Custom Fields
                    </p>
                    {customFields
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((field) => (
                        <FieldRenderer
                          key={field.id}
                          field={field}
                          value={member.customFields?.[field.id]}
                          onChange={(value) => handleCustomFieldChange(member.id, field.id, value)}
                        />
                      ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}

        {crew.length === 0 && (
          <div className="col-span-2 text-center py-12 border-2 border-dashed rounded-lg">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No crew members added yet</p>
            <Button onClick={onAddCrew} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Crew Member
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

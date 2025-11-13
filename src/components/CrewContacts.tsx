import { Plus, Trash2, Mail, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  notes: string;
}

interface CrewContactsProps {
  crew: CrewMember[];
  onAddCrew: () => void;
  onDeleteCrew: (id: string) => void;
  onUpdateCrew: (id: string, field: keyof CrewMember, value: string) => void;
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
  onAddCrew,
  onDeleteCrew,
  onUpdateCrew,
}: CrewContactsProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Crew Contacts</h2>
          <p className="text-muted-foreground">Manage contact information for all crew members</p>
        </div>
        <Button onClick={onAddCrew} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Crew Member
        </Button>
      </div>

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

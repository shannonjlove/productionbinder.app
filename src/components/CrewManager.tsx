import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Users, Save } from "lucide-react";

interface CrewMember {
  id: string;
  department: string;
  job_title: string;
  name: string;
  email: string | null;
  phone: string | null;
  rate: number | null;
  notes: string | null;
}

interface CrewManagerProps {
  productionId: string;
}

const DEPARTMENTS = [
  "Production",
  "Assistant Directors",
  "Camera",
  "Sound",
  "Electric",
  "Grip",
  "Art Department",
  "Construction",
  "Set Decoration",
  "Property",
  "Wardrobe",
  "Make-up",
  "Hair",
  "Special Effects",
  "Visual Effects",
  "Locations",
  "Transportation",
  "Catering",
  "Craft Service",
  "Production Office",
  "Accounting",
  "Casting",
  "Post Production",
  "Medic",
];

export function CrewManager({ productionId }: CrewManagerProps) {
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDepartment, setFilterDepartment] = useState<string>("all");

  useEffect(() => {
    fetchCrew();
  }, [productionId]);

  const fetchCrew = async () => {
    const { data, error } = await supabase
      .from("crew_members")
      .select("*")
      .eq("production_id", productionId)
      .order("department", { ascending: true });

    if (error) {
      toast.error("Failed to load crew");
      console.error(error);
    } else {
      setCrewMembers(data || []);
    }
    setLoading(false);
  };

  const addCrewMember = async () => {
    const { data, error } = await supabase
      .from("crew_members")
      .insert({
        production_id: productionId,
        department: "Production",
        job_title: "New Position",
        name: ""
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add crew member");
      console.error(error);
    } else {
      setCrewMembers([...crewMembers, data]);
      toast.success("Crew member added");
    }
  };

  const updateCrewMember = (id: string, field: keyof CrewMember, value: string | number | null) => {
    setCrewMembers(crewMembers.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const saveCrewMember = async (crew: CrewMember) => {
    const { error } = await supabase
      .from("crew_members")
      .update({
        department: crew.department,
        job_title: crew.job_title,
        name: crew.name,
        email: crew.email,
        phone: crew.phone,
        rate: crew.rate,
        notes: crew.notes
      })
      .eq("id", crew.id);

    if (error) {
      toast.error("Failed to save");
      console.error(error);
    } else {
      toast.success("Saved");
    }
  };

  const deleteCrewMember = async (id: string) => {
    const { error } = await supabase
      .from("crew_members")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete");
      console.error(error);
    } else {
      setCrewMembers(crewMembers.filter(c => c.id !== id));
      toast.success("Crew member deleted");
    }
  };

  const filteredCrew = filterDepartment === "all" 
    ? crewMembers 
    : crewMembers.filter(c => c.department === filterDepartment);

  const groupedCrew = filteredCrew.reduce((acc, crew) => {
    if (!acc[crew.department]) {
      acc[crew.department] = [];
    }
    acc[crew.department].push(crew);
    return acc;
  }, {} as Record<string, CrewMember[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Crew Members</h3>
          <p className="text-sm text-slate-400">Manage your production's crew</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600 text-white">
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addCrewMember} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Crew
          </Button>
        </div>
      </div>

      {crewMembers.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-slate-600 mb-4" />
            <p className="text-slate-400 mb-4">No crew members yet</p>
            <Button onClick={addCrewMember} variant="outline" className="border-slate-600 text-slate-300">
              <Plus className="w-4 h-4 mr-2" />
              Add First Crew Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedCrew).map(([department, members]) => (
            <div key={department}>
              <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                {department} ({members.length})
              </h4>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {members.map((crew) => (
                  <Card key={crew.id} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Select
                          value={crew.department}
                          onValueChange={(value) => updateCrewMember(crew.id, "department", value)}
                        >
                          <SelectTrigger className="w-32 h-7 text-xs bg-slate-700/50 border-slate-600 text-slate-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {DEPARTMENTS.map(dept => (
                              <SelectItem key={dept} value={dept} className="text-xs">{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => saveCrewMember(crew)}
                            className="text-slate-400 hover:text-green-400 h-7 w-7 p-0"
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteCrewMember(crew.id)}
                            className="text-slate-400 hover:text-red-400 h-7 w-7 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Input
                          value={crew.job_title}
                          onChange={(e) => updateCrewMember(crew.id, "job_title", e.target.value)}
                          className="bg-slate-700/50 border-slate-600 text-white text-sm font-medium"
                          placeholder="Job Title"
                        />
                        <Input
                          value={crew.name}
                          onChange={(e) => updateCrewMember(crew.id, "name", e.target.value)}
                          className="bg-slate-700/50 border-slate-600 text-white text-sm"
                          placeholder="Name"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={crew.email || ""}
                            onChange={(e) => updateCrewMember(crew.id, "email", e.target.value)}
                            className="bg-slate-700/50 border-slate-600 text-white text-xs"
                            placeholder="Email"
                          />
                          <Input
                            value={crew.phone || ""}
                            onChange={(e) => updateCrewMember(crew.id, "phone", e.target.value)}
                            className="bg-slate-700/50 border-slate-600 text-white text-xs"
                            placeholder="Phone"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

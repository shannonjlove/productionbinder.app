import { useState, useMemo } from "react";
import { Grid3X3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DayOutOfDaysProps {
  productionId: string;
}

type StatusCode = "W" | "H" | "T" | "SW" | "SWF" | "WF" | "-";

interface DayStatus {
  date: string;
  status: StatusCode;
}

interface PersonSchedule {
  id: string;
  name: string;
  role: string;
  type: "cast" | "crew";
  department?: string;
  character?: string;
  days: DayStatus[];
  totalWork: number;
}

const STATUS_COLORS: Record<StatusCode, string> = {
  "W": "bg-green-500 text-white",
  "H": "bg-yellow-500 text-black",
  "T": "bg-blue-500 text-white",
  "SW": "bg-green-600 text-white",
  "SWF": "bg-green-700 text-white",
  "WF": "bg-green-400 text-white",
  "-": "bg-muted text-muted-foreground"
};

const STATUS_LABELS: Record<StatusCode, string> = {
  "W": "Work",
  "H": "Hold",
  "T": "Travel",
  "SW": "Start/Work",
  "SWF": "Start/Work/Finish",
  "WF": "Work/Finish",
  "-": "Off"
};

export const DayOutOfDays = ({ productionId }: DayOutOfDaysProps) => {
  const [filterType, setFilterType] = useState<"all" | "cast" | "crew">("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");

  // Fetch shoot days
  const { data: shootDays = [] } = useQuery({
    queryKey: ["shoot-days", productionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shoot_days")
        .select("*")
        .eq("production_id", productionId)
        .order("shoot_date");
      if (error) throw error;
      return data;
    },
  });

  // Fetch call sheets with cast and crew
  const { data: callSheets = [] } = useQuery({
    queryKey: ["call-sheets-dood", productionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_sheets")
        .select(`
          *,
          shoot_days!inner(*),
          call_sheet_cast(*, cast_members(*)),
          call_sheet_crew(*, crew_members(*))
        `)
        .eq("production_id", productionId);
      if (error) throw error;
      return data;
    },
  });

  // Fetch all cast and crew members
  const { data: castMembers = [] } = useQuery({
    queryKey: ["cast-members", productionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cast_members")
        .select("*")
        .eq("production_id", productionId);
      if (error) throw error;
      return data;
    },
  });

  const { data: crewMembers = [] } = useQuery({
    queryKey: ["crew-members", productionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crew_members")
        .select("*")
        .eq("production_id", productionId);
      if (error) throw error;
      return data;
    },
  });

  // Get all unique dates sorted
  const allDates = useMemo(() => {
    return shootDays.map(sd => sd.shoot_date).sort();
  }, [shootDays]);

  // Get all unique departments
  const allDepartments = useMemo(() => {
    const depts = new Set<string>();
    crewMembers.forEach(c => {
      if (c.department) depts.add(c.department);
    });
    return Array.from(depts).sort();
  }, [crewMembers]);

  // Build person schedules
  const personSchedules = useMemo(() => {
    const schedules: PersonSchedule[] = [];

    // Process cast members
    castMembers.forEach(cast => {
      const workDates = callSheets
        .filter(cs => cs.call_sheet_cast?.some((csc: { cast_member_id: string }) => csc.cast_member_id === cast.id))
        .map(cs => cs.shoot_days?.shoot_date)
        .filter(Boolean)
        .sort();

      const days: DayStatus[] = allDates.map(date => {
        if (!workDates.includes(date)) return { date, status: "-" as StatusCode };
        
        const isFirst = workDates[0] === date;
        const isLast = workDates[workDates.length - 1] === date;
        
        let status: StatusCode = "W";
        if (isFirst && isLast) status = "SWF";
        else if (isFirst) status = "SW";
        else if (isLast) status = "WF";
        
        return { date, status };
      });

      schedules.push({
        id: `cast-${cast.id}`,
        name: cast.actor_name || cast.character_name,
        role: cast.character_name,
        type: "cast",
        character: cast.character_name,
        days,
        totalWork: workDates.length,
      });
    });

    // Process crew members
    crewMembers.forEach(crew => {
      const workDates = callSheets
        .filter(cs => cs.call_sheet_crew?.some((csc: { crew_member_id: string }) => csc.crew_member_id === crew.id))
        .map(cs => cs.shoot_days?.shoot_date)
        .filter(Boolean)
        .sort();

      const days: DayStatus[] = allDates.map(date => {
        if (!workDates.includes(date)) return { date, status: "-" as StatusCode };
        
        const isFirst = workDates[0] === date;
        const isLast = workDates[workDates.length - 1] === date;
        
        let status: StatusCode = "W";
        if (isFirst && isLast) status = "SWF";
        else if (isFirst) status = "SW";
        else if (isLast) status = "WF";
        
        return { date, status };
      });

      schedules.push({
        id: `crew-${crew.id}`,
        name: crew.name,
        role: crew.job_title,
        type: "crew",
        department: crew.department,
        days,
        totalWork: workDates.length,
      });
    });

    return schedules;
  }, [castMembers, crewMembers, callSheets, allDates]);

  // Filter schedules
  const filteredSchedules = useMemo(() => {
    return personSchedules.filter(p => {
      if (filterType !== "all" && p.type !== filterType) return false;
      if (filterDepartment !== "all" && p.department !== filterDepartment) return false;
      return true;
    });
  }, [personSchedules, filterType, filterDepartment]);

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
  };

  if (shootDays.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Grid3X3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Shoot Days Yet</h3>
          <p className="text-muted-foreground text-center">
            Create shoot days and call sheets to generate the Day Out of Days report.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend and Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5" />
              Day Out of Days Report
            </CardTitle>
            <div className="flex items-center gap-4">
              <Select value={filterType} onValueChange={(v: "all" | "cast" | "crew") => setFilterType(v)}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="cast">Cast Only</SelectItem>
                  <SelectItem value="crew">Crew Only</SelectItem>
                </SelectContent>
              </Select>
              {filterType !== "cast" && allDepartments.length > 0 && (
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger className="w-40 h-8">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {allDepartments.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            {Object.entries(STATUS_LABELS).map(([code, label]) => (
              <div key={code} className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${STATUS_COLORS[code as StatusCode]}`}>
                  {code}
                </div>
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* DOOD Grid */}
      <Card>
        <ScrollArea className="w-full">
          <div className="min-w-max">
            {/* Header Row */}
            <div className="flex border-b bg-muted/50 sticky top-0">
              <div className="w-48 p-3 font-medium text-sm border-r flex-shrink-0">Name</div>
              <div className="w-32 p-3 font-medium text-sm border-r flex-shrink-0">Role</div>
              <div className="w-24 p-3 font-medium text-sm border-r flex-shrink-0">Type</div>
              {allDates.map(date => (
                <div key={date} className="w-16 p-2 font-medium text-xs text-center border-r flex-shrink-0">
                  <div>{formatDateShort(date)}</div>
                </div>
              ))}
              <div className="w-16 p-3 font-medium text-sm text-center flex-shrink-0">Total</div>
            </div>

            {/* Data Rows */}
            {filteredSchedules.map((person) => (
              <div key={person.id} className="flex border-b hover:bg-muted/30 transition-colors">
                <div className="w-48 p-3 text-sm border-r flex-shrink-0 font-medium truncate">
                  {person.name}
                </div>
                <div className="w-32 p-3 text-sm border-r flex-shrink-0 text-muted-foreground truncate">
                  {person.character || person.role}
                </div>
                <div className="w-24 p-3 text-sm border-r flex-shrink-0">
                  <Badge variant={person.type === "cast" ? "default" : "secondary"} className="text-xs">
                    {person.type}
                  </Badge>
                </div>
                {person.days.map((day, idx) => (
                  <div key={`${person.id}-${day.date}-${idx}`} className="w-16 p-2 border-r flex-shrink-0 flex items-center justify-center">
                    <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${STATUS_COLORS[day.status]}`}>
                      {day.status}
                    </div>
                  </div>
                ))}
                <div className="w-16 p-3 text-sm text-center font-bold flex-shrink-0">
                  {person.totalWork}
                </div>
              </div>
            ))}

            {filteredSchedules.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No cast or crew found matching the current filters.
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{allDates.length}</div>
            <p className="text-sm text-muted-foreground">Shooting Days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {personSchedules.filter(p => p.type === "cast").length}
            </div>
            <p className="text-sm text-muted-foreground">Cast Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {personSchedules.filter(p => p.type === "crew").length}
            </div>
            <p className="text-sm text-muted-foreground">Crew Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {personSchedules.reduce((sum, p) => sum + p.totalWork, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Total Person-Days</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

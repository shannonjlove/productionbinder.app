import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Clapperboard, Send, Eye } from "lucide-react";
import { CallSheetEditor } from "./CallSheetEditor";

interface ShootDay {
  id: string;
  day_number: number;
  shoot_date: string;
  location_name: string | null;
}

interface CallSheet {
  id: string;
  shoot_day_id: string;
  general_crew_call: string | null;
  shooting_call: string | null;
  courtesy_breakfast: string | null;
  lunch_time: string | null;
  script_color: string | null;
  schedule_color: string | null;
  safety_notes: string | null;
  status: string | null;
  published_at: string | null;
}

interface CallSheetManagerProps {
  productionId: string;
}

export function CallSheetManager({ productionId }: CallSheetManagerProps) {
  const [shootDays, setShootDays] = useState<ShootDay[]>([]);
  const [callSheets, setCallSheets] = useState<CallSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShootDay, setSelectedShootDay] = useState<ShootDay | null>(null);
  const [selectedCallSheet, setSelectedCallSheet] = useState<CallSheet | null>(null);

  useEffect(() => {
    fetchData();
  }, [productionId]);

  const fetchData = async () => {
    const [daysRes, sheetsRes] = await Promise.all([
      supabase.from("shoot_days").select("id, day_number, shoot_date, location_name").eq("production_id", productionId).order("day_number"),
      supabase.from("call_sheets").select("*").eq("production_id", productionId)
    ]);

    if (daysRes.error) console.error(daysRes.error);
    if (sheetsRes.error) console.error(sheetsRes.error);

    setShootDays(daysRes.data || []);
    setCallSheets(sheetsRes.data || []);
    setLoading(false);
  };

  const createCallSheet = async (shootDayId: string) => {
    const { data, error } = await supabase
      .from("call_sheets")
      .insert({
        shoot_day_id: shootDayId,
        production_id: productionId,
        status: "draft"
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create call sheet");
      console.error(error);
    } else {
      setCallSheets([...callSheets, data]);
      const day = shootDays.find(d => d.id === shootDayId);
      if (day) {
        setSelectedShootDay(day);
        setSelectedCallSheet(data);
      }
      toast.success("Call sheet created");
    }
  };

  const getCallSheetForDay = (shootDayId: string) => {
    return callSheets.find(cs => cs.shoot_day_id === shootDayId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (selectedCallSheet && selectedShootDay) {
    return (
      <CallSheetEditor
        callSheet={selectedCallSheet}
        shootDay={selectedShootDay}
        productionId={productionId}
        onBack={() => {
          setSelectedCallSheet(null);
          setSelectedShootDay(null);
          fetchData();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Call Sheets</h3>
        <p className="text-sm text-slate-400">Create and manage call sheets for each shoot day</p>
      </div>

      {shootDays.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clapperboard className="w-12 h-12 text-slate-600 mb-4" />
            <p className="text-slate-400 mb-4">No shoot days scheduled yet</p>
            <p className="text-sm text-slate-500">Add shoot days in the Schedule tab first</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shootDays.map((day) => {
            const callSheet = getCallSheetForDay(day.id);
            return (
              <Card key={day.id} className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-500 flex items-center justify-center text-sm font-bold">
                        {day.day_number}
                      </span>
                      Day {day.day_number}
                    </CardTitle>
                    {callSheet && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        callSheet.status === "published" 
                          ? "bg-green-600/20 text-green-400" 
                          : "bg-slate-600/20 text-slate-400"
                      }`}>
                        {callSheet.status}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400 mb-2">{day.shoot_date}</p>
                  {day.location_name && (
                    <p className="text-sm text-slate-500 mb-4">{day.location_name}</p>
                  )}
                  
                  {callSheet ? (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setSelectedShootDay(day);
                          setSelectedCallSheet(callSheet);
                        }}
                        className="flex-1 bg-slate-700 hover:bg-slate-600"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      onClick={() => createCallSheet(day.id)}
                      className="w-full bg-amber-600 hover:bg-amber-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Call Sheet
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

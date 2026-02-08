import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Calendar, Save, MapPin, Sun, CloudRain } from "lucide-react";
import { format } from "date-fns";

interface ShootDay {
  id: string;
  day_number: number;
  shoot_date: string;
  location_name: string | null;
  location_address: string | null;
  nearest_hospital: string | null;
  hospital_address: string | null;
  crew_parking: string | null;
  base_camp: string | null;
  weather_high: string | null;
  weather_low: string | null;
  weather_conditions: string | null;
  sunrise: string | null;
  sunset: string | null;
  notes: string | null;
}

interface ShootDayManagerProps {
  productionId: string;
}

export function ShootDayManager({ productionId }: ShootDayManagerProps) {
  const [shootDays, setShootDays] = useState<ShootDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShootDays();
  }, [productionId]);

  const fetchShootDays = async () => {
    const { data, error } = await supabase
      .from("shoot_days")
      .select("*")
      .eq("production_id", productionId)
      .order("day_number", { ascending: true });

    if (error) {
      toast.error("Failed to load schedule");
      console.error(error);
    } else {
      setShootDays(data || []);
    }
    setLoading(false);
  };

  const addShootDay = async () => {
    const nextNumber = shootDays.length > 0 
      ? Math.max(...shootDays.map(d => d.day_number)) + 1 
      : 1;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + nextNumber);

    const { data, error } = await supabase
      .from("shoot_days")
      .insert({
        production_id: productionId,
        day_number: nextNumber,
        shoot_date: format(tomorrow, "yyyy-MM-dd")
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add shoot day");
      console.error(error);
    } else {
      setShootDays([...shootDays, data]);
      toast.success("Shoot day added");
    }
  };

  const updateShootDay = (id: string, field: keyof ShootDay, value: string | number) => {
    setShootDays(shootDays.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const saveShootDay = async (day: ShootDay) => {
    const { error } = await supabase
      .from("shoot_days")
      .update({
        day_number: day.day_number,
        shoot_date: day.shoot_date,
        location_name: day.location_name,
        location_address: day.location_address,
        nearest_hospital: day.nearest_hospital,
        hospital_address: day.hospital_address,
        crew_parking: day.crew_parking,
        base_camp: day.base_camp,
        weather_high: day.weather_high,
        weather_low: day.weather_low,
        weather_conditions: day.weather_conditions,
        sunrise: day.sunrise,
        sunset: day.sunset,
        notes: day.notes
      })
      .eq("id", day.id);

    if (error) {
      toast.error("Failed to save");
      console.error(error);
    } else {
      toast.success("Saved");
    }
  };

  const deleteShootDay = async (id: string) => {
    const { error } = await supabase.from("shoot_days").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete");
      console.error(error);
    } else {
      setShootDays(shootDays.filter(d => d.id !== id));
      toast.success("Shoot day deleted");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Shoot Schedule</h3>
          <p className="text-sm text-slate-400">Plan your shooting days</p>
        </div>
        <Button onClick={addShootDay} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Shoot Day
        </Button>
      </div>

      {shootDays.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-12 h-12 text-slate-600 mb-4" />
            <p className="text-slate-400 mb-4">No shoot days scheduled</p>
            <Button onClick={addShootDay} variant="outline" className="border-slate-600 text-slate-300">
              <Plus className="w-4 h-4 mr-2" />
              Add First Shoot Day
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {shootDays.map((day) => (
            <Card key={day.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-600/20 text-amber-500 flex items-center justify-center font-bold text-lg">
                      {day.day_number}
                    </div>
                    <div>
                      <Input
                        type="date"
                        value={day.shoot_date}
                        onChange={(e) => updateShootDay(day.id, "shoot_date", e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white h-8"
                      />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => saveShootDay(day)} className="text-slate-400 hover:text-green-400">
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteShootDay(day.id)} className="text-slate-400 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Location */}
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Location
                    </Label>
                    <Input
                      value={day.location_name || ""}
                      onChange={(e) => updateShootDay(day.id, "location_name", e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white text-sm"
                      placeholder="Location name"
                    />
                    <Input
                      value={day.location_address || ""}
                      onChange={(e) => updateShootDay(day.id, "location_address", e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white text-sm"
                      placeholder="Address"
                    />
                  </div>

                  {/* Logistics */}
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500">Logistics</Label>
                    <Input
                      value={day.crew_parking || ""}
                      onChange={(e) => updateShootDay(day.id, "crew_parking", e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white text-sm"
                      placeholder="Crew parking"
                    />
                    <Input
                      value={day.base_camp || ""}
                      onChange={(e) => updateShootDay(day.id, "base_camp", e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white text-sm"
                      placeholder="Base camp"
                    />
                  </div>

                  {/* Weather */}
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500 flex items-center gap-1">
                      <Sun className="w-3 h-3" /> Weather
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={day.weather_high || ""}
                        onChange={(e) => updateShootDay(day.id, "weather_high", e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white text-sm"
                        placeholder="High"
                      />
                      <Input
                        value={day.weather_low || ""}
                        onChange={(e) => updateShootDay(day.id, "weather_low", e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white text-sm"
                        placeholder="Low"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={day.sunrise || ""}
                        onChange={(e) => updateShootDay(day.id, "sunrise", e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white text-sm"
                        placeholder="Sunrise"
                      />
                      <Input
                        value={day.sunset || ""}
                        onChange={(e) => updateShootDay(day.id, "sunset", e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white text-sm"
                        placeholder="Sunset"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <Label className="text-xs text-slate-500">Notes</Label>
                  <Textarea
                    value={day.notes || ""}
                    onChange={(e) => updateShootDay(day.id, "notes", e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white text-sm resize-none mt-1"
                    rows={2}
                    placeholder="Additional notes for this shoot day..."
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

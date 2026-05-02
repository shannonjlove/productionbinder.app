import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Save, Send, Clock, Users, FileText, MapPin, UserCheck, Bell, GripVertical } from "lucide-react";
import { CrewCheckIn } from "@/components/CrewCheckIn";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { NotificationToggle } from "@/components/NotificationBanner";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableRow } from "@/components/SortableRow";
interface ShootDay {
  id: string;
  day_number: number;
  shoot_date: string;
  location_name: string | null;
}

interface CallSheet {
  id: string;
  general_crew_call: string | null;
  shooting_call: string | null;
  courtesy_breakfast: string | null;
  lunch_time: string | null;
  script_color: string | null;
  schedule_color: string | null;
  safety_notes: string | null;
  status: string | null;
}

interface Scene {
  id: string;
  scene_number: string;
  set_name: string | null;
  description: string | null;
  day_night: string | null;
}

interface CastMember {
  id: string;
  cast_id: number;
  character_name: string;
  actor_name: string | null;
}

interface CallSheetScene {
  call_sheet_id: string;
  scene_id: string;
  scene_order: number;
}

interface CallSheetCast {
  id: string;
  call_sheet_id: string;
  cast_member_id: string;
  status: string | null;
  call_time: string | null;
  special_instructions: string | null;
}

interface CallSheetEditorProps {
  callSheet: CallSheet;
  shootDay: ShootDay;
  productionId: string;
  onBack: () => void;
}

export function CallSheetEditor({ callSheet: initialCallSheet, shootDay, productionId, onBack }: CallSheetEditorProps) {
  const [callSheet, setCallSheet] = useState<CallSheet>(initialCallSheet);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [castMembers, setCastMembers] = useState<CastMember[]>([]);
  const [callSheetScenes, setCallSheetScenes] = useState<CallSheetScene[]>([]);
  const [callSheetCast, setCallSheetCast] = useState<CallSheetCast[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const { showLocalNotification, isSubscribed } = usePushNotifications();

  useEffect(() => {
    fetchData();
  }, [callSheet.id, productionId]);

  const fetchData = async () => {
    const [scenesRes, castRes, csScenesRes, csCastRes] = await Promise.all([
      supabase.from("scenes").select("id, scene_number, set_name, description, day_night").eq("production_id", productionId).order("scene_number"),
      supabase.from("cast_members").select("id, cast_id, character_name, actor_name").eq("production_id", productionId).order("cast_id"),
      supabase.from("call_sheet_scenes").select("*").eq("call_sheet_id", callSheet.id),
      supabase.from("call_sheet_cast").select("*").eq("call_sheet_id", callSheet.id)
    ]);

    setScenes(scenesRes.data || []);
    setCastMembers(castRes.data || []);
    setCallSheetScenes(csScenesRes.data || []);
    setCallSheetCast(csCastRes.data || []);
    setLoading(false);
  };

  const updateCallSheet = (field: keyof CallSheet, value: string) => {
    setCallSheet(prev => ({ ...prev, [field]: value }));
  };

  const saveCallSheet = async () => {
    const { error } = await supabase
      .from("call_sheets")
      .update({
        general_crew_call: callSheet.general_crew_call,
        shooting_call: callSheet.shooting_call,
        courtesy_breakfast: callSheet.courtesy_breakfast,
        lunch_time: callSheet.lunch_time,
        script_color: callSheet.script_color,
        schedule_color: callSheet.schedule_color,
        safety_notes: callSheet.safety_notes
      })
      .eq("id", callSheet.id);

    if (error) {
      toast.error("Failed to save");
      console.error(error);
    } else {
      toast.success("Call sheet saved");
    }
  };

  const toggleSceneInCallSheet = async (sceneId: string) => {
    const existing = callSheetScenes.find(cs => cs.scene_id === sceneId);
    
    if (existing) {
      const { error } = await supabase
        .from("call_sheet_scenes")
        .delete()
        .eq("call_sheet_id", callSheet.id)
        .eq("scene_id", sceneId);

      if (!error) {
        setCallSheetScenes(callSheetScenes.filter(cs => cs.scene_id !== sceneId));
      }
    } else {
      const { data, error } = await supabase
        .from("call_sheet_scenes")
        .insert({
          call_sheet_id: callSheet.id,
          scene_id: sceneId,
          scene_order: callSheetScenes.length
        })
        .select()
        .single();

      if (!error && data) {
        setCallSheetScenes([...callSheetScenes, data]);
      }
    }
  };

  const toggleCastInCallSheet = async (castMemberId: string) => {
    const existing = callSheetCast.find(cc => cc.cast_member_id === castMemberId);
    
    if (existing) {
      const { error } = await supabase
        .from("call_sheet_cast")
        .delete()
        .eq("id", existing.id);

      if (!error) {
        setCallSheetCast(callSheetCast.filter(cc => cc.id !== existing.id));
      }
    } else {
      const { data, error } = await supabase
        .from("call_sheet_cast")
        .insert({
          call_sheet_id: callSheet.id,
          cast_member_id: castMemberId
        })
        .select()
        .single();

      if (!error && data) {
        setCallSheetCast([...callSheetCast, data]);
      }
    }
  };

  const updateCastCall = async (castId: string, field: string, value: string) => {
    const existing = callSheetCast.find(cc => cc.cast_member_id === castId);
    if (!existing) return;

    const { error } = await supabase
      .from("call_sheet_cast")
      .update({ [field]: value })
      .eq("id", existing.id);

    if (!error) {
      setCallSheetCast(callSheetCast.map(cc => 
        cc.id === existing.id ? { ...cc, [field]: value } : cc
      ));
    }
  };

  const publishCallSheet = async () => {
    setPublishing(true);
    
    try {
      // Fetch production name for notification
      const { data: production } = await supabase
        .from("productions")
        .select("name")
        .eq("id", productionId)
        .single();

      const { error } = await supabase
        .from("call_sheets")
        .update({
          status: "published",
          published_at: new Date().toISOString()
        })
        .eq("id", callSheet.id);

      if (error) {
        toast.error("Failed to publish");
        console.error(error);
        return;
      }

      setCallSheet(prev => ({ ...prev, status: "published" }));
      toast.success("Call sheet published!");

      // Send push notification
      if (isSubscribed) {
        await showLocalNotification(
          `Call Sheet Published: Day ${shootDay.day_number}`,
          {
            body: `${production?.name || 'Production'} - ${shootDay.shoot_date}\nGeneral Call: ${callSheet.general_crew_call || 'TBD'}`,
            tag: `call-sheet-${callSheet.id}`,
            data: { url: window.location.href, callSheetId: callSheet.id }
          }
        );
      }
    } finally {
      setPublishing(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const orderedSelectedScenes = [...callSheetScenes]
    .sort((a, b) => a.scene_order - b.scene_order)
    .map(cs => scenes.find(s => s.id === cs.scene_id))
    .filter((s): s is Scene => !!s);

  const handleSceneDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedSelectedScenes.findIndex(s => s.id === active.id);
    const newIndex = orderedSelectedScenes.findIndex(s => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(orderedSelectedScenes, oldIndex, newIndex);
    const newCallSheetScenes = reordered.map((scene, idx) => {
      const existing = callSheetScenes.find(cs => cs.scene_id === scene.id)!;
      return { ...existing, scene_order: idx };
    });
    // Keep any entries that don't match (shouldn't happen) at end
    setCallSheetScenes(newCallSheetScenes);

    await Promise.all(
      newCallSheetScenes.map(cs =>
        supabase
          .from("call_sheet_scenes")
          .update({ scene_order: cs.scene_order })
          .eq("call_sheet_id", callSheet.id)
          .eq("scene_id", cs.scene_id)
      )
    );
  };

  const selectedScenes = scenes.filter(s => callSheetScenes.some(cs => cs.scene_id === s.id));
  const selectedCast = castMembers.filter(c => callSheetCast.some(cc => cc.cast_member_id === c.id));

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
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h3 className="text-lg font-semibold text-white">Day {shootDay.day_number} Call Sheet</h3>
            <p className="text-sm text-slate-400">{shootDay.shoot_date}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NotificationToggle />
          <Button onClick={saveCallSheet} className="bg-slate-700 hover:bg-slate-600">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button onClick={publishCallSheet} disabled={publishing} className="bg-amber-600 hover:bg-amber-700">
            {publishing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {publishing ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="details" className="data-[state=active]:bg-slate-700">
            <FileText className="w-4 h-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="checkin" className="data-[state=active]:bg-slate-700">
            <UserCheck className="w-4 h-4 mr-2" />
            Crew Check-In
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Call Times */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Call Times
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400">General Crew Call</Label>
                    <Input
                      type="time"
                      value={callSheet.general_crew_call || ""}
                      onChange={(e) => updateCallSheet("general_crew_call", e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400">Shooting Call</Label>
                    <Input
                      type="time"
                      value={callSheet.shooting_call || ""}
                      onChange={(e) => updateCallSheet("shooting_call", e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400">Courtesy Breakfast</Label>
                    <Input
                      type="time"
                      value={callSheet.courtesy_breakfast || ""}
                      onChange={(e) => updateCallSheet("courtesy_breakfast", e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400">Lunch</Label>
                    <Input
                      type="time"
                      value={callSheet.lunch_time || ""}
                      onChange={(e) => updateCallSheet("lunch_time", e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400">Script Color</Label>
                    <Input
                      value={callSheet.script_color || ""}
                      onChange={(e) => updateCallSheet("script_color", e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white"
                      placeholder="BLUE"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400">Schedule Color</Label>
                    <Input
                      value={callSheet.schedule_color || ""}
                      onChange={(e) => updateCallSheet("schedule_color", e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white"
                      placeholder="PINK"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-400">Safety Notes</Label>
                  <Textarea
                    value={callSheet.safety_notes || ""}
                    onChange={(e) => updateCallSheet("safety_notes", e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white resize-none"
                    rows={2}
                    placeholder="Safety first! No forced calls..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Scenes */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  Scenes ({selectedScenes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                  {scenes.map((scene) => {
                    const isSelected = callSheetScenes.some(cs => cs.scene_id === scene.id);
                    return (
                      <Badge
                        key={scene.id}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer ${
                          isSelected 
                            ? "bg-amber-600 hover:bg-amber-700 text-white" 
                            : "border-slate-600 text-slate-400 hover:bg-slate-700"
                        }`}
                        onClick={() => toggleSceneInCallSheet(scene.id)}
                      >
                        {scene.scene_number}. {scene.set_name || "Untitled"}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cast Call Times */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                Cast ({selectedCast.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {castMembers.map((cast) => {
                  const isSelected = callSheetCast.some(cc => cc.cast_member_id === cast.id);
                  return (
                    <Badge
                      key={cast.id}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer ${
                        isSelected 
                          ? "bg-amber-600 hover:bg-amber-700 text-white" 
                          : "border-slate-600 text-slate-400 hover:bg-slate-700"
                      }`}
                      onClick={() => toggleCastInCallSheet(cast.id)}
                    >
                      {cast.cast_id}. {cast.character_name}
                    </Badge>
                  );
                })}
              </div>

              {selectedCast.length > 0 && (
                <div className="border-t border-slate-700 pt-4">
                  <div className="grid gap-2">
                    {selectedCast.map((cast) => {
                      const castCall = callSheetCast.find(cc => cc.cast_member_id === cast.id);
                      return (
                        <div key={cast.id} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-1">
                            <span className="text-amber-500 font-bold">{cast.cast_id}</span>
                          </div>
                          <div className="col-span-3">
                            <span className="text-white">{cast.character_name}</span>
                            {cast.actor_name && (
                              <span className="text-slate-500 text-sm ml-2">({cast.actor_name})</span>
                            )}
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="time"
                              value={castCall?.call_time || ""}
                              onChange={(e) => updateCastCall(cast.id, "call_time", e.target.value)}
                              className="bg-slate-700/50 border-slate-600 text-white h-8 text-sm"
                              placeholder="Call"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              value={castCall?.status || ""}
                              onChange={(e) => updateCastCall(cast.id, "status", e.target.value)}
                              className="bg-slate-700/50 border-slate-600 text-white h-8 text-sm"
                              placeholder="Status"
                            />
                          </div>
                          <div className="col-span-4">
                            <Input
                              value={castCall?.special_instructions || ""}
                              onChange={(e) => updateCastCall(cast.id, "special_instructions", e.target.value)}
                              className="bg-slate-700/50 border-slate-600 text-white h-8 text-sm"
                              placeholder="Special instructions"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checkin" className="mt-6">
          <CrewCheckIn callSheetId={callSheet.id} productionId={productionId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

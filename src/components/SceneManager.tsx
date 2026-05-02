import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, FileText, Save, Users } from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableRow } from "./SortableRow";

interface Scene {
  id: string;
  scene_number: string;
  set_name: string | null;
  description: string | null;
  page_count: string | null;
  day_night: string | null;
  int_ext: string | null;
  location: string | null;
  props: string | null;
  notes: string | null;
}

interface CastMember {
  id: string;
  cast_id: number;
  character_name: string;
  actor_name: string | null;
}

interface SceneCast {
  scene_id: string;
  cast_member_id: string;
}

interface SceneManagerProps {
  productionId: string;
}

export function SceneManager({ productionId }: SceneManagerProps) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [castMembers, setCastMembers] = useState<CastMember[]>([]);
  const [sceneCast, setSceneCast] = useState<SceneCast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [productionId]);

  const fetchData = async () => {
    const [scenesRes, castRes, sceneCastRes] = await Promise.all([
      supabase.from("scenes").select("*").eq("production_id", productionId).order("scene_number"),
      supabase.from("cast_members").select("id, cast_id, character_name, actor_name").eq("production_id", productionId).order("cast_id"),
      supabase.from("scene_cast").select("scene_id, cast_member_id")
    ]);

    if (scenesRes.error) console.error(scenesRes.error);
    if (castRes.error) console.error(castRes.error);
    if (sceneCastRes.error) console.error(sceneCastRes.error);

    setScenes(scenesRes.data || []);
    setCastMembers(castRes.data || []);
    setSceneCast(sceneCastRes.data || []);
    setLoading(false);
  };

  const addScene = async () => {
    const nextNumber = scenes.length > 0 
      ? String(parseInt(scenes[scenes.length - 1].scene_number) + 1 || scenes.length + 1)
      : "1";

    const { data, error } = await supabase
      .from("scenes")
      .insert({
        production_id: productionId,
        scene_number: nextNumber,
        set_name: "",
        description: ""
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add scene");
      console.error(error);
    } else {
      setScenes([...scenes, data]);
      toast.success("Scene added");
    }
  };

  const updateScene = (id: string, field: keyof Scene, value: string) => {
    setScenes(scenes.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const saveScene = async (scene: Scene) => {
    const { error } = await supabase
      .from("scenes")
      .update({
        scene_number: scene.scene_number,
        set_name: scene.set_name,
        description: scene.description,
        page_count: scene.page_count,
        day_night: scene.day_night,
        int_ext: scene.int_ext,
        location: scene.location,
        props: scene.props,
        notes: scene.notes
      })
      .eq("id", scene.id);

    if (error) {
      toast.error("Failed to save");
      console.error(error);
    } else {
      toast.success("Saved");
    }
  };

  const deleteScene = async (id: string) => {
    const { error } = await supabase.from("scenes").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete");
      console.error(error);
    } else {
      setScenes(scenes.filter(s => s.id !== id));
      toast.success("Scene deleted");
    }
  };

  const toggleCastInScene = async (sceneId: string, castMemberId: string) => {
    const existing = sceneCast.find(sc => sc.scene_id === sceneId && sc.cast_member_id === castMemberId);
    
    if (existing) {
      const { error } = await supabase
        .from("scene_cast")
        .delete()
        .eq("scene_id", sceneId)
        .eq("cast_member_id", castMemberId);

      if (!error) {
        setSceneCast(sceneCast.filter(sc => !(sc.scene_id === sceneId && sc.cast_member_id === castMemberId)));
      }
    } else {
      const { error } = await supabase
        .from("scene_cast")
        .insert({ scene_id: sceneId, cast_member_id: castMemberId });

      if (!error) {
        setSceneCast([...sceneCast, { scene_id: sceneId, cast_member_id: castMemberId }]);
      }
    }
  };

  const getSceneCast = (sceneId: string) => {
    const castIds = sceneCast.filter(sc => sc.scene_id === sceneId).map(sc => sc.cast_member_id);
    return castMembers.filter(c => castIds.includes(c.id));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = scenes.findIndex((s) => s.id === active.id);
    const newIndex = scenes.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(scenes, oldIndex, newIndex).map((s, idx) => ({
      ...s,
      scene_number: String(idx + 1),
    }));
    setScenes(reordered);

    await Promise.all(
      reordered.map((s) =>
        supabase.from("scenes").update({ scene_number: s.scene_number }).eq("id", s.id)
      )
    );
    toast.success("Scenes reordered");
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
          <h3 className="text-lg font-semibold text-white">Scenes / Breakdown</h3>
          <p className="text-sm text-slate-400">Manage your script breakdown and scenes</p>
        </div>
        <Button onClick={addScene} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Scene
        </Button>
      </div>

      {scenes.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-slate-600 mb-4" />
            <p className="text-slate-400 mb-4">No scenes yet</p>
            <Button onClick={addScene} variant="outline" className="border-slate-600 text-slate-300">
              <Plus className="w-4 h-4 mr-2" />
              Add First Scene
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={scenes.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {scenes.map((scene) => (
                <SortableRow key={scene.id} id={scene.id}>
                  {({ handle }) => (
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="grid gap-4 md:grid-cols-12 items-start">
                          <div className="md:col-span-1 flex items-center gap-1">
                            <span className="pt-6">{handle}</span>
                            <div className="flex-1">
                              <Label className="text-xs text-slate-500">Scene #</Label>
                              <Input
                                value={scene.scene_number}
                                onChange={(e) => updateScene(scene.id, "scene_number", e.target.value)}
                                className="bg-slate-700/50 border-slate-600 text-white text-center font-bold"
                              />
                            </div>
                          </div>
                          <div className="md:col-span-3">
                            <Label className="text-xs text-slate-500">Set Name</Label>
                            <Input
                              value={scene.set_name || ""}
                              onChange={(e) => updateScene(scene.id, "set_name", e.target.value)}
                              className="bg-slate-700/50 border-slate-600 text-white"
                              placeholder="INT. DRUGSTORE"
                            />
                          </div>
                          <div className="md:col-span-1">
                            <Label className="text-xs text-slate-500">I/E</Label>
                            <Select
                              value={scene.int_ext || ""}
                              onValueChange={(value) => updateScene(scene.id, "int_ext", value)}
                            >
                              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                                <SelectValue placeholder="-" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="INT">INT</SelectItem>
                                <SelectItem value="EXT">EXT</SelectItem>
                                <SelectItem value="I/E">I/E</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-1">
                            <Label className="text-xs text-slate-500">D/N</Label>
                            <Select
                              value={scene.day_night || ""}
                              onValueChange={(value) => updateScene(scene.id, "day_night", value)}
                            >
                              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                                <SelectValue placeholder="-" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="D">Day</SelectItem>
                                <SelectItem value="N">Night</SelectItem>
                                <SelectItem value="D/N">D/N</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-1">
                            <Label className="text-xs text-slate-500">Pages</Label>
                            <Input
                              value={scene.page_count || ""}
                              onChange={(e) => updateScene(scene.id, "page_count", e.target.value)}
                              className="bg-slate-700/50 border-slate-600 text-white"
                              placeholder="2 1/8"
                            />
                          </div>
                          <div className="md:col-span-4">
                            <Label className="text-xs text-slate-500">Description</Label>
                            <Input
                              value={scene.description || ""}
                              onChange={(e) => updateScene(scene.id, "description", e.target.value)}
                              className="bg-slate-700/50 border-slate-600 text-white"
                              placeholder="Scene description..."
                            />
                          </div>
                          <div className="md:col-span-1 flex items-end gap-1 pt-5">
                            <Button size="sm" variant="ghost" onClick={() => saveScene(scene)} className="text-slate-400 hover:text-green-400">
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteScene(scene.id)} className="text-slate-400 hover:text-red-400">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Cast in scene */}
                        <div className="mt-4 pt-4 border-t border-slate-700">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-slate-500" />
                            <Label className="text-xs text-slate-500">Cast in Scene</Label>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {castMembers.map((cast) => {
                              const isInScene = sceneCast.some(sc => sc.scene_id === scene.id && sc.cast_member_id === cast.id);
                              return (
                                <Badge
                                  key={cast.id}
                                  variant={isInScene ? "default" : "outline"}
                                  className={`cursor-pointer ${
                                    isInScene
                                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                                      : "border-slate-600 text-slate-400 hover:bg-slate-700"
                                  }`}
                                  onClick={() => toggleCastInScene(scene.id, cast.id)}
                                >
                                  {cast.cast_id}. {cast.character_name}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </SortableRow>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

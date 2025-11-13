import { Plus, Trash2, Radio, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Sequence } from "./FormBuilder";

export interface Cue {
  id: string;
  number: number;
  description: string;
  time: string;
  sceneId: string;
  type: "audio" | "lighting" | "video" | "talent" | "other";
}

interface CueListProps {
  cues: Cue[];
  sequences: Sequence[];
  onAddCue: () => void;
  onDeleteCue: (id: string) => void;
  onUpdateCue: (id: string, field: keyof Cue, value: any) => void;
  onReorderCues: (cues: Cue[]) => void;
}

const SortableCue = ({ cue, sequences, onUpdate, onDelete }: {
  cue: Cue;
  sequences: Sequence[];
  onUpdate: (id: string, field: keyof Cue, value: any) => void;
  onDelete: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: cue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getAllScenes = () => {
    const scenes: { id: string; name: string; sequenceName: string }[] = [];
    sequences.forEach(seq => {
      seq.scenes.forEach(scene => {
        scenes.push({
          id: scene.id,
          name: `${seq.name} → ${scene.name}`,
          sequenceName: seq.name
        });
      });
    });
    return scenes;
  };

  const allScenes = getAllScenes();

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing p-2 hover:bg-muted rounded mt-2"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="p-3 bg-primary/10 rounded-lg">
            <div className="flex items-center gap-2">
              <Radio className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-primary">#{cue.number}</span>
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`cue-number-${cue.id}`}>Cue Number</Label>
                <Input
                  id={`cue-number-${cue.id}`}
                  type="number"
                  value={cue.number}
                  onChange={(e) => onUpdate(cue.id, "number", parseInt(e.target.value) || 0)}
                  placeholder="Auto-numbered"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`cue-time-${cue.id}`}>Time (MM:SS)</Label>
                <Input
                  id={`cue-time-${cue.id}`}
                  value={cue.time}
                  onChange={(e) => onUpdate(cue.id, "time", e.target.value)}
                  placeholder="00:00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`cue-type-${cue.id}`}>Type</Label>
                <Select
                  value={cue.type}
                  onValueChange={(value) => onUpdate(cue.id, "type", value)}
                >
                  <SelectTrigger id={`cue-type-${cue.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="lighting">Lighting</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="talent">Talent</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`cue-scene-${cue.id}`}>Associated Scene</Label>
              <Select
                value={cue.sceneId}
                onValueChange={(value) => onUpdate(cue.id, "sceneId", value)}
              >
                <SelectTrigger id={`cue-scene-${cue.id}`}>
                  <SelectValue placeholder="Select a scene" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {allScenes.map((scene) => (
                    <SelectItem key={scene.id} value={scene.id}>
                      {scene.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`cue-description-${cue.id}`}>Description</Label>
              <Textarea
                id={`cue-description-${cue.id}`}
                value={cue.description}
                onChange={(e) => onUpdate(cue.id, "description", e.target.value)}
                placeholder="Describe what happens at this cue point..."
                className="min-h-[80px]"
              />
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(cue.id)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export const CueList = ({
  cues,
  sequences,
  onAddCue,
  onDeleteCue,
  onUpdateCue,
  onReorderCues,
}: CueListProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = cues.findIndex(c => c.id === active.id);
      const newIndex = cues.findIndex(c => c.id === over.id);
      onReorderCues(arrayMove(cues, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Cue List</h2>
          <p className="text-muted-foreground">Manage production cues with timing and scene allocation</p>
        </div>
        <Button onClick={onAddCue} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Cue
        </Button>
      </div>

      <div className="space-y-4">
        {cues.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={cues.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {cues.map((cue) => (
                <SortableCue
                  key={cue.id}
                  cue={cue}
                  sequences={sequences}
                  onUpdate={onUpdateCue}
                  onDelete={onDeleteCue}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Radio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No cues added yet</p>
            <Button onClick={onAddCue} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Cue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

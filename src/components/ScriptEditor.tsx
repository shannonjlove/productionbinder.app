import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Row {
  id: string;
  segment: string;
  visual: string;
  audio: string;
  notes: string;
  duration: string;
}

interface ScriptEditorProps {
  row: Row;
  onUpdateCell: (id: string, field: keyof Omit<Row, "id">, value: string) => void;
  onBack: () => void;
  getSegmentColor: (segment: string) => string;
  countWords: (text: string) => number;
  calculateDurationFromWords: (count: number) => string;
  useAutoDuration: boolean;
}

export const ScriptEditor = ({ 
  row, 
  onUpdateCell, 
  onBack,
  getSegmentColor,
  countWords,
  calculateDurationFromWords,
  useAutoDuration
}: ScriptEditorProps) => {
  const segmentColor = getSegmentColor(row.segment);
  const wordCount = countWords(row.audio);
  const duration = useAutoDuration ? calculateDurationFromWords(wordCount) : row.duration;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Script Editor</h2>
          <p className="text-muted-foreground">Edit individual cells for this shot</p>
        </div>
      </div>

      <div 
        className="bg-card rounded-lg shadow-lg border-l-4 p-6 space-y-6"
        style={{ 
          backgroundColor: segmentColor,
          borderLeftColor: segmentColor !== "transparent" ? segmentColor.replace("95%", "60%") : "hsl(var(--border))"
        }}
      >
        {/* Segment/Scene */}
        <div className="space-y-2">
          <Label htmlFor="segment" className="text-base font-semibold">Segment/Scene</Label>
          <Input
            id="segment"
            value={row.segment}
            onChange={(e) => onUpdateCell(row.id, "segment", e.target.value)}
            placeholder="Enter segment or scene name"
            className="text-lg"
          />
        </div>

        {/* Visual */}
        <div className="space-y-2">
          <Label htmlFor="visual" className="text-base font-semibold">Visual Description</Label>
          <Textarea
            id="visual"
            value={row.visual}
            onChange={(e) => onUpdateCell(row.id, "visual", e.target.value)}
            placeholder="Describe what viewers will see..."
            className="min-h-[120px]"
          />
        </div>

        {/* Audio */}
        <div className="space-y-2">
          <Label htmlFor="audio" className="text-base font-semibold">Audio/Narration</Label>
          <Textarea
            id="audio"
            value={row.audio}
            onChange={(e) => onUpdateCell(row.id, "audio", e.target.value)}
            placeholder="Describe audio, narration, music..."
            className="min-h-[120px]"
          />
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Word count: <span className="font-mono font-semibold">{wordCount}</span></span>
            <span>Duration: <span className="font-mono font-semibold">{duration}</span></span>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-base font-semibold">Production Notes</Label>
          <Textarea
            id="notes"
            value={row.notes}
            onChange={(e) => onUpdateCell(row.id, "notes", e.target.value)}
            placeholder="Additional notes, references, instructions..."
            className="min-h-[120px]"
          />
        </div>

        {/* Duration (Manual Override) */}
        {!useAutoDuration && (
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-base font-semibold">Duration (MM:SS)</Label>
            <Input
              id="duration"
              value={row.duration}
              onChange={(e) => onUpdateCell(row.id, "duration", e.target.value)}
              placeholder="00:30"
              className="font-mono"
            />
          </div>
        )}
      </div>
    </div>
  );
};

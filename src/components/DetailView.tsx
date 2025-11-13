import { ArrowLeft, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Row {
  id: string;
  segment: string;
  visual: string;
  audio: string;
  notes: string;
  duration: string;
}

interface DetailData {
  size: string;
  extra: string;
  aov: string;
  angle: string;
  movement: string;
  frame: string;
  focalLength: string;
  setup: string;
  camera: string;
  equipment: string;
  technicalNotes: string;
}

interface DetailViewProps {
  row: Row;
  details: DetailData;
  onUpdateDetail: (id: string, field: keyof DetailData, value: string) => void;
  onBack: () => void;
  getSegmentColor: (segment: string) => string;
}

const SHOT_SIZES = ["EXTREME CLOSE-UP", "CLOSE-UP", "MEDIUM CLOSE-UP", "MEDIUM SHOT", "MEDIUM WIDE", "WIDE SHOT", "EXTREME WIDE"];
const AOV_OPTIONS = ["ULTRA WIDE", "WIDE", "NORMAL", "TELEPHOTO"];
const ANGLE_OPTIONS = ["HIGH ANGLE", "EYE LEVEL", "LOW ANGLE", "DUTCH ANGLE", "OVERHEAD"];
const MOVEMENT_OPTIONS = ["STATIC", "PAN LEFT", "PAN RIGHT", "PAN UP", "PAN DOWN", "TILT UP", "TILT DOWN", "DOLLY IN", "DOLLY OUT", "TRACKING", "CRANE", "HANDHELD", "STEADICAM"];
const FRAME_OPTIONS = ["SINGLE", "TWO SHOT", "GROUP", "OVER SHOULDER"];

export const DetailView = ({ row, details, onUpdateDetail, onBack, getSegmentColor }: DetailViewProps) => {
  const segmentColor = getSegmentColor(row.segment);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Camera className="h-6 w-6" />
            Technical Details
          </h2>
          <p className="text-muted-foreground">Shot and equipment specifications for: <span className="font-semibold">{row.segment || "Untitled Shot"}</span></p>
        </div>
      </div>

      <div 
        className="bg-card rounded-lg shadow-lg border-l-4 overflow-hidden"
        style={{ 
          backgroundColor: segmentColor,
          borderLeftColor: segmentColor !== "transparent" ? segmentColor.replace("95%", "60%") : "hsl(var(--border))"
        }}
      >
        {/* Table Layout */}
        <div className="grid grid-cols-[auto_1fr_auto_1fr] divide-x divide-border">
          {/* Row 1: SIZE / FRAME */}
          <div className="bg-muted/50 px-4 py-3 font-semibold text-sm text-muted-foreground uppercase border-b border-border">
            SIZE
          </div>
          <div className="px-4 py-3 border-b border-border">
            <Select value={details.size} onValueChange={(v) => onUpdateDetail(row.id, "size", v)}>
              <SelectTrigger className="border-0 bg-transparent h-auto p-0 focus:ring-0">
                <SelectValue placeholder="SELECT..." />
              </SelectTrigger>
              <SelectContent>
                {SHOT_SIZES.map(size => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="bg-muted/50 px-4 py-3 font-semibold text-sm text-muted-foreground uppercase border-b border-border">
            FRAME
          </div>
          <div className="px-4 py-3 border-b border-border">
            <Select value={details.frame} onValueChange={(v) => onUpdateDetail(row.id, "frame", v)}>
              <SelectTrigger className="border-0 bg-transparent h-auto p-0 focus:ring-0">
                <SelectValue placeholder="SELECT..." />
              </SelectTrigger>
              <SelectContent>
                {FRAME_OPTIONS.map(frame => (
                  <SelectItem key={frame} value={frame}>{frame}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Row 2: EXTRA / FOCAL LENGTH */}
          <div className="bg-muted/50 px-4 py-3 font-semibold text-sm text-muted-foreground uppercase border-b border-border">
            EXTRA
          </div>
          <div className="px-4 py-3 border-b border-border">
            <Input
              value={details.extra}
              onChange={(e) => onUpdateDetail(row.id, "extra", e.target.value)}
              placeholder="e.g., WEATHER CGI"
              className="border-0 bg-transparent h-auto p-0 focus-visible:ring-0"
            />
          </div>
          <div className="bg-muted/50 px-4 py-3 font-semibold text-sm text-muted-foreground uppercase border-b border-border">
            FOCAL LENGTH
          </div>
          <div className="px-4 py-3 border-b border-border">
            <Input
              value={details.focalLength}
              onChange={(e) => onUpdateDetail(row.id, "focalLength", e.target.value)}
              placeholder="e.g., 50MM"
              className="border-0 bg-transparent h-auto p-0 focus-visible:ring-0"
            />
          </div>

          {/* Row 3: AOV / SETUP */}
          <div className="bg-muted/50 px-4 py-3 font-semibold text-sm text-muted-foreground uppercase border-b border-border">
            AOV
          </div>
          <div className="px-4 py-3 border-b border-border">
            <Select value={details.aov} onValueChange={(v) => onUpdateDetail(row.id, "aov", v)}>
              <SelectTrigger className="border-0 bg-transparent h-auto p-0 focus:ring-0">
                <SelectValue placeholder="SELECT..." />
              </SelectTrigger>
              <SelectContent>
                {AOV_OPTIONS.map(aov => (
                  <SelectItem key={aov} value={aov}>{aov}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="bg-muted/50 px-4 py-3 font-semibold text-sm text-muted-foreground uppercase border-b border-border">
            SETUP
          </div>
          <div className="px-4 py-3 border-b border-border">
            <Input
              value={details.setup}
              onChange={(e) => onUpdateDetail(row.id, "setup", e.target.value)}
              placeholder="e.g., BLOCK OFF ROAD"
              className="border-0 bg-transparent h-auto p-0 focus-visible:ring-0"
            />
          </div>

          {/* Row 4: ANGLE / CAMERA */}
          <div className="bg-muted/50 px-4 py-3 font-semibold text-sm text-muted-foreground uppercase border-b border-border">
            ANGLE
          </div>
          <div className="px-4 py-3 border-b border-border">
            <Select value={details.angle} onValueChange={(v) => onUpdateDetail(row.id, "angle", v)}>
              <SelectTrigger className="border-0 bg-transparent h-auto p-0 focus:ring-0">
                <SelectValue placeholder="SELECT..." />
              </SelectTrigger>
              <SelectContent>
                {ANGLE_OPTIONS.map(angle => (
                  <SelectItem key={angle} value={angle}>{angle}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="bg-muted/50 px-4 py-3 font-semibold text-sm text-muted-foreground uppercase border-b border-border">
            CAMERA
          </div>
          <div className="px-4 py-3 border-b border-border">
            <Input
              value={details.camera}
              onChange={(e) => onUpdateDetail(row.id, "camera", e.target.value)}
              placeholder="e.g., DEFAULT"
              className="border-0 bg-transparent h-auto p-0 focus-visible:ring-0"
            />
          </div>

          {/* Row 5: MOVEMENT / EQUIPMENT */}
          <div className="bg-muted/50 px-4 py-3 font-semibold text-sm text-muted-foreground uppercase border-b border-border">
            MOVEMENT
          </div>
          <div className="px-4 py-3 border-b border-border">
            <Select value={details.movement} onValueChange={(v) => onUpdateDetail(row.id, "movement", v)}>
              <SelectTrigger className="border-0 bg-transparent h-auto p-0 focus:ring-0">
                <SelectValue placeholder="SELECT..." />
              </SelectTrigger>
              <SelectContent>
                {MOVEMENT_OPTIONS.map(movement => (
                  <SelectItem key={movement} value={movement}>{movement}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="bg-muted/50 px-4 py-3 font-semibold text-sm text-muted-foreground uppercase border-b border-border">
            EQUIPMENT
          </div>
          <div className="px-4 py-3 border-b border-border">
            <Input
              value={details.equipment}
              onChange={(e) => onUpdateDetail(row.id, "equipment", e.target.value)}
              placeholder="e.g., DRONE"
              className="border-0 bg-transparent h-auto p-0 focus-visible:ring-0"
            />
          </div>

          {/* Row 6: NOTES (full width) */}
          <div className="bg-muted/50 px-4 py-3 font-semibold text-sm text-muted-foreground uppercase">
            NOTES
          </div>
          <div className="px-4 py-3 col-span-3">
            <Textarea
              value={details.technicalNotes}
              onChange={(e) => onUpdateDetail(row.id, "technicalNotes", e.target.value)}
              placeholder="e.g., BRING FOG MACHINE FOR FILL, IF NECESSARY."
              className="border-0 bg-transparent min-h-[60px] p-0 focus-visible:ring-0 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

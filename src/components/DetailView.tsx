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
        className="bg-card rounded-lg shadow-lg border-l-4 p-6 space-y-6"
        style={{ 
          backgroundColor: segmentColor,
          borderLeftColor: segmentColor !== "transparent" ? segmentColor.replace("95%", "60%") : "hsl(var(--border))"
        }}
      >
        {/* Shot Composition */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">Shot Composition</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Select value={details.size} onValueChange={(v) => onUpdateDetail(row.id, "size", v)}>
                <SelectTrigger id="size">
                  <SelectValue placeholder="Select shot size..." />
                </SelectTrigger>
                <SelectContent>
                  {SHOT_SIZES.map(size => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frame">Frame</Label>
              <Select value={details.frame} onValueChange={(v) => onUpdateDetail(row.id, "frame", v)}>
                <SelectTrigger id="frame">
                  <SelectValue placeholder="Select frame type..." />
                </SelectTrigger>
                <SelectContent>
                  {FRAME_OPTIONS.map(frame => (
                    <SelectItem key={frame} value={frame}>{frame}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="angle">Angle</Label>
              <Select value={details.angle} onValueChange={(v) => onUpdateDetail(row.id, "angle", v)}>
                <SelectTrigger id="angle">
                  <SelectValue placeholder="Select camera angle..." />
                </SelectTrigger>
                <SelectContent>
                  {ANGLE_OPTIONS.map(angle => (
                    <SelectItem key={angle} value={angle}>{angle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="movement">Movement</Label>
              <Select value={details.movement} onValueChange={(v) => onUpdateDetail(row.id, "movement", v)}>
                <SelectTrigger id="movement">
                  <SelectValue placeholder="Select camera movement..." />
                </SelectTrigger>
                <SelectContent>
                  {MOVEMENT_OPTIONS.map(movement => (
                    <SelectItem key={movement} value={movement}>{movement}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Camera & Lens */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">Camera & Lens</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aov">AOV (Angle of View)</Label>
              <Select value={details.aov} onValueChange={(v) => onUpdateDetail(row.id, "aov", v)}>
                <SelectTrigger id="aov">
                  <SelectValue placeholder="Select AOV..." />
                </SelectTrigger>
                <SelectContent>
                  {AOV_OPTIONS.map(aov => (
                    <SelectItem key={aov} value={aov}>{aov}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="focalLength">Focal Length</Label>
              <Input
                id="focalLength"
                value={details.focalLength}
                onChange={(e) => onUpdateDetail(row.id, "focalLength", e.target.value)}
                placeholder="e.g., 50MM, 24-70MM"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="camera">Camera</Label>
              <Input
                id="camera"
                value={details.camera}
                onChange={(e) => onUpdateDetail(row.id, "camera", e.target.value)}
                placeholder="e.g., DEFAULT, SONY A7S III"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="setup">Setup</Label>
              <Input
                id="setup"
                value={details.setup}
                onChange={(e) => onUpdateDetail(row.id, "setup", e.target.value)}
                placeholder="e.g., BLOCK OFF ROAD, STUDIO"
              />
            </div>
          </div>
        </div>

        {/* Equipment & Additional */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">Equipment & Additional</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="equipment">Equipment</Label>
              <Input
                id="equipment"
                value={details.equipment}
                onChange={(e) => onUpdateDetail(row.id, "equipment", e.target.value)}
                placeholder="e.g., DRONE, GIMBAL, TRIPOD"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="extra">Extra</Label>
              <Input
                id="extra"
                value={details.extra}
                onChange={(e) => onUpdateDetail(row.id, "extra", e.target.value)}
                placeholder="e.g., WEATHER CGI, VFX"
              />
            </div>
          </div>
        </div>

        {/* Technical Notes */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">Technical Notes</h3>
          <div className="space-y-2">
            <Textarea
              id="technicalNotes"
              value={details.technicalNotes}
              onChange={(e) => onUpdateDetail(row.id, "technicalNotes", e.target.value)}
              placeholder="Additional technical notes, special requirements, etc. (e.g., BRING FOG MACHINE FOR FILL, IF NECESSARY.)"
              className="min-h-[100px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Row {
  id: string;
  segment: string;
  visual: string;
  audio: string;
  notes: string;
  duration: string;
}

interface ShotListProps {
  rows: Row[];
  onDeleteRow: (id: string) => void;
  onSelectShot: (id: string) => void;
  getSegmentColor: (segment: string) => string;
  countWords: (text: string) => number;
  calculateDurationFromWords: (count: number) => string;
  useAutoDuration: boolean;
}

export const ShotList = ({ 
  rows, 
  onDeleteRow, 
  onSelectShot,
  getSegmentColor,
  countWords,
  calculateDurationFromWords,
  useAutoDuration
}: ShotListProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Shot List</h2>
        <p className="text-muted-foreground">Click on any shot to edit details in Script view</p>
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block bg-card rounded-lg shadow-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left p-4 font-semibold text-foreground w-[15%]">Segment/Scene</th>
              <th className="text-left p-4 font-semibold text-foreground w-[30%]">Visual</th>
              <th className="text-left p-4 font-semibold text-foreground w-[30%]">Audio</th>
              <th className="text-left p-4 font-semibold text-foreground w-[8%]">Words</th>
              <th className="text-left p-4 font-semibold text-foreground w-[10%]">Duration</th>
              <th className="w-16"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const segmentColor = getSegmentColor(row.segment);
              const wordCount = countWords(row.audio);
              const duration = useAutoDuration ? calculateDurationFromWords(wordCount) : row.duration;
              
              return (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-0 hover:opacity-90 transition-all border-l-4 cursor-pointer"
                  style={{ 
                    backgroundColor: segmentColor,
                    borderLeftColor: segmentColor !== "transparent" ? segmentColor.replace("95%", "60%") : "transparent"
                  }}
                  onClick={() => onSelectShot(row.id)}
                >
                  <td className="p-3">
                    <div className="font-medium text-foreground">{row.segment || `Scene ${index + 1}`}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm text-muted-foreground line-clamp-2">{row.visual}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm text-muted-foreground line-clamp-2">{row.audio}</div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="text-sm font-mono text-muted-foreground">{wordCount}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm font-mono text-foreground">{duration}</div>
                  </td>
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRow(row.id);
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden space-y-4">
        {rows.map((row, index) => {
          const segmentColor = getSegmentColor(row.segment);
          const wordCount = countWords(row.audio);
          const duration = useAutoDuration ? calculateDurationFromWords(wordCount) : row.duration;
          
          return (
            <div
              key={row.id}
              className="rounded-lg p-4 space-y-3 border-l-4 cursor-pointer"
              style={{ 
                backgroundColor: segmentColor,
                borderLeftColor: segmentColor !== "transparent" ? segmentColor.replace("95%", "60%") : "hsl(var(--border))"
              }}
              onClick={() => onSelectShot(row.id)}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{row.segment || `Scene ${index + 1}`}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRow(row.id);
                  }}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground line-clamp-2">{row.visual}</div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{wordCount} words</span>
                <span className="font-mono text-foreground">{duration}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

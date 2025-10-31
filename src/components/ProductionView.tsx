import { Clock, Film, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Row {
  id: string;
  segment: string;
  visual: string;
  audio: string;
  notes: string;
  duration: string;
}

interface ProductionViewProps {
  rows: Row[];
  totalWords: number;
  totalRunningTime: string;
  pacing: string;
}

export const ProductionView = ({ rows, totalWords, totalRunningTime, pacing }: ProductionViewProps) => {
  // Count unique segments
  const uniqueSegments = new Set(rows.map(r => r.segment.trim()).filter(s => s !== "")).size;
  
  // Count total shots
  const totalShots = rows.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Production Overview</h2>
        <p className="text-muted-foreground">Summary of your entire production</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Film className="h-4 w-4" />
              Total Segments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{uniqueSegments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total Shots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalShots}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total Words
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalWords}</div>
            <p className="text-xs text-muted-foreground mt-1">Pacing: {pacing}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Running Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{totalRunningTime}</div>
          </CardContent>
        </Card>
      </div>

      {/* Segment Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Segment Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from(new Set(rows.map(r => r.segment.trim()).filter(s => s !== ""))).map((segment, idx) => {
              const segmentShots = rows.filter(r => r.segment.trim() === segment);
              return (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <span className="font-medium text-foreground">{segment}</span>
                  <span className="text-sm text-muted-foreground">{segmentShots.length} shots</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import { useState, useCallback } from "react";
import { Clock, AlertTriangle, Calculator, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { DigitalCallSheetFormData, CrewCall, CastMember } from "./DigitalCallSheetForm";

interface SmartCallSheetProps {
  form: DigitalCallSheetFormData;
  onFormUpdate: (form: DigitalCallSheetFormData) => void;
}

interface OvertimeCalc {
  crewId: string;
  name: string;
  callTime: string;
  wrapTime: string;
  hoursWorked: number;
  overtimeHours: number;
  isOvertime: boolean;
}

export const SmartCallSheet = ({ form, onFormUpdate }: SmartCallSheetProps) => {
  const [cascadeEnabled, setCascadeEnabled] = useState(true);
  const [overtimeThreshold, setOvertimeThreshold] = useState(8);

  // Parse time string to minutes
  const parseTime = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + (minutes || 0);
  };

  // Format minutes to time string
  const formatTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  // Calculate time difference in hours
  const getHoursDiff = (startTime: string, endTime: string): number => {
    let startMinutes = parseTime(startTime);
    let endMinutes = parseTime(endTime);
    
    // Handle overnight shoots
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }
    
    return (endMinutes - startMinutes) / 60;
  };

  // Cascade time change - shift all call times by delta
  const handleCascadeTimeChange = useCallback((newGeneralCall: string) => {
    if (!cascadeEnabled) {
      onFormUpdate({ ...form, generalCallTime: newGeneralCall });
      return;
    }

    const oldGeneralCall = form.generalCallTime;
    const delta = parseTime(newGeneralCall) - parseTime(oldGeneralCall);

    // Update all times
    const updatedForm: DigitalCallSheetFormData = {
      ...form,
      generalCallTime: newGeneralCall,
      crewCallTime: formatTime(parseTime(form.crewCallTime) + delta),
      shootingCallTime: formatTime(parseTime(form.shootingCallTime) + delta),
      estimatedWrap: formatTime(parseTime(form.estimatedWrap) + delta),
      crewCalls: form.crewCalls.map(crew => ({
        ...crew,
        callTime: formatTime(parseTime(crew.callTime) + delta)
      })),
      castMembers: form.castMembers.map(cast => ({
        ...cast,
        pickupTime: cast.pickupTime ? formatTime(parseTime(cast.pickupTime) + delta) : "",
        arrivalTime: cast.arrivalTime ? formatTime(parseTime(cast.arrivalTime) + delta) : "",
        makeupTime: cast.makeupTime ? formatTime(parseTime(cast.makeupTime) + delta) : "",
        onSetTime: cast.onSetTime ? formatTime(parseTime(cast.onSetTime) + delta) : ""
      })),
      schedule: form.schedule.map(item => ({
        ...item,
        time: item.time ? formatTime(parseTime(item.time) + delta) : ""
      }))
    };

    onFormUpdate(updatedForm);
    toast.success(`All times shifted by ${delta > 0 ? "+" : ""}${Math.round(delta)} minutes`);
  }, [form, cascadeEnabled, onFormUpdate]);

  // Calculate overtime for each crew member
  const calculateOvertime = (): OvertimeCalc[] => {
    return form.crewCalls.map(crew => {
      const hoursWorked = getHoursDiff(crew.callTime, form.estimatedWrap);
      const overtimeHours = Math.max(0, hoursWorked - overtimeThreshold);
      
      return {
        crewId: crew.id,
        name: crew.name,
        callTime: crew.callTime,
        wrapTime: form.estimatedWrap,
        hoursWorked: Math.round(hoursWorked * 10) / 10,
        overtimeHours: Math.round(overtimeHours * 10) / 10,
        isOvertime: overtimeHours > 0
      };
    });
  };

  const overtimeCalcs = calculateOvertime();
  const totalOvertimeHours = overtimeCalcs.reduce((sum, c) => sum + c.overtimeHours, 0);
  const crewWithOvertime = overtimeCalcs.filter(c => c.isOvertime).length;

  return (
    <div className="space-y-4">
      {/* Smart Assist Header */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-5 w-5 text-primary" />
            Smart Assist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch 
                checked={cascadeEnabled} 
                onCheckedChange={setCascadeEnabled}
                id="cascade-switch"
              />
              <Label htmlFor="cascade-switch" className="text-sm">
                Cascading Time Changes
              </Label>
            </div>
            <Badge variant={cascadeEnabled ? "default" : "outline"}>
              {cascadeEnabled ? "On" : "Off"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            When enabled, changing the general call time will automatically shift all crew calls, cast times, and schedule items by the same amount.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">General Call</Label>
              <Input
                type="time"
                value={form.generalCallTime}
                onChange={(e) => handleCascadeTimeChange(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Est. Wrap</Label>
              <Input
                type="time"
                value={form.estimatedWrap}
                onChange={(e) => onFormUpdate({ ...form, estimatedWrap: e.target.value })}
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overtime Calculator */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-5 w-5" />
              Overtime Calculator
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Threshold:</Label>
              <Input
                type="number"
                value={overtimeThreshold}
                onChange={(e) => setOvertimeThreshold(Number(e.target.value))}
                className="w-16 h-7 text-xs"
                min={1}
                max={24}
              />
              <span className="text-xs text-muted-foreground">hrs</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {crewWithOvertime > 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-4">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">
                {crewWithOvertime} crew member{crewWithOvertime > 1 ? "s" : ""} will go into overtime ({totalOvertimeHours.toFixed(1)} total OT hours)
              </span>
            </div>
          )}

          <div className="space-y-2">
            {overtimeCalcs.map(calc => (
              <div 
                key={calc.crewId}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  calc.isOvertime ? "bg-yellow-500/10" : "bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className={`h-4 w-4 ${calc.isOvertime ? "text-yellow-500" : "text-muted-foreground"}`} />
                  <div>
                    <div className="text-sm font-medium">{calc.name || "Unnamed"}</div>
                    <div className="text-xs text-muted-foreground">
                      {calc.callTime} - {calc.wrapTime}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{calc.hoursWorked}h</div>
                  {calc.isOvertime && (
                    <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-500">
                      +{calc.overtimeHours}h OT
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {overtimeCalcs.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Add crew members to see overtime calculations.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

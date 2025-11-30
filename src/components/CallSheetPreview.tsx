import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, Clock, MapPin, Cloud, Sun, Sunset, Users, User, 
  FileText, Camera
} from "lucide-react";
import { DigitalCallSheetFormData, CrewCall, CastMember, ScheduleItem, LocationInfo } from "./DigitalCallSheetForm";
import { CustomSection } from "./form-builder/types";

interface CallSheetPreviewProps {
  form: DigitalCallSheetFormData;
  customSections?: CustomSection[];
  customFieldValues?: Record<string, any>;
}

export const CallSheetPreview = ({ 
  form, 
  customSections = [],
  customFieldValues = {}
}: CallSheetPreviewProps) => {
  // Group crew by department
  const crewByDepartment: Record<string, CrewCall[]> = {};
  form.crewCalls.forEach(c => {
    const dept = c.department || "Other";
    if (!crewByDepartment[dept]) crewByDepartment[dept] = [];
    crewByDepartment[dept].push(c);
  });

  return (
    <div className="max-w-4xl mx-auto space-y-4 p-4 bg-background rounded-lg border">
      {/* Header */}
      <div className="bg-primary text-primary-foreground rounded-lg p-6 text-center">
        <h1 className="text-2xl font-bold mb-1">CALL SHEET</h1>
        <h2 className="text-xl">{form.productionName || "Untitled Production"}</h2>
        <p className="text-sm mt-2 opacity-90">
          Day {form.shootDay} • {form.shootDate}
        </p>
        {form.productionCompany && (
          <p className="text-sm opacity-75 mt-1">{form.productionCompany}</p>
        )}
      </div>

      {/* Call Times */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">General Call</p>
              <p className="text-lg font-bold text-primary">{form.generalCallTime}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Crew Call</p>
              <p className="text-lg font-bold">{form.crewCallTime}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Shooting Call</p>
              <p className="text-lg font-bold">{form.shootingCallTime}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Est. Wrap</p>
              <p className="text-lg font-bold">{form.estimatedWrap}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weather */}
      {(form.weather || form.sunrise || form.sunset) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cloud className="h-4 w-4 text-primary" />
              <span className="font-semibold">Weather</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              {form.weather && <span>{form.weather}</span>}
              {form.temperature && <span>{form.temperature}</span>}
              {form.sunrise && (
                <span className="flex items-center gap-1">
                  <Sun className="h-3 w-3" /> {form.sunrise}
                </span>
              )}
              {form.sunset && (
                <span className="flex items-center gap-1">
                  <Sunset className="h-3 w-3" /> {form.sunset}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Personnel */}
      {(form.director || form.producer) && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              {form.director && (
                <div>
                  <p className="text-xs text-muted-foreground">Director</p>
                  <p className="font-medium">{form.director}</p>
                </div>
              )}
              {form.producer && (
                <div>
                  <p className="text-xs text-muted-foreground">Producer</p>
                  <p className="font-medium">{form.producer}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locations */}
      {form.locations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-semibold">Locations</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {form.locations.map((loc, idx) => (
              <div key={loc.id} className="p-3 bg-muted/30 rounded-lg">
                <p className="font-medium">{loc.name || `Location ${idx + 1}`}</p>
                {loc.address && <p className="text-sm text-muted-foreground">{loc.address}</p>}
                {loc.parkingInfo && <p className="text-sm">Parking: {loc.parkingInfo}</p>}
                {loc.notes && <p className="text-sm italic">{loc.notes}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Schedule */}
      {form.schedule.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-semibold">Shooting Schedule</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {form.schedule.map((item) => (
                <div key={item.id} className="flex items-start gap-4 p-2 bg-muted/30 rounded">
                  <span className="font-mono text-sm font-bold min-w-[50px]">{item.time}</span>
                  <Badge variant="outline">{item.scene}</Badge>
                  <span className="flex-1 text-sm">{item.description}</span>
                  {item.location && <span className="text-xs text-muted-foreground">{item.location}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Crew */}
      {form.crewCalls.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-semibold">Crew Call</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(crewByDepartment).map(([dept, members]) => (
              <div key={dept}>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{dept}</p>
                <div className="space-y-1">
                  {members.map(m => (
                    <div key={m.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{m.callTime}</span>
                        <span className="font-medium">{m.name}</span>
                        <span className="text-muted-foreground">({m.role})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.phone && <span className="text-xs text-muted-foreground">{m.phone}</span>}
                        {m.confirmed && <Badge variant="default" className="text-xs">✓</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Cast */}
      {form.castMembers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span className="font-semibold">Cast</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {form.castMembers.map(cast => (
              <div key={cast.id} className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{cast.name}</span>
                    <span className="text-muted-foreground ml-2">as {cast.character}</span>
                  </div>
                  {cast.confirmed && <Badge variant="default" className="text-xs">✓</Badge>}
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                  {cast.pickupTime && <span>P/U: {cast.pickupTime}</span>}
                  {cast.makeupTime && <span>M/U: {cast.makeupTime}</span>}
                  {cast.onSetTime && <span>On Set: {cast.onSetTime}</span>}
                </div>
                {cast.notes && <p className="text-sm italic mt-1">{cast.notes}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Custom Sections */}
      {customSections.map(section => {
        const hasValues = section.fields.some(f => customFieldValues[f.id]);
        if (!hasValues) return null;

        return (
          <Card key={section.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <span>{section.icon}</span>
                <span className="font-semibold">{section.name}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {section.fields.map(field => {
                  const value = customFieldValues[field.id];
                  if (!value) return null;
                  
                  const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
                  
                  return (
                    <div key={field.id}>
                      <p className="text-xs text-muted-foreground">{field.label}</p>
                      <p className="text-sm font-medium">{displayValue}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Notes */}
      {(form.specialInstructions || form.safetyNotes) && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-semibold">Notes</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {form.specialInstructions && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Special Instructions</p>
                <p className="text-sm whitespace-pre-wrap">{form.specialInstructions}</p>
              </div>
            )}
            {form.safetyNotes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Safety Notes</p>
                <p className="text-sm whitespace-pre-wrap">{form.safetyNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

import { useState } from "react";
import { Users, Search, Check, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { CrewMember } from "./CrewContacts";
import { CrewCall } from "./DigitalCallSheetForm";

interface CrewImportDialogProps {
  availableCrew: CrewMember[];
  existingCrewIds: string[];
  defaultCallTime: string;
  onImport: (crewCalls: CrewCall[]) => void;
}

export const CrewImportDialog = ({
  availableCrew,
  existingCrewIds,
  defaultCallTime,
  onImport,
}: CrewImportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter out already imported crew and apply search
  const filteredCrew = availableCrew.filter(crew => {
    const matchesSearch = 
      crew.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crew.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crew.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const alreadyImportedIds = new Set(existingCrewIds);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    const selectableIds = filteredCrew
      .filter(c => !alreadyImportedIds.has(c.id))
      .map(c => c.id);
    setSelectedIds(selectableIds);
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const handleImport = () => {
    const crewToImport = availableCrew.filter(c => selectedIds.includes(c.id));
    
    const newCrewCalls: CrewCall[] = crewToImport.map(crew => ({
      id: `crew-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: crew.name,
      role: crew.role,
      department: crew.department,
      callTime: defaultCallTime,
      phone: crew.phone,
      email: crew.email,
      confirmed: false,
    }));

    onImport(newCrewCalls);
    toast.success(`Imported ${newCrewCalls.length} crew member${newCrewCalls.length !== 1 ? 's' : ''}`);
    setSelectedIds([]);
    setSearchQuery("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Import from Contacts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Import Crew from Contacts
          </DialogTitle>
          <DialogDescription>
            Select crew members from your contacts to add to this call sheet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, role, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selection actions */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} selected
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear
              </Button>
            </div>
          </div>

          {/* Crew list */}
          <ScrollArea className="h-[300px] border rounded-lg p-2">
            {filteredCrew.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {availableCrew.length === 0 
                  ? "No crew in contacts. Add crew members in the Crew tab first."
                  : "No matching crew found"
                }
              </p>
            ) : (
              <div className="space-y-2">
                {filteredCrew.map(crew => {
                  const isAlreadyImported = alreadyImportedIds.has(crew.id);
                  const isSelected = selectedIds.includes(crew.id);

                  return (
                    <div
                      key={crew.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isAlreadyImported 
                          ? "bg-muted/50 opacity-60 cursor-not-allowed"
                          : isSelected 
                            ? "bg-primary/10 border-primary/30" 
                            : "hover:bg-muted/50"
                      }`}
                      onClick={() => !isAlreadyImported && toggleSelection(crew.id)}
                    >
                      <Checkbox
                        checked={isSelected || isAlreadyImported}
                        disabled={isAlreadyImported}
                        onCheckedChange={() => !isAlreadyImported && toggleSelection(crew.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{crew.name}</span>
                          {isAlreadyImported && (
                            <Badge variant="secondary" className="text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              Added
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{crew.role}</span>
                          {crew.department && (
                            <>
                              <span>•</span>
                              <span>{crew.department}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={selectedIds.length === 0}>
            Import {selectedIds.length > 0 && `(${selectedIds.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

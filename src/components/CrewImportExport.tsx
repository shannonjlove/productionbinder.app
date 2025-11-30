import { useRef } from "react";
import { Download, Upload, FileJson, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CrewMember } from "./CrewContacts";
import { CustomField } from "./form-builder/types";

interface CrewImportExportProps {
  crew: CrewMember[];
  customFields: CustomField[];
  onImportCrew: (crew: CrewMember[]) => void;
  onImportFields: (fields: CustomField[]) => void;
}

interface CrewExportData {
  version: string;
  exportDate: string;
  customFields: CustomField[];
  crew: CrewMember[];
}

export const CrewImportExport = ({ 
  crew, 
  customFields, 
  onImportCrew, 
  onImportFields 
}: CrewImportExportProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportToJSON = () => {
    const exportData: CrewExportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      customFields,
      crew,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `crew-contacts-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Crew contacts exported!");
  };

  const exportToCSV = () => {
    // Build headers from standard + custom fields
    const standardHeaders = ['Name', 'Role', 'Department', 'Email', 'Phone', 'Notes'];
    const customHeaders = customFields.map(f => f.label);
    const headers = [...standardHeaders, ...customHeaders];

    const rows = crew.map(member => {
      const standardValues = [
        member.name,
        member.role,
        member.department,
        member.email,
        member.phone,
        member.notes,
      ];
      
      const customValues = customFields.map(field => {
        const value = member.customFields?.[field.id];
        if (Array.isArray(value)) return value.join('; ');
        return value || '';
      });

      return [...standardValues, ...customValues]
        .map(cell => `"${(cell || '').replace(/"/g, '""')}"`)
        .join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `crew-contacts-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Crew contacts exported to CSV!");
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        if (file.name.endsWith('.json')) {
          const imported = JSON.parse(content) as CrewExportData;
          
          if (imported.crew && Array.isArray(imported.crew)) {
            onImportCrew(imported.crew);
          }
          if (imported.customFields && Array.isArray(imported.customFields)) {
            onImportFields(imported.customFields);
          }
          
          toast.success(`Imported ${imported.crew?.length || 0} crew members!`);
        } else if (file.name.endsWith('.csv')) {
          // Parse CSV
          const lines = content.split('\n').filter(line => line.trim());
          if (lines.length < 2) {
            toast.error("CSV file is empty or has no data rows");
            return;
          }

          const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
          const nameIndex = headers.findIndex(h => h.toLowerCase() === 'name');
          const roleIndex = headers.findIndex(h => h.toLowerCase() === 'role');
          const deptIndex = headers.findIndex(h => h.toLowerCase() === 'department');
          const emailIndex = headers.findIndex(h => h.toLowerCase() === 'email');
          const phoneIndex = headers.findIndex(h => h.toLowerCase() === 'phone');
          const notesIndex = headers.findIndex(h => h.toLowerCase() === 'notes');

          const importedCrew: CrewMember[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.replace(/^"|"$/g, '').trim());
            
            const newMember: CrewMember = {
              id: `crew-${Date.now()}-${i}`,
              name: nameIndex >= 0 ? values[nameIndex] || '' : '',
              role: roleIndex >= 0 ? values[roleIndex] || '' : '',
              department: deptIndex >= 0 ? values[deptIndex] || '' : '',
              email: emailIndex >= 0 ? values[emailIndex] || '' : '',
              phone: phoneIndex >= 0 ? values[phoneIndex] || '' : '',
              notes: notesIndex >= 0 ? values[notesIndex] || '' : '',
              customFields: {},
            };
            
            if (newMember.name || newMember.email) {
              importedCrew.push(newMember);
            }
          }

          if (importedCrew.length > 0) {
            onImportCrew([...crew, ...importedCrew]);
            toast.success(`Imported ${importedCrew.length} crew members from CSV!`);
          } else {
            toast.error("No valid crew members found in CSV");
          }
        } else {
          toast.error("Please upload a JSON or CSV file");
        }
      } catch (error) {
        console.error("Import error:", error);
        toast.error("Failed to import file. Please check the format.");
      }
    };
    
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson className="h-5 w-5 text-primary" />
          Import / Export
        </CardTitle>
        <CardDescription>
          Share crew contacts between projects or backup your data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={exportToJSON} className="gap-2">
            <Download className="h-4 w-4" />
            Export JSON
          </Button>
          <Button variant="outline" onClick={exportToCSV} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
        
        <div className="border-t pt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv"
            onChange={handleFileImport}
            className="hidden"
          />
          <Button 
            variant="outline" 
            className="w-full gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Import from File
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Supports JSON and CSV formats
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

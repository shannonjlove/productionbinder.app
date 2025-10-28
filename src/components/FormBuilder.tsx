import { useState, useEffect } from "react";
import { Plus, Trash2, Download, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Row {
  id: string;
  segment: string;
  visual: string;
  audio: string;
  notes: string;
}

const STORAGE_KEY = "av-script-data";

export const FormBuilder = () => {
  const [rows, setRows] = useState<Row[]>([
    { id: "1", segment: "", visual: "", audio: "", notes: "" },
  ]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setRows(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved data");
      }
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  }, [rows]);

  const addRow = () => {
    const newRow: Row = {
      id: Date.now().toString(),
      segment: "",
      visual: "",
      audio: "",
      notes: "",
    };
    setRows([...rows, newRow]);
    toast.success("Row added");
  };

  const deleteRow = (id: string) => {
    if (rows.length === 1) {
      toast.error("Cannot delete the last row");
      return;
    }
    setRows(rows.filter((row) => row.id !== id));
    toast.success("Row deleted");
  };

  const updateCell = (id: string, field: keyof Omit<Row, "id">, value: string) => {
    setRows(rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const exportToCSV = () => {
    const headers = ["Segment/Scene", "Visual", "Audio", "Notes"];
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        [row.segment, row.visual, row.audio, row.notes]
          .map((cell) => `"${cell.replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `av-script-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Exported successfully");
  };

  const saveManually = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    toast.success("Saved successfully");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            AV Script Builder
          </h1>
          <p className="text-muted-foreground">
            Create professional audio-visual scripts with ease
          </p>
        </header>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Button onClick={addRow} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Row
          </Button>
          <Button onClick={saveManually} variant="secondary" className="gap-2">
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Table Container */}
        <div className="bg-card rounded-lg shadow-lg border border-border overflow-hidden">
          {/* Desktop View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 font-semibold text-foreground w-1/5">
                    Segment/Scene
                  </th>
                  <th className="text-left p-4 font-semibold text-foreground w-1/3">
                    Visual
                  </th>
                  <th className="text-left p-4 font-semibold text-foreground w-1/3">
                    Audio
                  </th>
                  <th className="text-left p-4 font-semibold text-foreground w-1/6">
                    Notes
                  </th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-3">
                      <Input
                        value={row.segment}
                        onChange={(e) => updateCell(row.id, "segment", e.target.value)}
                        placeholder={`Scene ${index + 1}`}
                        className="border-0 bg-transparent focus:bg-background"
                      />
                    </td>
                    <td className="p-3">
                      <Textarea
                        value={row.visual}
                        onChange={(e) => updateCell(row.id, "visual", e.target.value)}
                        placeholder="Describe what viewers will see..."
                        className="min-h-[80px] border-0 bg-transparent focus:bg-background resize-none"
                      />
                    </td>
                    <td className="p-3">
                      <Textarea
                        value={row.audio}
                        onChange={(e) => updateCell(row.id, "audio", e.target.value)}
                        placeholder="Describe audio, narration, music..."
                        className="min-h-[80px] border-0 bg-transparent focus:bg-background resize-none"
                      />
                    </td>
                    <td className="p-3">
                      <Textarea
                        value={row.notes}
                        onChange={(e) => updateCell(row.id, "notes", e.target.value)}
                        placeholder="Additional notes..."
                        className="min-h-[80px] border-0 bg-transparent focus:bg-background resize-none"
                      />
                    </td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRow(row.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet View */}
          <div className="lg:hidden space-y-4 p-4">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="bg-muted/30 rounded-lg p-4 space-y-4 border border-border"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">Row {index + 1}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRow(row.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Segment/Scene
                  </label>
                  <Input
                    value={row.segment}
                    onChange={(e) => updateCell(row.id, "segment", e.target.value)}
                    placeholder={`Scene ${index + 1}`}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Visual
                  </label>
                  <Textarea
                    value={row.visual}
                    onChange={(e) => updateCell(row.id, "visual", e.target.value)}
                    placeholder="Describe what viewers will see..."
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Audio
                  </label>
                  <Textarea
                    value={row.audio}
                    onChange={(e) => updateCell(row.id, "audio", e.target.value)}
                    placeholder="Describe audio, narration, music..."
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Notes
                  </label>
                  <Textarea
                    value={row.notes}
                    onChange={(e) => updateCell(row.id, "notes", e.target.value)}
                    placeholder="Additional notes..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Changes are automatically saved to your browser</p>
        </div>
      </div>
    </div>
  );
};

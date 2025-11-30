import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { CustomField } from "./types";
import { FieldRenderer } from "./FieldRenderer";

interface FieldEditorProps {
  field: CustomField;
  onUpdate: (updates: Partial<CustomField>) => void;
  onDelete: () => void;
}

export const FieldEditor = ({ field, onUpdate, onDelete }: FieldEditorProps) => {
  const hasOptions = ['select', 'radio', 'checkbox'].includes(field.type);

  return (
    <div className="border rounded-lg p-4 bg-card space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Label</Label>
            <Input
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Field label"
            />
          </div>
          <div className="space-y-2">
            <Label>Placeholder</Label>
            <Input
              value={field.placeholder || ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              placeholder="Placeholder text"
            />
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive ml-2"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {hasOptions && (
        <div className="space-y-2">
          <Label>Options (comma-separated)</Label>
          <Input
            value={field.options?.join(', ') || ''}
            onChange={(e) => onUpdate({
              options: e.target.value.split(',').map(o => o.trim()).filter(Boolean)
            })}
            placeholder="Option 1, Option 2, Option 3"
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox
          id={`required-${field.id}`}
          checked={field.required}
          onCheckedChange={(checked) => onUpdate({ required: !!checked })}
        />
        <Label htmlFor={`required-${field.id}`} className="font-normal">
          Required field
        </Label>
      </div>

      <div className="pt-4 border-t">
        <Label className="text-xs text-muted-foreground mb-2 block">Preview:</Label>
        <FieldRenderer
          field={field}
          value={undefined}
          onChange={() => {}}
          disabled={true}
        />
      </div>
    </div>
  );
};

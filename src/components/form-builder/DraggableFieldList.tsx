import { Button } from "@/components/ui/button";
import { GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { CustomField } from "./types";
import { FieldEditor } from "./FieldEditor";

interface DraggableFieldListProps {
  fields: CustomField[];
  onUpdate: (fieldId: string, updates: Partial<CustomField>) => void;
  onDelete: (fieldId: string) => void;
  onReorder: (fields: CustomField[]) => void;
}

export const DraggableFieldList = ({
  fields,
  onUpdate,
  onDelete,
  onReorder,
}: DraggableFieldListProps) => {
  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    
    // Update sort orders
    const reorderedFields = newFields.map((field, idx) => ({
      ...field,
      sortOrder: idx
    }));
    
    onReorder(reorderedFields);
  };

  if (fields.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
        <p>No custom fields yet</p>
        <p className="text-sm">Add fields using the buttons above</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {fields
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((field, index) => (
          <div key={field.id} className="flex items-start gap-2">
            <div className="flex flex-col gap-1 pt-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => moveField(index, 'up')}
                disabled={index === 0}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <GripVertical className="h-4 w-4 text-muted-foreground mx-auto" />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => moveField(index, 'down')}
                disabled={index === fields.length - 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1">
              <FieldEditor
                field={field}
                onUpdate={(updates) => onUpdate(field.id, updates)}
                onDelete={() => onDelete(field.id)}
              />
            </div>
          </div>
        ))}
    </div>
  );
};

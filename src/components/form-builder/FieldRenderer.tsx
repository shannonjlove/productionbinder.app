import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomField } from "./types";

interface FieldRendererProps {
  field: CustomField;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  showLabel?: boolean;
}

export const FieldRenderer = ({ 
  field, 
  value, 
  onChange, 
  disabled = false,
  showLabel = true 
}: FieldRendererProps) => {
  const fieldId = `field-${field.id}`;

  const renderInput = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
      case 'date':
      case 'time':
        return (
          <Input
            id={fieldId}
            type={field.type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            disabled={disabled}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            id={fieldId}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            disabled={disabled}
            rows={4}
          />
        );
      
      case 'select':
        return (
          <Select 
            value={value || ''} 
            onValueChange={onChange} 
            disabled={disabled}
          >
            <SelectTrigger id={fieldId}>
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, idx) => (
                <SelectItem key={idx} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'radio':
        return (
          <RadioGroup 
            value={value || ''} 
            onValueChange={onChange} 
            disabled={disabled}
            className="space-y-2"
          >
            {field.options?.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${fieldId}_${idx}`} />
                <Label htmlFor={`${fieldId}_${idx}`} className="font-normal">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, idx) => {
              const checked = Array.isArray(value) ? value.includes(option) : false;
              return (
                <div key={idx} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${fieldId}_${idx}`}
                    checked={checked}
                    onCheckedChange={(isChecked) => {
                      const newValue = Array.isArray(value) ? [...value] : [];
                      if (isChecked) {
                        newValue.push(option);
                      } else {
                        const index = newValue.indexOf(option);
                        if (index > -1) newValue.splice(index, 1);
                      }
                      onChange(newValue);
                    }}
                    disabled={disabled}
                  />
                  <Label htmlFor={`${fieldId}_${idx}`} className="font-normal">
                    {option}
                  </Label>
                </div>
              );
            })}
          </div>
        );
      
      case 'file':
        return (
          <Input
            id={fieldId}
            type="file"
            onChange={(e) => onChange(e.target.files?.[0])}
            required={field.required}
            disabled={disabled}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      {showLabel && (
        <Label htmlFor={fieldId} className="text-sm font-medium text-foreground">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {renderInput()}
    </div>
  );
};

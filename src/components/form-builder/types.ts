// Shared types for the form builder system

export type FieldType = 
  | 'text' 
  | 'email' 
  | 'tel' 
  | 'number' 
  | 'textarea' 
  | 'select' 
  | 'checkbox' 
  | 'radio' 
  | 'date' 
  | 'time' 
  | 'file';

export interface CustomField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, radio, checkbox
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  sortOrder: number;
}

export interface CustomSection {
  id: string;
  name: string;
  icon?: string;
  fields: CustomField[];
  sortOrder: number;
  collapsible: boolean;
}

export interface FieldConfig {
  fieldTypes: { type: FieldType; label: string; icon: string }[];
}

export const DEFAULT_FIELD_TYPES: FieldConfig['fieldTypes'] = [
  { type: 'text', label: 'Text Input', icon: '📝' },
  { type: 'email', label: 'Email', icon: '📧' },
  { type: 'tel', label: 'Phone', icon: '📞' },
  { type: 'number', label: 'Number', icon: '🔢' },
  { type: 'textarea', label: 'Text Area', icon: '📄' },
  { type: 'select', label: 'Dropdown', icon: '📋' },
  { type: 'checkbox', label: 'Checkbox', icon: '☑️' },
  { type: 'radio', label: 'Radio Buttons', icon: '🔘' },
  { type: 'date', label: 'Date', icon: '📅' },
  { type: 'time', label: 'Time', icon: '⏰' },
  { type: 'file', label: 'File Upload', icon: '📎' },
];

export const createEmptyField = (type: FieldType, sortOrder: number): CustomField => ({
  id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  label: `New ${type} field`,
  placeholder: type === 'textarea' ? 'Enter text here...' : 'Enter value',
  required: false,
  options: ['select', 'radio', 'checkbox'].includes(type) ? ['Option 1', 'Option 2'] : undefined,
  sortOrder,
});

export const createEmptySection = (sortOrder: number): CustomSection => ({
  id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  name: 'New Section',
  icon: '📋',
  fields: [],
  sortOrder,
  collapsible: true,
});

// Crew-specific templates
export interface CrewFieldTemplate {
  id: string;
  name: string;
  description: string;
  fields: Omit<CustomField, 'id' | 'sortOrder'>[];
}

export const CREW_FIELD_TEMPLATES: CrewFieldTemplate[] = [
  {
    id: 'union',
    name: 'Union Info',
    description: 'Union membership details',
    fields: [
      { type: 'select', label: 'Union Status', required: false, options: ['SAG-AFTRA', 'IATSE', 'DGA', 'WGA', 'Non-Union'] },
      { type: 'text', label: 'Union ID', required: false, placeholder: 'Union membership number' },
    ]
  },
  {
    id: 'emergency',
    name: 'Emergency Contact',
    description: 'Emergency contact information',
    fields: [
      { type: 'text', label: 'Emergency Contact Name', required: false, placeholder: 'Contact name' },
      { type: 'tel', label: 'Emergency Phone', required: false, placeholder: '+1 (555) 123-4567' },
      { type: 'text', label: 'Relationship', required: false, placeholder: 'e.g., Spouse, Parent' },
    ]
  },
  {
    id: 'availability',
    name: 'Availability',
    description: 'Scheduling and availability',
    fields: [
      { type: 'checkbox', label: 'Available Days', required: false, options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
      { type: 'textarea', label: 'Availability Notes', required: false, placeholder: 'Any scheduling constraints...' },
    ]
  },
  {
    id: 'equipment',
    name: 'Equipment',
    description: 'Personal equipment they can bring',
    fields: [
      { type: 'checkbox', label: 'Own Equipment', required: false, options: ['Camera', 'Lenses', 'Lighting Kit', 'Audio Kit', 'Grip Equipment', 'Vehicle'] },
      { type: 'textarea', label: 'Equipment Details', required: false, placeholder: 'Describe equipment...' },
    ]
  },
  {
    id: 'dietary',
    name: 'Dietary Requirements',
    description: 'Food allergies and preferences',
    fields: [
      { type: 'checkbox', label: 'Dietary Restrictions', required: false, options: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut Allergy', 'Kosher', 'Halal'] },
      { type: 'textarea', label: 'Other Dietary Notes', required: false, placeholder: 'Any other dietary requirements...' },
    ]
  },
];

// Call sheet section templates
export interface CallSheetSectionTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  fields: Omit<CustomField, 'id' | 'sortOrder'>[];
}

export const CALLSHEET_SECTION_TEMPLATES: CallSheetSectionTemplate[] = [
  {
    id: 'meals',
    name: 'Meal Breaks',
    description: 'Catering and meal schedule',
    icon: '🍽️',
    fields: [
      { type: 'time', label: 'Breakfast', required: false },
      { type: 'time', label: 'Lunch', required: false },
      { type: 'time', label: 'Dinner', required: false },
      { type: 'text', label: 'Catering Company', required: false, placeholder: 'Catering provider name' },
      { type: 'textarea', label: 'Menu Notes', required: false, placeholder: 'Special dietary accommodations...' },
    ]
  },
  {
    id: 'transportation',
    name: 'Transportation',
    description: 'Parking and transport details',
    icon: '🚗',
    fields: [
      { type: 'text', label: 'Parking Location', required: false, placeholder: 'Where to park' },
      { type: 'text', label: 'Shuttle Pickup', required: false, placeholder: 'Shuttle pickup point' },
      { type: 'time', label: 'First Shuttle', required: false },
      { type: 'textarea', label: 'Driving Directions', required: false, placeholder: 'How to get there...' },
    ]
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'Walkies and contact info',
    icon: '📻',
    fields: [
      { type: 'text', label: 'Walkie Channel', required: false, placeholder: 'e.g., Channel 1' },
      { type: 'text', label: 'Production Phone', required: false, placeholder: 'On-set contact number' },
      { type: 'textarea', label: 'Emergency Procedures', required: false, placeholder: 'What to do in case of emergency...' },
    ]
  },
  {
    id: 'equipment_rental',
    name: 'Equipment Rental',
    description: 'Rental equipment details',
    icon: '📷',
    fields: [
      { type: 'text', label: 'Rental House', required: false, placeholder: 'Equipment rental company' },
      { type: 'text', label: 'Order Number', required: false, placeholder: 'Rental order #' },
      { type: 'time', label: 'Pickup Time', required: false },
      { type: 'time', label: 'Return Time', required: false },
      { type: 'textarea', label: 'Equipment List', required: false, placeholder: 'List of rented equipment...' },
    ]
  },
  {
    id: 'permits',
    name: 'Permits & Insurance',
    description: 'Location permits and coverage',
    icon: '📜',
    fields: [
      { type: 'text', label: 'Permit Number', required: false, placeholder: 'Location permit #' },
      { type: 'text', label: 'Insurance Policy', required: false, placeholder: 'Policy number' },
      { type: 'text', label: 'Location Contact', required: false, placeholder: 'Who to contact on-site' },
      { type: 'tel', label: 'Contact Phone', required: false, placeholder: 'Contact phone number' },
    ]
  },
];

// Call sheet full template
export interface CallSheetTemplate {
  id: string;
  name: string;
  description: string;
  customSections: CustomSection[];
}

export const DEFAULT_CALLSHEET_TEMPLATES: CallSheetTemplate[] = [
  {
    id: 'film',
    name: 'Film Production',
    description: 'Standard film production call sheet',
    customSections: [],
  },
  {
    id: 'commercial',
    name: 'Commercial Shoot',
    description: 'Fast-paced commercial production',
    customSections: [],
  },
  {
    id: 'documentary',
    name: 'Documentary',
    description: 'Documentary-style production',
    customSections: [],
  },
  {
    id: 'music_video',
    name: 'Music Video',
    description: 'Music video production',
    customSections: [],
  },
];

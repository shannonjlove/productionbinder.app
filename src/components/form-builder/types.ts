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
  productionType?: 'film' | 'commercial' | 'documentary' | 'music_video' | 'custom';
}

// Helper to create a section from template
const createSectionFromTemplate = (
  template: CallSheetSectionTemplate, 
  sortOrder: number
): CustomSection => ({
  id: `section_${template.id}_${Date.now()}`,
  name: template.name,
  icon: template.icon,
  fields: template.fields.map((field, index) => ({
    ...field,
    id: `field_${template.id}_${index}_${Date.now()}`,
    sortOrder: index,
  })),
  sortOrder,
  collapsible: true,
});

// Pre-built production type templates
export const PRODUCTION_TYPE_TEMPLATES: CallSheetTemplate[] = [
  {
    id: 'film_production',
    name: 'Film Production',
    description: 'Full-scale film production with all essential sections',
    productionType: 'film',
    customSections: [
      {
        id: 'section_meals_film',
        name: 'Meal Breaks',
        icon: '🍽️',
        sortOrder: 0,
        collapsible: true,
        fields: [
          { id: 'film_breakfast', type: 'time', label: 'Breakfast', required: false, sortOrder: 0 },
          { id: 'film_lunch', type: 'time', label: 'Lunch', required: false, sortOrder: 1 },
          { id: 'film_second_meal', type: 'time', label: 'Second Meal', required: false, sortOrder: 2 },
          { id: 'film_catering', type: 'text', label: 'Catering Company', required: false, placeholder: 'Catering provider', sortOrder: 3 },
          { id: 'film_craft', type: 'text', label: 'Craft Services', required: false, placeholder: 'Craft services provider', sortOrder: 4 },
        ]
      },
      {
        id: 'section_transport_film',
        name: 'Transportation',
        icon: '🚗',
        sortOrder: 1,
        collapsible: true,
        fields: [
          { id: 'film_basecamp', type: 'text', label: 'Basecamp Location', required: false, placeholder: 'Where basecamp is set up', sortOrder: 0 },
          { id: 'film_parking', type: 'text', label: 'Crew Parking', required: false, placeholder: 'Parking instructions', sortOrder: 1 },
          { id: 'film_shuttle', type: 'text', label: 'Shuttle Service', required: false, placeholder: 'Shuttle pickup/dropoff', sortOrder: 2 },
          { id: 'film_talent_transport', type: 'textarea', label: 'Talent Transportation', required: false, placeholder: 'Actor pickup details...', sortOrder: 3 },
        ]
      },
      {
        id: 'section_equipment_film',
        name: 'Equipment',
        icon: '📷',
        sortOrder: 2,
        collapsible: true,
        fields: [
          { id: 'film_camera_rental', type: 'text', label: 'Camera Rental House', required: false, placeholder: 'Camera package source', sortOrder: 0 },
          { id: 'film_grip_rental', type: 'text', label: 'Grip & Electric', required: false, placeholder: 'G&E rental house', sortOrder: 1 },
          { id: 'film_special_equip', type: 'textarea', label: 'Special Equipment', required: false, placeholder: 'Steadicam, crane, drones...', sortOrder: 2 },
        ]
      },
      {
        id: 'section_permits_film',
        name: 'Permits & Insurance',
        icon: '📜',
        sortOrder: 3,
        collapsible: true,
        fields: [
          { id: 'film_permit', type: 'text', label: 'Filming Permit #', required: false, placeholder: 'Permit number', sortOrder: 0 },
          { id: 'film_insurance', type: 'text', label: 'Insurance Certificate', required: false, placeholder: 'COI number', sortOrder: 1 },
          { id: 'film_fire_safety', type: 'text', label: 'Fire Safety Officer', required: false, placeholder: 'Fire safety contact', sortOrder: 2 },
        ]
      },
      {
        id: 'section_comm_film',
        name: 'Communication',
        icon: '📻',
        sortOrder: 4,
        collapsible: true,
        fields: [
          { id: 'film_walkie_ch1', type: 'text', label: 'Channel 1 (Production)', required: false, placeholder: 'Main production channel', sortOrder: 0 },
          { id: 'film_walkie_ch2', type: 'text', label: 'Channel 2 (Camera)', required: false, placeholder: 'Camera department', sortOrder: 1 },
          { id: 'film_walkie_ch3', type: 'text', label: 'Channel 3 (Talent)', required: false, placeholder: 'Talent/AD channel', sortOrder: 2 },
          { id: 'film_emergency', type: 'tel', label: 'Production Office', required: false, placeholder: 'Office phone', sortOrder: 3 },
        ]
      },
    ]
  },
  {
    id: 'commercial_production',
    name: 'Commercial Shoot',
    description: 'Fast-paced commercial with client and agency coordination',
    productionType: 'commercial',
    customSections: [
      {
        id: 'section_client_comm',
        name: 'Client & Agency',
        icon: '👔',
        sortOrder: 0,
        collapsible: true,
        fields: [
          { id: 'comm_client', type: 'text', label: 'Client Name', required: false, placeholder: 'Brand/Client', sortOrder: 0 },
          { id: 'comm_agency', type: 'text', label: 'Agency', required: false, placeholder: 'Ad agency', sortOrder: 1 },
          { id: 'comm_client_contact', type: 'text', label: 'Client Contact', required: false, placeholder: 'Client representative', sortOrder: 2 },
          { id: 'comm_agency_producer', type: 'text', label: 'Agency Producer', required: false, placeholder: 'Agency producer name', sortOrder: 3 },
          { id: 'comm_video_village', type: 'text', label: 'Video Village Location', required: false, placeholder: 'Where client will view', sortOrder: 4 },
        ]
      },
      {
        id: 'section_meals_comm',
        name: 'Meals & Craft',
        icon: '🍽️',
        sortOrder: 1,
        collapsible: true,
        fields: [
          { id: 'comm_breakfast', type: 'time', label: 'Breakfast/Call', required: false, sortOrder: 0 },
          { id: 'comm_lunch', type: 'time', label: 'Lunch', required: false, sortOrder: 1 },
          { id: 'comm_catering', type: 'text', label: 'Catering', required: false, placeholder: 'Catering company', sortOrder: 2 },
        ]
      },
      {
        id: 'section_wardrobe_comm',
        name: 'Wardrobe & Styling',
        icon: '👗',
        sortOrder: 2,
        collapsible: true,
        fields: [
          { id: 'comm_wardrobe_call', type: 'time', label: 'Wardrobe Call', required: false, sortOrder: 0 },
          { id: 'comm_fitting_location', type: 'text', label: 'Fitting Location', required: false, placeholder: 'Where fittings happen', sortOrder: 1 },
          { id: 'comm_wardrobe_notes', type: 'textarea', label: 'Wardrobe Notes', required: false, placeholder: 'Special wardrobe requirements...', sortOrder: 2 },
        ]
      },
      {
        id: 'section_deliverables_comm',
        name: 'Deliverables',
        icon: '📦',
        sortOrder: 3,
        collapsible: true,
        fields: [
          { id: 'comm_formats', type: 'checkbox', label: 'Formats Required', required: false, options: [':30 TV', ':15 TV', ':06 Bumper', 'Social 1:1', 'Social 9:16', 'Social 16:9'], sortOrder: 0 },
          { id: 'comm_delivery_date', type: 'date', label: 'Delivery Date', required: false, sortOrder: 1 },
        ]
      },
    ]
  },
  {
    id: 'documentary_production',
    name: 'Documentary',
    description: 'Documentary shoot with interview and location logistics',
    productionType: 'documentary',
    customSections: [
      {
        id: 'section_interviews_doc',
        name: 'Interview Schedule',
        icon: '🎤',
        sortOrder: 0,
        collapsible: true,
        fields: [
          { id: 'doc_int1_name', type: 'text', label: 'Interview 1 - Subject', required: false, placeholder: 'Interviewee name', sortOrder: 0 },
          { id: 'doc_int1_time', type: 'time', label: 'Interview 1 - Time', required: false, sortOrder: 1 },
          { id: 'doc_int2_name', type: 'text', label: 'Interview 2 - Subject', required: false, placeholder: 'Interviewee name', sortOrder: 2 },
          { id: 'doc_int2_time', type: 'time', label: 'Interview 2 - Time', required: false, sortOrder: 3 },
          { id: 'doc_release_forms', type: 'select', label: 'Release Forms', required: false, options: ['Obtained', 'Pending', 'N/A'], sortOrder: 4 },
        ]
      },
      {
        id: 'section_broll_doc',
        name: 'B-Roll & Locations',
        icon: '🎬',
        sortOrder: 1,
        collapsible: true,
        fields: [
          { id: 'doc_broll_list', type: 'textarea', label: 'B-Roll Shot List', required: false, placeholder: 'List of B-roll needed...', sortOrder: 0 },
          { id: 'doc_location_access', type: 'textarea', label: 'Location Access Notes', required: false, placeholder: 'Access permissions, contacts...', sortOrder: 1 },
        ]
      },
      {
        id: 'section_equip_doc',
        name: 'Equipment',
        icon: '📷',
        sortOrder: 2,
        collapsible: true,
        fields: [
          { id: 'doc_camera', type: 'text', label: 'Camera Package', required: false, placeholder: 'Main camera setup', sortOrder: 0 },
          { id: 'doc_audio', type: 'text', label: 'Audio Setup', required: false, placeholder: 'Lav mics, boom, recorder', sortOrder: 1 },
          { id: 'doc_lighting', type: 'text', label: 'Interview Lighting', required: false, placeholder: 'Light kit details', sortOrder: 2 },
        ]
      },
      {
        id: 'section_media_doc',
        name: 'Media & Archival',
        icon: '💾',
        sortOrder: 3,
        collapsible: true,
        fields: [
          { id: 'doc_media_manager', type: 'text', label: 'Media Manager', required: false, placeholder: 'Who handles data', sortOrder: 0 },
          { id: 'doc_archival_footage', type: 'textarea', label: 'Archival Footage Needed', required: false, placeholder: 'Historical footage requirements...', sortOrder: 1 },
        ]
      },
    ]
  },
  {
    id: 'music_video_production',
    name: 'Music Video',
    description: 'Music video production with performance and concept details',
    productionType: 'music_video',
    customSections: [
      {
        id: 'section_artist_mv',
        name: 'Artist & Track',
        icon: '🎵',
        sortOrder: 0,
        collapsible: true,
        fields: [
          { id: 'mv_artist', type: 'text', label: 'Artist/Band', required: false, placeholder: 'Artist name', sortOrder: 0 },
          { id: 'mv_track', type: 'text', label: 'Song Title', required: false, placeholder: 'Track name', sortOrder: 1 },
          { id: 'mv_label', type: 'text', label: 'Record Label', required: false, placeholder: 'Label name', sortOrder: 2 },
          { id: 'mv_manager', type: 'text', label: 'Artist Manager', required: false, placeholder: 'Manager contact', sortOrder: 3 },
        ]
      },
      {
        id: 'section_playback_mv',
        name: 'Playback & Performance',
        icon: '🔊',
        sortOrder: 1,
        collapsible: true,
        fields: [
          { id: 'mv_playback_eng', type: 'text', label: 'Playback Engineer', required: false, placeholder: 'Audio playback person', sortOrder: 0 },
          { id: 'mv_playback_source', type: 'select', label: 'Playback Source', required: false, options: ['Laptop', 'Phone', 'PA System', 'In-Ear Monitor'], sortOrder: 1 },
          { id: 'mv_performance_type', type: 'checkbox', label: 'Performance Types', required: false, options: ['Lip Sync', 'Live Performance', 'Narrative/Acting', 'Dance Choreography'], sortOrder: 2 },
        ]
      },
      {
        id: 'section_looks_mv',
        name: 'Looks & Setups',
        icon: '✨',
        sortOrder: 2,
        collapsible: true,
        fields: [
          { id: 'mv_look1', type: 'text', label: 'Look 1', required: false, placeholder: 'Describe look/setup', sortOrder: 0 },
          { id: 'mv_look2', type: 'text', label: 'Look 2', required: false, placeholder: 'Describe look/setup', sortOrder: 1 },
          { id: 'mv_look3', type: 'text', label: 'Look 3', required: false, placeholder: 'Describe look/setup', sortOrder: 2 },
          { id: 'mv_choreo', type: 'text', label: 'Choreographer', required: false, placeholder: 'If applicable', sortOrder: 3 },
        ]
      },
      {
        id: 'section_glam_mv',
        name: 'Hair, Makeup & Wardrobe',
        icon: '💄',
        sortOrder: 3,
        collapsible: true,
        fields: [
          { id: 'mv_glam_call', type: 'time', label: 'Glam Call Time', required: false, sortOrder: 0 },
          { id: 'mv_glam_location', type: 'text', label: 'Glam Location', required: false, placeholder: 'Where artist gets ready', sortOrder: 1 },
          { id: 'mv_wardrobe_changes', type: 'number', label: 'Number of Wardrobe Changes', required: false, sortOrder: 2 },
        ]
      },
    ]
  },
];

// Keep the old array for backwards compatibility
export const DEFAULT_CALLSHEET_TEMPLATES: CallSheetTemplate[] = PRODUCTION_TYPE_TEMPLATES;

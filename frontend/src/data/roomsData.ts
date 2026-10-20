export interface RoomAsset {
  room_id: string;
  category: "living-room" | "bedroom" | "dining-room" | "home-office" | "entryway";
  name: string;
  image_url: string;
  dimensions: string;
  lighting: string;
  flooring: string;
  description: string;
}

export const ROOM_CATEGORIES = [
  { id: "living-room", label: "Living Room", count: 2 },
  { id: "bedroom", label: "Bedroom", count: 2 },
  { id: "dining-room", label: "Dining Room", count: 2 },
  { id: "home-office", label: "Home Office", count: 2 },
  { id: "entryway", label: "Entryway & Foyer", count: 2 },
] as const;

export const ROOM_ASSETS: RoomAsset[] = [
  // Living Rooms
  {
    room_id: "room-living-01",
    category: "living-room",
    name: "Stockholm Sunlit Salon",
    image_url: "/rooms/living_01.jpg",
    dimensions: "6.2m x 4.8m (29.8 m²)",
    lighting: "Southwest daylight with late afternoon sun",
    flooring: "Bleached Scandinavian Ash Planks",
    description: "Expansive airy space with high ceilings, warm plaster walls, and generous natural daylight floor plane."
  },
  {
    room_id: "room-living-02",
    category: "living-room",
    name: "Nordic Minimalist Living Room",
    image_url: "/rooms/living_02.jpg",
    dimensions: "5.5m x 4.2m (23.1 m²)",
    lighting: "Soft ambient diffused daylight",
    flooring: "Natural Oak Parquet with matte finish",
    description: "Restrained architectural salon featuring floor-to-ceiling windows and deep negative space for lounge seating."
  },

  // Bedrooms
  {
    room_id: "room-bedroom-01",
    category: "bedroom",
    name: "Copenhagen Linen Suite",
    image_url: "/rooms/bedroom_01.jpg",
    dimensions: "4.8m x 4.0m (19.2 m²)",
    lighting: "Soft morning window wash",
    flooring: "Warm Danish Douglas Fir",
    description: "Quiet sanctuary with natural ivory limewash walls, ideal for low-profile beds and tactile bouclé benches."
  },
  {
    room_id: "room-bedroom-02",
    category: "bedroom",
    name: "Gothenburg Neutral Bedroom",
    image_url: "/rooms/bedroom_02.jpg",
    dimensions: "4.5m x 3.8m (17.1 m²)",
    lighting: "Gentle northern exposure",
    flooring: "Light Natural Oak Planks",
    description: "Understated residential suite with minimal shadow gradients and ample wall space."
  },

  // Dining Rooms
  {
    room_id: "room-dining-01",
    category: "dining-room",
    name: "Aarhus Hardwood Dining Hall",
    image_url: "/rooms/dining_01.jpg",
    dimensions: "5.8m x 4.5m (26.1 m²)",
    lighting: "Direct architectural illumination & skylight",
    flooring: "Smoked Solid Oak Boards",
    description: "Generously proportioned dining area with deep perspective lines to stage dining tables and sculptured chairs."
  },
  {
    room_id: "room-dining-02",
    category: "dining-room",
    name: "Malmö Natural Oak Dining Space",
    image_url: "/rooms/dining_02.jpg",
    dimensions: "5.0m x 3.9m (19.5 m²)",
    lighting: "Morning courtyard reflection",
    flooring: "Natural Birch Herringbone",
    description: "Intimate Scandinavian dining alcove with textured lime plaster walls."
  },

  // Home Offices
  {
    room_id: "room-office-01",
    category: "home-office",
    name: "Oslo Atelier Workspace",
    image_url: "/rooms/office_01.jpg",
    dimensions: "4.2m x 3.6m (15.1 m²)",
    lighting: "Even workspace illumination from corner glazing",
    flooring: "Natural Matte Oak",
    description: "Focused creative workspace with clean sightlines and ample clearance for desks and ergonomic seating."
  },
  {
    room_id: "room-office-02",
    category: "home-office",
    name: "Bergen Architectural Studio",
    image_url: "/rooms/office_02.jpg",
    dimensions: "4.6m x 3.8m (17.5 m²)",
    lighting: "Balanced overhead skylight & window bounce",
    flooring: "Polished Sandstone Microcement",
    description: "Modern atelier with architectural shelving niches and refined acoustic qualities."
  },

  // Entryway & Foyer
  {
    room_id: "room-entryway-01",
    category: "entryway",
    name: "Helsinki Plaster Foyer",
    image_url: "/rooms/entryway_01.jpg",
    dimensions: "3.5m x 2.8m (9.8 m²)",
    lighting: "Soft warm transitional ambient light",
    flooring: "Honed Swedish Limestone",
    description: "Welcoming entryway vestibule with clean vertical lines for benches, consoles, and storage."
  },
  {
    room_id: "room-entryway-02",
    category: "entryway",
    name: "Uppsala Timber Vestibule",
    image_url: "/rooms/entryway_02.jpg",
    dimensions: "3.8m x 2.6m (9.9 m²)",
    lighting: "Natural doorway sidelight",
    flooring: "Solid Oak Herringbone",
    description: "Architectural foyer with natural timber accents and warm neutral plaster surfaces."
  },
];

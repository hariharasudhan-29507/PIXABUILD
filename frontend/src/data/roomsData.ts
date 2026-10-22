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
  { id: "all", label: "All Rooms", count: 7 },
  { id: "living-room", label: "Living Room", count: 3 },
  { id: "bedroom", label: "Bedroom", count: 1 },
  { id: "dining-room", label: "Dining Room", count: 1 },
  { id: "home-office", label: "Home Office", count: 1 },
  { id: "entryway", label: "Entryway & Foyer", count: 1 },
] as const;

export const ROOM_ASSETS: RoomAsset[] = [
  {
    room_id: "room-01",
    category: "living-room",
    name: "Room 1 - Scandinavian Living Space",
    image_url: "/rooms/room1.webp",
    dimensions: "5.8m x 4.4m (25.5 m²)",
    lighting: "Warm ambient daylight with soft floor bounce",
    flooring: "Natural Ash Hardwood Flooring",
    description: "Open contemporary layout with expansive floor plane, ideal for seating arrangements and spatial visualization."
  },
  {
    room_id: "room-02",
    category: "bedroom",
    name: "Room 2 - Modern Master Suite",
    image_url: "/rooms/room2.webp",
    dimensions: "5.2m x 4.0m (20.8 m²)",
    lighting: "Diffused morning architectural light",
    flooring: "Warm Matte Douglas Fir Planks",
    description: "Serene bedroom sanctuary with clean sightlines and ample clearance for platform bedframes and storage."
  },
  {
    room_id: "room-03",
    category: "living-room",
    name: "Room 3 - Warm Oak Architectural Salon",
    image_url: "/rooms/room3.webp",
    dimensions: "6.0m x 4.6m (27.6 m²)",
    lighting: "Balanced afternoon sunlight wash",
    flooring: "Natural Oak Parquet with subtle grain",
    description: "Refined minimalist living room featuring balanced perspective vanishing points for realistic furniture staging."
  },
  {
    room_id: "room-04",
    category: "home-office",
    name: "Room 4 - Bright Contemporary Studio",
    image_url: "/rooms/room4.webp",
    dimensions: "4.5m x 3.8m (17.1 m²)",
    lighting: "Even studio illumination from corner glazing",
    flooring: "Bleached Scandinavian Pine Planks",
    description: "Modern atelier workspace optimized for ergonomic desk setups, display cabinets, and lounge seating."
  },
  {
    room_id: "room-05",
    category: "dining-room",
    name: "Room 5 - Dining & Lounge Alcove",
    image_url: "/rooms/room5.webp",
    dimensions: "5.0m x 4.2m (21.0 m²)",
    lighting: "Atmospheric natural daylight and perimeter wash",
    flooring: "Smoked Oak Hardwood Flooring",
    description: "Harmonious dining and social area with deep perspective lines for table suites and sculptural chairs."
  },
  {
    room_id: "room-06",
    category: "living-room",
    name: "Room 6 - Sunlit Gallery Interior",
    image_url: "/rooms/room6.webp",
    dimensions: "5.6m x 4.5m (25.2 m²)",
    lighting: "Direct sunlit floor pool with clean shadow edges",
    flooring: "Natural Ash Engineered Timber",
    description: "Architectural salon space featuring high ceilings, warm plaster walls, and generous negative space."
  },
  {
    room_id: "room-07",
    category: "entryway",
    name: "Room 7 - Neutral Foyer & Vestibule",
    image_url: "/rooms/room7.webp",
    dimensions: "4.2m x 3.2m (13.4 m²)",
    lighting: "Soft ambient sidelight",
    flooring: "Honed Limestone & Hardwood Inset",
    description: "Sophisticated entry gallery suited for accent consoles, armchairs, and architectural storage elements."
  }
];

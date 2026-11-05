export interface RoomFloorBoundary {
  floorMinY: number;   // Y where back wall baseboard ends and floor begins (0.0 to 1.0)
  floorMaxY: number;   // Maximum Y (near bottom viewport)
  minX?: number;       // Leftmost floor boundary (excluding side walls / windows)
  maxX?: number;       // Rightmost floor boundary (excluding side walls)
  leftWallMaxX: number; // X boundary of left wall
  rightWallMinX: number; // X boundary of right wall
}

export interface WallOrientationResult {
  zone: "left_wall" | "right_wall" | "back_wall" | "open_floor";
  yawAngleDeg: number;
  label: string;
  description: string;
}

export interface FloorValidationResult {
  isValid: boolean;
  reason?: string;
  suggestedPoint?: { x: number; y: number };
}

export interface RoomAsset {
  room_id: string;
  category: "living-room" | "bedroom" | "dining-room" | "home-office" | "entryway";
  name: string;
  image_url: string;
  dimensions: string;
  lighting: string;
  flooring: string;
  description: string;
  floorBoundary: RoomFloorBoundary;
}

export const DEFAULT_FLOOR_BOUNDARY: RoomFloorBoundary = {
  floorMinY: 0.65,
  floorMaxY: 0.95,
  minX: 0.16,
  maxX: 0.84,
  leftWallMaxX: 0.35,
  rightWallMinX: 0.68,
};

export function validateFloorSelection(
  x: number,
  y: number,
  boundary: RoomFloorBoundary = DEFAULT_FLOOR_BOUNDARY
): FloorValidationResult {
  const minX = boundary.minX ?? 0.16;
  const maxX = boundary.maxX ?? 0.84;
  const minY = boundary.floorMinY;
  const maxY = boundary.floorMaxY ?? 0.95;

  if (y < minY) {
    return {
      isValid: false,
      reason: "The point you selected is on the vertical wall or window area. Furniture can only be positioned on the walkable floor plane.",
      suggestedPoint: {
        x: Math.max(minX + 0.05, Math.min(maxX - 0.05, x)),
        y: Math.min(maxY - 0.05, minY + 0.06),
      },
    };
  }

  if (y > maxY) {
    return {
      isValid: false,
      reason: "The point is outside the safe floor boundary. Please select a position further into the room.",
      suggestedPoint: {
        x: Math.max(minX + 0.05, Math.min(maxX - 0.05, x)),
        y: maxY - 0.04,
      },
    };
  }

  if (x < minX) {
    return {
      isValid: false,
      reason: "The point you selected is on the left architectural wall or window structure. Please click on the open floor plane.",
      suggestedPoint: {
        x: minX + 0.06,
        y: Math.max(minY + 0.04, Math.min(maxY - 0.04, y)),
      },
    };
  }

  if (x > maxX) {
    return {
      isValid: false,
      reason: "The point you selected is on the right perimeter wall. Please click on the open floor plane.",
      suggestedPoint: {
        x: maxX - 0.06,
        y: Math.max(minY + 0.04, Math.min(maxY - 0.04, y)),
      },
    };
  }

  return { isValid: true };
}

export function getWallOrientation(
  x: number,
  y: number,
  boundary: RoomFloorBoundary = DEFAULT_FLOOR_BOUNDARY
): WallOrientationResult {
  const isNearLeft = x <= boundary.leftWallMaxX;
  const isNearRight = x >= boundary.rightWallMinX;
  const isNearBack = y <= boundary.floorMinY + 0.12;

  if (isNearLeft) {
    return {
      zone: "left_wall",
      yawAngleDeg: 35,
      label: "Left Wall (Facing Center)",
      description: "Oriented along left wall (facing inward-right toward room center)",
    };
  } else if (isNearRight) {
    return {
      zone: "right_wall",
      yawAngleDeg: -35,
      label: "Right Wall (Facing Center)",
      description: "Oriented along right wall (facing inward-left toward room center)",
    };
  } else if (isNearBack) {
    return {
      zone: "back_wall",
      yawAngleDeg: 0,
      label: "Back Wall (Center-Oriented)",
      description: "Center-oriented parallel to back wall (facing straight forward)",
    };
  } else {
    return {
      zone: "open_floor",
      yawAngleDeg: 0,
      label: "Center-Oriented Layout",
      description: "Central floor placement (facing straight forward toward camera)",
    };
  }
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
    description: "Open contemporary layout with expansive floor plane, ideal for seating arrangements and spatial visualization.",
    floorBoundary: {
      floorMinY: 0.72,
      floorMaxY: 0.95,
      minX: 0.22,
      maxX: 0.82,
      leftWallMaxX: 0.38,
      rightWallMinX: 0.68,
    },
  },
  {
    room_id: "room-02",
    category: "bedroom",
    name: "Room 2 - Modern Master Suite",
    image_url: "/rooms/room2.webp",
    dimensions: "5.2m x 4.0m (20.8 m²)",
    lighting: "Diffused morning architectural light",
    flooring: "Warm Matte Douglas Fir Planks",
    description: "Serene bedroom sanctuary with clean sightlines and ample clearance for platform bedframes and storage.",
    floorBoundary: {
      floorMinY: 0.70,
      floorMaxY: 0.95,
      minX: 0.16,
      maxX: 0.84,
      leftWallMaxX: 0.35,
      rightWallMinX: 0.68,
    },
  },
  {
    room_id: "room-03",
    category: "living-room",
    name: "Room 3 - Warm Oak Architectural Salon",
    image_url: "/rooms/room3.webp",
    dimensions: "6.0m x 4.6m (27.6 m²)",
    lighting: "Balanced afternoon sunlight wash",
    flooring: "Natural Oak Parquet with subtle grain",
    description: "Refined minimalist living room featuring balanced perspective vanishing points for realistic furniture staging.",
    floorBoundary: {
      floorMinY: 0.68,
      floorMaxY: 0.95,
      minX: 0.16,
      maxX: 0.84,
      leftWallMaxX: 0.34,
      rightWallMinX: 0.68,
    },
  },
  {
    room_id: "room-04",
    category: "home-office",
    name: "Room 4 - Bright Contemporary Studio",
    image_url: "/rooms/room4.webp",
    dimensions: "4.5m x 3.8m (17.1 m²)",
    lighting: "Even studio illumination from corner glazing",
    flooring: "Bleached Scandinavian Pine Planks",
    description: "Modern atelier workspace optimized for ergonomic desk setups, display cabinets, and lounge seating.",
    floorBoundary: {
      floorMinY: 0.66,
      floorMaxY: 0.95,
      minX: 0.18,
      maxX: 0.82,
      leftWallMaxX: 0.36,
      rightWallMinX: 0.66,
    },
  },
  {
    room_id: "room-05",
    category: "dining-room",
    name: "Room 5 - Dining & Lounge Alcove",
    image_url: "/rooms/room5.webp",
    dimensions: "5.0m x 4.2m (21.0 m²)",
    lighting: "Atmospheric natural daylight and perimeter wash",
    flooring: "Smoked Oak Hardwood Flooring",
    description: "Harmonious dining and social area with deep perspective lines for table suites and sculptural chairs.",
    floorBoundary: {
      floorMinY: 0.66,
      floorMaxY: 0.95,
      minX: 0.18,
      maxX: 0.82,
      leftWallMaxX: 0.34,
      rightWallMinX: 0.68,
    },
  },
  {
    room_id: "room-06",
    category: "living-room",
    name: "Room 6 - Sunlit Gallery Interior",
    image_url: "/rooms/room6.webp",
    dimensions: "5.6m x 4.5m (25.2 m²)",
    lighting: "Direct sunlit floor pool with clean shadow edges",
    flooring: "Natural Ash Engineered Timber",
    description: "Architectural salon space featuring high ceilings, warm plaster walls, and generous negative space.",
    floorBoundary: {
      floorMinY: 0.72,
      floorMaxY: 0.95,
      minX: 0.18,
      maxX: 0.84,
      leftWallMaxX: 0.36,
      rightWallMinX: 0.68,
    },
  },
  {
    room_id: "room-07",
    category: "entryway",
    name: "Room 7 - Neutral Foyer & Vestibule",
    image_url: "/rooms/room7.webp",
    dimensions: "4.2m x 3.2m (13.4 m²)",
    lighting: "Soft ambient sidelight",
    flooring: "Honed Limestone & Hardwood Inset",
    description: "Sophisticated entry gallery suited for accent consoles, armchairs, and architectural storage elements.",
    floorBoundary: {
      floorMinY: 0.64,
      floorMaxY: 0.95,
      minX: 0.16,
      maxX: 0.84,
      leftWallMaxX: 0.35,
      rightWallMinX: 0.68,
    },
  },
];

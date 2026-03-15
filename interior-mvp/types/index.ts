export interface RoomDimensions {
  width: number;
  length: number;
  height: number;
}

export interface RoomFeature {
  type: 'door' | 'window';
  wall: 'north' | 'south' | 'east' | 'west';
  position: number; // 0~1 비율
  width: number;
  height?: number;
}

export interface RoomData {
  dimensions: RoomDimensions;
  features: RoomFeature[];
  description?: string;
}

export type FurnitureCategory =
  | 'sofa'
  | 'table'
  | 'chair'
  | 'bed'
  | 'desk'
  | 'wardrobe'
  | 'shelf'
  | 'etc';

export interface FurnitureDimensions {
  width: number;
  depth: number;
  height: number;
}

export interface FurnitureItem {
  id: string;
  name: string;
  category: FurnitureCategory;
  dimensions: FurnitureDimensions;
  color: string;
  position: { x: number; y: number; z: number };
  rotation: number; // y축 회전(라디안)
}

export interface RoomState {
  room: RoomData | null;
  furniture: FurnitureItem[];
  selectedFurnitureId: string | null;
  isAnalyzing: boolean;
  aiAdvice: string;
  isLoadingAdvice: boolean;
  setRoom: (room: RoomData) => void;
  addFurniture: (item: FurnitureItem) => void;
  updateFurniture: (id: string, updates: Partial<FurnitureItem>) => void;
  removeFurniture: (id: string) => void;
  selectFurniture: (id: string | null) => void;
  setAnalyzing: (v: boolean) => void;
  setAiAdvice: (advice: string) => void;
  setLoadingAdvice: (v: boolean) => void;
}

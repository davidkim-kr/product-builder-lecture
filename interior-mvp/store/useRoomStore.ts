import { create } from 'zustand';
import { RoomState, RoomData, FurnitureItem } from '@/types';

export const useRoomStore = create<RoomState>((set) => ({
  room: null,
  furniture: [],
  selectedFurnitureId: null,
  isAnalyzing: false,
  aiAdvice: '',
  isLoadingAdvice: false,

  setRoom: (room: RoomData) => set({ room }),

  addFurniture: (item: FurnitureItem) =>
    set((state) => ({ furniture: [...state.furniture, item] })),

  updateFurniture: (id: string, updates: Partial<FurnitureItem>) =>
    set((state) => ({
      furniture: state.furniture.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    })),

  removeFurniture: (id: string) =>
    set((state) => ({
      furniture: state.furniture.filter((f) => f.id !== id),
      selectedFurnitureId:
        state.selectedFurnitureId === id ? null : state.selectedFurnitureId,
    })),

  selectFurniture: (id: string | null) => set({ selectedFurnitureId: id }),

  setAnalyzing: (v: boolean) => set({ isAnalyzing: v }),

  setAiAdvice: (advice: string) => set({ aiAdvice: advice }),

  setLoadingAdvice: (v: boolean) => set({ isLoadingAdvice: v }),
}));

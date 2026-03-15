'use client';

import { useRef, useState, DragEvent } from 'react';
import { useRoomStore } from '@/store/useRoomStore';
import { FurnitureItem, FurnitureCategory } from '@/types';

const CATEGORY_LABELS: Record<FurnitureCategory, string> = {
  sofa: '소파',
  table: '테이블',
  chair: '의자',
  bed: '침대',
  desk: '책상',
  wardrobe: '옷장',
  shelf: '선반',
  etc: '기타',
};

const CATEGORY_COLORS: Record<FurnitureCategory, string> = {
  sofa: '#6366f1',
  table: '#f59e0b',
  chair: '#10b981',
  bed: '#3b82f6',
  desk: '#8b5cf6',
  wardrobe: '#ef4444',
  shelf: '#f97316',
  etc: '#6b7280',
};

const DEFAULT_FURNITURE: Array<{
  name: string;
  category: FurnitureCategory;
  dimensions: { width: number; depth: number; height: number };
}> = [
  { name: '2인 소파', category: 'sofa', dimensions: { width: 1.8, depth: 0.85, height: 0.85 } },
  { name: '원형 테이블', category: 'table', dimensions: { width: 1.0, depth: 1.0, height: 0.75 } },
  { name: '의자', category: 'chair', dimensions: { width: 0.5, depth: 0.5, height: 0.9 } },
  { name: '싱글 침대', category: 'bed', dimensions: { width: 1.0, depth: 2.0, height: 0.5 } },
  { name: '책상', category: 'desk', dimensions: { width: 1.2, depth: 0.6, height: 0.75 } },
  { name: '옷장', category: 'wardrobe', dimensions: { width: 1.2, depth: 0.6, height: 1.8 } },
];

export default function FurniturePanel() {
  const { room, furniture, selectedFurnitureId, addFurniture, removeFurniture, updateFurniture, selectFurniture } =
    useRoomStore();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const createFurnitureItem = (
    name: string,
    category: FurnitureCategory,
    dimensions: { width: number; depth: number; height: number },
    color: string
  ): FurnitureItem => ({
    id: `furniture-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name,
    category,
    dimensions,
    color,
    position: { x: 0, y: dimensions.height / 2, z: 0 },
    rotation: 0,
  });

  const handleAddDefault = (preset: typeof DEFAULT_FURNITURE[number]) => {
    if (!room) return;
    const item = createFurnitureItem(
      preset.name,
      preset.category,
      preset.dimensions,
      CATEGORY_COLORS[preset.category]
    );
    addFurniture(item);
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/analyze-furniture', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '분석 실패');
      }

      const data = await res.json();
      const item = createFurnitureItem(data.name, data.category, data.dimensions, data.color);
      addFurniture(item);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file);
  };

  const selectedItem = furniture.find((f) => f.id === selectedFurnitureId);

  return (
    <div className="space-y-4">
      {/* 가구 사진 업로드 */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-2">📸 가구 사진으로 추가</h3>
        <div
          className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
            isDragOver ? 'border-indigo-400 bg-indigo-900/20' : 'border-gray-600 hover:border-gray-400'
          } ${!room ? 'opacity-50 pointer-events-none' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => room && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
          />
          <div className="text-gray-400 text-sm">
            {isUploading ? (
              <div className="flex items-center justify-center gap-2 text-indigo-400">
                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                GPT-4o가 분석 중...
              </div>
            ) : (
              <>
                <span className="text-xl">🛋️</span>
                <p className="mt-1">가구 사진 드래그 또는 클릭</p>
              </>
            )}
          </div>
        </div>
        {uploadError && (
          <p className="text-red-400 text-xs mt-1 bg-red-900/20 p-1 rounded">{uploadError}</p>
        )}
      </div>

      {/* 기본 가구 프리셋 */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-2">🪑 기본 가구 추가</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {DEFAULT_FURNITURE.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleAddDefault(preset)}
              disabled={!room}
              className="flex items-center gap-2 p-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-left transition-colors"
            >
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[preset.category] }}
              />
              <span className="text-xs text-gray-300 truncate">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 배치된 가구 목록 */}
      {furniture.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-2">
            📋 배치된 가구 ({furniture.length}개)
          </h3>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {furniture.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                  selectedFurnitureId === item.id
                    ? 'bg-indigo-900/40 border border-indigo-500/50'
                    : 'bg-gray-700/50 hover:bg-gray-700'
                }`}
                onClick={() => selectFurniture(item.id === selectedFurnitureId ? null : item.id)}
              >
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.dimensions.width}×{item.dimensions.depth}m
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFurniture(item.id); }}
                  className="text-gray-500 hover:text-red-400 transition-colors text-sm"
                  title="삭제"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 선택된 가구 컨트롤 */}
      {selectedItem && (
        <div className="border border-indigo-500/30 rounded-lg p-3 bg-indigo-900/10">
          <h3 className="text-sm font-medium text-indigo-300 mb-2">
            🎛️ {selectedItem.name} 조정
          </h3>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-400">회전 (°)</label>
              <input
                type="range"
                min={0}
                max={360}
                value={Math.round((selectedItem.rotation * 180) / Math.PI)}
                onChange={(e) =>
                  updateFurniture(selectedItem.id, {
                    rotation: (Number(e.target.value) * Math.PI) / 180,
                  })
                }
                className="w-full h-1.5 mt-1 accent-indigo-500"
              />
              <span className="text-xs text-gray-400">
                {Math.round((selectedItem.rotation * 180) / Math.PI)}°
              </span>
            </div>
            <button
              onClick={() => removeFurniture(selectedItem.id)}
              className="w-full py-1.5 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded transition-colors"
            >
              🗑️ 삭제
            </button>
          </div>
        </div>
      )}

      {!room && (
        <p className="text-xs text-gray-500 text-center">평면도를 먼저 업로드하세요</p>
      )}
    </div>
  );
}

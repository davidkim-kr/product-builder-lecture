'use client';

import { useRef, useState, DragEvent } from 'react';
import { useRoomStore } from '@/store/useRoomStore';
import { RoomData } from '@/types';

export default function FloorUploader() {
  const { setRoom, setAnalyzing, isAnalyzing } = useRoomStore();
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setError(null);
    setPreview(URL.createObjectURL(file));
    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/analyze-floor', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '분석 실패');
      }

      const roomData: RoomData = await res.json();
      setRoom(roomData);
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleUseDefault = () => {
    // 기본 방 데이터 (API 없이 테스트용)
    const defaultRoom: RoomData = {
      dimensions: { width: 4, length: 5, height: 2.4 },
      features: [
        { type: 'door', wall: 'south', position: 0.5, width: 0.9 },
        { type: 'window', wall: 'north', position: 0.5, width: 1.2 },
      ],
      description: '기본 원룸 (4m × 5m)',
    };
    setRoom(defaultRoom);
  };

  return (
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-indigo-400 bg-indigo-900/20'
            : 'border-gray-600 hover:border-gray-400'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {preview ? (
          <img src={preview} alt="평면도 미리보기" className="max-h-32 mx-auto rounded object-contain" />
        ) : (
          <div className="text-gray-400">
            <div className="text-3xl mb-2">📐</div>
            <p className="text-sm">평면도 이미지를 드래그하거나 클릭하여 업로드</p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP 지원</p>
          </div>
        )}
      </div>

      {isAnalyzing && (
        <div className="flex items-center gap-2 text-indigo-400 text-sm">
          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          Claude AI가 평면도를 분석하고 있습니다...
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded">{error}</p>
      )}

      <button
        onClick={handleUseDefault}
        className="w-full py-2 px-3 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors"
      >
        기본 방 사용 (4m × 5m)
      </button>
    </div>
  );
}

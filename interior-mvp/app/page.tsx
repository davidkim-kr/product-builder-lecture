'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import FloorUploader from '@/components/FloorUploader';
import FurniturePanel from '@/components/FurniturePanel';
import AIAdvicePanel from '@/components/AIAdvicePanel';
import { useRoomStore } from '@/store/useRoomStore';

// Three.js는 SSR 비호환이므로 dynamic import
const RoomViewer3D = dynamic(() => import('@/components/RoomViewer3D'), { ssr: false });

type TabType = 'floor' | 'furniture' | 'advice';

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: 'floor', label: '평면도', icon: '📐' },
  { id: 'furniture', label: '가구', icon: '🛋️' },
  { id: 'advice', label: 'AI 조언', icon: '✨' },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('floor');
  const { room, furniture } = useRoomStore();

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* 헤더 */}
      <header className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏠</span>
          <div>
            <h1 className="text-lg font-bold text-white">인테리어 시뮬레이터</h1>
            <p className="text-xs text-gray-400">AI 기반 가구 배치 시뮬레이션</p>
          </div>
        </div>
        {room && (
          <div className="text-xs text-gray-400 bg-gray-800 px-3 py-1.5 rounded-full">
            {room.dimensions.width}m × {room.dimensions.length}m · 가구 {furniture.length}개
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>
        {/* 사이드바 */}
        <aside className="w-72 border-r border-gray-800 flex flex-col bg-gray-900">
          {/* 탭 */}
          <div className="flex border-b border-gray-800">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-800 text-white border-b-2 border-indigo-500'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <div>{tab.icon}</div>
                <div>{tab.label}</div>
              </button>
            ))}
          </div>

          {/* 탭 콘텐츠 */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'floor' && (
              <div>
                <h2 className="text-sm font-semibold text-gray-200 mb-3">
                  📐 평면도 업로드
                </h2>
                <FloorUploader />

                {room && (
                  <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                    <h3 className="text-xs font-medium text-gray-300 mb-2">방 정보</h3>
                    <div className="space-y-1 text-xs text-gray-400">
                      <p>크기: {room.dimensions.width}m × {room.dimensions.length}m × {room.dimensions.height}m</p>
                      {room.description && <p>설명: {room.description}</p>}
                      <p>문/창문: {room.features.length}개</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'furniture' && (
              <div>
                <h2 className="text-sm font-semibold text-gray-200 mb-3">
                  🛋️ 가구 관리
                </h2>
                <FurniturePanel />
              </div>
            )}

            {activeTab === 'advice' && (
              <div>
                <h2 className="text-sm font-semibold text-gray-200 mb-3">
                  ✨ AI 인테리어 조언
                </h2>
                <AIAdvicePanel />
              </div>
            )}
          </div>

          {/* 사용 안내 */}
          <div className="p-3 border-t border-gray-800 bg-gray-800/30">
            <p className="text-xs text-gray-500">
              💡 3D 뷰어: 드래그로 회전 · 스크롤로 줌 · 우클릭으로 이동
            </p>
            <p className="text-xs text-gray-500 mt-1">
              🖱️ 가구 클릭 후 드래그로 위치 이동
            </p>
          </div>
        </aside>

        {/* 3D 뷰어 */}
        <main className="flex-1 relative">
          <RoomViewer3D />
        </main>
      </div>
    </div>
  );
}

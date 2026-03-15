'use client';

import { useRoomStore } from '@/store/useRoomStore';

export default function AIAdvicePanel() {
  const { room, furniture, aiAdvice, isLoadingAdvice, setAiAdvice, setLoadingAdvice } =
    useRoomStore();

  const handleGetAdvice = async () => {
    if (!room) return;

    setLoadingAdvice(true);
    setAiAdvice('');

    try {
      const res = await fetch('/api/ai-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room, furniture }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '조언 생성 실패');
      }

      const data = await res.json();
      setAiAdvice(data.advice);
    } catch (e) {
      setAiAdvice(`오류: ${e instanceof Error ? e.message : '알 수 없는 오류'}`);
    } finally {
      setLoadingAdvice(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleGetAdvice}
        disabled={!room || isLoadingAdvice}
        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isLoadingAdvice ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            AI 분석 중...
          </>
        ) : (
          <>✨ AI 인테리어 조언 받기</>
        )}
      </button>

      {aiAdvice && (
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-indigo-400 text-sm font-medium">🤖 Claude AI 조언</span>
          </div>
          <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
            {aiAdvice}
          </div>
        </div>
      )}

      {!room && (
        <p className="text-xs text-gray-500 text-center">평면도를 먼저 업로드하세요</p>
      )}

      {room && !aiAdvice && !isLoadingAdvice && (
        <p className="text-xs text-gray-500 text-center">
          가구를 배치한 후 AI 조언을 받아보세요
        </p>
      )}
    </div>
  );
}

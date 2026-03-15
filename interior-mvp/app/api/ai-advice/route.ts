import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { room, furniture } = body;

    if (!room) {
      return NextResponse.json({ error: '방 정보가 필요합니다.' }, { status: 400 });
    }

    const furnitureList =
      furniture.length > 0
        ? furniture
            .map(
              (f: { name: string; category: string; dimensions: { width: number; depth: number; height: number }; position: { x: number; z: number } }) =>
                `- ${f.name}(${f.category}): ${f.dimensions.width}m x ${f.dimensions.depth}m x ${f.dimensions.height}m, 위치(${f.position.x.toFixed(1)}, ${f.position.z.toFixed(1)})`
            )
            .join('\n')
        : '가구 없음';

    const prompt = `다음 방 정보와 가구 배치를 분석하여 인테리어 조언을 한국어로 제공해주세요.

**방 정보:**
- 크기: ${room.dimensions.width}m × ${room.dimensions.length}m × ${room.dimensions.height}m
- 특징: ${room.description || '일반적인 방'}

**현재 가구 배치:**
${furnitureList}

**요청:**
1. 현재 배치의 장단점 분석
2. 동선 및 공간 활용 개선 제안
3. 추가 가구나 인테리어 팁 (2-3가지)

간결하게 한국어로 답변해주세요.`;

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('응답을 파싱할 수 없습니다.');
    }

    return NextResponse.json({ advice: textBlock.text });
  } catch (error) {
    console.error('AI 조언 오류:', error);
    return NextResponse.json({ error: 'AI 조언 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

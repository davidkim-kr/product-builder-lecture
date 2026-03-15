import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: '이미지 파일이 필요합니다.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: `이 평면도 이미지를 분석하여 방의 구조를 JSON 형식으로 반환해주세요.

다음 형식으로 정확히 반환해주세요 (JSON 외 다른 텍스트 없이):
{
  "dimensions": {
    "width": 숫자(미터),
    "length": 숫자(미터),
    "height": 2.4
  },
  "features": [
    {
      "type": "door" 또는 "window",
      "wall": "north" 또는 "south" 또는 "east" 또는 "west",
      "position": 0~1 사이 숫자(벽 길이 비율),
      "width": 숫자(미터)
    }
  ],
  "description": "방 구조 간단 설명"
}

평면도가 명확하지 않으면 일반적인 원룸(폭4m x 길이5m)으로 추정해주세요.`,
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('응답을 파싱할 수 없습니다.');
    }

    // JSON 파싱 (마크다운 코드블록 제거)
    const raw = textBlock.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const roomData = JSON.parse(raw);

    return NextResponse.json(roomData);
  } catch (error) {
    console.error('평면도 분석 오류:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'AI 응답 파싱 실패' }, { status: 500 });
    }
    return NextResponse.json({ error: '평면도 분석 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

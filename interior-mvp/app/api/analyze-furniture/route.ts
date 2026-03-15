import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const FURNITURE_COLORS: Record<string, string> = {
  sofa: '#6366f1',
  table: '#f59e0b',
  chair: '#10b981',
  bed: '#3b82f6',
  desk: '#8b5cf6',
  wardrobe: '#ef4444',
  shelf: '#f97316',
  etc: '#6b7280',
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: '이미지 파일이 필요합니다.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mediaType = file.type;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mediaType};base64,${base64}` },
            },
            {
              type: 'text',
              text: `이 가구 사진을 분석하여 JSON으로 반환해주세요.

형식 (JSON만, 다른 텍스트 없이):
{
  "name": "가구 이름(한국어)",
  "category": "sofa|table|chair|bed|desk|wardrobe|shelf|etc 중 하나",
  "dimensions": {
    "width": 숫자(미터),
    "depth": 숫자(미터),
    "height": 숫자(미터)
  }
}

사진이 불명확하면 일반적인 의자(0.5x0.5x0.9m)로 추정해주세요.`,
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('응답 없음');

    const raw = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const furnitureData = JSON.parse(raw);

    // 색상 추가
    furnitureData.color = FURNITURE_COLORS[furnitureData.category] ?? FURNITURE_COLORS.etc;

    return NextResponse.json(furnitureData);
  } catch (error) {
    console.error('가구 분석 오류:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'AI 응답 파싱 실패' }, { status: 500 });
    }
    return NextResponse.json({ error: '가구 분석 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

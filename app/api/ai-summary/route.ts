import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { content } = await req.json();

  const apiKey = process.env.OPENAI_API_KEY;
  const prompt = `
  다음 환경 제보 내용을 한글로 요약하고, 관련 키워드 3개, 카테고리, 긴급도, 예상비용, 예상기간을 추출해줘.
  내용: """${content}"""
  결과는 아래 JSON 형태로 반환:
  {
    "summary": "...",
    "keywords": ["...", "...", "..."],
    "category": "...",
    "urgency": "...",
    "estimatedCost": "...",
    "expectedDuration": "..."
  }
  `;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 512
    })
  });

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  let result;
  try {
    result = JSON.parse(text);
  } catch {
    result = { summary: text };
  }

  return NextResponse.json(result);
} 
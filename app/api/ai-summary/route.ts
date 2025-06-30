import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { content } = await req.json();

  // Gemini API Key (보안상 실제 배포시 환경변수로 관리 권장)
  const apiKey = 'AIzaSyAkcirXWk5dKarXPDXhdYYLBd1Rw450qj8';
  
  // 먼저 사용 가능한 모델 목록 확인
  const modelsUrl = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
  
  try {
    const modelsResponse = await fetch(modelsUrl);
    const modelsData = await modelsResponse.json();
    console.log('사용 가능한 모델들:', modelsData);
    
    if (modelsData.error) {
      console.error('모델 목록 조회 실패:', modelsData.error);
      return NextResponse.json({ summary: `API Key 또는 권한 문제: ${modelsData.error.message}` });
    }
  } catch (error) {
    console.error('모델 목록 조회 중 오류:', error);
  }

  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  // 프롬프트 구성 (Gemini는 contents 배열)
  const prompt = {
    contents: [
      {
        parts: [
          {
            text: `다음 환경 제보 내용을 한글로 요약하고, 관련 키워드 3개, 카테고리, 긴급도, 예상비용, 예상기간을 추출해줘. 반드시 아래 JSON 형태로만 답변해. 설명 없이 JSON만 반환해.\n내용: """${content}"""\n결과 예시:\n{\n  "summary": "...",\n  "keywords": ["...", "...", "..."],\n  "category": "...",\n  "urgency": "...",\n  "estimatedCost": "...",\n  "expectedDuration": "..."\n}`
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt)
    });
    const data = await response.json();
    // Gemini 응답 구조: data.candidates[0].content.parts[0].text
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // 디버깅용 콘솔 출력
    console.log('Gemini 응답:', data);
    console.log('파싱 시도 텍스트:', text);
    let cleanText = text.trim();
    // 코드블록(```json ... ```) 제거
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```/, '').replace(/```$/, '').trim();
    }
    let result;
    try {
      result = JSON.parse(cleanText);
    } catch {
      result = {
        summary: 'AI 분석 결과를 불러오지 못했습니다.',
        insights: [],
        recommendations: [],
        trends: [],
        riskAreas: [],
        efficiency: {
          avgProcessingTime: '-',
          completionRate: 0,
          priorityIssues: 0
        }
      };
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Gemini API 호출 오류:', error);
    return NextResponse.json({ summary: 'AI 분석 실패: Gemini API 호출 오류' });
  }
} 
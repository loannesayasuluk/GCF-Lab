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

  // 개선된 프롬프트 구성 - 더 의미있는 분석 결과 제공
  const prompt = {
    contents: [
      {
        parts: [
          {
            text: `다음 환경 제보 데이터를 분석하여 실제로 유용한 인사이트를 제공해주세요. 

데이터: """${content}"""

다음 기준으로 분석해주세요:
1. 데이터가 5건 미만이면: "데이터가 부족하여 의미있는 분석이 어렵습니다. 더 많은 제보가 필요합니다."
2. 데이터가 충분하면:
   - 가장 급증하는 문제 유형과 지역
   - 처리 지연이 있는 이슈
   - 시급한 대응이 필요한 핫스팟
   - 개선이 필요한 처리 프로세스
   - 예방 가능한 문제 패턴

반드시 아래 JSON 형태로만 답변해주세요:

{
  "summary": "핵심 분석 요약 (2-3문장)",
  "keyInsights": [
    "가장 중요한 인사이트 1",
    "가장 중요한 인사이트 2", 
    "가장 중요한 인사이트 3"
  ],
  "trends": {
    "increasingIssues": ["급증하는 문제들"],
    "hotspots": ["집중 지역들"],
    "delayedProcessing": ["지연 처리 이슈들"]
  },
  "recommendations": [
    "즉시 대응 권장사항 1",
    "즉시 대응 권장사항 2"
  ],
  "dataQuality": "데이터 품질 평가 (충분/부족/양호 등)"
}`
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
      // 파싱 실패 시 기본 응답
      result = {
        summary: 'AI 분석 결과를 불러오지 못했습니다.',
        keyInsights: ['데이터 분석 중 오류가 발생했습니다.'],
        trends: {
          increasingIssues: [],
          hotspots: [],
          delayedProcessing: []
        },
        recommendations: ['데이터를 다시 확인해주세요.'],
        dataQuality: '분석 불가'
      };
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Gemini API 호출 오류:', error);
    return NextResponse.json({ 
      summary: 'AI 분석 실패: Gemini API 호출 오류',
      keyInsights: ['API 연결에 문제가 있습니다.'],
      trends: {
        increasingIssues: [],
        hotspots: [],
        delayedProcessing: []
      },
      recommendations: ['잠시 후 다시 시도해주세요.'],
      dataQuality: '분석 불가'
    });
  }
} 
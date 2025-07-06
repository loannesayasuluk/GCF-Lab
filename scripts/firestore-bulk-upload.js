const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../serviceAccountKey.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const reports = [
  {
    title: '강남구 역삼동 불법 쓰레기 투기',
    location: '강남구 역삼동',
    type: 'waste',
    severity: 'high',
    reporter: '홍길동',
    date: '2025-05-15',
    status: '제보접수',
    description: '역삼동 골목에 쓰레기 더미가 쌓여 있습니다.',
    coordinates: { lat: 37.5006, lng: 127.0364 },
    images: [],
    aiAnalysis: {}
  },
  {
    title: '서초구 방배동 대기오염',
    location: '서초구 방배동',
    type: 'air',
    severity: 'medium',
    reporter: '이영희',
    date: '2025-06-28',
    status: '처리중',
    description: '방배동 일대에 미세먼지가 심합니다.',
    coordinates: { lat: 37.4812, lng: 126.9977 },
    images: [],
    aiAnalysis: {}
  },
  {
    title: '마포구 합정동 수질오염',
    location: '마포구 합정동',
    type: 'water',
    severity: 'low',
    reporter: '박철민',
    date: '2025-04-10',
    status: '제보접수',
    description: '합정동 하천에서 악취가 납니다.',
    coordinates: { lat: 37.5509, lng: 126.9145 },
    images: [],
    aiAnalysis: {}
  },
  {
    title: '송파구 잠실동 소음 민원',
    location: '송파구 잠실동',
    type: 'noise',
    severity: 'medium',
    reporter: '최수진',
    date: '2025-07-02',
    status: '처리완료',
    description: '잠실동 공사장 소음이 심합니다.',
    coordinates: { lat: 37.5209, lng: 127.1035 },
    images: [],
    aiAnalysis: {}
  },
  {
    title: '종로구 청운동 쓰레기 무단투기',
    location: '종로구 청운동',
    type: 'waste',
    severity: 'medium',
    reporter: '김민수',
    date: '2025-05-03',
    status: '제보접수',
    description: '청운동 골목에 쓰레기가 방치되어 있습니다.',
    coordinates: { lat: 37.5916, lng: 126.9696 },
    images: [],
    aiAnalysis: {}
  },
  {
    title: '영등포구 여의도동 대기오염',
    location: '영등포구 여의도동',
    type: 'air',
    severity: 'high',
    reporter: '정다은',
    date: '2025-04-18',
    status: '처리중',
    description: '여의도동 미세먼지 농도가 높습니다.',
    coordinates: { lat: 37.5219, lng: 126.9245 },
    images: [],
    aiAnalysis: {}
  }
];

(async () => {
  for (const report of reports) {
    await db.collection('reports').add(report);
  }
  console.log('예시 제보 6건 업로드 완료');
})(); 
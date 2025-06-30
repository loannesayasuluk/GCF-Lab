const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

// 서비스 계정 키 파일 경로
const serviceAccountPath = path.join(__dirname, '..', 'gcf-lab-13e42-firebase-adminsdk-fbsvc-baa1873ae2.json');

initializeApp({ 
  credential: cert(serviceAccountPath)
});
const db = getFirestore();

async function cleanImagesArray() {
  try {
    console.log('Firestore reports 컬렉션에서 빈 이미지 문자열 정리 시작...');
    
    const reportsRef = db.collection('reports');
    const snapshot = await reportsRef.get();
    
    if (snapshot.empty) {
      console.log('정리할 reports가 없습니다.');
      return;
    }
    
    let cleanedCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const originalImages = data.images || [];
      
      // 빈 문자열 제거
      const cleanedImages = originalImages.filter(img => img && img.trim() !== '');
      
      // 변경사항이 있는 경우에만 업데이트
      if (cleanedImages.length !== originalImages.length) {
        await doc.ref.update({
          images: cleanedImages
        });
        cleanedCount++;
        console.log(`문서 ${doc.id} 정리 완료: ${originalImages.length} -> ${cleanedImages.length} 이미지`);
      }
    }
    
    console.log(`총 ${cleanedCount}개 문서의 이미지 배열이 정리되었습니다.`);
    
  } catch (error) {
    console.error('이미지 배열 정리 중 오류 발생:', error);
  }
}

cleanImagesArray().then(() => {
  console.log('이미지 배열 정리 완료');
  process.exit(0);
}).catch((error) => {
  console.error('스크립트 실행 중 오류:', error);
  process.exit(1);
}); 
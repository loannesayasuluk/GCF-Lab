"use client";
import { useAuthUser } from "@/components/AuthUserProvider";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function MyReportsPage() {
  const { user } = useAuthUser();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchReports = async () => {
      setLoading(true);
      const q = query(collection(db, "reports"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchReports();
  }, [user]);

  if (!user) return <div className="p-8">로그인이 필요합니다.</div>;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6">내 제보 현황</h2>
      {loading ? (
        <div>불러오는 중...</div>
      ) : reports.length === 0 ? (
        <div>제보 내역이 없습니다.</div>
      ) : (
        <ul className="space-y-4">
          {reports.map((report) => (
            <li key={report.id} className="bg-white rounded-xl shadow p-4">
              <div className="font-semibold">{report.title || "제목 없음"}</div>
              <div className="text-gray-500 text-sm">{report.createdAt ? new Date(report.createdAt.seconds * 1000).toLocaleString() : "날짜 없음"}</div>
              <div>{report.status ? `상태: ${report.status}` : null}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 
"use client"
import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Report, Stats } from "@/types";
import { StatsView } from "@/components/stats-view";

export default function StatsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  useEffect(() => {
    const q = collection(db, "reports");
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
      setReports(data);
    });
    return () => unsubscribe();
  }, []);
  // 간단 Stats 계산 (예시)
  const stats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter(r => r.status === '제보접수').length,
    processing: reports.filter(r => r.status === '처리중').length,
    resolved: reports.filter(r => r.status === '처리완료').length,
    thisWeek: 0,
    totalReports: reports.length,
    activeReports: reports.filter(r => r.status === '처리중').length,
    resolvedReports: reports.filter(r => r.status === '처리완료').length,
    totalUsers: new Set(reports.map(r => r.reporter)).size,
    averageResolutionTime: 0,
    reportsByType: {},
    reportsBySeverity: {},
    reportsByStatus: {},
    monthlyTrends: [],
    topLocations: []
  }), [reports]);
  return <StatsView stats={stats} reports={reports} />;
} 
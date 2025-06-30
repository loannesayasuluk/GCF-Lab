"use client"
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Report } from "@/types";
import AnalysisView from "@/components/analysis-view";

export default function AnalysisPage() {
  const [reports, setReports] = useState<Report[]>([]);
  useEffect(() => {
    const q = collection(db, "reports");
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
      setReports(data);
    });
    return () => unsubscribe();
  }, []);
  return <AnalysisView reports={reports} hideMap />;
} 
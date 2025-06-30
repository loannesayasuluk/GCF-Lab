"use client"
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CommunityPost } from "@/types";
import { CommunityView } from "@/components/community-view";

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  useEffect(() => {
    const fetchPosts = async () => {
      const q = query(collection(db, "communityPosts"), orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityPost));
      setPosts(data);
    };
    fetchPosts();
  }, []);
  return <CommunityView posts={posts} />;
} 
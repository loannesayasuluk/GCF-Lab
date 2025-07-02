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

  // 더미 함수들 - 실제 구현은 필요에 따라 추가
  const handleAddPost = (post: Omit<CommunityPost, 'id' | 'likes' | 'comments'>) => {
    console.log('Add post:', post);
  };

  const handleAddComment = (postId: string, comment: { author: string; content: string; date: string }) => {
    console.log('Add comment:', postId, comment);
  };

  const handleToggleLike = (postId: string, isLike: boolean) => {
    console.log('Toggle like:', postId, isLike);
  };

  return (
    <CommunityView 
      posts={posts} 
      onAddPost={handleAddPost}
      onAddComment={handleAddComment}
      onToggleLike={handleToggleLike}
      currentUser={null}
      isLoggedIn={false}
    />
  );
} 
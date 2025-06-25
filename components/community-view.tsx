"use client"

import { useState, useEffect } from "react"
import { Plus, Users, MessageSquare, Calendar, Heart, ChevronDown, ChevronUp, ThumbsUp, Reply } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { CommunityPost, Comment, User } from "@/types"

interface CommunityViewProps {
  posts: CommunityPost[]
  onAddPost: (post: Omit<CommunityPost, 'id' | 'likes' | 'comments'>) => void
  currentUser: User | null
  isLoggedIn: boolean
}

interface ExpandedPosts {
  [key: number]: boolean
}

interface Comments {
  [key: number]: Comment[]
}

interface NewComments {
  [key: number]: string
}

interface LikedPosts {
  [key: number]: boolean
}

export function CommunityView({ posts, onAddPost, currentUser, isLoggedIn }: CommunityViewProps) {
  const [showNewPostDialog, setShowNewPostDialog] = useState(false)
  const [newPostTitle, setNewPostTitle] = useState("")
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostCategory, setNewPostCategory] = useState<CommunityPost['category'] | "">("")
  const [showGuide, setShowGuide] = useState(false)
  const [expandedPosts, setExpandedPosts] = useState<ExpandedPosts>({})
  const [comments, setComments] = useState<Comments>({})
  const [newComments, setNewComments] = useState<NewComments>({})
  const [likedPosts, setLikedPosts] = useState<LikedPosts>({})
  const [postLikes, setPostLikes] = useState<{[key: number]: number}>({})
  const { toast } = useToast()

  // 초기 좋아요 수 및 댓글 수 설정 (posts 변경 시 동기화)
  useEffect(() => {
    const initialLikes: {[key: number]: number} = {}
    posts.forEach(post => {
      initialLikes[post.id] = post.likes
    })
    setPostLikes(initialLikes)
    // 댓글도 동기화
    const initialComments: Comments = {}
    posts.forEach(post => {
      initialComments[post.id] = []
    })
    setComments(initialComments)
  }, [posts])

  const handleSubmitPost = () => {
    if (!newPostTitle.trim() || !newPostContent.trim() || !newPostCategory) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    try {
      onAddPost({
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
        category: newPostCategory,
        author: currentUser?.name || "익명",
        date: new Date().toLocaleDateString(),
      })
      
      setNewPostTitle("")
      setNewPostContent("")
      setNewPostCategory("")
      setShowNewPostDialog(false)
      
      toast({
        title: "게시글 작성 완료",
        description: "새 게시글이 등록되었습니다.",
      })
    } catch (error) {
      console.error('게시글 작성 오류:', error)
      toast({
        title: "작성 실패",
        description: "게시글 작성 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const handleLike = (postId: number) => {
    if (!isLoggedIn) {
      toast({
        title: "로그인 필요",
        description: "공감하기 위해서는 로그인이 필요합니다.",
        variant: "destructive",
      })
      return
    }
    
    setLikedPosts(prev => {
      const newLikedPosts = { ...prev }
      if (newLikedPosts[postId]) {
        // 좋아요 취소
        newLikedPosts[postId] = false
        setPostLikes(prev => ({
          ...prev,
          [postId]: Math.max(0, (prev[postId] || 0) - 1)
        }))
        toast({
          title: "공감 취소",
          description: "공감을 취소했습니다.",
        })
      } else {
        // 좋아요 추가
        newLikedPosts[postId] = true
        setPostLikes(prev => ({
          ...prev,
          [postId]: (prev[postId] || 0) + 1
        }))
        toast({
          title: "공감 완료",
          description: "게시글에 공감했습니다.",
        })
      }
      return newLikedPosts
    })
  }

  const handleComment = (postId: number) => {
    if (!isLoggedIn) {
      toast({
        title: "로그인 필요",
        description: "댓글을 작성하려면 로그인이 필요합니다.",
        variant: "destructive",
      })
      return
    }
    
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }))
  }

  const handleSubmitComment = (postId: number) => {
    const comment = newComments[postId]
    if (!comment || !comment.trim()) {
      toast({
        title: "댓글 입력 오류",
        description: "댓글 내용을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    try {
      const newComment: Comment = {
        id: Date.now(),
        content: comment.trim(),
        author: currentUser?.name || "익명",
        date: new Date().toLocaleDateString()
      }

      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment]
      }))
      
      setNewComments(prev => ({
        ...prev,
        [postId]: ""
      }))
      
      toast({
        title: "댓글 작성 완료",
        description: "댓글이 등록되었습니다.",
      })
    } catch (error) {
      console.error('댓글 작성 오류:', error)
      toast({
        title: "댓글 작성 실패",
        description: "댓글 작성 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case '모임': return 'bg-blue-100 text-blue-800'
      case '정보': return 'bg-green-100 text-green-800'
      case '질문': return 'bg-yellow-100 text-yellow-800'
      case '제안': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">커뮤니티</h2>
        <div className="flex items-center space-x-2">
          {/* 글쓰기 버튼 */}
          <Button
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium px-5 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            onClick={() => {
              if (!isLoggedIn) {
                toast({
                  title: "로그인 필요",
                  description: "글을 작성하려면 로그인이 필요합니다.",
                  variant: "destructive",
                })
              } else {
                setShowNewPostDialog(true)
              }
            }}
          >
            <Plus className="h-4 w-4 mr-2" />글쓰기
          </Button>
          {/* 커뮤니티 가이드 버튼 */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowGuide(!showGuide)}
          >
            {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            가이드
          </Button>
        </div>
      </div>

      {/* 커뮤니티 가이드 */}
      {showGuide && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>커뮤니티 이용 가이드</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <span className="font-medium">•</span>
                <span>환경 보호 관련 정보를 공유하고 토론할 수 있습니다.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium">•</span>
                <span>모임, 정보, 질문, 제안 카테고리로 분류되어 있습니다.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium">•</span>
                <span>댓글로 의견을 나누고 공감 버튼으로 반응할 수 있습니다.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium">•</span>
                <span>서로를 존중하고 건설적인 대화를 나누어 주세요.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 게시글 목록 */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={getCategoryColor(post.category)}>
                      {post.category}
                    </Badge>
                    <span className="text-sm text-gray-500">{post.date}</span>
                  </div>
                  <CardTitle className="text-lg">{post.title}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">작성자: {post.author}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{post.content}</p>
              
              {/* 액션 버튼 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center space-x-1 ${
                      likedPosts[post.id] ? 'text-red-600' : 'text-gray-600'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${likedPosts[post.id] ? 'fill-current' : ''}`} />
                    <span>{postLikes[post.id] || post.likes}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleComment(post.id)}
                    className="flex items-center space-x-1 text-gray-600"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>{(comments[post.id] || []).length + (post.comments || 0)}</span>
                  </Button>
                </div>
              </div>

              {/* 댓글 섹션 */}
              {expandedPosts[post.id] && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-3">댓글</h4>
                  
                  {/* 기존 댓글들 */}
                  <div className="space-y-3 mb-4">
                    {(comments[post.id] || []).map((comment) => (
                      <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{comment.author}</span>
                          <span className="text-xs text-gray-500">{comment.date}</span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                    ))}
                  </div>

                  {/* 새 댓글 작성 */}
                  <div className="space-y-2">
                    <Textarea
                      placeholder="댓글을 입력하세요..."
                      value={newComments[post.id] || ""}
                      onChange={(e) => setNewComments(prev => ({
                        ...prev,
                        [post.id]: e.target.value
                      }))}
                      rows={2}
                    />
                    <div className="flex justify-end">
                      <Button 
                        size="sm" 
                        onClick={() => handleSubmitComment(post.id)}
                        disabled={!newComments[post.id]?.trim()}
                      >
                        댓글 작성
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {posts.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">아직 게시글이 없습니다.</p>
            <p className="text-sm text-gray-500 mt-2">첫 번째 게시글을 작성해보세요!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 
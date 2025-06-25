"use client"

import { useState } from "react"
import { Plus, Users, MessageSquare, Calendar, Heart, ChevronDown, ChevronUp } from "lucide-react"
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

export function CommunityView({ posts, onAddPost, currentUser, isLoggedIn }: CommunityViewProps) {
  const [showNewPostDialog, setShowNewPostDialog] = useState(false)
  const [newPostTitle, setNewPostTitle] = useState("")
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostCategory, setNewPostCategory] = useState<CommunityPost['category'] | "">("")
  const [showGuide, setShowGuide] = useState(false)
  const [expandedPosts, setExpandedPosts] = useState<ExpandedPosts>({})
  const [comments, setComments] = useState<Comments>({})
  const [newComments, setNewComments] = useState<NewComments>({})
  const { toast } = useToast()

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
    
    toast({
      title: "공감 완료",
      description: "게시글에 공감했습니다.",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">커뮤니티</h2>
        <div className="flex items-center space-x-2">
          {/* 커뮤니티 가이드 버튼 */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowGuide(!showGuide)}
          >
            {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            가이드
          </Button>
          {isLoggedIn && (
            <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />새 글 작성
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>새 글 작성</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>제목</Label>
                    <Input
                      placeholder="제목을 입력하세요"
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>카테고리</Label>
                    <Select value={newPostCategory} onValueChange={(value: CommunityPost['category']) => setNewPostCategory(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="모임">모임</SelectItem>
                        <SelectItem value="정보">정보</SelectItem>
                        <SelectItem value="팁">팁</SelectItem>
                        <SelectItem value="질문">질문</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>내용</Label>
                    <Textarea
                      placeholder="내용을 입력하세요"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowNewPostDialog(false)}>
                      취소
                    </Button>
                    <Button onClick={handleSubmitPost}>작성</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* 커뮤니티 가이드 (접힌 메뉴) */}
      {showGuide && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">커뮤니티 가이드</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">🤝 함께 만드는 깨끗한 환경</h4>
                <p className="text-sm text-blue-700">
                  우리 모두가 참여하여 더 나은 환경을 만들어갑니다. 정확한 정보 공유와 건설적인 토론을 통해 실질적인
                  해결책을 찾아보세요.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium mb-2">✅ 권장사항</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 정확하고 유용한 정보 공유</li>
                    <li>• 서로 존중하는 대화</li>
                    <li>• 환경 개선을 위한 건설적 제안</li>
                    <li>• 지역 환경 활동 참여 독려</li>
                  </ul>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium mb-2">❌ 주의사항</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 허위 정보나 과장된 내용</li>
                    <li>• 개인 정보 노출</li>
                    <li>• 상업적 광고나 홍보</li>
                    <li>• 타인에 대한 비방이나 욕설</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 커뮤니티 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">활성 사용자</p>
                <p className="text-3xl font-bold text-blue-600">1,234</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">총 게시글</p>
                <p className="text-3xl font-bold text-green-600">{posts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">이번 주 활동</p>
                <p className="text-3xl font-bold text-purple-600">89</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 게시글 목록 */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline">{post.category}</Badge>
                    <span className="text-sm text-gray-500">by {post.author}</span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">{post.date}</span>
                  </div>
                  <h3 className="text-lg font-medium mb-2">{post.title}</h3>
                  <p className="text-gray-600 mb-4">{post.content}</p>
                  <div className="flex items-center space-x-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleLike(post.id)}
                    >
                      <Heart className="h-4 w-4 mr-1" />
                      {post.likes || 0}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleComment(post.id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {comments[post.id]?.length || 0}
                    </Button>
                  </div>
                  
                  {/* 댓글 섹션 */}
                  {expandedPosts[post.id] && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="space-y-3">
                        {/* 기존 댓글들 */}
                        {comments[post.id]?.map((comment) => (
                          <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium">{comment.author}</span>
                              <span className="text-xs text-gray-500">{comment.date}</span>
                            </div>
                            <p className="text-sm text-gray-700">{comment.content}</p>
                          </div>
                        ))}
                        
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
                            className="text-sm"
                          />
                          <div className="flex justify-end">
                            <Button 
                              size="sm"
                              onClick={() => handleSubmitComment(post.id)}
                            >
                              댓글 작성
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 
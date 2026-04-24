'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { HeartIcon, MessageCircleIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getApiBaseUrl } from '@/app/lib/api-base';

interface Article {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  author: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  likedByUser?: boolean;
}

interface Comment {
  id: string;
  content: string;
  user: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  createdAt: string;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const section = params.section as string;
  const slug = params.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Extract article ID from slug (slug format: title-timestamp)
  const articleId = slug?.split('-').slice(-1)[0];
  const backendUrl = getApiBaseUrl();

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${backendUrl}/articles/${articleId}`);
        if (!response.ok) throw new Error('Article not found');
        const data = await response.json();
        setArticle(data);
        setLiked(data.likedByUser || false);

        // Fetch comments
        const commentsRes = await fetch(`${backendUrl}/articles/${articleId}/comments`);
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          setComments(commentsData.comments);
        }
      } catch (err) {
        console.error('Error fetching article:', err);
      } finally {
        setLoading(false);
      }
    };

    if (articleId) {
      fetchArticle();
    }
  }, [articleId, backendUrl]);

  const handleLike = async () => {
    try {
      const response = await fetch(`${backendUrl}/articles/${articleId}/like`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked);
        if (article) {
          setArticle({
            ...article,
            likeCount: data.liked ? article.likeCount + 1 : article.likeCount - 1,
          });
        }
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !articleId) return;

    try {
      setSubmittingComment(true);
      const response = await fetch(`${backendUrl}/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText }),
      });

      if (response.ok) {
        const newComment = await response.json();
        setComments([newComment, ...comments]);
        setCommentText('');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Article not found</p>
          <Link href={`/sections/${section}`} className="text-teal-600 hover:text-teal-700">
            Back to section
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href={`/sections/${section}`} className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to {section}
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cover Image */}
        {article.coverImageUrl && (
          <div className="relative h-96 rounded-lg overflow-hidden mb-8 shadow-lg">
            <Image
              src={article.coverImageUrl}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          {article.title}
        </h1>

        {/* Author Info */}
        <div className="flex items-center gap-4 pb-6 border-b border-gray-200 mb-6">
          {article.author.avatarUrl && (
            <Image
              src={article.author.avatarUrl}
              alt={article.author.displayName || 'Author'}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover"
            />
          )}
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{article.author.displayName || 'Unknown'}</p>
            <p className="text-sm text-gray-600">
              {new Date(article.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none mb-8">
          <div
            className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br />') }}
          />
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md mb-8 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              liked
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <HeartIcon className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} />
            <span>{article.likeCount} Likes</span>
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-600">
            <MessageCircleIcon className="w-5 h-5" />
            <span>{comments.length} Comments</span>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments</h2>

          {/* Add Comment Form */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              rows={4}
            />
            <button
              onClick={handleAddComment}
              disabled={!commentText.trim() || submittingComment}
              className="mt-3 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 transition-colors"
            >
              {submittingComment ? 'Posting...' : 'Post Comment'}
            </button>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-500">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-b-0">
                  {comment.user.avatarUrl && (
                    <Image
                      src={comment.user.avatarUrl}
                      alt={comment.user.displayName || 'User'}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{comment.user.displayName || 'User'}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-gray-700 mt-2">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

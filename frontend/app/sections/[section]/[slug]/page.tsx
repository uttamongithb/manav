'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { HeartIcon, MessageCircleIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getApiBaseUrl } from '@/app/lib/api-base';
import { SiteNavbar } from '@/app/components/site-navbar';
import { SiteFooter } from '@/app/components/site-footer';
import { useTheme } from '@/app/context/theme';

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

function extractInlineImageUrls(content: string): string[] {
  const htmlImgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  const markdownImgRegex = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/gi;
  const plainUrlRegex = /(https?:\/\/[^\s"'<>]+\.(?:png|jpe?g|gif|webp|svg))(\?[^\s"'<>]*)?/gi;

  const urls = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = htmlImgRegex.exec(content)) !== null) {
    if (match[1]) urls.add(match[1]);
  }
  while ((match = markdownImgRegex.exec(content)) !== null) {
    if (match[1]) urls.add(match[1]);
  }
  while ((match = plainUrlRegex.exec(content)) !== null) {
    if (match[0]) urls.add(match[0]);
  }

  return Array.from(urls);
}

function renderContentBlocks(content: string) {
  return content
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean);
}

export default function ArticleDetailPage() {
  const { isDark, setIsDark } = useTheme();
  const params = useParams();
  const section = params.section as string;
  const slug = params.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const backendUrl = getApiBaseUrl();
  const inlineImageUrls = article ? extractInlineImageUrls(article.content) : [];
  const contentBlocks = article ? renderContentBlocks(article.content) : [];
  const sideGalleryImages = useMemo(() => {
    if (!article) return [] as string[];

    const merged = [
      ...(article.coverImageUrl ? [article.coverImageUrl] : []),
      ...inlineImageUrls,
    ];

    return Array.from(new Set(merged)).slice(0, 8);
  }, [article, inlineImageUrls]);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${backendUrl}/articles/sections/${section}/slug/${encodeURIComponent(slug)}`,
        );
        if (!response.ok) throw new Error('Article not found');
        const data = await response.json();
        setArticle(data);
        setLiked(data.likedByUser || false);
        setShowComments(false);
        const resolvedArticleId = data.id as string;

        // Fetch comments
        const commentsRes = await fetch(`${backendUrl}/articles/${resolvedArticleId}/comments`);
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

    if (section && slug) {
      fetchArticle();
    }
  }, [section, slug, backendUrl]);

  const handleLike = async () => {
    if (!article?.id) return;
    try {
      const response = await fetch(`${backendUrl}/articles/${article.id}/like`, {
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
    if (!commentText.trim() || !article?.id) return;

    try {
      setSubmittingComment(true);
      const response = await fetch(`${backendUrl}/articles/${article.id}/comments`, {
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

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0b0f14] text-white' : 'bg-[#eef3ed] text-[#10131a]'}`}>
      <SiteNavbar isDark={isDark} onToggleTheme={() => setIsDark((prev) => !prev)} />

      <main className="mx-auto w-[92vw] max-w-350 px-3 py-6 md:px-2 md:py-8">
        <div className={`mb-4 rounded-2xl border px-4 py-4 md:px-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white/95'}`}>
          <Link href={`/sections/${section}`} className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700">
            <ArrowLeft className="h-4 w-4" />
            Back to {section}
          </Link>
        </div>

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-teal-600" />
              <p className={isDark ? 'text-white/70' : 'text-gray-600'}>Loading article...</p>
            </div>
          </div>
        ) : null}

        {!loading && !article ? (
          <div className={`rounded-2xl border p-8 text-center ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
            <p className={`${isDark ? 'text-white/70' : 'text-gray-600'} mb-4`}>Article not found</p>
            <Link href={`/sections/${section}`} className="text-teal-600 hover:text-teal-700">
              Back to section
            </Link>
          </div>
        ) : null}

      {/* Main Content */}
      {article ? (
      <div className="mx-auto max-w-[1320px] lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6">
      <article className={`w-full max-w-none border p-4 sm:p-6 md:p-8 lg:mr-2 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
        {/* Title */}
        <h1 className={`text-3xl sm:text-5xl font-bold mb-4 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {article.title}
        </h1>

        {/* Author Info */}
        <div className={`flex items-center gap-4 pb-6 border-b mb-6 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
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
            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{article.author.displayName || 'Unknown'}</p>
            <p className={`text-sm ${isDark ? 'text-white/65' : 'text-gray-600'}`}>
              {new Date(article.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="mb-8">
          {/* Rectangular Hero Image */}
          {article.coverImageUrl && (
            <div className="relative mb-8 aspect-[16/9] overflow-hidden shadow-lg">
              <Image
                src={article.coverImageUrl}
                alt={article.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Article Content */}
          <div className="space-y-5">
            {contentBlocks.map((block, idx) => (
              <p
                key={`${idx}-${block.slice(0, 16)}`}
                className={`text-[16px] leading-8 ${isDark ? 'text-white/85' : 'text-gray-700'}`}
              >
                {block}
              </p>
            ))}
          </div>
        </div>

        {/* Action Bar */}
        <div className={`rounded-lg p-4 sm:p-6 shadow-md mb-8 flex flex-col sm:flex-row items-center gap-4 ${isDark ? 'bg-[#151a22]' : 'bg-white'}`}>
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
          <button
            onClick={() => setShowComments((prev) => !prev)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-white/10 text-white/80 hover:bg-white/15' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <MessageCircleIcon className="w-5 h-5" />
            <span>{comments.length} Comments</span>
          </button>
        </div>

        {/* Comments Section */}
        {showComments ? (
        <div className={`rounded-lg shadow-md p-4 sm:p-6 ${isDark ? 'bg-[#151a22]' : 'bg-white'}`}>
          <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Comments</h2>

          {/* Add Comment Form */}
          <div className={`mb-8 pb-8 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share your thoughts..."
              className={`w-full resize-none rounded-lg border p-4 focus:outline-none focus:ring-2 focus:ring-teal-500 ${isDark ? 'border-white/15 bg-[#0f141d] text-white placeholder:text-white/40' : 'border-gray-300 bg-white text-gray-900'}`}
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
              <p className={isDark ? 'text-white/60' : 'text-gray-500'}>No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className={`flex gap-4 pb-4 border-b last:border-b-0 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
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
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{comment.user.displayName || 'User'}</p>
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                    <p className={`mt-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        ) : null}
      </article>
      <aside className="mt-6 hidden lg:block lg:mt-0">
        {sideGalleryImages.length > 0 ? (
          <div className="sticky top-24 space-y-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="relative h-52 w-full overflow-hidden">
                <Image
                  src={sideGalleryImages[idx % sideGalleryImages.length]}
                  alt={`Article image ${idx + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
        ) : null}
      </aside>
      </div>
      ) : null}
      </main>

      <SiteFooter isDark={isDark} />
    </div>
  );
}

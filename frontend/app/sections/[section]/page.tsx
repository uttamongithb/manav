'use client';

import { getApiBaseUrl } from "@/app/lib/api-base";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { HeartIcon, MessageCircleIcon, ShareIcon } from 'lucide-react';
import { SiteNavbar } from '@/app/components/site-navbar';
import { SiteFooter } from '@/app/components/site-footer';
import { useTheme } from '@/app/context/theme';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  author: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  likedByUser?: boolean;
}

export default function SectionPage() {
  const { isDark, setIsDark } = useTheme();
  const params = useParams();
  const section = params.section as string;
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sectionNames: Record<string, string> = {
    news: 'News',
    literature: 'Literature',
    activities: 'Activities',
    special_report: 'Special Report',
    health: 'Health',
    interesting: 'Interesting',
    sport: 'Sport',
    entertainment: 'Entertainment',
  };

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const backendUrl = getApiBaseUrl();
        const response = await fetch(`${backendUrl}/articles/sections/${section}`);
        if (!response.ok) throw new Error('Failed to fetch articles');
        const data = await response.json();
        setArticles(data.articles);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [section]);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0b0f14] text-white' : 'bg-[#eef3ed] text-[#10131a]'}`}>
      <SiteNavbar isDark={isDark} onToggleTheme={() => setIsDark((prev) => !prev)} />

      <main className="mx-auto w-[92vw] max-w-350 px-3 py-6 md:px-2 md:py-8">
        <div
          className={`rounded-[28px] border px-5 py-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] md:px-8 md:py-8 ${
            isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white/95'
          }`}
        >
          <h1 className={`text-3xl font-bold md:text-4xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {sectionNames[section] || section}
          </h1>
          <p className={`mt-2 ${isDark ? 'text-white/65' : 'text-gray-600'}`}>
            {articles.length} {articles.length === 1 ? 'article' : 'articles'}
          </p>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-teal-600" />
                <p className={isDark ? 'text-white/70' : 'text-gray-600'}>Loading articles...</p>
              </div>
            </div>
          ) : null}

        {error && (
          <div className={`mb-6 rounded-lg border p-4 ${isDark ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {error}
          </div>
        )}

        {!loading && articles.length === 0 ? (
          <div className="text-center py-12">
            <p className={`text-lg ${isDark ? 'text-white/60' : 'text-gray-500'}`}>No articles found</p>
          </div>
        ) : !loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link key={article.id} href={`/sections/${section}/${article.slug}`}>
                <div className={`rounded-lg overflow-hidden shadow-md transition-shadow duration-300 cursor-pointer h-full flex flex-col hover:shadow-lg ${isDark ? 'bg-[#151a22] border border-white/10' : 'bg-white'}`}>
                  {/* Cover Image */}
                  {article.coverImageUrl && (
                    <div className="relative h-48 bg-gray-200 overflow-hidden">
                      <Image
                        src={article.coverImageUrl}
                        alt={article.title}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4 sm:p-5 flex flex-col flex-grow">
                    <h2 className={`text-lg sm:text-xl font-bold line-clamp-2 mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {article.title}
                    </h2>

                    {article.excerpt && (
                      <p className={`text-sm line-clamp-2 mb-3 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                        {article.excerpt}
                      </p>
                    )}

                    {/* Author Info */}
                    <div className="flex items-center gap-3 mb-4 mt-auto">
                      {article.author.avatarUrl && (
                        <Image
                          src={article.author.avatarUrl}
                          alt={article.author.displayName || 'Author'}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {article.author.displayName || 'Unknown'}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-white/55' : 'text-gray-500'}`}>
                          {new Date(article.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className={`flex items-center gap-4 text-sm border-t pt-3 ${isDark ? 'text-white/70 border-white/10' : 'text-gray-600 border-gray-200'}`}>
                      <div className="flex items-center gap-1">
                        <HeartIcon className="w-4 h-4" />
                        <span>{article.likeCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircleIcon className="w-4 h-4" />
                        <span>{article.commentCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ShareIcon className="w-4 h-4" />
                        <span>{article.viewCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
        </div>
      </main>

      <SiteFooter isDark={isDark} />
    </div>
  );
}

'use client';

import { getApiBaseUrl } from "@/app/lib/api-base";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { HeartIcon, MessageCircleIcon, ShareIcon } from 'lucide-react';

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            {sectionNames[section] || section}
          </h1>
          <p className="text-gray-600 mt-2">
            {articles.length} {articles.length === 1 ? 'article' : 'articles'}
          </p>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
            {error}
          </div>
        )}

        {articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No articles found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link key={article.id} href={`/sections/${section}/${article.slug}`}>
                <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full flex flex-col">
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
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-2 mb-2">
                      {article.title}
                    </h2>

                    {article.excerpt && (
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
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
                        <p className="text-sm font-medium text-gray-900">
                          {article.author.displayName || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(article.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 border-t border-gray-200 pt-3">
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
        )}
      </div>
    </div>
  );
}

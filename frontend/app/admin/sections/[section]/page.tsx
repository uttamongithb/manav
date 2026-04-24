'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getApiBaseUrl } from '@/app/lib/api-base';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  slug: string;
  status: string;
  author: {
    displayName: string | null;
  };
  createdAt: string;
  likeCount: number;
  viewCount: number;
}

const SECTIONS = [
  { id: 'news', name: 'News' },
  { id: 'literature', name: 'Literature' },
  { id: 'activities', name: 'Activities' },
  { id: 'special_report', name: 'Special Report' },
  { id: 'health', name: 'Health' },
  { id: 'interesting', name: 'Interesting' },
  { id: 'sport', name: 'Sport' },
  { id: 'entertainment', name: 'Entertainment' },
];

export default function AdminSectionPage() {
  const params = useParams();
  const section = params.section as string;

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  const sectionName = SECTIONS.find((s) => s.id === section)?.name || section;

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const backendUrl = getApiBaseUrl();
        const response = await fetch(`${backendUrl}/articles/sections/${section}`);
        if (response.ok) {
          const data = await response.json();
          setArticles(data.articles);
        }
      } catch (err) {
        console.error('Error fetching articles:', err);
      } finally {
        setLoading(false);
      }
    };

    if (section) {
      fetchArticles();
    }
  }, [section]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      const backendUrl = getApiBaseUrl();
      const response = await fetch(`${backendUrl}/articles/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setArticles(articles.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error('Error deleting article:', err);
    }
  };

  const filteredArticles = articles.filter((a) => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{sectionName} Articles</h1>
              <p className="text-gray-600 mt-2">{filteredArticles.length} articles</p>
            </div>
            <Link
              href={`/admin/sections/${section}/new`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Article
            </Link>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'published', 'draft'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Table */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading articles...</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No articles found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Author</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Views</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Likes</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredArticles.map((article) => (
                    <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">
                        {article.title}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            article.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {article.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {article.author.displayName || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{Number(article.viewCount)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{Number(article.likeCount)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(article.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/sections/${section}/${article.slug}`}
                            target="_blank"
                            className="p-2 text-teal-600 hover:bg-teal-50 rounded transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/sections/${section}/${article.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(article.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getApiBaseUrl } from '@/app/lib/api-base';
import { getStoredAuthToken } from '@/app/context/auth';
import { ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface ArticleForm {
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  status: 'draft' | 'published';
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

export default function ArticleEditorPage() {
  const params = useParams();
  const router = useRouter();
  const section = params.section as string;
  const articleId = params.id as string | undefined;
  const isEdit = !!articleId && articleId !== 'new';

  const [form, setForm] = useState<ArticleForm>({
    title: '',
    excerpt: '',
    content: '',
    coverImageUrl: '',
    status: 'draft',
  });
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authToken = getStoredAuthToken();

  const sectionName = SECTIONS.find((s) => s.id === section)?.name || section;

  useEffect(() => {
    if (isEdit && articleId) {
      const fetchArticle = async () => {
        try {
          const backendUrl = getApiBaseUrl();
          const response = await fetch(`${backendUrl}/articles/admin/${articleId}`, {
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
          });
          if (response.ok) {
            const article = await response.json();
            setForm({
              title: article.title,
              excerpt: article.excerpt || '',
              content: article.content,
              coverImageUrl: article.coverImageUrl || '',
              status: article.status,
            });
          }
        } catch (err) {
          setError('Failed to load article');
        } finally {
          setLoading(false);
        }
      };

      fetchArticle();
    }
  }, [isEdit, articleId, authToken]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const backendUrl = getApiBaseUrl();
      const response = await fetch(`${backendUrl}/admin/articles/upload`, {
        method: 'POST',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setForm((prev) => ({ ...prev, coverImageUrl: data.imageUrl }));
      } else {
        setError('Failed to upload image');
      }
    } catch (err) {
      setError('Error uploading image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const backendUrl = getApiBaseUrl();
      const url = isEdit ? `${backendUrl}/articles/${articleId}` : `${backendUrl}/articles/${section}`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        router.push(`/admin/sections/${section}`);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save article');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href={`/admin/sections/${section}`}
            className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {sectionName}
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            {isEdit ? 'Edit Article' : 'Create Article'}
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Article title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Excerpt */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Excerpt</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              placeholder="Brief summary of the article"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              rows={3}
            />
          </div>

          {/* Cover Image */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Cover Image</label>
            <div className="flex flex-col gap-4">
              {form.coverImageUrl && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden">
                  <Image
                    src={form.coverImageUrl}
                    alt="Cover"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload className="w-5 h-5 text-gray-600" />
                <span className="text-gray-600">Click to upload image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Content */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Content</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Write your article content here..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-vertical font-mono text-sm"
              rows={16}
            />
          </div>

          {/* Status */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as 'draft' | 'published' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Link
              href={`/admin/sections/${section}`}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 transition-colors"
            >
              {submitting ? 'Saving...' : isEdit ? 'Update Article' : 'Create Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

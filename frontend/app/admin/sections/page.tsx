'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getApiBaseUrl } from '@/app/lib/api-base';
import { Plus, BarChart3 } from 'lucide-react';

interface SectionStats {
  section: string;
  published: number;
  draft: number;
  total: number;
}

const SECTIONS = [
  { id: 'news', name: 'News', description: 'Latest news and updates' },
  { id: 'literature', name: 'Literature', description: 'Literary works and reviews' },
  { id: 'activities', name: 'Activities', description: 'Activities and events' },
  { id: 'special_report', name: 'Special Report', description: 'In-depth reports' },
  { id: 'health', name: 'Health', description: 'Health and wellness' },
  { id: 'interesting', name: 'Interesting', description: 'Interesting stories' },
  { id: 'sport', name: 'Sport', description: 'Sports news and updates' },
  { id: 'entertainment', name: 'Entertainment', description: 'Entertainment news' },
];

export default function AdminSectionsPage() {
  const [stats, setStats] = useState<Record<string, SectionStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const backendUrl = getApiBaseUrl();
        const statsData: Record<string, SectionStats> = {};

        for (const section of SECTIONS) {
          try {
            const response = await fetch(`${backendUrl}/articles/sections/${section.id}/stats`);
            if (response.ok) {
              const data = await response.json();
              statsData[section.id] = data;
            }
          } catch (err) {
            console.error(`Error fetching stats for ${section.id}:`, err);
          }
        }

        setStats(statsData);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-teal-600" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Content Links</h1>
          </div>
          <p className="text-gray-600">Manage articles across all links</p>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading sections...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SECTIONS.map((section) => {
              const sectionStats = stats[section.id];
              return (
                <Link
                  key={section.id}
                  href={`/admin/sections/${section.id}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-teal-600 group cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 group-hover:text-teal-600 transition-colors">
                        {section.name}
                      </h2>
                      <p className="text-sm text-gray-600">{section.description}</p>
                    </div>
                    <Plus className="w-6 h-6 text-gray-400 group-hover:text-teal-600 transition-colors" />
                  </div>

                  {sectionStats && (
                    <div className="grid grid-cols-3 gap-2 py-4 border-t border-gray-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-teal-600">
                          {sectionStats.published}
                        </div>
                        <p className="text-xs text-gray-600">Published</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {sectionStats.draft}
                        </div>
                        <p className="text-xs text-gray-600">Draft</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">
                          {sectionStats.total}
                        </div>
                        <p className="text-xs text-gray-600">Total</p>
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

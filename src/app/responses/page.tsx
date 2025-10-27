'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Phone, User, Calendar, ArrowLeft, Filter, Download } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { ClientOnly } from '@/components/LoadingSpinner';
import Link from 'next/link';

interface SurveyResponse {
  id: string;
  call_id: string;
  question_number: number;
  question_text: string;
  response_text: string;
  response_sentiment: 'positive' | 'neutral' | 'negative' | null;
  created_at: string;
}

interface Call {
  id: string;
  customer_first_name: string;
  customer_phone: string;
  call_status: string;
  call_duration?: number;
  created_at: string;
}

export default function ResponsesPage() {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Fetch responses from backend
        const data = await apiClient.reports.responses();
        setResponses(data || []);
      } catch (error) {
        console.error('Error loading responses:', error);
        setResponses([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-50';
      case 'negative':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredResponses = filter === 'all' 
    ? responses 
    : responses.filter(r => r.response_sentiment === filter);

  return (
    <ClientOnly fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-48 mx-auto"></div>
          </div>
        </div>
      </div>
    }>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <Link href="/" className="text-gray-500 hover:text-gray-700">
                  <ArrowLeft className="h-6 w-6" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Survey Responses
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    View customer feedback and insights
                  </p>
                </div>
              </div>
              {responses.length > 0 && (
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filter Tabs */}
          {responses.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter:</span>
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-md text-sm ${
                    filter === 'all'
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('positive')}
                  className={`px-3 py-1 rounded-md text-sm ${
                    filter === 'positive'
                      ? 'bg-green-100 text-green-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Positive
                </button>
                <button
                  onClick={() => setFilter('neutral')}
                  className={`px-3 py-1 rounded-md text-sm ${
                    filter === 'neutral'
                      ? 'bg-gray-100 text-gray-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Neutral
                </button>
                <button
                  onClick={() => setFilter('negative')}
                  className={`px-3 py-1 rounded-md text-sm ${
                    filter === 'negative'
                      ? 'bg-red-100 text-red-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Negative
                </button>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          {responses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-500">Total Responses</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{responses.length}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-500">Positive</div>
                <div className="text-3xl font-bold text-green-600 mt-2">
                  {responses.filter(r => r.response_sentiment === 'positive').length}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-500">Neutral</div>
                <div className="text-3xl font-bold text-gray-600 mt-2">
                  {responses.filter(r => r.response_sentiment === 'neutral').length}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-500">Negative</div>
                <div className="text-3xl font-bold text-red-600 mt-2">
                  {responses.filter(r => r.response_sentiment === 'negative').length}
                </div>
              </div>
            </div>
          )}

          {/* Responses List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading responses...</p>
              </div>
            </div>
          ) : filteredResponses.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No responses yet</h3>
              <p className="text-gray-500 mb-6">
                {responses.length === 0
                  ? 'Survey responses will appear here after calls are completed'
                  : 'No responses match the selected filter'}
              </p>
              <Link href="/test" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                <Phone className="h-4 w-4 mr-2" />
                Test a Call
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="divide-y divide-gray-200">
                {filteredResponses.map((response) => (
                  <div key={response.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-xs font-semibold text-blue-600">
                            Q{response.question_number}
                          </span>
                          {response.response_sentiment && (
                            <span className={`text-xs px-2 py-1 rounded-full ${getSentimentColor(response.response_sentiment)}`}>
                              {response.response_sentiment}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          {response.question_text}
                        </h4>
                        <p className="text-gray-700 mt-2">
                          {response.response_text}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400 ml-4">
                        {new Date(response.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </ClientOnly>
  );
}

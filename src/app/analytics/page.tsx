'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Phone, MessageSquare, TrendingUp, Clock, CheckCircle, XCircle, Users, ArrowLeft, PieChart } from 'lucide-react';
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

interface Analytics {
  totalCalls: number;
  completedCalls: number;
  failedCalls: number;
  noAnswerCalls: number;
  completionRate: number;
  averageDuration: number;
  totalResponses: number;
  responsesByQuestion: Record<number, number>;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  responseRate: number;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all data
        const [callsData, responsesData] = await Promise.all([
          apiClient.calls.list(),
          apiClient.reports.responses()
        ]);

        setCalls(callsData || []);
        setResponses(responsesData || []);

        // Calculate analytics
        const analyticsData = calculateAnalytics(callsData, responsesData);
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const calculateAnalytics = (calls: Call[], responses: SurveyResponse[]): Analytics => {
    const totalCalls = calls.length;
    const completedCalls = calls.filter(c => c.call_status === 'completed').length;
    const failedCalls = calls.filter(c => c.call_status === 'failed').length;
    const noAnswerCalls = calls.filter(c => c.call_status === 'no-answer').length;
    const inProgressCalls = calls.filter(c => c.call_status === 'in-progress').length;
    
    const completionRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;
    
    const completedCallsWithDuration = calls.filter(c => c.call_status === 'completed' && c.call_duration);
    const averageDuration = completedCallsWithDuration.length > 0
      ? completedCallsWithDuration.reduce((sum, c) => sum + (c.call_duration || 0), 0) / completedCallsWithDuration.length
      : 0;

    // Responses by question
    const responsesByQuestion: Record<number, number> = {};
    responses.forEach(r => {
      responsesByQuestion[r.question_number] = (responsesByQuestion[r.question_number] || 0) + 1;
    });

    // Sentiment breakdown
    const sentimentBreakdown = {
      positive: responses.filter(r => r.response_sentiment === 'positive').length,
      neutral: responses.filter(r => r.response_sentiment === 'neutral' || r.response_sentiment === null).length,
      negative: responses.filter(r => r.response_sentiment === 'negative').length,
    };

    const totalCustomers = new Set(calls.map(c => c.customer_phone)).size;
    const uniqueCompletedCalls = new Set(calls.filter(c => c.call_status === 'completed').map(c => c.id)).size;
    const responseRate = totalCustomers > 0 ? (uniqueCompletedCalls / totalCustomers) * 100 : 0;

    return {
      totalCalls,
      completedCalls,
      failedCalls,
      noAnswerCalls,
      completionRate: Math.round(completionRate * 100) / 100,
      averageDuration: Math.round(averageDuration),
      totalResponses: responses.length,
      responsesByQuestion,
      sentimentBreakdown,
      responseRate: Math.round(responseRate * 100) / 100,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'no-answer':
        return 'text-yellow-600 bg-yellow-50';
      case 'in-progress':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

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
                    Survey Analytics
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Comprehensive survey insights and metrics
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading analytics...</p>
              </div>
            </div>
          ) : !analytics ? (
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-500">Start making calls to see analytics</p>
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Calls</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalCalls}</p>
                    </div>
                    <Phone className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Completion Rate</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">{analytics.completionRate}%</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Responses</p>
                      <p className="text-3xl font-bold text-purple-600 mt-2">{analytics.totalResponses}</p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-purple-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Avg Duration</p>
                      <p className="text-3xl font-bold text-orange-600 mt-2">{formatDuration(analytics.averageDuration)}</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Call Status Breakdown */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Phone className="h-5 w-5 mr-2" />
                    Call Status
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-sm text-gray-700">Completed</span>
                      </div>
                      <span className="font-semibold text-gray-900">{analytics.completedCalls}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 text-red-600 mr-2" />
                        <span className="text-sm text-gray-700">Failed</span>
                      </div>
                      <span className="font-semibold text-gray-900">{analytics.failedCalls}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-yellow-600 mr-2" />
                        <span className="text-sm text-gray-700">No Answer</span>
                      </div>
                      <span className="font-semibold text-gray-900">{analytics.noAnswerCalls}</span>
                    </div>
                  </div>
                </div>

                {/* Sentiment Analysis */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <PieChart className="h-5 w-5 mr-2" />
                    Sentiment Breakdown
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">Positive</span>
                        <span className="font-semibold text-green-600">{analytics.sentimentBreakdown.positive}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ 
                            width: `${analytics.totalResponses > 0 ? (analytics.sentimentBreakdown.positive / analytics.totalResponses) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">Neutral</span>
                        <span className="font-semibold text-gray-600">{analytics.sentimentBreakdown.neutral}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gray-600 h-2 rounded-full" 
                          style={{ 
                            width: `${analytics.totalResponses > 0 ? (analytics.sentimentBreakdown.neutral / analytics.totalResponses) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">Negative</span>
                        <span className="font-semibold text-red-600">{analytics.sentimentBreakdown.negative}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-600 h-2 rounded-full" 
                          style={{ 
                            width: `${analytics.totalResponses > 0 ? (analytics.sentimentBreakdown.negative / analytics.totalResponses) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Response Statistics by Question */}
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Responses by Question
                </h3>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(qNum => (
                    <div key={qNum}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Question {qNum}</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {analytics.responsesByQuestion[qNum] || 0} responses
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                          style={{ 
                            width: `${analytics.totalResponses > 0 ? ((analytics.responsesByQuestion[qNum] || 0) / analytics.totalResponses) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Calls</h3>
                {calls.length === 0 ? (
                  <div className="text-center py-8">
                    <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No calls yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Phone
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duration
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {calls.slice(0, 10).map((call) => (
                          <tr key={call.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {call.customer_first_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {call.customer_phone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(call.call_status)}`}>
                                {call.call_status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {call.call_duration ? formatDuration(call.call_duration) : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(call.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </ClientOnly>
  );
}

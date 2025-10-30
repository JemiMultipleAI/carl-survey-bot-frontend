'use client';

import { useState, useEffect } from 'react';
import { Phone, Loader2, CheckCircle, XCircle, ArrowLeft, Play, Users } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { ClientOnly } from '@/components/LoadingSpinner';
import Link from 'next/link';

interface Contact {
  id: string;
  first_name: string;
  last_name?: string;
  phone_number: string;
  company_name?: string;
}

export default function CampaignPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [maxConcurrent, setMaxConcurrent] = useState(5);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.customers.list();
        setContacts(data || []);
      } catch (error) {
        console.error('Error loading contacts:', error);
        setError('Failed to load contacts');
      } finally {
        setIsLoading(false);
      }
    };
    loadContacts();
  }, []);

  const toggleContact = (contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const selectAll = () => {
    setSelectedContacts(contacts.map(c => c.id));
  };

  const deselectAll = () => {
    setSelectedContacts([]);
  };

  const startCampaign = async () => {
    if (selectedContacts.length === 0) {
      setError('Please select at least one contact');
      return;
    }

    setIsStarting(true);
    setError(null);
    setResult(null);

    try {
      const result = await apiClient.calls.batch({
        customerIds: selectedContacts,
        maxConcurrent: maxConcurrent,
      });

      setResult(result);
      if (result.success) {
        // Deselect all after successful start
        setTimeout(() => {
          setSelectedContacts([]);
        }, 3000);
      }
    } catch (error) {
      setError('Failed to start campaign. Please try again.');
      console.error('Start campaign error:', error);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <ClientOnly fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
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
                    Start Campaign
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Select contacts and initiate survey calls
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Campaign Settings */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Campaign Settings</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="maxConcurrent" className="block text-sm font-medium text-gray-700 mb-2">
                  Max Concurrent Calls
                </label>
                <input
                  type="number"
                  id="maxConcurrent"
                  min="1"
                  max="20"
                  value={maxConcurrent}
                  onChange={(e) => setMaxConcurrent(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Number of simultaneous calls (1-20, recommended: 5)
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {selectedContacts.length} of {contacts.length} contacts selected
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={selectAll}
                  disabled={isLoading || contacts.length === 0}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAll}
                  disabled={selectedContacts.length === 0}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Deselect All
                </button>
                <button
                  onClick={startCampaign}
                  disabled={selectedContacts.length === 0 || isStarting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Campaign
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {result && result.success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6 flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-green-800">Campaign Started Successfully!</h3>
                <p className="mt-1 text-sm text-green-700">
                  Started {result.successful} of {result.total} calls.
                  {result.failed > 0 && ` ${result.failed} failed.`}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 flex items-start">
              <XCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Contacts List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-500 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Select Contacts</h2>
                <Link href="/contacts" className="ml-4 text-sm text-blue-600 hover:text-blue-700">
                  Manage Contacts →
                </Link>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No contacts available</p>
                <p className="text-sm text-gray-400 mt-1">
                  <Link href="/contacts" className="text-blue-600 hover:text-blue-700">
                    Add contacts
                  </Link> to start a campaign
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`px-6 py-4 cursor-pointer hover:bg-gray-50 ${
                      selectedContacts.includes(contact.id) ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => toggleContact(contact.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedContacts.includes(contact.id)}
                          onChange={() => toggleContact(contact.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-gray-900">
                            {contact.first_name} {contact.last_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            <Phone className="inline h-3 w-3 mr-1" />
                            {contact.phone_number}
                          </p>
                          {contact.company_name && (
                            <p className="text-xs text-gray-400 mt-1">
                              {contact.company_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ClientOnly>
  );
}


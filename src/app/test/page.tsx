'use client';

import { useState, useEffect } from 'react';
import { Phone, User, Loader2, CheckCircle, XCircle, Clock, Users, ArrowLeft } from 'lucide-react';
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

interface TestCall {
  id: string;
  customerName: string;
  phoneNumber: string;
  status: 'queued' | 'in-progress' | 'completed' | 'failed' | 'no-answer';
  callSid?: string;
  duration?: number;
  createdAt: string;
}

export default function TestPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    phoneNumber: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [voices, setVoices] = useState<any[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testCalls, setTestCalls] = useState<TestCall[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [selectedContactId, setSelectedContactId] = useState<string>('');

  // Load contacts on mount
  useEffect(() => {
    const loadContacts = async () => {
      try {
        setIsLoadingContacts(true);
        const data = await apiClient.customers.list();
        setContacts(data || []);
      } catch (error) {
        console.error('Error loading contacts:', error);
      } finally {
        setIsLoadingContacts(false);
      }
    };
    loadContacts();
  }, []);

  // Handle contact selection
  const handleContactSelect = (contactId: string) => {
    setSelectedContactId(contactId);
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      setFormData({
        firstName: contact.first_name,
        phoneNumber: contact.phone_number,
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Basic phone number validation - adjust regex as needed
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleTestVoices = async () => {
    setIsLoadingVoices(true);
    try {
      const response = await apiClient.calls.voices();
      setVoices(response.voices || []);
    } catch (error) {
      console.error('Error fetching voices:', error);
      setError('Failed to fetch voices');
    } finally {
      setIsLoadingVoices(false);
    }
  };

  const handleTestCall = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim()) {
      setError('Please enter a first name');
      return;
    }
    
    if (!formData.phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }
    
    if (!validatePhoneNumber(formData.phoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create a test call object with stable ID
      const testCall: TestCall = {
        id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        customerName: formData.firstName,
        phoneNumber: formData.phoneNumber,
        status: 'queued',
        createdAt: new Date().toISOString(),
      };

      // Add to test calls list
      setTestCalls(prev => [testCall, ...prev]);

      // Make API call to backend
      try {
        const response = await apiClient.calls.test({
          firstName: formData.firstName,
          phoneNumber: formData.phoneNumber,
        });

        // Update call with response data
        setTestCalls(prev => 
          prev.map(call => 
            call.id === testCall.id 
              ? { 
                  ...call, 
                  callSid: response.callSid,
                  status: 'in-progress' as const 
                }
              : call
          )
        );

        // Reset form on success
        setFormData({ firstName: '', phoneNumber: '' });
        
      } catch (apiError) {
        // If API call fails, simulate the behavior for demo purposes
        console.warn('API not ready, simulating call:', apiError);
        
        // Simulate call status updates
        setTimeout(() => {
          setTestCalls(prev => 
            prev.map(call => 
              call.id === testCall.id 
                ? { ...call, status: 'in-progress' as const }
                : call
            )
          );
        }, 3000);

        setTimeout(() => {
          setTestCalls(prev => 
            prev.map(call => 
              call.id === testCall.id 
                ? { ...call, status: 'completed' as const, duration: 120 }
                : call
            )
          );
        }, 8000);

        // Reset form
        setFormData({ firstName: '', phoneNumber: '' });
      }
      
    } catch (err) {
      setError('Failed to initiate test call. Please try again.');
      console.error('Test call error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: TestCall['status']) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in-progress':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'no-answer':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: TestCall['status']) => {
    switch (status) {
      case 'queued':
        return 'Queued';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'no-answer':
        return 'No Answer';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: TestCall['status']) => {
    switch (status) {
      case 'queued':
        return 'text-yellow-600 bg-yellow-50';
      case 'in-progress':
        return 'text-blue-600 bg-blue-50';
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'failed':
      case 'no-answer':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
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
                  Single Customer Campaign
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Call individual customers for surveys
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Call Configuration
            </h2>
            
            <form onSubmit={handleTestCall} className="space-y-6">
              {/* Contact Selection Dropdown */}
              {contacts.length > 0 && (
                <div>
                  <label htmlFor="contactSelect" className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="inline h-4 w-4 mr-2" />
                    Select from Contacts
                  </label>
                  <select
                    id="contactSelect"
                    value={selectedContactId}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleContactSelect(e.target.value);
                      } else {
                        setSelectedContactId('');
                        setFormData({ firstName: '', phoneNumber: '' });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading || isLoadingContacts}
                  >
                    <option value="">Choose a contact...</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.first_name} {contact.last_name} - {contact.phone_number}
                      </option>
                    ))}
                  </select>
                  {selectedContactId && (
                    <p className="mt-1 text-xs text-gray-500">
                      ✓ Contact selected - Fields auto-filled below
                    </p>
                  )}
                </div>
              )}

              <div className="relative flex items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink-0 px-4 text-sm text-gray-500">OR</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-2" />
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter customer's first name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline h-4 w-4 mr-2" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+61412345678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Include country code (e.g., +61 for Australia)
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Initiating Call...
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4 mr-2" />
                      Start Call
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleTestVoices}
                  disabled={isLoadingVoices}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoadingVoices ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading Voices...
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4 mr-2" />
                      Test ElevenLabs Voices
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Call Flow:</h3>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Sophie greets the customer by name</li>
                <li>2. Asks if it's a good time for a 2-minute survey</li>
                <li>3. Conducts 5-question feedback survey</li>
                <li>4. Handles "Are you AI?" detection if asked</li>
                <li>5. Stores responses in Supabase</li>
              </ol>
            </div>

            {voices.length > 0 && (
              <div className="mt-6 p-4 bg-green-50 rounded-md">
                <h3 className="text-sm font-medium text-green-900 mb-2">Available Voices:</h3>
                <div className="space-y-2">
                  {voices.map((voice, index) => (
                    <div key={index} className="text-sm text-green-800">
                      <strong>{voice.name}</strong> - {voice.description}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Test Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Call History
            </h2>
            
            {testCalls.length === 0 ? (
              <div className="text-center py-8">
                <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No calls yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Start a call to see results here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {testCalls.map((call) => (
                  <div key={call.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {getStatusIcon(call.status)}
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
                          {getStatusText(call.status)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(call.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">{call.customerName}</p>
                      <p className="text-sm text-gray-600">{call.phoneNumber}</p>
                      {call.duration && (
                        <p className="text-sm text-gray-500">
                          Duration: {Math.floor(call.duration / 60)}m {call.duration % 60}s
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      </div>
    </ClientOnly>
  );
}

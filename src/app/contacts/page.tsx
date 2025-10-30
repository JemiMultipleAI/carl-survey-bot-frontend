'use client';

import { useState, useEffect } from 'react';
import { User, Phone, Building, Loader2, CheckCircle, XCircle, ArrowLeft, Upload, FileText } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { ClientOnly } from '@/components/LoadingSpinner';
import Link from 'next/link';

interface Contact {
  id: string;
  first_name: string;
  last_name?: string;
  phone_number: string;
  company_name?: string;
  uploaded_at: string;
}

export default function ContactsPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    companyName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  // Load existing contacts
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
  }, [success]);

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return;
    }
    
    if (!formData.phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }

    if (!validatePhoneNumber(formData.phoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Create customer via API
      await apiClient.customers.create({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        companyName: formData.companyName,
      });

      setSuccess(true);
      setFormData({ firstName: '', lastName: '', phoneNumber: '', companyName: '' });
      
      // Reload contacts
      const data = await apiClient.customers.list();
      setContacts(data || []);
    } catch (error) {
      setError('Failed to add contact. Please try again.');
      console.error('Add contact error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCSVUpload = async () => {
    if (!csvFile) {
      setError('Please select a CSV file');
      return;
    }

    if (!csvFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setIsUploadingCSV(true);
    setError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('csv', csvFile);

      const result = await apiClient.customers.upload(formData);
      setUploadResult(result);
      
      if (result.success && result.inserted > 0) {
        setSuccess(true);
        setCsvFile(null);
        
        // Reload contacts
        const data = await apiClient.customers.list();
        setContacts(data || []);
      } else {
        setError(`Failed to upload: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      setError('Failed to upload CSV file. Please try again.');
      console.error('CSV upload error:', error);
    } finally {
      setIsUploadingCSV(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setError(null);
      setUploadResult(null);
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
                    Customer Contacts
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Add and manage customer contact information
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* CSV Upload Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Upload CSV File
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload a CSV file with customer data. Required columns: first_name, phone_number. Optional: last_name, company_name.
            </p>
            
            <div className="flex items-center space-x-4">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploadingCSV}
                />
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {csvFile ? csvFile.name : 'Choose CSV file'}
                    </span>
                  </div>
                </div>
              </label>
              
              <button
                onClick={handleCSVUpload}
                disabled={!csvFile || isUploadingCSV}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isUploadingCSV ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </button>
            </div>

            {uploadResult && (
              <div className={`mt-4 p-3 rounded-md flex items-center ${
                uploadResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                {uploadResult.success ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <div className="text-sm text-green-600">
                      Uploaded {uploadResult.inserted} of {uploadResult.total} contacts successfully.
                      {uploadResult.errors > 0 && ` ${uploadResult.errors} errors.`}
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600 mr-2" />
                    <div className="text-sm text-red-600">
                      {uploadResult.error || 'Upload failed'}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Add Contact Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Add New Contact
              </h2>
              
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-sm text-green-600">Contact added successfully!</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 flex items-center">
                  <XCircle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline h-4 w-4 mr-2" />
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter first name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline h-4 w-4 mr-2" />
                    Last Name (Optional)
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter last name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="inline h-4 w-4 mr-2" />
                    Phone Number *
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
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Include country code (e.g., +61 for Australia)
                  </p>
                </div>

                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="inline h-4 w-4 mr-2" />
                    Company Name (Optional)
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Enter company name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding Contact...
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4 mr-2" />
                      Add Contact
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Contacts List */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Recent Contacts
              </h2>
              
              {isLoadingContacts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : contacts.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No contacts yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Add a contact to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {contacts.slice(0, 10).map((contact) => (
                    <div key={contact.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {contact.first_name} {contact.last_name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            <Phone className="inline h-3 w-3 mr-1" />
                            {contact.phone_number}
                          </p>
                          {contact.company_name && (
                            <p className="text-sm text-gray-500 mt-1">
                              <Building className="inline h-3 w-3 mr-1" />
                              {contact.company_name}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(contact.uploaded_at).toLocaleDateString()}
                        </div>
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

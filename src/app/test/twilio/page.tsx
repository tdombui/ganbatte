'use client';

import { useState } from 'react';

interface TestResponse {
  error?: string;
  customer?: {
    id: string;
    phone_number: string;
    name: string;
  };
  response?: string;
  isJobRequest?: boolean;
  timestamp?: string;
}

export default function TwilioTestPage() {
  const [phoneNumber, setPhoneNumber] = useState('5551234567');
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<TestResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const testMessages = [
    "Hi, I need a delivery",
    "I want to send a package from 123 Main St to 456 Oak Ave",
    "What services do you offer?",
    "I need pickup from 789 Pine St and delivery to 321 Elm St",
    "How much does delivery cost?",
    "Can you pick up from my house at 555 Broadway and deliver to 777 Sunset Blvd?"
  ];

  const handleTest = async () => {
    if (!phoneNumber || !message) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/test/twilio-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.startsWith('+1') ? phoneNumber : `+1${phoneNumber}`,
          message
        }),
      });

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error('Test error:', error);
      setResponse({ error: 'Failed to test webhook' });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTest = (testMessage: string) => {
    setMessage(testMessage);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Twilio SMS Test Page</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="5551234567"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleTest}
            disabled={loading || !phoneNumber || !message}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Testing...' : 'Test SMS Webhook'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Quick Test Messages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {testMessages.map((testMessage, index) => (
            <button
              key={index}
              onClick={() => handleQuickTest(testMessage)}
              className="text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              {testMessage}
            </button>
          ))}
        </div>
      </div>

      {response && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Response</h2>
          
          {response.error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">Error: {response.error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-green-800 font-medium">✅ Success!</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Customer Info:</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p><strong>ID:</strong> {response.customer?.id}</p>
                  <p><strong>Phone:</strong> {response.customer?.phone_number}</p>
                  <p><strong>Name:</strong> {response.customer?.name}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">AI Response:</h3>
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-blue-900">{response.response}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Details:</h3>
                <div className="bg-gray-50 p-3 rounded-md text-sm">
                  <p><strong>Job Request Detected:</strong> {response.isJobRequest ? 'Yes' : 'No'}</p>
                  <p><strong>Timestamp:</strong> {response.timestamp}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <h3 className="font-medium text-yellow-800 mb-2">How to Test:</h3>
        <ol className="list-decimal list-inside space-y-1 text-yellow-700">
          <li>Enter a phone number (will be formatted as +1XXXXXXXXXX)</li>
          <li>Type a message or use a quick test message</li>
          <li>Click &quot;Test SMS Webhook&quot; to simulate a Twilio webhook</li>
          <li>Check the response to see how the AI would handle it</li>
          <li>Try different messages to test various scenarios</li>
        </ol>
      </div>
    </div>
  );
} 
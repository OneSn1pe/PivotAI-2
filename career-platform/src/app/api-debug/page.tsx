import ApiDebugger from '@/components/Debug';

export default function ApiDebugPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">API Debugging Page</h1>
      <p className="mb-6 text-gray-600">
        This page helps diagnose API issues by testing endpoints with different HTTP methods
        and examining the responses. Use it to identify if problems are related to CORS, 
        middleware, or specific API implementations.
      </p>
      
      <ApiDebugger />
    </div>
  );
} 
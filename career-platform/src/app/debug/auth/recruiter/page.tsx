import RecruiterDebugPage from '../recruiter-debug';
import Link from 'next/link';

export default function RecruiterDebugPageContainer() {
  return (
    <>
      <RecruiterDebugPage />
      <div className="p-4 bg-white rounded shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Debug Tools</h2>
        <ul className="space-y-2">
          <li>
            <Link href="/debug/roadmap-access" className="text-blue-500 hover:underline">
              Test Roadmap Access Rules
            </Link>
          </li>
          <li>
            <Link href="/debug/direct-roadmap-test" className="text-blue-500 hover:underline">
              Direct Roadmap Test (New)
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
} 
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="max-w-4xl w-full">
        <h1 className="text-5xl font-bold text-center mb-8">
          Atlas Protocol
        </h1>
        <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-12">
          IP-backed lending with Collateral Value Score (CVS)
        </p>
        
        <div className="flex justify-center mb-12">
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-lg"
          >
            Open Dashboard →
          </Link>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold mb-3">💎 CVS-Based Lending</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Dynamic loan terms based on IP usage and licensing revenue via Collateral Value Score
            </p>
          </div>
          
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold mb-3">📊 Real-time Analytics</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Goldsky subgraph indexing for instant CVS updates and vault monitoring
            </p>
          </div>
          
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold mb-3">🔗 Story Protocol</h2>
            <p className="text-gray-600 dark:text-gray-400">
              IP registration and licensing on Story Protocol blockchain
            </p>
          </div>
        </div>

        <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-xl font-semibold mb-3">Integrated Technologies</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-semibold">📄 Story Protocol</span>
              <p className="text-gray-600 dark:text-gray-400">IP Asset Management</p>
            </div>
            <div>
              <span className="font-semibold">🌉 Owlto Finance</span>
              <p className="text-gray-600 dark:text-gray-400">Cross-chain Bridge</p>
            </div>
            <div>
              <span className="font-semibold">🌐 World ID</span>
              <p className="text-gray-600 dark:text-gray-400">Identity Verification</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


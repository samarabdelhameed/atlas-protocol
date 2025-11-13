export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="max-w-4xl w-full">
        <h1 className="text-5xl font-bold text-center mb-8">
          Atlas Protocol
        </h1>
        <p className="text-xl text-center text-gray-600 mb-12">
          Decentralized protocol featuring ADLV and IDO mechanisms
        </p>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold mb-3">GenAI Licensing</h2>
            <p className="text-gray-600">
              Powered by Story Protocol for intellectual property management
            </p>
          </div>
          
          <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold mb-3">Cross-Chain Bridge</h2>
            <p className="text-gray-600">
              Seamless asset transfers via Owlto Finance integration
            </p>
          </div>
          
          <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold mb-3">World ID</h2>
            <p className="text-gray-600">
              Secure identity verification for all users
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}


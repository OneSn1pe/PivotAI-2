import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Career Platform</h1>
          <div>
            <Link 
              href="/login"
              className="mr-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              Login
            </Link>
            <Link 
              href="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="py-12 md:py-24 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="md:w-1/2 md:pr-12">
                <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
                  Accelerate Your Career With AI-Powered Guidance
                </h2>
                <p className="text-xl mb-8">
                  Get personalized career roadmaps, skill recommendations, and connect with recruiters looking for talent like you.
                </p>
                <Link 
                  href="/register"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium text-lg inline-block"
                >
                  Start Your Journey
                </Link>
              </div>
              <div className="hidden md:block md:w-1/2">
                {/* Placeholder for an illustration */}
                <div className="bg-white/10 rounded-lg p-8 backdrop-blur-sm">
                  <div className="aspect-w-16 aspect-h-9 bg-white/5 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mb-4">1</div>
                <h3 className="text-xl font-bold mb-3">Upload Your Resume</h3>
                <p className="text-gray-600">
                  Our AI analyzes your experience, skills, and achievements to understand your career profile.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mb-4">2</div>
                <h3 className="text-xl font-bold mb-3">Set Your Preferences</h3>
                <p className="text-gray-600">
                  Tell us about your dream roles, industries, and goals to get personalized recommendations.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mb-4">3</div>
                <h3 className="text-xl font-bold mb-3">Follow Your Roadmap</h3>
                <p className="text-gray-600">
                  Get a customized career development plan with actionable milestones to achieve your goals.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">For Recruiters</h2>
            
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="md:flex md:items-center">
                <div className="md:w-1/2 md:pr-12">
                  <h3 className="text-2xl font-bold mb-4">Discover Qualified Talent</h3>
                  <p className="text-gray-600 mb-6">
                    Find candidates with the exact skills and career goals that match your opportunities. Our AI-powered platform helps you connect with the right talent faster.
                  </p>
                  <Link 
                    href="/register"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium inline-block"
                  >
                    Join as a Recruiter
                  </Link>
                </div>
                <div className="hidden md:block md:w-1/2 md:pl-12">
                  {/* Placeholder for an illustration */}
                  <div className="bg-gray-100 rounded-lg p-6 aspect-w-4 aspect-h-3"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-xl font-bold text-white">Career Platform</h2>
              <p className="mt-2">AI-powered career development</p>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-8">
              <Link href="/register" className="text-gray-300 hover:text-white">
                Get Started
              </Link>
              <Link href="/login" className="text-gray-300 hover:text-white">
                Login
              </Link>
              <Link href="#" className="text-gray-300 hover:text-white">
                About Us
              </Link>
              <Link href="#" className="text-gray-300 hover:text-white">
                Contact
              </Link>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Career Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
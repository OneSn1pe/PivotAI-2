import React from 'react';
import Link from 'next/link';
import ContactForm from '@/components/ContactForm';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-sky-50 to-slate-100">
      <header className="bg-white/70 backdrop-filter backdrop-blur-md shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-sky-800">PivotAI</h1>
          <div>
            <Link 
              href="/auth/login"
              className="mr-4 text-sky-600 hover:text-sky-800 font-medium"
            >
              Login
            </Link>
            <Link 
              href="/auth/register"
              className="cloud-btn bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="py-12 md:py-20 bg-gradient-to-r from-sky-500 to-indigo-600 text-white relative overflow-hidden">
          <div className="absolute top-10 right-10">
            <div className="cloud-md opacity-20"></div>
          </div>
          <div className="absolute bottom-5 left-20">
            <div className="cloud-lg opacity-10"></div>
          </div>
          <div className="container mx-auto px-4 relative z-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="md:w-1/2 lg:w-5/12 md:pr-8">
                <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
                  Accelerate Your Career With AI-Powered Guidance
                </h2>
                <p className="text-xl mb-8">
                  Get personalized career roadmaps, skill recommendations, and connect with recruiters looking for talent like you.
                </p>
                <Link 
                  href="/auth/register"
                  className="cloud-btn bg-white text-sky-600 hover:bg-sky-50 px-6 py-3 rounded-lg font-medium text-lg inline-block transition-all"
                >
                  Start Your Journey
                </Link>
              </div>
              <div className="hidden md:block md:w-1/2 lg:w-7/12 mt-8 md:mt-0">
                <div className="frosted-glass rounded-xl p-6 backdrop-blur-md w-full">
                  <div className="aspect-w-16 aspect-h-9 bg-white/20 rounded-lg w-full"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-10 text-sky-900">How It Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="frosted-glass p-6 rounded-xl shadow-sky-200/50 shadow-lg h-full float-card relative">
                <div className="absolute -top-3 -right-3">
                  <div className="cloud-sm opacity-30"></div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-sky-200 to-sky-300 text-sky-700 rounded-full flex items-center justify-center text-xl font-bold mb-4">1</div>
                <h3 className="text-xl font-bold mb-3 text-sky-800">Upload Your Resume</h3>
                <p className="text-slate-600">
                  Our AI analyzes your experience, skills, and achievements to understand your career profile.
                </p>
              </div>
              
              <div className="frosted-glass p-6 rounded-xl shadow-sky-200/50 shadow-lg h-full float-card relative">
                <div className="absolute -top-3 -left-3">
                  <div className="cloud-sm opacity-30"></div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-sky-200 to-sky-300 text-sky-700 rounded-full flex items-center justify-center text-xl font-bold mb-4">2</div>
                <h3 className="text-xl font-bold mb-3 text-sky-800">Set Your Preferences</h3>
                <p className="text-slate-600">
                  Tell us about your dream roles, industries, and goals to get personalized recommendations.
                </p>
              </div>
              
              <div className="frosted-glass p-6 rounded-xl shadow-sky-200/50 shadow-lg h-full float-card relative">
                <div className="absolute -bottom-3 -right-3">
                  <div className="cloud-sm opacity-30"></div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-sky-200 to-sky-300 text-sky-700 rounded-full flex items-center justify-center text-xl font-bold mb-4">3</div>
                <h3 className="text-xl font-bold mb-3 text-sky-800">Follow Your Roadmap</h3>
                <p className="text-slate-600">
                  Get a customized career development plan with actionable milestones to achieve your goals.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-gradient-to-b from-slate-50 to-sky-50 relative">
          <div className="absolute top-10 left-10">
            <div className="cloud-md opacity-20"></div>
          </div>
          <div className="container mx-auto px-4 relative z-1">
            <h2 className="text-3xl font-bold text-center mb-10 text-sky-900">For Recruiters</h2>
            
            <div className="frosted-glass p-6 md:p-8 rounded-xl shadow-sky-200/50 shadow-lg float-card">
              <div className="flex flex-col md:flex-row md:items-center">
                <div className="md:w-1/2 lg:w-3/5 md:pr-8">
                  <h3 className="text-2xl font-bold mb-4 text-sky-800">Discover Qualified Talent</h3>
                  <p className="text-slate-600 mb-6">
                    Find candidates with the exact skills and career goals that match your opportunities. Our AI-powered platform helps you connect with the right talent faster.
                  </p>
                  <Link 
                    href="/auth/register"
                    className="cloud-btn bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium inline-block transition-all"
                  >
                    Join as a Recruiter
                  </Link>
                </div>
                <div className="hidden md:block md:w-1/2 lg:w-2/5 mt-8 md:mt-0 relative">
                  <div className="absolute -top-5 -right-5">
                    <div className="cloud-md opacity-30"></div>
                  </div>
                  <div className="bg-white/50 backdrop-filter backdrop-blur-sm rounded-lg p-4 aspect-w-4 aspect-h-3 w-full"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Us Section */}
        <section id="contact" className="py-16 relative">
          <div className="absolute bottom-10 right-10">
            <div className="cloud-lg opacity-20"></div>
          </div>
          <div className="container mx-auto px-4 relative z-1">
            <h2 className="text-3xl font-bold text-center mb-10 text-sky-900">Contact Us</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-sky-800">Get In Touch</h3>
                  <p className="text-slate-600 mb-4">
                    Have questions about how PivotAI can help your career or recruitment needs? Our team is here to help. Fill out the form and we'll get back to you within 24 hours.
                  </p>
                </div>
              </div>
              
              <div className="frosted-glass rounded-xl p-6 shadow-sky-200/50 shadow-lg">
                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gradient-to-r from-sky-800 to-indigo-900 text-white py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-xl font-bold text-white">PivotAI</h2>
              <p className="mt-2 text-sky-200">AI-powered career development</p>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-8">
              <Link href="/auth/register" className="text-sky-200 hover:text-white transition-colors">
                Get Started
              </Link>
              <Link href="/auth/login" className="text-sky-200 hover:text-white transition-colors">
                Login
              </Link>
              <Link href="#" className="text-sky-200 hover:text-white transition-colors">
                About Us
              </Link>
              <Link href="#contact" className="text-sky-200 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-sky-700/50 text-center text-sm">
            <p className="text-sky-200">&copy; {new Date().getFullYear()} PivotAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
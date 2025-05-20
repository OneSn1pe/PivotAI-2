import React from 'react';
import Link from 'next/link';
import ContactForm from '@/components/ContactForm';
import Script from 'next/script';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-slate-50 to-slate-100">
      <Script id="structured-data" type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "PivotAI - Career Development Platform",
          "url": "https://pivotai.me/",
          "description": "AI-powered career development platform with personalized roadmaps and skill recommendations",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://pivotai.me/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        })}
      </Script>
      
      <header className="bg-white/70 backdrop-filter backdrop-blur-md shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-teal-800 font-inter">PivotAI Career</h1>
          <div>
            <Link 
              href="/auth/login"
              className="mr-4 text-teal-700 hover:text-teal-900 font-medium"
            >
              Login
            </Link>
            <Link 
              href="/auth/register"
              className="bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-button hover:shadow-button-hover"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="py-12 md:py-20 bg-gradient-to-r from-teal-700 to-teal-900 text-white relative overflow-hidden">
          <div className="absolute top-10 right-10 opacity-20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-40 w-40 text-teal-200" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="absolute bottom-5 left-20 opacity-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-64 w-64 text-teal-200" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
            </svg>
          </div>
          <div className="container mx-auto px-4 relative z-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="md:w-1/2 lg:w-5/12 md:pr-8">
                <h2 className="text-4xl md:text-5xl font-extrabold mb-6 font-inter">
                  Accelerate Your Career With AI-Powered Guidance
                </h2>
                <p className="text-xl mb-8">
                  Get personalized career roadmaps, skill recommendations, and connect with recruiters looking for talent like you.
                </p>
                <Link 
                  href="/auth/register"
                  className="bg-white text-teal-700 hover:bg-teal-50 px-6 py-3 rounded-lg font-medium text-lg inline-block transition-all shadow-button hover:shadow-button-hover"
                >
                  Start Your Journey
                </Link>
              </div>
              <div className="hidden md:block md:w-1/2 lg:w-7/12 mt-8 md:mt-0">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 w-full border border-teal-600/20 shadow-card">
                  <div className="aspect-w-16 aspect-h-9 bg-white/20 rounded-lg w-full"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-10 text-teal-900 font-inter">How It Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-card hover:shadow-card-hover border border-slate-200 transition-all duration-300 h-full relative">
                <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xl font-bold mb-4">1</div>
                <h3 className="text-xl font-bold mb-3 text-teal-800 font-inter">Upload Your Resume</h3>
                <p className="text-slate-600">
                  Our AI analyzes your experience, skills, and achievements to understand your career profile.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-card hover:shadow-card-hover border border-slate-200 transition-all duration-300 h-full relative">
                <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xl font-bold mb-4">2</div>
                <h3 className="text-xl font-bold mb-3 text-teal-800 font-inter">Set Your Preferences</h3>
                <p className="text-slate-600">
                  Tell us about your dream roles, industries, and goals to get personalized recommendations.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-card hover:shadow-card-hover border border-slate-200 transition-all duration-300 h-full relative">
                <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xl font-bold mb-4">3</div>
                <h3 className="text-xl font-bold mb-3 text-teal-800 font-inter">Follow Your Roadmap</h3>
                <p className="text-slate-600">
                  Get a customized career development plan with actionable milestones to achieve your goals.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Us Section */}
        <section id="contact" className="py-16 relative">
          <div className="absolute bottom-10 right-10 opacity-20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-48 w-48 text-teal-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="container mx-auto px-4 relative z-1">
            <h2 className="text-3xl font-bold text-center mb-10 text-teal-900 font-inter">Contact Us</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-teal-800 font-inter">Get In Touch</h3>
                  <p className="text-slate-600 mb-4">
                    Have questions about how PivotAI can help your career or recruitment needs? Our team is here to help. Fill out the form and we'll get back to you within 24 hours.
                  </p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-card border border-slate-200">
                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gradient-to-r from-teal-900 to-teal-800 text-white py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-xl font-bold text-white font-inter">PivotAI Career</h2>
              <p className="mt-2 text-teal-100">AI-powered career development</p>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-8">
              <Link href="/auth/register" className="text-teal-100 hover:text-white transition-colors">
                Get Started
              </Link>
              <Link href="/auth/login" className="text-teal-100 hover:text-white transition-colors">
                Login
              </Link>
              <Link href="#" className="text-teal-100 hover:text-white transition-colors">
                About Us
              </Link>
              <Link href="#contact" className="text-teal-100 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-teal-700/50 text-center text-sm">
            <p className="text-teal-100">&copy; {new Date().getFullYear()} PivotAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
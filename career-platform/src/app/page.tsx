'use client';

import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [scrollY, setScrollY] = useState(0);
  const router = useRouter();
  
  // Refs for scroll animations
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Intersection Observer for fade-in animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fadeUp');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.scroll-animate');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Check if email already exists
      const q = query(collection(db, 'waitlist'), where('email', '==', email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('This email is already on the waitlist');
      }

      // Add to waitlist
      await addDoc(collection(db, 'waitlist'), {
        email: email.toLowerCase(),
        createdAt: new Date(),
        source: 'waitlist-page',
        notified: false
      });

      setSuccess(true);
      setEmail('');
      
      // Show success message for 3 seconds then redirect
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
      
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="transform scale-100 animate-fadeIn">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-light text-gray-900 mb-3">You're on the list!</h2>
            <p className="text-gray-600 font-light">
              We'll notify you as soon as PivotAI launches.
            </p>
            <p className="text-sm text-gray-400 mt-4">Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm transition-all duration-300"
        style={{
          borderBottom: scrollY > 50 ? '1px solid rgba(0,0,0,0.08)' : '1px solid transparent'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-light text-gray-900">PivotAI</h1>
            <Link 
              href="/auth/login" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light"
            >
              Already have access?
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute -top-1/2 -right-1/2 w-full h-full opacity-5"
            style={{
              transform: `translateY(${scrollY * 0.3}px)`,
              background: 'radial-gradient(circle, #000 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }}
          />
        </div>

        <div className="max-w-4xl w-full relative z-10">
          <div 
            ref={heroRef}
            className="text-center scroll-animate opacity-0"
            style={{
              transform: `translateY(${scrollY * -0.2}px)`
            }}
          >
            <div className="inline-flex items-center justify-center px-3 py-1 bg-gray-100 text-gray-900 rounded-full text-xs font-medium mb-8">
              <span className="animate-pulse mr-2">•</span>
              Coming Soon
            </div>
            
            <h1 className="text-5xl md:text-7xl font-light text-gray-900 mb-6 leading-tight">
              Your AI-Powered
              <br />
              <span className="font-normal">Career Navigator</span>
            </h1>
            
            <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              Transform your career trajectory with personalized AI-driven roadmaps 
              and gamified learning experiences.
            </p>
          </div>

          {/* Email Form */}
          <div 
            ref={formRef}
            className="max-w-md mx-auto scroll-animate opacity-0"
            style={{
              transform: `translateY(${scrollY * -0.1}px)`
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-6 py-4 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all bg-white font-light"
                  required
                  disabled={loading}
                />
                {error && (
                  <p className="absolute -bottom-6 left-0 text-sm text-red-600 font-light">{error}</p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-light py-4 px-8 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Joining waitlist...
                  </span>
                ) : (
                  'Join the Waitlist'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6 font-light">
              Be among the first to experience the future of career development.
            </p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-light text-center text-gray-900 mb-16 scroll-animate opacity-0">
            Redefining Career Development
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "AI Resume Analysis",
                description: "Extract insights from your professional experience with advanced AI",
                icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              },
              {
                title: "Leveled Roadmaps",
                description: "Progress through 10 meticulously designed career levels",
                icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              },
              {
                title: "Gamified Learning",
                description: "Unlock achievements and track progress with engaging mechanics",
                icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="scroll-animate opacity-0 text-center"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 font-light leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "10", label: "Career Levels" },
              { number: "100+", label: "Milestones" },
              { number: "5", label: "Professional Fields" },
              { number: "∞", label: "Possibilities" }
            ].map((stat, index) => (
              <div 
                key={index}
                className="scroll-animate opacity-0"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className="text-3xl md:text-4xl font-light text-gray-900 mb-2">{stat.number}</div>
                <div className="text-sm text-gray-600 font-light">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-500 font-light">
            © 2024 PivotAI. Transforming careers with intelligence.
          </p>
        </div>
      </footer>

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-fadeUp {
          animation: fadeUp 0.8s ease-out forwards;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .scroll-animate {
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}
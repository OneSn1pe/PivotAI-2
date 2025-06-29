'use client';

import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase-lite';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
      try {
        const q = query(collection(db, 'waitlist'), where('email', '==', email.toLowerCase()));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          throw new Error('This email is already on the waitlist');
        }
      } catch (queryError) {
        console.error('Error checking existing email:', queryError);
        // Continue anyway if we can't check for duplicates
      }

      // Add to waitlist
      try {
        await addDoc(collection(db, 'waitlist'), {
          email: email.toLowerCase(),
          createdAt: new Date(),
          source: 'waitlist-page',
          notified: false
        });
      } catch (addError) {
        console.error('Error adding to waitlist:', addError);
        throw new Error('Unable to add to waitlist. Please try again later.');
      }

      setSuccess(true);
      setEmail('');
      
      // Reset success state after 5 seconds to allow another signup
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
      
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success message overlay
  const SuccessMessage = () => (
    <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full transform scale-100 animate-slideUp">
        <div className="w-16 h-16 bg-gradient-to-br from-[var(--blue-electric)] to-[var(--navy-midnight)] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-light text-[var(--navy-deep)] mb-3 text-center">You're on the list!</h2>
        <p className="text-[var(--gray-warm)] font-light text-center">
          We'll notify you as soon as PivotAI launches. Thank you for your interest!
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-6 w-full bg-[var(--navy-midnight)] hover:bg-[var(--navy-royal)] text-white font-light py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
        >
          Got it
        </button>
      </div>
    </div>
  );

  // Floating geometric shapes component
  const FloatingShapes = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large floating triangle */}
      <div 
        className="absolute top-20 right-10 w-32 h-32 opacity-10 animate-float"
        style={{ transform: `translateY(${scrollY * 0.1}px)` }}
      >
        <svg viewBox="0 0 100 100" fill="currentColor" className="text-[var(--sky-soft)]">
          <polygon points="50,10 90,90 10,90" />
        </svg>
      </div>
      
      {/* Floating circles */}
      <div 
        className="absolute top-40 left-20 w-20 h-20 bg-[var(--blue-electric)] rounded-full opacity-5 animate-float-rotate"
        style={{ transform: `translateY(${scrollY * 0.2}px)` }}
      />
      
      <div 
        className="absolute bottom-20 right-40 w-16 h-16 bg-[var(--gold-accent)] rounded-full opacity-10 animate-float"
        style={{ transform: `translateY(${scrollY * -0.15}px)` }}
      />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 pattern-grid opacity-[0.02]"
        style={{ transform: `translateY(${scrollY * 0.05}px)` }}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--white-pearl)]">
      {/* Success Message Overlay */}
      {success && <SuccessMessage />}
      
      {/* Navigation */}
      <nav 
        className="fixed top-0 left-0 right-0 z-[9999] bg-[var(--white-pearl)]/80 backdrop-blur-lg transition-all duration-300"
        style={{
          borderBottom: scrollY > 50 ? '1px solid rgba(10, 22, 40, 0.1)' : '1px solid transparent',
          backgroundColor: scrollY > 50 ? 'rgba(250, 251, 252, 0.95)' : 'rgba(250, 251, 252, 0.8)',
          isolation: 'isolate'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-[var(--navy-deep)]">PivotAI</h1>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden gradient-hero">
        {/* Floating shapes */}
        <FloatingShapes />

        <div className="max-w-4xl w-full relative z-10">
          <div 
            ref={heroRef}
            className="text-center scroll-animate opacity-0"
            style={{
              transform: `translateY(${scrollY * -0.2}px)`
            }}
          >
            <div className="inline-flex items-center justify-center px-4 py-2 bg-[var(--white-pearl)]/10 backdrop-blur-sm text-[var(--white-pearl)] rounded-full text-xs font-medium mb-8 border border-[var(--white-pearl)]/20">
              <span className="animate-pulse mr-2 text-[var(--gold-accent)]">•</span>
              Coming Soon
            </div>
            
            <h1 className="text-5xl md:text-7xl font-light text-[var(--white-pearl)] mb-6 leading-tight">
              Your AI-Powered
              <br />
              <span className="font-semibold gradient-text bg-gradient-to-r from-[var(--white-pearl)] to-[var(--sky-soft)]">Career Navigator</span>
            </h1>
            
            <p className="text-lg text-[var(--sky-soft)] mb-12 max-w-2xl mx-auto font-light leading-relaxed">
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
                  className="w-full px-6 py-4 text-base border border-[var(--white-pearl)]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--blue-electric)] focus:border-transparent transition-all bg-[var(--white-pearl)]/10 backdrop-blur-sm text-[var(--white-pearl)] placeholder-[var(--sky-soft)]/60 font-light"
                  required
                  disabled={loading}
                />
                {error && (
                  <p className="absolute -bottom-6 left-0 text-sm text-[var(--gold-accent)] font-light">{error}</p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[var(--blue-electric)] to-[var(--navy-midnight)] hover:from-[var(--navy-midnight)] hover:to-[var(--blue-electric)] text-white font-medium py-4 px-8 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] hover:shadow-lg hover:shadow-[var(--blue-electric)]/25"
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

            <p className="text-center text-sm text-[var(--sky-soft)]/80 mt-6 font-light">
              Be among the first to experience the future of career development.
            </p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-[var(--white-pearl)]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-[var(--white-pearl)] relative overflow-hidden">
        <div className="absolute inset-0 pattern-dots opacity-[0.02]" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="text-3xl font-light text-center text-[var(--navy-deep)] mb-16 scroll-animate opacity-0">
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
                className="scroll-animate opacity-0"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className="gradient-card-border card-hover-3d">
                  <div className="bg-white rounded-lg p-6 text-center h-full">
                    <div className="w-14 h-14 bg-gradient-to-br from-[var(--navy-royal)] to-[var(--blue-electric)] rounded-xl flex items-center justify-center mx-auto mb-4 transform transition-transform duration-300 hover:rotate-12">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-[var(--navy-deep)] mb-2">{feature.title}</h3>
                    <p className="text-sm text-[var(--gray-warm)] font-light leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-[var(--sky-soft)] to-[var(--white-pearl)] relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
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
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">{stat.number}</div>
                <div className="text-sm text-[var(--gray-warm)] font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 px-4 bg-[var(--white-pearl)] relative overflow-hidden">
        <div className="absolute inset-0 pattern-grid opacity-[0.01]" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl font-light text-[var(--navy-deep)] mb-4 scroll-animate opacity-0">
            Our Team
          </h2>
          <p className="text-lg text-[var(--gray-warm)] font-light mb-12 scroll-animate opacity-0">
            Built by talented individuals from world-class institutions
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-16">
            <div className="scroll-animate opacity-0" style={{ animationDelay: '100ms' }}>
              <div className="gradient-card-border">
                <div className="w-48 h-48 bg-white rounded-lg p-8 flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--navy-royal)] to-[var(--blue-electric)] opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                  <Image 
                    src="/images/universities/georgia-tech-logo.png" 
                    alt="Georgia Tech" 
                    fill
                    className="object-contain group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              </div>
              <p className="mt-4 text-sm text-[var(--gray-warm)] font-medium">Georgia Tech</p>
            </div>
            
            <div className="scroll-animate opacity-0" style={{ animationDelay: '200ms' }}>
              <div className="gradient-card-border">
                <div className="w-48 h-48 bg-white rounded-lg p-8 flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--navy-royal)] to-[var(--blue-electric)] opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                  <Image 
                    src="/images/universities/uwmadison.png" 
                    alt="University of Wisconsin-Madison" 
                    fill
                    className="object-contain group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              </div>
              <p className="mt-4 text-sm text-[var(--gray-warm)] font-medium">University of Wisconsin-Madison</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-[var(--navy-deep)]/10 bg-gradient-to-b from-[var(--white-pearl)] to-[var(--sky-soft)]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-[var(--gray-warm)] font-light">
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
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeUp {
          animation: fadeUp 0.8s ease-out forwards;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        
        .scroll-animate {
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}
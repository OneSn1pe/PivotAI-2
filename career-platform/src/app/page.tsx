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
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
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
    // Countdown timer for July 20th 12 PM EST
    const targetDate = new Date('2025-07-20T12:00:00-04:00').getTime();
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      
      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
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
    <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center px-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full transform scale-100 animate-slideUp">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 hover-scale">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-light text-gray-900 mb-3 text-center">You're on the list!</h2>
        <p className="text-gray-600 font-light text-center">
          We'll notify you as soon as PivotAI launches. Thank you for your interest!
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-6 w-full bg-gray-900 hover:bg-gray-800 text-white font-light py-3 px-6 rounded-lg transition-all duration-200 hover-lift"
        >
          Got it
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Success Message Overlay */}
      {success && <SuccessMessage />}
      
      {/* Navigation */}
      <nav 
        className="fixed top-0 left-0 right-0 z-[9999] bg-white/90 backdrop-blur-md transition-all duration-300 shadow-sm"
        style={{
          borderBottom: scrollY > 50 ? '1px solid rgba(0,0,0,0.08)' : '1px solid transparent',
          isolation: 'isolate'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-light text-gray-900 hover-scale cursor-pointer">PivotAI</h1>
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

        <div className="max-w-4xl w-full relative">
          <div 
            ref={heroRef}
            className="text-center scroll-animate opacity-0"
            style={{
              transform: `translateY(${scrollY * -0.2}px)`
            }}
          >
            <div className="inline-flex items-center justify-center px-3 py-1 bg-gray-100 text-gray-900 rounded-full text-xs font-medium mb-8 hover-lift cursor-default">
              <span className="animate-pulse mr-2">•</span>
              Coming Soon
            </div>
            
            {/* Countdown Display */}
            <div className="mb-12 p-4 sm:p-6 bg-gradient-to-r from-[#1E293B] to-[#334155] rounded-2xl shadow-xl max-w-2xl mx-auto">
              <p className="text-white/80 text-sm font-light mb-4 text-center">Launching in</p>
              <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-md mx-auto">
                <div className="text-center">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-white/20 hover-lift transition-all duration-300">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-light text-white countdown-number">{timeLeft.days}</div>
                    <div className="text-[10px] sm:text-xs text-white/70 mt-1">DAYS</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-white/20 hover-lift transition-all duration-300">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-light text-white countdown-number">{String(timeLeft.hours).padStart(2, '0')}</div>
                    <div className="text-[10px] sm:text-xs text-white/70 mt-1">HOURS</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-white/20 hover-lift transition-all duration-300">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-light text-white countdown-number">{String(timeLeft.minutes).padStart(2, '0')}</div>
                    <div className="text-[10px] sm:text-xs text-white/70 mt-1">MINUTES</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-white/20 hover-lift transition-all duration-300">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-light text-white countdown-number">{String(timeLeft.seconds).padStart(2, '0')}</div>
                    <div className="text-[10px] sm:text-xs text-white/70 mt-1">SECONDS</div>
                  </div>
                </div>
              </div>
              <p className="text-white/60 text-xs text-center mt-4 font-light">July 20th, 2025 • 12:00 PM EST</p>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-light text-gray-900 mb-6 leading-tight">
              Your AI-Powered
              <br />
              <span className="font-normal text-hover-underline">Career Navigator</span>
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
                  className="w-full px-6 py-4 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white font-light hover-glow"
                  required
                  disabled={loading}
                />
                {error && (
                  <p className="absolute -bottom-6 left-0 text-sm text-red-600 font-light animate-slideInRight">{error}</p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-light py-4 px-8 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed btn-3d btn-hover-slide relative overflow-hidden"
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
                  <span className="relative z-10">Join the Waitlist</span>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6 font-light">
              Be among the first to experience the future of career development.
            </p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce hover-float">
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
                className="scroll-animate opacity-0 text-center group"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className="card-hover-tilt">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm icon-hover-bounce group-hover:shadow-md transition-shadow">
                    <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">{feature.title}</h3>
                  <p className="text-sm text-gray-600 font-light leading-relaxed">{feature.description}</p>
                </div>
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
                className="scroll-animate opacity-0 hover-scale cursor-default"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className="text-3xl md:text-4xl font-light text-gray-900 mb-2 hover-float">{stat.number}</div>
                <div className="text-sm text-gray-600 font-light">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-light text-gray-900 mb-4 scroll-animate opacity-0">
            Our Team
          </h2>
          <p className="text-lg text-gray-600 font-light mb-12 scroll-animate opacity-0">
            Built by talented individuals from world-class institutions
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-16">
            <div className="scroll-animate opacity-0" style={{ animationDelay: '100ms' }}>
              <div className="w-48 h-48 bg-white rounded-lg shadow-sm p-8 flex items-center justify-center relative overflow-hidden hover-lift group">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Image 
                  src="/images/universities/georgia-tech-logo.png" 
                  alt="Georgia Tech" 
                  fill
                  className="object-contain hover-scale relative z-10"
                />
              </div>
              <p className="mt-4 text-sm text-gray-600 font-light">Georgia Tech</p>
            </div>
            
            <div className="scroll-animate opacity-0" style={{ animationDelay: '200ms' }}>
              <div className="w-48 h-48 bg-white rounded-lg shadow-sm p-8 flex items-center justify-center relative overflow-hidden hover-lift group">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Image 
                  src="/images/universities/uwmadison.png" 
                  alt="University of Wisconsin-Madison" 
                  fill
                  className="object-contain hover-scale relative z-10"
                />
              </div>
              <p className="mt-4 text-sm text-gray-600 font-light">University of Wisconsin-Madison</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-500 font-light">
            © 2024 <span className="text-hover-underline cursor-pointer hover:text-gray-700 transition-colors">PivotAI</span>. Transforming careers with intelligence.
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

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes countdownPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.9;
          }
        }
        
        @keyframes countdownFlip {
          0% {
            transform: perspective(400px) rotateX(0);
          }
          100% {
            transform: perspective(400px) rotateX(-180deg);
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

        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
        
        .scroll-animate {
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        
        .countdown-number {
          animation: countdownPulse 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
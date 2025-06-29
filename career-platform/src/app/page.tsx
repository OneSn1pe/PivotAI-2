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
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-light text-center text-gray-900 mb-4 scroll-animate opacity-0">
            Redefining Career Development
          </h2>
          <p className="text-center text-gray-600 font-light mb-16 max-w-3xl mx-auto scroll-animate opacity-0">
            PivotAI combines cutting-edge AI technology with proven career development strategies to accelerate your professional growth
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "AI Coaching Agent",
                description: "Get 24/7 personalized guidance from our intelligent coaching agent that adapts to your learning style and career goals through dynamic, conversational learning",
                icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
                color: "bg-blue-50 text-blue-600"
              },
              {
                title: "Smart Resume Analysis",
                description: "Our AI analyzes your resume in seconds, identifying strengths, gaps, and opportunities. Get instant rewrites optimized for ATS systems and your target roles",
                icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
                color: "bg-purple-50 text-purple-600"
              },
              {
                title: "Personalized Roadmaps",
                description: "Receive custom career roadmaps tailored to your experience, skills, and aspirations. Progress through 10 levels with clear milestones and actionable steps",
                icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
                color: "bg-green-50 text-green-600"
              },
              {
                title: "Recruiter Network",
                description: "Gain exclusive exposure to our network of top recruiters and hiring managers. Your profile is automatically optimized for maximum visibility to relevant opportunities",
                icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
                color: "bg-orange-50 text-orange-600"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="scroll-animate opacity-0 group"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className="h-full bg-white rounded-xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 card-hover-tilt">
                  <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4 icon-hover-bounce`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2 text-lg">{feature.title}</h3>
                  <p className="text-sm text-gray-600 font-light leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Features Grid */}
          <div className="mt-20">
            <h3 className="text-2xl font-light text-center text-gray-900 mb-12 scroll-animate opacity-0">
              Everything You Need to Succeed
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Dynamic Learning Paths",
                  description: "AI-powered curriculum that adapts in real-time based on your progress and learning patterns",
                  icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                },
                {
                  title: "Achievement System",
                  description: "Unlock badges, earn certifications, and showcase your progress to potential employers",
                  icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                },
                {
                  title: "Interview Preparation",
                  description: "Practice with AI-powered mock interviews tailored to your target companies and roles",
                  icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="scroll-animate opacity-0 text-center"
                  style={{
                    animationDelay: `${index * 100 + 400}ms`
                  }}
                >
                  <div className="p-6 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all duration-300 hover-lift h-full">
                    <svg className="w-8 h-8 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
                    </svg>
                    <h4 className="font-medium text-gray-900 mb-2">{feature.title}</h4>
                    <p className="text-sm text-gray-600 font-light">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-light mb-8 scroll-animate opacity-0">
            Our Mission
          </h2>
          <p className="text-xl md:text-2xl font-light leading-relaxed mb-8 scroll-animate opacity-0" style={{ animationDelay: '100ms' }}>
            Making job acquisition and hiring <span className="font-normal">meritocratic again</span>
          </p>
          <div className="space-y-6 max-w-3xl mx-auto">
            <p className="text-lg text-gray-300 font-light leading-relaxed scroll-animate opacity-0" style={{ animationDelay: '200ms' }}>
              The hiring landscape has become a maze of keywords, connections, and chance encounters. 
              Talented individuals are overlooked while positions remain unfilled. We believe this is broken.
            </p>
            <p className="text-lg text-gray-300 font-light leading-relaxed scroll-animate opacity-0" style={{ animationDelay: '300ms' }}>
              PivotAI levels the playing field by showcasing what truly matters: your skills, potential, and dedication. 
              Our AI-powered platform ensures that merit rises to the top, connecting the right talent with the right opportunities.
            </p>
            <p className="text-lg text-gray-300 font-light leading-relaxed scroll-animate opacity-0" style={{ animationDelay: '400ms' }}>
              Together, we're building a future where careers are shaped by capability, not circumstance.
            </p>
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
      <footer className="py-12 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          {/* Social Links Section */}
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Connect with PivotAI</h3>
            <div className="flex justify-center items-center gap-6">
              {/* LinkedIn */}
              <a 
                href="https://linkedin.com/company/pivotai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group"
                aria-label="Connect with PivotAI on LinkedIn"
              >
                <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center transition-all duration-300 hover:border-[#0077B5] hover:shadow-md hover-lift">
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-[#0077B5] transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
              </a>

              {/* YouTube */}
              <a 
                href="https://youtube.com/@pivotai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group"
                aria-label="Subscribe to PivotAI on YouTube"
              >
                <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center transition-all duration-300 hover:border-[#FF0000] hover:shadow-md hover-lift">
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-[#FF0000] transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
              </a>

              {/* Instagram */}
              <a 
                href="https://instagram.com/pivotai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group"
                aria-label="Follow PivotAI on Instagram"
              >
                <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center transition-all duration-300 hover:border-[#E4405F] hover:shadow-md hover-lift">
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-[#E4405F] transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.405a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z"/>
                  </svg>
                </div>
              </a>

              {/* X (Twitter) */}
              <a 
                href="https://x.com/pivotai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group"
                aria-label="Follow PivotAI on X"
              >
                <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center transition-all duration-300 hover:border-gray-900 hover:shadow-md hover-lift">
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
              </a>
            </div>
          </div>


          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500 font-light">
              © 2024 <span className="text-hover-underline cursor-pointer hover:text-gray-700 transition-colors">PivotAI</span>. Transforming careers with intelligence.
            </p>
          </div>
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
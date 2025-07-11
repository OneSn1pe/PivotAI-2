'use client';

import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase-lite';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import RotatingText from '@/components/RotatingText';
import ScrollReveal from '@/components/ScrollReveal';
import Dock from '@/components/Dock';
import { FiHome, FiTarget, FiHeart, FiUsers, FiMail } from 'react-icons/fi';

export default function WaitlistPage() {
  // Color palette
  const colors = {
    navy: {
      deep: '#0F172A',
      primary: '#1E293B',
      medium: '#334155',
      light: '#475569'
    },
    blue: {
      vivid: '#2563EB',
      sky: '#38BDF8',
      pale: '#E0F2FE'
    },
    accent: {
      coral: '#FF6B6B',
      amber: '#F59E0B',
      cream: '#FEF3C7'
    },
    neutral: {
      white: '#FFFFFF',
      gray50: '#F9FAFB',
      gray100: '#F3F4F6',
      gray400: '#9CA3AF',
      gray600: '#4B5563'
    }
  };
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [cracks, setCracks] = useState<{ id: number; x: number; y: number }[]>([]);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [activeSection, setActiveSection] = useState('home');
  const router = useRouter();
  
  // Refs for scroll animations and navigation
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const missionRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();
  const crackOpacity = useTransform(scrollY, [0, 300], [0.3, 0.8]);
  const glassDistortion = useTransform(scrollY, [0, 500], [0, 10]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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

  // Track active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // Add offset for better detection
      
      const sections = [
        { id: 'home', ref: heroRef },
        { id: 'features', ref: featuresRef },
        { id: 'mission', ref: missionRef },
        { id: 'team', ref: teamRef },
      ];
      
      let currentSection = 'home';
      
      for (const section of sections) {
        if (section.ref.current) {
          const { offsetTop, offsetHeight } = section.ref.current;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            currentSection = section.id;
          }
        }
      }
      
      setActiveSection(currentSection);
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const dockItems = [
    { id: 'home', icon: <FiHome size={20} />, label: 'Home', onClick: () => scrollToSection(heroRef) },
    { id: 'features', icon: <FiTarget size={20} />, label: 'Features', onClick: () => scrollToSection(featuresRef) },
    { id: 'mission', icon: <FiHeart size={20} />, label: 'Mission', onClick: () => scrollToSection(missionRef) },
    { id: 'team', icon: <FiUsers size={20} />, label: 'Team', onClick: () => scrollToSection(teamRef) },
    { id: 'join', icon: <FiMail size={20} />, label: 'Join', onClick: () => scrollToSection(heroRef) },
  ];

  const handleInteraction = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newCrack = {
      id: Date.now(),
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100
    };
    
    setCracks(prev => [...prev, newCrack]);
    
    // Remove crack after animation
    setTimeout(() => {
      setCracks(prev => prev.filter(crack => crack.id !== newCrack.id));
    }, 3000);
  };

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

  // Glass crack SVG component
  const GlassCrack = ({ x, y, id }: { x: number; y: number; id: number }) => (
    <motion.svg
      key={id}
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      width="200"
      height="200"
      viewBox="0 0 200 200"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.5 }}
      transition={{ duration: 0.5 }}
    >
      <motion.path
        d="M100,100 L80,60 L120,70 L90,40 L130,80 L100,100 L70,90 L100,130 L110,90"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <motion.path
        d="M100,100 L60,100 L85,120 L100,100 L115,110 L100,85"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="0.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      />
      <motion.circle
        cx="100"
        cy="100"
        r="3"
        fill="rgba(255,255,255,0.6)"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 2, 1] }}
        transition={{ duration: 0.5 }}
      />
    </motion.svg>
  );

  // Success message overlay
  const SuccessMessage = () => (
    <motion.div 
      className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white rounded-2xl shadow-[0_20px_40px_rgba(15,23,42,0.15)] p-8 max-w-md w-full border border-[#E5E7EB] relative overflow-hidden"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        onClick={handleInteraction}
      >
        <AnimatePresence>
          {cracks.map(crack => (
            <GlassCrack key={crack.id} x={crack.x} y={crack.y} id={crack.id} />
          ))}
        </AnimatePresence>
        
        <motion.div 
          className="w-16 h-16 glass-icon-success rounded-full flex items-center justify-center mx-auto mb-6"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
        <h2 className="text-2xl font-bold text-[#1E293B] mb-3 text-center">You're Getting CRACKD!</h2>
        <p className="text-[#4B5563] text-center">
          Prepare to shatter your limits. We'll notify you the moment Crackd launches.
        </p>
        <motion.button
          onClick={() => setSuccess(false)}
          className="mt-6 w-full glass-button text-white font-bold py-3 px-6 rounded-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          I'm Ready
        </motion.button>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <AnimatePresence>
        {success && <SuccessMessage />}
      </AnimatePresence>
      
      {/* Navigation */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-[9999] bg-[#1E293B]/95 backdrop-blur-md border-b border-transparent"
        style={{
          borderBottomColor: useTransform(scrollY, [0, 50], ['transparent', 'rgba(30, 41, 59, 0.08)']),
          boxShadow: useTransform(scrollY, [0, 50], ['none', '0 1px 3px rgba(15, 23, 42, 0.08)']),
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center space-x-2 cursor-pointer"
              whileHover={{ scale: 1.05 }}
            >
              <div className="relative">
                <Image 
                  src="/favicon/favicon-32x32.png" 
                  alt="PivotAI Logo" 
                  width={28}
                  height={28}
                  className="hover:rotate-12 transition-transform duration-300 brightness-0 invert"
                />
              </div>
              <h1 className="text-xl font-light text-white hover:text-[#38BDF8] transition-colors">Crackd</h1>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155]">
        {/* Dynamic glass crack overlay */}
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: crackOpacity }}
        >
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <filter id="glassDistortion">
                <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="5" result="noise" />
                <motion.feDisplacementMap in="SourceGraphic" in2="noise" scale={glassDistortion} />
              </filter>
            </defs>
            
            {/* Dynamic crack pattern */}
            <motion.g filter="url(#glassDistortion)">
              <motion.path
                d="M0,300 Q150,250 300,350 T600,300 T900,400 T1200,300"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="2"
                fill="none"
                animate={{
                  d: [
                    "M0,300 Q150,250 300,350 T600,300 T900,400 T1200,300",
                    "M0,350 Q200,300 350,400 T650,350 T950,450 T1250,350",
                    "M0,300 Q150,250 300,350 T600,300 T900,400 T1200,300"
                  ]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
              <motion.path
                d="M200,0 L250,200 L200,400 L300,600"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
                fill="none"
                animate={{
                  opacity: [0.1, 0.3, 0.1]
                }}
                transition={{ duration: 5, repeat: Infinity }}
              />
              <motion.path
                d="M800,0 L750,150 L850,300 L800,500"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1.5"
                fill="none"
                animate={{
                  opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 7, repeat: Infinity }}
              />
            </motion.g>
          </svg>
          
          {/* Interactive glass particles */}
          <motion.div
            className="absolute w-full h-full"
            animate={{
              background: [
                `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.1) 0%, transparent 10%)`,
                `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.05) 0%, transparent 15%)`
              ]
            }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Animated shatter points */}
          <motion.div 
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#38BDF8] rounded-full filter blur-[120px] opacity-30"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#2563EB] rounded-full filter blur-[120px] opacity-20"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          />
        </motion.div>

        <div className="max-w-4xl w-full relative" onClick={handleInteraction}>
          <AnimatePresence>
            {cracks.map(crack => (
              <GlassCrack key={crack.id} x={crack.x} y={crack.y} id={crack.id} />
            ))}
          </AnimatePresence>
          
          <motion.div 
            ref={heroRef}
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Countdown Display with glass effect */}
            <motion.div 
              className="mb-12 p-4 sm:p-6 glass-crack rounded-2xl shadow-xl max-w-2xl mx-auto"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <p className="text-white/90 text-sm font-medium mb-4 text-center uppercase tracking-wider">Launching in</p>
              <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-md mx-auto">
                {Object.entries(timeLeft).map(([unit, value], index) => (
                  <motion.div 
                    key={unit}
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <motion.div 
                      className="glass-card rounded-lg p-2 sm:p-3 group"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div 
                        className="text-2xl sm:text-3xl md:text-4xl font-bold text-white"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity, repeatDelay: 59 }}
                      >
                        {unit === 'days' ? value : String(value).padStart(2, '0')}
                      </motion.div>
                      <div className="text-[10px] sm:text-xs text-white/70 mt-1 font-medium uppercase">
                        {unit.toUpperCase()}
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
              <p className="text-white/60 text-xs text-center mt-4 font-medium">July 20th, 2025 • 12:00 PM EST</p>
            </motion.div>
            
            {/* Main tagline with crack effect */}
            <div className="mb-8">
              <h1 className="text-6xl md:text-8xl font-black text-white mb-2 leading-none">
                <RotatingText
                  texts={['GET CRACKD', 'GET SMART', 'GET PREPARED']}
                  mainClassName="inline-flex items-center justify-center"
                  staggerFrom="last"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-120%" }}
                  staggerDuration={0.025}
                  splitLevelClassName="overflow-hidden inline-block"
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                  rotationInterval={2500}
                />
              </h1>
              <motion.p 
                className="text-xl md:text-2xl text-white/80 font-light"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Become <span className="font-semibold text-[#38BDF8]">amazingly capable</span> and <span className="font-semibold text-[#60A5FA]">brilliantly smart</span>
              </motion.p>
            </div>
            
            <motion.p 
              className="text-lg text-white/70 mb-12 max-w-2xl mx-auto font-light leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              Break through career barriers with AI-powered guidance. 
              Shatter limitations. Transform your potential into unstoppable success.
            </motion.p>
          </motion.div>

          {/* Email Form */}
          <motion.div 
            ref={formRef}
            className="max-w-md mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <motion.input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-6 py-4 text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-0 focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] transition-all bg-white font-light hover:border-gray-300"
                  required
                  disabled={loading}
                  whileFocus={{ scale: 1.02 }}
                />
                <AnimatePresence>
                  {error && (
                    <motion.p 
                      className="absolute -bottom-6 left-0 text-sm text-red-600 font-light"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full glass-button text-white font-medium py-4 px-8 rounded-lg relative overflow-hidden group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <motion.svg 
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                      fill="none" 
                      viewBox="0 0 24 24"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </motion.svg>
                    Joining waitlist...
                  </span>
                ) : (
                  <>
                    <span className="relative z-10 font-bold text-lg">GET CRACKD</span>
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-[#38BDF8] to-[#2563EB]"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </>
                )}
              </motion.button>
            </form>

            <p className="text-center text-sm text-white/60 mt-6 font-medium">
              Join the revolution. Become unstoppable.
            </p>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          whileHover={{ scale: 1.2 }}
        >
          <div className="p-3 rounded-full transition-all duration-300 hover:bg-white/10">
            <svg className="w-6 h-6 text-white/60 hover:text-white/90 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-24 px-4 bg-gradient-to-b from-white to-[#F9FAFB] relative overflow-hidden">
        {/* Animated glass shard decorations */}
        <motion.div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-0 left-1/4 w-1 h-32 bg-gradient-to-b from-transparent via-[#38BDF8]/20 to-transparent"
            animate={{ rotate: [45, 50, 45] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div 
            className="absolute top-1/3 right-1/3 w-1 h-24 bg-gradient-to-b from-transparent via-[#2563EB]/20 to-transparent"
            animate={{ rotate: [-12, -8, -12] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-1/4 left-1/2 w-1 h-40 bg-gradient-to-b from-transparent via-[#60A5FA]/20 to-transparent"
            animate={{ rotate: [30, 35, 30] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
        </motion.div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.h2 
            className="text-4xl font-bold text-center text-[#1E293B] mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Crack Your Career Code
          </motion.h2>
          <motion.p 
            className="text-center text-[#4B5563] font-medium mb-16 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Four powerful ways to shatter career barriers and unlock your true potential
          </motion.p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "AI Coaching Agent",
                description: "Get 24/7 personalized guidance from our intelligent coaching agent that adapts to your learning style and career goals through dynamic, conversational learning",
                icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
                color: "bg-gradient-to-br from-[#E0F2FE] to-[#DBEAFE] text-[#1E293B]"
              },
              {
                title: "Smart Resume Analysis",
                description: "Our AI analyzes your resume in seconds, identifying strengths, gaps, and opportunities. Get instant rewrites optimized for ATS systems and your target roles",
                icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
                color: "bg-gradient-to-br from-[#E0F2FE] to-[#DBEAFE] text-[#1E293B]"
              },
              {
                title: "Personalized Roadmaps",
                description: "Receive custom career roadmaps tailored to your experience, skills, and aspirations. Progress through 10 levels with clear milestones and actionable steps",
                icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
                color: "bg-gradient-to-br from-[#E0F2FE] to-[#DBEAFE] text-[#1E293B]"
              },
              {
                title: "Recruiter Network",
                description: "Gain exclusive exposure to our network of top recruiters and hiring managers. Your profile is automatically optimized for maximum visibility to relevant opportunities",
                icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
                color: "bg-gradient-to-br from-[#E0F2FE] to-[#DBEAFE] text-[#1E293B]"
              }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                onClick={handleInteraction}
                className="relative"
              >
                <div className="h-full glass-feature-card rounded-xl p-6 transition-all duration-300 group">
                  <motion.div 
                    className="w-14 h-14 glass-icon rounded-lg flex items-center justify-center mb-4"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <svg className="w-7 h-7 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                    </svg>
                  </motion.div>
                  <h3 className="font-bold text-[#1E293B] mb-2 text-lg group-hover:text-[#2563EB] transition-colors">{feature.title}</h3>
                  <p className="text-sm text-[#4B5563] leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section ref={missionRef} className="py-24 px-4 bg-gradient-to-br from-[#1E293B] to-[#334155] text-white relative overflow-hidden">
        {/* Dynamic pattern overlay */}
        <motion.div 
          className="absolute inset-0 opacity-10"
          animate={{
            background: [
              `radial-gradient(circle at 20% 50%, rgba(56, 189, 248, 0.3) 0%, transparent 50%),
               radial-gradient(circle at 80% 80%, rgba(255, 107, 107, 0.2) 0%, transparent 50%)`,
              `radial-gradient(circle at 30% 60%, rgba(56, 189, 248, 0.3) 0%, transparent 50%),
               radial-gradient(circle at 70% 70%, rgba(255, 107, 107, 0.2) 0%, transparent 50%)`,
              `radial-gradient(circle at 20% 50%, rgba(56, 189, 248, 0.3) 0%, transparent 50%),
               radial-gradient(circle at 80% 80%, rgba(255, 107, 107, 0.2) 0%, transparent 50%)`
            ]
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h2 
            className="text-3xl md:text-4xl font-light mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Our Mission
          </motion.h2>
          
          <motion.p 
            className="text-xl md:text-2xl font-light leading-relaxed mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Making job acquisition and hiring <span className="font-normal text-[#38BDF8]">meritocratic again</span>
          </motion.p>
          
          <div className="space-y-6 max-w-3xl mx-auto">
            {[
              "The hiring landscape has become a maze of keywords, connections, and chance encounters. Talented individuals are overlooked while positions remain unfilled. We believe this is broken.",
              "Crackd levels the playing field by showcasing what truly matters: your skills, potential, and dedication. Our AI-powered platform helps you crack through barriers and connect with the right opportunities.",
              "Together, we're building a future where careers are shaped by capability, not circumstance."
            ].map((text, index) => (
              <ScrollReveal
                key={index}
                baseOpacity={0}
                enableBlur={true}
                baseRotation={3}
                blurStrength={8}
                className="text-lg text-white/80 font-light leading-relaxed"
              >
                {text}
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section ref={teamRef} className="py-24 px-4 bg-[#F9FAFB]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            className="text-3xl font-light text-[#1E293B] mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Our Team
          </motion.h2>
          <motion.p 
            className="text-lg text-[#4B5563] font-light mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Built by talented individuals from world-class institutions
          </motion.p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-16">
            {[
              { logo: "/images/universities/georgia-tech-logo.png", name: "Georgia Tech", color: "#2563EB" },
              { logo: "/images/universities/uwmadison.png", name: "University of Wisconsin-Madison", color: "#FF6B6B" }
            ].map((university, index) => (
              <motion.div 
                key={index}
                className="group"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <motion.div 
                  className="w-48 h-48 bg-white rounded-lg shadow-sm p-8 flex items-center justify-center relative overflow-hidden hover:shadow-xl transition-all duration-300 border-2"
                  whileHover={{ y: -5 }}
                  initial={{
                    borderColor: `${university.color}00`
                  }}
                  animate={{
                    borderColor: [`${university.color}00`, `${university.color}33`, `${university.color}00`]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(to br, ${university.color}10, ${university.color}05)`
                    }}
                  />
                  <Image 
                    src={university.logo} 
                    alt={university.name} 
                    fill
                    className="object-contain relative z-10"
                  />
                </motion.div>
                <p className="mt-4 text-sm text-[#4B5563] font-light group-hover:text-[#2563EB] transition-colors">
                  {university.name}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-white border-t border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto">
          {/* Social Links Section */}
          <div className="text-center">
            <h3 className="text-lg font-medium text-[#1E293B] mb-6">Connect with Crackd</h3>
            <div className="flex justify-center items-center gap-6">
              {[
                { name: "LinkedIn", href: "https://linkedin.com/company/crackd", color: "#0077B5", icon: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
                { name: "YouTube", href: "https://youtube.com/@crackd", color: "#FF0000", icon: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
                { name: "Instagram", href: "https://instagram.com/crackd", color: "#E4405F", icon: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.405a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z" },
                { name: "X", href: "https://x.com/crackd", color: "#1E293B", icon: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" }
              ].map((social, index) => (
                <motion.a 
                  key={index}
                  href={social.href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group"
                  aria-label={`Connect with Crackd on ${social.name}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div 
                    className="w-12 h-12 bg-white rounded-lg border-2 border-[#E5E7EB] flex items-center justify-center transition-all duration-300"
                    whileHover={{ 
                      backgroundColor: social.color,
                      borderColor: social.color,
                      boxShadow: `0 4px 14px ${social.color}40`
                    }}
                  >
                    <svg className="w-5 h-5 text-[#4B5563] group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d={social.icon} />
                    </svg>
                  </motion.div>
                </motion.a>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-[#E5E7EB] text-center">
            <p className="text-sm text-[#9CA3AF] font-light">
              © 2024 <span className="text-hover-underline cursor-pointer hover:text-[#1E293B] transition-colors">Crackd</span>. Cracking the code to career success.
            </p>
          </div>
        </div>
      </footer>

      {/* Add animation styles */}
      <style jsx>{`
        /* Glass morphism styles */
        .glass-morphism {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .glass-crack {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 
            inset 0 1px 1px rgba(255, 255, 255, 0.2),
            0 8px 32px rgba(0, 0, 0, 0.1);
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 
            inset 0 1px 1px rgba(255, 255, 255, 0.25),
            0 4px 16px rgba(0, 0, 0, 0.08);
        }
        
        .glass-button {
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(37, 99, 235, 0.3));
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 
            inset 0 1px 1px rgba(255, 255, 255, 0.3),
            0 4px 16px rgba(37, 99, 235, 0.2);
        }
        
        .glass-button:hover {
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.5), rgba(37, 99, 235, 0.5));
          transform: translateY(-2px);
          box-shadow: 
            inset 0 1px 1px rgba(255, 255, 255, 0.4),
            0 8px 24px rgba(37, 99, 235, 0.3);
        }
        
        .glass-feature-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(229, 231, 235, 0.6);
          box-shadow: 
            0 1px 3px rgba(0, 0, 0, 0.05),
            0 10px 40px rgba(0, 0, 0, 0.08);
        }
        
        .glass-feature-card:hover {
          border-color: rgba(37, 99, 235, 0.2);
          box-shadow: 
            0 1px 3px rgba(0, 0, 0, 0.05),
            0 20px 50px rgba(37, 99, 235, 0.15),
            inset 0 1px 1px rgba(255, 255, 255, 0.6);
        }
        
        .glass-icon {
          background: linear-gradient(135deg, rgba(224, 242, 254, 0.8), rgba(219, 234, 254, 0.8));
          border: 1px solid rgba(147, 197, 253, 0.3);
          box-shadow: 
            inset 0 1px 1px rgba(255, 255, 255, 0.5),
            0 2px 8px rgba(37, 99, 235, 0.1);
        }
        
        .glass-icon-success {
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.9), rgba(37, 99, 235, 0.9));
          box-shadow: 
            0 4px 16px rgba(37, 99, 235, 0.3),
            0 8px 32px rgba(56, 189, 248, 0.2);
        }
      `}</style>

      {/* Dock Navigation */}
      <Dock 
        items={dockItems}
        panelHeight={68}
        baseItemSize={48}
        magnification={65}
        activeItem={activeSection}
      />
    </div>
  );
}
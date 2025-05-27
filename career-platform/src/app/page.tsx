import React from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { 
  Target, 
  TrendingUp, 
  Users, 
  Briefcase, 
  FileText, 
  Award,
  ArrowRight,
  PlayCircle,
  Calendar,
  Star,
  Check
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Script id="structured-data" type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "PivotAI Career Quest - Career Development Platform",
          "url": "https://pivotai.me/",
          "description": "Transform your career growth into a structured journey with goal-oriented platform, skill development paths, and professional networking.",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://pivotai.me/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        })}
      </Script>
      
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-slate-900">
                PivotAI <span className="text-teal-700">Career Quest</span>
              </h1>
            </div>
            

            
            <div className="flex items-center space-x-4">
              <Link 
                href="/auth/login"
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                Login
              </Link>
              <Link 
                href="/auth/register"
                className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-2 rounded-lg font-semibold transition-colors inline-flex items-center"
              >
                Start Your Journey
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-slate-50 to-teal-50 py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                  Transform Your Career Growth Into a Structured Journey
                </h1>
                <p className="text-xl lg:text-2xl text-slate-600 mt-6 max-w-3xl">
                  Join thousands of professionals who've leveled up their careers with our goal-oriented platform. Track progress, unlock opportunities, and achieve your professional goals.
                </p>
                <div className="flex gap-4 mt-10">
                  <Link 
                    href="/auth/register"
                    className="bg-teal-700 hover:bg-teal-800 text-white px-8 py-4 rounded-lg font-semibold text-lg inline-flex items-center transition-colors"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link 
                    href="#how-it-works"
                    className="bg-white hover:bg-slate-50 text-slate-700 px-8 py-4 rounded-lg font-semibold text-lg border border-slate-300 inline-flex items-center transition-colors"
                  >
                    <PlayCircle className="mr-2 h-5 w-5" />
                    See How It Works
                  </Link>
                </div>
              </div>
              
              <div className="lg:pl-8">
                <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">Career Progress</h3>
                      <span className="text-sm text-slate-500">Level 7</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div className="bg-teal-700 h-3 rounded-full" style={{width: '75%'}}></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-teal-700">23</div>
                        <div className="text-sm text-slate-500">Skills Unlocked</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-teal-700">87%</div>
                        <div className="text-sm text-slate-500">Goals Complete</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-slate-500 mb-8">Trusted by professionals at</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center">
              {['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple'].map((company) => (
                <div key={company} className="text-center">
                  <div className="text-2xl font-bold text-slate-400 grayscale opacity-60 hover:opacity-100 transition-opacity">
                    {company}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-slate-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                Everything you need to advance your career
              </h2>
              <p className="text-xl text-slate-600">
                Transform professional development from overwhelming to organized with our comprehensive platform.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Target,
                  color: 'text-teal-600',
                  title: 'Goal-Oriented System',
                  description: 'Set and track career objectives with our structured approach to professional growth.'
                },
                {
                  icon: TrendingUp,
                  color: 'text-blue-500',
                  title: 'Skill Development Paths',
                  description: 'Visual skill trees that guide your learning journey across Technology, Business, and Creative domains.'
                },
                {
                  icon: Users,
                  color: 'text-violet-500',
                  title: 'Professional Network',
                  description: 'Connect with mentors, join industry groups, and build relationships that advance your career.'
                },
                {
                  icon: Briefcase,
                  color: 'text-emerald-500',
                  title: 'Job Opportunity Matching',
                  description: 'Discover positions that match your skill level and career goals with intelligent recommendations.'
                },
                {
                  icon: FileText,
                  color: 'text-indigo-500',
                  title: 'Resume Optimization',
                  description: 'Build and optimize your resume with templates and feedback tailored to your target roles.'
                },
                {
                  icon: Award,
                  color: 'text-orange-500',
                  title: 'Achievement Tracking',
                  description: 'Earn credentials and track your professional milestones with our comprehensive progress system.'
                }
              ].map((feature, index) => (
                <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-200">
                  <feature.icon className={`h-8 w-8 ${feature.color} mb-4`} />
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                Your career journey, simplified
              </h2>
              <p className="text-xl text-slate-600">
                From assessment to achievement in three clear steps.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  number: '01',
                  title: 'Assess Your Starting Point',
                  description: 'Complete our comprehensive career assessment to understand your current skills, strengths, and growth areas.'
                },
                {
                  number: '02',
                  title: 'Choose Your Path',
                  description: 'Select from Technology, Business, or Creative career paths with personalized objectives and milestones.'
                },
                {
                  number: '03',
                  title: 'Level Up Continuously',
                  description: 'Complete tasks, build skills, and track progress as you advance toward your career goals.'
                }
              ].map((step, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-bold text-teal-700 mb-4">{step.number}</div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">{step.title}</h3>
                  <p className="text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="bg-slate-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 text-center mb-12">
              Success stories from career professionals
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  quote: "PivotAI helped me transition from marketing to product management in 8 months. The structured approach made all the difference.",
                  author: "Sarah Chen",
                  role: "Senior Product Manager",
                  company: "TechFlow"
                },
                {
                  quote: "The networking features connected me with mentors who guided my career shift into data science. Invaluable platform.",
                  author: "Marcus Rodriguez",
                  role: "Data Scientist",
                  company: "DataVis Corp"
                },
                {
                  quote: "Love the gamified approach to professional development. Finally, career growth feels manageable and motivating.",
                  author: "Jessica Park",
                  role: "UX Designer",
                  company: "DesignStudio"
                }
              ].map((testimonial, index) => (
                <div key={index} className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-600 mb-6">"{testimonial.quote}"</p>
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.author}</div>
                    <div className="text-slate-500">{testimonial.role} at {testimonial.company}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                Simple, transparent pricing
              </h2>
              <p className="text-xl text-slate-600">
                Choose the plan that fits your career goals.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  name: 'Starter',
                  price: 'Free',
                  description: 'Perfect for exploring your career options',
                  features: [
                    'Basic career assessment',
                    '3 skill development paths',
                    'Community access',
                    'Progress tracking'
                  ],
                  cta: 'Get Started',
                  ctaStyle: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300',
                  popular: false
                },
                {
                  name: 'Professional',
                  price: '$19/month',
                  description: 'For serious career advancement',
                  features: [
                    'Complete career assessment',
                    'All skill development paths',
                    '1-on-1 mentor matching',
                    'Advanced analytics',
                    'Resume optimization tools',
                    'Job opportunity alerts'
                  ],
                  cta: 'Start Free Trial',
                  ctaStyle: 'bg-teal-700 hover:bg-teal-800 text-white',
                  popular: true
                },
                {
                  name: 'Enterprise',
                  price: 'Custom',
                  description: 'For teams and organizations',
                  features: [
                    'Everything in Professional',
                    'Team management tools',
                    'Custom career paths',
                    'Advanced reporting',
                    'Dedicated support',
                    'API access'
                  ],
                  cta: 'Contact Sales',
                  ctaStyle: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300',
                  popular: false
                }
              ].map((tier, index) => (
                <div key={index} className={`bg-white p-8 rounded-xl shadow-sm border-2 transition-colors ${tier.popular ? 'border-teal-200' : 'border-slate-200 hover:border-teal-200'} relative`}>
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-teal-700 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{tier.name}</h3>
                    <div className="text-4xl font-bold text-slate-900 mb-2">{tier.price}</div>
                    <p className="text-slate-600 mb-6">{tier.description}</p>
                  </div>
                  
                  <ul className="space-y-4 mb-8">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="h-5 w-5 text-teal-700 mr-3" />
                        <span className="text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link 
                    href="/auth/register"
                    className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors text-center block ${tier.ctaStyle}`}
                  >
                    {tier.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="bg-gradient-to-r from-teal-700 to-teal-600 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Ready to transform your career?
            </h2>
            <p className="text-xl text-teal-100 mb-8">
              Join thousands of professionals already advancing their careers with PivotAI Career Quest.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/register"
                className="bg-white hover:bg-slate-50 text-teal-700 px-8 py-4 rounded-lg font-semibold text-lg inline-flex items-center justify-center transition-colors"
              >
                Start Your Free Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link 
                href="#contact"
                className="border-2 border-white hover:bg-white hover:text-teal-700 text-white px-8 py-4 rounded-lg font-semibold text-lg inline-flex items-center justify-center transition-colors"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Schedule a Demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                {['Features', 'Career Paths', 'Pricing', 'API Documentation'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-400 hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                {['Blog', 'Career Guides', 'Success Stories', 'Help Center'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-400 hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                {['About Us', 'Careers', 'Press', 'Contact'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-400 hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                {['Privacy Policy', 'Terms of Service', 'Security', 'Compliance'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-400 hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-8 border-t border-slate-800 mt-8">
            <p className="text-slate-400">© 2025 PivotAI Career Quest. All rights reserved.</p>
            <div className="flex space-x-6">
              {['Twitter', 'LinkedIn', 'GitHub', 'YouTube'].map((social) => (
                <a key={social} href="#" className="text-slate-400 hover:text-white transition-colors">
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
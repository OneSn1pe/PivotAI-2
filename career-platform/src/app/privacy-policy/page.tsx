import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-slate-50 to-slate-100">
      <header className="bg-white/70 backdrop-filter backdrop-blur-md shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-teal-800 font-inter">PivotAI Career</Link>
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

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-card border border-slate-200 p-8">
          <h1 className="text-3xl font-bold text-teal-800 mb-8 font-inter">Privacy Policy</h1>
          
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            
            <h2 className="text-xl font-semibold text-teal-700 mt-8 mb-4">1. Introduction</h2>
            <p>Welcome to PivotAI. We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, disclose, and safeguard your information when you use our career development platform.</p>
            
            <h2 className="text-xl font-semibold text-teal-700 mt-8 mb-4">2. Information We Collect</h2>
            <p>We collect several types of information from and about users of our platform:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Personal Information:</strong> Name, email address, and professional details provided during registration or profile creation.</li>
              <li><strong>Resume Data:</strong> Information contained in resumes or CVs you upload, including employment history, education, skills, and achievements.</li>
              <li><strong>Career Preferences:</strong> Target roles, industries, companies, and other career development preferences you specify.</li>
              <li><strong>Authentication Data:</strong> Information provided when you sign in with third-party services like LinkedIn.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our platform, including pages visited and features used.</li>
              <li><strong>Device Information:</strong> IP address, browser type, operating system, and other technical data.</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-teal-700 mt-8 mb-4">3. How We Use Your Information</h2>
            <p>We use your information for the following purposes:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>To provide and maintain our service, including registering accounts and authenticating users.</li>
              <li>To analyze your resume and generate personalized career roadmaps, skill recommendations, and professional development resources.</li>
              <li>To connect candidates with potential job opportunities based on their qualifications and preferences.</li>
              <li>To improve and optimize our platform, including AI algorithms that power our recommendation systems.</li>
              <li>To communicate with you about your account, respond to inquiries, or provide customer support.</li>
              <li>To detect, prevent, and address technical issues or security concerns.</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-teal-700 mt-8 mb-4">4. AI Processing</h2>
            <p>Our platform uses artificial intelligence to analyze resumes, generate career roadmaps, and provide personalized recommendations. This involves:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Automated processing of resume content to extract relevant skills, experience, and qualifications.</li>
              <li>Algorithmic generation of personalized career development milestones and recommendations.</li>
              <li>Machine learning models that may improve based on user interactions and feedback.</li>
            </ul>
            <p>You maintain control over your data, and our AI processing is designed to provide value to you rather than to make automated decisions with legal or similarly significant effects.</p>
            
            <h2 className="text-xl font-semibold text-teal-700 mt-8 mb-4">5. Data Sharing and Disclosure</h2>
            <p>We may share your information in the following situations:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Service Providers:</strong> We may share your data with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf.</li>
              <li><strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or sale of assets, your data may be transferred as part of that transaction.</li>
              <li><strong>Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities.</li>
              <li><strong>With Your Consent:</strong> We may share your information for other purposes with your explicit consent.</li>
            </ul>
            <p>We do not sell your personal information to third parties.</p>
            
            <h2 className="text-xl font-semibold text-teal-700 mt-8 mb-4">6. Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. These include:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Secure data storage using Google Firebase and other cloud services with industry-standard encryption.</li>
              <li>Access controls limiting data access to authorized personnel.</li>
              <li>Regular security assessments and updates to maintain protection against emerging threats.</li>
            </ul>
            <p>However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.</p>
            
            <h2 className="text-xl font-semibold text-teal-700 mt-8 mb-4">7. Third-Party Services</h2>
            <p>Our platform integrates with third-party services, including:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Firebase:</strong> For authentication, data storage, and hosting.</li>
              <li><strong>OpenAI:</strong> For AI-powered resume analysis and roadmap generation.</li>
              <li><strong>LinkedIn:</strong> For authentication and profile data import (with your permission).</li>
            </ul>
            <p>These third-party services have their own privacy policies, and we recommend you review them. We are not responsible for the privacy practices of these third parties.</p>
            
            <h2 className="text-xl font-semibold text-teal-700 mt-8 mb-4">8. Your Data Rights</h2>
            <p>Depending on your location, you may have the following rights regarding your data:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>The right to access personal information we hold about you.</li>
              <li>The right to request correction of inaccurate or incomplete information.</li>
              <li>The right to request deletion of your personal data under certain circumstances.</li>
              <li>The right to restrict or object to processing of your personal information.</li>
              <li>The right to data portability, allowing you to obtain a copy of your data in a structured format.</li>
              <li>The right to withdraw consent at any time, where processing is based on your consent.</li>
            </ul>
            <p>To exercise any of these rights, please contact us using the information provided in the "Contact Us" section below.</p>
            
            <h2 className="text-xl font-semibold text-teal-700 mt-8 mb-4">9. Data Retention</h2>
            <p>We retain your personal information for as long as necessary to fulfill the purposes outlined in this privacy policy, unless a longer retention period is required or permitted by law. When determining retention periods, we consider:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>The amount, nature, and sensitivity of the personal data.</li>
              <li>The potential risk of harm from unauthorized use or disclosure.</li>
              <li>The purposes for which we process the data and whether we can achieve those purposes through other means.</li>
              <li>Applicable legal requirements.</li>
            </ul>
            <p>You may request deletion of your account and associated data at any time.</p>
            
            <h2 className="text-xl font-semibold text-teal-700 mt-8 mb-4">10. Children's Privacy</h2>
            <p>Our platform is not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16. If you are a parent or guardian and believe we have collected information from your child, please contact us immediately.</p>
            
            <h2 className="text-xl font-semibold text-teal-700 mt-8 mb-4">11. International Data Transfers</h2>
            <p>Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws than your country. By using our platform, you consent to the transfer of your information to these countries.</p>
            
            <h2 className="text-xl font-semibold text-teal-700 mt-8 mb-4">12. Changes to This Privacy Policy</h2>
            <p>We may update this privacy policy from time to time. The updated version will be indicated by an updated "Last Updated" date at the top of this page. We encourage you to review this privacy policy periodically for any changes.</p>
            
            <h2 className="text-xl font-semibold text-teal-700 mt-8 mb-4">13. Contact Us</h2>
            <p>If you have questions or concerns about this privacy policy or our data practices, please contact us at:</p>
            <p className="ml-6">Email: privacy@pivotai.me</p>
          </div>
        </div>
      </main>

      <footer className="bg-gradient-to-r from-teal-900 to-teal-800 text-white py-10 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-xl font-bold text-white font-inter">PivotAI Career</h2>
              <p className="mt-2 text-teal-100">AI-powered career development</p>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-8">
              <Link href="/" className="text-teal-100 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/auth/register" className="text-teal-100 hover:text-white transition-colors">
                Get Started
              </Link>
              <Link href="/auth/login" className="text-teal-100 hover:text-white transition-colors">
                Login
              </Link>
              <Link href="/privacy-policy" className="text-teal-100 hover:text-white transition-colors">
                Privacy Policy
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
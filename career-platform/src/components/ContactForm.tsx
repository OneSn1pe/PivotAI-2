'use client';

import React, { useState } from 'react';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({
    type: null,
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: 'success',
          message: 'Thank you! Your message has been sent successfully.'
        });
        // Reset form
        setFormData({ name: '', email: '', message: '' });
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full relative">
      <div className="absolute -top-4 -right-4">
        <div className="cloud-sm opacity-30"></div>
      </div>
      
      <h3 className="text-2xl font-bold mb-6 text-center text-sky-800">Get In Touch</h3>
      
      {status.type && (
        <div 
          className={`mb-6 p-4 rounded-lg ${
            status.type === 'success' ? 'status-partly-cloudy' : 'status-stormy'
          }`}
        >
          {status.message}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-sky-700 font-medium mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-sky-200 rounded-lg bg-white/70 backdrop-filter backdrop-blur-sm focus:ring-sky-500 focus:border-sky-500"
            placeholder="Your Name"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="email" className="block text-sky-700 font-medium mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-sky-200 rounded-lg bg-white/70 backdrop-filter backdrop-blur-sm focus:ring-sky-500 focus:border-sky-500"
            placeholder="your.email@example.com"
            required
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="message" className="block text-sky-700 font-medium mb-2">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={5}
            className="w-full px-4 py-3 border border-sky-200 rounded-lg bg-white/70 backdrop-filter backdrop-blur-sm focus:ring-sky-500 focus:border-sky-500"
            placeholder="How can we help you?"
            required
          ></textarea>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className={`cloud-btn w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-all
            ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:from-sky-600 hover:to-blue-700'}`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></span>
              Sending...
            </span>
          ) : 'Send Message'}
        </button>
      </form>
    </div>
  );
};

export default ContactForm; 
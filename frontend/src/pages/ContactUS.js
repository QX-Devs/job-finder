import React, { useState, useEffect, useRef } from 'react';
import './ContactUs.css';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [showSnackbar, setShowSnackbar] = useState(false);
  const scrollRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    scrollRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      scrollRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  useEffect(() => {
    if (showSnackbar) {
      const timer = setTimeout(() => {
        setShowSnackbar(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [showSnackbar]);

  const addToRefs = (el) => {
    if (el && !scrollRefs.current.includes(el)) {
      scrollRefs.current.push(el);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      console.log('Form submitted:', formData);
      setShowSnackbar(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }
  };

  const contactMethods = [
    {
      icon: '📧',
      title: 'Email Us',
      details: "We'll reply within 24 hours",
      contact: 'support@gradjob.com',
      link: 'mailto:support@gradjob.com'
    },
    {
      icon: '💬',
      title: 'Live Chat',
      details: 'Chat with our support team',
      contact: 'Available 9AM-6PM EST',
      link: '#chat'
    },
    {
      icon: '📞',
      title: 'Call Us',
      details: 'Mon-Fri from 9am to 6pm',
      contact: '+1 (555) 123-GRAD',
      link: 'tel:+15551234723'
    }
  ];

  const teamInfo = [
    {
      icon: '👥',
      title: 'Team QX',
      description: 'Four passionate Computer Science students building the future of career development'
    },
    {
      icon: '🌍',
      title: 'Location',
      description: 'Based in our university innovation lab, working remotely to serve students worldwide'
    }
  ];

  const faqs = [
    {
      question: 'How long does it take to get a response?',
      answer: 'We typically respond within 24 hours during weekdays. For urgent matters, use the live chat.'
    },
    {
      question: 'Can I schedule a demo of GradJob?',
      answer: 'Absolutely! Contact us to schedule a personalized demo of our platform.'
    },
    {
      question: 'Do you offer support for universities?',
      answer: 'Yes, we offer special programs for universities. Contact us for partnership opportunities.'
    }
  ];

  return (
    <>
    <div className="contact-container">
      {/* Floating Background Shapes */}
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="section-padding">
        <div className="container">
          {/* Header Section */}
          <div className="scroll-trigger text-center mb-6" ref={addToRefs}>
            <div className="hero-icon float-animation">💬</div>
            <h1 className="hero-title gradient-text">Contact Us</h1>
            <p className="body-text" style={{maxWidth: '700px', margin: '0 auto'}}>
              Have questions about GradJob? We're here to help! Reach out to Team QX and let's build better careers together.
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="contact-grid">
            {/* Left Sidebar */}
            <div className="scroll-trigger" ref={addToRefs}>
              {/* Get In Touch Section */}
              <div>
                <h2 className="section-title" style={{color: 'var(--primary-accent)'}}>
                  Get In Touch
                </h2>
                
                {contactMethods.map((method, index) => (
                  <div className="contact-method-card" key={index}>
                    <div className="contact-method-header">
                      <span className="contact-icon">{method.icon}</span>
                      <div>
                        <h3 className="contact-method-title">{method.title}</h3>
                        <p className="contact-method-details">{method.details}</p>
                      </div>
                    </div>
                    <a href={method.link} className="contact-link">
                      {method.contact}
                    </a>
                  </div>
                ))}
              </div>

              {/* Team Information */}
              <div className="team-info-section">
                <h2 className="subsection-title" style={{color: 'var(--primary-accent)'}}>
                  About Team QX
                </h2>
                {teamInfo.map((info, index) => (
                  <div className="team-info-item" key={index}>
                    <span className="contact-icon">{info.icon}</span>
                    <div className="team-info-content">
                      <h3>{info.title}</h3>
                      <p>{info.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Response Time Card */}
              <div className="response-time-card">
                <div className="response-time-header">
                  <span className="contact-icon" style={{fontSize: '28px'}}>🕐</span>
                  <h3 className="subsection-title" style={{marginBottom: 0}}>Response Time</h3>
                </div>
                <p className="body-text" style={{fontSize: '0.95rem'}}>
                  We typically respond to all inquiries within 24 hours during business days. 
                  For urgent matters, please use the live chat feature.
                </p>
              </div>
            </div>

            {/* Right Side - Contact Form */}
            <div className="scroll-trigger" ref={addToRefs}>
              <div className="glass-card card-padding">
                <h2 className="section-title" style={{color: 'var(--primary-accent)'}}>
                  Send us a Message
                </h2>
                
                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="name">Your Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className={`form-input ${errors.name ? 'error' : ''}`}
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                      />
                      {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label" htmlFor="email">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className={`form-input ${errors.email ? 'error' : ''}`}
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                      />
                      {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>
                  </div>
                  
                  <div className="form-group full-width">
                    <label className="form-label" htmlFor="subject">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      className={`form-input ${errors.subject ? 'error' : ''}`}
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="How can we help?"
                    />
                    {errors.subject && <span className="error-message">{errors.subject}</span>}
                  </div>
                  
                  <div className="form-group full-width">
                    <label className="form-label" htmlFor="message">Your Message</label>
                    <textarea
                      id="message"
                      name="message"
                      className={`form-textarea ${errors.message ? 'error' : ''}`}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us more about your inquiry..."
                    />
                    {errors.message && <span className="error-message">{errors.message}</span>}
                  </div>
                  
                  <button type="submit" className="btn btn-primary">
                    <span>Send Message</span>
                    <span className="btn-icon">📤</span>
                  </button>
                </form>

                {/* FAQ Section */}
                <div className="faq-section">
                  <h2 className="subsection-title" style={{color: 'var(--primary-accent)'}}>
                    Frequently Asked Questions
                  </h2>
                  
                  {faqs.map((faq, index) => (
                    <div className="faq-item" key={index}>
                      <h3 className="faq-question">{faq.question}</h3>
                      <p className="faq-answer">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Snackbar */}
      <div className={`snackbar ${showSnackbar ? 'show' : ''}`}>
        <span className="snackbar-icon">✓</span>
        <span className="snackbar-message">
          Your message has been sent successfully! We'll get back to you soon.
        </span>
      </div>
    </div>
    </>
  );
};

export default ContactUs;
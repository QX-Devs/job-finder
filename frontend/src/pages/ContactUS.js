import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './ContactUs.css';

const ContactUs = () => {
  const { t } = useLanguage();
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
      newErrors.name = t('nameRequired');
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t('emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('emailInvalid');
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = t('subjectRequired');
    }
    
    if (!formData.message.trim()) {
      newErrors.message = t('messageRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // const handleSubmit = (e) => {
  //   e.preventDefault();
    
  //   if (validateForm()) {
  //     console.log('Form submitted:', formData);
  //     setShowSnackbar(true);
  //     setFormData({ name: '', email: '', subject: '', message: '' });
  //   }
  // };

  // داخل ملف ContactUs.js

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (validateForm()) {
    try {
      const response = await fetch('https://job-finder-r1dh.onrender.com/api/auth/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setShowSnackbar(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        alert(result.message || "Error sending message");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Could not connect to the server");
    }
  }
};

  const contactMethods = [
    {
      icon: '📧',
      title: t('emailUs'),
      details: t('emailResponse'),
      contact: 'gradjob.noreply@gmail.com',
      link: 'mailto:gradjob.noreply@gmail.com'
    },
    {
      icon: '💬',
      title: t('liveChat'),
      details: t('chatAvailability'),
      contact: t('callHours'),
      link: '#chat'
    },
    {
      icon: '📞',
      title: t('callUs'),
      details: t('callHours'),
      contact: '+1 (555) 123-GRAD',
      link: 'tel:+15551234723'
    }
  ];

  const teamInfo = [
    {
      icon: '👥',
      title: t('aboutTeamQX'),
      description: t('teamQXDesc')
    },
    {
      icon: '🌍',
      title: t('location'),
      description: t('locationDesc')
    }
  ];

  const faqs = [
    {
      question: t('faq1Question'),
      answer: t('faq1Answer')
    },
    {
      question: t('faq2Question'),
      answer: t('faq2Answer')
    },
    {
      question: t('faq3Question'),
      answer: t('faq3Answer')
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
            <h1 className="hero-title gradient-text">{t('contactUs')}</h1>
            <p className="body-text" style={{maxWidth: '700px', margin: '0 auto'}}>
              {t('contactSubtitle')}
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="contact-grid">
            {/* Left Sidebar */}
            <div className="scroll-trigger" ref={addToRefs}>
              {/* Get In Touch Section */}
              <div>
                <h2 className="section-title" style={{color: 'var(--primary-accent)'}}>
                  {t('getInTouch')}
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
                  {t('aboutTeamQX')}
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
                  <h3 className="subsection-title" style={{marginBottom: 0}}>{t('responseTime')}</h3>
                </div>
                <p className="body-text" style={{fontSize: '0.95rem'}}>
                  {t('responseTimeDesc')}
                </p>
              </div>
            </div>

            {/* Right Side - Contact Form */}
            <div className="scroll-trigger" ref={addToRefs}>
              <div className="glass-card card-padding">
                <h2 className="section-title" style={{color: 'var(--primary-accent)'}}>
                  {t('sendMessage')}
                </h2>
                
                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="name">{t('yourName')}</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className={`form-input ${errors.name ? 'error' : ''}`}
                        value={formData.name}
                        onChange={handleChange}
                        placeholder={t('namePlaceholder')}
                      />
                      {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label" htmlFor="email">{t('emailAddress')}</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className={`form-input ${errors.email ? 'error' : ''}`}
                        value={formData.email}
                        onChange={handleChange}
                        placeholder={t('emailPlaceholder')}
                      />
                      {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>
                  </div>
                  
                  <div className="form-group full-width">
                    <label className="form-label" htmlFor="subject">{t('subject')}</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      className={`form-input ${errors.subject ? 'error' : ''}`}
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder={t('subjectPlaceholder')}
                    />
                    {errors.subject && <span className="error-message">{errors.subject}</span>}
                  </div>
                  
                  <div className="form-group full-width">
                    <label className="form-label" htmlFor="message">{t('yourMessage')}</label>
                    <textarea
                      id="message"
                      name="message"
                      className={`form-textarea ${errors.message ? 'error' : ''}`}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder={t('messagePlaceholder')}
                    />
                    {errors.message && <span className="error-message">{errors.message}</span>}
                  </div>
                  
                  <button type="submit" className="btn btn-primary">
                    <span>{t('sendMessageButton')}</span>
                    <span className="btn-icon">📤</span>
                  </button>
                </form>

                {/* FAQ Section */}
                <div className="faq-section">
                  <h2 className="subsection-title" style={{color: 'var(--primary-accent)'}}>
                    {t('frequentlyAskedQuestions')}
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
          {t('messageSent')}
        </span>
      </div>
    </div>
    </>
  );
};

export default ContactUs;
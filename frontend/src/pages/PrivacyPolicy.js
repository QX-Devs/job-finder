import React, { useEffect, useRef } from 'react';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  const sectionRefs = useRef([]);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    sectionRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const sections = [
    {
      id: 'introduction',
      icon: '🔒',
      title: 'Introduction',
      content: (
        <>
          <p className="policy-text">
            At <span className="highlight">GradJob</span>, we take your privacy seriously. This Privacy Policy explains how Team QX 
            collects, uses, discloses, and safeguards your information when you use our GradJob 
            application and services.
          </p>
          <p className="policy-text">
            By using GradJob, you consent to the data practices described in this policy. 
            If you do not agree with the terms of this policy, please do not access or use our services.
          </p>
        </>
      )
    },
    {
      id: 'collection',
      icon: '📊',
      title: 'Information We Collect',
      content: (
        <>
          <div className="subsection">
            <h3 className="subsection-title">Personal Information</h3>
            <p className="policy-text">
              We may collect personal information that you voluntarily provide to us, including:
            </p>
            <ul className="policy-list">
              <li>Full name and contact information</li>
              <li>Email address and password</li>
              <li>Resume/CV content and employment history</li>
              <li>Educational background and qualifications</li>
              <li>Job preferences and search criteria</li>
            </ul>
          </div>

          <div className="subsection">
            <h3 className="subsection-title">Automatically Collected Information</h3>
            <p className="policy-text">
              When you use GradJob, we automatically collect certain information, including:
            </p>
            <ul className="policy-list">
              <li>Device information and IP address</li>
              <li>Usage patterns and feature interactions</li>
              <li>Application performance data</li>
              <li>Cookies and similar technologies</li>
            </ul>
          </div>
        </>
      )
    },
    {
      id: 'usage',
      icon: '🎯',
      title: 'How We Use Your Information',
      content: (
        <>
          <p className="policy-text">
            We use the information we collect for various purposes, including:
          </p>
          <ul className="policy-list">
            <li>To provide and maintain our services</li>
            <li>To create and optimize your resume/CV</li>
            <li>To match you with relevant job opportunities</li>
            <li>To improve our AI-powered features</li>
            <li>To communicate with you about updates and features</li>
            <li>To ensure application security and prevent fraud</li>
            <li>To comply with legal obligations</li>
          </ul>
        </>
      )
    },
    {
      id: 'sharing',
      icon: '🤝',
      title: 'Data Sharing and Disclosure',
      content: (
        <>
          <p className="policy-text">
            We do not sell your personal information to third parties. We may share your information in the following circumstances:
          </p>

          <div className="subsection">
            <h3 className="subsection-title">With Your Consent</h3>
            <p className="policy-text">
              We may share your resume and profile information with potential employers only when you explicitly authorize us to do so.
            </p>
          </div>

          <div className="subsection">
            <h3 className="subsection-title">Service Providers</h3>
            <p className="policy-text">
              We may employ third-party companies to facilitate our service, provide the service on our behalf, 
              or assist us in analyzing how our service is used.
            </p>
          </div>

          <div className="subsection">
            <h3 className="subsection-title">Legal Requirements</h3>
            <p className="policy-text">
              We may disclose your information where required to do so by law or in response to valid requests by public authorities.
            </p>
          </div>
        </>
      )
    },
    {
      id: 'security',
      icon: '🛡️',
      title: 'Data Security',
      content: (
        <>
          <p className="policy-text">
            We implement appropriate technical and organizational security measures to protect your personal information 
            against unauthorized access, alteration, disclosure, or destruction. These measures include:
          </p>
          <ul className="policy-list">
            <li>Encryption of sensitive data in transit and at rest</li>
            <li>Regular security assessments and updates</li>
            <li>Access controls and authentication mechanisms</li>
            <li>Secure data storage practices</li>
          </ul>
        </>
      )
    },
    {
      id: 'rights',
      icon: '⚖️',
      title: 'Your Rights',
      content: (
        <>
          <p className="policy-text">
            You have certain rights regarding your personal information, including:
          </p>
          <ul className="policy-list">
            <li>Right to access and review your data</li>
            <li>Right to correct inaccurate information</li>
            <li>Right to delete your account and data</li>
            <li>Right to withdraw consent</li>
            <li>Right to data portability</li>
            <li>Right to object to processing</li>
          </ul>
          <p className="policy-text highlight-text">
            To exercise these rights, please contact us at <a href="mailto:privacy@gradjob.com" className="policy-link">privacy@gradjob.com</a>
          </p>
        </>
      )
    },
    {
      id: 'retention',
      icon: '⏱️',
      title: 'Data Retention',
      content: (
        <p className="policy-text">
          We retain your personal information only for as long as necessary to fulfill the purposes 
          outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
        </p>
      )
    },
    {
      id: 'transfers',
      icon: '🌐',
      title: 'International Transfers',
      content: (
        <p className="policy-text">
          Your information may be transferred to and maintained on computers located outside of your 
          state, province, country, or other governmental jurisdiction where the data protection laws 
          may differ from those of your jurisdiction.
        </p>
      )
    },
    {
      id: 'children',
      icon: '👶',
      title: "Children's Privacy",
      content: (
        <p className="policy-text">
          Our service is not intended for individuals under the age of 16. We do not knowingly 
          collect personal information from children under 16. If we become aware that we have 
          collected personal information from a child under 16, we will take steps to delete such information.
        </p>
      )
    },
    {
      id: 'changes',
      icon: '📝',
      title: 'Changes to This Policy',
      content: (
        <p className="policy-text">
          We may update our Privacy Policy from time to time. We will notify you of any changes 
          by posting the new Privacy Policy on this page and updating the "Last Updated" date.
        </p>
      )
    }
  ];

  return (
    <>
    <div className="privacy-container">
      {/* Hero Section */}
      <section className="privacy-hero">
        <div className="hero-content animate-fade-in">
          <div className="hero-icon">🔐</div>
          <h1 className="hero-title">Privacy Policy</h1>
          <p className="hero-subtitle">Last Updated: September 2025</p>
          <div className="hero-tagline">
            Your privacy is our priority. Learn how we protect your data.
          </div>
        </div>
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </section>

      {/* Main Content */}
      <div className="privacy-content">
        {sections.map((section, index) => (
          <section 
            key={section.id}
            className="policy-section"
            ref={el => sectionRefs.current[index] = el}
          >
            <div className="policy-card card-3d">
              <div className="section-header">
                <span className="section-icon">{section.icon}</span>
                <h2 className="section-title">{section.title}</h2>
              </div>
              <div className="section-content">
                {section.content}
              </div>
            </div>
          </section>
        ))}

        {/* Contact Section */}
        <section className="contact-section" ref={el => sectionRefs.current[sections.length] = el}>
          <div className="policy-card card-3d gradient-border">
            <div className="section-header">
              <span className="section-icon">📧</span>
              <h2 className="section-title">Contact Us</h2>
            </div>
            <div className="section-content">
              <p className="policy-text">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="contact-info">
                <div className="contact-item">
                  <strong>Team QX - GradJob</strong>
                </div>
                <div className="contact-item">
                  <span className="contact-label">Email:</span>
                  <a href="mailto:privacy@gradjob.com" className="policy-link">privacy@gradjob.com</a>
                </div>
                <div className="contact-item">
                  <span className="contact-label">Support:</span>
                  <a href="mailto:support@gradjob.com" className="policy-link">support@gradjob.com</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer Note */}
      <footer className="privacy-footer">
        <div className="footer-content">
          <p className="footer-text">
            This Privacy Policy is effective as of December 2024 and will remain in effect except with respect to any 
            changes in its provisions in the future, which will be in effect immediately after being posted on this page.
          </p>
          <div className="footer-divider"></div>
          <p className="footer-copyright">
            © 2024 QX – Quick Execution Group | Your privacy, our commitment
          </p>
        </div>
      </footer>
    </div>
    </>
  );
};

export default PrivacyPolicy;
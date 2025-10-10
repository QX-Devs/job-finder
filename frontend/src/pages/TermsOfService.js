// TermsOfService.js
import React, { useEffect, useRef } from 'react';
import './TermsOfService.css';
import Layout from '../components/Layout';

const TermsOfService = () => {
  const scrollRefs = useRef([]);

  useEffect(() => {
    // Intersection Observer for scroll animations
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

    // Observe all scroll-trigger elements
    scrollRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      scrollRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  const addToRefs = (el) => {
    if (el && !scrollRefs.current.includes(el)) {
      scrollRefs.current.push(el);
    }
  };

  return (
    <Layout>
    <div className="terms-of-service">
      {/* Floating Background Shapes */}
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="section-padding">
        <div className="container">
          {/* Header Section */}
          <div 
            className="scroll-trigger text-center mb-6" 
            ref={addToRefs}
          >
            <div className="hero-icon float-animation">
              ⚖️
            </div>
            <h1 className="hero-title gradient-text">
              Terms of Service
            </h1>
            <p className="small-text">
              Last Updated: September 2025
            </p>
          </div>

          <div className="glass-card card-padding card-3d">
            {/* Introduction */}
            <div 
              className="scroll-trigger mb-6" 
              ref={addToRefs}
            >
              <h2 className="section-title">
                <span className="section-icon">📜</span>
                Introduction
              </h2>
              <p className="body-text" style={{marginBottom: '1.5rem'}}>
                Welcome to GradJob! These Terms of Service ("Terms") govern your use of the GradJob application 
                and services provided by Team QX. By accessing or using GradJob, you agree to be bound by these Terms.
              </p>
              <p className="body-text">
                If you do not agree to these Terms, please do not use our services. We reserve the right to modify 
                these Terms at any time, and such modifications will be effective immediately upon posting.
              </p>
            </div>

            <hr className="glass-divider" />

            {/* Acceptance of Terms */}
            <div 
              className="scroll-trigger mb-6" 
              ref={addToRefs}
            >
              <h2 className="section-title">
                Acceptance of Terms
              </h2>
              <p className="body-text">
                By creating an account or using GradJob, you acknowledge that you have read, understood, and agree 
                to be bound by these Terms. You must be at least 16 years old to use our services.
              </p>
            </div>

            <hr className="glass-divider" />

            {/* User Accounts */}
            <div 
              className="scroll-trigger mb-6" 
              ref={addToRefs}
            >
              <h2 className="section-title">
                <span className="section-icon">👤</span>
                User Accounts
              </h2>
              
              <p className="body-text" style={{marginBottom: '1.5rem'}}>
                When you create an account with GradJob, you agree to:
              </p>
              
              <ul className="custom-list">
                <li className="custom-list-item">
                  <div className="list-icon check">✓</div>
                  <span className="body-text">Provide accurate and complete information</span>
                </li>
                <li className="custom-list-item">
                  <div className="list-icon check">✓</div>
                  <span className="body-text">Maintain the security of your password</span>
                </li>
                <li className="custom-list-item">
                  <div className="list-icon check">✓</div>
                  <span className="body-text">Accept responsibility for all activities under your account</span>
                </li>
                <li className="custom-list-item">
                  <div className="list-icon check">✓</div>
                  <span className="body-text">Notify us immediately of any unauthorized use</span>
                </li>
              </ul>
            </div>

            <hr className="glass-divider" />

            {/* Acceptable Use */}
            <div 
              className="scroll-trigger mb-6" 
              ref={addToRefs}
            >
              <h2 className="section-title">
                Acceptable Use
              </h2>
              
              <h3 className="subsection-title">
                You agree not to use GradJob to:
              </h3>
              
              <ul className="custom-list">
                <li className="custom-list-item">
                  <div className="list-icon cross">✗</div>
                  <span className="body-text">Violate any applicable laws or regulations</span>
                </li>
                <li className="custom-list-item">
                  <div className="list-icon cross">✗</div>
                  <span className="body-text">Infringe upon intellectual property rights</span>
                </li>
                <li className="custom-list-item">
                  <div className="list-icon cross">✗</div>
                  <span className="body-text">Harass, abuse, or harm other users</span>
                </li>
                <li className="custom-list-item">
                  <div className="list-icon cross">✗</div>
                  <span className="body-text">Distribute malware or malicious code</span>
                </li>
                <li className="custom-list-item">
                  <div className="list-icon cross">✗</div>
                  <span className="body-text">Attempt to gain unauthorized access to our systems</span>
                </li>
              </ul>
            </div>

            <hr className="glass-divider" />

            {/* Intellectual Property */}
            <div 
              className="scroll-trigger mb-6" 
              ref={addToRefs}
            >
              <h2 className="section-title">
                <span className="section-icon">©️</span>
                Intellectual Property
              </h2>
              
              <p className="body-text" style={{marginBottom: '1.5rem'}}>
                The GradJob application, including all source code, databases, functionality, software, website designs, 
                audio, video, text, photographs, and graphics, are owned by Team QX and are protected by copyright and 
                other intellectual property laws.
              </p>
              
              <p className="body-text">
                You retain ownership of all content you create using GradJob, including resumes and job applications. 
                However, by using our services, you grant us a worldwide, non-exclusive, royalty-free license to use, 
                reproduce, and display your content solely for the purpose of providing our services to you.
              </p>
            </div>

            <hr className="glass-divider" />

            {/* User Content */}
            <div 
              className="scroll-trigger mb-6" 
              ref={addToRefs}
            >
              <h2 className="section-title">
                <span className="section-icon">📄</span>
                User Content
              </h2>
              
              <p className="body-text" style={{marginBottom: '1.5rem'}}>
                You are solely responsible for the content you create and share through GradJob. You agree that your 
                content will not:
              </p>
              
              <ul className="custom-list">
                <li className="custom-list-item">
                  <div className="list-icon cross">✗</div>
                  <span className="body-text">Violate any third-party rights</span>
                </li>
                <li className="custom-list-item">
                  <div className="list-icon cross">✗</div>
                  <span className="body-text">Contain false or misleading information</span>
                </li>
                <li className="custom-list-item">
                  <div className="list-icon cross">✗</div>
                  <span className="body-text">Be illegal, offensive, or inappropriate</span>
                </li>
              </ul>
              
              <p className="body-text" style={{marginTop: '1.5rem'}}>
                We reserve the right to remove any content that violates these Terms without prior notice.
              </p>
            </div>

            <hr className="glass-divider" />

            {/* AI Services */}
            <div 
              className="scroll-trigger mb-6" 
              ref={addToRefs}
            >
              <h2 className="section-title">
                AI-Powered Services
              </h2>
              
              <p className="body-text" style={{marginBottom: '1.5rem'}}>
                GradJob utilizes artificial intelligence to provide resume building and job matching services. 
                You acknowledge that:
              </p>
              
              <ul className="custom-list">
                <li className="custom-list-item">
                  <div className="list-icon warning">⚠️</div>
                  <span className="body-text">AI-generated content should be reviewed for accuracy</span>
                </li>
                <li className="custom-list-item">
                  <div className="list-icon warning">⚠️</div>
                  <span className="body-text">Job matches are suggestions based on algorithms</span>
                </li>
                <li className="custom-list-item">
                  <div className="list-icon warning">⚠️</div>
                  <span className="body-text">We cannot guarantee job placement outcomes</span>
                </li>
              </ul>
            </div>

            <hr className="glass-divider" />

            {/* Privacy */}
            <div 
              className="scroll-trigger mb-6" 
              ref={addToRefs}
            >
              <h2 className="section-title">
                <span className="section-icon">🔒</span>
                Privacy and Data
              </h2>
              
              <p className="body-text" style={{marginBottom: '1.5rem'}}>
                Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your 
                personal information. By using GradJob, you consent to our data practices as described in the 
                Privacy Policy.
              </p>
              
              <p className="body-text">
                We implement security measures to protect your data, but cannot guarantee absolute security. 
                You are responsible for maintaining the confidentiality of your account information.
              </p>
            </div>

            <hr className="glass-divider" />

            {/* Third-Party Services */}
            <div 
              className="scroll-trigger mb-6" 
              ref={addToRefs}
            >
              <h2 className="section-title">
                <span className="section-icon">🏢</span>
                Third-Party Services
              </h2>
              
              <p className="body-text" style={{marginBottom: '1.5rem'}}>
                GradJob may integrate with third-party services such as LinkedIn, Google Jobs, and other job platforms. 
                These services have their own terms and privacy policies, and we are not responsible for their content 
                or practices.
              </p>
              
              <p className="body-text">
                You are responsible for complying with the terms of any third-party services you access through GradJob.
              </p>
            </div>

            <hr className="glass-divider" />

            {/* Termination */}
            <div 
              className="scroll-trigger mb-6" 
              ref={addToRefs}
            >
              <h2 className="section-title">
                Termination
              </h2>
              
              <p className="body-text" style={{marginBottom: '1.5rem'}}>
                We may suspend or terminate your account at our sole discretion if you violate these Terms or for 
                any other reason. You may also terminate your account at any time by contacting us or using the 
                account deletion feature.
              </p>
              
              <p className="body-text">
                Upon termination, your right to use GradJob will immediately cease, and we may delete your account 
                data in accordance with our data retention policies.
              </p>
            </div>

            <hr className="glass-divider" />

            {/* Disclaimer of Warranties */}
            <div 
              className="scroll-trigger mb-6" 
              ref={addToRefs}
            >
              <h2 className="section-title">
                Disclaimer of Warranties
              </h2>
              
              <p className="body-text" style={{marginBottom: '1.5rem'}}>
                GradJob is provided "as is" and "as available" without warranties of any kind. We do not warrant that:
              </p>
              
              <ul className="custom-list">
                <li className="custom-list-item">
                  <div className="list-icon warning">⚠️</div>
                  <span className="body-text">The service will be uninterrupted or error-free</span>
                </li>
                <li className="custom-list-item">
                  <div className="list-icon warning">⚠️</div>
                  <span className="body-text">Job matches will result in employment</span>
                </li>
                <li className="custom-list-item">
                  <div className="list-icon warning">⚠️</div>
                  <span className="body-text">Resumes will pass specific ATS systems</span>
                </li>
              </ul>
            </div>

            <hr className="glass-divider" />

            {/* Limitation of Liability */}
            <div 
              className="scroll-trigger mb-6" 
              ref={addToRefs}
            >
              <h2 className="section-title">
                Limitation of Liability
              </h2>
              
              <p className="body-text" style={{marginBottom: '1.5rem'}}>
                To the maximum extent permitted by law, Team QX shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages resulting from:
              </p>
              
              <ul className="custom-list">
                <li className="custom-list-item">
                  <span className="body-text">Your use or inability to use GradJob</span>
                </li>
                <li className="custom-list-item">
                  <span className="body-text">Any conduct or content of third parties</span>
                </li>
                <li className="custom-list-item">
                  <span className="body-text">Unauthorized access to or use of your data</span>
                </li>
                <li className="custom-list-item">
                  <span className="body-text">Any errors or omissions in our services</span>
                </li>
              </ul>
            </div>

            <hr className="glass-divider" />

            {/* Governing Law */}
            <div 
              className="scroll-trigger mb-6" 
              ref={addToRefs}
            >
              <h2 className="section-title">
                Governing Law
              </h2>
              
              <p className="body-text">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction where 
                Team QX is based, without regard to its conflict of law provisions.
              </p>
            </div>

            <hr className="glass-divider" />

            {/* Changes to Terms */}
            <div 
              className="scroll-trigger mb-6" 
              ref={addToRefs}
            >
              <h2 className="section-title">
                Changes to Terms
              </h2>
              
              <p className="body-text" style={{marginBottom: '1.5rem'}}>
                We may update these Terms from time to time. We will notify you of any changes by posting the new 
                Terms on this page and updating the "Last Updated" date.
              </p>
              
              <p className="body-text">
                Your continued use of GradJob after any changes constitutes your acceptance of the new Terms.
              </p>
            </div>

            <hr className="glass-divider" />

            {/* Contact Information */}
            <div 
              className="scroll-trigger" 
              ref={addToRefs}
            >
              <h2 className="section-title">
                Contact Information
              </h2>
              
              <p className="body-text" style={{marginBottom: '1.5rem'}}>
                If you have any questions about these Terms of Service, please contact us:
              </p>
              
              <div style={{marginBottom: '1.5rem'}}>
                <h3 className="subsection-title">Team QX - GradJob</h3>
                <p className="body-text">
                  Email: <a href="mailto:legal@gradjob.com" className="animated-link">legal@gradjob.com</a>
                </p>
                <p className="body-text">
                  Privacy Policy: <a href="/privacy-policy" className="animated-link">View Privacy Policy</a>
                </p>
                <p className="body-text">
                  Contact: <a href="/contact-us" className="animated-link">Contact Us</a>
                </p>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div 
            className="scroll-trigger text-center mt-6" 
            ref={addToRefs}
          >
            <p className="small-text">
              These Terms of Service are effective as of December 2024. By using GradJob, you acknowledge that 
              you have read, understood, and agree to be bound by these Terms.
            </p>
          </div>
        </div>
      </div>
    </div>
    </Layout>
  );
};

export default TermsOfService;
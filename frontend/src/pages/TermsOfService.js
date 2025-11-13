// TermsOfService.js
import React, { useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './TermsOfService.css';

const TermsOfService = () => {
  const scrollRefs = useRef([]);
  const { t, direction } = useLanguage();

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
              {t('termsOfService')}
            </h1>
            <p className="small-text">
              {t('lastUpdated')}: {t('september2025')}
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
                {t('termsIntroduction')}
              </h2>
              <p className="body-text" style={{marginBottom: '1.5rem'}}>
                {t('termsIntro1')}
              </p>
              <p className="body-text">
                {t('termsIntro2')}
              </p>
            </div>

            <hr className="glass-divider" />

            {/* Acceptance of Terms */}
            <div 
              className="scroll-trigger mb-6" 
              ref={addToRefs}
            >
              <h2 className="section-title">
                {t('acceptanceOfTerms')}
              </h2>
              <p className="body-text">
                {t('acceptanceDesc')}
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
                {t('userAccounts')}
              </h2>
              
              <p className="body-text" style={{marginBottom: '1.5rem'}}>
                {t('accountAgreement')}
              </p>
              
              <ul className="custom-list">
                <li className="custom-list-item">
                  <div className="list-icon check">✓</div>
                  <span className="body-text">{t('accountReq1')}</span>
                </li>
                <li className="custom-list-item">
                  <div className="list-icon check">✓</div>
                  <span className="body-text">{t('accountReq2')}</span>
                </li>
                <li className="custom-list-item">
                  <div className="list-icon check">✓</div>
                  <span className="body-text">{t('accountReq3')}</span>
                </li>
                <li className="custom-list-item">
                  <div className="list-icon check">✓</div>
                  <span className="body-text">{t('accountReq4')}</span>
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
                {t('acceptableUse')}
              </h2>
              
              <h3 className="subsection-title">
                {t('acceptableUseDesc')}
              </h3>
              
              <ul className="custom-list">
                <li className="custom-list-item">
                  <div className="list-icon cross">✗</div>
                  <span className="body-text">{t('useProhibition1')}</span>
                </li>
                <li className="custom-list-item">
                  <div className="list-icon cross">✗</div>
                  <span className="body-text">{t('useProhibition2')}</span>
                </li>
                <li className="custom-list-item">
                  <div className="list-icon cross">✗</div>
                  <span className="body-text">{t('useProhibition3')}</span>
                </li>
                <li className="custom-list-item">
                  <div className="list-icon cross">✗</div>
                  <span className="body-text">{t('useProhibition4')}</span>
                </li>
                <li className="custom-list-item">
                  <div className="list-icon cross">✗</div>
                  <span className="body-text">{t('useProhibition5')}</span>
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
                {t('intellectualProperty')}
              </h2>
              
              <p className="body-text" style={{marginBottom: '1.5rem'}}>
                {t('ipDescription1')}
              </p>
              
              <p className="body-text">
                {t('ipDescription2')}
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
                {t('userContent')}
              </h2>
              
              <p className="body-text" style={{marginBottom: '1.5rem'}}>
                {t('userContentDesc1')}
              </p>
              
              <ul className="custom-list">
                <li className="custom-list-item">
                  <div className="list-icon cross">✗</div>
                  <span className="body-text">{t('contentProhibition1')}</span>
                </li>
                <li className="custom-list-item">
                  <div className="list-icon cross">✗</div>
                  <span className="body-text">{t('contentProhibition2')}</span>
                </li>
                <li className="custom-list-item">
                  <div className="list-icon cross">✗</div>
                  <span className="body-text">{t('contentProhibition3')}</span>
                </li>
              </ul>
              
              <p className="body-text" style={{marginTop: '1.5rem'}}>
                {t('contentRemoval')}
              </p>
            </div>

            <hr className="glass-divider" />

            {/* AI Services */}
            <div 
              className="scroll-trigger mb-6" 
              ref={addToRefs}
            >
              <h2 className="section-title">
                {t('aiServices')}
              </h2>
              
              <p className="body-text" style={{marginBottom: '1.5rem'}}>
                {t('aiServicesDesc')}
              </p>
              
              <ul className="custom-list">
                <li className="custom-list-item">
                  <div className="list-icon warning">⚠️</div>
                  <span className="body-text">{t('aiAcknowledgment1')}</span>
                </li>
                <li className="custom-list-item">
                  <div className="list-icon warning">⚠️</div>
                  <span className="body-text">{t('aiAcknowledgment2')}</span>
                </li>
                <li className="custom-list-item">
                  <div className="list-icon warning">⚠️</div>
                  <span className="body-text">{t('aiAcknowledgment3')}</span>
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
                {t('privacyAndData')}
              </h2>
              
              <p className="body-text" style={{marginBottom: '1.5rem'}}>
                {t('privacyDesc1')}
              </p>
              
              <p className="body-text">
                {t('privacyDesc2')}
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
                {t('thirdPartyServices')}
              </h2>
              
              <p className="body-text" style={{marginBottom: '1.5rem'}}>
                {t('thirdPartyDesc1')}
              </p>
              
              <p className="body-text">
                {t('thirdPartyDesc2')}
              </p>
            </div>

            <hr className="glass-divider" />

            {/* Termination */}
            <div 
              className="scroll-trigger mb-6" 
              ref={addToRefs}
            >
              <h2 className="section-title">
                {t('termination')}
              </h2>
              
              <p className="body-text" style={{marginBottom: '1.5rem'}}>
                {t('terminationDesc1')}
              </p>
              
              <p className="body-text">
                {t('terminationDesc2')}
              </p>
            </div>

            <hr className="glass-divider" />

            {/* Disclaimer of Warranties */}
            <div 
              className="scroll-trigger mb-6" 
              ref={addToRefs}
            >
              <h2 className="section-title">
                {t('disclaimerWarranties')}
              </h2>
              
              <p className="body-text" style={{marginBottom: '1.5rem'}}>
                {t('warrantiesDesc')}
              </p>
              
              <ul className="custom-list">
                <li className="custom-list-item">
                  <div className="list-icon warning">⚠️</div>
                  <span className="body-text">{t('warranty1')}</span>
                </li>
                <li className="custom-list-item">
                  <div className="list-icon warning">⚠️</div>
                  <span className="body-text">{t('warranty2')}</span>
                </li>
                <li className="custom-list-item">
                  <div className="list-icon warning">⚠️</div>
                  <span className="body-text">{t('warranty3')}</span>
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
                {t('limitationLiability')}
              </h2>
              
              <p className="body-text" style={{marginBottom: '1.5rem'}}>
                {t('liabilityDesc')}
              </p>
              
              <ul className="custom-list">
                <li className="custom-list-item">
                  <span className="body-text">{t('liability1')}</span>
                </li>
                <li className="custom-list-item">
                  <span className="body-text">{t('liability2')}</span>
                </li>
                <li className="custom-list-item">
                  <span className="body-text">{t('liability3')}</span>
                </li>
                <li className="custom-list-item">
                  <span className="body-text">{t('liability4')}</span>
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
                {t('governingLaw')}
              </h2>
              
              <p className="body-text">
                {t('governingLawDesc')}
              </p>
            </div>

            <hr className="glass-divider" />

            {/* Changes to Terms */}
            <div 
              className="scroll-trigger mb-6" 
              ref={addToRefs}
            >
              <h2 className="section-title">
                {t('changesToTerms')}
              </h2>
              
              <p className="body-text" style={{marginBottom: '1.5rem'}}>
                {t('changesDesc1')}
              </p>
              
              <p className="body-text">
                {t('changesDesc2')}
              </p>
            </div>

            <hr className="glass-divider" />

            {/* Contact Information */}
            <div 
              className="scroll-trigger" 
              ref={addToRefs}
            >
              <h2 className="section-title">
                {t('contactInformation')}
              </h2>
              
              <p className="body-text" style={{marginBottom: '1.5rem'}}>
                {t('termsQuestions')}
              </p>
              
              <div style={{marginBottom: '1.5rem'}}>
                <h3 className="subsection-title">{t('teamQXGradJob')}</h3>
                <p className="body-text">
                  {t('email')}: <a href="mailto:legal@gradjob.com" className="animated-link">legal@gradjob.com</a>
                </p>
                <p className="body-text">
                  {t('privacyPolicy')}: <a href="/privacy-policy" className="animated-link">{t('viewPrivacyPolicy')}</a>
                </p>
                <p className="body-text">
                  {t('contact')}: <a href="/contact-us" className="animated-link">{t('contactUs')}</a>
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
              {t('termsEffective')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
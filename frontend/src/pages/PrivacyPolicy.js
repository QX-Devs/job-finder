import React, { useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  const sectionRefs = useRef([]);
  const { t, direction } = useLanguage();

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
      title: t('privacyIntroduction'),
      content: (
        <>
          <p className="policy-text">
            {t('privacyIntro1')} <span className="highlight">GradJob</span> {t('privacyIntro2')}
          </p>
          <p className="policy-text">
            {t('privacyIntro3')}
          </p>
        </>
      )
    },
    {
      id: 'collection',
      icon: '📊',
      title: t('informationWeCollect'),
      content: (
        <>
          <div className="subsection">
            <h3 className="subsection-title">{t('personalInformation')}</h3>
            <p className="policy-text">
              {t('personalInfoDesc')}
            </p>
            <ul className="policy-list">
              <li>{t('personalInfo1')}</li>
              <li>{t('personalInfo2')}</li>
              <li>{t('personalInfo3')}</li>
              <li>{t('personalInfo4')}</li>
              <li>{t('personalInfo5')}</li>
            </ul>
          </div>

          <div className="subsection">
            <h3 className="subsection-title">{t('automaticallyCollected')}</h3>
            <p className="policy-text">
              {t('autoCollectedDesc')}
            </p>
            <ul className="policy-list">
              <li>{t('autoCollected1')}</li>
              <li>{t('autoCollected2')}</li>
              <li>{t('autoCollected3')}</li>
              <li>{t('autoCollected4')}</li>
            </ul>
          </div>
        </>
      )
    },
    {
      id: 'usage',
      icon: '🎯',
      title: t('howWeUseInfo'),
      content: (
        <>
          <p className="policy-text">
            {t('infoUsageDesc')}
          </p>
          <ul className="policy-list">
            <li>{t('infoUsage1')}</li>
            <li>{t('infoUsage2')}</li>
            <li>{t('infoUsage3')}</li>
            <li>{t('infoUsage4')}</li>
            <li>{t('infoUsage5')}</li>
            <li>{t('infoUsage6')}</li>
            <li>{t('infoUsage7')}</li>
          </ul>
        </>
      )
    },
    {
      id: 'sharing',
      icon: '🤝',
      title: t('dataSharing'),
      content: (
        <>
          <p className="policy-text">
            {t('dataSharingDesc')}
          </p>

          <div className="subsection">
            <h3 className="subsection-title">{t('withConsent')}</h3>
            <p className="policy-text">
              {t('withConsentDesc')}
            </p>
          </div>

          <div className="subsection">
            <h3 className="subsection-title">{t('serviceProviders')}</h3>
            <p className="policy-text">
              {t('serviceProvidersDesc')}
            </p>
          </div>

          <div className="subsection">
            <h3 className="subsection-title">{t('legalRequirements')}</h3>
            <p className="policy-text">
              {t('legalRequirementsDesc')}
            </p>
          </div>
        </>
      )
    },
    {
      id: 'security',
      icon: '🛡️',
      title: t('dataSecurity'),
      content: (
        <>
          <p className="policy-text">
            {t('dataSecurityDesc')}
          </p>
          <ul className="policy-list">
            <li>{t('securityMeasure1')}</li>
            <li>{t('securityMeasure2')}</li>
            <li>{t('securityMeasure3')}</li>
            <li>{t('securityMeasure4')}</li>
          </ul>
        </>
      )
    },
    {
      id: 'rights',
      icon: '⚖️',
      title: t('yourRights'),
      content: (
        <>
          <p className="policy-text">
            {t('yourRightsDesc')}
          </p>
          <ul className="policy-list">
            <li>{t('right1')}</li>
            <li>{t('right2')}</li>
            <li>{t('right3')}</li>
            <li>{t('right4')}</li>
            <li>{t('right5')}</li>
            <li>{t('right6')}</li>
          </ul>
          <p className="policy-text highlight-text">
            {t('exerciseRights')} <a href="mailto:privacy@gradjob.com" className="policy-link">privacy@gradjob.com</a>
          </p>
        </>
      )
    },
    {
      id: 'retention',
      icon: '⏱️',
      title: t('dataRetention'),
      content: (
        <p className="policy-text">
          {t('dataRetentionDesc')}
        </p>
      )
    },
    {
      id: 'transfers',
      icon: '🌐',
      title: t('internationalTransfers'),
      content: (
        <p className="policy-text">
          {t('internationalTransfersDesc')}
        </p>
      )
    },
    {
      id: 'children',
      icon: '👶',
      title: t('childrenPrivacy'),
      content: (
        <p className="policy-text">
          {t('childrenPrivacyDesc')}
        </p>
      )
    },
    {
      id: 'changes',
      icon: '📝',
      title: t('policyChanges'),
      content: (
        <p className="policy-text">
          {t('policyChangesDesc')}
        </p>
      )
    }
  ];

  return (
    <div className="privacy-container">
      {/* Hero Section */}
      <section className="privacy-hero">
        <div className="hero-content animate-fade-in">
          <div className="hero-icon">🔐</div>
          <h1 className="hero-title">{t('privacyPolicy')}</h1>
          <p className="hero-subtitle">{t('lastUpdated')}: {t('september2025')}</p>
          <div className="hero-tagline">
            {t('privacyPriority')}
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
              <h2 className="section-title">{t('contactUs')}</h2>
            </div>
            <div className="section-content">
              <p className="policy-text">
                {t('privacyQuestions')}
              </p>
              <div className="contact-info">
                <div className="contact-item">
                  <strong>{t('teamQXGradJob')}</strong>
                </div>
                <div className="contact-item">
                  <span className="contact-label">{t('support')}:</span>
                  <a href="mailto:gradjob.noreply@gmail.com" className="policy-link">gradjob.noreply@gmail.com</a>
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
            {t('privacyEffective')}
          </p>
          <div className="footer-divider"></div>
          <p className="footer-copyright">
            {t('privacyCopyright')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
import React, { useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './AboutUs.css';

const AboutUs = () => {
  const { t } = useLanguage();
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

  const addToRefs = (el) => {
    if (el && !scrollRefs.current.includes(el)) {
      scrollRefs.current.push(el);
    }
  };

  const data = {
    team: [
      { 
        name: t('frontendDeveloper'), 
        role: t('frontendRole'), 
        avatar: "FD", 
        skills: ["React", "Material-UI", "Figma", "TypeScript"], 
        bio: t('frontendBio'), 
        color: "#0077FF" 
      },
      { 
        name: t('backendDeveloper'), 
        role: t('backendRole'), 
        avatar: "BD", 
        skills: ["Node.js", "API", "Authentication", "PostgreSQL"], 
        bio: t('backendBio'), 
        color: "#00C9FF" 
      },
      { 
        name: t('aiSpecialist'), 
        role: t('aiRole'), 
        avatar: "AI", 
        skills: ["Machine Learning", "AI Tools", "Data Analysis", "Recommendations"], 
        bio: t('aiBio'), 
        color: "#6C63FF" 
      },
      { 
        name: t('projectModerator'), 
        role: t('projectRole'), 
        avatar: "PM", 
        skills: ["GitHub", "Project Management", "Team Coordination", "Quality Assurance"], 
        bio: t('projectBio'), 
        color: "#92FE9D" 
      }
    ],
    values: [
      { icon: "⚡", title: t('speed'), desc: t('speedDesc') },
      { icon: "👥", title: t('collaboration'), desc: t('collaborationDesc') },
      { icon: "🚀", title: t('innovation'), desc: t('innovationDesc') },
      { icon: "🎯", title: t('impact'), desc: t('impactDesc') }
    ],
    features: [
      { icon: "📄", title: t('atsFriendlyResumes'), desc: t('atsFriendlyDesc') },
      { icon: "🤖", title: t('aiRecommendations'), desc: t('aiRecommendationsDesc') },
      { icon: "💼", title: t('curatedJobs'), desc: t('curatedJobsDesc') },
      { icon: "✨", title: t('oneClickApply'), desc: t('oneClickApplyDesc') }
    ],
    tech: [
      { name: "React", icon: "⚛️" },
      { name: "AI Tools", icon: "🤖" },
      { name: "Supabase", icon: "🔥" },
      { name: "PostgreSQL", icon: "🐘" },
      { name: "Material-UI", icon: "🎨" }
    ]
  };

  return (
    <>
    <div className="about-container">
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
            <div className="hero-icon float-animation">👥</div>
            <h1 className="hero-title gradient-text">
              {t('qxGroup')}
            </h1>
            <p className="body-text">
              {t('aboutSubtitle')}
            </p>
          </div>

          {/* Who We Are Section */}
          <div className="glass-card card-padding card-3d mb-6">
            <div className="scroll-trigger mb-6" ref={addToRefs}>
              <h2 className="section-title">
                <span className="section-icon">🏢</span>
                {t('whoWeAre')}
              </h2>
              <p className="body-text" style={{marginBottom: '1.5rem'}}>
                {t('whoWeAreDesc1')} <strong style={{color: 'var(--primary-accent)'}}>{t('qxGroup')}</strong>, 
                {t('whoWeAreDesc2')}
              </p>
              <p className="body-text">
                {t('whoWeAreDesc3')}
              </p>
            </div>

            <hr className="glass-divider" />

            {/* Mission Section */}
            <div className="scroll-trigger mb-6" ref={addToRefs}>
              <h2 className="section-title">
                <span className="section-icon">🚀</span>
                {t('ourMission')}
              </h2>
              <p className="body-text" style={{fontStyle: 'italic', fontSize: '1.3rem', lineHeight: '1.8'}}>
                "{t('missionQuote')}"
              </p>
            </div>

            <hr className="glass-divider" />

            {/* What We Do - Features */}
            <div className="scroll-trigger" ref={addToRefs}>
              <h2 className="section-title text-center">
                <span className="section-icon">💡</span>
                {t('whatWeDo')}
              </h2>
              <div className="features-grid">
                {data.features.map((item, i) => (
                  <div className="feature-card card-3d" key={i}>
                    <div className="feature-icon">{item.icon}</div>
                    <h3 className="feature-title">{item.title}</h3>
                    <p className="feature-description">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Team Section */}
          <div className="glass-card card-padding card-3d mb-6">
            <div className="scroll-trigger" ref={addToRefs}>
              <h2 className="section-title text-center">
                <span className="section-icon">👨‍💻</span>
                {t('ourTeam')}
              </h2>
              <p className="body-text text-center" style={{marginBottom: '2rem', color: 'var(--text-tertiary)'}}>
                {t('teamSubtitle')}
              </p>
              <div className="team-grid">
                {data.team.map((member, i) => (
                  <div className="team-card card-3d" key={i}>
                    <div className="team-avatar" style={{ background: `linear-gradient(135deg, ${member.color}, #6C63FF)` }}>
                      {member.avatar}
                    </div>
                    <h3 className="team-name">{member.name}</h3>
                    <p className="team-role">{member.role}</p>
                    <p className="team-bio">{member.bio}</p>
                    <div className="skills-container">
                      {member.skills.map((skill, j) => (
                        <span className="skill-chip" key={j}>{skill}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Values Section */}
          <div className="glass-card card-padding card-3d mb-6">
            <div className="scroll-trigger" ref={addToRefs}>
              <h2 className="section-title text-center">
                <span className="section-icon">🌟</span>
                {t('ourValues')}
              </h2>
              <div className="values-grid">
                {data.values.map((value, i) => (
                  <div className="value-item" key={i}>
                    <div className="value-icon">{value.icon}</div>
                    <div className="value-content">
                      <h3 className="value-title">{value.title}</h3>
                      <p className="value-description">{value.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tech Stack Section */}
          <div className="glass-card card-padding card-3d mb-6">
            <div className="scroll-trigger" ref={addToRefs}>
              <h2 className="section-title text-center">
                <span className="section-icon">🛠️</span>
                {t('techStack')}
              </h2>
              <div className="tech-grid">
                {data.tech.map((tech, i) => (
                  <div className="tech-chip card-3d" key={i}>
                    <span className="tech-icon">{tech.icon}</span>
                    <span className="tech-name">{tech.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="glass-card card-padding card-3d mb-6">
            <div className="scroll-trigger" ref={addToRefs}>
              <h2 className="section-title text-center">
                <span className="section-icon">🔥</span>
                {t('getInvolved')}
              </h2>
              <p className="body-text text-center" style={{marginBottom: '2rem', color: 'var(--text-tertiary)'}}>
                {t('ctaSubtitle')}
              </p>
              <div className="cta-buttons">
                <button className="btn btn-primary" disabled>
                  <span className="btn-icon">📱</span>
                  {t('downloadApp')}
                </button>
                <button className="btn btn-secondary">
                  <span className="btn-icon">💻</span>
                  {t('followGithub')}
                </button>
              </div>
              <p className="cta-note">
                {t('ctaNote')}
              </p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="scroll-trigger text-center" ref={addToRefs}>
            <p className="small-text">
              {t('copyright')}
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default AboutUs;
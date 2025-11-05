import React, { useEffect, useRef } from 'react';
import './AboutUs.css';
const AboutUs = () => {
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
        name: "Frontend Developer", 
        role: "UI/UX & React Development", 
        avatar: "FD", 
        skills: ["React", "Material-UI", "Figma", "TypeScript"], 
        bio: "Designs and builds the user interface with React, creating intuitive and beautiful experiences.", 
        color: "#0077FF" 
      },
      { 
        name: "Backend Developer", 
        role: "API & Database Management", 
        avatar: "BD", 
        skills: ["Node.js", "API", "Authentication", "PostgreSQL"], 
        bio: "Manages the API, authentication, and database systems for scalable performance.", 
        color: "#00C9FF" 
      },
      { 
        name: "AI Specialist", 
        role: "AI Integration & Smart Matching", 
        avatar: "AI", 
        skills: ["Machine Learning", "AI Tools", "Data Analysis", "Recommendations"], 
        bio: "Integrates AI tools for resume suggestions and intelligent job matching algorithms.", 
        color: "#6C63FF" 
      },
      { 
        name: "Project Moderator", 
        role: "Task Organization & Collaboration", 
        avatar: "PM", 
        skills: ["GitHub", "Project Management", "Team Coordination", "Quality Assurance"], 
        bio: "Organizes tasks, manages GitHub, and ensures smooth collaboration across the team.", 
        color: "#92FE9D" 
      }
    ],
    values: [
      { icon: "⚡", title: "Speed", desc: "Fast execution without compromising quality" },
      { icon: "👥", title: "Collaboration", desc: "Every member contributes equally" },
      { icon: "🚀", title: "Innovation", desc: "Using the latest tools and technologies" },
      { icon: "🎯", title: "Impact", desc: "Building solutions that make a real difference" }
    ],
    features: [
      { icon: "📄", title: "ATS-Friendly Resumes", desc: "Build professional resumes that pass automated tracking systems in minutes" },
      { icon: "🤖", title: "AI-Powered Recommendations", desc: "Get smart suggestions for skills, career objectives, and improvements" },
      { icon: "💼", title: "Curated Job Opportunities", desc: "Explore opportunities from LinkedIn, Google Jobs, and company sites" },
      { icon: "✨", title: "One-Click Applications", desc: "Apply to multiple jobs easily, all in one place" }
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
              QX — Quick Execution Group
            </h1>
            <p className="body-text">
              A student-led software development team from Jordan, transforming innovative ideas into real-world solutions 
              with speed, collaboration, and precision.
            </p>
          </div>

          {/* Who We Are Section */}
          <div className="glass-card card-padding card-3d mb-6">
            <div className="scroll-trigger mb-6" ref={addToRefs}>
              <h2 className="section-title">
                <span className="section-icon">🏢</span>
                Who We Are
              </h2>
              <p className="body-text" style={{marginBottom: '1.5rem'}}>
                We are <strong style={{color: 'var(--primary-accent)'}}>QX — Quick Execution Group</strong>, 
                a student-led software development team based in Jordan.
              </p>
              <p className="body-text">
                Founded by four passionate Computer Science students, our mission is to transform innovative ideas into 
                real-world solutions with speed, collaboration, and precision.
              </p>
            </div>

            <hr className="glass-divider" />

            {/* Mission Section */}
            <div className="scroll-trigger mb-6" ref={addToRefs}>
              <h2 className="section-title">
                <span className="section-icon">🚀</span>
                Our Mission
              </h2>
              <p className="body-text" style={{fontStyle: 'italic', fontSize: '1.3rem', lineHeight: '1.8'}}>
                "To empower graduates and young professionals by creating smart, accessible, and modern career tools 
                that help them transition smoothly into the job market."
              </p>
            </div>

            <hr className="glass-divider" />

            {/* What We Do - Features */}
            <div className="scroll-trigger" ref={addToRefs}>
              <h2 className="section-title text-center">
                <span className="section-icon">💡</span>
                What We Do - GradJob
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
                Our Team
              </h2>
              <p className="body-text text-center" style={{marginBottom: '2rem', color: 'var(--text-tertiary)'}}>
                Four passionate Computer Science students, each specializing in different aspects of the project
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
                Our Values
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
                Our Technology Stack
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
                Get Involved
              </h2>
              <p className="body-text text-center" style={{marginBottom: '2rem', color: 'var(--text-tertiary)'}}>
                Join us in empowering graduates and shaping the future of career development
              </p>
              <div className="cta-buttons">
                <button className="btn btn-primary" disabled>
                  <span className="btn-icon">📱</span>
                  Download on Google Play (Coming Soon)
                </button>
                <button className="btn btn-secondary">
                  <span className="btn-icon">💻</span>
                  Follow on GitHub
                </button>
              </div>
              <p className="cta-note">
                Be among the first graduates to shape your career path with GradJob
              </p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="scroll-trigger text-center" ref={addToRefs}>
            <p className="small-text">
              © 2024 QX — Quick Execution Group | Empowering graduates through innovative technology
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default AboutUs;
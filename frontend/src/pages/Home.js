import { useEffect, useRef } from 'react';
import {
  Download, LogIn, FileText, Search, Brain, GraduationCap, Briefcase, Code,
  Database, Cpu, Github, Linkedin, Play, Star, Shield, Sparkles, Globe, Award,
  Rocket
} from 'lucide-react';
import "./Home.css";
import Layout from '../components/Layout';
import authService from '../services/authService';

const Home = () => {
  const sectionRefs = useRef([]);
  const particlesRef = useRef([]);
  const particlesDataRef = useRef([]);
  const heroRef = useRef(null);
  const iconRefs = useRef([]);
  const mouseTarget = useRef({ x: 0, y: 0 });
  const currentOffset = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  useEffect(() => {
    if (particlesDataRef.current.length === 0) {
      particlesDataRef.current = Array.from({ length: 20 }).map(() => {
        const duration = `${(8 + Math.random() * 22).toFixed(2)}s`;
        const delay = `${(Math.random() * 10).toFixed(2)}s`;
        const drift = `${(Math.random() * 120 - 60).toFixed(1)}px`;
        const left = `${(Math.random() * 100).toFixed(3)}%`;
        return { left, duration, delay, drift };
      });
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const rect = heroRef.current?.getBoundingClientRect();
      let nx, ny;
      if (rect) {
        nx = ((e.clientX - rect.left) / rect.width - 0.5);
        ny = ((e.clientY - rect.top) / rect.height - 0.5);
      } else {
        nx = (e.clientX / window.innerWidth - 0.5);
        ny = (e.clientY / window.innerHeight - 0.5);
      }
      mouseTarget.current.x = nx * 1;
      mouseTarget.current.y = ny * 1;
    };

    const handleMouseLeave = () => {
      mouseTarget.current.x = 0;
      mouseTarget.current.y = 0;
    };

    const heroEl = heroRef.current || window;
    heroEl.addEventListener('mousemove', handleMouseMove);
    heroEl.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      heroEl.removeEventListener('mousemove', handleMouseMove);
      heroEl.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    const lerpFactor = 0.08;
    const iconMultiplier = 30;

    const animate = () => {
      currentOffset.current.x += (mouseTarget.current.x - currentOffset.current.x) * lerpFactor;
      currentOffset.current.y += (mouseTarget.current.y - currentOffset.current.y) * lerpFactor;

      particlesRef.current.forEach((p, i) => {
        if (!p) return;
        const depth = (i % 5 + 1) * 5;
        const moveX = currentOffset.current.x * depth;
        const moveY = currentOffset.current.y * depth;
        p.style.transform = `translate(${moveX}px, ${moveY}px)`;
      });

      iconRefs.current.forEach((icon, idx) => {
        if (!icon) return;
        let tx = currentOffset.current.x;
        let ty = currentOffset.current.y;
        if (idx === 1) tx = -tx;
        if (idx === 2) ty = -ty;
        icon.style.transform = `translate(${tx * iconMultiplier}px, ${ty * iconMultiplier}px)`;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('visible')),
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    sectionRefs.current.forEach((ref) => ref && observer.observe(ref));
    return () => observer.disconnect();
  }, []);

  const teamMembers = [
    { icon: Code, title: 'Frontend', desc: 'UI/UX Design & Development' },
    { icon: Cpu, title: 'Backend', desc: 'Server & API Development' },
    { icon: Database, title: 'Database', desc: 'Data Management & Storage' },
    { icon: Brain, title: 'AI', desc: 'Machine Learning & Intelligence' }
  ];

  const features = [
    { icon: FileText, title: 'Resume Builder', desc: 'Generate ATS-friendly resumes in minutes with AI-powered optimization and industry-specific templates.' },
    { icon: Search, title: 'Job Search', desc: 'Find opportunities from LinkedIn, Google Jobs, and more with intelligent matching algorithms.' },
    { icon: Brain, title: 'AI Suggestions', desc: 'Get personalized skills and career recommendations based on market trends and your profile.' }
  ];

  const stats = [
    { number: '10K+', label: 'Downloads' },
    { number: '4.8★', label: 'Rating' },
    { number: '95%', label: 'Success Rate' }
  ];

  const highlights = [
    { icon: Star, text: 'AI-Powered' },
    { icon: Shield, text: 'ATS-Ready' },
    { icon: Sparkles, text: 'Smart Matching' }
  ];

  const footerLinks = [
    { label: 'About', href: '/about-us' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Contact', href: '/contact-us' },
    { label: 'Terms of Service', href: '/terms-of-service' }
  ];

  // Check if user is logged in
  const isLoggedIn = authService.isAuthenticated();

  return (
    <div className="main-container">
      <Layout />
      
      <section className="hero-section" ref={heroRef}>
        <div className="hero-background">
          <div className="gradient-bg"></div>

          <div className="floating-particles">
            {particlesDataRef.current.map((pData, i) => (
              <div
                key={i}
                ref={(el) => (particlesRef.current[i] = el)}
                className="particle"
                style={{
                  left: pData.left,
                  animationDelay: pData.delay,
                  '--duration': pData.duration,
                  '--drift': pData.drift
                }}
              />
            ))}
          </div>

          <div className="floating-shapes">
            <div ref={(el) => (iconRefs.current[0] = el)} className="floating-icon icon-1">
              <FileText size={40} />
            </div>
            <div ref={(el) => (iconRefs.current[1] = el)} className="floating-icon icon-2">
              <GraduationCap size={35} />
            </div>
            <div ref={(el) => (iconRefs.current[2] = el)} className="floating-icon icon-3">
              <Briefcase size={38} />
            </div>
          </div>
        </div>

        <div className="hero-content">
          <h1 className="hero-title">
            <span className="gradient-text">GradJob</span> – Your Gateway to Jobs & ATS-Ready Resumes
          </h1>
          <p className="hero-subtitle">
            Built by <span className="highlight">Team QX</span> to help graduates launch their careers with AI-powered solutions.
          </p>

          <div className="hero-buttons">
            <a href="" className="btn btn-primary">
              <Download size={20} />
              <span>Download on Google Play</span>
            </a>
            
            {/* Conditionally render Get Started or Dashboard button */}
            {isLoggedIn ? (
              <a href="/dashboard" className="btn btn-secondary">
                <LogIn size={20} />
                <span> Go to Dashboard</span>
              </a>
            ) : (
              <a href="/signup" className="btn btn-secondary">
                <LogIn size={20} />
                <span> Get Started</span>
              </a>
            )}
          </div>

          <div className="hero-highlights">
            {highlights.map((item, i) => (
              <div key={i} className="highlight-badge">
                <item.icon size={16} />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={(el) => (sectionRefs.current[0] = el)} className="section about-section">
        <div className="container">
          <h2 className="section-title">
            <Globe size={40} />
            About Team QX
          </h2>
          <p className="section-subtitle">
            We are four passionate Computer Science students dedicated to revolutionizing the job search experience.
            Our mission is to bridge the gap between talented graduates and their dream careers through innovative technology.
          </p>

          <div className="grid team-grid">
            {teamMembers.map((member, i) => (
              <div key={i} className="card team-card">
                <div className="card-icon">
                  <member.icon size={32} />
                </div>
                <h3>{member.title}</h3>
                <p>{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={(el) => (sectionRefs.current[1] = el)} className="section features-section">
        <div className="container">
          <h2 className="section-title">
            <Award size={40} />
            Features
          </h2>

          <div className="grid features-grid">
            {features.map((feature, i) => (
              <div key={i} className="card feature-card">
                <div className="card-icon large">
                  <feature.icon size={48} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={(el) => (sectionRefs.current[2] = el)} className="section download-section">
        <div className="container">
          <h2 className="section-title">
            <Rocket size={40} />
            Download GradJob
          </h2>
          <p className="section-subtitle">
            Start your career journey today with our powerful AI-driven platform
          </p>

          <div className="download-buttons">
            <button className="btn btn-primary large">
              <Play size={24} />
              <span>Download on Google Play</span>
            </button>
            <button className="btn btn-secondary large" disabled>
              <Download size={24} />
              <span>App Store (Coming Soon)</span>
            </button>
          </div>

          <div className="stats-grid">
            {stats.map((stat, i) => (
              <div key={i} className="stat-card">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-links">
              {footerLinks.map((link, i) => (
                <a key={i} href={link.href} className="footer-link">
                  {link.label}
                </a>
              ))}
            </div>
            <div className="footer-social">
              <a href="#" className="social-icon">
                <Linkedin size={24} />
              </a>
              <a href="//github.com/QX-Devs/job-finder" className="social-icon">
                <Github size={24} />
              </a>
            </div>
          </div>
          <div className="footer-copyright">
            © 2024 Team QX – GradJob Project | Empowering Careers Through Innovation
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext"; // <<< يجب يكون قبل الـ hooks
import authService from "../services/authService";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  Briefcase,
  FileText,
  Laptop,
} from "lucide-react";
import "./Login.css";
import { ValidEmail, ValidPassword } from "../ValidInputs";

const Login = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const containerRef = useRef(null);
  const cardRef = useRef(null);

  // Floating background animation
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setMousePos({ x, y });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setApiError("");
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (mode !== "forgot" && !ValidEmail(formData.email)) {
      newErrors.email = t('validEmail');
    }

    if (mode === "login" && !ValidPassword(formData.password)) {
      newErrors.password = t('validPassword');
    }

    if (mode === "forgot" && !ValidEmail(formData.email)) {
      newErrors.email = t('validEmail');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setApiError("");

    try {
      if (mode === "login") {
        const response = await authService.login(formData.email, formData.password);
        
        if (response.success) {
          navigate('/');
        } else {
          setApiError(response.message || t('loginFailed'));
        }
      } else if (mode === "forgot") {
        // Handle forgot password logic
        const response = await authService.forgotPassword(formData.email);
        
        if (response.success) {
          alert(t('resetLinkSent'));
          setMode("login");
        } else {
          setApiError(response.message || t('resetLinkFailed'));
        }
      }
    } catch (error) {
      console.error(`${mode} error:`, error);
      setApiError(error.message || t('unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Mode switch animation
  const switchMode = (newMode) => {
    if (newMode === mode) return;
    cardRef.current?.classList.add("entering");
    setMode(newMode);
    setFormData({ email: "", password: "" });
    setErrors({});
    setApiError("");
    setTimeout(() => cardRef.current?.classList.remove("entering"), 700);
  };

  const redirectToSignUp = () => {
    navigate('/signup');
  };

  const formConfig = {
    login: {
      title: t('welcomeBack'),
      subtitle: t('loginSubtitle'),
      buttonText: t('loginButton'),
      fields: ["email", "password"],
    },
    forgot: {
      title: t('forgotPasswordTitle'),
      subtitle: t('forgotPasswordSubtitle'),
      buttonText: t('sendResetLink'),
      fields: ["email"],
    },
  };

  const config = formConfig[mode];

  // Input field renderer
  const renderField = (field) => {
    const icons = { email: Mail, password: Lock };
    const Icon = icons[field];
    const isPassword = field === "password";

    return (
      <div key={field} className="form-group">
        <div className={`input-wrapper ${errors[field] ? "has-error" : ""}`}>
          <Icon className="input-icon" size={20} />
          <input
            type={isPassword && !showPassword ? "password" : "text"}
            value={formData[field]}
            onChange={(e) => handleChange(field, e.target.value)}
            placeholder={
              field === "email"
                ? t('enterEmail')
                : t('enterPassword')
            }
            className="form-input"
            required
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="toggle-btn"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>
        {errors[field] && <p className="error-text">{errors[field]}</p>}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="auth-container">
      <div className="auth-background">
        <div className="gradient-bg"></div>
        <div className="floating-shapes">
          {[
            { Component: "div", className: "shape shape-1", size: 120 },
            { Component: "div", className: "shape shape-2", size: 80 },
            { Component: "div", className: "shape shape-3", size: 100 },
            { Component: Briefcase, className: "icon-shape", size: 35 },
            { Component: FileText, className: "icon-shape", size: 30 },
            { Component: Laptop, className: "icon-shape", size: 40 },
          ].map((item, i) => {
            const multiplier = [20, -15, 25, 18, -22, 15][i];
            const multiplierY = [20, -15, -10, -12, 18, 25][i];
            return item.Component === "div" ? (
              <div
                key={i}
                className={item.className}
                style={{
                  transform: `translate(${mousePos.x * multiplier}px, ${
                    mousePos.y * multiplierY
                  }px)`,
                }}
              />
            ) : (
              <div
                key={i}
                className={item.className}
                style={{
                  transform: `translate(${mousePos.x * multiplier}px, ${
                    mousePos.y * multiplierY
                  }px)`,
                }}
              >
                <item.Component size={item.size} />
              </div>
            );
          })}
        </div>
      </div>

      <div ref={cardRef} className="auth-card">
        <div className="card-content">
          <div className="logo">GradJob</div>

          <div className="auth-header">
            <h1 className="auth-title">{config.title}</h1>
            <p className="auth-subtitle">{config.subtitle}</p>
          </div>

          {apiError && (
            <div style={{
              background: '#fee',
              color: '#c33',
              padding: '0.8rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {config.fields.map(renderField)}
            
            {mode === "login" && (
              <div className="forgot-password-link">
                <button 
                  type="button" 
                  onClick={() => switchMode("forgot")} 
                  className="link-btn"
                >
                  {t('forgotPassword')}
                </button>
              </div>
            )}

            <button 
              type="submit" 
              className={`submit-btn ${mode}-btn`}
              disabled={isLoading}
            >
              <span>
                {isLoading 
                  ? (mode === "login" ? t('loggingIn') : t('sending')) 
                  : config.buttonText
                }
              </span>
              <ArrowRight size={20} />
            </button>
          </form>

          <div className="auth-footer">
            {mode === "forgot" && (
              <button 
                onClick={() => switchMode("login")} 
                className="link-btn"
              >
                {t('backToLogin')}
              </button>
            )}
            
            <div className="divider">
              <span>{t('dontHaveAccount')}</span>
            </div>
            
            <button
              onClick={redirectToSignUp}
              className="signup-redirect-btn"
            >
              {t('createNewAccount')}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
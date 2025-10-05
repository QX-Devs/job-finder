import React, { useState, useEffect, useRef } from "react";
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
import {
  ValidEmail,
  ValidFullName,
  ValidPassword,
  ValidCPassword,
} from "../ValidInputs"; // ✅ make sure this path is correct

const Login = () => {
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const cardRef = useRef(null);

  // 🌀 Floating background animation
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

  // 🧩 Handle input changes
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" })); // clear error while typing
  };

  // ⚙️ Validate all fields before submission
  const validateForm = () => {
    const newErrors = {};

    if (mode !== "forgot" && !ValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (mode === "register") {
      if (!ValidFullName(formData.fullName))
        newErrors.fullName = "Name should contain only letters and spaces.";
      if (!ValidPassword(formData.password))
        newErrors.password =
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special symbol.";
      if (!ValidCPassword(formData.password, formData.confirmPassword))
        newErrors.confirmPassword = "Passwords do not match or are invalid.";
    }

    if (mode === "login" && !ValidPassword(formData.password)) {
      newErrors.password = "Please enter a valid password.";
    }

    if (mode === "forgot" && !ValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🚀 Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return; // prevent submit on invalid input
    console.log(`${mode} attempt:`, formData);
    alert(`${mode} success ✅`);
  };

  // 🔁 Mode switch animation
  const switchMode = (newMode) => {
    if (newMode === mode) return;
    cardRef.current?.classList.add("entering");
    setMode(newMode);
    setTimeout(() => cardRef.current?.classList.remove("entering"), 700);
  };

  const redirectToSignUp = () => {
    window.location.href = "/signup";
  };

  const formConfig = {
    login: {
      title: "Welcome Back to GradJob",
      subtitle: "Your career starts here – build resumes, apply, and succeed.",
      buttonText: "Login",
      fields: ["email", "password"],
    },
    register: {
      title: "Create Your Account",
      subtitle:
        "Join thousands of professionals building their careers with GradJob.",
      buttonText: "Register",
      fields: ["fullName", "email", "password", "confirmPassword"],
    },
    forgot: {
      title: "Reset Your Password",
      subtitle: "Enter your email and we'll send you a reset link.",
      buttonText: "Send Reset Link",
      fields: ["email"],
    },
  };

  const config = formConfig[mode];

  // 🎨 Input field renderer
  const renderField = (field) => {
    const icons = { email: Mail, password: Lock, confirmPassword: Lock, fullName: User };
    const Icon = icons[field];
    const isPassword = field.includes("Password");
    const showPass = field === "password" ? showPassword : showConfirm;
    const toggleShow = field === "password" ? setShowPassword : setShowConfirm;

    return (
      <div key={field} className="form-group">
        <div className={`input-wrapper ${errors[field] ? "has-error" : ""}`}>
          <Icon className="input-icon" size={20} />
          <input
            type={
              isPassword && !showPass
                ? "password"
                : field === "email"
                ? "email"
                : "text"
            }
            value={formData[field]}
            onChange={(e) => handleChange(field, e.target.value)}
            placeholder={
              field === "fullName"
                ? "Enter your full name"
                : field === "email"
                ? "Enter your email"
                : field === "confirmPassword"
                ? "Confirm your password"
                : field === "password" && mode === "register"
                ? "Create a password"
                : "Enter your password"
            }
            className="form-input"
            required
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => toggleShow(!showPass)}
              className="toggle-btn"
            >
              {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
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
        <div className="floating-particles">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${8 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>
        <div className="floating-shapes">
          {[
            { Component: "div", className: "shape shape-1", size: 120 },
            { Component: "div", className: "shape shape-2", size: 80 },
            { Component: "div", className: "shape shape-3", size: 100 },
            { Component: Briefcase, className: "icon-shape", size: 35, pos: "briefcase" },
            { Component: FileText, className: "icon-shape", size: 30, pos: "file" },
            { Component: Laptop, className: "icon-shape", size: 40, pos: "laptop" },
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

          <form onSubmit={handleSubmit} className="auth-form">
            {config.fields.map(renderField)}
            <button type="submit" className={`submit-btn ${mode}-btn`}>
              <span>{config.buttonText}</span>
              <ArrowRight size={20} />
            </button>
          </form>

          <div className="auth-footer">
            <button onClick={() => switchMode("forgot")} className="link-btn">
              Forgot Password?
            </button>
            <div className="divider">
              <span>Don't have an account?</span>
            </div>
            <button
              onClick={redirectToSignUp}
              className="signup-redirect-btn"
            >
              Create New Account
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

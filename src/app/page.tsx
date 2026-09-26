"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";
import styles from "./auth.module.css";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simplified auth for demonstration
    router.push("/dashboard");
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.backgroundShapes}>
        <div className={styles.shape1}></div>
        <div className={styles.shape2}></div>
      </div>
      
      <div className={`${styles.authCard} glass`}>
        <div className={styles.logoContainer}>
          <Package size={40} className={styles.logoIcon} />
          <h1 className={styles.logoText}>Stock<span>Sense</span></h1>
          <p className={styles.tagline}>Inventory Management System</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <h2 className={styles.formTitle}>{isLogin ? "Welcome Back" : "Create Account"}</h2>
          
          {!isLogin && (
            <div className={styles.inputGroup}>
              <label>Full Name</label>
              <input type="text" className="input-field" placeholder="John Doe" required={!isLogin} />
            </div>
          )}
          
          <div className={styles.inputGroup}>
            <label>Email Address</label>
            <input type="email" className="input-field" placeholder="name@company.com" required />
          </div>
          
          <div className={styles.inputGroup}>
            <label>Password</label>
            <input type="password" className="input-field" placeholder="••••••••" required />
          </div>
          
          {isLogin && (
            <div className={styles.forgotPassword}>
              <a href="#" onClick={(e) => { e.preventDefault(); alert("OTP Sent to Email"); }}>Forgot Password? (OTP)</a>
            </div>
          )}
          
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.8rem' }}>
            {isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div className={styles.toggleText}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Sign up" : "Log in"}
          </span>
        </div>
      </div>
    </div>
  );
}

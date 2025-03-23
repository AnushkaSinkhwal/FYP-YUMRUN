import { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MyContext } from "../../App";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../assets/images/logo.png";
import "./signup.css";

const SignUp = () => {
    const context = useContext(MyContext);
    const { register, error: authError, isLoading } = useAuth();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [contact, setContact] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [healthCondition, setHealthCondition] = useState("Healthy");
    const [error, setError] = useState("");
    const [passwordStrength, setPasswordStrength] = useState("");
    
    const navigate = useNavigate();
    
    // Hide header and footer for auth pages
    context.setisHeaderFooterShow(false);

    useEffect(() => {
        // Check password strength when password changes
        if (!password) {
            setPasswordStrength("");
            return;
        }
        
        // Simple password strength checker
        const hasLowerCase = /[a-z]/.test(password);
        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
        const isLongEnough = password.length >= 8;
        
        const strengthScore = [hasLowerCase, hasUpperCase, hasNumber, hasSpecialChar, isLongEnough].filter(Boolean).length;
        
        if (strengthScore <= 2) {
            setPasswordStrength("weak");
        } else if (strengthScore <= 3) {
            setPasswordStrength("medium");
        } else {
            setPasswordStrength("strong");
        }
    }, [password]);

    const validateEmail = (email) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        setError("");
        
        // Enhanced validation
        if (!fullName.trim()) {
            setError("Full name is required");
            return;
        }
        
        if (!email.trim()) {
            setError("Email is required");
            return;
        }
        
        if (!validateEmail(email)) {
            setError("Please enter a valid email address");
            return;
        }
        
        if (!contact.trim()) {
            setError("Contact number is required");
            return;
        }
        
        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }
        
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        
        console.log("Submitting registration form:", { fullName, email, contact, healthCondition });
        
        try {
            const result = await register(fullName, email, password, contact, healthCondition);
            console.log("Registration result:", result);
            
            if (result && result.success) {
                console.log("Registration successful, redirecting to signin");
                navigate("/signin", { 
                    replace: true,
                    state: { message: "Account created successfully! Please sign in." }
                });
            } else {
                console.error("Registration failed:", result?.error);
                setError(result?.error || "Registration failed");
            }
        } catch (err) {
            console.error("Registration error:", err);
            setError("An unexpected error occurred: " + (err.message || err));
        }
    };

    return (
        <div className="sign-up-wrapper">
            <div className="container">
                <div className="signup-card">
                    <div className="signup-logo">
                        <Link to="/">
                            <img src={Logo} alt="YumRun Logo" />
                        </Link>
                    </div>
                    <div className="signup-card-header">
                        <h1>Create Account</h1>
                        <p>Join YumRun to discover amazing food in your area!</p>
                    </div>
                    
                    {(error || authError) && (
                        <div className="error-message">
                            {error || authError}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="signup-form">
                        <div className="form-group">
                            <label htmlFor="fullName">Full Name</label>
                            <input
                                type="text"
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Enter your full name"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="contact">Contact Number</label>
                            <input
                                type="tel"
                                id="contact"
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
                                placeholder="Enter your contact number"
                                required
                            />
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Create a password"
                                    required
                                />
                                {passwordStrength && (
                                    <div className={`password-strength ${passwordStrength}`}>
                                        Password strength: {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                                    </div>
                                )}
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your password"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="healthCondition">Health Condition</label>
                            <select
                                id="healthCondition"
                                value={healthCondition}
                                onChange={(e) => setHealthCondition(e.target.value)}
                                required
                            >
                                <option value="Healthy">Healthy</option>
                                <option value="Diabetes">Diabetes</option>
                                <option value="Heart Condition">Heart Condition</option>
                                <option value="Hypertension">Hypertension</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        
                        <button
                            type="submit"
                            className="sign-up-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Creating Account...
                                </>
                            ) : "Sign Up"}
                        </button>
                        
                        <p className="signin-prompt">
                            Already have an account?{" "}
                            <Link to="/signin" className="signin-link">
                                Sign in
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SignUp;

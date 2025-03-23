import { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { MyContext } from "../../App";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../assets/images/logo.png";
import "./signin.css";

const SignIn = () => {
    const context = useContext(MyContext);
    const { login, error: authError, isLoading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get the redirect path, or default to home
    const from = location.state?.from?.pathname || "/";
    // Get any success message passed from other pages
    const successMessage = location.state?.message || "";
    
    // Hide header and footer for auth pages
    context.setisHeaderFooterShow(false);

    const validateEmail = (email) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase()) || email.includes('@');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        setError("");
        
        // Enhanced validation
        if (!email.trim()) {
            setError("Email is required");
            return;
        }

        if (!validateEmail(email)) {
            setError("Please enter a valid email address");
            return;
        }
        
        if (!password) {
            setError("Password is required");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        console.log("Submitting login form:", { email, password, rememberMe });
        
        try {
            // Use the login function from auth context
            const result = await login(email, password);
            console.log("Login result:", result);
            
            if (result && result.success) {
                // Remember user preference if selected
                if (rememberMe) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                // Check if user is admin and redirect to admin dashboard
                if (result.user && result.user.isAdmin) {
                    console.log("Admin user detected, redirecting to admin dashboard");
                    navigate("/admin/dashboard", { replace: true });
                    context.setIsAdminPath(true);
                } else {
                    // Redirect to previous location or home for regular users
                    console.log("Regular user detected, redirecting to:", from);
                    navigate(from, { replace: true });
                    context.setisHeaderFooterShow(true);
                }
            } else {
                console.error("Login failed:", result?.error);
                setError(result?.error || "Authentication failed");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("An unexpected error occurred: " + (err.message || err));
        }
    };

    // Check for remembered email on component mount
    useEffect(() => {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            setEmail(rememberedEmail);
            setRememberMe(true);
        }
    }, []);

    return (
        <div className="sign-in-wrapper">
            <div className="container">
                <div className="login-card">
                    <div className="login-logo">
                        <Link to="/">
                            <img src={Logo} alt="YumRun Logo" />
                        </Link>
                    </div>
                    <div className="login-card-header">
                        <h1>Sign In</h1>
                        <p>Welcome back! Please enter your details.</p>
                    </div>
                    
                    {successMessage && (
                        <div className="success-message">
                            {successMessage}
                        </div>
                    )}
                    
                    {(error || authError) && (
                        <div className="error-message">
                            {error || authError}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email">Email or Username</label>
                            <input
                                type="text"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email or username"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                        <div className="form-options">
                            <div className="remember-me">
                                <input 
                                    type="checkbox" 
                                    id="remember" 
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <label htmlFor="remember">Remember me</label>
                            </div>
                            <Link to="/forgot-password" className="forgot-password">
                                Forgot password?
                            </Link>
                        </div>
                        <button
                            type="submit"
                            className="sign-in-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Signing in...
                                </>
                            ) : "Sign In"}
                        </button>
                        <p className="sign-up-prompt">
                            Don&apos;t have an account?{" "}
                            <Link to="/signup" className="sign-up-link">
                                Sign up
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SignIn;

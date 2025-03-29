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
    const [loginAttempted, setLoginAttempted] = useState(false);
    
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
        setLoginAttempted(true);
        
        // Clear previous errors
        setError("");
        
        // Validate input
        if (!email || !password) {
            setError("Please fill in all fields");
            return;
        }
        
        // Validate email format (if it looks like an email)
        if (email.includes('@') && !validateEmail(email)) {
            setError("Please enter a valid email address");
            return;
        }
        
        // Remember email if option is checked
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }
        
        try {
            // Attempt to login
            const result = await login(email, password);
            
            if (result && result.success) {
                // If user is admin, redirect to admin dashboard
                if (result.user.isAdmin) {
                    navigate('/admin/dashboard', { replace: true });
                    return;
                }
                
                // Redirect to previous page or home
                navigate(from, { replace: true });
            } else {
                setError(result?.error || "Invalid username or password");
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
                    
                    {loginAttempted && !email && !password && (
                        <div className="error-message">
                            Please enter both email and password
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
                            className="btn login-btn" 
                            disabled={isLoading}
                        >
                            {isLoading ? "Signing in..." : "Sign In"}
                        </button>
                        <div className="login-footer">
                            <p>Don&apos;t have an account? <Link to="/signup">Sign up</Link></p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SignIn;

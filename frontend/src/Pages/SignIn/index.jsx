import { useContext, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { MyContext } from "../../App";
import { useAuth } from "../../context/AuthContext";
import "./signin.css";

const SignIn = () => {
    const context = useContext(MyContext);
    const { login, error: authError, isLoading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get the redirect path, or default to home
    const from = location.state?.from?.pathname || "/";
    
    // Hide header and footer for auth pages
    context.setisHeaderFooterShow(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        setError("");
        
        // Simple validation
        if (!email || !password) {
            setError("Please fill in all fields");
            return;
        }

        console.log("Submitting login form:", { email, password });
        
        try {
            // Use the login function from auth context
            const result = await login(email, password);
            console.log("Login result:", result);
            
            if (result && result.success) {
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

    return (
        <div className="sign-in-wrapper">
            <div className="container">
                <div className="login-card">
                    <div className="login-card-header">
                        <h1>Sign In</h1>
                        <p>Welcome back! Please enter your details.</p>
                    </div>
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
                                <input type="checkbox" id="remember" />
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
                            {isLoading ? "Signing in..." : "Sign In"}
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

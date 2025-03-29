import { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { MyContext } from "../../App";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const { setisHideSidebarAndHeader, setIsAdminPath } = useContext(MyContext);
  const { login, error: authError, isLoading } = useAuth();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loginAttempted, setLoginAttempted] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path, or default to dashboard
  const from = location.state?.from?.pathname || "/admin/dashboard";

  // Hide sidebar and header for login page
  useEffect(() => {
    setisHideSidebarAndHeader(true);
    return () => {
      setisHideSidebarAndHeader(false);
    };
  }, [setisHideSidebarAndHeader]);

  // Set that we're on an admin path
  useEffect(() => {
    setIsAdminPath(true);
    
    return () => {
      // This cleanup only happens when component unmounts
      // Only reset when navigating away from admin completely
      if (!window.location.pathname.includes('/admin')) {
        setIsAdminPath(false);
      }
    };
  }, [setIsAdminPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginAttempted(true);
    
    // Clear previous errors
    setError("");
    
    // Simple validation
    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      // Use the standard login function
      const result = await login(username, password);
      
      if (result && result.success) {
        // Check if user is admin
        if (!result.user.isAdmin) {
          setError("Access denied. Admin rights required.");
          return;
        }
        
        // Set admin path state
        setIsAdminPath(true);
        
        // Force a small delay to ensure state updates have time to process
        setTimeout(() => {
          // Redirect to previous location or dashboard
          navigate(from, { replace: true });
        }, 100);
      } else {
        setError(result?.error || "Authentication failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred: " + (err.message || err));
    }
  };

  return (
    <div className="loginWrapper">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-10 col-lg-12 col-md-9">
            <div className="card o-hidden border-0 shadow-lg my-5">
              <div className="card-body p-0">
                <div className="row">
                  <div className="col-lg-6 d-none d-lg-block bg-login-image">
                    <div className="p-5 text-center">
                      <h1 className="h4 text-gray-900 mb-4">YUMRUN</h1>
                      <p>Admin Panel</p>
                      <div className="mt-4 p-3 bg-light rounded">
                        <p className="small text-muted mb-1">Default Admin Credentials:</p>
                        <p className="small mb-1"><strong>Username:</strong> admin</p>
                        <p className="small mb-0"><strong>Password:</strong> admin</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="p-5">
                      <div className="text-center">
                        <h1 className="h4 text-gray-900 mb-4">Welcome Back!</h1>
                        <p className="text-muted">Login to admin dashboard</p>
                      </div>
                      {(error || authError) && (
                        <div className="alert alert-danger">
                          {error || authError}
                        </div>
                      )}
                      {loginAttempted && !username && !password && (
                        <div className="alert alert-danger">
                          Please enter both username and password
                        </div>
                      )}
                      <form className="user" onSubmit={handleSubmit}>
                        <div className="form-group mb-3">
                          <input
                            type="text"
                            className="form-control form-control-user"
                            id="adminInputUsername"
                            aria-describedby="usernameHelp"
                            placeholder="Enter Username or Email..."
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group mb-3">
                          <input
                            type="password"
                            className="form-control form-control-user"
                            id="adminInputPassword"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group mb-3">
                          <div className="custom-control custom-checkbox small">
                            <input
                              type="checkbox"
                              className="custom-control-input"
                              id="customCheck"
                            />
                            <label
                              className="custom-control-label"
                              htmlFor="customCheck"
                            >
                              Remember Me
                            </label>
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="btn btn-primary btn-user btn-block"
                          disabled={isLoading}
                        >
                          {isLoading ? "Logging in..." : "Login"}
                        </button>
                      </form>
                      <hr />
                      <div className="text-center">
                        <Link className="small" to="/admin/forgot-password">
                          Forgot Password?
                        </Link>
                      </div>
                      <div className="text-center">
                        <Link className="small" to="/" onClick={() => setIsAdminPath(false)}>
                          Back to Main Site
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 
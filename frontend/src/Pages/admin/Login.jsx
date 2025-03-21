import React, { useContext, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { MyContext } from "../../App";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const { setisHideSidebarAndHeader } = useContext(MyContext);
  const { login, error: authError, isLoading } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path, or default to dashboard
  const from = location.state?.from?.pathname || "/admin/dashboard";

  // Hide sidebar and header for login page
  React.useEffect(() => {
    setisHideSidebarAndHeader(true);
    return () => {
      setisHideSidebarAndHeader(false);
    };
  }, [setisHideSidebarAndHeader]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError("");
    
    // Simple validation
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      // Use the login function from auth context
      const result = await login(email, password);
      
      if (result.success) {
        // Check if user is admin
        if (!result.user.isAdmin) {
          setError("You don't have admin privileges");
          return;
        }
        
        // Redirect to previous location or dashboard
        navigate(from, { replace: true });
      } else {
        setError(result.error || "Authentication failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred");
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
                      <form className="user" onSubmit={handleSubmit}>
                        <div className="form-group mb-3">
                          <input
                            type="email"
                            className="form-control form-control-user"
                            id="exampleInputEmail"
                            aria-describedby="emailHelp"
                            placeholder="Enter Email Address..."
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group mb-3">
                          <input
                            type="password"
                            className="form-control form-control-user"
                            id="exampleInputPassword"
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
                        <Link className="small" to="/">
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
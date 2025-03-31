import { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { MyContext } from "../../App";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../assets/images/logo.png";
import { Button, Input, Label, Checkbox, Alert, Card, Container } from "../../components/ui";

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

    // Check for remembered email and error message on component mount
    useEffect(() => {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        const storedError = localStorage.getItem('signinError');
        
        if (rememberedEmail) {
            setEmail(rememberedEmail);
            setRememberMe(true);
        }
        
        if (storedError) {
            setError(storedError);
            localStorage.removeItem('signinError'); // Clear the error after displaying
        }
    }, []);

    const validateEmail = (email) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase()) || email.includes('@');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoginAttempted(true);
        
        // Clear previous errors
        setError("");
        localStorage.removeItem('signinError');
        
        // Validate input
        if (!email || !password) {
            setError("Please fill in all fields");
            localStorage.setItem('signinError', "Please fill in all fields");
            return;
        }
        
        // Validate email format (if it looks like an email)
        if (email.includes('@') && !validateEmail(email)) {
            setError("Please enter a valid email address");
            localStorage.setItem('signinError', "Please enter a valid email address");
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
                
                // If user is restaurant owner, redirect to restaurant dashboard
                if (result.user.isRestaurantOwner) {
                    navigate('/restaurant/dashboard', { replace: true });
                    return;
                }
                
                // Redirect to previous page or home for other users
                navigate(from, { replace: true });
            } else {
                // Display the specific error message from the backend
                const errorMessage = result?.error || "Authentication failed. Please check your credentials.";
                setError(errorMessage);
                localStorage.setItem('signinError', errorMessage);
            }
        } catch (err) {
            console.error("Login error:", err);
            const errorMessage = "An unexpected error occurred. Please try again later.";
            setError(errorMessage);
            localStorage.setItem('signinError', errorMessage);
        }
    };

    // Fill in test credentials based on selected user type
    const fillTestCredentials = (userType) => {
        switch(userType) {
            case 'admin':
                setEmail('admin@yumrun.com');
                setPassword('Secret@123');
                break;
            case 'restaurant':
                setEmail('owner@yumrun.com');
                setPassword('Secret@123');
                break;
            case 'user':
                setEmail('user@yumrun.com');
                setPassword('Secret@123');
                break;
            case 'delivery':
                setEmail('delivery@yumrun.com');
                setPassword('Secret@123');
                break;
            default:
                break;
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-white to-[#ffe9e2] p-5">
            <Container className="max-w-5xl">
                <div className="grid grid-cols-1 gap-8 overflow-hidden bg-white rounded-lg shadow-xl md:grid-cols-2">
                    {/* Left side - Sign In Form */}
                    <div className="flex flex-col justify-center p-8">
                        <div className="flex justify-center mb-6">
                            <Link to="/">
                                <img src={Logo} alt="YumRun Logo" className="max-w-[120px]" />
                            </Link>
                        </div>
                        
                        <div className="mb-6 text-center">
                            <h1 className="mb-2 text-2xl font-bold text-gray-800">Welcome Back!</h1>
                            <p className="text-gray-600">Sign in to access your YumRun account</p>
                        </div>
                        
                        {successMessage && (
                            <Alert variant="success" className="mb-4">
                                {successMessage}
                            </Alert>
                        )}
                        
                        {(error || authError) && (
                            <Alert variant="error" className="mb-4">
                                {error || authError}
                            </Alert>
                        )}
                        
                        {loginAttempted && !email && !password && (
                            <Alert variant="error" className="mb-4">
                                Please enter both email and password
                            </Alert>
                        )}
                        
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Email or Username
                                </Label>
                                <Input
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email or username"
                                    required
                                    className="w-full"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    Password
                                </Label>
                                <Input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    className="w-full"
                                />
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Checkbox 
                                        id="remember" 
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <label htmlFor="remember" className="block ml-2 text-sm text-gray-700">
                                        Remember me
                                    </label>
                                </div>
                                <Link to="/forgot-password" className="text-sm font-medium text-yumrun-orange hover:text-yumrun-orange-dark hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            
                            <Button 
                                type="submit" 
                                variant="brand"
                                size="full"
                                disabled={isLoading}
                                className="mt-6"
                            >
                                {isLoading ? "Signing in..." : "Sign In"}
                            </Button>
                            
                            <div className="mt-4 text-center">
                                <p className="text-sm text-gray-600">
                                    Don&apos;t have an account?{" "}
                                    <Link to="/signup" className="font-medium text-yumrun-orange hover:text-yumrun-orange-dark hover:underline">
                                        Sign up
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </div>
                    
                    {/* Right side - User Role Information */}
                    <div className="flex-col justify-center hidden p-8 md:flex bg-gradient-to-br from-orange-50 to-orange-100">
                        <h2 className="mb-4 text-xl font-bold text-gray-800">Test Accounts</h2>
                        <p className="mb-6 text-gray-600">
                            YumRun supports multiple user roles. Choose an account type to test:
                        </p>
                        
                        <div className="space-y-4">
                            <Card className="p-4 transition cursor-pointer hover:bg-orange-50" onClick={() => fillTestCredentials('admin')}>
                                <h3 className="font-medium text-gray-800">Admin</h3>
                                <p className="text-sm text-gray-600">Manage users, restaurants, and system settings</p>
                                <div className="mt-1 text-xs text-gray-500">Email: admin@yumrun.com</div>
                            </Card>
                            
                            <Card className="p-4 transition cursor-pointer hover:bg-orange-50" onClick={() => fillTestCredentials('restaurant')}>
                                <h3 className="font-medium text-gray-800">Restaurant Owner</h3>
                                <p className="text-sm text-gray-600">Manage your restaurant menu and orders</p>
                                <div className="mt-1 text-xs text-gray-500">Email: owner@yumrun.com</div>
                            </Card>
                            
                            <Card className="p-4 transition cursor-pointer hover:bg-orange-50" onClick={() => fillTestCredentials('user')}>
                                <h3 className="font-medium text-gray-800">Customer</h3>
                                <p className="text-sm text-gray-600">Order food from restaurants</p>
                                <div className="mt-1 text-xs text-gray-500">Email: user@yumrun.com</div>
                            </Card>
                            
                            <Card className="p-4 transition cursor-pointer hover:bg-orange-50" onClick={() => fillTestCredentials('delivery')}>
                                <h3 className="font-medium text-gray-800">Delivery Staff</h3>
                                <p className="text-sm text-gray-600">Manage and deliver orders</p>
                                <div className="mt-1 text-xs text-gray-500">Email: delivery@yumrun.com</div>
                            </Card>
                        </div>
                        
                        <div className="mt-4 text-xs text-gray-500">
                            <p>Password for all test accounts: Secret@123</p>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
};

export default SignIn;

import { useContext, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MyContext } from "../../App";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../assets/images/logo.png";
import { Button, Input, Label, Checkbox, Alert, Card, Container } from "../../components/ui";

const SignIn = () => {
    const context = useContext(MyContext);
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [loginAttempted, setLoginAttempted] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const location = useLocation();
    
    // Get any success message passed from other pages
    const successMessage = location.state?.message || "";
    
    // Hide header and footer for auth pages - moved to useEffect
    useEffect(() => {
        context.setisHeaderFooterShow(false);
        
        // Check for remembered email and error message
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
        
        // Cleanup function to restore header/footer when component unmounts
        return () => {
            context.setisHeaderFooterShow(true);
        };
    }, [context]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setLoginAttempted(true);
        
        // Clear previous errors
        localStorage.removeItem('signinError');
        
        // Validate required fields
        if (!email || !password) {
            setError("Please fill in all fields");
            localStorage.setItem('signinError', "Please fill in all fields");
            setLoading(false);
            return;
        }
        
        // Validate email format more precisely
        const emailRegex = /^([a-zA-Z0-9_\-.]+)@([a-zA-Z0-9_\-.]+)\.([a-zA-Z]{2,5})$/i;
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address");
            localStorage.setItem('signinError', "Please enter a valid email address");
            setLoading(false);
            return;
        }
        
        // Remember email if option is checked
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }
        
        try {
            console.log('Attempting login with:', { email });
            // Attempt to login
            const response = await login({ email, password });
            console.log('Login response:', response);
            
            if (response.success) {
                console.log('Login successful, redirecting to:', response.dashboardPath);
                // Check stored user data
                const storedUserData = localStorage.getItem('userData');
                const userData = storedUserData ? JSON.parse(storedUserData) : null;
                console.log('Stored user data:', userData);
                
                // Use React Router navigation instead of window.location
                const dashboardPath = response.dashboardPath || '/';
                navigate(dashboardPath, { replace: true });
            } else {
                // Display the specific error message from the backend
                const errorMessage = response.error || "Login failed. Please try again.";
                console.error('Login failed:', errorMessage);
                setError(errorMessage);
                localStorage.setItem('signinError', errorMessage);
            }
        } catch (err) {
            console.error('Login error:', err);
            const errorMessage = err.message || "An unexpected error occurred. Please try again later.";
            setError(errorMessage);
            localStorage.setItem('signinError', errorMessage);
        } finally {
            setLoading(false);
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
                        
                        {error && (
                            <Alert variant="error" className="mb-4">
                                {error}
                            </Alert>
                        )}
                        
                        {loginAttempted && !email && !password && (
                            <Alert variant="error" className="mb-4">
                                Please enter both email and password
                            </Alert>
                        )}
                        
                        {loginAttempted && email && !password && (
                            <Alert variant="error" className="mb-4">
                                Please enter your password
                            </Alert>
                        )}
                        
                        {loginAttempted && !email && password && (
                            <Alert variant="error" className="mb-4">
                                Please enter your email
                            </Alert>
                        )}
                        
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Email or Username
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
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
                                    name="password"
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
                                disabled={loading}
                                className="mt-6"
                            >
                                {loading ? "Signing in..." : "Sign In"}
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

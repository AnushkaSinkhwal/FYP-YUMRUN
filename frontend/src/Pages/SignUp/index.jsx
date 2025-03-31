import { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MyContext } from "../../App";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../assets/images/logo.png";
import { Button, Input, Select, Label, Alert, Card, Spinner, RadioGroup, RadioGroupItem, Container, Switch } from "../../components/ui";

const SignUp = () => {
    const context = useContext(MyContext);
    const { register, error: authError, isLoading } = useAuth();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [contact, setContact] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [healthCondition, setHealthCondition] = useState("Healthy");
    const [role, setRole] = useState("user");
    const [error, setError] = useState("");
    const [passwordStrength, setPasswordStrength] = useState("");
    
    // Restaurant owner specific fields
    const [restaurantName, setRestaurantName] = useState("");
    const [restaurantAddress, setRestaurantAddress] = useState("");
    
    const navigate = useNavigate();
    
    // Hide header and footer for auth pages
    context.setisHeaderFooterShow(false);

    // Check for stored error on component mount
    useEffect(() => {
        const storedError = localStorage.getItem('signupError');
        if (storedError) {
            setError(storedError);
            localStorage.removeItem('signupError'); // Clear the error after displaying
        }
    }, []);

    useEffect(() => {
        // Check password strength when password changes
        if (!password) {
            setPasswordStrength("");
            return;
        }
        
        // Enhanced password strength checker
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

    const [timezone, setTimezone] = useState("Asia/Kathmandu");
    const [defaultCurrency, setDefaultCurrency] = useState("NPR");
    const [notificationPreferences, setNotificationPreferences] = useState({
        enableEmailNotifications: true,
        enableSmsNotifications: false,
        enablePushNotifications: true
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        setError("");
        localStorage.removeItem('signupError');
        
        // Enhanced validation with specific error messages
        if (!fullName.trim()) {
            const errorMessage = "Full name is required";
            setError(errorMessage);
            localStorage.setItem('signupError', errorMessage);
            return;
        }
        
        if (!email.trim()) {
            const errorMessage = "Email is required";
            setError(errorMessage);
            localStorage.setItem('signupError', errorMessage);
            return;
        }
        
        if (!validateEmail(email)) {
            const errorMessage = "Please enter a valid email address";
            setError(errorMessage);
            localStorage.setItem('signupError', errorMessage);
            return;
        }
        
        if (!contact.trim()) {
            const errorMessage = "Contact number is required";
            setError(errorMessage);
            localStorage.setItem('signupError', errorMessage);
            return;
        }
        
        if (password.length < 8) {
            const errorMessage = "Password must be at least 8 characters long";
            setError(errorMessage);
            localStorage.setItem('signupError', errorMessage);
            return;
        }
        
        if (password !== confirmPassword) {
            const errorMessage = "Passwords do not match";
            setError(errorMessage);
            localStorage.setItem('signupError', errorMessage);
            return;
        }
        
        // Restaurant owner validation
        if (role === "restaurantOwner") {
            if (!restaurantName.trim()) {
                const errorMessage = "Restaurant name is required";
                setError(errorMessage);
                localStorage.setItem('signupError', errorMessage);
                return;
            }
            
            if (!restaurantAddress.trim()) {
                const errorMessage = "Restaurant address is required";
                setError(errorMessage);
                localStorage.setItem('signupError', errorMessage);
                return;
            }
        }
        
        // Prepare user data based on role
        const userData = {
            name: fullName,
            email,
            password,
            phone: contact,
            role,
            timezone,
            defaultCurrency,
            notificationPreferences,
            settings: {
                emailNotifications: notificationPreferences.enableEmailNotifications,
                smsNotifications: notificationPreferences.enableSmsNotifications,
                pushNotifications: notificationPreferences.enablePushNotifications
            }
        };
        
        // Add role-specific data
        if (role === "user") {
            userData.healthCondition = healthCondition;
        } else if (role === "restaurantOwner") {
            userData.restaurantName = restaurantName;
            userData.restaurantAddress = restaurantAddress;
        }
        
        try {
            const result = await register(userData);
            
            if (result && result.success) {
                navigate("/signin", { 
                    replace: true,
                    state: { message: "Account created successfully! Please sign in." }
                });
            } else {
                const errorMessage = result?.error || "Registration failed";
                setError(errorMessage);
                localStorage.setItem('signupError', errorMessage);
            }
        } catch (err) {
            const errorMessage = "An unexpected error occurred: " + (err.message || err);
            setError(errorMessage);
            localStorage.setItem('signupError', errorMessage);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-white to-[#ffe9e2] p-5">
            <Container className="max-w-5xl">
                <div className="grid grid-cols-1 gap-8 overflow-hidden bg-white rounded-lg shadow-xl md:grid-cols-2">
                    {/* Left side - Sign Up Form */}
                    <div className="flex flex-col justify-center p-8">
                        <div className="flex justify-center mb-6">
                            <Link to="/">
                                <img src={Logo} alt="YumRun Logo" className="max-w-[120px]" />
                            </Link>
                        </div>
                        
                        <div className="mb-6 text-center">
                            <h1 className="mb-2 text-2xl font-bold text-gray-800">Create Account</h1>
                            <p className="text-gray-600">Join YumRun to discover amazing food in your area!</p>
                        </div>
                        
                        {(error || authError) && (
                            <Alert variant="error" className="mb-4">
                                {error || authError}
                            </Alert>
                        )}
                        
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label className="font-medium">I want to register as:</Label>
                                <RadioGroup 
                                    value={role} 
                                    onValueChange={setRole}
                                    className="flex gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="user" id="user" />
                                        <Label htmlFor="user">Customer</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="restaurantOwner" id="restaurantOwner" />
                                        <Label htmlFor="restaurantOwner">Restaurant Owner</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-700">Personal Information</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input
                                        type="text"
                                        id="fullName"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Enter your full name"
                                        required
                                        className="w-full"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email address"
                                        required
                                        className="w-full"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="contact">Contact Number</Label>
                                    <Input
                                        type="tel"
                                        id="contact"
                                        value={contact}
                                        onChange={(e) => setContact(e.target.value)}
                                        placeholder="Enter your contact number"
                                        required
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-700">Account Settings</h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="timezone">Time Zone</Label>
                                        <Select
                                            id="timezone"
                                            value={timezone}
                                            onValueChange={setTimezone}
                                            className="w-full"
                                        >
                                            <option value="Asia/Kathmandu">Asia/Kathmandu (GMT+5:45)</option>
                                            <option value="UTC">UTC</option>
                                            <option value="America/New_York">America/New_York (GMT-4)</option>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="defaultCurrency">Default Currency</Label>
                                        <Select
                                            id="defaultCurrency"
                                            value={defaultCurrency}
                                            onValueChange={setDefaultCurrency}
                                            className="w-full"
                                        >
                                            <option value="NPR">NPR (रू)</option>
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="GBP">GBP (£)</option>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-700">Notification Preferences</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Email Notifications</Label>
                                            <p className="text-sm text-gray-500">Receive updates via email</p>
                                        </div>
                                        <Switch
                                            checked={notificationPreferences.enableEmailNotifications}
                                            onCheckedChange={(checked) => setNotificationPreferences(prev => ({
                                                ...prev,
                                                enableEmailNotifications: checked
                                            }))}
                                        />
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>SMS Notifications</Label>
                                            <p className="text-sm text-gray-500">Receive updates via SMS</p>
                                        </div>
                                        <Switch
                                            checked={notificationPreferences.enableSmsNotifications}
                                            onCheckedChange={(checked) => setNotificationPreferences(prev => ({
                                                ...prev,
                                                enableSmsNotifications: checked
                                            }))}
                                        />
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Push Notifications</Label>
                                            <p className="text-sm text-gray-500">Receive browser notifications</p>
                                        </div>
                                        <Switch
                                            checked={notificationPreferences.enablePushNotifications}
                                            onCheckedChange={(checked) => setNotificationPreferences(prev => ({
                                                ...prev,
                                                enablePushNotifications: checked
                                            }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-700">Security</h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            type="password"
                                            id="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Create a password"
                                            required
                                            className="w-full"
                                        />
                                        {passwordStrength && (
                                            <div className={`text-xs mt-1 ${
                                                passwordStrength === "weak" ? "text-red-500" : 
                                                passwordStrength === "medium" ? "text-amber-500" : 
                                                "text-green-500"
                                            }`}>
                                                Password strength: {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                                        <Input
                                            type="password"
                                            id="confirmPassword"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm your password"
                                            required
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Role-specific fields */}
                            {role === "user" && (
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-700">Health Information</h3>
                                    <div className="space-y-2">
                                        <Label htmlFor="healthCondition">Health Condition</Label>
                                        <Select
                                            id="healthCondition"
                                            value={healthCondition}
                                            onValueChange={setHealthCondition}
                                            className="w-full"
                                        >
                                            <option value="Healthy">Healthy</option>
                                            <option value="Diabetes">Diabetes</option>
                                            <option value="Heart Condition">Heart Condition</option>
                                            <option value="Hypertension">Hypertension</option>
                                            <option value="Other">Other</option>
                                        </Select>
                                    </div>
                                </div>
                            )}
                            
                            {role === "restaurantOwner" && (
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-700">Restaurant Information</h3>
                                    <div className="space-y-2">
                                        <Label htmlFor="restaurantName">Restaurant Name</Label>
                                        <Input
                                            type="text"
                                            id="restaurantName"
                                            value={restaurantName}
                                            onChange={(e) => setRestaurantName(e.target.value)}
                                            placeholder="Enter your restaurant name"
                                            required
                                            className="w-full"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="restaurantAddress">Restaurant Address</Label>
                                        <Input
                                            type="text"
                                            id="restaurantAddress"
                                            value={restaurantAddress}
                                            onChange={(e) => setRestaurantAddress(e.target.value)}
                                            placeholder="Enter your restaurant address"
                                            required
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            )}
                            
                            <Button
                                type="submit"
                                variant="brand"
                                size="full"
                                disabled={isLoading}
                                className="mt-6"
                            >
                                {isLoading ? (
                                    <>
                                        <Spinner size="sm" className="mr-2 text-white" />
                                        Creating Account...
                                    </>
                                ) : "Sign Up"}
                            </Button>
                            
                            <div className="mt-4 text-center">
                                <p className="text-sm text-gray-600">
                                    Already have an account?{" "}
                                    <Link to="/signin" className="font-medium text-yumrun-orange hover:text-yumrun-orange-dark hover:underline">
                                        Sign in
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </div>
                    
                    {/* Right side - Information */}
                    <div className="flex-col justify-center hidden p-8 md:flex bg-gradient-to-br from-orange-50 to-orange-100">
                        <h2 className="mb-4 text-xl font-bold text-gray-800">Join YumRun Today</h2>
                        <p className="mb-6 text-gray-600">
                            Whether you&apos;re a food lover or a restaurant owner, YumRun has something for everyone:
                        </p>
                        
                        <div className="space-y-4">
                            <Card className="p-4 transition cursor-pointer hover:bg-orange-50">
                                <h3 className="font-medium text-gray-800">For Customers</h3>
                                <p className="text-sm text-gray-600">Order delicious food from your favorite restaurants</p>
                                <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                                    <li>Browse menus from multiple restaurants</li>
                                    <li>Track your orders in real-time</li>
                                    <li>Get personalized food recommendations</li>
                                    <li>Save your favorite restaurants</li>
                                </ul>
                            </Card>
                            
                            <Card className="p-4 transition cursor-pointer hover:bg-orange-50">
                                <h3 className="font-medium text-gray-800">For Restaurant Owners</h3>
                                <p className="text-sm text-gray-600">Grow your business with YumRun</p>
                                <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                                    <li>Manage your menu easily</li>
                                    <li>Track orders and deliveries</li>
                                    <li>Get insights and analytics</li>
                                    <li>Reach more customers</li>
                                </ul>
                            </Card>
                        </div>
                        
                        <div className="mt-6 text-sm text-gray-500">
                            <p>By creating an account, you agree to our Terms of Service and Privacy Policy</p>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
};

export default SignUp;

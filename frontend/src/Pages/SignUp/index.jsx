import { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MyContext } from "../../App";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../assets/images/logo.png";
import { Button, Input, Select, Label, Alert, Card, Spinner, RadioGroup, RadioGroupItem } from "../../components/ui";

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
        
        // Restaurant owner validation
        if (role === "restaurantOwner") {
            if (!restaurantName.trim()) {
                setError("Restaurant name is required");
                return;
            }
            
            if (!restaurantAddress.trim()) {
                setError("Restaurant address is required");
                return;
            }
        }
        
        // Prepare user data based on role
        const userData = {
            name: fullName,
            email,
            password,
            phone: contact,
            role
        };
        
        // Add role-specific data
        if (role === "user") {
            userData.healthCondition = healthCondition;
        } else if (role === "restaurantOwner") {
            userData.restaurantName = restaurantName;
            userData.restaurantAddress = restaurantAddress;
        }
        
        console.log("Submitting registration form:", userData);
        
        try {
            const result = await register(userData);
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
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-white to-[#ffe9e2] p-5">
            <div className="w-full max-w-lg">
                <Card>
                    <div className="flex justify-center mb-6">
                        <Link to="/">
                            <img src={Logo} alt="YumRun Logo" className="max-w-[120px]" />
                        </Link>
                    </div>
                    
                    <div className="mb-8 text-center">
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Create Account</h1>
                        <p className="text-gray-600">Join YumRun to discover amazing food in your area!</p>
                    </div>
                    
                    {(error || authError) && (
                        <Alert variant="error">
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
                        
                        <div className="space-y-2">
                            <Label htmlFor="fullName">
                                Full Name
                            </Label>
                            <Input
                                type="text"
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Enter your full name"
                                required
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="email">
                                Email Address
                            </Label>
                            <Input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                required
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="contact">
                                Contact Number
                            </Label>
                            <Input
                                type="tel"
                                id="contact"
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
                                placeholder="Enter your contact number"
                                required
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    Password
                                </Label>
                                <Input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Create a password"
                                    required
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
                                <Label htmlFor="confirmPassword">
                                    Confirm Password
                                </Label>
                                <Input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your password"
                                    required
                                />
                            </div>
                        </div>
                        
                        {role === "user" && (
                            <div className="space-y-2">
                                <Label htmlFor="healthCondition">
                                    Health Condition
                                </Label>
                                <Select
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
                                </Select>
                            </div>
                        )}
                        
                        {role === "restaurantOwner" && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="restaurantName">
                                        Restaurant Name
                                    </Label>
                                    <Input
                                        type="text"
                                        id="restaurantName"
                                        value={restaurantName}
                                        onChange={(e) => setRestaurantName(e.target.value)}
                                        placeholder="Enter your restaurant name"
                                        required
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="restaurantAddress">
                                        Restaurant Address
                                    </Label>
                                    <Input
                                        type="text"
                                        id="restaurantAddress"
                                        value={restaurantAddress}
                                        onChange={(e) => setRestaurantAddress(e.target.value)}
                                        placeholder="Enter your restaurant address"
                                        required
                                    />
                                </div>
                            </>
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
                        
                        <div className="text-center mt-4">
                            <p className="text-sm text-gray-600">
                                Already have an account?{" "}
                                <Link to="/signin" className="text-yumrun-orange hover:text-yumrun-orange-dark hover:underline font-medium">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default SignUp;

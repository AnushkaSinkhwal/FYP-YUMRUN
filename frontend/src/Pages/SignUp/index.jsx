import { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MyContext } from "../../App";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../assets/images/logo.png";
import { Button, Input, Label, Alert, Spinner, Container, RadioGroup, RadioGroupItem, Select } from "../../components/ui";

const SignUp = () => {
    const context = useContext(MyContext);
    const { register, error: authError, isLoading } = useAuth();
    const [role, setRole] = useState("customer");
    const [formData, setFormData] = useState({
        // Common fields
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        address: "",
        // Customer specific fields
        healthCondition: "Healthy",
        // Restaurant owner specific fields
        restaurantName: "",
        restaurantAddress: "",
        restaurantDescription: "",
        panNumber: "",
        // Delivery rider specific fields
        vehicleType: "motorcycle",
        licenseNumber: "",
        vehicleRegistrationNumber: ""
    });
    const [error, setError] = useState("");
    const [passwordStrength, setPasswordStrength] = useState("");
    
    const navigate = useNavigate();
    
    // Hide header and footer for auth pages using useEffect
    useEffect(() => {
        context.setisHeaderFooterShow(false);
        // Cleanup function to show header/footer when component unmounts
        return () => {
            context.setisHeaderFooterShow(true);
        };
    }, [context]); // Dependency array includes context to adhere to linting rules

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    useEffect(() => {
        // Check password strength when password changes
        if (!formData.password) {
            setPasswordStrength("");
            return;
        }
        
        const hasLetter = /[a-zA-Z]/.test(formData.password);
        const hasNumber = /\d/.test(formData.password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.password);
        const hasMinLength = formData.password.length >= 6;
        
        const requirements = [hasLetter, hasNumber, hasSpecialChar, hasMinLength];
        const strengthScore = requirements.filter(Boolean).length;
        
        if (strengthScore <= 2) {
            setPasswordStrength("weak");
        } else if (strengthScore === 3) {
            setPasswordStrength("medium");
        } else {
            setPasswordStrength("strong");
        }
    }, [formData.password]);

    const validateEmail = (email) => {
        return email.match(/^([a-zA-Z0-9_\-.]+)@(gmail\.com)$/i);
    };

    const validatePhone = (phone) => {
        return /^\d{10}$/.test(phone);
    };

    const validatePAN = (pan) => {
        // PAN format validation for Nepal
        return /^[0-9]{9}$/.test(pan);
    };

    const validatePassword = (password) => {
        const hasLetters = /[a-zA-Z]{6,}/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
        
        return hasLetters && hasNumber && hasSpecialChar;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        setError("");
        
        // Validate common fields
        if (!formData.fullName.trim()) {
            setError("Full name is required");
            return;
        }

        // Validate address field
        if (!formData.address.trim()) {
            setError("Home address is required");
            return;
        }

        // Validate email format
        if (!formData.email || !validateEmail(formData.email)) {
            setError("Please enter a valid Gmail address");
            return;
        }
        
        // Validate phone number
        if (!formData.phone || !validatePhone(formData.phone)) {
            setError("Please enter a valid 10-digit phone number");
            return;
        }
        
        // Role-specific validation
        if (role === "restaurant") {
            if (!formData.restaurantName.trim()) {
                setError("Restaurant name is required");
                return;
            }
            if (!formData.restaurantAddress.trim()) {
                setError("Restaurant address is required");
                return;
            }
            if (!formData.restaurantDescription.trim()) {
                setError("Restaurant description is required");
                return;
            }
            if (!formData.panNumber || !validatePAN(formData.panNumber)) {
                setError("Please enter a valid 9-digit PAN number");
                return;
            }
        } else if (role === "delivery_rider") {
            if (!formData.licenseNumber.trim()) {
                setError("License number is required");
                return;
            }
            if (!formData.vehicleRegistrationNumber.trim()) {
                setError("Vehicle registration number is required");
                return;
            }
        }
        
        // Validate password
        if (!validatePassword(formData.password)) {
            setError("Password must contain at least 6 letters, 1 number, and 1 special character");
            return;
        }
        
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        
        try {
            // Extract first name and last name from full name
            const nameParts = formData.fullName.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || '';
            
            // Prepare user data
            const userData = {
                firstName,
                lastName,
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                password: formData.password,
                role: role
            };
            
            // Add role-specific data
            if (role === "customer") {
                userData.healthCondition = formData.healthCondition;
            } else if (role === "restaurant") {
                userData.restaurantName = formData.restaurantName;
                userData.restaurantAddress = formData.restaurantAddress;
                userData.restaurantDescription = formData.restaurantDescription;
                userData.panNumber = formData.panNumber;
            } else if (role === "delivery_rider") {
                userData.vehicleType = formData.vehicleType;
                userData.licenseNumber = formData.licenseNumber;
                userData.vehicleRegistrationNumber = formData.vehicleRegistrationNumber;
            }
            
            console.log("Sending registration data:", userData);
            const result = await register(userData);
            console.log("Registration result:", result);
            
            if (result && result.success) {
                // Check if email verification is required
                if (result.requiresOTP) {
                    // Redirect to email verification page
                    navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`, { replace: true });
                } else {
                    // Legacy behavior - redirect to signin page
                    navigate("/signin", { 
                        replace: true,
                        state: { message: "Registration successful! Please login to continue." }
                    });
                }
            } else {
                setError(result?.error || "Registration failed. Please try again.");
            }
        } catch (err) {
            console.error("Registration error:", err);
            setError("An unexpected error occurred: " + (err.response?.data?.error?.message || err.message || "Please check your connection and try again."));
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-white to-[#ffe9e2] p-5">
            <Container className="max-w-3xl">
                <div className="p-8 bg-white rounded-lg shadow-xl">
                    <div className="flex justify-center mb-6">
                        <Link to="/">
                            <img src={Logo} alt="YumRun Logo" className="max-w-[120px]" />
                        </Link>
                    </div>
                    
                    <div className="mb-6 text-center">
                        <h1 className="mb-2 text-2xl font-bold text-gray-800">Create Account</h1>
                        <p className="text-gray-600">Join YumRun today!</p>
                    </div>
                    
                    {(error || authError) && (
                        <Alert variant="error" className="mb-4">
                            {error || authError}
                        </Alert>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-700">Account Type</h3>
                            <RadioGroup 
                                value={role} 
                                onValueChange={setRole}
                                className="flex flex-wrap gap-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="customer" id="customer" />
                                    <Label htmlFor="customer">Customer</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="restaurant" id="restaurant" />
                                    <Label htmlFor="restaurant">Restaurant Owner</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="delivery_rider" id="delivery_rider" />
                                    <Label htmlFor="delivery_rider">Delivery Rider</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-700">Personal Information</h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name*</Label>
                                    <Input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        placeholder="Enter your full name"
                                        required
                                        className="w-full"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number*</Label>
                                    <Input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="Enter 10-digit phone number"
                                        required
                                        className="w-full"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address*</Label>
                                    <Input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="Enter Gmail address"
                                        required
                                        className="w-full"
                                    />
                                    <p className="text-xs text-gray-500">Must be a Gmail address</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address">Home Address*</Label>
                                    <Input
                                        type="text"
                                        id="address"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="Enter your home address"
                                        required
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Role-specific fields */}
                        {role === "customer" && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-700">Health Information</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="healthCondition">Health Condition</Label>
                                    <Select
                                        id="healthCondition"
                                        value={formData.healthCondition}
                                        onChange={(value) => setFormData(prev => ({ ...prev, healthCondition: value }))}
                                        options={[
                                            { value: "Healthy", label: "Healthy" },
                                            { value: "Diabetes", label: "Diabetes" },
                                            { value: "Heart Condition", label: "Heart Condition" },
                                            { value: "Hypertension", label: "Hypertension" },
                                            { value: "Other", label: "Other" }
                                        ]}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        )}

                        {role === "restaurant" && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-700">Restaurant Information</h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="restaurantName">Restaurant Name*</Label>
                                        <Input
                                            type="text"
                                            id="restaurantName"
                                            name="restaurantName"
                                            value={formData.restaurantName}
                                            onChange={handleInputChange}
                                            placeholder="Enter restaurant name"
                                            required
                                            className="w-full"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="panNumber">PAN Number*</Label>
                                        <Input
                                            type="text"
                                            id="panNumber"
                                            name="panNumber"
                                            value={formData.panNumber}
                                            onChange={handleInputChange}
                                            placeholder="Enter 9-digit PAN number"
                                            required
                                            className="w-full"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="restaurantAddress">Restaurant Address*</Label>
                                    <Input
                                        type="text"
                                        id="restaurantAddress"
                                        name="restaurantAddress"
                                        value={formData.restaurantAddress}
                                        onChange={handleInputChange}
                                        placeholder="Enter complete restaurant address"
                                        required
                                        className="w-full"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="restaurantDescription">Restaurant Description*</Label>
                                    <textarea
                                        id="restaurantDescription"
                                        name="restaurantDescription"
                                        value={formData.restaurantDescription}
                                        onChange={handleInputChange}
                                        placeholder="Describe your restaurant"
                                        required
                                        className="w-full min-h-[100px] rounded-md border border-gray-300 p-2"
                                    />
                                </div>
                            </div>
                        )}

                        {role === "delivery_rider" && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-700">Vehicle Information</h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="vehicleType">Vehicle Type*</Label>
                                        <Select
                                            id="vehicleType"
                                            value={formData.vehicleType}
                                            onChange={(value) => setFormData(prev => ({ ...prev, vehicleType: value }))}
                                            options={[
                                                { value: "motorcycle", label: "Motorcycle" },
                                                { value: "scooter", label: "Scooter" },
                                                { value: "bicycle", label: "Bicycle" }
                                            ]}
                                            className="w-full"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="licenseNumber">License Number*</Label>
                                        <Input
                                            type="text"
                                            id="licenseNumber"
                                            name="licenseNumber"
                                            value={formData.licenseNumber}
                                            onChange={handleInputChange}
                                            placeholder="Enter license number"
                                            required
                                            className="w-full"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="vehicleRegistrationNumber">Vehicle Registration Number*</Label>
                                        <Input
                                            type="text"
                                            id="vehicleRegistrationNumber"
                                            name="vehicleRegistrationNumber"
                                            value={formData.vehicleRegistrationNumber}
                                            onChange={handleInputChange}
                                            placeholder="Enter vehicle registration number"
                                            required
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-700">Security</h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password*</Label>
                                    <Input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
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
                                    <p className="text-xs text-gray-500">Must contain at least 6 letters, 1 number and 1 special character</p>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password*</Label>
                                    <Input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        placeholder="Confirm your password"
                                        required
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                        
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
                            ) : "Create Account"}
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
            </Container>
        </div>
    );
};

export default SignUp;

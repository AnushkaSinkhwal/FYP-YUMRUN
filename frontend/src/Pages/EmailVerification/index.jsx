import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../assets/images/logo.png";
import { Button, Input, Alert, Container, Spinner } from "../../components/ui";

const EmailVerification = () => {
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email");
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const navigate = useNavigate();
    const { verifyEmail, resendOTP } = useAuth();

    useEffect(() => {
        // If no email provided, redirect to signin
        if (!email) {
            navigate("/signin", { replace: true });
        }
    }, [email, navigate]);

    useEffect(() => {
        // Countdown for resend OTP button
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        // Validate OTP format
        if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
            setError("Please enter a valid 6-digit OTP");
            setLoading(false);
            return;
        }

        try {
            const result = await verifyEmail({ email, otp });
            
            if (result.success) {
                setMessage("Email verified successfully! Redirecting to dashboard...");
                // Auto redirect after 2 seconds
                setTimeout(() => {
                    navigate(result.dashboardPath || "/", { replace: true });
                }, 2000);
            } else {
                setError(result.error || "Verification failed. Please check your OTP and try again.");
            }
        } catch (err) {
            setError("An error occurred during verification. Please try again.");
            console.error("Verification error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setResendLoading(true);
        setError("");
        setMessage("");

        try {
            const result = await resendOTP({ email });
            
            if (result.success) {
                setMessage("A new OTP has been sent to your email");
                setCountdown(60); // Set 60 second countdown
            } else {
                setError(result.error || "Failed to resend OTP. Please try again.");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
            console.error("Resend OTP error:", err);
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-white to-[#ffe9e2] p-5">
            <Container className="max-w-md">
                <div className="p-8 bg-white rounded-lg shadow-xl">
                    <div className="flex justify-center mb-6">
                        <Link to="/">
                            <img src={Logo} alt="YumRun Logo" className="max-w-[120px]" />
                        </Link>
                    </div>
                    
                    <div className="mb-6 text-center">
                        <h1 className="mb-2 text-2xl font-bold text-gray-800">Verify Your Email</h1>
                        <p className="text-gray-600">
                            We&apos;ve sent a verification code to <span className="font-semibold">{email}</span>
                        </p>
                    </div>
                    
                    {error && (
                        <Alert variant="error" className="mb-4">
                            {error}
                        </Alert>
                    )}
                    
                    {message && (
                        <Alert variant="success" className="mb-4">
                            {message}
                        </Alert>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                                Verification Code
                            </label>
                            <Input
                                id="otp"
                                type="text"
                                placeholder="Enter 6-digit code"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={6}
                                className="w-full text-center text-xl tracking-widest"
                                required
                            />
                            <p className="text-xs text-gray-500">
                                Enter the 6-digit code sent to your email
                            </p>
                        </div>
                        
                        <Button 
                            type="submit" 
                            variant="brand"
                            size="full"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Spinner size="sm" className="mr-2 text-white" />
                                    Verifying...
                                </>
                            ) : "Verify Email"}
                        </Button>
                        
                        <div className="mt-4 text-center">
                            <p className="text-sm text-gray-600">
                                Didn&apos;t receive the code?{" "}
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    disabled={resendLoading || countdown > 0}
                                    className={`font-medium ${
                                        resendLoading || countdown > 0
                                            ? "text-gray-400 cursor-not-allowed"
                                            : "text-yumrun-orange hover:text-yumrun-orange-dark hover:underline"
                                    }`}
                                >
                                    {resendLoading ? "Sending..." : 
                                     countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
                                </button>
                            </p>
                        </div>

                        <div className="border-t pt-4 mt-6">
                            <p className="text-sm text-gray-500 text-center">
                                <Link to="/signin" className="text-yumrun-orange hover:underline">
                                    Return to Sign In
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </Container>
        </div>
    );
};

export default EmailVerification; 
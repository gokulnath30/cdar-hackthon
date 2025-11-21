import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Eye, EyeOff, Shield } from "lucide-react";
import { toast } from "sonner";
import { useLocalStorageDB } from "@/lib/useLocalStorageDB";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { getAuthenticatedUser, isInitialized, setCurrentUserId, getCurrentUserId } = useLocalStorageDB();
 
  // Add your logo image URL here
  const logoUrl = "/niq_logo.png"; // Replace with your actual logo path

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      
      // attempt authentication
      const user = getAuthenticatedUser(email, password);
      
      if (!user) {
        toast.error("Invalid email or password");
        return;
      }
      
      // save user session and redirect to dashboard
      try {
        setCurrentUserId(user.id);
        navigate(`/dashboard`);
      } catch (err) {
        // fallback: set directly to localStorage
        localStorage.setItem('audit_app_current_user', String(user.id));
        navigate(`/dashboard`);
      }
    }, 1500);
  };

  // If a user session already exists, redirect to dashboard
  useEffect(() => {
    if (!isInitialized) return;
    const currentId = getCurrentUserId();
    if (currentId) {
      navigate(`/dashboard`);
    }
  }, [isInitialized, getCurrentUserId, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50/30 safe-area-inset-bottom safe-area-inset-top overflow-hidden">
      {/* Background decorative elements - fixed positioning */}
      <div className="fixed top-0 left-0 w-72 h-72 bg-blue-200/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl -z-10"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-indigo-200/20 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl -z-10"></div>

      {/* Main content container - no scrolling */}
      <div className="h-screen flex flex-col items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                {/* Logo Container - Using your logo image */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/25 overflow-hidden">
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt="Audit Assistant" 
                      className="w-24 h-24 object-contain rounded-xl"
                    />
                  ) : (
                    // Fallback if logo not available
                    <div className="text-white font-bold text-lg">AA</div>
                  )}
                </div>
                {/* Voice Auth Badge */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <Mic className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent mb-2">
              Audit Assistant
            </h1>
            <p className="text-gray-600 text-lg">Voice-powered data collection</p>
          </div>

          {/* Login Form */}
          <Card className="rounded-3xl border-0 shadow-xl shadow-blue-500/5 bg-white/80 backdrop-blur-sm mx-0">
            <CardContent className="p-6">
              <form onSubmit={handleLogin} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="auditor@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="rounded-xl h-14 pl-12 text-base border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all w-full"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="rounded-xl h-14 pl-12 pr-12 text-base border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all w-full"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <Shield className="w-5 h-5" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-gray-600">Remember me</span>
                  </label>
                  <button type="button" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    Forgot password?
                  </button>
                </div>

                {/* Login Button */}
                <Button 
                  type="submit" 
                  className="w-full h-14 rounded-xl text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all transform hover:scale-[1.02]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </div>
                  ) : (
                    "Sign In to Dashboard"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8 px-2">
            <p className="text-xs text-gray-500">
              By continuing, you agree to our{" "}
              <button type="button" className="text-blue-600 hover:text-blue-700 font-medium">Terms</button>
              {" "}and{" "}
              <button type="button" className="text-blue-600 hover:text-blue-700 font-medium">Privacy Policy</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  User,
  Mail,
  MapPin,
  BarChart3,
  Clock,
  ChevronLeft,
  LogOut,
  Edit3,
  AlertCircle,
  Calendar,
  Award,
  Target,
  Shield,
  Phone,
  Building,
  Star,
  CheckCircle2
} from "lucide-react";
import { useEffect, useState } from "react";

const fallbackUser = {
  id: 1,
  username: "gokul",
  password: "123",
  name: "Gokul Nath",
  email: "gokulnath30@gmail.com",
  region: "North Region",
  employeeId: "AUD001",
  no_of_audits: 25,
  completed_audits: 20,
  avg_audit_time: "45 mins",
  role: "Senior Field Auditor",
  joinDate: "2023-01-15",
  performance: 94,
  contact: "+1 (555) 123-4567",
  department: "Retail Audit Division"
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    try {
      const raw =
        localStorage.getItem("currentUser") ||
        localStorage.getItem("audit_app_current_user") ||
        JSON.stringify(fallbackUser);
      const parsed = JSON.parse(raw as string);
      setUser(parsed || fallbackUser);
    } catch {
      setUser(fallbackUser);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("audit_app_current_user");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 border-0 shadow-xl rounded-3xl">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">User not found</h2>
            <p className="text-gray-600 mb-6">Please log in again to continue</p>
            <Button 
              onClick={() => navigate("/")}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8"
            >
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = (user.name || user.username || "U")
    .split(" ")
    .map((s: string) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const stats = [
    {
      icon: Target,
      label: "Total Audits",
      value: user.no_of_audits ?? 0,
      color: "blue"
    },
    {
      icon: CheckCircle2,
      label: "Completed",
      value: user.completed_audits ?? 0,
      color: "green"
    },
    {
      icon: Clock,
      label: "Avg. Time",
      value: user.avg_audit_time,
      color: "purple"
    },
    {
      icon: Award,
      label: "Performance",
      value: `${user.performance ?? 94}%`,
      color: "orange"
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      purple: "bg-purple-500",
      orange: "bg-orange-500"
    };
    return colors[color as keyof typeof colors] || "bg-blue-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 pb-8">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-b-3xl shadow-lg">
        <div className="p-6 pt-safe max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/dashboard")} 
              className="rounded-xl bg-white/20 hover:bg-white/30 text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">Profile</h1>
              <p className="text-blue-100 mt-1">Your account details & performance metrics</p>
            </div>
            <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
              {user.role || "Field Auditor"}
            </Badge>
          </div>

          {/* Profile Header Card */}
          <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm">
            <CardContent className="p-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-2xl font-bold">
                      {initials}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{user.name || user.username}</h2>
                    <p className="text-blue-100 mt-1">{user.employeeId} • {user.department}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex items-center gap-1 text-yellow-300">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                      <span className="text-blue-100 text-sm">4.8 Rating</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm rounded-xl"
                    onClick={() => navigate("/profile/edit")}
                  >
                    <Edit3 className="w-4 h-4 mr-2" /> Edit Profile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-red-500/20 hover:bg-red-500/30 text-white border-red-300/30 rounded-xl"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-6xl mx-auto -mt-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-lg rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${getColorClasses(stat.color)}/10 rounded-xl flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${getColorClasses(stat.color)}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-gray-900 font-medium">{user.name || user.username}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">Username</label>
                    <p className="text-gray-900 font-medium">{user.username}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">Email Address</label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900 font-medium">{user.email}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900 font-medium">{user.contact || "+1 (555) 123-4567"}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">Region</label>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900 font-medium">{user.region}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">Join Date</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900 font-medium">{user.joinDate || "2023-01-15"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professional Details */}
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Building className="w-5 h-5 text-green-600" />
                  Professional Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">Employee ID</label>
                    <p className="text-gray-900 font-medium font-mono">{user.employeeId}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">Role</label>
                    <p className="text-gray-900 font-medium">{user.role || "Field Auditor"}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">Department</label>
                    <p className="text-gray-900 font-medium">{user.department || "Retail Audit Division"}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <Badge className="bg-green-100 text-green-800 border-0">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Active
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Achievements */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-gray-200 rounded-xl py-3"
                    onClick={() => navigate("/dashboard")}
                  >
                    <BarChart3 className="w-4 h-4 mr-3 text-blue-600" />
                    View Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-gray-200 rounded-xl py-3"
                    onClick={() => navigate("/audits")}
                  >
                    <Target className="w-4 h-4 mr-3 text-green-600" />
                    My Audits
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-gray-200 rounded-xl py-3"
                    onClick={() => navigate("/settings")}
                  >
                    <Shield className="w-4 h-4 mr-3 text-purple-600" />
                    Privacy Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Achievement */}
            <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50/50">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-orange-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Top Performer</h4>
                  <p className="text-sm text-gray-600 mb-4">You're in the top 10% of auditors this month</p>
                  <Badge className="bg-orange-100 text-orange-800 border-0">
                    🏆 Excellence Award
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
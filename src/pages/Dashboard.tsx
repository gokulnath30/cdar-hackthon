import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, TrendingUp, Mic, ChevronRight, Store, Navigation } from "lucide-react";
import { useLocalStorageDB } from "@/lib/useLocalStorageDB";

const Dashboard = () => {
  const navigate = useNavigate();
  const { getStoresByUserId, getUserById, getCurrentUserId } = useLocalStorageDB();
  const userid = getCurrentUserId();

  const todayAudits = getStoresByUserId(userid ?? 0);
  
  const currentUser = {
    ...getUserById(userid ?? 0),
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "verified": return "bg-green-100 text-green-800 border-green-200";
      case "in progress": return "bg-blue-100 text-blue-800 border-blue-200";
      case "missing items": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const navigateToStore = (storeId: number) => {
    localStorage.setItem('current_store', String(storeId));
    navigate(`/store`);
  }

  return (
    <div className="min-h-screen bg-gray-50/30 pb-28">
      {/* Enhanced Header with Gradient */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 pt-safe text-white rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">Good Morning!</h1>
            <p className="text-blue-100 text-sm">Ready to start your audits today?</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-semibold border border-white/30">
            {currentUser?.name}
          </div>
        </div>

        {/* Stats Cards - Improved Layout */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-3 text-center">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Store className="w-4 h-4 text-white" />
              </div>
              <p className="text-xl font-bold text-white">{currentUser.no_of_audits}</p>
              <p className="text-xs text-blue-100">Today's Audits</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-3 text-center">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <p className="text-xl font-bold text-white">{currentUser.completed_audits}</p>
              <p className="text-xs text-blue-100">Completed</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-3 text-center">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <p className="text-xl font-bold text-white">{currentUser.avg_audit_time}</p>
              <p className="text-xs text-blue-100">Avg. Time</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5 -mt-2">
        {/* Header with Action */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Today's Schedule</h2>
            <p className="text-sm text-gray-500 mt-1">{todayAudits.length} audits scheduled for today</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate("/stores")}
            className="rounded-full border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            View All
          </Button>
        </div>

        {/* Audit Cards */}
        <div className="space-y-4">
          {todayAudits.map((audit) => (
            <Card
              key={audit.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-300 rounded-2xl border border-gray-200/80 overflow-hidden"
              onClick={() => navigateToStore(audit.id)}
            >
              <CardContent className="p-0">
                {/* Priority Indicator */}
                <div className={`h-1 w-full ${getPriorityColor(audit.priority)}`} />
                
                <div className="p-5">
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(audit.priority)}`} />
                        <h3 className="font-bold text-gray-900 text-lg">{audit.storeName}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{audit.address}</span>
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          {audit.shopType}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-xs font-mono">
                        #{audit.indexCode}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold text-gray-900">{audit.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-2.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${audit.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                    <div>
                      <div className="text-xs text-gray-500 font-medium">Sequence</div>
                      <div className="font-semibold text-gray-900">#{audit.seq}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium">Frequency</div>
                      <div className="font-semibold text-gray-900">{audit.freq}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium">Activity</div>
                      <div className="font-semibold text-gray-900">{audit.activity}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium">Mode</div>
                      <div className="font-semibold text-gray-900 flex items-center gap-1">
                        {audit.mode === "Voice" ? (
                          <Mic className="w-3 h-3" />
                        ) : (
                          <Navigation className="w-3 h-3" />
                        )}
                        {audit.mode}
                      </div>
                    </div>
                  </div>

                  {/* Footer with Status and Action */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-gray-500">Last visit:</div>
                      <div className="text-sm font-medium text-gray-900">{audit.lastVisited}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`text-xs border ${getStatusColor(audit.currentStatus)}`}>
                        {audit.currentStatus}
                      </Badge>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
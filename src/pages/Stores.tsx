import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Mic, 
  ChevronLeft, 
  Navigation,
  Phone,
  Mail,
  User,
  AlertCircle,
  PlayCircle,
  BarChart3,
  FileText,
  Settings
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocalStorageDB } from "@/lib/useLocalStorageDB";
import { Store } from "@/lib/database";

const StorePage = () => {
  const navigate = useNavigate();
  const { getStores } = useLocalStorageDB();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      const all = await getStores();
      setStores(all || []);
      setLoading(false);
    };
    
    fetchStores();
  }, [getStores]);
  
  const getStatusColor = (status: string) => {
    if (!status) return "bg-gray-100 text-gray-800 border-gray-200";
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

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high": return "High Priority";
      case "medium": return "Medium Priority";
      case "low": return "Low Priority";
      default: return "Standard Priority";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading stores...</p>
        </div>
      </div>
    );
  }

  if (!stores || stores.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Stores Found</h2>
          <p className="text-gray-600 mb-4">There are no stores to display.</p>
          <Button onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 pb-8">
      <div className="p-6 pt-safe">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="rounded-xl"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Stores</h1>
              <p className="text-gray-600 mt-1">All available stores</p>
            </div>
          </div>
          <div>
            <Badge className="text-sm border-0 bg-blue-100 text-blue-800">
              {stores.length} stores
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <Card key={store.id} className="rounded-2xl border border-gray-200/80 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">{store.storeName}</h2>
                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                          <MapPin className="w-4 h-4" />
                          {store.address}
                        </p>
                      </div>
                      <Badge className={`text-sm border-0 ${getPriorityColor(store.priority)} text-white`}>
                        {getPriorityText(store.priority)}
                      </Badge>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold text-gray-900">{store.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                          style={{ width: `${store.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>{store.assignedUserName}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>{store.seq}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-semibold"
                    onClick={() => {/* Start audit for store.id */}}
                  >
                    <PlayCircle className="w-4 h-4 mr-2 inline" /> Start
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-300 py-2 rounded-xl font-semibold"
                    onClick={() => {/* Edit store store.id */}}
                  >
                    <Settings className="w-4 h-4 mr-2 inline" /> Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StorePage;
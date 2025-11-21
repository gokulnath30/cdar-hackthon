import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  ChevronLeft,
  ShoppingBag,
  Tag,
  Box,
  Barcode,
  Calendar,
  AlertCircle,
  PlayCircle,
  Settings,
  DollarSign,
  Layers
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocalStorageDB } from "../lib/useLocalStorageDB";

const ProductsPage = () => {
  const navigate = useNavigate();
  const { getProducts } = useLocalStorageDB();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const all = await getProducts();
      setProducts(all || []);
      setLoading(false);
    };
    fetch();
  }, [getProducts]);

  const getStatusColor = (status: string | undefined) => {
    if (!status) return "bg-gray-100 text-gray-800 border-gray-200";
    switch (status.toLowerCase()) {
      case "pending": return "bg-amber-100 text-amber-800 border-amber-200";
      case "verified": return "bg-green-100 text-green-800 border-green-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Products Found</h2>
          <p className="text-gray-600 mb-4">There are no products to display.</p>
          <Button onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 pb-8">
      <div className="p-6 pt-safe">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-xl">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Products</h1>
              <p className="text-gray-600 mt-1">All product reports</p>
            </div>
          </div>
          <div>
            <Badge className="text-sm border-0 bg-blue-100 text-blue-800">
              {products.length} products
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <Card key={p.id} className="rounded-2xl border border-gray-200/80 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">{p.name}</h2>
                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                          <Tag className="w-4 h-4" />
                          {Array.isArray(p.categories) ? p.categories.join(", ") : p.category}
                        </p>
                      </div>
                      <Badge className={`text-sm border-0 ${getStatusColor(p.status)}`}>
                        {p.status ?? "unknown"}
                      </Badge>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-gray-400" /> <span className="font-medium">Brand:</span> <span>{p.brand || p.brands}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-gray-400" /> <span className="font-medium">Manufacturer:</span> <span>{p.manufacturer || p.manufacturers}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Barcode className="w-4 h-4 text-gray-400" /> <span className="font-medium">SKU:</span> <span>{p.sku}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" /> <span className="font-medium">MRP:</span> <span>₹{p.mrp ?? 0}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>{p.lastUpdated}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm">
                          Stock: <span className="font-semibold">{(p.self_Stock ?? 0) + (p.other_Stock ?? 0)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-semibold"
                    onClick={() => {/* view product report */}}
                  >
                    <PlayCircle className="w-4 h-4 mr-2 inline" /> View
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-300 py-2 rounded-xl font-semibold"
                    onClick={() => {/* Edit product */}}
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

export default ProductsPage;
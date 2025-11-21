import { useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  Package,
  Barcode as BarcodeIcon,
  Tag,
  Factory,
  Plus,
  X,
  Search,
  Filter,
  MoreVertical,
} from "lucide-react";
import { useLocalStorageDB } from "@/lib/useLocalStorageDB";

const StoreDetails = () => {
  const { storeId } = parseInt(localStorage.getItem('current_store') || "1") ? { storeId: localStorage.getItem('current_store') } : useParams();
  const navigate = useNavigate();
  const { getStoreById } = useLocalStorageDB();
  const { getProductsByStoreId } = useLocalStorageDB();
  
  const store = getStoreById(parseInt(storeId || "0"));

  // Product collection UI state & mock products
  const tabs = ["Barcode", "Classic", "Brand"];
  const [activeTab, setActiveTab] = useState<string>(tabs[0]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [brand, setBrand] = useState("");
  const [advanced, setAdvanced] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const categories = ["All", "Baby Care", "Health", "Food", "Beverages", "Personal Care"];
  const manufacturers = ["All", "CDBox", "Global Pharma", "Nestle", "Unilever"];
  const brands = ["All", "VITAMIN", "POWER", "Nestle", "Dove"];
  const advancedOptions = ["All", "Expiring soon", "Low stock", "High priority"];

  const products = getProductsByStoreId(parseInt(storeId || "0"));

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (category && category !== "All" && p.category !== category) return false;
      if (manufacturer && manufacturer !== "All" && p.manufacturer !== manufacturer) return false;
      if (brand && brand !== "All" && p.brand !== brand) return false;
      if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (advanced && advanced !== "All") {
        if (advanced === "Low stock" && p.containers > 5) return false;
      }
      return true;
    });
  }, [products, category, manufacturer, brand, query, advanced]);

  const clearFilters = () => {
    setQuery("");
    setCategory("");
    setManufacturer("");
    setBrand("");
    setAdvanced("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "in-progress": return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const navigateToProduct = (productId: number) => {
    localStorage.setItem('current_product', String(productId));
    navigate(`/product`);
  };

  return (
    <div className="min-h-screen bg-gray-50/30 pb-24">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-white hover:bg-white/20 rounded-xl"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold truncate">{store?.storeName}</h1>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-xl">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>

      </div>

      {/* Main Content */}
      <div className="space-y-5">
        {/* Store Information Card */}
        

        {/* Products Section */}
        <Card className="rounded-2xl border border-gray-200/80 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-gray-900">Product Audit</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                  {filteredProducts.length} items
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab 
                      ? "bg-white text-blue-700 shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="flex items-center flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 gap-3">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products..."
                  className="bg-transparent outline-none text-sm w-full placeholder-gray-400"
                />
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setShowFilters(!showFilters)}
                className={`rounded-xl border-gray-200 ${showFilters ? 'bg-blue-50 border-blue-200' : ''}`}
              >
                <Filter className="w-4 h-4" />
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="rounded-lg p-3 text-sm bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.filter(c => c !== "All").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <select
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className="rounded-lg p-3 text-sm bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">All Manufacturers</option>
                    {manufacturers.filter(m => m !== "All").map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="rounded-lg p-3 text-sm bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">All Brands</option>
                    {brands.filter(b => b !== "All").map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <select
                    value={advanced}
                    onChange={(e) => setAdvanced(e.target.value)}
                    className="rounded-lg p-3 text-sm bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    {advancedOptions.filter(a => a !== "All").map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="flex-1 border-gray-200 text-gray-600"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add New Item
              </Button>
              <Button variant="outline" className="rounded-xl border-gray-200">
                <BarcodeIcon className="w-4 h-4 mr-2" />
                Scan
              </Button>
            </div>

            {/* Product List */}
            <div className="space-y-3">
              {filteredProducts.map((product) => (
                <Card 
                  key={product.id} 
                  className="rounded-xl border border-gray-200/80 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigateToProduct(product.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Product Icon */}
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-blue-600" />
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight pr-2">
                            {product.name}
                          </h3>
                          <Badge className={`text-xs border ${getStatusColor(product.status)}`}>
                            {product.status.replace('-', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {product.brand}
                          </span>
                          <span className="flex items-center gap-1">
                            <Factory className="w-3 h-3" />
                            {product.manufacturer}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            SKU: {product.sku} • {product.containers} containers
                          </div>
                          <div className="text-xs text-gray-400">
                            {product.lastUpdated}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredProducts.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No products found</p>
                  <p className="text-gray-400 text-xs mt-1">Try adjusting your filters</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    
    </div>
  );
};

export default StoreDetails;
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Mic, Save, Package, RotateCcw, Calculator } from "lucide-react";
import { toast } from "sonner";
import { useLocalStorageDB } from "@/lib/useLocalStorageDB";

const ProductCollection = () => {
  const navigate = useNavigate();
  const { storeId } = localStorage.getItem('current_product') ? { storeId: localStorage.getItem('current_product') } : { storeId: "0" };
  const [isListening, setIsListening] = useState(false);
  const Product = useLocalStorageDB();
  const updateProduct = Product.updateProduct;

  const currentProduct = Product.getProductsByStoreId(parseInt(storeId || "0"));
  const products = currentProduct;
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);

  const [formData, setFormData] = useState({
    selfStock: "",
    retailPrice: "",
    otherStock: "",
    directPurchase: "",
    indirectPurchase: "",
  });

  // Load current product data only once when product index changes
  useEffect(() => {
    if (products.length > 0 && products[currentProductIndex] && !hasLoadedInitialData) {
      const product = products[currentProductIndex];
      setFormData({
        selfStock: product.self_Stock?.toString() || "",
        retailPrice: product.retaile_selling_price?.toString() || "",
        otherStock: product.other_Stock?.toString() || "",
        directPurchase: product.direct_price?.toString() || "",
        indirectPurchase: product.indirect_price?.toString() || "",
      });
      setHasLoadedInitialData(true);
    }
  }, [currentProductIndex, products, hasLoadedInitialData]);

  // Reset the loaded flag when moving to next product
  useEffect(() => {
    setHasLoadedInitialData(false);
  }, [currentProductIndex]);

  // Calculate derived values
  const tlStock = (parseInt(formData.selfStock) || 0) + (parseInt(formData.otherStock) || 0);
  const tlPurchase = (parseInt(formData.directPurchase) || 0) + (parseInt(formData.indirectPurchase) || 0);

  const handleVoiceToggle = () => {
    setIsListening(!isListening);
    toast.info(isListening ? "Voice input stopped" : "🎤 Listening for voice commands...");
  };

  const handleSave = () => {
    // Validate required fields
    if (!formData.selfStock) {
      toast.error("Please enter Self Stock value");
      return;
    }

    updateProduct(currentProduct[currentProductIndex].id, {
      self_Stock: parseInt(formData.selfStock) || 0,
      retaile_selling_price: parseFloat(formData.retailPrice) || 0,
      other_Stock: parseInt(formData.otherStock) || 0,
      direct_price: parseInt(formData.directPurchase) || 0,
      indirect_price: parseInt(formData.indirectPurchase) || 0
    });

    if (currentProductIndex < products.length - 1) {
      setCurrentProductIndex(currentProductIndex + 1);
    } else {
      toast.success("🎉 All products completed!");
      navigate(`/store`);
    }
  };

  const resetForm = () => {
    setFormData({
      selfStock: "",
      retailPrice: "",
      otherStock: "",
      directPurchase: "",
      indirectPurchase: "",
    });
    toast.info("All fields cleared");
  };

  const handleClearAll = () => {
    resetForm();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-gray-50/30 pb-28">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-3 p-6 pb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(`/store`)}
            className="text-white hover:bg-white/20 rounded-xl"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Data Collection</h1>
            <p className="text-sm text-blue-100 mt-1">
              Product {currentProductIndex + 1} of {products.length}
              {products[currentProductIndex]?.name && ` - ${products[currentProductIndex].name}`}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Voice Indicator */}
      {isListening && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 text-center animate-pulse shadow-lg">
          <div className="flex items-center justify-center gap-2">
            <Mic className="w-5 h-5 animate-bounce" />
            <span className="font-medium">Listening for voice commands...</span>
          </div>
          <p className="text-sm text-green-100 mt-1">Say commands like "Set self stock to 50"</p>
        </div>
      )}

      <div className="p-5 space-y-5">
        {/* Voice Commands Help */}
        <Card className="rounded-2xl border border-purple-100 bg-purple-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Mic className="w-4 h-4 text-purple-600" />
              <p className="text-sm font-medium text-purple-900">Voice Commands</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-purple-700">
              <div className="bg-white/50 rounded-lg p-2">"Self stock 50"</div>
              <div className="bg-white/50 rounded-lg p-2">"Price 299"</div>
              <div className="bg-white/50 rounded-lg p-2">"Other stock 25"</div>
              <div className="bg-white/50 rounded-lg p-2">"Save and next"</div>
            </div>
          </CardContent>
        </Card>

        {/* Data Entry Form */}
        <Card className="rounded-2xl border border-gray-200 shadow-sm">
          <CardContent className="p-5 space-y-5">
            {/* Stock Information */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                Stock Information
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="selfStock" className="text-sm font-medium text-gray-700">
                    Self Stock (SS)
                  </Label>
                  <Input
                    id="selfStock"
                    type="number"
                    placeholder="0"
                    value={formData.selfStock}
                    onChange={(e) => handleInputChange("selfStock", e.target.value)}
                    className="rounded-xl text-center text-lg font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otherStock" className="text-sm font-medium text-gray-700">
                    Other Stock (OS)
                  </Label>
                  <Input
                    id="otherStock"
                    type="number"
                    placeholder="0"
                    value={formData.otherStock}
                    onChange={(e) => handleInputChange("otherStock", e.target.value)}
                    className="rounded-xl text-center text-lg font-semibold"
                  />
                </div>
              </div>

              {/* Calculated Values */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="text-center">
                  <div className="text-xs text-blue-600 font-medium mb-1">Total Stock (TL Stock)</div>
                  <div className="text-2xl font-bold text-blue-700">{tlStock}</div>
                  <div className="text-xs text-blue-500 mt-1">SS + OS</div>
                </div>
              </div>
            </div>

            {/* Price Information */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 text-lg">Price Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="retailPrice" className="text-sm font-medium text-gray-700">
                  Retail Selling Price (RSP)
                </Label>
                <Input
                  id="retailPrice"
                  type="number"
                  placeholder="0.00"
                  value={formData.retailPrice}
                  onChange={(e) => handleInputChange("retailPrice", e.target.value)}
                  className="rounded-xl text-lg font-semibold"
                />
              </div>
            </div>

            {/* Purchase Information */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 text-lg">Purchase Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="directPurchase" className="text-sm font-medium text-gray-600">
                    Direct Purchase
                  </Label>
                  <Input
                    id="directPurchase"
                    type="number"
                    placeholder="0"
                    value={formData.directPurchase}
                    onChange={(e) => handleInputChange("directPurchase", e.target.value)}
                    className="rounded-xl text-center text-lg font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="indirectPurchase" className="text-sm font-medium text-gray-600">
                    Indirect Purchase
                  </Label>
                  <Input
                    id="indirectPurchase"
                    type="number"
                    placeholder="0"
                    value={formData.indirectPurchase}
                    onChange={(e) => handleInputChange("indirectPurchase", e.target.value)}
                    className="rounded-xl text-center text-lg font-semibold"
                  />
                </div>
              </div>

              {/* Calculated Values */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="text-center">
                  <div className="text-xs text-green-600 font-medium mb-1">Total Purchase (TL PUR)</div>
                  <div className="text-2xl font-bold text-green-700">{tlPurchase}</div>
                  <div className="text-xs text-green-500 mt-1">DP + IP</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1 rounded-xl border-gray-300"
            onClick={handleClearAll}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear All
          </Button>
          <Button
            className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700"
            onClick={handleSave}
            size="lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {currentProductIndex === products.length - 1 ? "Finish" : "Save & Next"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCollection;
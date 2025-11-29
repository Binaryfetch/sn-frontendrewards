import React, { useState, useEffect } from "react";
import { getAllProductsAdmin, createProduct, updateProduct, deleteProduct, bulkCreateProducts, parseExcelFile } from "../api/api";

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await getAllProductsAdmin();
      setProducts(response.data.products);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const handleCreateProduct = async (productData) => {
    setLoading(true);
    try {
      await createProduct(productData);
      setShowForm(false);
      loadProducts();
    } catch (error) {
      console.error("Error creating product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (id, productData) => {
    setLoading(true);
    try {
      await updateProduct(id, productData);
      setEditingProduct(null);
      loadProducts();
    } catch (error) {
      console.error("Error updating product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        loadProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const filteredProducts = products.filter(product => 
    activeTab === 'active' ? product.status === 'Active' : product.status === 'Inactive'
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Management</h1>
            <p className="text-gray-600 text-lg">Manage your product catalog</p>
          </div>
          <div className="flex gap-3">
            {/* <button
              onClick={() => setShowBulkForm(true)}
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
            >
              <span className="mr-2">📊</span>
              Add Bulk Product
            </button> */}
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 transform hover:scale-105"
            >
              <span className="mr-2">+</span>
              Add Product
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-8">
            <button
              onClick={() => setActiveTab('active')}
              className={`py-6 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
                activeTab === 'active'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">✅</span>
                <span>Active Products ({products.filter(p => p.status === 'Active').length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('inactive')}
              className={`py-6 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
                activeTab === 'inactive'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">❌</span>
                <span>Inactive Products ({products.filter(p => p.status === 'Inactive').length})</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-8">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No {activeTab} products</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first product</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700"
              >
                + Add Product
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map(product => {
                  const rewardsPerPiece = product.rewardsPerPc ?? product.pointsPerUnit ?? 0;
                  const rewardsPerDozen = product.rewardsPerDozen ?? rewardsPerPiece * 12;
                  const rewardsForBox = product.rewardsForBox ?? rewardsPerPiece * (product.boxQuantity || 0);
                  const rewardsForCarton = product.rewardsForCarton ?? rewardsPerPiece * (product.cartonQuantity || 0);

                  return (
                    <div key={product._id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          {product.imageURL ? (
                            <img
                              src={product.imageURL}
                              alt={product.itemDescription || product.itemNo}
                              className="h-12 w-12 rounded-xl object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                              <span className="text-white font-bold text-lg">
                                {(product.itemDescription || product.itemNo || "?").charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              {product.itemDescription || product.name}
                            </h3>
                            <p className="text-sm text-gray-600">{product.itemNo}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <span className="text-primary-500">⭐</span>
                              <span>
                              {rewardsPerPiece.toLocaleString()} pts / piece
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-green-500">🧩</span>
                            <span>BOM Type: {product.bomType || "Not a BOM"}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                            <div className="flex items-center space-x-2">
                              <span className="text-blue-500">📦</span>
                              <span>Box Qty: {product.boxQuantity || 0}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-purple-500">🗃️</span>
                              <span>Carton Qty: {product.cartonQuantity || 0}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs sm:text-sm">
                            <div>
                              <p className="text-gray-500">Rewards / Dozen</p>
                              <p className="font-semibold text-primary-700">
                                {rewardsPerDozen.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Rewards / Box</p>
                              <p className="font-semibold text-primary-700">
                                {rewardsForBox.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Rewards / Carton</p>
                              <p className="font-semibold text-primary-700">
                                {rewardsForCarton.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {product.imageURL && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <span className="text-primary-500">🖼️</span>
                              <span>Image available</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        product.status === 'Active' 
                          ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800'
                          : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800'
                      }`}>
                        {product.status === 'Active' ? '✅ Active' : '❌ Inactive'}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="px-3 py-1 text-xs font-medium text-primary-600 hover:text-primary-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Item No</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Box Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Carton Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Rewards / Pc</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Rewards / Dozen</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Rewards / Box</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Rewards / Carton</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-sm text-gray-700">
                    {filteredProducts.map(product => {
                      const rewardsPerPiece = product.rewardsPerPc ?? product.pointsPerUnit ?? 0;
                      const rewardsPerDozen = product.rewardsPerDozen ?? rewardsPerPiece * 12;
                      const rewardsForBox = product.rewardsForBox ?? rewardsPerPiece * (product.boxQuantity || 0);
                      const rewardsForCarton = product.rewardsForCarton ?? rewardsPerPiece * (product.cartonQuantity || 0);

                      return (
                        <tr key={`table-${product._id}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{product.itemNo}</td>
                          <td className="px-4 py-3">{product.itemDescription || product.name}</td>
                          <td className="px-4 py-3 text-right">{(product.boxQuantity || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">{(product.cartonQuantity || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            {rewardsPerPiece.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right">{rewardsPerDozen.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">{rewardsForBox.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">{rewardsForCarton.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Form Modal */}
      {(showForm || editingProduct) && (
        <ProductForm
          product={editingProduct}
          onSubmit={editingProduct ? 
            (data) => handleUpdateProduct(editingProduct._id, data) : 
            handleCreateProduct
          }
          onCancel={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
          loading={loading}
        />
      )}

      {/* Bulk Product Upload Modal */}
      {showBulkForm && (
        <BulkProductUpload
          onSubmit={handleCreateProduct}
          onCancel={() => {
            setShowBulkForm(false);
          }}
          onSuccess={() => {
            setShowBulkForm(false);
            loadProducts();
          }}
        />
      )}
    </div>
  );
}

function ProductForm({ product, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    itemNo: "",
    itemDescription: "",
    bomType: "Not a BOM",
    boxQuantity: "",
    cartonQuantity: "",
    rewardsPerPc: "",
    status: "Active"
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (product) {
      const perPieceValue =
        product.rewardsPerPc ??
        product.pointsPerUnit ??
        "";

      setFormData({
        itemNo: product.itemNo || "",
        itemDescription: product.itemDescription || product.name || "",
        bomType: product.bomType || "Not a BOM",
        boxQuantity: product.boxQuantity?.toString() || "",
        cartonQuantity: product.cartonQuantity?.toString() || "",
        rewardsPerPc:
          perPieceValue === "" ? "" : perPieceValue.toString(),
        status: product.status || "Active"
      });
      if (product.imageURL) {
        setImagePreview(product.imageURL);
      }
      setImageFile(null);
    } else {
      setFormData({
        itemNo: "",
        itemDescription: "",
        bomType: "Not a BOM",
        boxQuantity: "",
        cartonQuantity: "",
        rewardsPerPc: "",
        status: "Active"
      });
      setImagePreview(null);
      setImageFile(null);
    }
  }, [product]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Image size must be less than 10MB");
        e.target.value = "";
        return;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp"
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("Invalid file type. Please select an image file (JPG, PNG, GIF, WebP).");
        e.target.value = "";
        return;
      }

      setImageFile(file);

      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append("itemNo", formData.itemNo);
    formDataToSend.append("itemDescription", formData.itemDescription);
    formDataToSend.append("bomType", formData.bomType || "Not a BOM");
    formDataToSend.append("boxQuantity", formData.boxQuantity || 0);
    formDataToSend.append("cartonQuantity", formData.cartonQuantity || 0);
    formDataToSend.append("rewardsPerPc", formData.rewardsPerPc || 0);
    formDataToSend.append("status", formData.status);

    if (imageFile) {
      formDataToSend.append("image", imageFile);
    }

    onSubmit(formDataToSend);
  };

  const numericBox = Number(formData.boxQuantity) || 0;
  const numericCarton = Number(formData.cartonQuantity) || 0;
  const numericRewardsPerPc = Number(formData.rewardsPerPc) || 0;

  const rewardsPerDozen = numericRewardsPerPc * 12;
  const rewardsForBox = numericBox * numericRewardsPerPc;
  const rewardsForCarton = numericCarton * numericRewardsPerPc;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-2xl bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {product ? "Edit Product" : "Create New Product"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Item Number *
                </label>
                <input
                  type="text"
                  name="itemNo"
                  value={formData.itemNo}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  BOM Type
                </label>
                <input
                  type="text"
                  name="bomType"
                  value={formData.bomType}
                  onChange={handleChange}
                  placeholder="e.g., Not a BOM"
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Item Description *
              </label>
              <textarea
                name="itemDescription"
                value={formData.itemDescription}
                onChange={handleChange}
                required
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Box Quantity *
                </label>
                <input
                  type="number"
                  name="boxQuantity"
                  value={formData.boxQuantity}
                  onChange={handleChange}
                  required
                  min="0"
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Carton Quantity
                </label>
                <input
                  type="number"
                  name="cartonQuantity"
                  value={formData.cartonQuantity}
                  onChange={handleChange}
                  min="0"
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Rewards per Piece *
                </label>
                <input
                  type="number"
                  name="rewardsPerPc"
                  value={formData.rewardsPerPc}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">
                  Rewards per Dozen
                </label>
                <input
                  type="text"
                  value={rewardsPerDozen.toLocaleString()}
                  readOnly
                  className="mt-1 block w-full border-transparent bg-transparent text-lg font-semibold text-primary-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">
                  Total Rewards for Box
                </label>
                <input
                  type="text"
                  value={rewardsForBox.toLocaleString()}
                  readOnly
                  className="mt-1 block w-full border-transparent bg-transparent text-lg font-semibold text-primary-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">
                  Total Rewards for Carton
                </label>
                <input
                  type="text"
                  value={rewardsForCarton.toLocaleString()}
                  readOnly
                  className="mt-1 block w-full border-transparent bg-transparent text-lg font-semibold text-primary-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPG, PNG, GIF, WebP. Max size: 10MB
              </p>

              {imagePreview && (
                <div className="mt-3">
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="w-full h-40 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : product ? "Update Product" : "Create Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function BulkProductUpload({ onCancel, onSuccess }) {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('upload'); // 'upload' or 'preview'
  const [imageErrors, setImageErrors] = useState(new Set()); // Track image load errors

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

    if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(fileExtension)) {
      setError('Please upload a valid Excel file (.xlsx, .xls, or .csv)');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setLoading(true);

    try {
      // Send file to backend for parsing (this will extract embedded images)
      const response = await parseExcelFile(selectedFile);
      const { products } = response.data;

      if (!products || products.length === 0) {
        setError('No valid products found in the file');
        setLoading(false);
        return;
      }

      // Validate products
      const validatedData = [];
      for (let i = 0; i < products.length; i++) {
        const product = products[i];

        // Validate required fields
        if (!product.name || !product.uom || product.pointsPerUnit === undefined || product.pointsPerUnit === null) {
          setError(`Row ${i + 2}: Missing required fields (name, uom, pointsPerUnit)`);
          setLoading(false);
          return;
        }

        if (product.status !== 'Active' && product.status !== 'Inactive') {
          product.status = 'Active';
        }

        validatedData.push(product);
      }

      setPreviewData(validatedData);
      setImageErrors(new Set()); // Reset image errors for new preview
      setStep('preview');
    } catch (err) {
      console.error('Error parsing file:', err);
      setError(err.response?.data?.msg || 'Error parsing Excel file. Please ensure the file format is correct.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await bulkCreateProducts(previewData);
      alert(`Successfully added ${previewData.length} product(s)!`);
      onSuccess();
    } catch (err) {
      console.error('Bulk upload error:', err);
      setError(err.response?.data?.msg || 'Error uploading products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData([]);
    setError(null);
    setStep('upload');
    setImageErrors(new Set());
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-2xl bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Bulk Product Upload
          </h3>

          {step === 'upload' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Excel File
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50"
                />
                {loading && (
                  <div className="mt-2 text-sm text-primary-600">Parsing Excel file and extracting images...</div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Please ensure your Excel file has the following columns:
                  <br />
                  <strong>name</strong> (or Name, Product Name), <strong>uom</strong> (or UOM, Unit of Measure), 
                  <strong>pointsPerUnit</strong> (or Points Per Unit, Points), <strong>status</strong> (optional, Active/Inactive)
                  <br />
                  <strong>Images:</strong> You can embed images directly in Excel cells, or include image URLs/base64 in an "image" column.
                  Embedded images will be automatically extracted and matched to rows.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Preview: {previewData.length} product(s) ready to upload
                </p>
                <button
                  onClick={handleReset}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  Upload Different File
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Image
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        UOM
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points/Unit
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.map((product, index) => {
                      // Get image source - could be base64 data URI, Cloudinary URL, or imageURL
                      const imageSrc = (product.imageURL && product.imageURL.trim() !== '') 
                        ? product.imageURL.trim() 
                        : (product.image && product.image.trim() !== '') 
                          ? product.image.trim() 
                          : null;
                      
                      const hasImageError = imageErrors.has(index);
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            {imageSrc && !hasImageError ? (
                              <img
                                src={imageSrc}
                                alt={product.name}
                                className="h-12 w-12 object-cover rounded-lg border border-gray-200"
                                onError={() => {
                                  setImageErrors(prev => new Set(prev).add(index));
                                }}
                              />
                            ) : (
                              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <span className="text-xs text-gray-400">
                                  {imageSrc && hasImageError ? 'Invalid' : 'No image'}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {product.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {product.uom}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {product.pointsPerUnit}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              product.status === 'Active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {product.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? "Uploading..." : `Confirm & Upload ${previewData.length} Product(s)`}
                </button>
              </div>
            </div>
          )}

          {step === 'upload' && (
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

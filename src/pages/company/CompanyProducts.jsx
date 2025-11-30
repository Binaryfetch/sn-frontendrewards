import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getAllProductsAdmin, uploadProducts, createProduct, updateProduct, deleteProduct } from "../../api/api";
import UploadCard from "../../components/ui/UploadCard";
import { formatNumber } from "../../utils/formatters";

const ProductCard = ({ product, onEdit, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(product._id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
      <div className="flex items-center gap-4">
        {product.imageURL ? (
          <img src={product.imageURL} alt={product.itemDescription} className="h-28 w-28 rounded-2xl object-cover" />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-gray-700 text-3xl text-white">📦</div>
        )}
        <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{product.itemNo}</p>
<p className="text-base font-semibold text-gray-900">{product.itemDescription}</p>
<p className="text-sm text-gray-500">
  Box: {product.boxQuantity || 0} • Carton: {product.cartonQuantity || 0}
</p>

        </div>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { key: "rewardsPerPc", label: "Per Piece" },
          { key: "rewardsPerDozen", label: "Per Dozen" },
          { key: "rewardsForBox", label: "Per Box" },
          { key: "rewardsForCarton", label: "Per Carton" }
        ].map((metric) => (
          <div key={metric.key} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{metric.label}</p>
            <p className="text-lg font-semibold text-gray-900">{formatNumber(product[metric.key] || 0)} pts</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(product)}
          className="rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-2xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
};

const EditProductModal = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    itemNo: "",
    itemDescription: "",
    bomType: "Not a BOM",
    boxQuantity: "",
    cartonQuantity: "",
    rewardsPerPc: "",
    image: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        itemNo: product.itemNo || "",
        itemDescription: product.itemDescription || "",
        bomType: product.bomType || "Not a BOM",
        boxQuantity: product.boxQuantity || "",
        cartonQuantity: product.cartonQuantity || "",
        rewardsPerPc: product.rewardsPerPc || "",
        image: null
      });
      setPreviewImage(product.imageURL || null);
    }
  }, [product]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          payload.append(key, value);
        }
      });
      await onSave(payload);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Edit Product</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { name: "itemNo", label: "Item Number", required: true },
              { name: "itemDescription", label: "Description", required: true },
              { name: "bomType", label: "BOM Type", required: true },
              { name: "boxQuantity", label: "Box Quantity", required: true },
              { name: "cartonQuantity", label: "Carton Quantity", required: true },
              { name: "rewardsPerPc", label: "Rewards / Piece", required: true }
            ].map((field) => (
              <label key={field.name} className="text-sm font-medium text-gray-700">
                {field.label}
                <input
                  required={field.required}
                  type="text"
                  value={formData[field.name]}
                  onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2"
                />
              </label>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Product Image</label>
            <div className="mt-2 flex items-center gap-4">
              {previewImage && (
                <img src={previewImage} alt="Preview" className="h-24 w-24 rounded-2xl object-cover border border-gray-200" />
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Upload a new image to replace the current one</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-2xl bg-[#c7a13f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b8912f] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function CompanyProducts() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [uploadResult, setUploadResult] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    itemNo: "",
    itemDescription: "",
    bomType: "Not a BOM",
    boxQuantity: "",
    cartonQuantity: "",
    rewardsPerPc: "",
    image: null
  });
  const [previewImage, setPreviewImage] = useState(null);

  const excelHeaders = [
    "Item No.",
    "Item Description",
    "BOM Type",
    "Box Quantity",
    "Carton Quantity",
    "Rewards Per Pc",
    "Image"
  ];

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await getAllProductsAdmin();
      setProducts(res.data.products || []);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.msg || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleProductUpload = async ({ file }) => {
    try {
      const res = await uploadProducts(file);
      setUploadResult({
        title: "Product upload",
        message: `Success: ${res.data.successCount || 0} • Failed: ${res.data.failedCount || 0}`,
        details: res.data.failed?.slice(0, 3).map((row, idx) => `${idx + 1}. ${row.error}`).join("\n")
      });
      toast.success("Products uploaded");
      loadProducts();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.msg || "Upload failed");
    }
  };

  const handleSingleSubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          payload.append(key, value);
        }
      });
      
      if (editingProduct) {
        await updateProduct(editingProduct._id, payload);
        toast.success("Product updated");
        setEditingProduct(null);
      } else {
        await createProduct(payload);
        toast.success("Product created");
      }
      
      setFormData({ itemNo: "", itemDescription: "", bomType: "Not a BOM", boxQuantity: "", cartonQuantity: "", rewardsPerPc: "", image: null });
      setPreviewImage(null);
      loadProducts();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.msg || `Failed to ${editingProduct ? "update" : "create"} product`);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
  };

  const handleSaveEdit = async (payload) => {
    try {
      await updateProduct(editingProduct._id, payload);
      toast.success("Product updated successfully");
      setEditingProduct(null);
      loadProducts();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.msg || "Failed to update product");
      throw error;
    }
  };

  const handleDelete = async (productId) => {
    try {
      await deleteProduct(productId);
      toast.success("Product deleted successfully");
      loadProducts();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.msg || "Failed to delete product");
    }
  };

  return (
    <div className="space-y-8">
      <p className="text-sm uppercase tracking-[0.4em] text-gray-500">Products</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4">Bulk Upload</p>
          <p className="text-sm text-gray-600 mb-4">Use the product template to sync catalog data and reward metrics.</p>
          <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">Required Excel Headers:</p>
            <div className="flex flex-wrap gap-2">
              {excelHeaders.map((header, idx) => (
                <span key={idx} className="rounded-lg bg-white px-3 py-1 text-xs font-medium text-gray-700 border border-gray-200">
                  {header}
                </span>
              ))}
            </div>
          </div>
          <UploadCard
            title="Bulk upload"
            description="Upload Excel file with product data."
            icon="📦"
            onSubmit={handleProductUpload}
            result={uploadResult}
          />
        </div>
        <form onSubmit={handleSingleSubmit} className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{editingProduct ? "Edit product" : "Single product"}</p>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { name: "itemNo", label: "Item Number" },
              { name: "itemDescription", label: "Description" },
              { name: "bomType", label: "BOM Type" },
              { name: "boxQuantity", label: "Box Quantity" },
              { name: "cartonQuantity", label: "Carton Quantity" },
              { name: "rewardsPerPc", label: "Rewards / Piece" }
            ].map((field) => (
              <label key={field.name} className="text-sm font-medium text-gray-700">
                {field.label}
                <input
                  required
                  type="text"
                  value={formData[field.name]}
                  onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2"
                />
              </label>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Product Image</label>
            <div className="mt-2 flex items-center gap-4">
              {previewImage && (
                <img src={previewImage} alt="Preview" className="h-24 w-24 rounded-2xl object-cover border border-gray-200" />
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setFormData((prev) => ({ ...prev, image: file }));
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setPreviewImage(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Upload a product image (optional)</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="rounded-2xl bg-[#c7a13f] px-4 py-2 text-sm font-semibold text-white">
              {editingProduct ? "Update product" : "Add product"}
            </button>
            {editingProduct && (
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setFormData({ itemNo: "", itemDescription: "", bomType: "Not a BOM", boxQuantity: "", cartonQuantity: "", rewardsPerPc: "", image: null });
                  setPreviewImage(null);
                }}
                className="rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}


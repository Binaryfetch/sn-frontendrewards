import axios from "axios";

const BASE_URL='/api';
// Create axios instance with credentials
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Add request interceptor to include token in headers if available
api.interceptors.request.use((config) => {
  // Token will be passed via Authorization header in individual requests
  return config;
});

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login on unauthorized
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const login = (username, password) => 
  api.post("/users/login", { username, password });

export const loginWithPhone = (mobile, role) => 
  api.post("/users/login-phone", { mobile, role });

export const logout = () => 
  api.post("/users/logout");

export const getProfile = () => 
  api.get("/users/profile");

// User Management APIs
export const createDistributor = (distributorData) => 
  api.post("/users/distributors", distributorData);

export const createDealer = (dealerData) => 
  api.post("/users/dealers", dealerData);

export const updateDealer = (id, dealerData) => 
  api.put(`/users/dealers/${id}`, dealerData);

export const getDistributors = () => 
  api.get("/users/distributors");

export const getDealers = () => 
  api.get("/users/my-dealers");

export const getAllDealers = () => 
  api.get("/users/dealers");

// Product APIs
export const getAllProducts = () => 
  api.get("/products");

export const getAllProductsAdmin = () => 
  api.get("/products/admin/all");

export const createProduct = (productData) => 
  api.post("/products", productData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const bulkCreateProducts = (productsData) => 
  api.post("/products/bulk", { products: productsData });

export const parseExcelFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post("/products/bulk/parse", formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const updateProduct = (id, productData) => 
  api.put(`/products/${id}`, productData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const deleteProduct = (id) => 
  api.delete(`/products/${id}`);

export const getProduct = (id) => 
  api.get(`/products/${id}`);

// Wallet APIs
export const getWalletBalance = () => 
  api.get("/wallets/balance");

export const getWalletTransactions = (page = 1, limit = 10) => 
  api.get(`/wallets/transactions?page=${page}&limit=${limit}`);

export const getAllWallets = () => 
  api.get("/wallets/admin/all");

export const getWalletSummary = () => 
  api.get("/wallets/admin/summary");

// Manual deduction APIs
export const companyDeductDistributor = (distributorId, points, note) =>
  api.post("/wallets/admin/deduct-distributor", { distributorId, points, note });

export const companyDeductDealer = (dealerId, points, note) =>
  api.post("/wallets/admin/deduct-dealer", { dealerId, points, note });

export const distributorDeductDealer = (dealerId, points, note) =>
  api.post("/wallets/deduct-dealer", { dealerId, points, note });

// Invoice APIs
export const createCompanyInvoice = (payload) =>
  api.post("/invoices/company-create", payload);

export const createDistributorInvoice = (payload) =>
  api.post("/invoices/distributor-create", payload);

export const getUserInvoices = () =>
  api.get(`/invoices/my-invoices`);

export const getAllInvoices = () => 
  api.get("/invoices/admin/all");

export const getInvoiceSummary = (role = 'admin') => {
  const url =
    role === 'Distributor'
      ? "/invoices/distributor/summary"
      : "/invoices/admin/summary";
  return api.get(url);
};

export const getInvoiceFormData = () =>
  api.get("/invoices/form-data");

export const getMyProductAllocations = () =>
  api.get("/invoices/my-products");

// Content APIs
export const getAllContent = (params = '') => 
  api.get(`/content/admin/all?${params}`);

export const getContentForUser = (params = '') => 
  api.get(`/content?${params}`);

export const createContent = (formData) => 
  api.post("/content", formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const updateContent = (id, contentData) => 
  api.put(`/content/${id}`, contentData);

export const deleteContent = (id) => 
  api.delete(`/content/${id}`);

export const getContentSummary = () => 
  api.get("/content/admin/summary");
export const uploadDistributors = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/users/upload-distributors", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const uploadProducts = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/products/upload-products", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const uploadInvoices = ({ file, pointsMode, invoiceDate, invoiceNumber, description }) => {
  const formData = new FormData();
  formData.append("file", file);
  if (pointsMode) formData.append("pointsMode", pointsMode);
  if (invoiceDate) formData.append("invoiceDate", invoiceDate);
  if (invoiceNumber) formData.append("invoiceNumber", invoiceNumber);
  if (description) formData.append("description", description);

  return api.post("/invoice/upload-invoices", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};
export const uploadDealers = (form) =>
  api.post("/users/upload-dealers", form, {
    headers: { "Content-Type": "multipart/form-data" }
  });


export default api;

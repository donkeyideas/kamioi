import axios from "axios";

// In development, use empty string to leverage Vite proxy (routes /api to backend)
// In production, VITE_API_BASE_URL MUST be set to your backend URL (e.g., https://your-backend.railway.app)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Warn in production if API URL is not configured
if (!import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL) {
  console.error('WARNING: VITE_API_BASE_URL is not set. API calls will fail in production!');
}

export const ROLES = { USER: "user", ADMIN: "admin" };
const TOKEN_KEYS = { [ROLES.USER]: "kamioi_user_token", [ROLES.ADMIN]: "kamioi_admin_token" };

export function setToken(role, token) { localStorage.setItem(TOKEN_KEYS[role], token); }
export function getToken(role) { 
  const token = localStorage.getItem(TOKEN_KEYS[role]) || null;
  return token;
}
export function clearToken(role) { localStorage.removeItem(TOKEN_KEYS[role]); }

// 🚀 PERFORMANCE FIX: Increased timeout to 60 seconds for large queries
const client = axios.create({ baseURL: API_BASE_URL, timeout: 60000 });

client.interceptors.request.use((config) => {
  // Use regular token logic
  const role = config.meta?.role;
  let token = role ? getToken(role) : null;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["Content-Type"] = "application/json";
  return config;
});

/** avoid noisy 422s if no admin token */
const _rawGet = client.get.bind(client);
client.get = (url, config = {}) => {
  if (url === "/api/admin/auth/me") {
    const t = getToken(ROLES.ADMIN);
    if (!t) return Promise.resolve({ data: null });
  }
  return _rawGet(url, config);
};

client.interceptors.response.use((res) => res, (err) => Promise.reject(err));

/* ---- canonical APIs ---- */
export const AuthAPI = {
  loginUser: (email, password) =>
    client.post("/api/user/auth/login", { email, password }, { meta: { role: ROLES.USER } }),
  loginAdmin: (email, password, totp_code = null) =>
    client.post("/api/admin/auth/login", { email, password, totp_code }, { meta: { role: ROLES.ADMIN } }),
  meUser: () => client.get("/api/user/auth/me", { meta: { role: ROLES.USER } }),
  meAdmin: () => client.get("/api/admin/auth/me", { meta: { role: ROLES.ADMIN } }),
};

export const UserAPI = {
  transactions: () => client.get("/api/user/transactions", { meta: { role: ROLES.USER } }),
  portfolio:    () => client.get("/api/user/portfolio",    { meta: { role: ROLES.USER } }),
  goals:        () => client.get("/api/user/goals",         { meta: { role: ROLES.USER } }),
  aiRecommendations: () => client.get("/api/user/ai/recommendations", { meta: { role: ROLES.USER } }),
  notifications: () => client.get("/api/user/notifications", { meta: { role: ROLES.USER } }),
  totalRoundUps: () => client.get("/api/user/roundups/total", { meta: { role: ROLES.USER } }),
  totalFees: () => client.get("/api/user/fees/total", { meta: { role: ROLES.USER } }),
  addTransaction: (transactionData) => client.post("/api/user/transactions", transactionData, { meta: { role: ROLES.USER } }),
  updateTransaction: (id, transactionData) => client.put(`/api/user/transactions/${id}`, transactionData, { meta: { role: ROLES.USER } }),
  deleteTransaction: (id) => client.delete(`/api/user/transactions/${id}`, { meta: { role: ROLES.USER } }),
  createGoal: (goalData) => client.post("/api/user/goals", goalData, { meta: { role: ROLES.USER } }),
  updateGoal: (id, goalData) => client.put(`/api/user/goals/${id}`, goalData, { meta: { role: ROLES.USER } }),
  deleteGoal: (id) => client.delete(`/api/user/goals/${id}`, { meta: { role: ROLES.USER } }),
  processRoundUp: (amount, merchant, ticker) => client.post("/api/user/roundups/process", { amount, merchant, ticker }, { meta: { role: ROLES.USER } }),
  submitTransaction: (transactionData) => client.post("/api/transactions", transactionData, { meta: { role: ROLES.USER } }),
};

export const BusinessAPI = {
  transactions: () => client.get("/api/business/transactions", { meta: { role: ROLES.USER } }),
  portfolio: () => client.get("/api/business/portfolio", { meta: { role: ROLES.USER } }),
  goals: () => client.get("/api/business/goals", { meta: { role: ROLES.USER } }),
  aiRecommendations: () => client.get("/api/business/ai/recommendations", { meta: { role: ROLES.USER } }),
  notifications: () => client.get("/api/business/notifications", { meta: { role: ROLES.USER } }),
  totalRoundUps: () => client.get("/api/business/roundups/total", { meta: { role: ROLES.USER } }),
  totalFees: () => client.get("/api/business/fees/total", { meta: { role: ROLES.USER } }),
};

export const FamilyAPI = {
  transactions: () => client.get("/api/family/transactions", { meta: { role: ROLES.USER } }),
  portfolio: () => client.get("/api/family/portfolio", { meta: { role: ROLES.USER } }),
  goals: () => client.get("/api/family/goals", { meta: { role: ROLES.USER } }),
  aiRecommendations: () => client.get("/api/family/ai/recommendations", { meta: { role: ROLES.USER } }),
  notifications: () => client.get("/api/family/notifications", { meta: { role: ROLES.USER } }),
  totalRoundUps: () => client.get("/api/family/roundups/total", { meta: { role: ROLES.USER } }),
  totalFees: () => client.get("/api/family/fees/total", { meta: { role: ROLES.USER } }),
};

export const AdminAPI = {
  users: () => client.get("/api/admin/users", { meta: { role: ROLES.ADMIN } }),
  performanceStorage: () => client.get("/api/admin/performance/storage", { meta: { role: ROLES.ADMIN } }),
  transactions: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return client.get(`/api/admin/transactions${queryString ? `?${queryString}` : ''}`, { meta: { role: ROLES.ADMIN } });
  },
  userTransactions: (userId) => client.get(`/api/admin/users/${userId}/transactions`, { meta: { role: ROLES.ADMIN } }),
  businessTransactions: (businessId) => client.get(`/api/admin/businesses/${businessId}/transactions`, { meta: { role: ROLES.ADMIN } }),
  familyTransactions: (familyId) => client.get(`/api/admin/families/${familyId}/transactions`, { meta: { role: ROLES.ADMIN } }),
};

/* ---- compatibility helpers used by DataContext ---- */
// Determine dashboard type and return appropriate API
export function getTransactions(dashboardType = null) {
  const type = dashboardType || detectDashboardType();
  if (type === 'business') return BusinessAPI.transactions();
  if (type === 'family') return FamilyAPI.transactions();
  return UserAPI.transactions();
}

export function getPortfolio(dashboardType = null) {
  const type = dashboardType || detectDashboardType();
  if (type === 'business') return BusinessAPI.portfolio();
  if (type === 'family') return FamilyAPI.portfolio();
  return UserAPI.portfolio();
}

export function getGoals(dashboardType = null) {
  const type = dashboardType || detectDashboardType();
  if (type === 'business') return BusinessAPI.goals();
  if (type === 'family') return FamilyAPI.goals();
  return UserAPI.goals();
}

export function getAIRecommendations(dashboardType = null) {
  const type = dashboardType || detectDashboardType();
  if (type === 'business') return BusinessAPI.aiRecommendations();
  if (type === 'family') return FamilyAPI.aiRecommendations();
  return UserAPI.aiRecommendations();
}

export function getNotifications(dashboardType = null) {
  const type = dashboardType || detectDashboardType();
  if (type === 'business') return BusinessAPI.notifications();
  if (type === 'family') return FamilyAPI.notifications();
  return UserAPI.notifications();
}

export function getTotalRoundUps(dashboardType = null) {
  const type = dashboardType || detectDashboardType();
  if (type === 'business') return BusinessAPI.totalRoundUps();
  if (type === 'family') return FamilyAPI.totalRoundUps();
  return UserAPI.totalRoundUps();
}

export function getTotalFees(dashboardType = null) {
  const type = dashboardType || detectDashboardType();
  if (type === 'business') return BusinessAPI.totalFees();
  if (type === 'family') return FamilyAPI.totalFees();
  return UserAPI.totalFees();
}

// Helper function to detect dashboard type from URL
function detectDashboardType() {
  if (typeof window === 'undefined') return 'user';
  const pathname = window.location.pathname.toLowerCase();
  if (pathname.includes('/business/') || pathname.includes('/business')) return 'business';
  if (pathname.includes('/family/') || pathname.includes('/family')) return 'family';
  return 'user';
}
export function addTransaction(transactionData) { return UserAPI.addTransaction(transactionData); }
export function updateTransaction(id, transactionData) { return UserAPI.updateTransaction(id, transactionData); }
export function deleteTransaction(id) { return UserAPI.deleteTransaction(id); }
export function createGoal(goalData) { return UserAPI.createGoal(goalData); }
export function updateGoal(id, goalData) { return UserAPI.updateGoal(id, goalData); }
export function deleteGoal(id) { return UserAPI.deleteGoal(id); }
export function processRoundUp(amount, merchant, ticker) { return UserAPI.processRoundUp(amount, merchant, ticker); }
export function submitTransaction(transactionData) { return UserAPI.submitTransaction(transactionData); }

export function getAdminMeSafe() {
  const t = getToken(ROLES.ADMIN);
  return t ? AuthAPI.meAdmin() : Promise.resolve({ data: null });
}

/* default export exposes axios + helpers */
const apiService = Object.assign(client, {
  getTransactions,
  getPortfolio,
  getGoals,
  getAIRecommendations,
  getNotifications,
  getTotalRoundUps,
  getTotalFees,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  createGoal,
  updateGoal,
  deleteGoal,
  processRoundUp,
  getAdminMeSafe,
  setToken,
  getToken,
  clearToken,
  ROLES,
  AuthAPI,
  UserAPI,
  AdminAPI,
});
export { apiService };
export default apiService;

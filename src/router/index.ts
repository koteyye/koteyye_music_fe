import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";

// Views
import Home from "../views/Home.vue";

// Routes configuration
const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/track/:id",
    name: "Track",
    component: Home,
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/Login.vue"),
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("../views/Register.vue"),
  },
  {
    path: "/auth-callback",
    name: "AuthCallback",
    component: () => import("../views/AuthCallback.vue"),
  },
  {
    path: "/admin",
    name: "Admin",
    component: () => import("../views/Admin.vue"),
  },
  {
    path: "/profile",
    name: "Profile",
    component: () => import("../views/Profile.vue"),
  },
  {
    path: "/albums/:id",
    name: "AlbumDetail",
    component: () => import("../views/AlbumDetail.vue"),
  },
  {
    // 404 Not Found
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

// Create router instance
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Защита маршрутов теперь обрабатывается в ProtectedRoute компоненте

export default router;
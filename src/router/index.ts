import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";

// Views
import Home from "../views/Home.vue";
import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import AuthCallback from "../views/AuthCallback.vue";
import Admin from "../views/Admin.vue";
import Profile from "../views/Profile.vue";
import AlbumDetail from "../views/AlbumDetail.vue";

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
    component: Login,
  },
  {
    path: "/register",
    name: "Register",
    component: Register,
  },
  {
    path: "/auth-callback",
    name: "AuthCallback",
    component: AuthCallback,
  },
  {
    path: "/admin",
    name: "Admin",
    component: Admin,
  },
  {
    path: "/profile",
    name: "Profile",
    component: Profile,
  },
  {
    path: "/albums/:id",
    name: "AlbumDetail",
    component: AlbumDetail,
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

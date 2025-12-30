<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import apiClient from "../api/client";
import type { User } from "../types";
import { Loader2, AlertCircle, CheckCircle } from "lucide-vue-next";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// UI State
type StatusType = "loading" | "success" | "error";
const status = ref<StatusType>("loading");
const errorMessage = ref<string | null>(null);

onMounted(async () => {
    try {
        // Extract token from URL query parameters
        const token = route.query.token as string;

        if (!token) {
            throw new Error("Токен не найден в URL");
        }

        // Save token to auth store and localStorage
        authStore.setToken(token);

        // Configure axios with the new token for this request
        apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // Fetch user information using the token
        // Note: We need to call the auth store's login or a similar method to fetch user data
        // For now, we'll make a direct API call to get user info
        const response = await apiClient.get<{ user: User }>("/auth/me");
        const user = response.data.user;

        // Save user to auth store
        authStore.setUser(user);

        status.value = "success";

        // Redirect to home after a short delay
        setTimeout(() => {
            router.push("/");
        }, 1500);
    } catch (error: any) {
        console.error("OAuth callback error:", error);
        status.value = "error";
        errorMessage.value =
            error.message || "Не удалось выполнить вход через OAuth";

        // Redirect to login page after showing error
        setTimeout(() => {
            router.push("/login");
        }, 3000);
    }
});
</script>

<template>
    <div class="min-h-screen bg-cream flex items-center justify-center p-4">
        <div class="text-center max-w-md">
            <!-- Loading State -->
            <div
                v-if="status === 'loading'"
                class="bg-white rounded-3xl shadow-xl p-12"
            >
                <div
                    class="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center shadow-xl shadow-orange-500/30 mx-auto mb-6 animate-pulse"
                >
                    <span class="text-4xl">🐱</span>
                </div>
                <Loader2
                    class="w-12 h-12 text-kot-orange animate-spin mx-auto mb-4"
                />
                <h1 class="text-2xl font-bold text-kot-dark mb-2">
                    Вход в систему...
                </h1>
                <p class="text-gray-500">
                    Подождите, мы завершаем процесс авторизации
                </p>
            </div>

            <!-- Success State -->
            <div
                v-else-if="status === 'success'"
                class="bg-white rounded-3xl shadow-xl p-12"
            >
                <div
                    class="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-xl shadow-green-500/30 mx-auto mb-6"
                >
                    <CheckCircle class="w-10 h-10 text-white" />
                </div>
                <h1 class="text-2xl font-bold text-kot-dark mb-2">Успешно!</h1>
                <p class="text-gray-500">Добро пожаловать в Koteyye Music</p>
                <p class="text-sm text-gray-400 mt-2">
                    Перенаправление на главную страницу...
                </p>
            </div>

            <!-- Error State -->
            <div
                v-else-if="status === 'error'"
                class="bg-white rounded-3xl shadow-xl p-12"
            >
                <div
                    class="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-xl shadow-red-500/30 mx-auto mb-6"
                >
                    <AlertCircle class="w-10 h-10 text-white" />
                </div>
                <h1 class="text-2xl font-bold text-red-600 mb-2">Ошибка</h1>
                <p class="text-gray-500 mb-4">{{ errorMessage }}</p>
                <p class="text-sm text-gray-400">
                    Перенаправление на страницу входа...
                </p>
                <router-link
                    to="/login"
                    class="inline-block mt-6 px-6 py-3 bg-kot-orange text-white font-semibold rounded-2xl hover:bg-orange-600 transition-colors"
                >
                    Вернуться на страницу входа
                </router-link>
            </div>
        </div>
    </div>
</template>

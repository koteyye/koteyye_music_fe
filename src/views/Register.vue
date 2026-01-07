<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { authAPI } from "../api/client";
import {
    Cat,
    Mail,
    Lock,
    User,
    AlertCircle,
    Loader2,
    CheckCircle,
} from "lucide-vue-next";
import YandexIcon from '../assets/icons/Yandex_icon.svg';

const router = useRouter();
const authStore = useAuthStore();

// Form state
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const isSubmitting = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

// Handle registration form submission
const handleRegister = async () => {
    // Reset error
    error.value = null;
    success.value = false;

    // Basic validation
    if (!email.value.trim()) {
        error.value = "Введите email";
        return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
        error.value = "Введите корректный email";
        return;
    }

    if (!password.value) {
        error.value = "Введите пароль";
        return;
    }

    // Password strength validation
    if (password.value.length < 6) {
        error.value = "Пароль должен содержать минимум 6 символов";
        return;
    }

    if (password.value !== confirmPassword.value) {
        error.value = "Пароли не совпадают";
        return;
    }

    isSubmitting.value = true;

    try {
        await authStore.register(email.value, password.value);
        success.value = true;

        // Redirect to login after successful registration
        setTimeout(() => {
            router.push("/login");
        }, 2000);
    } catch (err: any) {
        console.error("Registration failed:", err);
        error.value =
            err.response?.data?.error ||
            "Не удалось зарегистрироваться. Попробуйте снова.";
    } finally {
        isSubmitting.value = false;
    }
};

// Handle OAuth login
const handleOAuthLogin = (provider: "google" | "yandex") => {
    const authUrl =
        provider === "google"
            ? authAPI.getGoogleAuthUrl()
            : authAPI.getYandexAuthUrl();
    window.location.href = authUrl;
};

// Password strength indicator
const passwordStrength = computed(() => {
    if (!password.value) return 0;

    let strength = 0;
    if (password.value.length >= 6) strength++;
    if (password.value.length >= 8) strength++;
    if (/[A-Z]/.test(password.value)) strength++;
    if (/[0-9]/.test(password.value)) strength++;
    if (/[^A-Za-z0-9]/.test(password.value)) strength++;

    return strength;
});

const strengthColor = computed(() => {
    const strength = passwordStrength.value;
    if (strength <= 1) return "bg-red-500";
    if (strength <= 2) return "bg-orange-500";
    if (strength <= 3) return "bg-yellow-500";
    if (strength <= 4) return "bg-green-400";
    return "bg-green-500";
});

const strengthText = computed(() => {
    const strength = passwordStrength.value;
    if (strength <= 1) return "Слабый";
    if (strength <= 2) return "Средний";
    if (strength <= 3) return "Хороший";
    if (strength <= 4) return "Сильный";
    return "Отличный";
});
</script>

<template>
    <div class="min-h-screen bg-cream dark:bg-zinc-900 flex items-center justify-center p-4 transition-colors duration-300">
        <div class="w-full max-w-md">
            <!-- Logo/Header -->
            <div class="text-center mb-8">
                <div
                    class="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center shadow-xl shadow-orange-500/30 mx-auto mb-4"
                >
                    <span class="text-4xl">🐱</span>
                </div>
                <h1 class="text-3xl font-bold text-kot-dark dark:text-gray-100 transition-colors">Регистрация</h1>
                <p class="text-gray-500 dark:text-gray-400 mt-2 transition-colors">
                    Создайте аккаунт в Koteyye Music
                </p>
            </div>

            <!-- Register Card -->
            <div class="bg-white dark:bg-zinc-800 rounded-3xl shadow-xl p-8 transition-colors duration-300">
                <!-- Success Message -->
                <div
                    v-if="success"
                    class="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl flex items-center gap-3 text-green-700 dark:text-green-400 transition-colors"
                >
                    <CheckCircle class="w-5 h-5 flex-shrink-0" />
                    <span class="font-medium"
                        >Регистрация успешна! Перенаправление...</span
                    >
                </div>

                <!-- Error Message -->
                <div
                    v-if="error"
                    class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-400 transition-colors"
                >
                    <AlertCircle class="w-5 h-5 flex-shrink-0" />
                    <span class="font-medium">{{ error }}</span>
                </div>

                <!-- Register Form -->
                <form @submit.prevent="handleRegister" class="space-y-5">
                    <!-- Email Input -->
                    <div>
                        <label
                            class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors"
                            >Email *</label
                        >
                        <div class="relative">
                            <Mail
                                class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500"
                            />
                            <input
                                v-model="email"
                                type="email"
                                placeholder="your@email.com"
                                :disabled="isSubmitting || success"
                                class="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:border-kot-orange dark:focus:border-kot-orange focus:outline-none transition-colors disabled:bg-gray-100 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <!-- Password Input -->
                    <div>
                        <label
                            class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors"
                            >Пароль *</label
                        >
                        <div class="relative">
                            <Lock
                                class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500"
                            />
                            <input
                                v-model="password"
                                type="password"
                                placeholder="••••••••"
                                :disabled="isSubmitting || success"
                                class="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:border-kot-orange dark:focus:border-kot-orange focus:outline-none transition-colors disabled:bg-gray-100 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed"
                            />
                        </div>

                        <!-- Password Strength Indicator -->
                        <div v-if="password" class="mt-2">
                            <div class="flex gap-1 h-1.5">
                                <div
                                    v-for="i in 5"
                                    :key="i"
                                    class="flex-1 rounded-full transition-colors"
                                    :class="
                                        i <= passwordStrength
                                            ? strengthColor
                                            : 'bg-gray-200 dark:bg-zinc-700'
                                    "
                                ></div>
                            </div>
                            <p class="text-xs mt-1 text-gray-500 dark:text-gray-400">
                                Сложность: {{ strengthText }}
                            </p>
                        </div>
                    </div>

                    <!-- Confirm Password Input -->
                    <div>
                        <label
                            class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors"
                            >Подтвердите пароль *</label
                        >
                        <div class="relative">
                            <User
                                class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500"
                            />
                            <input
                                v-model="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                :disabled="isSubmitting || success"
                                class="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:border-kot-orange dark:focus:border-kot-orange focus:outline-none transition-colors disabled:bg-gray-100 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed"
                            />
                        </div>
                        <!-- Password match indicator -->
                        <div v-if="confirmPassword" class="mt-1">
                            <p
                                v-if="password === confirmPassword"
                                class="text-xs text-green-600"
                            >
                                ✓ Пароли совпадают
                            </p>
                            <p v-else class="text-xs text-red-500">
                                ✗ Пароли не совпадают
                            </p>
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <button
                        type="submit"
                        :disabled="isSubmitting || success"
                        class="w-full py-4 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-orange-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        <Loader2
                            v-if="isSubmitting"
                            class="w-5 h-5 animate-spin"
                        />
                        <Cat v-else-if="!success" class="w-5 h-5" />
                        <CheckCircle v-else class="w-5 h-5" />
                        {{
                            isSubmitting
                                ? "Регистрация..."
                                : success
                                  ? "Успешно!"
                                  : "Зарегистрироваться"
                        }}
                    </button>
                </form>

                <!-- Divider -->
                <div class="my-6 flex items-center gap-4">
                    <div class="flex-1 h-px bg-gray-200 dark:bg-zinc-700 transition-colors"></div>
                    <span class="text-sm text-gray-400 dark:text-gray-500">или</span>
                    <div class="flex-1 h-px bg-gray-200 dark:bg-zinc-700 transition-colors"></div>
                </div>

                <!-- OAuth Buttons -->
                <div class="space-y-3">
                    <!-- Google OAuth -->
                    <button
                        @click="handleOAuthLogin('google')"
                        type="button"
                        :disabled="isSubmitting || success"
                        class="w-full py-3 bg-white dark:bg-zinc-700 border-2 border-gray-200 dark:border-zinc-600 text-gray-700 dark:text-gray-200 font-semibold rounded-2xl hover:border-gray-300 dark:hover:border-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg class="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Войти через Google
                    </button>

                    <!-- Yandex OAuth -->
                    <button
                        @click="handleOAuthLogin('yandex')"
                        type="button"
                        :disabled="isSubmitting || success"
                        class="w-full py-3 bg-white dark:bg-zinc-700 border-2 border-gray-200 dark:border-zinc-600 text-gray-700 dark:text-gray-200 font-semibold rounded-2xl hover:border-gray-300 dark:hover:border-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <img :src="YandexIcon" alt="Yandex" class="w-5 h-5" />
                        Войти через Yandex
                    </button>
                </div>

                <!-- Login Link -->
                <p class="text-center mt-6 text-gray-500 dark:text-gray-400">
                    Уже есть аккаунт?
                    <router-link
                        to="/login"
                        class="text-kot-orange font-semibold hover:underline"
                    >
                        Войти
                    </router-link>
                </p>
            </div>
        </div>
    </div>
</template>

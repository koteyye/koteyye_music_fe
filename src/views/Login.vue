<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { authAPI } from '../api/client';
import { Cat, Mail, Lock, AlertCircle, Loader2 } from 'lucide-vue-next';
import YandexIcon from '../assets/icons/Yandex_icon.svg';

const router = useRouter();
const authStore = useAuthStore();

// Auth store инициализируется в App.vue

// Form state
const email = ref('');
const password = ref('');
const isSubmitting = ref(false);
const error = ref<string | null>(null);

// Handle login form submission
const handleLogin = async () => {
  // Reset error
  error.value = null;

  // Basic validation
  if (!email.value.trim()) {
    error.value = 'Введите email';
    return;
  }
  if (!password.value) {
    error.value = 'Введите пароль';
    return;
  }

  isSubmitting.value = true;

  try {
    await authStore.login(email.value, password.value);
    // Redirect to home after successful login
    router.push('/');
  } catch (err: any) {
    console.error('Login failed:', err);
    error.value = err.response?.data?.error || 'Не удалось войти. Проверьте email и пароль.';
  } finally {
    isSubmitting.value = false;
  }
};

// Handle OAuth login
const handleOAuthLogin = (provider: 'google' | 'yandex') => {
  const guestId = authStore.user?.id;
  const authUrl = provider === 'google' ? authAPI.getGoogleAuthUrl(guestId) : authAPI.getYandexAuthUrl(guestId);
  window.location.href = authUrl;
};
</script>

<template>
  <div class="min-h-screen bg-cream flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <div class="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center shadow-xl shadow-orange-500/30 mx-auto mb-4">
          <span class="text-4xl">🐱</span>
        </div>
        <h1 class="text-3xl font-bold text-kot-dark">Добро пожаловать</h1>
        <p class="text-gray-500 mt-2">Войдите в свой аккаунт Koteyye Music</p>
      </div>

      <!-- Login Card -->
      <div class="bg-white rounded-3xl shadow-xl p-8">
        <!-- Error Message -->
        <div
          v-if="error"
          class="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700"
        >
          <AlertCircle class="w-5 h-5 flex-shrink-0" />
          <span class="font-medium">{{ error }}</span>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="space-y-5">
          <!-- Email Input -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <div class="relative">
              <Mail class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                v-model="email"
                type="email"
                placeholder="your@email.com"
                :disabled="isSubmitting"
                class="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-kot-orange focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <!-- Password Input -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Пароль</label>
            <div class="relative">
              <Lock class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                v-model="password"
                type="password"
                placeholder="••••••••"
                :disabled="isSubmitting"
                class="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-kot-orange focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full py-4 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-orange-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
          >
            <Loader2 v-if="isSubmitting" class="w-5 h-5 animate-spin" />
            <Cat v-else class="w-5 h-5" />
            {{ isSubmitting ? 'Вход...' : 'Войти' }}
          </button>
        </form>

        <!-- Divider -->
        <div class="my-6 flex items-center gap-4">
          <div class="flex-1 h-px bg-gray-200"></div>
          <span class="text-sm text-gray-400">или</span>
          <div class="flex-1 h-px bg-gray-200"></div>
        </div>

        <!-- OAuth Buttons -->
        <div class="space-y-3">
          <!-- Google OAuth -->
          <button
            @click="handleOAuthLogin('google')"
            type="button"
            :disabled="isSubmitting"
            class="w-full py-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-2xl hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Войти через Google
          </button>

          <!-- Yandex OAuth -->
          <button
            @click="handleOAuthLogin('yandex')"
            type="button"
            :disabled="isSubmitting"
            class="w-full py-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-2xl hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img :src="YandexIcon" alt="Yandex" class="w-5 h-5" />
            Войти через Yandex
          </button>
        </div>

        <!-- Guest Link -->
        <div class="text-center mt-6">
          <button
            @click="router.push('/')"
            type="button"
            class="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-colors mb-4"
          >
            Остаться гостем
          </button>
        </div>

        <!-- Register Link -->
        <p class="text-center text-gray-500">
          Нет аккаунта?
          <router-link to="/register" class="text-kot-orange font-semibold hover:underline">
            Зарегистрироваться
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

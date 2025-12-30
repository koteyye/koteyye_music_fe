<template>
  <div v-if="loading" class="flex justify-center items-center h-64">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-kot-orange"></div>
  </div>
  <slot v-else-if="isAuthorized" />
  <div v-else class="min-h-screen bg-gradient-to-br from-kot-dark to-slate-900 flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-8 text-center max-w-md w-full">
      <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-kot-dark mb-2">Требуется авторизация</h2>
      <p class="text-gray-600 mb-6">Для доступа к этой странице необходимо войти в аккаунт</p>
      <div class="space-y-3">
        <router-link
          to="/login"
          class="block w-full py-3 bg-kot-orange text-white font-semibold rounded-2xl hover:bg-orange-600 transition-colors"
        >
          Войти в аккаунт
        </router-link>
        <router-link
          to="/"
          class="block w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-2xl hover:bg-gray-200 transition-colors"
        >
          На главную
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { isTokenValid } from '../utils/jwt'

interface Props {
  requireAuth?: boolean
  adminOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  requireAuth: true,
  adminOnly: false
})

const authStore = useAuthStore()
const loading = ref(true)

const isAuthorized = computed(() => {
  if (!props.requireAuth) return true
  
  // Проверяем наличие и валидность токена
  const token = authStore.token
  if (!token || !isTokenValid(token)) return false
  
  // Проверяем что пользователь не гость
  if (authStore.isGuest) return false
  
  // Проверяем админ права если требуется
  if (props.adminOnly && !authStore.isAdmin) return false
  
  return true
})

onMounted(async () => {
  console.log('ProtectedRoute mounted:', {
    requireAuth: props.requireAuth,
    adminOnly: props.adminOnly,
    token: !!authStore.token,
    user: !!authStore.user,
    isGuest: authStore.isGuest,
    isAdmin: authStore.isAdmin
  })
  
  try {
    // Дождаться инициализации auth store
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Если есть токен но нет данных пользователя - загрузить
    if (authStore.token && !authStore.user) {
      console.log('Fetching user data...')
      await authStore.fetchUser()
    }
    
    console.log('ProtectedRoute authorization check:', {
      token: !!authStore.token,
      user: !!authStore.user,
      isGuest: authStore.isGuest,
      isAdmin: authStore.isAdmin,
      isAuthorized: isAuthorized.value
    })
  } catch (error) {
    console.error('ProtectedRoute error:', error)
  } finally {
    loading.value = false
  }
})
</script>
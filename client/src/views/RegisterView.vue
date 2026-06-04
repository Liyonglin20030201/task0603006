<template>
  <div class="auth-page">
    <div class="auth-card card">
      <h2>Create Account</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label>Display Name</label>
          <input v-model="form.displayName" type="text" placeholder="Your name" required />
        </div>
        <div class="form-group">
          <label>Username</label>
          <input v-model="form.username" type="text" placeholder="username" required />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input v-model="form.email" type="email" placeholder="your@email.com" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="form.password" type="password" placeholder="Min 8 characters" required />
        </div>
        <p v-if="error" class="error-text">{{ error }}</p>
        <button type="submit" class="btn-primary submit-btn" :disabled="loading">
          {{ loading ? 'Creating...' : 'Create Account' }}
        </button>
      </form>
      <p class="switch-text">
        Already have an account? <router-link to="/login">Login</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const error = ref('')
const form = reactive({ displayName: '', username: '', email: '', password: '' })

async function handleRegister() {
  error.value = ''
  loading.value = true
  try {
    await authStore.register(form)
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.error || 'Registration failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gray-50);
}
.auth-card {
  width: 100%;
  max-width: 400px;
}
.auth-card h2 {
  margin-bottom: 1.5rem;
  text-align: center;
}
.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: 0.35rem;
  color: var(--gray-700);
}
.error-text {
  color: var(--danger);
  font-size: 0.8rem;
  margin-bottom: 0.75rem;
}
.submit-btn {
  width: 100%;
  padding: 0.75rem;
  font-size: 0.95rem;
}
.switch-text {
  text-align: center;
  margin-top: 1rem;
  font-size: 0.85rem;
  color: var(--gray-500);
}
.switch-text a {
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
}
</style>

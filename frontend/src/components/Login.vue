<template>
  <div class="login-container" style="border: 2px solid red;">
    <h2>{{ isLogin ? 'Login' : 'Sign Up' }}</h2>
    <form @submit.prevent="handleSubmit" class="login-form">
      <div class="form-group">
        <label for="email">Email</label>
        <input
          type="email"
          id="email"
          v-model="email"
          required
          placeholder="Enter your email"
        />
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input
          type="password"
          id="password"
          v-model="password"
          required
          placeholder="Enter your password"
        />
      </div>
      <button type="submit" class="submit-btn">
        {{ isLogin ? 'Login' : 'Sign Up' }}
      </button>
      <p class="toggle-form" @click="toggleForm">
        {{ isLogin ? 'Need an account? Sign up' : 'Already have an account? Login' }}
      </p>
    </form>
  </div>
</template>

<script>
import { authService } from '../services/auth';

export default {
  name: 'Login',
  data() {
    return {
      email: '',
      password: '',
      isLogin: true
    };
  },
  methods: {
    async handleSubmit() {
      try {
        console.log('Attempting authentication:', this.isLogin ? 'login' : 'signup');
        if (this.isLogin) {
          await authService.signIn(this.email, this.password);
        } else {
          await authService.signUp(this.email, this.password);
        }
        console.log('Authentication successful');
        this.$emit('authenticated');
      } catch (error) {
        console.error('Authentication error:', error);
        alert(error.message);
      }
    },
    toggleForm() {
      this.isLogin = !this.isLogin;
    }
  }
};
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: relative;
  z-index: 1;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
}

.form-group input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.submit-btn {
  padding: 0.75rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
}

.submit-btn:hover {
  opacity: 0.9;
}

.toggle-form {
  text-align: center;
  color: var(--primary-color);
  cursor: pointer;
  margin-top: 1rem;
}

.toggle-form:hover {
  text-decoration: underline;
}
</style> 
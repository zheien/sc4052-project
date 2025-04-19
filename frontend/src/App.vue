<template>
  <div id="app">

    <header v-if="isAuthenticated" class="app-header">
      <div class="header-content">

        <nav>
          <router-link to="/" class="nav-link">Home</router-link>
          <router-link to="/prompts" class="nav-link">Prompts</router-link>
          <router-link to="/calendar" class="nav-link">Calendar</router-link>
          <router-link to="/settings" class="nav-link">Settings</router-link>
        </nav>
        <button @click="handleSignOut" class="sign-out-btn">Sign Out</button>
      </div>
    </header>
    <main>
      <router-view 
        v-if="isAuthenticated" 
        :userId="currentUser?.uid"
        :key="currentUser?.uid"
      />
      <Login v-else @authenticated="handleAuthentication" />
    </main>
  </div>
</template>

<script>
import { authService } from './services/auth';
import Login from './components/Login.vue';
import store from './store';


export default {
  name: 'App',
  components: {
    Login,

  },
  data() {
    return {
      isAuthenticated: false,
      currentUser: null,
      authInitialized: false,
      preferencesLoaded: false // ensure we only check after prefs loaded
    };
  },
  async created() {
    console.log('App component created');
    
    // Initialize auth state
    await this.initializeAuth();
  },
  methods: {
    async initializeAuth() {
      return new Promise((resolve) => {
        const unsubscribe = authService.onAuthStateChanged(async (user) => {
          if (user) {
            // Fetch preferences from backend
            await this.$store.dispatch('preferences/fetchPreferences');
            this.preferencesLoaded = true;
            const hasRealPrefs = this.$store.getters['preferences/hasRealPreferences'];
            // If no real preferences (new user), show modal
            if (!hasRealPrefs) {
              this.showConfigModal = true;
            }
          }

          console.log('Auth state changed:', user);
          console.log('Current auth state:', {
            isAuthenticated: !!user,
            currentUser: user,
            userEmail: user?.email,
            userId: user?.uid
          });
          
          this.isAuthenticated = !!user;
          this.currentUser = user;
          
          // Update store with current user
          store.commit('SET_CURRENT_USER', user);
          
          // If user is authenticated, ensure we're on the home route
          if (user && this.$route.path !== '/') {
            this.$router.push('/');
          }

          this.authInitialized = true;
          unsubscribe();
          resolve();
        });
      });
    },
    async handleAuthentication() {
      console.log('Handling authentication');
      const user = authService.getCurrentUser();
      console.log('Current user:', user);
      this.isAuthenticated = true;
      this.currentUser = user;
      store.commit('SET_CURRENT_USER', user);
      // Fetch preferences and check if modal needed
      await this.$store.dispatch('preferences/fetchPreferences');
      this.preferencesLoaded = true;
      const hasRealPrefs = this.$store.getters['preferences/hasRealPreferences'];
      if (!hasRealPrefs) {
        this.showConfigModal = true;
      }
      this.$router.push('/');
    },
    async handleSignOut() {
      try {
        await authService.signOut();
        this.isAuthenticated = false;
        this.currentUser = null;
        store.commit('SET_CURRENT_USER', null);
        this.$router.push('/');
      } catch (error) {
        console.error('Error signing out:', error);
        alert('Failed to sign out');
      }
    },
    async handleConfigModalClose() {
      this.showConfigModal = false;
      // Save all preferences to backend
      await this.$store.dispatch('preferences/saveAllPreferences');
      // Reload preferences to ensure up to date
      await this.$store.dispatch('preferences/fetchPreferences');
    }
  }
};
</script>

<style>
:root {
  --primary-color: #4a90e2;
  --secondary-color: #f5f5f5;
  --text-color: #333;
  --border-color: #ddd;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: #f9f9f9;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.app-header h1 {
  color: var(--primary-color);
  margin: 0;
}

.nav-menu {
  display: flex;
  gap: 1rem;
}

.nav-link {
  color: var(--text-color);
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.nav-link:hover {
  background-color: var(--secondary-color);
}

.nav-link.router-link-active {
  color: var(--primary-color);
  font-weight: 500;
}

.sign-out-btn {
  padding: 0.5rem 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.sign-out-btn:hover {
  opacity: 0.9;
}

main {
  padding: 2rem;
}

/* Add a background color to make sure the main content is visible */
main {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding: 20px;
}

/* Make sure the app container takes full height */
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Ensure the header is visible */
.app-header {
  background-color: white;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 100;
}

/* Make sure the login container is visible */
.login-container {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>

<style scoped>
.app-header {
  background-color: #2c3e50;
  color: white;
  padding: 1rem;
  margin-bottom: 2rem;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

nav {
  display: flex;
  gap: 1rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-link.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
}

.sign-out-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.sign-out-btn:hover {
  background-color: #c0392b;
}
</style> 
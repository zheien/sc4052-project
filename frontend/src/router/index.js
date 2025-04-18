import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import PromptManager from '../views/PromptManager.vue'
import Calendar from '../views/Calendar.vue'
import Settings from '../views/Settings.vue'
import store from '../store'
import { authService } from '../services/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/prompts',
    name: 'PromptManager',
    component: PromptManager,
    meta: { requiresAuth: true }
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: Calendar,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// Add navigation guard to ensure user is authenticated
router.beforeEach(async (to, from, next) => {
  console.log('Router navigation:', {
    to: to.path,
    from: from.path,
    requiresAuth: to.matched.some(record => record.meta.requiresAuth)
  });
  
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  
  if (requiresAuth) {
    // Wait for Firebase auth to initialize
    await new Promise(resolve => {
      const unsubscribe = authService.onAuthStateChanged(user => {
        unsubscribe(); // Stop listening after first change
        resolve(user);
      });
    });

    const currentUser = authService.getCurrentUser();
    
    console.log('Auth check:', {
      storeUser: store.getters.getCurrentUser ? 'Present' : 'Missing',
      firebaseUser: currentUser ? 'Present' : 'Missing',
      requiresAuth,
      path: to.path
    });

    if (!currentUser) {
      console.log('Navigation blocked: Authentication required');
      next(false);
    } else {
      // Ensure the store has the current user
      if (!store.getters.getCurrentUser) {
        store.dispatch('setCurrentUser', currentUser);
      }
      // Check for calendar feature access
      if (to.path === '/calendar') {
        // Get preferences from Vuex store
        const preferences = store.getters['preferences/getPreferences'];
        if (!preferences || preferences.dailySummary === false) {
          alert('Access to the Calendar is disabled. Enable Daily Summary in Settings to view the Calendar.');
          next('/');
          return;
        }
      }
      console.log('Navigation allowed');
      next();
    }
  } else {
    console.log('Navigation allowed (no auth required)');
    next();
  }
});

export default router 
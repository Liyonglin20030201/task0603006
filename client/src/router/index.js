import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterView.vue')
  },
  {
    path: '/',
    component: () => import('../components/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/DashboardView.vue')
      },
      {
        path: 'trash',
        name: 'Trash',
        component: () => import('../views/TrashView.vue')
      },
      {
        path: 'archive',
        name: 'Archive',
        component: () => import('../views/ArchiveView.vue')
      },
      {
        path: 'search',
        name: 'Search',
        component: () => import('../views/SearchView.vue')
      },
      {
        path: 'documents/:id',
        name: 'Document',
        component: () => import('../views/DocumentView.vue')
      },
      {
        path: 'templates',
        name: 'Templates',
        component: () => import('../views/TemplatesView.vue')
      },
      {
        path: 'approvals',
        name: 'Approvals',
        component: () => import('../views/ApprovalsView.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login' })
  } else if ((to.name === 'Login' || to.name === 'Register') && authStore.isAuthenticated) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router

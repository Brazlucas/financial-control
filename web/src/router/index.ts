import { createRouter, createWebHistory } from 'vue-router';
import LoginComponent from '@/modules/login/LoginComponent.vue';
import DashboardComponent from '@/modules/home/HomeComponent.vue';
import AdminPainelComponent from '@/modules/admin/AdminPainelComponent.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginComponent,
    },
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/home',
      name: 'home',
      component: DashboardComponent,
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminPainelComponent,
    }    
  ],
})

export default router

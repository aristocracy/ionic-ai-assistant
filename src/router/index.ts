import { createRouter, createWebHashHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import HomePage from '../views/HomePage.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage,
  },
  {
    path: '/dynamiccomponent',
    name: 'DynamicComponent',
    component: () => import('../views/DynamicComponent.vue'),
  },
  // {
  //   path: '/message/:id',
  //   component: () => import('../views/ViewMessagePage.vue'),
  // },
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;

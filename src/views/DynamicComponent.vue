<template>
  <div class="demo-container">
    <h2>动态组件加载监控</h2>

    <div class="status">当前组件状态：{{ componentStatus }}</div>

    <div class="controls">
      <button @click="loadComponent('ComponentA')">加载组件A</button>
      <button @click="loadComponent('ComponentB')">加载组件B</button>
      <button @click="unloadComponent">卸载组件</button>
    </div>

    <component
      :is="currentComponent"
      v-if="currentComponent"
      @vue:mounted="handleMounted"
      @vue:updated="handleUpdated"
      @vue:beforeUnmount="handleBeforeUnmount"
    />
  </div>
</template>

<script setup lang="ts">
import { ShallowRef, ref, shallowRef } from 'vue';
import ComponentA from '@/components/ComponentA.vue';
import ComponentB from '@/components/ComponentB.vue';

defineOptions({
  name: 'DynamicComponent',
});
const currentComponent: ShallowRef = shallowRef(null);
const componentStatus = ref('无组件');

type ComponentName = string | null;

// 建立组件名和实际组件的映射
const componentMap: Record<string, null | ComponentName> = {
  ComponentA,
  ComponentB,
};

const handleMounted = () => {
  componentStatus.value = '✅ 组件已挂载';
  console.log('组件挂载完成');
};

const handleUpdated = () => {
  componentStatus.value = '🔄 组件已更新';
  console.log('组件更新完成');
};

const handleBeforeUnmount = () => {
  componentStatus.value = '❌ 组件即将卸载';
  console.log('组件即将卸载');
};

const loadComponent = (name: ComponentName) => {
  if (name && componentMap[name]) {
    currentComponent.value = componentMap[name];
  } else {
    console.warn(`组件 ${name} 不存在`);
    currentComponent.value = null;
  }
};

const unloadComponent = () => {
  currentComponent.value = null;
  componentStatus.value = '无组件';
};
</script>

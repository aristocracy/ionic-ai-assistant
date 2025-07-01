declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent<unknown, object, any>;
  export default component;
}
<template>
  <ion-button>
    <ion-icon :icon="addOutline"></ion-icon>
    <ion-label>Del</ion-label>
    <ion-ripple-effect></ion-ripple-effect>
  </ion-button>
</template>

<script setup lang="ts">
import { IonButton, IonIcon, IonLabel, IonRippleEffect } from '@ionic/vue';
import { addOutline } from 'ionicons/icons';
defineOptions({
  name: 'ComponentA',
});
</script>

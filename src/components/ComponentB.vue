<template>
  <ion-button>
    <ion-icon :icon="trashOutline"></ion-icon>
    <ion-label>New</ion-label>
    <ion-ripple-effect></ion-ripple-effect>
  </ion-button>
</template>

<script setup lang="ts">
import { IonButton, IonIcon, IonLabel, IonRippleEffect } from '@ionic/vue';
import { trashOutline } from 'ionicons/icons';
defineOptions({
  name: 'ComponentB',
});
</script>

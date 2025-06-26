<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Inbox</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- <ion-refresher slot="fixed" @ionRefresh="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher> -->

      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Inbox</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-button fill="solid" @click="redirct">
        <ion-text>Fetch Message</ion-text>
        <ion-icon name="mail-unread-outline"></ion-icon>
        <ion-ripple-effect></ion-ripple-effect>
      </ion-button>
      <ion-text color="success">{{ message }}</ion-text>
      <!-- <ion-list>
        <MessageListItem v-for="message in messages" :key="message.id" :message="message" />
      </ion-list> -->
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { Ref, ref } from 'vue';
//import { useRouter } from 'vue-router';
import { cozeClient } from '@/utils/coze/cozeClient';

import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonText,
  IonButton,
  IonIcon,
  IonRippleEffect,
  // IonList,
  // IonRefresher,
  // IonRefresherContent,
} from '@ionic/vue';
import { RoleType, ChatEventType } from '@coze/api';
const message: Ref = ref<string>('Hello, Ionic Vue!');
// const router = useRouter();
const signal = new AbortController().signal;
const redirct = async () => {
  await streamChat();
  //router.push('/dynamiccomponent');
};
const streamChat = async () => {
  const res = cozeClient.chat.stream(
    {
      bot_id: '7459240184144773159',
      user_id: 'gcb',
      stream: true,
      additional_messages: [
        {
          role: RoleType.User,
          content: '讲一个笑话',
          content_type: 'text',
        },
      ],
    },
    {
      signal,
    }
  );
  for await (const chunk of res) {
    if (chunk.event === ChatEventType.CONVERSATION_CHAT_FAILED) {
      console.error('Chat failed:', chunk.data.last_error.msg);
    } else if (chunk.event === ChatEventType.CONVERSATION_CHAT_IN_PROGRESS) {
      // calculateBlockHeight();
    } else if (chunk.event === ChatEventType.CONVERSATION_MESSAGE_DELTA) {
      const isReasoning = Object.prototype.hasOwnProperty.call(
        chunk.data,
        'reasoning_content'
      );
      const reasoningContent =
        isReasoning && chunk.data.reasoning_content.length > 0;
      if (chunk.data.content.length > 0) {
        //console.log(chunk.data.content);
      } else if (reasoningContent) {
        //console.log(chunk.data.reasoning_content);
      }
      // calculateBlockHeight();
    } else if (chunk.event === ChatEventType.CONVERSATION_MESSAGE_COMPLETED) {
      // this.answer = this.answer.slice(0, 1);
      // this.reasoningContent = this.reasoningContent.slice(0, 1);
    } else if (chunk.event === ChatEventType.CONVERSATION_CHAT_COMPLETED) {
      // this.answer = '';
      // this.reasoningContent = '';
    } else if (chunk.event === ChatEventType.DONE) {
      // this.isResponsing = false;
    }
    console.log(chunk);
  }
};
fetch('https://api.coze.cn/v3/chat', {
  method: 'POST',
  headers: {
    Authorization: `Bearer pat_NaGF9TupI0nTVl9ua4jmraRn6RofU8CZTET1OSJakgSb79mxI1tkR6GE5F1Ssqx1`,
    'Content-type': 'application/json',
  },
  body: JSON.stringify({
    bot_id: '7459240184144773159',
    user_id: 'gcb',
    stream: false,
    additional_messages: [
      {
        role: 'user',
        content: '讲一个笑话',
        content_type: 'text',
      },
    ],
  }),
  signal,
})
  .then(async (response) => {
    message.value = await response.text();
  })
  .catch((err) => {
    console.error(err);
  });
// import MessageListItem from '@/components/MessageListItem.vue';
// import { getMessages, Message } from '@/data/messages';

// const messages = ref<Message[]>(getMessages());

// const refresh = (ev: CustomEvent) => {
//   setTimeout(() => {
//     ev.detail.complete();
//   }, 3000);
// };
</script>

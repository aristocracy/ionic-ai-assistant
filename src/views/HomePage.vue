<template>
  <ion-page>
    <ion-content>
      <!-- 消息显示区域 -->
      <ion-list>
        <ion-item v-for="(item, index) in streamingMessages" :key="index">
          <ion-label>
            <div v-if="item.role === 'user'">
              <div v-if="item.content.type === 'text/plain'">
                <div v-html="item.content.text"></div>
              </div>
              <img
                v-else-if="item.content.type.startsWith('image')"
                :src="item.content.text"
                alt="User Image"
              />
            </div>
            <div v-else>
              <div v-if="item.reasoningContent">
                <blockquote>{{ item.reasoningContent }}</blockquote>
              </div>
              <button
                v-if="
                  item.content.text.startsWith('<question>') &&
                  item.content.text.endsWith('</question>')
                "
                @click="preSend(item.content.text.replace(/<[^>]*>/g, ''))"
              >
                {{ item.content.text.replace(/<[^>]*>/g, '') }}
              </button>
              <div v-else>
                <div v-html="item.content.text"></div>
              </div>
            </div>
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
    <!-- 图片预览区域 -->
    <div class="image-preview">
      <div
        v-for="(file, index) in uploadedFiles"
        :key="index"
        class="image-preview-item"
        @click="showDeleteButton(file)"
      >
        <img v-if="file.fileBlobUrl" :src="file.fileBlobUrl" alt="Preview" />
        <ion-spinner
          v-if="file.isUploading"
          name="crescent"
          class="loading-spinner"
        ></ion-spinner>
        <!-- 删除按钮 -->
        <button
          v-if="file.showDeleteButton"
          class="delete-button"
          @click.stop="confirmDelete(file)"
        >
          <ion-icon :icon="trashOutline"></ion-icon>
        </button>
      </div>
    </div>
    <!-- 删除确认对话框 -->
    <ion-modal
      v-model="showDeleteModal"
      :is-open="showDeleteModal"
      @didDismiss="onDeleteModalDismiss"
    >
      <ion-header>
        <ion-toolbar>
          <ion-title>确认删除</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showDeleteModal = false">取消</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <p>确定要删除图片 "{{ currentFileToDelete?.fileName }}" 吗？</p>
      </ion-content>
      <ion-footer>
        <ion-toolbar>
          <ion-buttons>
            <ion-button @click="deleteFile()">确认删除</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-footer>
    </ion-modal>
    <ion-footer>
      <ion-toolbar>
        <ion-item>
          <ion-input v-model="msg" :placeholder="placeholder"></ion-input>
          <ion-button fill="clear" color="dark" @click="uploadButtonClick">
            <ion-icon :icon="addCircleOutline"></ion-icon>
          </ion-button>
          <ion-button @click="handleSend">{{
            isResponsing ? '停止' : '发送'
          }}</ion-button>
        </ion-item>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script lang="ts" setup>
import {
  IonPage,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonFooter,
  IonToolbar,
  IonIcon,
  IonSpinner,
  IonModal,
} from '@ionic/vue';
import { ref, Ref, computed } from 'vue';
import { addCircleOutline, trashOutline } from 'ionicons/icons';
import { cozeClient } from '@/utils/coze/cozeClient';
import { RoleType, ChatEventType } from '@coze/api';
import { convertToBlobUrl } from '@/utils/utils';
import MarkdownIt from 'markdown-it';

// 定义数据
const placeholder = ref('发送消息······');
const msg = ref('');
const md = new MarkdownIt({
  html: true, // 允许HTML标签
  linkify: true, // 自动识别URL
  typographer: true, // 启用智能标点
});
const renderedContent = (markdownText: string) =>
  computed(() => md.render(markdownText));
interface streamingMessage {
  content: {
    type: string;
    text: string;
  };
  reasoning?: boolean;
  reasoningContent?: string;
  role: 'user' | 'assistant';
}
const streamingMessages: Ref<Array<streamingMessage>> = ref([
  {
    content: {
      type: 'text/plain',
      text: '嗨，你好！我是郑慧农 AI 助手，致力于为农业生产出谋划策，提升效率与质量。你可能想问👇',
    },
    reasoning: false,
    role: 'assistant',
  },
  {
    content: {
      type: 'text/plain',
      text: '<question>我的环境适合种什么农作物❓</question>',
    },
    reasoning: false,
    role: 'assistant',
  },
  {
    content: {
      type: 'text/plain',
      text: '<question>农作物出现病虫害怎么防治❓</question>',
    },
    reasoning: false,
    role: 'assistant',
  },
  {
    content: {
      type: 'text/plain',
      text: '<question>如何制定合理灌溉计划❓</question>',
    },
    reasoning: false,
    role: 'assistant',
  },
]);
const reasoningContent = ref('');
const answer = ref('');
const isResponsing = ref(false);
const isAbort = ref(false);
const controller = ref<AbortController | null>(null);
const followUp = ref<any[]>([]);
const uploadedFiles = ref<any[]>([]);

// 删除相关状态
const showDeleteModal = ref(false);
const currentFileToDelete = ref<any>(null);

// 查找最后一个 assistant 的索引
const findLastAssistantIndex = (arr: streamingMessage[]): number => {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i].role === 'assistant') {
      return i;
    }
  }
  return -1;
};

// 处理发送消息
const handleSend = async () => {
  if (isResponsing.value) {
    handleAbort();
  } else {
    await handleStreamingChat(msg.value);
    if (isAbort.value) {
      streamingMessages.value[
        findLastAssistantIndex(streamingMessages.value)
      ].content.text += '<br /><hr />用户终止了回答。';
    } else {
      msg.value = '';
      uploadedFiles.value = [];
    }
  }
};

// 处理流式聊天
const handleStreamingChat = async (query: string) => {
  followUp.value = [];
  if (!cozeClient || (uploadedFiles.value.length < 1 && query.length < 1)) {
    if (cozeClient) {
      console.log('请至少发送一条消息');
    }
    return;
  }
  for (const i of uploadedFiles.value) {
    streamingMessages.value.push({
      role: 'user',
      content: {
        type: i.fileType,
        text: i.fileBlobUrl,
      },
    });
  }
  if (query.length > 0) {
    streamingMessages.value.push({
      role: 'user',
      content: {
        type: 'text/plain',
        text: query,
      },
    });
  }
  streamingMessages.value.push({
    role: 'assistant',
    reasoning: false,
    reasoningContent: '',
    content: {
      type: 'text/plain',
      text: '',
    },
  });
  try {
    controller.value = new AbortController();
    isResponsing.value = true;
    isAbort.value = false;
    const imageFiles = () => {
      const filesArr = [];
      for (const i of uploadedFiles.value) {
        filesArr.push({
          type: 'file',
          file_id: i.fileId,
        });
      }
      return filesArr;
    };
    const addData: Array<{ type: string; text?: string; file_id?: string }> = [
      ...imageFiles(),
    ];
    if (query.length > 0) {
      addData.push({
        type: 'text',
        text: query,
      });
    }
    const res = cozeClient.chat.stream(
      {
        bot_id: '7459240184144773159', // 替换为实际的 bot_id
        user_id: 'gcb',
        additional_messages: [
          {
            role: RoleType.User,
            content:
              uploadedFiles.value.length > 0 ? JSON.stringify(addData) : query,
            content_type:
              uploadedFiles.value.length > 0 ? 'object_string' : 'text',
          },
        ],
      },
      {
        signal: controller.value?.signal,
      }
    );
    for await (const chunk of res) {
      if (chunk.event === ChatEventType.CONVERSATION_CHAT_FAILED) {
        console.error('Chat failed:', chunk.data.last_error?.msg);
        isResponsing.value = false;
      } else if (chunk.event === ChatEventType.CONVERSATION_CHAT_IN_PROGRESS) {
        // 处理聊天进行中
      } else if (chunk.event === ChatEventType.CONVERSATION_MESSAGE_DELTA) {
        const isReasoning = Object.prototype.hasOwnProperty.call(
          chunk.data,
          'reasoning_content'
        );
        const reasoningContentLength =
          isReasoning && (chunk.data as any)?.reasoning_content?.length > 0;
        streamingMessages.value[
          findLastAssistantIndex(streamingMessages.value)
        ].reasoning = isReasoning;
        if (chunk.data.content.length > 0) {
          answer.value += chunk.data.content;
          streamingMessages.value[
            findLastAssistantIndex(streamingMessages.value)
          ].content.text = renderedContent(answer.value).value;
        } else if (reasoningContentLength) {
          reasoningContent.value +=
            (chunk.data as any)?.reasoning_content ?? '';
          streamingMessages.value[
            findLastAssistantIndex(streamingMessages.value)
          ].reasoningContent = reasoningContent.value;
        }
      } else if (chunk.event === ChatEventType.CONVERSATION_MESSAGE_COMPLETED) {
        if (chunk.data.type === 'follow_up') {
          followUp.value.push({
            content: {
              type: 'text/plain',
              text: `<question>${chunk.data.content}❓</question>`,
            },
            reasoning: false,
            role: 'assistant',
          });
        }
        answer.value = answer.value.slice(0, 1);
        reasoningContent.value = reasoningContent.value.slice(0, 1);
      } else if (chunk.event === ChatEventType.CONVERSATION_CHAT_COMPLETED) {
        answer.value = '';
        reasoningContent.value = '';
        streamingMessages.value.push(...followUp.value);
      } else if (chunk.event === ChatEventType.DONE) {
        isResponsing.value = false;
      }
    }
  } catch (err) {
    isResponsing.value = false;
    console.error('handleStreamingChat error:', err);
  }
};

// 处理终止请求
const handleAbort = () => {
  controller.value?.abort();
  isAbort.value = true;
  isResponsing.value = false;
};

// 预发送消息
const preSend = async (query: string) => {
  msg.value = query;
  await handleSend();
};

// 上传图片按钮点击事件
const uploadButtonClick = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = 'image/*';
  input.addEventListener('change', async () => {
    const files = input.files;
    if (files) {
      const tempFiles = Array.from(files);
      await uploadImages(tempFiles);
    }
  });
  input.click();

  const uploadImages = async (tempFiles: File[]) => {
    if (!cozeClient || uploadedFiles.value.length + tempFiles.length > 10) {
      if (uploadedFiles.value.length + tempFiles.length > 10) {
        console.log('最多上传10个文件！');
      }
      return;
    }
    for (const file of tempFiles) {
      uploadedFiles.value.push({
        fileType: file.type,
        fileBlobUrl: await convertToBlobUrl(file),
        filePath: '',
        fileName: file.name,
        isUploading: true,
        fileSize: 0,
        createdAt: Date.now(),
        fileId: '',
        showDeleteButton: false, // 新增删除按钮状态
      });
      try {
        const result = await cozeClient.files.upload({
          file: file,
        });
        const to = uploadedFiles.value.find(
          (i) => i.fileName === result.file_name
        );
        if (to) {
          to.fileSize = result.bytes;
          to.createdAt = result.created_at;
          to.fileId = result.id;
        }
      } catch (error) {
        console.error('Upload failed=>', error);
        console.log(`文件${file.name}上传失败~！`);
      } finally {
        const to = uploadedFiles.value.find((i) => i.fileName === file.name);
        if (to) {
          to.isUploading = false;
        }
      }
    }
  };
};

// 显示删除按钮
const showDeleteButton = (file: any) => {
  // 只在上传完成后显示删除按钮
  if (!file.isUploading) {
    // 先隐藏所有其他文件的删除按钮
    uploadedFiles.value.forEach((f) => {
      f.showDeleteButton = false;
    });
    // 显示当前文件的删除按钮
    file.showDeleteButton = true;
  }
};

// 确认删除文件
const confirmDelete = (file: any) => {
  currentFileToDelete.value = file;
  showDeleteModal.value = true;
};

// 删除文件
const deleteFile = () => {
  if (currentFileToDelete.value) {
    const fileId = currentFileToDelete.value.fileId;
    // 从数组中删除文件
    uploadedFiles.value = uploadedFiles.value.filter(
      (file) => file.fileId !== fileId
    );
    // 关闭模态框
    showDeleteModal.value = false;
    currentFileToDelete.value = null;
  }
};

// 模态框关闭回调
const onDeleteModalDismiss = () => {
  // 重置所有文件的删除按钮状态
  uploadedFiles.value.forEach((file) => {
    file.showDeleteButton = false;
  });
};
</script>

<style scoped>
/* 美化聊天界面 */
ion-item {
  --background: transparent;
  border-bottom: 1px solid #ccc;
  padding: 10px;
  margin: 5px;
  border-radius: 10px;
  background-color: #f9f9f9;
}

ion-label div {
  padding: 5px;
}

ion-label button {
  margin-top: 5px;
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 5px 10px;
}

ion-label button:hover {
  background-color: #0056b3;
}

/* 图片预览区域样式 */
.image-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 5px;
  background-color: #eee;
}

.image-preview-item {
  width: 60px;
  height: 60px;
  position: relative;
  cursor: pointer;
}

.image-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 5px;
}

.loading-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #007aff;
  z-index: 10;
}

/* 删除按钮样式 */
.delete-button {
  position: absolute;
  top: 2px;
  right: 2px;
  background-color: rgba(255, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.delete-button:hover {
  background-color: rgba(255, 0, 0, 0.9);
}
</style>

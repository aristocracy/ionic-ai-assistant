/* eslint-disable @typescript-eslint/no-explicit-any */
/*
适用于typescript和vue3项目
*/
import { ref } from 'vue';
import { AbortController } from '@coze/uniapp-api';
import { WorkflowEventType } from '@coze/api';
import { cozeClient } from './cozeClient';
export function useWorkflow() {
    const streamingMessage = ref('');
    const isResponsing = ref(false);
    const controller = ref(null);
    const handleWorkflow = async () => {
        if (!cozeClient) {
            return;
        }
        streamingMessage.value = '';
        try {
            controller.value = new AbortController();
            isResponsing.value = true;
            const res = await cozeClient.workflows.runs.stream({
                workflow_id: import.meta.env.VITE_COZE_WORKFLOW_ID || '',
                parameters: {
                    norco: 'JavaScript',
                },
                bot_id: import.meta.env.VITE_COZE_BOT_ID || '',
            }, {
                signal: controller.value?.signal,
            });
            for await (const event of res) {
                if (event.event === WorkflowEventType.MESSAGE) {
                    streamingMessage.value += event.data?.content;
                }
            }
            isResponsing.value = false;
        }
        catch (e) {
            isResponsing.value = false;
            console.log('failed: ', e);
        }
    };
    const handleAbort = () => {
        controller.value?.abort();
        isResponsing.value = false;
    };
    return {
        streamingMessage,
        isResponsing,
        handleWorkflow,
        handleAbort,
    };
}
import { CozeAPI } from '@coze/api';
export const createCozeClient = () => {
  return new CozeAPI({
    baseURL: 'https://api.coze.cn',
    token:
      'pat_NaGF9TupI0nTVl9ua4jmraRn6RofU8CZTET1OSJakgSb79mxI1tkR6GE5F1Ssqx1',
    allowPersonalAccessTokenInBrowser: true, // only for test
  });
};
export const cozeClient = createCozeClient();

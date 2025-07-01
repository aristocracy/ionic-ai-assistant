export function convertToBlobUrl(filePath) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const blob = new Blob([e.target.result], { type: filePath.type });
      const url = window.URL.createObjectURL(blob);
      resolve(url);
    };
    reader.readAsArrayBuffer(filePath);
  });
}

export function getMimeTypeByFileHeader(filePath) {
  return new Promise((resolve) => {
    const extname = filePath.split('.').pop().toLowerCase();
    const mimeMap = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
      txt: 'text/plain',
      mp3: 'audio/mpeg',
      mp4: 'video/mp4',
      json: 'application/json',
      html: 'text/html',
      css: 'text/css',
      js: 'application/javascript',
      // 可根据需要扩展更多类型
    };
    resolve(mimeMap[extname]) || resolve('application/octet-stream');
  });
}

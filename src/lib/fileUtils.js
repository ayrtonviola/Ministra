export const dataUrlToFile = (dataUrl, fileName) => {
  if (!dataUrl) return null;
  try {
    const arr = dataUrl.split(',');
    if (arr.length < 2) return null;
    const mimeArr = arr[0].match(/:(.*?);/);
    if (!mimeArr || mimeArr.length < 2) return null;
    const mime = mimeArr[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], fileName, { type: mime });
  } catch (error) {
    console.error("Error converting data URL to File:", error);
    return null;
  }
};

export const fileToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
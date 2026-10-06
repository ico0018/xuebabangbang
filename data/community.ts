type CommunityConfig = {
  title: string;
  description: string;
  qr: {
    // Use a real, local image in public/ so the download link works on phones.
    src: string | null;
    alt: string;
    caption: string;
    mobileHint: string;
    downloadLabel: string;
    downloadFilename: string;
    placeholderTitle: string;
    placeholderStatus: string;
  };
};

export const community: CommunityConfig = {
  title: "有建议，来群里聊",
  description: "哪里不好用，或者想要什么小工具，都可以说。",
  qr: {
    src: null,
    alt: "学霸帮帮微信交流群二维码",
    caption: "微信扫码进群",
    mobileHint: "点击放大，长按图片识别或保存",
    downloadLabel: "保存图片",
    downloadFilename: "学霸帮帮-群二维码.png",
    placeholderTitle: "群二维码",
    placeholderStatus: "待提供",
  },
};

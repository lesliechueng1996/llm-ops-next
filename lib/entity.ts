/**
 * 文件上传相关的常量配置
 * 定义了允许的图片文件类型和大小限制
 */

/**
 * 允许上传的图片文件扩展名列表
 * 支持的格式包括：PNG、JPG、JPEG、GIF、WEBP、SVG
 */
export const ALLOWED_IMAGE_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
];

/**
 * 允许上传的图片文件大小限制
 * 设置为 5MB (5 * 1024 * 1024 字节)
 */
export const ALLOWED_IMAGE_SIZE = 1024 * 1024 * 5;

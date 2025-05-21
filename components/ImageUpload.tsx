/**
 * ImageUpload 组件
 *
 * 一个可重用的图片上传组件，支持以下功能：
 * - 图片预览
 * - 图片上传到腾讯云 COS
 * - 自动上传或手动上传模式
 * - 支持图片删除
 * - 支持自定义样式和标签
 *
 * @component
 */

'use client';

import { generateCredentialAction } from '@/actions/upload-file-action';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ALLOWED_IMAGE_EXTENSIONS, ALLOWED_IMAGE_SIZE } from '@/lib/entity';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import COS from 'cos-js-sdk-v5';
import { Eye, Plus, Trash2 } from 'lucide-react';
import {
  type ChangeEventHandler,
  type RefObject,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { getActionErrorMsg } from '@/lib/utils';

/**
 * ImageUpload 组件的引用类型定义
 * 提供对外暴露的 uploadImage 方法
 */
export type ImageUploadRef = {
  uploadImage: () => Promise<string | null>;
};

/**
 * ImageUpload 组件的属性类型定义
 */
type Props = {
  /** 输入框的唯一标识符 */
  id?: string;
  /** 图片的替代文本 */
  alt: string;
  /** 初始图片 URL */
  imageUrl?: string;
  /** 允许的图片扩展名列表 */
  allowedExtensions?: string[];
  /** 自定义 CSS 类名 */
  className?: string;
  /** 上传按钮的标签文本 */
  label?: string;
  /** 组件引用 */
  ref?: RefObject<ImageUploadRef | null>;
  /** 是否必填 */
  required?: boolean;
  /** 自动上传回调函数 */
  onAutoUpload?: (url: string | null) => Promise<void>;
};

const ImageUpload = ({
  id,
  alt,
  imageUrl,
  className,
  allowedExtensions = ALLOWED_IMAGE_EXTENSIONS,
  label = '上传图片',
  ref,
  required = false,
  onAutoUpload,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl || null);
  const [isPending, setIsPending] = useState(false);

  useImperativeHandle(ref, () => {
    return {
      uploadImage,
    };
  });

  /**
   * 处理图片变更事件
   * 创建本地预览并可选地触发自动上传
   */
  const handleImageChange: ChangeEventHandler<HTMLInputElement> = async () => {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      return;
    }

    if (previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(URL.createObjectURL(file));

    if (onAutoUpload) {
      const url = await uploadImage();
      onAutoUpload(url);
    }
  };

  /**
   * 清除已选择的图片
   * 释放 blob URL 并重置输入框
   */
  const handleClear = () => {
    if (previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  /**
   * 上传图片到腾讯云 COS
   * @returns {Promise<string | null>} 上传成功返回图片 URL，失败返回 null
   */
  const uploadImage = async () => {
    const file = inputRef.current?.files?.[0];
    if (!file && !imageUrl && required) {
      toast.error('请上传图片');
      return null;
    }

    if (!file) {
      return imageUrl || null;
    }

    try {
      setIsPending(true);

      const res = await generateCredentialAction({
        fileName: file.name,
        fileSize: file.size,
      });

      if (!res?.data) {
        toast.error(getActionErrorMsg(res, '上传失败'));
        return null;
      }

      const { credential, key, bucket } = res.data;

      const cos = new COS({
        SecretId: credential.tmpSecretId,
        SecretKey: credential.tmpSecretKey,
        SecurityToken: credential.sessionToken,
        StartTime: credential.startTime,
        ExpiredTime: credential.expiredTime,
      });
      const promise = new Promise<string | null>((resolve) => {
        cos.uploadFile(
          {
            Bucket: bucket.name,
            Region: bucket.region,
            Key: key,
            Body: file,
            SliceSize: ALLOWED_IMAGE_SIZE,
          },
          (err, data) => {
            if (err) {
              toast.error('上传失败');
              resolve(null);
              return;
            }

            toast.success('上传成功');
            const url = `${bucket.schema}://${data.Location}`;
            resolve(url);
          },
        );
      });

      return await promise;
    } catch (error) {
      console.error('error', error);
      toast.error('上传失败');
      return null;
    } finally {
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      setIsPending(false);
    }
  };

  return (
    <div>
      {previewUrl ? (
        <div
          aria-label="Hover or focus to show buttons"
          className={cn(
            'size-20 bg-muted rounded-lg overflow-hidden relative group',
            className,
          )}
        >
          <Avatar className="w-full h-full rounded-lg">
            <AvatarImage src={previewUrl} alt={alt} />
          </Avatar>
          {isPending ? (
            <div className="absolute left-0 top-0 w-full h-full bg-gray-500/80">
              <div className="flex justify-center items-center w-full h-full">
                <p className="text-white text-xs">上传中...</p>
              </div>
            </div>
          ) : (
            <div className="flex text-white justify-around items-center absolute top-0 left-0 w-full h-full bg-gray-500/80 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
              <Dialog>
                <DialogTrigger>
                  <Eye size={16} />
                </DialogTrigger>
                <DialogContent className="w-fit border-none">
                  <VisuallyHidden asChild>
                    <DialogHeader>
                      <DialogTitle>预览图片</DialogTitle>
                      <DialogDescription>预览{alt}</DialogDescription>
                    </DialogHeader>
                  </VisuallyHidden>
                  <img src={previewUrl} alt={alt} width="200" height="200" />
                </DialogContent>
              </Dialog>

              <Separator orientation="vertical" className="h-4" />
              <button type="button" onClick={handleClear}>
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          className={cn(
            'size-20 bg-muted rounded-lg overflow-hidden flex items-center justify-center border',
            className,
          )}
          onClick={() => inputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-0.5">
            <Plus size={16} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </button>
      )}

      <input
        id={id}
        ref={inputRef}
        hidden
        type="file"
        accept={allowedExtensions.map((ext) => `image/${ext}`).join(',')}
        max={ALLOWED_IMAGE_SIZE}
        onChange={handleImageChange}
      />
    </div>
  );
};

export default ImageUpload;

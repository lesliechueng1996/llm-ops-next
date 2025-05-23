/**
 * 账号设置组件
 *
 * 该组件提供了用户账号相关的设置功能，包括：
 * - 头像上传和更新
 * - 昵称修改
 * - 密码修改
 * - 邮箱显示
 *
 * 所有设置项都通过服务器端操作进行更新，并提供了适当的错误处理和用户反馈。
 */

'use client';

import {
  updateAvatarAction,
  updateNameAction,
  updatePasswordAction,
} from '@/actions/user-action';
import ImageUpload from '@/components/ImageUpload';
import LabelWrap from '@/components/LabelWrap';
import { useSession } from '@/lib/auth/auth-client';
import { getActionErrorMsg } from '@/lib/utils';
import {
  updateAvatarReqSchema,
  updateNameReqSchema,
  updatePasswordReqSchema,
} from '@/schemas/user-schema';
import { useState } from 'react';
import { toast } from 'sonner';
import EditableField from './EditableField';
import { log } from '@/lib/logger';

const AccountSetting = () => {
  const { data: session, refetch } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 处理昵称更新
   * @param value - 新的昵称值
   */
  const handleNameSave = async (value: string) => {
    if (value === session?.user?.name) {
      return;
    }
    const result = updateNameReqSchema.safeParse({
      name: value,
    });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    try {
      setIsLoading(true);
      const res = await updateNameAction({ name: value });
      if (!res?.data) {
        toast.error(getActionErrorMsg(res, '昵称更新失败'));
        return;
      }
      refetch();
      toast.success('昵称更新成功');
    } catch (error) {
      toast.error('昵称更新失败');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理密码更新
   * @param value - 新的密码值
   */
  const handlePasswordSave = async (value: string) => {
    const result = updatePasswordReqSchema.safeParse({
      password: value,
    });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    try {
      setIsLoading(true);
      const res = await updatePasswordAction({ password: value });
      if (!res?.data) {
        toast.error(getActionErrorMsg(res, '密码更新失败'));
        return;
      }
      refetch();
      toast.success('密码更新成功');
    } catch (error) {
      toast.error('密码更新失败');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理头像上传
   * @param url - 上传后的头像URL
   */
  const handleAvatarUpload = async (url: string | null) => {
    if (!url) {
      toast.error('上传头像失败');
      return;
    }
    const result = updateAvatarReqSchema.safeParse({
      avatar: url,
    });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    try {
      log.info('Start update avatar');
      setIsLoading(true);
      const res = await updateAvatarAction({ avatar: url });
      if (!res?.data) {
        toast.error(getActionErrorMsg(res, '头像更新失败'));
        return;
      }
      refetch();
      toast.success('头像更新成功');
    } catch (error) {
      toast.error('头像更新失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold">账号设置</h1>

      <div className="space-y-6">
        <LabelWrap label="账号头像" htmlFor="avatar" required>
          <ImageUpload
            id="avatar"
            alt="账号头像"
            imageUrl={session?.user?.image ?? undefined}
            required
            className="rounded-full"
            onAutoUpload={handleAvatarUpload}
          />
        </LabelWrap>

        <LabelWrap label="账号昵称" htmlFor="name" required>
          <EditableField
            id="name"
            value={session?.user?.name ?? ''}
            displayValue={session?.user?.name ?? ''}
            type="text"
            isLoading={isLoading}
            onSave={handleNameSave}
          />
        </LabelWrap>

        <LabelWrap label="账号密码" htmlFor="password" required>
          <EditableField
            id="password"
            value={'123'}
            displayValue={'********'}
            type="password"
            isLoading={isLoading}
            onSave={handlePasswordSave}
          />
        </LabelWrap>

        <LabelWrap label="绑定邮箱" htmlFor="email" required>
          <span className="text-sm text-muted-foreground">
            {session?.user?.email ?? ''}
          </span>
        </LabelWrap>
      </div>
    </div>
  );
};

export default AccountSetting;

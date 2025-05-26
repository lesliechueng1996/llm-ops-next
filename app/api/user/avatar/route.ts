/**
 * 用户头像相关 API 路由
 * 提供修改用户头像的功能
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { updateAvatarReqSchema } from '@/schemas/user-schema';
import { updateUserAvatarById } from '@/services/user';

/**
 * @swagger
 * /api/user/avatar:
 *   patch:
 *     tags:
 *       - User
 *     summary: 修改当前登录账号头像
 *     description: 该接口主要用于修改当前登录账号的头像信息
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 description: 账号新头像的 URL 地址
 *                 example: "https://cdn.imooc.com/2024/05/14/218e5217-ab10-4634-9681-022867955f1b.png"
 *     responses:
 *       200:
 *         description: 修改成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: 修改头像成功
 */
export async function PATCH(request: Request) {
  try {
    const { userId } = await verifyApiKey();
    const data = await request.json();
    const { avatar } = updateAvatarReqSchema.parse(data);

    await updateUserAvatarById(avatar, userId);

    return successResult({}, 200, '修改头像成功');
  } catch (err) {
    return handleRouteError(err);
  }
}

/**
 * 用户信息相关 API 路由
 * 提供获取和更新用户信息的功能
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { getUserInfoById } from '@/services/user';

/**
 * @swagger
 * /api/user:
 *   get:
 *     tags:
 *       - User
 *     summary: 获取当前登录账号信息
 *     description: 该接口主要用于获取当前登录账号的信息，例如 id、账号名称、头像、邮箱等信息
 *     responses:
 *       200:
 *         description: 获取成功
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
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       description: 账号 id
 *                     name:
 *                       type: string
 *                       description: 账号昵称
 *                     email:
 *                       type: string
 *                       description: 账号邮箱
 *                     avatar:
 *                       type: string
 *                       description: 账号的头像 URL 地址
 *                     last_login_at:
 *                       type: integer
 *                       description: 账号最后一次登录时间戳（秒）
 *                     last_login_ip:
 *                       type: string
 *                       description: 账号最后一次登录的 ip 地址
 *                     created_at:
 *                       type: integer
 *                       description: 账号的注册时间戳（秒）
 *                 message:
 *                   type: string
 *                   example: 获取用户信息成功
 */
export async function GET(request: Request) {
  try {
    const { userId } = await verifyApiKey();
    const userInfo = await getUserInfoById(userId);

    return successResult(userInfo, 200, '获取用户信息成功');
  } catch (err) {
    return handleRouteError(err);
  }
}

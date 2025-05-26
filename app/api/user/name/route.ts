/**
 * 用户名称修改相关的 API 路由处理
 * 提供修改当前登录用户名称的功能
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { updateNameReqSchema } from '@/schemas/user-schema';
import { updateUserNameById } from '@/services/user';

/**
 * @swagger
 * /api/user/name:
 *   patch:
 *     tags:
 *       - User
 *     summary: 修改当前登录账号名称
 *     description: 该接口主要用于修改当前登录账号的名称，名称长度在 3-30 个字符
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: 新的账号名称，名称长度在 3-30 个字符
 *                 example: "泽辉呀"
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
 *                   example: 修改用户名成功
 */
export async function PATCH(request: Request) {
  try {
    const { userId } = await verifyApiKey();
    const data = await request.json();
    const { name } = updateNameReqSchema.parse(data);

    await updateUserNameById(name, userId);

    return successResult({}, 200, '修改用户名成功');
  } catch (err) {
    return handleRouteError(err);
  }
}

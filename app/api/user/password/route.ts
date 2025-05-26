/**
 * 用户密码修改相关的 API 路由处理
 * 提供修改当前登录用户密码的功能
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { updatePasswordReqSchema } from '@/schemas/user-schema';
import { updateUserPasswordById } from '@/services/user';

/**
 * @swagger
 * /api/user/password:
 *   patch:
 *     tags:
 *       - User
 *     summary: 修改当前登录账号密码
 *     description: 该接口用于修改当前登录的账号对应的密码，密码的长度在 8-16 位，并且至少包含一个字母、一个数字。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 description: 账户的新密码，密码的长度在 8-16 位，并且至少包含一个字母、一个数字
 *                 example: "imooc.com@zehuiya"
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
 *                   example: 修改当前登录账号密码成功
 */
export async function PATCH(request: Request) {
  try {
    const { userId } = await verifyApiKey();
    const data = await request.json();
    const { password } = updatePasswordReqSchema.parse(data);

    await updateUserPasswordById(password, userId);

    return successResult({}, 200, '修改密码成功');
  } catch (err) {
    return handleRouteError(err);
  }
}

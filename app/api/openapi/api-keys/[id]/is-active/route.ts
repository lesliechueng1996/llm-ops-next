type Params = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/openapi/api-keys/{id}/is-active:
 *   patch:
 *     tags:
 *       - OpenAPI
 *     summary: 修改 API 秘钥状态
 *     description: 该接口用于修改指定 API 秘钥的激活状态
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 需要修改的 API 秘钥 id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: 秘钥是否激活
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
 *                   example: 修改API秘钥状态成功
 */
export async function PATCH(request: Request, { params }: Params) {}

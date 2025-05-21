/**
 * 异常处理模块
 * 提供了一组基础异常类，用于处理不同类型的HTTP错误响应
 * 所有异常类都继承自BaseException，并包含错误代码和消息
 */

/**
 * 基础异常类
 * 扩展了Error类，添加了错误代码属性
 */
export class BaseException extends Error {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}

/**
 * 400 Bad Request 异常
 * 用于表示客户端请求无效的情况
 */
export class BadRequestException extends BaseException {
  constructor(message = 'Bad Request') {
    super(400, message);
  }
}

/**
 * 401 Unauthorized 异常
 * 用于表示需要认证但未提供有效认证信息的情况
 */
export class UnauthorizedException extends BaseException {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

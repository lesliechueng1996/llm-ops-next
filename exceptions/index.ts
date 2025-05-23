/**
 * 异常处理模块
 * 提供了一组基础异常类，用于处理不同类型的HTTP错误响应
 * 所有异常类都继承自BaseException，并包含错误代码和消息
 *
 * @module exceptions
 */

/**
 * 基础异常类
 * 扩展了Error类，添加了错误代码和结果代码属性
 *
 * @class BaseException
 * @extends Error
 */
export class BaseException extends Error {
  /** HTTP 状态码 */
  code: number;
  /** 业务结果代码 */
  resultCode: string;

  /**
   * @param {number} code - HTTP 状态码
   * @param {string} message - 错误消息
   * @param {string} resultCode - 业务结果代码
   */
  constructor(code: number, message: string, resultCode: string) {
    super(message);
    this.code = code;
    this.resultCode = resultCode;
  }
}

/**
 * 400 Bad Request 异常
 * 用于表示客户端请求无效的情况，如参数错误、格式错误等
 *
 * @class BadRequestException
 * @extends BaseException
 */
export class BadRequestException extends BaseException {
  /**
   * @param {string} [message='Bad Request'] - 错误消息
   */
  constructor(message = 'Bad Request') {
    super(400, message, 'BAD_REQUEST');
  }
}

/**
 * 401 Unauthorized 异常
 * 用于表示需要认证但未提供有效认证信息的情况
 *
 * @class UnauthorizedException
 * @extends BaseException
 */
export class UnauthorizedException extends BaseException {
  /**
   * @param {string} [message='Unauthorized'] - 错误消息
   */
  constructor(message = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

/**
 * 403 Forbidden 异常
 * 用于表示服务器理解请求但拒绝执行的情况，通常是因为权限不足
 *
 * @class ForbiddenException
 * @extends BaseException
 */
export class ForbiddenException extends BaseException {
  /**
   * @param {string} [message='Forbidden'] - 错误消息
   */
  constructor(message = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
  }
}

/**
 * 404 Not Found 异常
 * 用于表示请求的资源不存在的情况
 *
 * @class NotFoundException
 * @extends BaseException
 */
export class NotFoundException extends BaseException {
  /**
   * @param {string} [message='Not Found'] - 错误消息
   */
  constructor(message = 'Not Found') {
    super(404, message, 'NOT_FOUND');
  }
}

/**
 * 500 Internal Server Error 异常
 * 用于表示服务器内部错误的情况
 *
 * @class InternalServerErrorException
 * @extends BaseException
 */
export class InternalServerErrorException extends BaseException {
  /**
   * @param {string} [message='Internal Server Error'] - 错误消息
   */
  constructor(message = 'Internal Server Error') {
    super(500, message, 'INTERNAL_SERVER_ERROR');
  }
}

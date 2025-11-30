// import { BadRequestException, HttpException } from '@nestjs/common';
// import { QueryFailedError } from 'typeorm';

// /**
//  * TypeORM 错误代码映射
//  */
// const ERROR_CODES = {
//   DUPLICATE_ENTRY: 'ER_DUP_ENTRY',
//   FOREIGN_KEY_CONSTRAINT: 'ER_NO_REFERENCED_ROW_2',
//   DATA_TOO_LONG: 'ER_DATA_TOO_LONG',
//   BAD_NULL_ERROR: 'ER_BAD_NULL_ERROR',
// } as const;

// /**
//  * 唯一键字段映射 - 用于识别唯一键冲突的具体字段
//  * key: 字段名（如 account, email, name, roleKey）
//  * value: 对应的中文错误信息
//  */
// const UNIQUE_KEY_FIELDS: Record<string, string> = {
//   account: '账号',
//   email: '邮箱',
//   name: '名称',
//   roleKey: '角色权限字符串',
//   phone: '手机号',
//   username: '用户名',
// };

// /**
//  * 处理 TypeORM 异常，转换为语义化的 HttpException
//  * @param error TypeORM 异常对象
//  * @param context 上下文信息，包含查询参数等，用于生成更清晰的错误信息
//  * @returns HttpException
//  */
// export function handleTypeOrmError(
//   error: any,
//   context?: {
//     /** 查询参数对象，用于识别唯一键冲突的具体字段 */
//     params?: Record<string, any>;
//     /** 自定义错误消息映射 */
//     customMessages?: Record<string, string>;
//   },
// ): HttpException {
//   // 如果不是 QueryFailedError，直接抛出原始错误
//   if (!(error instanceof QueryFailedError)) {
//     throw error;
//   }

//   const code = error || (error as any).driverError?.code;
//   const sqlMessage = String(
//     (error as any).sqlMessage ||
//       (error as any).message ||
//       error.message ||
//       '',
//   );
//   const params = context?.params || {};
//   const customMessages = context?.customMessages || {};

//   // 唯一键冲突
//   if (code === ERROR_CODES.DUPLICATE_ENTRY) {
//     // 尝试从错误信息中提取字段名
//     // MySQL 错误信息格式通常是: "Duplicate entry 'value' for key 'key_name'"
//     // 或者: "Duplicate entry 'value' for key 'table.field'"
//     const keyMatch = sqlMessage.match(/for key ['"]([^'"]+)['"]/i);
//     const keyName = keyMatch ? keyMatch[1] : '';

//     // 检查是否是自定义消息
//     if (customMessages.duplicateEntry) {
//       return new BadRequestException(customMessages.duplicateEntry);
//     }

//     // 遍历参数，检查哪个字段的值在错误信息中
//     for (const [field, value] of Object.entries(params)) {
//       if (value && typeof value === 'string' && sqlMessage.includes(value)) {
//         const fieldName = UNIQUE_KEY_FIELDS[field] || field;
//         return new BadRequestException(`${fieldName}已存在`);
//       }
//     }

//     // 如果 keyName 包含字段名，尝试匹配
//     for (const [field, fieldName] of Object.entries(UNIQUE_KEY_FIELDS)) {
//       if (keyName.includes(field) || keyName.toLowerCase().includes(field.toLowerCase())) {
//         return new BadRequestException(`${fieldName}已存在`);
//       }
//     }

//     // 如果无法识别具体字段，返回通用错误
//     return new BadRequestException('唯一键冲突，数据已存在');
//   }

//   // 外键约束失败
//   if (
//     code === ERROR_CODES.FOREIGN_KEY_CONSTRAINT ||
//     sqlMessage.includes('a foreign key constraint fails')
//   ) {
//     if (customMessages.foreignKey) {
//       return new BadRequestException(customMessages.foreignKey);
//     }
//     return new BadRequestException('关联对象不存在');
//   }

//   // 数据长度超出限制
//   if (code === ERROR_CODES.DATA_TOO_LONG) {
//     if (customMessages.dataTooLong) {
//       return new BadRequestException(customMessages.dataTooLong);
//     }
//     // 尝试从错误信息中提取字段名
//     const fieldMatch = sqlMessage.match(/column ['"]([^'"]+)['"]/i);
//     if (fieldMatch) {
//       const fieldName = UNIQUE_KEY_FIELDS[fieldMatch[1]] || fieldMatch[1];
//       return new BadRequestException(`${fieldName}长度超出限制`);
//     }
//     return new BadRequestException('字段长度超出限制');
//   }

//   // 必填字段为空
//   if (code === ERROR_CODES.BAD_NULL_ERROR) {
//     if (customMessages.badNull) {
//       return new BadRequestException(customMessages.badNull);
//     }
//     // 尝试从错误信息中提取字段名
//     const fieldMatch = sqlMessage.match(/column ['"]([^'"]+)['"]/i);
//     if (fieldMatch) {
//       const fieldName = UNIQUE_KEY_FIELDS[fieldMatch[1]] || fieldMatch[1];
//       return new BadRequestException(`${fieldName}不能为空`);
//     }
//     return new BadRequestException('必填字段为空');
//   }

//   // 其他数据库错误，返回通用错误信息
//   if (customMessages.default) {
//     return new BadRequestException(customMessages.default);
//   }

//   // 对于未知错误，记录详细信息但返回通用错误
//   console.error('未处理的 TypeORM 错误:', {
//     code,
//     sqlMessage,
//     error: error.message,
//   });
//   return new BadRequestException('数据库操作失败');
// }

import { Injectable } from '@nestjs/common';
import { Logger, QueryRunner } from 'typeorm';
import { LoggingService } from '../logging/logging.service';

/**
 * TypeORM 自定义日志记录器
 * 将 TypeORM 的 SQL 日志重定向到项目的日志系统
 * 
 * 注意：这些方法都是 TypeORM 框架自动调用的，不需要手动调用
 * - logQuery: 每次执行 SQL 查询时自动调用（需要在 TypeORM 配置中设置 logging: true）
 * - logQueryError: SQL 查询出错时自动调用
 * - logQuerySlow: 查询执行时间超过 maxQueryExecutionTime 时自动调用（需要配置 maxQueryExecutionTime）
 * - logSchemaBuild: 执行 schema 同步时自动调用
 * - logMigration: 执行数据库迁移时自动调用
 */
@Injectable()
export class TypeOrmLoggerService implements Logger {
  // 是否记录所有查询日志（可通过环境变量 LOG_ALL_QUERIES 控制，默认 false）
  // 如果设置为 false，则只记录慢查询和错误，不记录普通查询
  private readonly logAllQueries: boolean;

  constructor(private readonly loggingService: LoggingService) {
    // 通过环境变量控制是否记录所有查询
    // LOG_ALL_QUERIES=true 时记录所有查询
    // LOG_ALL_QUERIES=false 或未设置时，只记录慢查询和错误
    this.logAllQueries = process.env.LOG_ALL_QUERIES === 'true';
  }

  /**
   * 记录查询日志
   * TypeORM 会在每次执行 SQL 查询时自动调用此方法
   * 触发条件：TypeORM 配置中设置了 logging: true
   * 
   * 注意：
   * - 如果不需要记录所有查询，可以通过环境变量 LOG_ALL_QUERIES=false 来禁用
   * - 禁用后，只会记录慢查询（logQuerySlow）和错误（logQueryError），不会记录普通查询
   * - 方法必须实现（TypeORM Logger 接口要求），但可以为空实现
   */
  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    // // 如果配置为不记录所有查询，则直接返回（空实现）
    // if (!this.logAllQueries) {
    //   return;
    // }
    
    const sql = this.formatQuery(query, parameters);
    const formattedSql = this.beautifySql(sql);
    this.loggingService.debug(`[TypeORM Query]`, {
      query: formattedSql,
    });
  }

  /**
   * 记录查询错误
   * TypeORM 会在 SQL 查询执行出错时自动调用此方法
   * 触发条件：SQL 执行抛出异常
   */
  logQueryError(
    error: string | Error,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ) {
    const sql = this.formatQuery(query, parameters);
    const formattedSql = this.beautifySql(sql);
    this.loggingService.error(`[TypeORM Query Error]`, {
      query: formattedSql,
      error: error,
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  /**
   * 记录慢查询
   * TypeORM 会在查询执行时间超过 maxQueryExecutionTime 时自动调用此方法
   * 触发条件：在 TypeORM 配置中设置了 maxQueryExecutionTime（单位：毫秒）
   * 
   * @param time - 查询执行时间（毫秒），由 TypeORM 自动测量并传入
   * @param query - SQL 查询语句
   * @param parameters - SQL 参数
   * @param queryRunner - 查询运行器
   * 
   * 示例：如果配置 maxQueryExecutionTime: 1000，则执行时间超过 1 秒的查询会触发此方法
   */
  logQuerySlow(
    time: number,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ) {
    const sql = this.formatQuery(query, parameters);
    const formattedSql = this.beautifySql(sql);
    this.loggingService.warn(`[TypeORM Slow Query]`, {
      executionTime: time,
      query: formattedSql,
    });
  }

  /**
   * 记录架构构建日志
   * TypeORM 会在执行 schema 同步时自动调用此方法
   * 触发条件：使用 synchronize: true 或手动执行 schema 操作
   */
  logSchemaBuild(message: string, queryRunner?: QueryRunner) {
    this.loggingService.debug(`[TypeORM Schema]`,{ schemaMessage:message});
  }

  /**
   * 记录迁移日志
   * TypeORM 会在执行数据库迁移时自动调用此方法
   * 触发条件：执行 TypeORM 迁移命令（migration:run）
   */
  logMigration(message: string, queryRunner?: QueryRunner) {
    this.loggingService.log(`[TypeORM Migration]`,{ migrationMessage:message});
  }

  /**
   * 通用日志方法
   * TypeORM 内部使用，用于记录其他类型的日志
   */
  log(level: 'log' | 'info' | 'warn', message: any, queryRunner?: QueryRunner) {
    switch (level) {
      case 'log':
      case 'info':
        this.loggingService.log(`[TypeORM]`,{ message:message});
        break;
      case 'warn':
        this.loggingService.warn(`[TypeORM]`,{ message:message});
        break;
    }
  }

  /**
   * 格式化 SQL 查询，包含参数
   * 注意：这是一个简化的实现，主要用于日志记录
   * 对于复杂的 SQL（如包含字符串中的?），可能需要更复杂的处理
   */
  private formatQuery(query: string, parameters?: any[]): string {
    if (!parameters || parameters.length === 0) {
      return query;
    }

    // 将参数值替换到 SQL 中，便于阅读
    // MySQL 使用 ? 作为占位符
    let formattedQuery = query;
    let paramIndex = 0;
    
    // 逐个替换 ? 占位符
    formattedQuery = formattedQuery.replace(/\?/g, () => {
      if (paramIndex < parameters.length) {
        const param = parameters[paramIndex++];
        // 处理不同类型的参数
        if (param === null || param === undefined) {
          return 'NULL';
        }
        if (typeof param === 'string') {
          // 转义单引号
          const escaped = param.replace(/'/g, "''");
          return `'${escaped}'`;
        }
        if (typeof param === 'number' || typeof param === 'boolean') {
          return String(param);
        }
        if (param instanceof Date) {
          return `'${param.toISOString()}'`;
        }
        // 对于对象和数组，转换为 JSON 字符串
        return `'${JSON.stringify(param).replace(/'/g, "''")}'`;
      }
      return '?';
    });

    return formattedQuery;
  }

  /**
   * 格式化 SQL 语句，提高可读性
   * - 添加换行和缩进
   * - 格式化 SELECT、FROM、WHERE、JOIN 等关键字
   */
  private beautifySql(sql: string): string {
    if (!sql || sql.trim().length === 0) {
      return sql;
    }

    let beautified = sql;

    // 处理 SELECT 语句的字段列表
    if (beautified.trim().toUpperCase().startsWith('SELECT')) {
      // 匹配 SELECT ... FROM 之间的内容
      const selectMatch = beautified.match(/SELECT\s+(.*?)\s+FROM/is);
      if (selectMatch) {
        const fieldsPart = selectMatch[1];
        // 如果字段列表很长（超过50个字符）或包含多个字段，分行显示
        if (fieldsPart.length > 50 || fieldsPart.includes(',')) {
          const fields = fieldsPart
            .split(',')
            .map(f => f.trim())
            .filter(f => f.length > 0);
          
          // 格式化字段，最后一个字段后面不加逗号
          const formattedFields = fields
            .map((f, index) => {
              const indent = '  ';
              const comma = index < fields.length - 1 ? ',' : '';
              return `${indent}${f}${comma}`;
            })
            .join('\n');
          
          beautified = beautified.replace(
            /SELECT\s+.*?\s+FROM/is,
            `SELECT\n${formattedFields}\nFROM`
          );
        }
      }
    }

    // 美化等号，添加空格
    beautified = beautified.replace(/([^=<>!])=([^=<>!])/g, '$1 = $2');

    // 格式化 SQL 关键字，添加换行和缩进
    // 注意：必须先处理复合关键字（LEFT JOIN等），再处理单独的关键字（JOIN），避免拆分
    beautified = beautified
      .replace(/\bFROM\b/gi, '\nFROM')
      .replace(/\bWHERE\b/gi, '\nWHERE')
      .replace(/\bLEFT JOIN\b/gi, '\n  LEFT JOIN')
      .replace(/\bRIGHT JOIN\b/gi, '\n  RIGHT JOIN')
      .replace(/\bINNER JOIN\b/gi, '\n  INNER JOIN')
      .replace(/\bFULL OUTER JOIN\b/gi, '\n  FULL OUTER JOIN')
      .replace(/\bON\b/gi, '\n    ON')
      .replace(/\bAND\b/gi, '\n    AND')
      .replace(/\bOR\b/gi, '\n    OR')
      .replace(/\bORDER BY\b/gi, '\nORDER BY')
      .replace(/\bGROUP BY\b/gi, '\nGROUP BY')
      .replace(/\bHAVING\b/gi, '\nHAVING')
      .replace(/\bLIMIT\b/gi, '\nLIMIT')
      .replace(/\bOFFSET\b/gi, '\nOFFSET')
      .replace(/\bINSERT INTO\b/gi, 'INSERT INTO')
      .replace(/\bUPDATE\b/gi, 'UPDATE')
      .replace(/\bSET\b/gi, '\nSET')
      .replace(/\bDELETE FROM\b/gi, 'DELETE FROM')
      .replace(/\bVALUES\b/gi, '\nVALUES');

    // 清理多余的空行和空格
    beautified = beautified
      .replace(/\n{3,}/g, '\n') // 多个空行合并为一个
      .replace(/^\s+/, '') // 移除开头的空白
      .replace(/\s+$/gm, '') // 移除每行末尾的空白
      .trim();

    return beautified;
  }
}

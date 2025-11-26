import { registerAs } from '@nestjs/config';

// 自定义配置文件
export default registerAs('database', () => {
    console.log(process.env.mysql_host);
    return {
        // 类型固定为mysql
        type: 'mysql',
        host: process.env.mysql_host,
        // 如果没给端口，默认 3306
        port: parseInt(process.env.mysql_port || '3306', 10),
        // 如果没给用户名，默认 root
        username: process.env.mysql_username || 'root',
        password: process.env.mysql_password,
        database: process.env.mysql_database,
    }
});
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysUser } from '@/system/user/entities/user.entity';
import { SysRole } from '@/system/role/entities/role.entity';
import { SysDept } from '@/system/dept/entities/dept.entity';
import { SysMenu } from '@/system/menu/entities/menu.entity';
import * as bcrypt from 'bcryptjs';
import { LoggingService } from '../logging/logging.service';

/**
 * 数据库种子服务
 * 用于在数据库初始化后自动写入初始数据
 */
@Injectable()
export class DatabaseSeedService {
  constructor(
    @InjectRepository(SysUser)
    private userRepository: Repository<SysUser>,
    @InjectRepository(SysRole)
    private roleRepository: Repository<SysRole>,
    @InjectRepository(SysDept)
    private deptRepository: Repository<SysDept>,
    @InjectRepository(SysMenu)
    private menuRepository: Repository<SysMenu>,
    private readonly loggingService: LoggingService,
  ) {}

  /**
   * 执行数据库种子数据初始化
   * 只在数据库为空时执行，避免重复插入
   */
  async seed(): Promise<void> {
    this.loggingService.log('开始初始化数据库种子数据...');
    try {
      // 检查是否已有数据，如果已有数据则跳过
      const userCount = await this.userRepository.count();
      if (userCount > 0) {
        this.loggingService.log('数据库已有数据，跳过种子数据初始化');

        return;
      }

      // 1. 创建部门
      const dept = await this.createDept();
      this.loggingService.log('部门数据初始化完成');

      // 2. 创建角色
      const role = await this.createRole();
      this.loggingService.log('角色数据初始化完成');

      // 3. 创建菜单
      await this.createMenus(role);
      this.loggingService.log('菜单数据初始化完成');

      // 4. 创建用户
      await this.createUser(dept, role);
      this.loggingService.log('用户数据初始化完成');

      this.loggingService.log('数据库种子数据初始化完成！');
    } catch (error) {
      this.loggingService.error('数据库种子数据初始化失败:', error);
    }
  }

  /**
   * 创建初始部门数据
   */
  private async createDept(): Promise<SysDept> {
    const dept = this.deptRepository.create({
      name: '若依NESTJS版',
      parentId: 0,
      ancestors: '0',
      sortOrder: 0,
      status: '1',
      updateBy: 'auto_seed',
      createBy: 'auto_seed',    
    });

    return await this.deptRepository.save(dept);
  }

  /**
   * 创建初始角色数据
   */
  private async createRole(): Promise<SysRole> {
    const role = this.roleRepository.create({
      name: '超级管理员',
      roleKey: 'admin',
      sortOrder: 0,
      dataScope: '1',
      status: '1',
      createBy: 'auto_seed',
      updateBy: 'auto_seed',
      remark: '超级管理员角色',
    });

    return await this.roleRepository.save(role);
  }

  /**
   * 创建初始菜单数据
   */
  private async createMenus(role: SysRole): Promise<void> {
    // 创建主菜单
    const systemMenu = this.menuRepository.create({
      name: '系统管理',
      parentId: 0,
      ancestors: '0',
      sortOrder: 1,
      path: '',
      menuType: 'M',
      visible: '1',
      status: '1',
      isFrame: '0',
      createBy: 'auto_seed',
      updateBy: 'auto_seed',
    });
    const savedSystemMenu = await this.menuRepository.save(systemMenu);

    // 创建子菜单 - 用户管理
    const userMenu = this.menuRepository.create({
      name: '用户管理',
      parentId: savedSystemMenu.id,
      ancestors: `0,${savedSystemMenu.id}`,
      sortOrder: 1,
      path: '/system/user-management',
      menuType: 'C',
      visible: '1',
      status: '1',
      isFrame: '0',
      perms: 'system:user:list',
      createBy: 'auto_seed',
      updateBy: 'auto_seed',
    });
    const savedUserMenu = await this.menuRepository.save(userMenu);

    // 创建子菜单 - 角色管理
    const roleMenu = this.menuRepository.create({
      name: '角色管理',
      parentId: savedSystemMenu.id,
      ancestors: `0,${savedSystemMenu.id}`,
      sortOrder: 2,
      path: '/system/role-management',
      menuType: 'C',
      visible: '1',
      status: '1',
      isFrame: '0',
      perms: 'system:role:list',
      createBy: 'auto_seed',
      updateBy: 'auto_seed',
    });
    const savedRoleMenu = await this.menuRepository.save(roleMenu);

    // 创建子菜单 - 部门管理
    const deptMenu = this.menuRepository.create({
      name: '部门管理',
      parentId: savedSystemMenu.id,
      ancestors: `0,${savedSystemMenu.id}`,
      sortOrder: 3,
      path: '/system/dept-management',
      menuType: 'C',
      visible: '1',
      status: '1',
      isFrame: '0',
      perms: 'system:dept:list',
      createBy: 'auto_seed',
      updateBy: 'auto_seed',
    });
    const savedDeptMenu = await this.menuRepository.save(deptMenu);

    // 创建子菜单 - 菜单管理
    const menuMenu = this.menuRepository.create({
      name: '菜单管理',
      parentId: savedSystemMenu.id,
      ancestors: `0,${savedSystemMenu.id}`,
      sortOrder: 4,
      path: '/system/menu-management',
      menuType: 'C',
      visible: '1',
      status: '1',
      isFrame: '0',
      perms: 'system:menu:list',
      createBy: 'auto_seed',
      updateBy: 'auto_seed',
    });
    const savedMenuMenu = await this.menuRepository.save(menuMenu);

    // 将所有菜单关联到角色
    role.menus = [
      savedSystemMenu,
      savedUserMenu,
      savedRoleMenu,
      savedDeptMenu,
      savedMenuMenu,
    ];
    await this.roleRepository.save(role);
  }

  /**
   * 创建初始用户数据
   */
  private async createUser(dept: SysDept, role: SysRole): Promise<void> {
    // 默认密码：admin123，使用bcrypt加密
    const hashedPassword = await bcrypt.hash('admin123.', 10);

    const user = this.userRepository.create({
      name: '超级管理员',
      account: 'admin',
      email: 'admin@ruoyi.vip',
      sex: '1',
      avatar: '',
      password: hashedPassword,
      status: '1',
      dept: dept,
      roles: [role],
      createBy: 'auto_seed',
      updateBy: 'auto_seed',
    });

    await this.userRepository.save(user);
  }
}


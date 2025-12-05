import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysUser } from '@/system/user/entities/user.entity';
import { SysRole } from '@/system/role/entities/role.entity';
import { SysDept } from '@/system/dept/entities/dept.entity';
import { SysMenu } from '@/system/menu/entities/menu.entity';
import { SysDict } from '@/system/dict/entities/dict.entity';
import { SysDictData } from '@/system/dict/entities/dict-data.entity';
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
    @InjectRepository(SysDict)
    private dictRepository: Repository<SysDict>,
    @InjectRepository(SysDictData)
    private dictDataRepository: Repository<SysDictData>,
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

      // 4. 创建字典
      await this.createDicts();
      this.loggingService.log('字典数据初始化完成');

      // 5. 创建用户
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
    const dashboardMenu = this.menuRepository.create({
      name: '首页',
      parentId: 0,
      ancestors: '0',
      sortOrder: 0,
      path: 'dashboard',
      menuType: 'C',
      visible: '1',
      status: '1',
      isFrame: '0',
      createBy: 'auto_seed',
      updateBy: 'auto_seed',
    });
    const savedDashboardMenu = await this.menuRepository.save(dashboardMenu);

    // 创建主菜单
    const systemMenu = this.menuRepository.create({
      name: '系统管理',
      parentId: 0,
      ancestors: '0',
      sortOrder: 1,
      path: 'system',
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
      path: 'system/user-management',
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
      path: 'system/role-management',
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
      path: 'system/dept-management',
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
      path: 'system/menu-management',
      menuType: 'C',
      visible: '1',
      status: '1',
      isFrame: '0',
      perms: 'system:menu:list',
      createBy: 'auto_seed',
      updateBy: 'auto_seed',
    });
    const savedMenuMenu = await this.menuRepository.save(menuMenu);

    const dictMenu = this.menuRepository.create({
      name: '字典管理',
      parentId: savedSystemMenu.id,
      ancestors: `0,${savedSystemMenu.id}`,
      sortOrder: 5,
      path: 'system/dict-management',
      menuType: 'C',
      visible: '1',
      status: '1',
      isFrame: '0',
      perms: 'system:dict:list',
      createBy: 'auto_seed',
      updateBy: 'auto_seed',
    });
    const savedDictMenu = await this.menuRepository.save(dictMenu);

    const dictDataMenu = this.menuRepository.create({
      name: '字典数据管理',
      parentId: savedSystemMenu.id,
      ancestors: `0,${savedSystemMenu.id}`,
      sortOrder: 6,
      path: 'system/dict-data-management',
      menuType: 'C',
      visible: '0',
      status: '1',
      isFrame: '0',
      perms: 'system:dict-data:list',
      createBy: 'auto_seed',
      updateBy: 'auto_seed',
    });
    const savedDictDataMenu = await this.menuRepository.save(dictDataMenu);

    // 创建用户管理子路由按钮
    const userSubMenus = await this.createSubMenus(savedUserMenu, [
      { name: '删除', perms: 'system:user:remove', sortOrder: 0 },
      { name: '查询', perms: 'system:user:query', sortOrder: 1 },
      { name: '新增', perms: 'system:user:create', sortOrder: 2 },
      { name: '编辑', perms: 'system:user:edit', sortOrder: 3 },
      { name: '重置密码', perms: 'system:user:resetPwd', sortOrder: 4 },
    ]);

    // 创建角色管理子路由按钮
    const roleSubMenus = await this.createSubMenus(savedRoleMenu, [
      { name: '删除', perms: 'system:role:remove', sortOrder: 0 },
      { name: '查询', perms: 'system:role:query', sortOrder: 1 },
      { name: '新增', perms: 'system:role:create', sortOrder: 2 },
      { name: '编辑', perms: 'system:role:edit', sortOrder: 3 },
    ]);

    // 创建角色管理子路由按钮
    const menuSubMenus = await this.createSubMenus(savedMenuMenu, [
      { name: '删除', perms: 'system:menu:remove', sortOrder: 0 },
      { name: '查询', perms: 'system:menu:query', sortOrder: 1 },
      { name: '新增', perms: 'system:menu:create', sortOrder: 2 },
      { name: '编辑', perms: 'system:menu:edit', sortOrder: 3 },
    ]);

    // 创建部门管理子路由按钮
    const deptSubMenus = await this.createSubMenus(savedDeptMenu, [
      { name: '删除', perms: 'system:dept:remove', sortOrder: 0 },
      { name: '查询', perms: 'system:dept:query', sortOrder: 1 },
      { name: '新增', perms: 'system:dept:create', sortOrder: 2 },
      { name: '编辑', perms: 'system:dept:edit', sortOrder: 3 },
    ]);

    // 创建字典管理子路由按钮
    const dictSubMenus = await this.createSubMenus(savedDictMenu, [
      { name: '删除', perms: 'system:dict:remove', sortOrder: 0 },
      { name: '查询', perms: 'system:dict:query', sortOrder: 1 },
      { name: '新增', perms: 'system:dict:create', sortOrder: 2 },
      { name: '编辑', perms: 'system:dict:edit', sortOrder: 3 },
    ]);

    const dictDataSubMenus = await this.createSubMenus(savedDictDataMenu, [
      { name: '删除', perms: 'system:dict-data:remove', sortOrder: 0 },
      { name: '查询', perms: 'system:dict-data:query', sortOrder: 1 },
      { name: '新增', perms: 'system:dict-data:create', sortOrder: 2 },
      { name: '编辑', perms: 'system:dict-data:edit', sortOrder: 3 },
    ]);

    // 将所有菜单（包括子路由）关联到角色
    role.menus = [
      savedDashboardMenu,
      savedSystemMenu,
      savedUserMenu,
      ...userSubMenus,
      savedRoleMenu,
      ...roleSubMenus,
      savedDeptMenu,
      ...deptSubMenus,
      savedMenuMenu,
      ...menuSubMenus,
      savedDictMenu,
      savedDictDataMenu,
      ...dictSubMenus,
      ...dictDataSubMenus,
    ];
    await this.roleRepository.save(role);
  }

  /**
   * 创建菜单子路由按钮
   */
  private async createSubMenus(
    parentMenu: SysMenu,
    subMenuConfigs: Array<{ name: string; perms: string; sortOrder: number }>,
  ): Promise<SysMenu[]> {
    const subMenus = subMenuConfigs.map((config) =>
      this.menuRepository.create({
        name: config.name,
        parentId: parentMenu.id,
        ancestors: `${parentMenu.ancestors},${parentMenu.id}`,
        sortOrder: config.sortOrder,
        path: null,
        menuType: 'F',
        visible: '1',
        status: '1',
        isFrame: '0',
        perms: config.perms,
        createBy: 'auto_seed',
        updateBy: 'auto_seed',
      }),
    );

    return await this.menuRepository.save(subMenus);
  }

  /**
   * 创建初始字典数据
   */
  private async createDicts(): Promise<void> {
    const dictCount = await this.dictRepository.count();
    if (dictCount > 0) {
      return;
    }

    // 创建状态字典
    const statusDict = this.dictRepository.create({
      name: '系统状态',
      type: 'status',
      status: '1',
      sortOrder: 1,
      createBy: 'auto_seed',
      updateBy: 'auto_seed',
    });
    const savedStatusDict = await this.dictRepository.save(statusDict);

    // 创建性别字典
    const sexDict = this.dictRepository.create({
      name: '用户性别',
      type: 'sex',
      status: '1',
      sortOrder: 2,
      createBy: 'auto_seed',
      updateBy: 'auto_seed',
    });
    const savedSexDict = await this.dictRepository.save(sexDict);

    // 创建状态字典数据
    const statusDictData = [
      this.dictDataRepository.create({
        label: '启用',
        value: '1',
        sortOrder: 1,
        status: '1',
        dict: savedStatusDict,
        createBy: 'auto_seed',
        updateBy: 'auto_seed',
      }),
      this.dictDataRepository.create({
        label: '禁用',
        value: '0',
        sortOrder: 2,
        status: '1',
        dict: savedStatusDict,
        createBy: 'auto_seed',
        updateBy: 'auto_seed',
      }),
    ];

    // 创建性别字典数据
    const sexDictData = [
      this.dictDataRepository.create({
        label: '男',
        value: '1',
        sortOrder: 1,
        status: '1',
        dict: savedSexDict,
        createBy: 'auto_seed',
        updateBy: 'auto_seed',
      }),
      this.dictDataRepository.create({
        label: '女',
        value: '2',
        sortOrder: 2,
        status: '1',
        dict: savedSexDict,
        createBy: 'auto_seed',
        updateBy: 'auto_seed',
      }),
      this.dictDataRepository.create({
        label: '未知',
        value: '0',
        sortOrder: 3,
        status: '1',
        dict: savedSexDict,
        createBy: 'auto_seed',
        updateBy: 'auto_seed',
      }),
    ];

    await this.dictDataRepository.save([...statusDictData, ...sexDictData]);
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

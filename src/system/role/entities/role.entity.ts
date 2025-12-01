import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinTable,
  BeforeInsert,
  DeleteDateColumn,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { SysUser } from '@/system/user/entities/user.entity';
import { SysMenu } from '@/system/menu/entities/menu.entity';

@Entity('sys_role')
export class SysRole {
  @PrimaryGeneratedColumn({
    comment: '角色id，有序，自增，非uuid',
  })
  id: number;

  @Column({
    name: 'public_id',
    unique: true,
    comment: '角色公开id，唯一且与id一一对应，用于对外暴露',
  })
  publicId: string;

  @Column({length: 30, comment: '角色名称' })
  name: string;
  
  //暂时不知道是干啥的   
  @Column({ name: 'role_key', length: 100, comment: '角色权限字符串' })
  roleKey: string;

  @Column({ name: 'sort_order', type: 'int', comment: '显示顺序' })
  sortOrder: number;

  //暂时不知道是干啥的
  @Column({
    name: 'data_scope',
    length: 1,
    default: '5',
    comment: '数据范围',
  })
  dataScope: string;

  @Column({
    name: 'status',
    length: 1,
    default: '0',
    comment: '角色状态（0停用 1正常）', 
  })
  status: string;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', comment: '删除时间' })
  deletedAt: Date | null;

  @Column({ name: 'create_by', length: 64, default: '', comment: '创建者' })
  createBy: string;

  @CreateDateColumn({ name: 'create_time', type: 'datetime', comment: '创建时间' })
  createTime: Date;

  @Column({ name: 'update_by', length: 64, default: '', comment: '更新者' })
  updateBy: string;

  @UpdateDateColumn({
    name: 'update_time',
    type: 'datetime',
    comment: '更新时间',
  })
  updateTime: Date;

  @Column({ name: 'remark', length: 500, default: '', comment: '备注' })
  remark: string;

  // 角色用户关联 (通过 SysUser 的 @ManyToMany)
  @ManyToMany(() => SysUser, (user) => user.roles)
  users: SysUser[];

  // 角色菜单关联 (通过中间实体)
  @ManyToMany(() => SysMenu, (menu) => menu.roles)
  @JoinTable({
    name: 'sys_role_menu',
    joinColumn: { name: 'role_id'},
    inverseJoinColumn: { name: 'menu_id'},
  })
  menus: SysMenu[];

  @BeforeInsert()
  setPublicId() {
    if (!this.publicId) {
      this.publicId = randomUUID();
    }
  }
}
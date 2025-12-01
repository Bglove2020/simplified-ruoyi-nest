import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { SysRole } from '@/system/role/entities/role.entity';
import { randomUUID } from 'node:crypto';

@Entity('sys_menu')
@Index('uniq_sys_menu_name_active', ['activeName'], { unique: true })
@Index('uniq_sys_menu_path_active', ['activePath'], { unique: true })
@Index('uniq_sys_menu_perms_active', ['activePerms'], { unique: true })
export class SysMenu {
  @PrimaryGeneratedColumn({
    comment: '菜单id，有序，自增，非uuid',
  })
  id: number;

  @Column({
    name: 'public_id',
    unique: true,
    comment: '菜单公开id，唯一且与id一一对应，用于对外暴露',
  })
  publicId: string;

  @Column({ length: 50, comment: '菜单名称' })
  name: string;

  @Column({
    name: 'active_name',
    type: 'varchar',
    length: 120,
    asExpression:
      "case when deleted_at is null then name else concat(name, '#', public_id) end",
    generatedType: 'VIRTUAL',
    select: false,
  })
  activeName: string | null;

  @Column({ name: 'parent_id', default: 0, comment: '父菜单ID' })
  parentId: number;

  @Column({ name: 'ancestors', comment: '所有祖先菜单id，逗号分隔' })
  ancestors: string;

  @Column({ name: 'sort_order', type: 'int', comment: '显示顺序' })
  sortOrder: number;

  @Column({ name: 'path', type: 'varchar', length: 200, comment: '路由地址', nullable: true })
  path: string | null;

  @Column({
    name: 'active_path',
    type: 'varchar',
    length: 260,
    nullable: true,
    asExpression:
      "case when path is null then null when deleted_at is null then path else concat(path, '#', public_id) end",
    generatedType: 'VIRTUAL',
    select: false,
  })
  activePath: string | null;

  @Column({
    name: 'is_frame',
    type: 'char',
    length: 1,
    default: '1',
    comment: '是否为外链（0否 1是）',
  })
  isFrame: string;

  @Column({
    name: 'menu_type',
    length: 1,
    comment: '菜单类型（M目录 C菜单 F按钮）',
  })
  menuType: string;

  @Column({
    name: 'visible',
    length: 1,
    default: '0',
    comment: '菜单状态（0隐藏 1显示）',
  })
  visible: string;

  @Column({
    name: 'status',
    length: 1,
    default: '0',
    comment: '菜单状态（1正常 0停用）',
  })
  status: string;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', comment: '删除时间' })
  deletedAt: Date | null;

  @Column({ name: 'perms', type: 'varchar', length: 100, nullable: true, comment: '权限标识' })
  perms: string | null;

  @Column({
    name: 'active_perms',
    type: 'varchar',
    length: 160,
    nullable: true,
    asExpression:
      "case when perms is null then null when deleted_at is null then perms else concat(perms, '#', public_id) end",
    generatedType: 'VIRTUAL',
    select: false,
  })
  activePerms: string | null;

  // @Column({ name: 'icon', length: 100, default: '#', comment: '菜单图标' })
  // icon: string;

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

  @ManyToMany(() => SysRole, (role) => role.menus)
  roles: SysRole[];

  @BeforeInsert()
  setDefaultValues() {
    if (!this.publicId) {
      this.publicId = randomUUID();
    }
  }
}

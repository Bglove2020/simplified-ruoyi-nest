import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,  
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  DeleteDateColumn, Index,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { SysUser } from '@/system/user/entities/user.entity';

// 定义一个typeORM实体类的步骤
// 1. 导入Entity, PrimaryGeneratedColumn, Column等装饰器
// 2. 使用@Entity()装饰器标记该类为一个实体类，传入一个参数用于指定表名。
// 3. 使用@PrimaryGeneratedColumn()装饰器标记主键列
// 4. 使用@Column()装饰器标记其他列
// 5. 定义其他关系装饰器，如@OneToMany, @ManyToOne, @ManyToMany等

// mysql在windows平台下不区分数据库名、表名、列名的大小写，因此建议使用小写字母+下划线的形式
@Entity('sys_dept')
@Index('uniq_sys_dept_active_name', ['activeName'], { unique: true })
export class SysDept {
  @PrimaryGeneratedColumn({
    comment: '部门id，有序，自增，非uuid',
  })
  id: number;

  @Column({
    name: 'public_id',
    unique: true,
    comment: '部门公开id，唯一且与id一一对应，用于对外暴露',
  })
  publicId: string;

  @Column({
    name: 'name',
    comment: '部门名称',
  })
  name: string;

  @Column({
    name: 'active_name',
    type: 'varchar',
    length: 320,
    asExpression:
      "case when deleted_at is null then name else concat(name, '#', public_id) end",
    generatedType: 'VIRTUAL',
    select: false,
  })
  activeName: string;

  @Column({
    name: 'parent_id',
    comment: '父部门id（表示根部门为0）',
  })
  parentId: number;

  @Column({
    name: 'ancestors',
    comment: '所有祖先部门id，逗号分隔',
  })
  ancestors: string;

  @Column({
    name: 'sort_order',
    type: 'int',
    comment: '显示顺序',
  })
  sortOrder: number;

  @Column({
    name: 'status',
    default: '1',
    comment: '部门状态（0停用 1正常）',
  })
  status: string;

  @ManyToOne(() => SysUser, { nullable: true })
  @JoinColumn({ name: 'leader_id'})
  leader: SysUser | null;

  @Column({
    name: 'update_by',
    nullable: true,
    comment: '更新者',
  })
  updateBy: string;
    
  @Column({
    name: 'create_by',
    nullable: true,
    comment: '创建者',
  })
  createBy: string;

  @CreateDateColumn({
    name: 'create_time',
    nullable: true,
    comment: '创建时间',
  })
  createTime: Date;

  @UpdateDateColumn({
    name: 'update_time',
    nullable: true,
    comment: '更新时间',
  })
  updateTime: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', comment: '删除时间' })
  deletedAt: Date | null;

  @BeforeInsert()
  setPublicId() {
    if (!this.publicId) {
      this.publicId = randomUUID();
    }
  }

  // @OneToMany(() => SysUser, (user) => user.dept)
  // users: SysUser[];
}

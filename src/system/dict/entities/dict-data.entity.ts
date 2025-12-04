import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SysDict } from './dict.entity';
import { randomUUID } from 'crypto';

@Entity('sys_dict_data')
@Index('uniq_sys_dict_data_label_active', ['activeLabel'], {
  unique: true,
})
@Index('uniq_sys_dict_data_value_active', ['activeValue'], {
  unique: true,
})
export class SysDictData {
  @PrimaryGeneratedColumn({ comment: '字典数据自增ID' })
  id: number;

  @Column({
    name: 'public_id',
    unique: true,
    comment: '字典数据公开id，唯一且与id一一对应，用于对外暴露',
  })
  publicId: string;

  @Column({
    name: 'label',
    length: 100,
    comment: '字典标签',
  })
  label: string;

  @Column({
    name: 'active_label',
    type: 'varchar',
    length: 260,
    asExpression:
      "case when deleted_at is null then label else concat(label, '#', public_id) end",
    generatedType: 'VIRTUAL',
    select: false,
    insert: false,
    update: false,
  })
  activeLabel: string;

  @Column({
    name: 'value',
    length: 100,
    comment: '字典键值',
  })
  value: string;

  @Column({
    name: 'active_value',
    type: 'varchar',
    length: 260,
    asExpression:
      "case when deleted_at is null then value else concat(value, '#', public_id) end",
    generatedType: 'VIRTUAL',
    select: false,
    insert: false,
    update: false,
  })
  activeValue: string;

  @Column({
    name: 'sort_order',
    type: 'int',
    default: 0,
    comment: '显示排序',
  })
  sortOrder: number;

  @Column({
    name: 'status',
    length: 1,
    default: '1',
    comment: '状态（0停用 1正常）',
  })
  status: string;

  @Column({
    name: 'create_by',
    length: 64,
    default: '',
    comment: '创建者',
    nullable: true,
  })
  createBy: string;

  @CreateDateColumn({
    name: 'create_time',
    type: 'datetime',
    comment: '创建时间',
  })
  createTime: Date;

  @Column({
    name: 'update_by',
    length: 64,
    default: '',
    comment: '更新者',
    nullable: true,
  })
  updateBy: string;

  @UpdateDateColumn({
    name: 'update_time',
    type: 'datetime',
    comment: '更新时间',
  })
  updateTime: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'datetime',
    comment: '删除时间',
  })
  deletedAt: Date | null = null;

  @ManyToOne(() => SysDict, (dict) => dict.dictData)
  @JoinColumn({ name: 'dict_id' })
  dict: SysDict;

  @BeforeInsert()
  setDefaultValues() {
    if (!this.publicId) {
      this.publicId = randomUUID();
    }
  }
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  RelationId,
  BeforeInsert,
  Index,
  DeleteDateColumn,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { SysDept } from '@/system/dept/entities/dept.entity';
import { SysRole } from '@/system/role/entities/role.entity';

@Entity('sys_user')
@Index(['account', 'deletedAt'], { unique: true })
@Index(['email', 'deletedAt'], { unique: true })
export class SysUser {
  // 使用装饰器：@PrimaryGeneratedColumn，修饰的字段为主键，且自增。
  // @PrimaryGeneratedColumn装饰器可以传入一个Column options对象，用于配置主键列的行为。
  @PrimaryGeneratedColumn({
    comment: '用户id，有序，自增，非uuid',
  })
  id: number;

  @Column({
    name: 'public_id',
    unique: true,
    comment: '用户公开id，唯一且与id一一对应，用于对外暴露',
  })
  publicId: string;

  @Column({length: 255,comment: '用户名称' })
  name: string;

  @Column({length: 255 ,comment: '用户账号'})
  account: string;

  @Column({length: 255 ,comment: '用户邮箱' })
  email: string;

  @Column({
    length: 1,
    default: '0',
    comment: '用户性别（0未知 1男 2女）',
  })
  sex: string;

  @Column({length: 255, default: '' ,comment: '用户头像url'})
  avatar: string;

  @Column({ length: 255 })
  password: string;

  @Column({
    length: 1,
    default: '1',
    comment: '帐号状态（0停用 1正常）',
  })
  status: string;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', comment: '删除时间' })
  deletedAt: Date | null;

  @Column({ name: 'login_ip', length: 128, default: '', comment: '最后登录IP' })
  loginIp: string;

  @Column({ name: 'login_date', type: 'datetime', nullable: true, comment: '最后登录时间' })
  loginDate: Date | null;

  @Column({ name: 'create_by', type: 'varchar', length: 36, comment: '创建者（UUID）' })
  createBy: string;

  @CreateDateColumn({ name: 'create_time', type: 'datetime', comment: '创建时间' })
  createTime: Date;

  @Column({ name: 'update_by', type: 'varchar', length: 36, comment: '更新者（UUID）' })
  updateBy: string;

  @UpdateDateColumn({
    name: 'update_time',
    type: 'datetime',
    comment: '更新时间',
  })
  updateTime: Date;

  @Column({ name: 'remark', length: 500, default: '', comment: '备注' })
  remark: string;

  @BeforeInsert()
  setPublicId() {
    if (!this.publicId) {
      this.publicId = randomUUID();
    }
  }

  // 这里在TS层面定义了deptId为number或null类型，即可以为空。但在数据库层面，并不会因此就设置表中的这个字段可以为NULL。
  // 我们如果想在数据库中设置此字段可以为NULL，需要在Column装饰器中设置nullable: true，这是唯一的一个地方，可以设置字段是否支持非空。
  // 默认情况下，表中字段名和类中字段名保持一致，但传入Column options对象可以覆盖默认的字段名。
  // 因为我们要定义的是外键，这样的定义方式只是定义了表中的一个普通字段，并不是一个外键。并且与下方的外键定义冲突了。
  // @Column({ name: 'dept_id', length: '255', nullable: true })
  // deptId: number | null;

  // @ManyToOne装饰器定义了一个从SysUser到SysDept的关系。
  // 第一个参数是一个函数，用于指定这个字段关联的实体类型，使用函数是为了防止循环依赖。
  // 第二个参数是一个函数，用于指定关联的实体中的反向引用属性。
  // （ 实际上，在我看来，这个参数是多余的，完全不需要显示指出dept实体类中，哪个字段是被引用的，
  // 首先，在user中我们是多对一的关系，因此实际真实引入了一个外键，
  // 然后@JoinColumn指出了当前字段在表中的名字，即表中实际的外键名字。同时还隐式的指明了
  // 这个字段引用的是SysDept实体中的主键字段。因此我觉得即使不传递第二个参数，也是完全能够知道这两个实体类之间的关系的。
  // 即应该可以正确的执行const user = await userRepository.findOne(1, { relations: ['dept'] }); ）
  // 
  // @ManyToOne还可以传入第三个参数，这里影响不大，先不谈论

  @ManyToOne(() => SysDept)
  // @JoinColumn可以传入一个对象，这个对象可以具有三个属性：
  // name：指定实际表中外键列的名称。如果不指定，默认使用当前字段名。
  // referencedColumnName：指定关联实体中的能够作为外键列的名称。如果不指定，默认使用关联实体的主键列名。
  // nullable：指定外键列是否可以为NULL。如果不指定，默认根据关联实体的主键列是否为NULL来确定。
  // =====================
  // 这里指定外键为另一个表的非主键时，也是支持的。在查询时，typeorm会自动根据非主键字段去查询关联实体，只要非主键字段的值与外键值相等，就可以查询到关联实体。
  // =====================
  @JoinColumn({ name: 'dept_id'})
  // 这里可能会有迷惑，此实体类中的dept属性的类型是一个完整的实体类，而在表中映射的却是一个字符串外键。
  // 这是没什么问题的，因为他们并没有什么直接关联，@JoinColumn装饰器只是给这个类属性添加了一个元数据罢了.
  // TypeORM利用这个元数据去构建真实的表。
  // 我们在查询时，可以使用relations选项来指定关联查询，TypeORM会自动根据这个元数据去构建SQL语句，
  // 并将一个完整的关联对象的属性填充到查询结果中。
  dept: SysDept;  

  // 这个定义不定义无所谓，不会在表里生成一个对应的列，只是在查询得到结果时，把关联对象的主键提取出来，单独赋值给deptId字段。。
  @RelationId((user:SysUser)=> user.dept)
  deptId:string

  // 用户角色关联 (通过中间表 sys_user_role)
  // 使用 @ManyToMany 是常用的方式，但如果你想操作中间表的额外字段，可以保留 @OneToMany
  @ManyToMany(() => SysRole, (role) => role.users)
  // 可以不写和只在一个表中写，不能两个表中都写，否则报错
  @JoinTable({
    name: 'sys_user_role', // 生成的中间表的表名
    // referencedColumnName属性用于指定本表的哪个键作为中间表的外键，name属性用于指定中间表中关于本表的外键名
    // 因此referencedColumnName需要填写实体类的属性名，name是实际表中的外键名
    // 例如指定uuid为外键joinColumns: [{ name: 'user_id', referencedColumnName: 'publicId' }], 
    joinColumns: [{ name: 'user_id'}],
    inverseJoinColumns: [{ name: 'role_id' }], // 同上
  })
  roles: SysRole[];

  @OneToMany(() => SysDept, (dept) => dept.leader)
  leaderDepts: SysDept[];
}
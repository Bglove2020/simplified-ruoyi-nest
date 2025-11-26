import { SysUser } from '../entities/user.entity';
import FrontendUserDto from '../dto/frontend-user.dto';

export const UserMapper = {
  toFrontendDto(user: SysUser): FrontendUserDto{
    console.log(user);
    return {
      publicId: user.publicId,
      account: user.account,
      name: user.name,
      email: user.email,
      sex: user.sex,
      avatar: user.avatar,
      status: user.status,
      deptPublicId: user.dept.publicId,
      deptName: user.dept.name,
    };
  },

  toFrontendListDtos(users: SysUser[]): FrontendUserDto[]{
    return users.map((u) => this.toFrontendDto(u));
  },
};
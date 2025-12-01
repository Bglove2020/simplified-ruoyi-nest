import { SysUser } from '../entities/user.entity';
import FrontendUserDto from '../dto/frontend-user.dto';

export function toFrontendDto(user: SysUser): FrontendUserDto {
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
    rolePublicIds: user.roles.map((role) => role.publicId),
  };
}

export function toFrontendListDtos(users: SysUser[]): FrontendUserDto[] {
  return users.map((u) => toFrontendDto(u));
}

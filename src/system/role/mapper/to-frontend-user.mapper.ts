import { SysRole } from '../entities/role.entity';
import FrontendRoleDto from '../dto/frontend-role.dto';

export function toFrontendDto(role: SysRole): FrontendRoleDto{
    return {
        publicId: role.publicId,
        name: role.name,
        roleKey: role.roleKey,
        sortOrder: role.sortOrder,
        status: role.status,
        menuIds: role.menus.map((menu) => menu.publicId),
    };
}

export function toFrontendDtoList(roles: SysRole[]): FrontendRoleDto[]{
    return roles.map((role) => toFrontendDto(role));
}
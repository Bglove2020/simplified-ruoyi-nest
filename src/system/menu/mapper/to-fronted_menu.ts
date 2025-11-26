import { SysMenu } from '../entities/menu.entity';
import FrontendMenuDto from '../dto/frontend-menu.dto';

export function toFrontendDto(menu: SysMenu): FrontendMenuDto {
    return {
        publicId: menu.publicId,
        name: menu.name,
        sortOrder: menu.sortOrder,
        path: menu.path,
        isFrame: menu.isFrame,
        menuType: menu.menuType,
        visible: menu.visible,
        status: menu.status,
        perms: menu.perms,
        createBy: menu.createBy,
        createTime: menu.createTime,
        updateBy: menu.updateBy,
        updateTime: menu.updateTime,
        remark: menu.remark,
    };
}
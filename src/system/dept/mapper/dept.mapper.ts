import FrontendDeptDto from "../dto/frontend-dept.dto";
import { SysDept } from "../entities/dept.entity";

export function toFrontendDeptDto(dept: SysDept): FrontendDeptDto {
    return {
        publicId: dept.publicId,
        name: dept.name,
        sortOrder: dept.sortOrder,
        leaderPublicId: dept.leader?.publicId,
        leaderName: dept.leader?.name,
        leaderEmail: dept.leader?.email,
        status: dept.status,
        children: [],
    };
}
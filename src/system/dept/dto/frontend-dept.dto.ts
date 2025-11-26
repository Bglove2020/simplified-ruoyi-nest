export default class FrontendDeptDto{
    publicId: string;
    name: string;
    sortOrder: number;
    leaderPublicId: string | undefined;
    leaderName: string | undefined;
    leaderEmail: string | undefined;
    status: string;
    children: FrontendDeptDto[];
}
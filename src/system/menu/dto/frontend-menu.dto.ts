export default class FrontendMenuDto {
  publicId: string;
  name: string;
  sortOrder: number;
  path: string | null;
  isFrame: string;
  menuType: string;
  visible: string;
  status: string;
  perms: string | null;
  createBy: string;
  createTime: Date;
  updateBy: string;
  updateTime: Date;
  remark: string | null;
}

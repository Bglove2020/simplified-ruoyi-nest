import FrontendDictTypeDto from '../dto/frontend-dict-type.dto';
import FrontendDictDataDto from '../dto/frontend-dict-data.dto';
import { SysDict } from '../entities/dict.entity';
import { SysDictData } from '../entities/dict-data.entity';

export const toFrontendDictTypeDto = (
  entity: SysDict,
): FrontendDictTypeDto => ({
  publicId: entity.publicId,
  name: entity.name,
  type: entity.type,
  sortOrder: entity.sortOrder,
  status: entity.status,
  createTime: entity.createTime,
});

export const toFrontendDictTypeDtos = (
  entities: SysDict[],
): FrontendDictTypeDto[] => entities.map(toFrontendDictTypeDto);

export const toFrontendDictDataDto = (
  entity: SysDictData,
): FrontendDictDataDto => ({
  publicId: entity.publicId,
  label: entity.label,
  value: entity.value,
  sortOrder: entity.sortOrder,
  status: entity.status,
});

export const toFrontendDictDataDtos = (
  entities: SysDictData[],
): FrontendDictDataDto[] => entities.map(toFrontendDictDataDto);

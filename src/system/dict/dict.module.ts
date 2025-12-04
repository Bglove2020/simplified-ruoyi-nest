import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DictService } from './dict.service';
import { DictController } from './dict.controller';
import { SysDict } from './entities/dict.entity';
import { SysDictData } from './entities/dict-data.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SysDict, SysDictData])],
  controllers: [DictController],
  providers: [DictService],
  exports: [DictService],
})
export class DictModule {}

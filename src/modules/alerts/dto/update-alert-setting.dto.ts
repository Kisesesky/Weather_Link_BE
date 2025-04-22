import { PartialType } from '@nestjs/mapped-types';
import { CreateAlertSettingDto } from './create-alert-setting.dto';

export class UpdateAlertSettingDto extends PartialType(CreateAlertSettingDto) {}

import { RequiredConsent } from '@/resources/register/entities/register.entity';
import { IsBoolean, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { Type } from 'class-transformer';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  email;
  @IsString()
  @IsNotEmpty()
  name;
  @IsString()
  @IsNotEmpty()
  dob;
  @IsString()
  @IsNotEmpty()
  sex;
  @IsString()
  @IsNotEmpty()
  contact;
  @IsBoolean()
  isMember;
  @ValidateNested()
  @Type(() => Number)
  joins;
  @ValidateNested()
  @Type(() => Consent)
  consent;
}

class Consent implements RequiredConsent {
  churchStandard: string;
  portraitRight: string;
  useOfInformation: string;
}

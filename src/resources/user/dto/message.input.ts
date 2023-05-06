import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class MessageDto {
  @IsString()
  @IsNotEmpty()
  public recipient;
  @IsBoolean()
  public notify;
}

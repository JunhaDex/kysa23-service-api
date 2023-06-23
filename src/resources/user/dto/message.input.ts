import { IsArray, IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class MessageDto {
  @IsString()
  @IsNotEmpty()
  public recipient;
  @IsBoolean()
  public notify;
}

export class UserDto {
  @IsString()
  @IsNotEmpty()
  public bio;

  @IsString()
  @IsNotEmpty()
  public tweet;

  @IsString()
  @IsNotEmpty()
  public mbti;

  @IsString()
  @IsNotEmpty()
  public interest;

  @IsArray()
  @IsNotEmpty()
  public ageGroup;
}

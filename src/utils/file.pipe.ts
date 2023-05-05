import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): any {
    const fileSizeLimit = 5 * 1024 * 1024; // 5MiB
    return value.size < fileSizeLimit ? value : undefined;
  }
}

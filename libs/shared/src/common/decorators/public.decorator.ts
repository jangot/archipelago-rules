import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiExtension } from '@nestjs/swagger';

export const IS_PUBLIC_KEY = 'zng/isPublic';

export const Public = () =>
  applyDecorators(
    SetMetadata(IS_PUBLIC_KEY, true),
    // This is the key that SwaggerModule looks at to determine if the endpoint is public
    ApiExtension('x-zng-public', true), 
  );

import { SetMetadata } from '@nestjs/common';

/** Metadata key marking a route as public (skips JWT auth + roles). */
export const IS_PUBLIC_KEY = 'isPublic';

/** Marks a route (or controller) as publicly accessible — bypasses JwtAuthGuard/RolesGuard. */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);

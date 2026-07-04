import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Triggers LocalStrategy (email/password) for the login route. */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}

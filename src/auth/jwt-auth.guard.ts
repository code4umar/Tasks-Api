import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Applying @UseGuards(JwtAuthGuard) to a route delegates to JwtStrategy:
// no/invalid/expired token -> 401 before the handler ever runs.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

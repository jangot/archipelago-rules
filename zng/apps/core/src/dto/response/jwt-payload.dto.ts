export class JwtPayloadDto {
  iss: string; // Issuer - auth server
  sub: string; // userId
  aud: string; // audience
  exp: number; // Expiration time in Seconds since Unix epoch
  iat: number; // Issued at time in Seconds since Unix epoch
  scope: string; // Permissions
  isAdmin: boolean; // Shortcut to enable Admin access
}

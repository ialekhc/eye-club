import type { StaffRole, TenantContext } from '../../../packages/contracts/src/index';

export interface WorkstationAuthRequest {
  email: string;
  password: string;
  workstationCode: string;
  licenseKey: string;
}

export class IdentityDomainService {
  private readonly revokedTokens = new Set<string>();

  validateRolePermission(role: StaffRole, permission: string): boolean {
    const matrix: Record<StaffRole, string[]> = {
      PLATFORM_SUPER_ADMIN: ['*'],
      TENANT_ADMIN: ['tenant:manage', 'centre:manage', 'patient:write', 'trial:write', 'pos:write', 'inventory:write', 'report:read'],
      HOSPITAL_DIRECTOR: ['centre:manage', 'report:read', 'patient:read', 'inventory:read'],
      CENTRE_MANAGER: ['patient:write', 'trial:write', 'pos:write', 'inventory:write', 'report:read'],
      OPTOMETRIST: ['patient:write', 'rx:write', 'trial:write'],
      DISPENSING_OPTICIAN: ['patient:write', 'trial:write', 'comfort:write', 'pos:write'],
      POS_CASHIER: ['pos:write', 'patient:read', 'inventory:read'],
    };
    const allowed = matrix[role] ?? [];
    return allowed.includes('*') || allowed.includes(permission);
  }

  assertCrossTenantIsolation(actor: TenantContext, requestedTenantId: string, requestedCentreId?: string): void {
    if (actor.staffRole === 'PLATFORM_SUPER_ADMIN') return;
    if (actor.tenantId !== requestedTenantId) {
      throw new Error(`Cross-tenant access denied: staff belongs to ${actor.tenantId}, requested ${requestedTenantId}.`);
    }
    if (
      requestedCentreId &&
      actor.staffRole !== 'TENANT_ADMIN' &&
      actor.staffRole !== 'HOSPITAL_DIRECTOR' &&
      actor.opticalCentreId !== requestedCentreId
    ) {
      throw new Error(`Cross-centre access denied: workstation bound to ${actor.opticalCentreId}.`);
    }
  }

  revokeSessionToken(tokenId: string): void {
    this.revokedTokens.add(tokenId);
  }

  isSessionTokenActive(tokenId: string): boolean {
    return !this.revokedTokens.has(tokenId);
  }
}

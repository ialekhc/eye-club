import type { PatientRecord, TenantContext } from '../../../packages/contracts/src/index';

export class PatientDomainService {
  private readonly patients: PatientRecord[] = [
    {
      id: 'pat-01',
      tenantId: 'tenant-Tilganga-Hospital',
      opticalCentreId: 'centre-gaushala-main',
      hospitalPatientId: 'HOSP-99241',
      firstName: 'Sita Devi',
      lastName: 'Shrestha',
      phone: '+977-9841223344',
      email: 'sita.shrestha@example.np',
      age: 46,
      gender: 'Female',
      isAnonymousWalkIn: false,
      latestPrescription: {
        id: 'rx-101',
        odSph: '-1.75',
        odCyl: '-0.50',
        odAxis: '90',
        odAdd: '+1.50',
        osSph: '-2.00',
        osCyl: '-0.25',
        osAxis: '85',
        osAdd: '+1.50',
        pdMm: '62',
        prescribedBy: 'Dr. Sanduk R. / Dept. of Optometry',
        recordedAt: '2026-11-18T09:30:00.000Z',
      },
      trialCount: 3,
      purchaseCount: 2,
      createdAt: '2026-09-10T08:00:00.000Z',
    },
    {
      id: 'pat-02',
      tenantId: 'tenant-Tilganga-Hospital',
      opticalCentreId: 'centre-gaushala-main',
      hospitalPatientId: 'HOSP-99408',
      firstName: 'Bibek',
      lastName: 'Adhikari',
      phone: '+977-9803556677',
      age: 29,
      gender: 'Male',
      isAnonymousWalkIn: false,
      latestPrescription: {
        id: 'rx-102',
        odSph: '-1.25',
        odCyl: '-0.25',
        odAxis: '180',
        odAdd: '',
        osSph: '-1.25',
        osCyl: '0.00',
        osAxis: '0',
        osAdd: '',
        pdMm: '64',
        prescribedBy: 'Dr. Suman Karki',
        recordedAt: '2026-11-19T14:15:00.000Z',
      },
      trialCount: 1,
      purchaseCount: 1,
      createdAt: '2026-10-05T11:00:00.000Z',
    },
  ];

  searchPatients(ctx: TenantContext, query = ''): PatientRecord[] {
    const q = query.trim().toLowerCase();
    return this.patients.filter((p) => {
      if (p.tenantId !== ctx.tenantId) return false;
      if (!q) return true;
      return (
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        (p.hospitalPatientId ?? '').toLowerCase().includes(q)
      );
    });
  }

  registerPatient(
    ctx: TenantContext,
    input: {
      firstName: string;
      lastName: string;
      phone: string;
      hospitalPatientId?: string;
      age?: number;
      gender?: string;
      isAnonymousWalkIn?: boolean;
    },
  ): PatientRecord {
    const record: PatientRecord = {
      id: `pat-${Date.now()}`,
      tenantId: ctx.tenantId,
      opticalCentreId: ctx.opticalCentreId,
      hospitalPatientId: input.hospitalPatientId?.trim() || undefined,
      firstName: input.firstName.trim() || 'Walk-In',
      lastName: input.lastName.trim() || 'Patient',
      phone: input.phone.trim() || 'N/A',
      age: input.age,
      gender: input.gender,
      isAnonymousWalkIn: Boolean(input.isAnonymousWalkIn),
      trialCount: 0,
      purchaseCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.patients.unshift(record);
    return record;
  }
}

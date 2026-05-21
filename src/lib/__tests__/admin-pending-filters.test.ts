import { KycStatus } from '@prisma/client';
import { submittedKycPendingWhere } from '@/lib/admin-pending-filters';

describe('submittedKycPendingWhere', () => {
  it('only counts submitted dossiers in review, not default PENDING users', () => {
    expect(submittedKycPendingWhere).toEqual({
      kycStatus: { in: [KycStatus.KYCAID_PENDING, KycStatus.IN_PROGRESS] },
      OR: [
        { kycaidApplicantId: { not: null } },
        { kycDocuments: { some: {} } },
        { kycVerifications: { some: {} } },
      ],
    });
  });

  it('does not include plain PENDING status', () => {
    const filter = submittedKycPendingWhere.kycStatus;
    expect(filter && typeof filter === 'object' && 'in' in filter).toBe(true);
    if (filter && typeof filter === 'object' && 'in' in filter) {
      expect(filter.in).not.toContain(KycStatus.PENDING);
    }
  });
});

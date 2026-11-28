import { describe, expect, it } from 'bun:test';
import { getStaffHome, isStaffRole } from '../src/lib/staffAuth';

describe('staff role access', () => {
  it('routes admins to the existing admin application', () => {
    expect(getStaffHome('admin')).toBe('/admin');
  });

  it('routes approvers to their own destination', () => {
    expect(getStaffHome('approver')).toBe('/approver');
  });

  it('routes loan officers to their own destination', () => {
    expect(getStaffHome('loan_officer')).toBe('/loan-officer');
  });

  it('accepts every staff role', () => {
    expect(isStaffRole('admin')).toBe(true);
    expect(isStaffRole('approver')).toBe(true);
    expect(isStaffRole('loan_officer')).toBe(true);
  });

  it('rejects borrower as an authentication role', () => {
    expect(isStaffRole('borrower')).toBe(false);
  });

  it('fails closed for missing and unknown roles', () => {
    expect(isStaffRole(null)).toBe(false);
    expect(isStaffRole(undefined)).toBe(false);
    expect(isStaffRole('superuser')).toBe(false);
  });
});

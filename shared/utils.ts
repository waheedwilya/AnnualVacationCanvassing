import { differenceInYears } from "date-fns";

/**
 * Calculate vacation weeks entitlement based on years of service
 * 
 * Rules:
 * - 2 weeks after 1 year of service
 * - 3 weeks after 3 years of service
 * - 4 weeks after 10 years of service
 * - 5 weeks after 25 years of service
 * - 6 weeks after 35 years of service
 */
export function calculateVacationWeeks(joiningDate: string | Date): number {
  const years = differenceInYears(new Date(), new Date(joiningDate));
  
  if (years >= 35) return 6;
  if (years >= 25) return 5;
  if (years >= 10) return 4;
  if (years >= 3) return 3;
  if (years >= 1) return 2;
  
  // Less than 1 year of service - no vacation entitlement
  return 0;
}

/**
 * Get a description of vacation entitlement based on years of service
 */
export function getVacationEntitlementDescription(yearsOfService: number, weeksEntitled: number): string {
  if (yearsOfService < 1) {
    return "Not eligible (requires 1 year of service)";
  }
  
  return `${weeksEntitled} weeks (${yearsOfService} ${yearsOfService === 1 ? 'year' : 'years'} of service)`;
}

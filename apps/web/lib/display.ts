import type { VerificationStatusValue } from "@edubuf/shared";

const KNOWN: VerificationStatusValue[] = [
  "UNVERIFIED",
  "PARTIALLY_VERIFIED",
  "PENDING_REVIEW",
  "VERIFIED",
  "CONFLICTING",
  "STALE",
  "ARCHIVED",
];

// prisma enums arrive as string; anything unexpected is treated as unverified rather than trusted
export function toVerificationStatus(value: string): VerificationStatusValue {
  return KNOWN.includes(value as VerificationStatusValue)
    ? (value as VerificationStatusValue)
    : "UNVERIFIED";
}

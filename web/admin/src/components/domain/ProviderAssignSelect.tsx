'use client';

// src/components/domain/ProviderAssignSelect.tsx (04 §A.2.9, §A.2.10)
// A native <select> of active PROVIDER users (source: GET /users?role=PROVIDER&is_active=true),
// with an "Unassign" option mapping to a null provider id. Self-contained data fetch so it
// can be reused by booking-detail assignment and provider tooling alike.
import { useMemo } from 'react';
import { Select } from '@/components/ui/Select';
import { useUsers } from '@/lib/hooks/useUsers';

export interface ProviderAssignSelectProps {
  /** Currently selected provider id, or null for unassigned. */
  value: number | null;
  onChange: (providerId: number | null) => void;
  /** Allow choosing "Unassign" (null). Defaults to true. */
  allowUnassign?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  'aria-describedby'?: string;
  className?: string;
}

const UNASSIGN_VALUE = '__unassign__';

export function ProviderAssignSelect({
  value,
  onChange,
  allowUnassign = true,
  disabled = false,
  invalid = false,
  id,
  className,
  ...aria
}: ProviderAssignSelectProps) {
  const { data, isLoading, isError } = useUsers({
    role: 'PROVIDER',
    is_active: true,
    page_size: 100,
    sort_by: 'name',
    sort_order: 'asc',
  });

  const providers = useMemo(() => data?.items ?? [], [data]);

  const selectValue = value === null ? (allowUnassign ? UNASSIGN_VALUE : '') : String(value);

  return (
    <Select
      id={id}
      className={className}
      invalid={invalid}
      disabled={disabled || isLoading || isError}
      value={selectValue}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === UNASSIGN_VALUE || v === '' ? null : Number(v));
      }}
      aria-describedby={aria['aria-describedby']}
    >
      {isLoading ? (
        <option value="">Loading providers…</option>
      ) : isError ? (
        <option value="">Failed to load providers</option>
      ) : (
        <>
          {allowUnassign && <option value={UNASSIGN_VALUE}>Unassigned</option>}
          {!allowUnassign && (
            <option value="" disabled>
              Select a provider…
            </option>
          )}
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.email})
            </option>
          ))}
        </>
      )}
    </Select>
  );
}

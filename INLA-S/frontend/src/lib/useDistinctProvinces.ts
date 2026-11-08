import { useEffect, useMemo, useState } from "react";
import type { ApiCustomer } from "../api/customers";

export function distinctProvincesFrom(customers: readonly ApiCustomer[]): string[] {
  const set = new Set<string>();
  for (const customer of customers) {
    const province = customer.province?.trim();
    if (province) set.add(province);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "vi"));
}

export function mergeProvinceCustomers(existing: ApiCustomer[], incoming: ApiCustomer[]): ApiCustomer[] {
  if (!incoming.length) return existing;
  const byCode = new Map(existing.map((c) => [c.code, c]));
  for (const customer of incoming) {
    byCode.set(customer.code, customer);
  }
  return [...byCode.values()];
}

export function useDistinctProvinces(customers: ApiCustomer[] | null): string[] {
  const [accumulated, setAccumulated] = useState<ApiCustomer[]>([]);

  useEffect(() => {
    if (!customers?.length) return;
    setAccumulated((prev) => mergeProvinceCustomers(prev, customers));
  }, [customers]);

  return useMemo(() => distinctProvincesFrom(accumulated), [accumulated]);
}

export function provinceComboboxOptions(
  distinct: readonly string[],
  currentValue?: string,
  catalog?: readonly string[],
  includeOrphanCurrent = false,
): string[] {
  const set = new Set<string>();
  for (const province of catalog ?? []) set.add(province);
  for (const province of distinct) set.add(province);
  const current = currentValue?.trim();
  if (current && includeOrphanCurrent && !set.has(current)) {
    set.add(current);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "vi"));
}

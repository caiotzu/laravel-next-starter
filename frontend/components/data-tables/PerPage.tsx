"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PerPageProps {
  perPage: number;
  onChange: (value: number) => void;
  options?: number[];
  label?: string;
}

export function PerPage({
  perPage,
  onChange,
  options = [10, 20, 30, 40, 50],
  label = "Por página",
}: PerPageProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">{label}</label>

      <Select
        value={String(perPage)}
        onValueChange={(value) => onChange(Number(value))}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          {options.map((value) => (
            <SelectItem key={value} value={String(value)}>
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

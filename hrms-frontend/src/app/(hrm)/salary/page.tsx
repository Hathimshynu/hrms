import { UnavailablePage } from "@/src/components/common/UnavailablePage";

export default function SalaryPage() {
  return (
    <UnavailablePage
      title="Salary"
      heading="Payroll data unavailable"
      message="Payroll information will appear here when payroll APIs are available."
    />
  );
}

import { UnavailablePage } from "@/src/components/common/UnavailablePage";

export default function LeavePolicyPage() {
  return (
    <UnavailablePage
      title="Leave Policy"
      heading="Holiday and working-day data unavailable"
      message="Holidays and working-day schedules will appear here when the HRMS backend provides the required API."
      link={{ href: "/masters/leave-policies", label: "View leave policies (Masters)" }}
    />
  );
}

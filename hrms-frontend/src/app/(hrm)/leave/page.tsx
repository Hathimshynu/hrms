import { UnavailablePage } from "@/src/components/common/UnavailablePage";

export default function LeavePage() {
  return (
    <UnavailablePage
      title="Leave"
      heading="Leave data unavailable"
      message="Leave management data will appear here when the HRMS backend provides the required API."
      link={{ href: "/masters/leave-policies", label: "View leave policies (Masters)" }}
    />
  );
}

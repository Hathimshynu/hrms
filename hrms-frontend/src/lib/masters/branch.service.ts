// src/lib/masters/branch.service.ts
//
// /api/employee-masters/branches (EmployeeMasterController@branches).
// READ-ONLY - confirmed no create/update/delete route exists for
// branches anywhere in routes/api.php. GET only returns is_active
// branches (hardcoded server-side filter, same as the policy masters).
import { api } from "../api/axios";

export interface BranchDto {
  id: number;
  code: string;
  name: string;
  city: string | null;
  state: string | null;
  country: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface BranchListResponse {
  success: boolean;
  data: BranchDto[];
}

export const branchService = {
  list: () =>
    api
      .get<BranchListResponse>("/employee-masters/branches")
      .then((res) => res.data.data),
};

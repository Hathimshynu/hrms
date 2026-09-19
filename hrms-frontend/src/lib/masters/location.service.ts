// src/lib/masters/location.service.ts
//
// /api/employee-masters/locations (EmployeeMasterController@locations).
// READ-ONLY - confirmed no create/update/delete route exists for
// locations anywhere in routes/api.php. GET only returns is_active
// locations (hardcoded server-side filter) and optionally accepts
// ?branch_id= to filter by branch.
import { api } from "../api/axios";

export interface LocationDto {
  id: number;
  branch_id: number;
  code: string;
  name: string;
  city: string | null;
  state: string | null;
  country: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface LocationListResponse {
  success: boolean;
  data: LocationDto[];
}

export const locationService = {
  list: (params?: { branch_id?: number }) =>
    api
      .get<LocationListResponse>("/employee-masters/locations", { params })
      .then((res) => res.data.data),
};

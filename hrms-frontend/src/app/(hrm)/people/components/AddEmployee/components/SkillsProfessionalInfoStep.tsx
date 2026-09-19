"use client";

import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import type { ProfessionalValues, StepProps } from "../onboarding-form.types";

const highestQualifications = [
  { label: "High School", value: "High School" },
  { label: "Diploma", value: "Diploma" },
  { label: "Bachelor's Degree", value: "Bachelor's Degree" },
  { label: "Master's Degree", value: "Master's Degree" },
  { label: "Doctorate / PhD", value: "Doctorate / PhD" },
  { label: "Other", value: "Other" },
];

const languages = [
  { label: "English", value: "English" },
  { label: "Tamil", value: "Tamil" },
  { label: "Hindi", value: "Hindi" },
  { label: "Malayalam", value: "Malayalam" },
  { label: "Telugu", value: "Telugu" },
  { label: "Kannada", value: "Kannada" },
  { label: "Bengali", value: "Bengali" },
  { label: "Marathi", value: "Marathi" },
];

export function SkillsProfessionalInfoStep({
  values,
  onChange,
  errors,
}: StepProps<ProfessionalValues>) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label htmlFor="highestQualification" className="text-sm font-medium text-gray-700">
            Highest Qualification
          </label>
          <Select
            id="highestQualification"
            placeholder="Select highest qualification"
            options={highestQualifications}
            value={values.highest_qualification}
            clearable
            onChange={(v) => onChange({ highest_qualification: v as string })}
            error={errors.highest_qualification}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label htmlFor="university" className="text-sm font-medium text-gray-700">
            University / Institution
          </label>
          <Input
            id="university"
            placeholder="Enter university or institution"
            value={values.university_institution}
            onChange={(e) => onChange({ university_institution: e.target.value })}
            error={errors.university_institution}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label htmlFor="yearsOfExperience" className="text-sm font-medium text-gray-700">
            Years of Experience
          </label>
          <Input
            id="yearsOfExperience"
            type="number"
            min="0"
            step="0.1"
            placeholder="Enter years of experience"
            value={values.years_of_experience}
            onChange={(e) => onChange({ years_of_experience: e.target.value })}
            error={errors.years_of_experience}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label htmlFor="previousCompany" className="text-sm font-medium text-gray-700">
            Previous Company
          </label>
          <Input
            id="previousCompany"
            placeholder="Enter previous company"
            value={values.previous_company}
            onChange={(e) => onChange({ previous_company: e.target.value })}
            error={errors.previous_company}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label htmlFor="languages" className="text-sm font-medium text-gray-700">
            Languages
          </label>
          <Select
            id="languages"
            placeholder="Select languages"
            options={languages}
            value={values.languages}
            isMultiSelect
            onChange={(v) => onChange({ languages: v as string[] })}
            error={errors.languages}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";

const highestQualifications = [
  { label: "High School", value: "high_school" },
  { label: "Diploma", value: "diploma" },
  { label: "Bachelor's Degree", value: "bachelors_degree" },
  { label: "Master's Degree", value: "masters_degree" },
  { label: "Doctorate / PhD", value: "doctorate" },
  { label: "Other", value: "other" },
];

const certifications = [
  {
    label: "AWS Certified Cloud Practitioner",
    value: "aws_cloud_practitioner",
  },
  {
    label: "AWS Certified Developer",
    value: "aws_developer",
  },
  {
    label: "Microsoft Azure Fundamentals",
    value: "azure_fundamentals",
  },
  {
    label: "Google Cloud Certification",
    value: "google_cloud",
  },
  {
    label: "Oracle Certification",
    value: "oracle",
  },
  {
    label: "Certified Scrum Master",
    value: "scrum_master",
  },
  {
    label: "Other",
    value: "other",
  },
];

const languages = [
  { label: "English", value: "english" },
  { label: "Tamil", value: "tamil" },
  { label: "Hindi", value: "hindi" },
  { label: "Malayalam", value: "malayalam" },
  { label: "Telugu", value: "telugu" },
  { label: "Kannada", value: "kannada" },
  { label: "Bengali", value: "bengali" },
  { label: "Marathi", value: "marathi" },
  { label: "Other", value: "other" },
];

export function SkillsProfessionalInfoStep() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="highestQualification"
            className="text-sm font-medium text-gray-700"
          >
            Highest Qualification
          </label>

          <Select
            id="highestQualification"
            name="highestQualification"
            placeholder="Select highest qualification"
            options={highestQualifications}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="university"
            className="text-sm font-medium text-gray-700"
          >
            University / Institution
          </label>

          <Input
            id="university"
            name="university"
            placeholder="Enter university or institution"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="yearsOfExperience"
            className="text-sm font-medium text-gray-700"
          >
            Years of Experience
          </label>

          <Input
            id="yearsOfExperience"
            name="yearsOfExperience"
            type="number"
            min="0"
            step="0.1"
            placeholder="Enter years of experience"
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="previousCompany"
            className="text-sm font-medium text-gray-700"
          >
            Previous Company
          </label>

          <Input
            id="previousCompany"
            name="previousCompany"
            placeholder="Enter previous company"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="languages"
            className="text-sm font-medium text-gray-700"
          >
            Languages
          </label>

          <Select
            id="languages"
            name="languages"
            placeholder="Select languages"
            options={languages}
          />
        </div>
      </div>
    </div>
  );
}

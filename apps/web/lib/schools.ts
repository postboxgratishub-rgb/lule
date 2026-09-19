export type SchoolDirectoryOption = {
  id: string;
  name: string;
  code: string;
  block_name: string | null;
  city: string | null;
  state: string | null;
};

export type SchoolDirectoryGroup = {
  blockName: string;
  schools: SchoolDirectoryOption[];
};

const UNASSIGNED_BLOCK = "Other schools";

export function groupSchoolsByBlock(
  schools: SchoolDirectoryOption[],
): SchoolDirectoryGroup[] {
  const groups = new Map<string, SchoolDirectoryOption[]>();

  for (const school of schools) {
    const blockName = school.block_name?.trim() || UNASSIGNED_BLOCK;
    groups.set(blockName, [...(groups.get(blockName) ?? []), school]);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => {
      if (left === UNASSIGNED_BLOCK) return 1;
      if (right === UNASSIGNED_BLOCK) return -1;
      return left.localeCompare(right, "en-IN", { sensitivity: "base" });
    })
    .map(([blockName, blockSchools]) => ({
      blockName,
      schools: [...blockSchools].sort((left, right) =>
        left.name.localeCompare(right.name, "en-IN", { sensitivity: "base" }),
      ),
    }));
}

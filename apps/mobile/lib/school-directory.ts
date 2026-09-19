export type SchoolDirectoryEntry = {
  id: string;
  name: string;
  code: string;
  block_name: string | null;
  city: string | null;
  state: string | null;
};

export type SchoolDirectorySection = {
  title: string;
  data: SchoolDirectoryEntry[];
};

const OTHER_SCHOOLS = "Other schools";

export function filterSchools(
  schools: SchoolDirectoryEntry[],
  query: string,
): SchoolDirectoryEntry[] {
  const needle = query.trim().toLocaleLowerCase("en-IN");
  if (!needle) return schools;

  return schools.filter((school) =>
    [
      school.name,
      school.code,
      school.block_name,
      school.city,
      school.state,
    ].some((value) => value?.toLocaleLowerCase("en-IN").includes(needle)),
  );
}

export function groupSchoolSections(
  schools: SchoolDirectoryEntry[],
): SchoolDirectorySection[] {
  const grouped = new Map<string, SchoolDirectoryEntry[]>();

  for (const school of schools) {
    const blockName = school.block_name?.trim() || OTHER_SCHOOLS;
    grouped.set(blockName, [...(grouped.get(blockName) ?? []), school]);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => {
      if (left === OTHER_SCHOOLS) return 1;
      if (right === OTHER_SCHOOLS) return -1;
      return left.localeCompare(right, "en-IN", { sensitivity: "base" });
    })
    .map(([title, entries]) => ({
      title,
      data: [...entries].sort((left, right) =>
        left.name.localeCompare(right.name, "en-IN", { sensitivity: "base" }),
      ),
    }));
}

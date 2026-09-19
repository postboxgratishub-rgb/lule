import { describe, expect, it } from "vitest";

import {
  filterSchools,
  groupSchoolSections,
  type SchoolDirectoryEntry,
} from "./school-directory";

function school(
  name: string,
  blockName: string | null,
  code = name.toUpperCase(),
): SchoolDirectoryEntry {
  return {
    id: name,
    name,
    code,
    block_name: blockName,
    city: "Parvathipuram",
    state: "Andhra Pradesh",
  };
}

describe("mobile school directory", () => {
  const schools = [
    school("Zeta School", null, "2812"),
    school("Beta School", "Salur", "2811"),
    school("Alpha School", "Salur", "2810"),
    school("Gamma School", "Parvathipuram", "2809"),
  ];

  it("groups schools by block and sorts the unassigned group last", () => {
    const sections = groupSchoolSections(schools);

    expect(sections.map((section) => section.title)).toEqual([
      "Parvathipuram",
      "Salur",
      "Other schools",
    ]);
    expect(sections[1]?.data.map((item) => item.name)).toEqual([
      "Alpha School",
      "Beta School",
    ]);
  });

  it("searches by school, code, block, city, or state", () => {
    expect(filterSchools(schools, "2810").map((item) => item.name)).toEqual([
      "Alpha School",
    ]);
    expect(filterSchools(schools, "salur")).toHaveLength(2);
    expect(filterSchools(schools, "andhra")).toHaveLength(4);
  });
});

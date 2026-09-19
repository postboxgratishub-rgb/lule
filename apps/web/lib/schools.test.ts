import { describe, expect, it } from "vitest";

import {
  groupSchoolsByBlock,
  type SchoolDirectoryOption,
} from "@/lib/schools";

function school(
  name: string,
  blockName: string | null,
): SchoolDirectoryOption {
  return {
    id: name,
    name,
    code: name.toUpperCase(),
    block_name: blockName,
    city: null,
    state: null,
  };
}

describe("groupSchoolsByBlock", () => {
  it("groups and sorts schools by block, leaving unassigned schools last", () => {
    const groups = groupSchoolsByBlock([
      school("Zeta School", null),
      school("Beta School", " Salur "),
      school("Alpha School", "Salur"),
      school("Gamma School", "Parvathipuram"),
    ]);

    expect(groups.map((group) => group.blockName)).toEqual([
      "Parvathipuram",
      "Salur",
      "Other schools",
    ]);
    expect(groups[1]?.schools.map((item) => item.name)).toEqual([
      "Alpha School",
      "Beta School",
    ]);
  });
});

import { describe, expect, it } from "vitest";

import { normalizeAdminOverview } from "@/lib/admin-data";

describe("admin overview normalization", () => {
  it("normalizes bigint strings and the RPC school distribution", () => {
    expect(
      normalizeAdminOverview({
        total_students: "5000",
        total_schools: 3,
        new_students_last_7_days: "27",
        students_by_school: [
          {
            school_id: "4ca26876-8a9b-4fc1-9b68-b679395bc303",
            school_name: "Greenwood School",
            student_count: "1900",
          },
        ],
      }),
    ).toEqual({
      total_students: 5000,
      total_schools: 3,
      new_students_last_7_days: 27,
      students_by_school: [
        {
          school_id: "4ca26876-8a9b-4fc1-9b68-b679395bc303",
          school_name: "Greenwood School",
          student_count: 1900,
        },
      ],
    });
  });

  it("fails closed to empty numeric data for a malformed payload", () => {
    expect(normalizeAdminOverview(null)).toEqual({
      total_students: 0,
      total_schools: 0,
      new_students_last_7_days: 0,
      students_by_school: [],
    });
  });
});

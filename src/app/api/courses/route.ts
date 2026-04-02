import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("q") || "";
  const dept = req.nextUrl.searchParams.get("dept") || "";

  let query = `
    SELECT c.courseId, c.courseName, c.courseNumber, c.deptCode,
           cd.deptName,
           COUNT(p.postId) AS listingCount
    FROM course c
    JOIN courseDepartment cd ON c.deptCode = cd.deptCode
    LEFT JOIN post p ON p.courseId = c.courseId
  `;

  const params: string[] = [];
  const conditions: string[] = [];

  if (search) {
    conditions.push(
      "(c.courseName LIKE ? OR CONCAT(c.deptCode, c.courseNumber) LIKE ? OR c.deptCode LIKE ?)"
    );
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (dept) {
    conditions.push("c.deptCode = ?");
    params.push(dept);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " GROUP BY c.courseId ORDER BY c.deptCode, c.courseNumber";

  const [rows] = await pool.query<RowDataPacket[]>(query, params);
  return NextResponse.json(rows);
}

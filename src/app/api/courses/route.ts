import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("q") || "";
  const dept = req.nextUrl.searchParams.get("dept") || "";
  const pageParam = req.nextUrl.searchParams.get("page");
  const limitParam = req.nextUrl.searchParams.get("limit");
  const shouldPaginate = pageParam !== null || limitParam !== null;
  const page = Math.max(Number(pageParam) || 1, 1);
  const limit = Math.min(Math.max(Number(limitParam) || 25, 1), 100);
  const offset = (page - 1) * limit;

  let baseQuery = `
    SELECT c.courseId, c.courseName, c.courseNumber, c.deptCode,
           cd.deptName,
           COUNT(p.postId) AS listingCount
    FROM course c
    JOIN courseDepartment cd ON c.deptCode = cd.deptCode
    LEFT JOIN post p ON p.courseId = c.courseId
  `;

  const params: Array<string | number> = [];
  const conditions: string[] = [];

  if (search) {
    conditions.push(
      "(c.courseName LIKE ? OR CONCAT(c.deptCode, c.courseNumber) LIKE ? OR CONCAT(c.deptCode, ' ', c.courseNumber) LIKE ? OR c.deptCode LIKE ?)"
    );
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (dept) {
    conditions.push("c.deptCode = ?");
    params.push(dept);
  }

  if (conditions.length > 0) {
    baseQuery += " WHERE " + conditions.join(" AND ");
  }

  const queryParams = [...params];
  let query = `
    ${baseQuery}
    GROUP BY c.courseId, c.courseName, c.courseNumber, c.deptCode, cd.deptName
    ORDER BY c.deptCode, c.courseNumber
  `;

  if (shouldPaginate) {
    query += " LIMIT ? OFFSET ?";
    queryParams.push(limit, offset);
  }

  const [rows] = await pool.query<RowDataPacket[]>(query, queryParams);

  if (!shouldPaginate) {
    return NextResponse.json(rows);
  }

  let countQuery = `
    SELECT COUNT(*) AS total
    FROM course c
    JOIN courseDepartment cd ON c.deptCode = cd.deptCode
  `;

  if (conditions.length > 0) {
    countQuery += " WHERE " + conditions.join(" AND ");
  }

  const [countRows] = await pool.query<RowDataPacket[]>(countQuery, params);
  const total = Number(countRows[0]?.total || 0);

  return NextResponse.json({
    courses: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  });
}

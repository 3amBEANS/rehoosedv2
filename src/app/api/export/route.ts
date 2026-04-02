import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

export async function GET(req: NextRequest) {
  const username = await getCurrentUser();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const format = req.nextUrl.searchParams.get("format") || "json";
  const table = req.nextUrl.searchParams.get("table") || "posts";

  let rows: RowDataPacket[];

  if (table === "posts") {
    [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.postId, p.title, p.description, p.createdAt, p.sellerUser,
              c.courseName, CONCAT(c.deptCode, c.courseNumber) AS courseCode,
              dp.fileUrl, pp.location, pp.condition,
              CASE WHEN dp.postId IS NOT NULL THEN 'Digital' ELSE 'Physical' END AS type
       FROM post p
       JOIN course c ON c.courseId = p.courseId
       LEFT JOIN digitalPost dp ON dp.postId = p.postId
       LEFT JOIN physicalPost pp ON pp.postId = p.postId
       ORDER BY p.createdAt DESC`
    );
  } else if (table === "courses") {
    [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.courseId, c.courseName, c.courseNumber, c.deptCode, cd.deptName,
              COUNT(p.postId) AS listingCount
       FROM course c
       JOIN courseDepartment cd ON c.deptCode = cd.deptCode
       LEFT JOIN post p ON p.courseId = c.courseId
       GROUP BY c.courseId
       HAVING listingCount > 0
       ORDER BY c.deptCode, c.courseNumber`
    );
  } else {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }

  if (format === "csv") {
    if (rows.length === 0) {
      return new NextResponse("", {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename=${table}.csv`,
        },
      });
    }
    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            if (val === null || val === undefined) return "";
            const str = String(val);
            return str.includes(",") || str.includes('"') || str.includes("\n")
              ? `"${str.replace(/"/g, '""')}"`
              : str;
          })
          .join(",")
      ),
    ];
    return new NextResponse(csvLines.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=${table}.csv`,
      },
    });
  }

  return NextResponse.json(rows);
}

import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;

  const [courseRows] = await pool.query<RowDataPacket[]>(
    `SELECT c.courseId, c.courseName, c.courseNumber, c.deptCode, cd.deptName
     FROM course c
     JOIN courseDepartment cd ON c.deptCode = cd.deptCode
     WHERE c.courseId = ?`,
    [courseId]
  );

  if (courseRows.length === 0) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const [posts] = await pool.query<RowDataPacket[]>(
    `SELECT p.postId, p.title, p.description, p.createdAt, p.sellerUser,
            dp.fileUrl, pp.location, pp.condition,
            CASE WHEN dp.postId IS NOT NULL THEN 1 ELSE 0 END AS isDigital,
            (SELECT imageUrl FROM postImage pi WHERE pi.postId = p.postId LIMIT 1) AS thumbnail,
            (SELECT COUNT(*) FROM \`like\` l WHERE l.postId = p.postId) AS likeCount
     FROM post p
     LEFT JOIN digitalPost dp ON dp.postId = p.postId
     LEFT JOIN physicalPost pp ON pp.postId = p.postId
     WHERE p.courseId = ?
     ORDER BY p.createdAt DESC`,
    [courseId]
  );

  return NextResponse.json({ course: courseRows[0], posts });
}

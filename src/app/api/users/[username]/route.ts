import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT username, email, joinDate, profilePhoto FROM user WHERE username = ?",
    [username]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [posts] = await pool.query<RowDataPacket[]>(
    `SELECT p.postId, p.title, p.description, p.createdAt, p.courseId,
            c.courseName, c.deptCode, c.courseNumber,
            CASE WHEN dp.postId IS NOT NULL THEN 1 ELSE 0 END AS isDigital,
            (SELECT imageUrl FROM postImage pi WHERE pi.postId = p.postId LIMIT 1) AS thumbnail
     FROM post p
     JOIN course c ON c.courseId = p.courseId
     LEFT JOIN digitalPost dp ON dp.postId = p.postId
     WHERE p.sellerUser = ?
     ORDER BY p.createdAt DESC`,
    [username]
  );

  return NextResponse.json({ user: rows[0], posts });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const currentUser = await getCurrentUser();
  const { username } = await params;

  if (!currentUser || currentUser !== username) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, profilePhoto } = await req.json();

  const updates: string[] = [];
  const values: string[] = [];

  if (email) {
    updates.push("email = ?");
    values.push(email);
  }
  if (profilePhoto !== undefined) {
    updates.push("profilePhoto = ?");
    values.push(profilePhoto);
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  values.push(username);
  await pool.query(`UPDATE user SET ${updates.join(", ")} WHERE username = ?`, values);

  return NextResponse.json({ success: true });
}

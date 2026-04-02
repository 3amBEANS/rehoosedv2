import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;

  const [posts] = await pool.query<RowDataPacket[]>(
    `SELECT p.postId, p.title, p.description, p.createdAt, p.sellerUser, p.courseId,
            c.courseName, c.courseNumber, c.deptCode,
            dp.fileUrl, pp.location, pp.condition,
            CASE WHEN dp.postId IS NOT NULL THEN 1 ELSE 0 END AS isDigital,
            (SELECT COUNT(*) FROM \`like\` l WHERE l.postId = p.postId) AS likeCount,
            u.profilePhoto AS sellerPhoto
     FROM post p
     JOIN course c ON c.courseId = p.courseId
     LEFT JOIN digitalPost dp ON dp.postId = p.postId
     LEFT JOIN physicalPost pp ON pp.postId = p.postId
     LEFT JOIN user u ON u.username = p.sellerUser
     WHERE p.postId = ?`,
    [postId]
  );

  if (posts.length === 0) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const [images] = await pool.query<RowDataPacket[]>(
    "SELECT imageId, imageUrl FROM postImage WHERE postId = ?",
    [postId]
  );

  const [comments] = await pool.query<RowDataPacket[]>(
    `SELECT cm.commentId, cm.content, cm.timestamp, cm.user,
            u.profilePhoto
     FROM comment cm
     LEFT JOIN user u ON u.username = cm.user
     WHERE cm.postId = ?
     ORDER BY cm.timestamp DESC`,
    [postId]
  );

  const currentUser = await getCurrentUser();
  let userLiked = false;
  if (currentUser) {
    const [likeRows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM `like` WHERE user = ? AND postId = ?",
      [currentUser, postId]
    );
    userLiked = likeRows.length > 0;
  }

  return NextResponse.json({
    post: posts[0],
    images,
    comments,
    userLiked,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const username = await getCurrentUser();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;

  const [existing] = await pool.query<RowDataPacket[]>(
    "SELECT sellerUser FROM post WHERE postId = ?",
    [postId]
  );
  if (existing.length === 0) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  if (existing[0].sellerUser !== username) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, description, fileUrl, location, condition } = await req.json();

  await pool.query(
    "UPDATE post SET title = ?, description = ? WHERE postId = ?",
    [title, description, postId]
  );

  // Update subtype tables
  const [dp] = await pool.query<RowDataPacket[]>(
    "SELECT postId FROM digitalPost WHERE postId = ?",
    [postId]
  );
  if (dp.length > 0 && fileUrl !== undefined) {
    await pool.query("UPDATE digitalPost SET fileUrl = ? WHERE postId = ?", [
      fileUrl,
      postId,
    ]);
  }
  const [pp] = await pool.query<RowDataPacket[]>(
    "SELECT postId FROM physicalPost WHERE postId = ?",
    [postId]
  );
  if (pp.length > 0) {
    if (location !== undefined)
      await pool.query("UPDATE physicalPost SET location = ? WHERE postId = ?", [
        location,
        postId,
      ]);
    if (condition !== undefined)
      await pool.query(
        "UPDATE physicalPost SET `condition` = ? WHERE postId = ?",
        [condition, postId]
      );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const username = await getCurrentUser();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;

  const [existing] = await pool.query<RowDataPacket[]>(
    "SELECT sellerUser FROM post WHERE postId = ?",
    [postId]
  );
  if (existing.length === 0) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  if (existing[0].sellerUser !== username) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await pool.query("DELETE FROM post WHERE postId = ?", [postId]);
  return NextResponse.json({ success: true });
}

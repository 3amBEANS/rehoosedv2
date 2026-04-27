import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET() {
  const username = await getCurrentUser();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT conv.conversationId,
            conv.user1, conv.user2,
            conv.postId,
            CASE WHEN conv.user1 = ? THEN conv.user2 ELSE conv.user1 END AS otherUser,
            (SELECT u.profilePhoto FROM user u
             WHERE u.username = CASE WHEN conv.user1 = ? THEN conv.user2 ELSE conv.user1 END) AS otherUserPhoto,
            p.title  AS postTitle,
            c.deptCode AS postDeptCode,
            c.courseNumber AS postCourseNumber,
            (SELECT pi.imageUrl FROM postImage pi WHERE pi.postId = conv.postId LIMIT 1) AS postThumbnail,
            (SELECT m.content FROM message m
             WHERE m.conversationId = conv.conversationId
             ORDER BY m.timestamp DESC LIMIT 1) AS lastMessage,
            (SELECT m.timestamp FROM message m
             WHERE m.conversationId = conv.conversationId
             ORDER BY m.timestamp DESC LIMIT 1) AS lastMessageTime
     FROM conversation conv
     LEFT JOIN post p   ON p.postId   = conv.postId
     LEFT JOIN course c ON c.courseId = p.courseId
     WHERE conv.user1 = ? OR conv.user2 = ?
     ORDER BY (lastMessageTime IS NULL), lastMessageTime DESC`,
    [username, username, username, username]
  );

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const username = await getCurrentUser();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { otherUser, postId } = await req.json();

  if (!otherUser || otherUser === username) {
    return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  }

  // If a postId is supplied, prefer an existing conversation already anchored
  // to that listing (FB-Marketplace style: one thread per pair-per-listing).
  // Fall back to any existing thread between the pair so we don't create
  // duplicates for ad-hoc chats.
  if (postId) {
    const [scoped] = await pool.query<RowDataPacket[]>(
      `SELECT conversationId FROM conversation
       WHERE postId = ?
         AND ((user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?))
       LIMIT 1`,
      [postId, username, otherUser, otherUser, username]
    );
    if (scoped.length > 0) {
      return NextResponse.json({ conversationId: scoped[0].conversationId });
    }

    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO conversation (user1, user2, postId) VALUES (?, ?, ?)",
      [username, otherUser, postId]
    );
    return NextResponse.json(
      { conversationId: result.insertId },
      { status: 201 }
    );
  }

  const [existing] = await pool.query<RowDataPacket[]>(
    `SELECT conversationId FROM conversation
     WHERE postId IS NULL
       AND ((user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?))
     LIMIT 1`,
    [username, otherUser, otherUser, username]
  );
  if (existing.length > 0) {
    return NextResponse.json({ conversationId: existing[0].conversationId });
  }

  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO conversation (user1, user2) VALUES (?, ?)",
    [username, otherUser]
  );
  return NextResponse.json(
    { conversationId: result.insertId },
    { status: 201 }
  );
}

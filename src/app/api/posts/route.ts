import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("q") || "";
  const type = req.nextUrl.searchParams.get("type") || ""; // digital, physical
  const condition = req.nextUrl.searchParams.get("condition") || "";
  const sort = req.nextUrl.searchParams.get("sort") || "newest";
  const courseId = req.nextUrl.searchParams.get("courseId") || "";

  let query = `
    SELECT p.postId, p.title, p.description, p.createdAt, p.sellerUser, p.courseId,
           c.courseName, c.courseNumber, c.deptCode,
           dp.fileUrl, pp.location, pp.condition,
           CASE WHEN dp.postId IS NOT NULL THEN 1 ELSE 0 END AS isDigital,
           (SELECT imageUrl FROM postImage pi WHERE pi.postId = p.postId LIMIT 1) AS thumbnail,
           (SELECT COUNT(*) FROM \`like\` l WHERE l.postId = p.postId) AS likeCount,
           (SELECT COUNT(*) FROM comment cm WHERE cm.postId = p.postId) AS commentCount
    FROM post p
    JOIN course c ON c.courseId = p.courseId
    LEFT JOIN digitalPost dp ON dp.postId = p.postId
    LEFT JOIN physicalPost pp ON pp.postId = p.postId
  `;

  const params: string[] = [];
  const conditions: string[] = [];

  if (search) {
    conditions.push("(p.title LIKE ? OR p.description LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  if (type === "digital") {
    conditions.push("dp.postId IS NOT NULL");
  } else if (type === "physical") {
    conditions.push("pp.postId IS NOT NULL");
  }

  if (condition) {
    conditions.push("pp.condition = ?");
    params.push(condition);
  }

  if (courseId) {
    conditions.push("p.courseId = ?");
    params.push(courseId);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  switch (sort) {
    case "oldest":
      query += " ORDER BY p.createdAt ASC";
      break;
    case "title":
      query += " ORDER BY p.title ASC";
      break;
    case "likes":
      query += " ORDER BY likeCount DESC";
      break;
    default:
      query += " ORDER BY p.createdAt DESC";
  }

  const [rows] = await pool.query<RowDataPacket[]>(query, params);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const username = await getCurrentUser();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, courseId, isDigital, fileUrl, location, condition } =
    await req.json();

  if (!title || !description || !courseId) {
    return NextResponse.json(
      { error: "Title, description, and courseId are required" },
      { status: 400 }
    );
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query<ResultSetHeader>(
      "INSERT INTO post (title, description, createdAt, courseId, sellerUser) VALUES (?, ?, NOW(), ?, ?)",
      [title, description, courseId, username]
    );

    const postId = result.insertId;

    if (isDigital) {
      await connection.query(
        "INSERT INTO digitalPost (postId, fileUrl) VALUES (?, ?)",
        [postId, fileUrl || ""]
      );
    } else {
      await connection.query(
        "INSERT INTO physicalPost (postId, location, `condition`) VALUES (?, ?, ?)",
        [postId, location || "", condition || "Good"]
      );
    }

    await connection.commit();
    return NextResponse.json({ postId }, { status: 201 });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

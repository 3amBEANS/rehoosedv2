import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyPassword, createToken, getTokenCookieOptions } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    );
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT username, password, email, profilePhoto FROM user WHERE username = ?",
    [username]
  );

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }

  const user = rows[0];
  const valid = await verifyPassword(password, user.password);

  if (!valid) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }

  const token = await createToken(user.username);
  const response = NextResponse.json({
    username: user.username,
    email: user.email,
    profilePhoto: user.profilePhoto,
  });
  response.cookies.set(getTokenCookieOptions(token));
  return response;
}

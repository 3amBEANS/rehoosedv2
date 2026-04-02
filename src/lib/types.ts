export interface User {
  username: string;
  password: string;
  email: string;
  joinDate: string;
  profilePhoto: string | null;
}

export interface CourseDepartment {
  deptCode: string;
  deptName: string;
}

export interface Course {
  courseId: number;
  courseName: string;
  courseNumber: string;
  deptCode: string;
  originalCourseId: string | null;
}

export interface Post {
  postId: number;
  title: string;
  description: string;
  createdAt: string;
  courseId: number;
  sellerUser: string;
}

export interface DigitalPost {
  postId: number;
  fileUrl: string;
}

export interface PhysicalPost {
  postId: number;
  location: string;
  condition: string;
}

export interface PostImage {
  imageId: number;
  postId: number;
  imageUrl: string;
}

export interface Like {
  user: string;
  postId: number;
  timestamp: string;
}

export interface Comment {
  commentId: number;
  postId: number;
  user: string;
  content: string;
  timestamp: string;
}

export interface Conversation {
  conversationId: number;
  user1: string;
  user2: string;
}

export interface Message {
  messageId: number;
  conversationId: number;
  senderUser: string;
  receiverUser: string;
  content: string;
  timestamp: string;
}

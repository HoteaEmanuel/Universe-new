export type Post = {
  _id: string;
  userId: string;
  title: string;
  body: string;
  location?: string;
  tags: string[];
  imagesUrls: string[];
  likes: string[];
  isSaved?: boolean;
  createdAt: string;
};

export type PostAuthor = {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  profilePicture?: string;
};

export type PostComment = {
  _id: string;
  userId: string;
  postId: string;
  text: string;
  createdAt: string;
  isLiked: boolean;
};

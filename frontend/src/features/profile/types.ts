export type ProfileUser = {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  profilePicture?: string;
  university?: string;
  major?: string;
  bio?: string;
  accountType?: "normal" | "business";
};

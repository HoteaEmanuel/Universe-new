import type { ReactNode } from "react";

type PostFormCardProps = {
  title: string;
  children: ReactNode;
  maxWidthClass?: string;
};

const PostFormCard = ({
  title,
  children,
  maxWidthClass = "max-w-2xl",
}: PostFormCardProps) => {
  return (
    <div className={`mx-auto flex w-full flex-col gap-6 ${maxWidthClass}`}>
      <h1 className="text-2xl font-semibold">{title}</h1>
      {children}
    </div>
  );
};

export default PostFormCard;

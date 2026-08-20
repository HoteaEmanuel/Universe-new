import type { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import AuthImagePanel from "./AuthImagePanel";
import "@/stars.css";

type AuthCardProps = {
  title?: string;
  children: ReactNode;
  maxWidthClass?: string;
  variant?: "login" | "signup";
};

const AuthCard = ({
  title,
  children,
  maxWidthClass = "max-w-sm",
  variant = "login",
}: AuthCardProps) => {
  return (
    <div className="relative flex min-h-screen w-screen flex-col lg:flex-row">
      <AuthImagePanel variant={variant} />

      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-12 lg:w-1/2 lg:flex-none lg:px-10">
        <div className="dot-pattern" />
        <div className="star-layer absolute inset-0 -z-10">
          <div id="stars" />
          <div id="stars2" />
          <div id="stars3" />
        </div>
        <div className={`relative z-10 w-full ${maxWidthClass}`}>
          <div className="nebula-glow" />
          <Card className="auth-card relative z-10 animate-fade-in-up py-6 sm:py-8">
            {title && (
              <CardHeader className="">
                <CardTitle className="text-center text-2xl font-black heading-text-1 auth-heading-serif sm:text-4xl">
                  {title}
                </CardTitle>
              </CardHeader>
            )}
            <CardContent className="flex flex-col gap-4">{children}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthCard;

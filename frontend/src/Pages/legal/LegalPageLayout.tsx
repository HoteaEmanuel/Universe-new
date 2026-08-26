import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LegalPageLayoutProps = {
  title: string;
  lastUpdated: string;
  children: ReactNode;
};

const LegalPageLayout = ({
  title,
  lastUpdated,
  children,
}: LegalPageLayoutProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = title;
  }, [title]);

  const handleBack = () => {
   
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/signup");
    }
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16 sm:px-10">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleBack}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ml-3 w-fit",
            )}
          >
            Back
          </button>
          <h1 className="heading-text-1 text-3xl font-black sm:text-4xl">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated {lastUpdated}
          </p>
        </div>

        <div className="flex flex-col gap-8 text-sm leading-relaxed text-foreground [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default LegalPageLayout;

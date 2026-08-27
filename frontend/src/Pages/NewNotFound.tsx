import { ArrowLeft, House } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STAR_LAYERS = [0, 1, 2, 3];
const STARS_PER_LAYER = [0, 1, 2, 3, 4, 5, 6];

const NewNotFound = () => {
  const navigate = useNavigate();

  return (
    <main className="not-found-page">
      <div className="not-found-starfield" aria-hidden="true">
        {STAR_LAYERS.map((layer) => (
          <div className={`not-found-stars not-found-stars--${layer + 1}`} key={layer}>
            {STARS_PER_LAYER.map((star) => (
              <span className={`not-found-star not-found-star--${star + 1}`} key={star} />
            ))}
          </div>
        ))}
      </div>
      <section className="not-found-content" aria-labelledby="not-found-title-new">
        <div className="not-found-copy">
          <p className="not-found-code" aria-label="Error 404">404</p>
          <h1 id="not-found-title-new">You drifted off course.</h1>
          <p>This corner of the Universe doesn&apos;t exist. Head back to the last page, or return to familiar territory.</p>
          <div className="not-found-actions">
            <button type="button" onClick={() => navigate(-1)} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "not-found-action not-found-action--secondary")}>
              <ArrowLeft aria-hidden="true" /> Go back
            </button>
            <Link to="/" className={cn(buttonVariants({ size: "lg" }), "not-found-action not-found-action--primary")}>
              <House aria-hidden="true" /> Take me home
            </Link>
          </div>
        </div>
        <div className="not-found-scene" aria-hidden="true">
          <div className="not-found-planet" />
          <div className="not-found-astronaut">
            <div className="not-found-schoolbag" />
            <div className="not-found-head" />
            <div className="not-found-arm not-found-arm--left" />
            <div className="not-found-arm not-found-arm--right" />
            <div className="not-found-body"><div className="not-found-panel" /></div>
            <div className="not-found-leg not-found-leg--left" />
            <div className="not-found-leg not-found-leg--right" />
          </div>
        </div>
      </section>
    </main>
  );
};

export default NewNotFound;

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { BriefcaseBusiness, Loader2, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PostCard from "@/features/posts/components/PostCard";
import PostSkeleton from "@/features/posts/components/PostSkeleton";
import { useDebounce } from "@/hooks/Debounce";
import { useOpportunitiesInfiniteQuery } from "@/queryAndMutation/queries/post-queries";
import type { OpportunityFilters, OpportunityType, WorkplaceType } from "@/queryAndMutation/types";
import { findScrollableAncestor } from "@/utils/scroll";

const ALL = "all";
const SCROLL_FETCH_THRESHOLD = 180;

export default function OpportunitiesPage() {
  useEffect(() => { document.title = "Jobs & internships"; }, []);
  const [search, setSearch] = useState("");
  const [opportunityType, setOpportunityType] = useState<OpportunityType | undefined>();
  const [workplaceType, setWorkplaceType] = useState<WorkplaceType | undefined>();
  const [status, setStatus] = useState<"active" | "expired" | "all">("active");
  const [sort, setSort] = useState<"newest" | "deadline">("newest");
  const [savedOnly, setSavedOnly] = useState(false);
  const debouncedSearch = useDebounce(search, 350);
  const filters = useMemo<OpportunityFilters>(() => ({
    q: debouncedSearch.trim(), opportunityType, workplaceType, status, sort, savedOnly,
  }), [debouncedSearch, opportunityType, workplaceType, status, sort, savedOnly]);
  const query = useOpportunitiesInfiniteQuery(filters);
  const posts = query.data?.pages.flatMap((page) => page.posts) ?? [];
  const scrollRef = useRef<HTMLElement | null>(null);
  const listRef = useCallback((node: HTMLDivElement | null) => { scrollRef.current = findScrollableAncestor(node); }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const onScroll = () => {
      const remaining = element.scrollHeight - element.scrollTop - element.clientHeight;
      if (remaining < SCROLL_FETCH_THRESHOLD && query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
    };
    element.addEventListener("scroll", onScroll);
    return () => element.removeEventListener("scroll", onScroll);
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage, posts.length]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-24 md:px-0 md:pb-10">
      <header className="flex flex-col gap-4 rounded-2xl bg-primary/[0.07] p-5 dark:bg-brand-400/10 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><BriefcaseBusiness className="size-5" /></span>
          <div>
            <h1 className="text-balance text-2xl font-bold tracking-tight">Jobs and internships for student life</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Discover opportunities from verified organizations, save the promising ones, and apply on the employer’s website.</p>
          </div>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" value={search} onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)} className="h-11 bg-background pl-9" placeholder="Search roles, companies, skills, or majors" aria-label="Search opportunities" />
        </div>
      </header>

      <section aria-label="Opportunity filters" className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal className="size-4" />Narrow your search</div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Select value={opportunityType ?? ALL} onValueChange={(value: unknown) => setOpportunityType(value === ALL ? undefined : value as OpportunityType)}>
            <SelectTrigger className="h-10 w-full sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value={ALL}>All opportunities</SelectItem><SelectItem value="internship">Internships</SelectItem><SelectItem value="part_time">Part-time</SelectItem><SelectItem value="full_time">Full-time</SelectItem><SelectItem value="graduate_program">Graduate programs</SelectItem><SelectItem value="volunteering">Volunteering</SelectItem><SelectItem value="campus_ambassador">Campus ambassador</SelectItem></SelectContent>
          </Select>
          <Select value={workplaceType ?? ALL} onValueChange={(value: unknown) => setWorkplaceType(value === ALL ? undefined : value as WorkplaceType)}>
            <SelectTrigger className="h-10 w-full sm:w-36"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value={ALL}>Any workplace</SelectItem><SelectItem value="onsite">On-site</SelectItem><SelectItem value="hybrid">Hybrid</SelectItem><SelectItem value="remote">Remote</SelectItem></SelectContent>
          </Select>
          <Select value={status} onValueChange={(value: unknown) => setStatus(value as typeof status)}>
            <SelectTrigger className="h-10 w-full sm:w-32"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="active">Open</SelectItem><SelectItem value="expired">Closed</SelectItem><SelectItem value="all">All statuses</SelectItem></SelectContent>
          </Select>
          <Select value={sort} onValueChange={(value: unknown) => setSort(value as typeof sort)}>
            <SelectTrigger className="h-10 w-full sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="newest">Newest first</SelectItem><SelectItem value="deadline">Deadline soon</SelectItem></SelectContent>
          </Select>
          <Button type="button" variant={savedOnly ? "default" : "outline"} className="col-span-2 sm:ml-auto" onClick={() => setSavedOnly((value) => !value)}>Saved only</Button>
        </div>
      </section>

      <div ref={listRef} className="flex flex-col gap-6">
        {query.isPending && <><PostSkeleton /><PostSkeleton /></>}
        {query.isError && <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center"><p className="font-semibold">Couldn’t load opportunities</p><p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p><Button className="mt-4" variant="outline" onClick={() => query.refetch()}>Try again</Button></div>}
        {!query.isPending && !query.isError && posts.length === 0 && <div className="rounded-2xl border border-dashed border-border py-14 text-center"><BriefcaseBusiness className="mx-auto size-9 text-muted-foreground" /><p className="mt-3 font-semibold">No matching opportunities</p><p className="mt-1 text-sm text-muted-foreground">Try a broader search or clear one of the filters.</p></div>}
        {posts.map((post) => <PostCard key={post.id} post={post} />)}
        {query.isFetchingNextPage && <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />}
      </div>
    </main>
  );
}

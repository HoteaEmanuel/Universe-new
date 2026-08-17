import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { Search, X, Loader2, Compass } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/Debounce";
import PostCard from "@/features/posts/components/PostCard";
import PostSkeleton from "@/features/posts/components/PostSkeleton";
import SearchUserRow from "./components/SearchUserRow";
import SearchGroupRow from "./components/SearchGroupRow";
import UniversityPersonRow from "./components/UniversityPersonRow";
import {
  ExploreHeaderAccent,
  NoGroupsIllustration,
  NoNewsIllustration,
  NoPeopleIllustration,
  NoPostsIllustration,
  NoResultsIllustration,
} from "./components/ExploreIllustrations";
import { formatToLocalDate } from "@/utils/formatDatetoLocal";
import {
  useGetTopNewsQuery,
  useGetNewsByCategoryQuery,
  type NewsArticle,
} from "@/queryAndMutation/queries/news-queries";
import {
  useSearchOverviewQuery,
  useSearchUsersInfinite,
  useSearchPostsInfinite,
  useSearchGroupsInfinite,
} from "@/queryAndMutation/queries/search-queries";
import { useUniversityPeopleInfiniteQuery } from "@/queryAndMutation/queries/user-queries";
import { useAuthStore } from "@/store/authStore";
import { findScrollableAncestor } from "@/utils/scroll";
import type { SearchPage } from "@/queryAndMutation/types";
import {
  useExploreFilters,
  NEWS_TOPICS,
  type TabKey,
} from "./hooks/useExploreFilters";

const NO_UNIVERSITY_PLACEHOLDER = "No university yet";
const UNIVERSITY_TEASER_SIZE = 6;
const SCROLL_FETCH_THRESHOLD = 150;

const SEARCH_DEBOUNCE_MS = 350;
const OVERVIEW_PREVIEW_SIZE = 5;

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "people", label: "People" },
  { key: "posts", label: "Posts" },
  { key: "groups", label: "Groups" },
];

const countLabel = (page?: SearchPage<unknown>) =>
  page ? `${page.items.length}${page.hasMore ? "+" : ""}` : null;

const RowSkeleton = () => (
  <li className="flex items-center gap-3 p-2">
    <Skeleton className="size-12 rounded-full" />
    <div className="flex flex-col gap-1.5">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-2.5 w-20" />
    </div>
  </li>
);

const EmptyState = ({
  illustration,
  title,
  subtitle,
}: {
  illustration: ReactNode;
  title: string;
  subtitle?: string;
}) => (
  <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-12 text-center">
    {illustration}
    <div className="flex flex-col gap-1">
      <p className="font-medium">{title}</p>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  </div>
);

const LoadMoreButton = ({
  onClick,
  isLoading,
}: {
  onClick: () => void;
  isLoading: boolean;
}) => (
  <Button
    variant="ghost"
    onClick={onClick}
    disabled={isLoading}
    className="mx-auto mt-2"
  >
    {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Load more"}
  </Button>
);

const Explore = () => {
  useEffect(() => {
    document.title = "Explore";
  }, []);

  const { filters, setFilters } = useExploreFilters();
  const { user: authUser } = useAuthStore();
  const hasUniversity =
    !!authUser?.university && authUser.university !== NO_UNIVERSITY_PLACEHOLDER;

  const [searchTerm, setSearchTerm] = useState(filters.q);
  const debouncedSearch = useDebounce(searchTerm, SEARCH_DEBOUNCE_MS);
  const trimmedQuery = debouncedSearch.trim();
  const isSearching = trimmedQuery.length > 2;

  const activeTab = filters.tab;
  const isFirstQueryChange = useRef(true);
  useEffect(() => {
    if (isFirstQueryChange.current) {
      isFirstQueryChange.current = false;
      setFilters({ q: trimmedQuery });
      return;
    }
    setFilters({ q: trimmedQuery, tab: "all" });
  }, [trimmedQuery, setFilters]);

  const selectedTopic = filters.topic;

  const { data: overview, isPending: isOverviewPending } =
    useSearchOverviewQuery(trimmedQuery, isSearching);

  const usersQuery = useSearchUsersInfinite(
    trimmedQuery,
    isSearching && activeTab === "people",
  );
  const postsQuery = useSearchPostsInfinite(
    trimmedQuery,
    isSearching && activeTab === "posts",
  );
  const groupsQuery = useSearchGroupsInfinite(
    trimmedQuery,
    isSearching && activeTab === "groups",
  );
  const universityPeopleQuery = useUniversityPeopleInfiniteQuery(hasUniversity);

  const { data: topNews, isPending: isTopNewsPending } = useGetTopNewsQuery();
  const { data: topicNews, isPending: isTopicNewsPending } =
    useGetNewsByCategoryQuery(selectedTopic ?? "");

  const newsToShow: NewsArticle[] | undefined = selectedTopic
    ? topicNews
    : topNews;
  const isNewsPending = selectedTopic ? isTopicNewsPending : isTopNewsPending;

  const users = usersQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const posts = postsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const groups = groupsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const universityPeople =
    universityPeopleQuery.data?.pages.flatMap((page) => page.people) ?? [];
  const {
    hasNextPage: hasNextUniversityPage,
    isFetchingNextPage: isFetchingNextUniversityPage,
    fetchNextPage: fetchNextUniversityPage,
  } = universityPeopleQuery;
  // Explore doesn't own a scroll container - RootLayout's <section> around
  // the routed page is what actually scrolls - so the ancestor is found at
  // runtime the same way CommentsContainer does, rather than assuming a
  // fixed DOM structure.
  const universityScrollContainerRef = useRef<HTMLElement | null>(null);
  const universityListRef = useCallback((node: HTMLUListElement | null) => {
    universityScrollContainerRef.current = findScrollableAncestor(node);
  }, []);
  useEffect(() => {
    const scrollEl = universityScrollContainerRef.current;
    if (!scrollEl) return;

    const handleScroll = () => {
      const distanceFromBottom =
        scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
      if (
        hasNextUniversityPage &&
        !isFetchingNextUniversityPage &&
        distanceFromBottom < SCROLL_FETCH_THRESHOLD
      ) {
        fetchNextUniversityPage();
      }
    };
    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [
    hasNextUniversityPage,
    isFetchingNextUniversityPage,
    fetchNextUniversityPage,
    universityPeople.length,
  ]);

  const showTabsShell = isSearching || activeTab === "people";

  const hasAnyOverviewResults =
    !!overview &&
    (overview.users.items.length > 0 ||
      overview.posts.items.length > 0 ||
      overview.groups.items.length > 0);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-4 pb-24 md:pb-10">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Compass className="size-5" />
        </span>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-foreground">Explore</h1>
          <p className="text-sm text-muted-foreground">
            Find people, posts, and groups across Universe
          </p>
        </div>
        <ExploreHeaderAccent className="ml-auto hidden h-10 w-32 sm:block" />
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search people, posts, and groups..."
          className="h-11 pl-9 pr-9"
          value={searchTerm}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setSearchTerm(e.target.value)
          }
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {showTabsShell ? (
        <Tabs
          value={activeTab}
          onValueChange={(value: unknown) =>
            setFilters({ tab: value as TabKey })
          }
          className="gap-4"
        >
          <TabsList>
            {TABS.map((tab) => {
              const count =
                tab.key === "people"
                  ? countLabel(overview?.users)
                  : tab.key === "posts"
                    ? countLabel(overview?.posts)
                    : tab.key === "groups"
                      ? countLabel(overview?.groups)
                      : null;
              return (
                <TabsTrigger key={tab.key} value={tab.key}>
                  {tab.label}
                  {count !== null && ` (${count})`}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="all">
            <div className="flex flex-col gap-8">
              {isOverviewPending && (
                <ul className="flex flex-col gap-1">
                  <RowSkeleton />
                  <RowSkeleton />
                  <RowSkeleton />
                </ul>
              )}

              {!isOverviewPending && !hasAnyOverviewResults && (
                <EmptyState
                  illustration={<NoResultsIllustration className="size-32" />}
                  title="No results found"
                  subtitle={`Nothing matched "${trimmedQuery}"`}
                />
              )}

              {!isOverviewPending &&
                overview &&
                overview.users.items.length > 0 && (
                  <section className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold">People</h2>
                      {(overview.users.hasMore ||
                        overview.users.items.length ===
                          OVERVIEW_PREVIEW_SIZE) && (
                        <button
                          onClick={() => setFilters({ tab: "people" })}
                          className="text-sm text-muted-foreground hover:text-foreground"
                        >
                          See all
                        </button>
                      )}
                    </div>
                    <ul className="flex flex-col gap-1">
                      {overview.users.items.map((user) => (
                        <SearchUserRow key={user.id} user={user} />
                      ))}
                    </ul>
                  </section>
                )}

              {!isOverviewPending &&
                overview &&
                overview.groups.items.length > 0 && (
                  <section className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold">Groups</h2>
                      {(overview.groups.hasMore ||
                        overview.groups.items.length ===
                          OVERVIEW_PREVIEW_SIZE) && (
                        <button
                          onClick={() => setFilters({ tab: "groups" })}
                          className="text-sm text-muted-foreground hover:text-foreground"
                        >
                          See all
                        </button>
                      )}
                    </div>
                    <ul className="flex flex-col gap-1">
                      {overview.groups.items.map((group) => (
                        <SearchGroupRow key={group.id} group={group} />
                      ))}
                    </ul>
                  </section>
                )}

              {!isOverviewPending &&
                overview &&
                overview.posts.items.length > 0 && (
                  <section className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold">Posts</h2>
                      {(overview.posts.hasMore ||
                        overview.posts.items.length ===
                          OVERVIEW_PREVIEW_SIZE) && (
                        <button
                          onClick={() => setFilters({ tab: "posts" })}
                          className="text-sm text-muted-foreground hover:text-foreground"
                        >
                          See all
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-4">
                      {overview.posts.items.map((post) => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                  </section>
                )}
            </div>
          </TabsContent>

          <TabsContent value="people">
            {trimmedQuery.length === 0 ? (
              <div className="flex flex-col gap-2">
                <h2 className="font-semibold">
                  People at {authUser?.university}
                </h2>
                {!hasUniversity && (
                  <EmptyState
                    illustration={<NoPeopleIllustration className="size-32" />}
                    title="Add a university email to see classmates"
                    subtitle="We couldn't match your account to a university yet."
                  />
                )}
                {hasUniversity && universityPeopleQuery.isPending && (
                  <ul className="flex flex-col gap-1">
                    <RowSkeleton />
                    <RowSkeleton />
                    <RowSkeleton />
                  </ul>
                )}
                {hasUniversity &&
                  !universityPeopleQuery.isPending &&
                  universityPeople.length === 0 && (
                    <EmptyState
                      illustration={
                        <NoPeopleIllustration className="size-32" />
                      }
                      title="No one else here yet"
                      subtitle={`No one else from ${authUser?.university} has joined yet.`}
                    />
                  )}
                {universityPeople.length > 0 && (
                  <ul ref={universityListRef} className="flex flex-col gap-1">
                    {universityPeople.map((user) => (
                      <UniversityPersonRow key={user.id} user={user} />
                    ))}
                  </ul>
                )}
                {isFetchingNextUniversityPage && (
                  <ul className="flex flex-col gap-1">
                    <RowSkeleton />
                  </ul>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {usersQuery.isPending && (
                  <ul className="flex flex-col gap-1">
                    <RowSkeleton />
                    <RowSkeleton />
                    <RowSkeleton />
                  </ul>
                )}
                {!usersQuery.isPending && users.length === 0 && (
                  <EmptyState
                    illustration={<NoPeopleIllustration className="size-32" />}
                    title="No people found"
                    subtitle={`Nothing matched "${trimmedQuery}"`}
                  />
                )}
                {users.length > 0 && (
                  <ul className="flex flex-col gap-1">
                    {users.map((user) => (
                      <SearchUserRow key={user.id} user={user} />
                    ))}
                  </ul>
                )}
                {usersQuery.hasNextPage && (
                  <LoadMoreButton
                    onClick={() => usersQuery.fetchNextPage()}
                    isLoading={usersQuery.isFetchingNextPage}
                  />
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="groups">
            <div className="flex flex-col gap-2">
              {groupsQuery.isPending && (
                <ul className="flex flex-col gap-1">
                  <RowSkeleton />
                  <RowSkeleton />
                  <RowSkeleton />
                </ul>
              )}
              {!groupsQuery.isPending && groups.length === 0 && (
                <EmptyState
                  illustration={<NoGroupsIllustration className="size-32" />}
                  title="No groups found"
                  subtitle={`Nothing matched "${trimmedQuery}"`}
                />
              )}
              {groups.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {groups.map((group) => (
                    <SearchGroupRow key={group.id} group={group} />
                  ))}
                </ul>
              )}
              {groupsQuery.hasNextPage && (
                <LoadMoreButton
                  onClick={() => groupsQuery.fetchNextPage()}
                  isLoading={groupsQuery.isFetchingNextPage}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="posts">
            <div className="flex flex-col gap-4">
              {postsQuery.isPending && (
                <>
                  <PostSkeleton />
                  <PostSkeleton />
                </>
              )}
              {!postsQuery.isPending && posts.length === 0 && (
                <EmptyState
                  illustration={<NoPostsIllustration className="size-32" />}
                  title="No posts found"
                  subtitle={`Nothing matched "${trimmedQuery}"`}
                />
              )}
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              {postsQuery.hasNextPage && (
                <LoadMoreButton
                  onClick={() => postsQuery.fetchNextPage()}
                  isLoading={postsQuery.isFetchingNextPage}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex flex-col gap-6">
          {hasUniversity && universityPeople.length > 0 && (
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">
                  People at {authUser?.university}
                </h2>
                <button
                  onClick={() => setFilters({ tab: "people" })}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  See all
                </button>
              </div>
              <ul className="flex flex-col gap-1">
                {universityPeople
                  .slice(0, UNIVERSITY_TEASER_SIZE)
                  .map((user) => (
                    <UniversityPersonRow key={user.id} user={user} />
                  ))}
              </ul>
            </section>
          )}

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Topics</h2>
            <ul className="flex flex-wrap gap-2">
              {NEWS_TOPICS.map((topic) => (
                <li key={topic}>
                  <button
                    onClick={() =>
                      setFilters({
                        topic: selectedTopic === topic ? null : topic,
                      })
                    }
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                      selectedTopic === topic
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {topic.charAt(0).toUpperCase() + topic.slice(1)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            {isNewsPending && (
              <>
                <Skeleton className="h-40 w-full rounded-2xl" />
                <Skeleton className="h-40 w-full rounded-2xl" />
              </>
            )}
            {!isNewsPending && newsToShow?.length === 0 && (
              <EmptyState
                illustration={<NoNewsIllustration className="size-32" />}
                title="No news available right now"
              />
            )}
            {!isNewsPending &&
              newsToShow?.map((article) => (
                <a
                  key={article.url}
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex gap-4 rounded-2xl border border-border p-4 transition-colors hover:bg-muted"
                >
                  {article.image && (
                    <img
                      src={article.image}
                      alt=""
                      className="size-24 shrink-0 rounded-xl object-cover"
                    />
                  )}
                  <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="line-clamp-2 font-medium">
                      {article.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {formatToLocalDate(article.publishedAt)}
                    </p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {article.description}
                    </p>
                  </div>
                </a>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Explore;

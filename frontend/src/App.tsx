import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import HomePage from "./Pages/HomePage";
import LandingPage from "./Pages/LandingPage";
import SignUpPage from "./auth/SignUpPage";
import LoginPage from "./auth/LoginPage";
import VerifyEmail from "./auth/VerifyEmail";
import ForgotPassword from "./auth/ForgotPassword";
import ResetPassword from "./auth/ResetPassword";
import ResendVerificationEmail from "./auth/ResendVerificationEmail";
import { useAuthStore } from "./store/authStore";
import ProfilePage from "./features/profile/ProfilePage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthLayout from "./auth/components/AuthLayout";
import RootLayout from "./Pages/RootLayout";
import ContentLayout from "./Pages/ContentLayout";
import CreatePost from "./features/posts/CreatePost";
import EditPost from "./features/posts/EditPost";
import Explore from "./features/search/Explore";
import PostDetails from "./features/posts/PostDetails";
import PublicPost from "./features/posts/PublicPost";
import PostDetailsModal from "./features/posts/components/PostDetailsModal";
import ChatContainer from "./features/chat/ChatContainer";
import Conversation from "./features/chat/Conversation";
import NewConvo from "./features/chat/NewConvo";
import Settings from "./Pages/Settings";
import SettingsHome from "./features/settings/SettingsHome";
import SettingsAccount from "./features/settings/SettingsAccount";
import SettingsNotifications from "./features/settings/SettingsNotifications";
import SettingsAppearance from "./features/settings/SettingsAppearance";
import SettingsPrivacy from "./features/settings/SettingsPrivacy";
import SettingsLegal from "./features/settings/SettingsLegal";
import RelatedPosts from "./features/posts/RelatedPosts";
import Admin from "./Pages/Admin";
import NotFound from "./Pages/NotFound";
import NewConversation from "./features/chat/NewConversation";
import Group from "./features/groups/Group";
import EditProfile from "./features/profile/EditProfile";
import Notifications from "./features/notifications/Notifications.tsx";
import EventsPage from "./features/events/EventsPage";
import EventDetails from "./features/events/EventDetails";
import PrivacyPolicy from "./Pages/legal/PrivacyPolicy";
import TermsOfService from "./Pages/legal/TermsOfService";
import OnboardingPage from "./Pages/onboarding/OnboardingPage";
import { TooltipProvider } from "./components/ui/tooltip";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user, isCheckingAuth } = useAuthStore();
  if (isCheckingAuth) return <p>Loading...</p>;
  if (!isAuthenticated) return <Navigate to={"/login"} replace />;
  if (!user?.isVerified) return <Navigate to={"/signup"} replace />;
  return children;
};

const ProtectedAdminRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user, isCheckingAuth } = useAuthStore();
  if (isCheckingAuth) return <p>Loading...</p>;
  if (!isAuthenticated) return <Navigate to={"/login"} replace />;
  if (!user?.isVerified) return <Navigate to={"/signup"} replace />;
  if (user.role !== "admin") return <Navigate to={"/home"} replace />;
  return children;
};

const AuthenticatedUser = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to={"/home"} />;
  return children;
};

// Gates the main app shell (feed, chat, etc.) behind the post-signup
// onboarding flow - a verified user who hasn't finished it yet is sent to
// /onboarding instead of landing on the feed cold.
const RequireOnboarded = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthStore();
  if (!user?.hasCompletedOnboarding) return <Navigate to={"/onboarding"} replace />;
  return children;
};

function App() {
  const { checkAuth } = useAuthStore();
  const location = useLocation();
  const backgroundLocation = location.state?.backgroundLocation;
  useEffect(() => {
    const cachedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", cachedTheme);
  }, []);
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
      <Toaster
        position="top-right"
        expand={true}
        richColors={true}
        toastOptions={{
          style: {
            background: "#1f2937",
            color: "#fff",
            border: "1px solid #374151",
            borderRadius: "12px",
            padding: "16px",
            fontSize: "14px",
          },
        }}
      />

      <div className="min-h-screen">
        <Routes location={backgroundLocation || location}>
          <Route
            path="/"
            element={
              <AuthenticatedUser>
                <LandingPage />
              </AuthenticatedUser>
            }
          />
          <Route path="/p/:id" element={<PublicPost />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="*" element={<NotFound />} />
          <Route
            element={
              <AuthenticatedUser>
                <AuthLayout />
              </AuthenticatedUser>
            }
          >
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/resend-verify-email"
              element={<ResendVerificationEmail />}
            ></Route>
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Route>
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <Admin />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            element={
              <ProtectedRoute>
                <RequireOnboarded>
                  <RootLayout />
                </RequireOnboarded>
              </ProtectedRoute>
            }
          >
            <Route element={<ContentLayout />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/u/:username" element={<ProfilePage />} />
              <Route path="/profile/edit-profile" element={<EditProfile />} />
              <Route path="/create-post" element={<CreatePost />} />
              <Route path="/edit-post/:id" element={<EditPost />} />
              <Route path="/post/:id" element={<PostDetails />} />
              <Route path="/explore/*" element={<Explore />} />
              <Route path="/related-posts/:tag" element={<RelatedPosts />} />
              <Route path="/settings" element={<Settings />}>
                <Route index element={<SettingsHome />} />
                <Route path="account" element={<SettingsAccount />} />
                <Route path="notifications" element={<SettingsNotifications />} />
                <Route path="appearance" element={<SettingsAppearance />} />
                <Route path="privacy" element={<SettingsPrivacy />} />
                <Route path="legal" element={<SettingsLegal />} />
              </Route>
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/chat" element={<ChatContainer />} />
              <Route path="/conversations/:id" element={<Conversation />} />
              <Route path="/new-conversation/:id" element={<NewConvo />} />
              <Route
                path="/create-conversation"
                element={<NewConversation />}
              />
              <Route path="/groups/:id" element={<Group />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetails />} />
            </Route>
          </Route>
        </Routes>

        {backgroundLocation && (
          <Routes>
            <Route
              path="/post/:id"
              element={
                <ProtectedRoute>
                  <PostDetailsModal />
                </ProtectedRoute>
              }
            />
          </Routes>
        )}
      </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

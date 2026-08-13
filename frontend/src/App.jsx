import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
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
import AuthLayout from "./components/AuthLayout";
import RootLayout from "./Pages/RootLayout";
import ContentLayout from "./Pages/ContentLayout";
import CreatePost from "./Pages/CreatePost";
import EditPost from "./Pages/EditPost";
import Explore from "./Pages/Explore";
import ChatHome from "./Pages/ChatContainer";
import PostDetails from "./Pages/PostDetails";
import PostDetailsModal from "./Modals/PostDetailsModal";
import ChatContainer from "./Pages/ChatContainer";
import Conversation from "./Pages/Conversation";
import NewConvo from "./Pages/NewConvo";
import Settings from "./Pages/Settings";
import RelatedPosts from "./Pages/RelatedPosts";
import Admin from "./Pages/Admin";
import NotFound from "./Pages/NotFound";
import NewConversation from "./Pages/NewConversation.jsx";
import Group from "./Pages/Group.jsx";
import EditProfile from "./Pages/EditProfile";
import Background from "./components/Background.jsx";
import Notifications from "./Pages/Notifications.jsx";
const queryClient = new QueryClient();
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, isCheckingAuth } = useAuthStore();
  if (isCheckingAuth) return <p>Loading...</p>;
  if (!isAuthenticated) return <Navigate to={"/login"} replace />;
  if (!isAuthenticated && !user.isVerified)
    return <Navigate to={"/signup"} replace />;
  return children;
};
const ProtectedAdminRoute = ({ children }) => {
  const { isAuthenticated, user, isCheckingAuth } = useAuthStore();
  if (isCheckingAuth) return <p>Loading...</p>;
  if (!isAuthenticated) return <Navigate to={"/login"} replace />;
  if (!isAuthenticated && !user.isVerified)
    return <Navigate to={"/signup"} replace />;

  if (user.role !== "admin") return <Navigate to={"/home"} replace />;
  return children;
};
const AuthenticatedUser = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  console.log("USERUL: " + user);
  if (isAuthenticated) return <Navigate to={"/home"} />;
  return children;
};
function App() {
  const { checkAuth } = useAuthStore();
  const location = useLocation();
  const backgroundLocation = location.state?.backgroundLocation;
  useEffect(() => {
    const theme = localStorage.getItem("theme");
    console.log(theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, []);
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        position="top-right"
        expand={true}
        richColors={true}
        toastOptions={{
          // Stil general
          style: {
            background: "#1f2937",
            color: "#fff",
            border: "1px solid #374151",
            borderRadius: "12px",
            padding: "16px",
            fontSize: "14px",
          },

          // Stiluri specifice per tip
          success: {
            style: {
              background: "#10b981",
              border: "1px solid #059669",
            },
            icon: "✅",
          },
          error: {
            style: {
              background: "#ef4444",
              border: "1px solid #dc2626",
            },
            icon: "❌",
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
            element={
              <ProtectedRoute>
                <RootLayout />
              </ProtectedRoute>
            }
          >
            <Route element={<ContentLayout />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/users/:name" element={<ProfilePage />} />
              <Route
                path="/users/:name/edit-profile"
                element={<EditProfile />}
              />
              <Route path="/create-post" element={<CreatePost />} />
              <Route path="/edit-post/:id" element={<EditPost />} />
              <Route path="/post/:id" element={<PostDetails />} />
              <Route path="/explore/*" element={<Explore />} />
              <Route path="/related-posts/:tag" element={<RelatedPosts />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>
            {/* Full-bleed layouts that manage their own width (chat/conversation panes) */}
            <Route path="/chat" element={<ChatContainer />} />
            <Route path="/conversations/:id" element={<Conversation />} />
            <Route path="/new-conversation/:id" element={<NewConvo />} />
            <Route path="/create-conversation" element={<NewConversation />} />
            <Route path="/groups/:id" element={<Group />} />
            {/* <Route path="/test" element={<Background />} /> */}
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
    </QueryClientProvider>
  );
}

export default App;

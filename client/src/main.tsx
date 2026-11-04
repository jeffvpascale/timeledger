import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "./styles/custom.scss";
import "./index.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account.tsx";
import TimeLedger from "./pages/TimeLedger.tsx";
import ThemeToggle from "./components/ThemeToggle.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import HomeRoute from "./components/HomeRoute";

// Define your routes in an array
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeRoute />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/account",
        element: <Account />,
      },
      {
        path: "/time-ledger",
        element: <TimeLedger />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1000 }}>
      <ThemeToggle />
    </div>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);

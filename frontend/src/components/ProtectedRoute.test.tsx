import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

const useAuth = vi.hoisted(() => vi.fn());

vi.mock("../context/AuthContext", () => ({
  useAuth: () => useAuth(),
}));

describe("ProtectedRoute (routing / auth gate)", () => {
  beforeEach(() => {
    useAuth.mockReset();
  });

  it("shows loading while auth is resolving", () => {
    useAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });
    render(
      <MemoryRouter initialEntries={["/secret"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/secret" element={<div>Secret</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/Authenticating/i)).toBeInTheDocument();
  });

  it("does not render child when not authenticated (redirects away)", () => {
    useAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    render(
      <MemoryRouter initialEntries={["/secret"]}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/secret" element={<div>Secret</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });

  it("renders child when authenticated", () => {
    useAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    render(
      <MemoryRouter initialEntries={["/secret"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/secret" element={<div>Secret</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Secret")).toBeInTheDocument();
  });
});

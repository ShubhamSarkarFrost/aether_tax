import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "./DashboardPage";

const fetchDashboardSummary = vi.hoisted(() => vi.fn());
const fetchTransactions = vi.hoisted(() => vi.fn());
const classifyTransaction = vi.hoisted(() => vi.fn());

vi.mock("../api/dashboard", () => ({
  fetchDashboardSummary: () => fetchDashboardSummary(),
}));
vi.mock("../api/transactions", () => ({
  fetchTransactions: (q: object) => fetchTransactions(q),
  classifyTransaction: (id: string, s: "classified" | "rejected") => classifyTransaction(id, s),
}));
vi.mock("../components/AppLayout", () => ({
  default: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="layout">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));
vi.mock("../components/MetricCard", () => ({
  default: () => <div>Metric</div>,
}));
vi.mock("../components/JurisdictionTable", () => ({ default: () => null }));
vi.mock("../components/DashboardAnalytics", () => ({ default: () => null }));
vi.mock("../components/RecentTransactionsTable", () => ({
  default: () => <div>Recent</div>,
}));

describe("DashboardPage (exposure dashboard + brand accents)", () => {
  beforeEach(() => {
    fetchDashboardSummary.mockReset();
    fetchTransactions.mockReset();
    classifyTransaction.mockReset();
  });

  it("loads summary and uses responsive grid + brand color on loader", async () => {
    fetchDashboardSummary.mockResolvedValue({
      total_transactions: 5,
      total_exposure: 123.45,
      cross_border_count: 2,
      classified_count: 1,
      pending_count: 4,
      jurisdiction_breakdown: [],
      jurisdiction_labeled: [],
      exposure_by_tax_type: [
        { tax_type: "VAT", tax_due: 50, count: 1 },
        { tax_type: "GST", tax_due: 30, count: 1 },
      ],
      avg_confidence_score: 0.9,
      total_tax_records: 0,
      filing_status_counts: { filed: 0, pending: 0, amended: 0, unfiled: 0, unknown: 0 },
      total_tax_amount: 0,
      total_tax_paid: 0,
      total_outstanding_liability: 0,
    });
    fetchTransactions.mockResolvedValue({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });

    const { container } = render(<DashboardPage />);
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
    // React inlines as rgb(...); 220,105,0 is #dc6900
    expect(container.innerHTML).toMatch(/220,\s*105,\s*0/);

    await waitFor(() => expect(screen.queryByText(/loading dashboard/i)).not.toBeInTheDocument());
    expect(
      await screen.findByRole("heading", { name: /Executive Exposure Dashboard/ })
    ).toBeInTheDocument();
    expect(container.innerHTML).toContain("sm:grid-cols-2");
  });

  it("error boundary shows retry (brand error color)", async () => {
    fetchDashboardSummary.mockRejectedValue(new Error("Empty API response"));
    fetchTransactions.mockRejectedValue(new Error("net"));

    const { container } = render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText(/empty api response/i)).toBeInTheDocument());
    // #e0301e → rgb(224, 48, 30)
    expect(container.innerHTML).toMatch(/224,\s*48,\s*30/);
    await userEvent.click(screen.getByRole("button", { name: /retry/i }));
  });
});

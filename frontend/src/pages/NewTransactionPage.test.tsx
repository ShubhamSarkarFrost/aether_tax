import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import NewTransactionPage from "./NewTransactionPage";

const createTransaction = vi.hoisted(() => vi.fn());
const calculateExposure = vi.hoisted(() => vi.fn());

vi.mock("../api/transactions", () => ({
  createTransaction: (...a: unknown[]) => createTransaction(...a),
}));
vi.mock("../api/exposures", () => ({
  calculateExposure: (...a: unknown[]) => calculateExposure(...a),
}));
vi.mock("../components/AppLayout", () => ({
  default: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="app-layout" data-title={title}>
      {children}
    </div>
  ),
}));

describe("NewTransactionPage (/transactions/new form)", () => {
  beforeEach(() => {
    createTransaction.mockReset();
    calculateExposure.mockReset();
  });

  it("validates required fields and amount >= 0 (negative path)", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <NewTransactionPage />
      </MemoryRouter>
    );
    await user.click(screen.getByRole("button", { name: /submit transaction/i }));
    expect(await screen.findByText(/Transaction type is required/i)).toBeInTheDocument();
  });

  it("submits and opens exposure modal (happy path with mocks)", async () => {
    const user = userEvent.setup();
    createTransaction.mockResolvedValue({
      _id: "new-tx-1",
      org_id: "o1",
    });
    calculateExposure.mockResolvedValue({
      primary: { tax_due: 1 },
      orchestration: {
        transaction_id: "new-tx-1",
        jurisdiction: { _id: "j", country_code: "US" },
        exposures: [],
        summary: { total_tax_due: 0, rule_count: 0, as_of: new Date().toISOString() },
      },
    });

    render(
      <MemoryRouter>
        <NewTransactionPage />
      </MemoryRouter>
    );

    const combos = screen.getAllByRole("combobox");
    await user.selectOptions(combos[0], "sale");
    await user.type(screen.getAllByPlaceholderText("0.00")[0]!, "100");
    await user.selectOptions(combos[2], "US");
    await user.selectOptions(combos[3], "DE");
    await user.click(screen.getByRole("button", { name: /submit transaction/i }));

    await waitFor(() => expect(createTransaction).toHaveBeenCalled());
    expect(calculateExposure).toHaveBeenCalledWith("new-tx-1");
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("shows formatted amount preview and high-value hint", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <NewTransactionPage />
      </MemoryRouter>
    );

    await user.type(screen.getAllByPlaceholderText("0.00")[0]!, "3420000");

    expect(await screen.findByText(/You entered:/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/Large amount detected\. Please confirm the number of zeros before submitting\./i)
    ).toBeInTheDocument();
  });
});

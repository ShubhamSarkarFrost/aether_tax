import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExposureResultModal from "./ExposureResultModal";

vi.mock("./TaxOrchestrator", () => ({
  default: () => <div>TaxOrchestrator mock</div>,
}));

const baseOrch = {
  transaction_id: "t1",
  jurisdiction: { _id: "j1", country_code: "US" },
  exposures: [] as { tax_type: string; tax_due: number }[],
  summary: { total_tax_due: 0, rule_count: 0, as_of: new Date().toISOString() },
};

describe("ExposureResultModal (simulation modal / a11y)", () => {
  it("is not in the document when closed", () => {
    render(
      <ExposureResultModal
        isOpen={false}
        onClose={vi.fn()}
        loading={false}
        error={null}
        exposure={null}
        orchestration={null}
        onRetry={vi.fn()}
      />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("exposes dialog role and aria-modal for assistive tech", () => {
    render(
      <ExposureResultModal
        isOpen
        onClose={vi.fn()}
        loading
        error={null}
        exposure={null}
        orchestration={null}
        onRetry={vi.fn()}
      />
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("renders close control and error retry path", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onRetry = vi.fn();
    const { rerender } = render(
      <ExposureResultModal
        isOpen
        onClose={onClose}
        loading={false}
        error="API failed"
        exposure={null}
        orchestration={null}
        onRetry={onRetry}
      />
    );
    expect(screen.getByText("API failed")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalled();

    rerender(
      <ExposureResultModal
        isOpen
        onClose={onClose}
        loading={false}
        error={null}
        exposure={null}
        orchestration={baseOrch as never}
        onRetry={onRetry}
      />
    );
    expect(screen.getByText("TaxOrchestrator mock")).toBeInTheDocument();
    const closeButtons = screen.getAllByRole("button", { name: /^close$/i });
    await user.click(closeButtons[closeButtons.length - 1]!);
    expect(onClose).toHaveBeenCalled();
  });
});

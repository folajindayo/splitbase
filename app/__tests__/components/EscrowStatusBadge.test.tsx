import React from "react";
import { render, screen } from "@testing-library/react";
import EscrowStatusBadge from "@/components/escrow/EscrowStatusBadge";

describe("EscrowStatusBadge", () => {
  it("renders pending status correctly", () => {
    render(<EscrowStatusBadge status="pending" />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("renders active status correctly", () => {
    render(<EscrowStatusBadge status="active" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders funded status correctly", () => {
    render(<EscrowStatusBadge status="funded" />);
    expect(screen.getByText("Funded")).toBeInTheDocument();
  });

  it("renders released status correctly", () => {
    render(<EscrowStatusBadge status="released" />);
    expect(screen.getByText("Released")).toBeInTheDocument();
  });

  it("renders completed status correctly", () => {
    render(<EscrowStatusBadge status="completed" />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("renders disputed status correctly", () => {
    render(<EscrowStatusBadge status="disputed" />);
    expect(screen.getByText("Disputed")).toBeInTheDocument();
  });

  it("renders cancelled status correctly", () => {
    render(<EscrowStatusBadge status="cancelled" />);
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <EscrowStatusBadge status="active" className="custom-class" />
    );
    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });

  it("handles unknown status gracefully", () => {
    render(<EscrowStatusBadge status="unknown" />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("includes status indicator dot", () => {
    const { container } = render(<EscrowStatusBadge status="active" />);
    const dot = container.querySelector(".bg-blue-500");
    expect(dot).toBeInTheDocument();
  });
});


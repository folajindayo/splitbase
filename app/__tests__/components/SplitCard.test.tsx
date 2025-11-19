import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SplitCard from "@/components/splits/SplitCard";

describe("SplitCard", () => {
  const mockParticipants = [
    { address: "0x1234567890123456789012345678901234567890", percentage: 40, name: "Alice" },
    { address: "0x2345678901234567890123456789012345678901", percentage: 35, name: "Bob" },
    { address: "0x3456789012345678901234567890123456789012", percentage: 25 },
  ];

  const mockProps = {
    id: "split-123456",
    title: "Team Revenue Split",
    participants: mockParticipants,
    totalAmount: 10000,
    status: "active" as const,
  };

  it("renders split information correctly", () => {
    render(<SplitCard {...mockProps} />);

    expect(screen.getByText("Team Revenue Split")).toBeInTheDocument();
    expect(screen.getByText("ID: split-12...")).toBeInTheDocument();
    expect(screen.getByText("3 Participants")).toBeInTheDocument();
    expect(screen.getByText("$10,000")).toBeInTheDocument();
  });

  it("displays participants with their percentages", () => {
    render(<SplitCard {...mockProps} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("35%")).toBeInTheDocument();
  });

  it("shows truncated address for participants without names", () => {
    render(<SplitCard {...mockProps} />);

    expect(screen.getByText("0x3456...9012")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
  });

  it("shows correct status badge", () => {
    render(<SplitCard {...mockProps} />);

    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("calls onView when view button is clicked", () => {
    const mockOnView = jest.fn();
    render(<SplitCard {...mockProps} onView={mockOnView} />);

    const viewButton = screen.getByText("View");
    fireEvent.click(viewButton);

    expect(mockOnView).toHaveBeenCalledTimes(1);
  });

  it("calls onEdit when edit button is clicked", () => {
    const mockOnEdit = jest.fn();
    render(<SplitCard {...mockProps} onEdit={mockOnEdit} />);

    const editButton = screen.getByText("Edit");
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  it("displays paused status correctly", () => {
    render(<SplitCard {...mockProps} status="paused" />);

    expect(screen.getByText("Paused")).toBeInTheDocument();
  });

  it("handles splits with many participants", () => {
    const manyParticipants = Array.from({ length: 5 }, (_, i) => ({
      address: `0x${i}234567890123456789012345678901234567890`,
      percentage: 20,
      name: `User${i}`,
    }));

    render(
      <SplitCard {...mockProps} participants={manyParticipants} />
    );

    expect(screen.getByText("5 Participants")).toBeInTheDocument();
    expect(screen.getByText("+2 more")).toBeInTheDocument();
  });
});


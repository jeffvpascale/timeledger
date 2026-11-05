import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ClientSelector from "./ClientSelector";

type ClientSelectorProps = Parameters<typeof ClientSelector>[0];

const activeClient = {
  id: 1,
  name: "Acme Corporation",
  isArchived: false,
};

const archivedClient = {
  id: 2,
  name: "Old client",
  isArchived: true,
};

function renderClientSelector(overrides: Partial<ClientSelectorProps> = {}) {
  const props = {
    clientList: [],
    selectedClientId: null,
    showArchived: false,
    onShowArchivedChange: vi.fn(),
    onClientChange: vi.fn().mockResolvedValue(undefined),
    onClientAdd: vi.fn().mockResolvedValue(undefined),
    onClientEdit: vi.fn().mockResolvedValue(undefined),
    onModeChange: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<ClientSelector {...props} />),
    props,
  };
}

describe("ClientSelector", () => {
  it("shows the entry form without Cancel when there are no clients", () => {
    renderClientSelector();

    expect(screen.getByRole("textbox", { name: "Client Name" })).toBeVisible();

    expect(screen.getByRole("button", { name: "Add Client" })).toBeVisible();

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Cancel" }),
    ).not.toBeInTheDocument();
  });

  it("shows the dropdown when clients exist", () => {
    renderClientSelector({
      clientList: [activeClient],
    });

    expect(screen.getByRole("combobox")).toBeVisible();

    expect(
      screen.getByRole("option", { name: activeClient.name }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("textbox", { name: "Client Name" }),
    ).not.toBeInTheDocument();
  });

  it("keeps selection controls available when all clients are archived", () => {
    renderClientSelector({
      clientList: [archivedClient],
    });

    expect(screen.getByRole("combobox")).toBeVisible();

    expect(
      screen.queryByRole("option", {
        name: "Old client (Archived)",
      }),
    ).not.toBeInTheDocument();

    const archiveCheckbox = screen.getByRole("checkbox", {
      name: "Show Archived Clients",
    });

    expect(archiveCheckbox).toBeVisible();
    expect(archiveCheckbox).not.toBeChecked();

    expect(screen.getByRole("button", { name: "Add Client" })).toBeVisible();
  });

  it("switches from selection to an empty add form", async () => {
    const user = userEvent.setup();
    const { props } = renderClientSelector({
      clientList: [activeClient],
    });

    expect(screen.getByRole("combobox")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Add Client" }));

    const nameInput = screen.getByRole("textbox", {
      name: "Client Name",
    });

    expect(nameInput).toBeVisible();
    expect(nameInput).toHaveValue("");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(props.onModeChange).toHaveBeenCalledWith("adding");
  });

  it("rejects an empty client name without saving", async () => {
    const user = userEvent.setup();
    const { props } = renderClientSelector();

    await user.click(screen.getByRole("button", { name: "Add Client" }));

    expect(screen.getByText("Please enter a client name.")).toBeVisible();

    expect(props.onClientAdd).not.toHaveBeenCalled();
  });

  it("saves a valid client name with surrounding spaces removed", async () => {
    const user = userEvent.setup();
    const { props } = renderClientSelector();

    await user.type(
      screen.getByRole("textbox", { name: "Client Name" }),
      "  Acme Corporation  ",
    );

    await user.click(screen.getByRole("button", { name: "Add Client" }));

    expect(props.onClientAdd).toHaveBeenCalledTimes(1);
    expect(props.onClientAdd).toHaveBeenCalledWith("Acme Corporation");
    expect(props.onClientAdd).toHaveBeenCalledTimes(1);
    expect(props.onClientAdd).toHaveBeenCalledWith("Acme Corporation");
  });

  it("rejects a duplicate client name without saving", async () => {
    const user = userEvent.setup();
    const { props } = renderClientSelector({
      clientList: [activeClient],
    });

    await user.click(screen.getByRole("button", { name: "Add Client" }));

    await user.type(
      screen.getByRole("textbox", { name: "Client Name" }),
      activeClient.name,
    );

    await user.click(screen.getByRole("button", { name: "Add Client" }));

    expect(
      screen.getByText("Please enter a unique client name."),
    ).toBeVisible();

    expect(props.onClientAdd).not.toHaveBeenCalled();
  });

  it("cancels adding and returns to selection without saving", async () => {
    const user = userEvent.setup();
    const { props } = renderClientSelector({
      clientList: [activeClient],
    });

    await user.click(screen.getByRole("button", { name: "Add Client" }));

    await user.type(
      screen.getByRole("textbox", { name: "Client Name" }),
      "Unsaved client",
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("combobox")).toBeVisible();

    expect(
      screen.queryByRole("textbox", { name: "Client Name" }),
    ).not.toBeInTheDocument();

    expect(props.onClientAdd).not.toHaveBeenCalled();
    expect(props.onModeChange).toHaveBeenLastCalledWith("selecting");
  });

  it("shows a save error and allows retrying", async () => {
    const user = userEvent.setup();
    const onClientAdd = vi
      .fn()
      .mockRejectedValueOnce(new Error("Unable to save client."))
      .mockResolvedValueOnce(undefined);

    renderClientSelector({
      clientList: [activeClient],
      onClientAdd,
    });

    await user.click(screen.getByRole("button", { name: "Add Client" }));

    await user.type(
      screen.getByRole("textbox", { name: "Client Name" }),
      "New client",
    );

    await user.click(screen.getByRole("button", { name: "Add Client" }));

    expect(await screen.findByText("Unable to save client.")).toBeVisible();

    expect(screen.getByRole("textbox", { name: "Client Name" })).toHaveValue(
      "New client",
    );

    await user.click(screen.getByRole("button", { name: "Add Client" }));

    expect(await screen.findByRole("combobox")).toBeVisible();
    expect(onClientAdd).toHaveBeenCalledTimes(2);
    expect(onClientAdd).toHaveBeenLastCalledWith("New client");
  });

  it("loads and updates the selected client", async () => {
    const user = userEvent.setup();
    const { props } = renderClientSelector({
      clientList: [activeClient],
      selectedClientId: activeClient.id,
    });

    await user.click(screen.getByRole("button", { name: "Edit Client" }));

    const nameInput = screen.getByRole("textbox", {
      name: "Client Name",
    });

    expect(nameInput).toHaveValue(activeClient.name);

    await user.clear(nameInput);
    await user.type(nameInput, "Updated Corporation");

    await user.click(screen.getByRole("button", { name: "Update Client" }));

    expect(props.onClientEdit).toHaveBeenCalledTimes(1);
    expect(props.onClientEdit).toHaveBeenCalledWith(
      activeClient.id,
      "Updated Corporation",
      false,
    );

    expect(props.onClientAdd).not.toHaveBeenCalled();
    expect(await screen.findByRole("combobox")).toBeVisible();
  });

  it("notifies the parent when a client is selected", async () => {
    const user = userEvent.setup();
    const { props } = renderClientSelector({
      clientList: [
        activeClient,
        { id: 3, name: "Second client", isArchived: false },
      ],
    });

    await user.selectOptions(screen.getByRole("combobox"), "3");

    expect(props.onClientChange).toHaveBeenCalledTimes(1);
    expect(props.onClientChange).toHaveBeenCalledWith(3);
  });

  it("shows archived clients when the filter is enabled", async () => {
    const user = userEvent.setup();
    const { props, rerender } = renderClientSelector({
      clientList: [activeClient, archivedClient],
    });

    expect(
      screen.queryByRole("option", {
        name: "Old client (Archived)",
      }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("checkbox", {
        name: "Show Archived Clients",
      }),
    );

    expect(props.onShowArchivedChange).toHaveBeenCalledWith(true);

    // Simulate the parent updating this controlled prop.
    rerender(<ClientSelector {...props} showArchived={true} />);

    expect(
      screen.getByRole("checkbox", {
        name: "Show Archived Clients",
      }),
    ).toBeChecked();

    expect(
      screen.getByRole("option", {
        name: "Old client (Archived)",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("option", { name: activeClient.name }),
    ).toBeInTheDocument();
  });
});

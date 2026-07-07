import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SearchFiltersBox } from "./SearchFiltersBox";

const BUSCADOR_TAB = "Buscador";
const FILTROS_TAB = "Filtros";
const SEARCH_LABEL = "Buscar juego";
const FILTER_LABEL = "Disponibilidad";

function renderBox() {
  return render(
    <SearchFiltersBox
      search={<input aria-label={SEARCH_LABEL} />}
      filters={<select aria-label={FILTER_LABEL} />}
    />,
  );
}

describe("SearchFiltersBox tabs", () => {
  it("renders both tabs with role=tab", () => {
    renderBox();

    expect(screen.getByRole("tab", { name: BUSCADOR_TAB })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: FILTROS_TAB })).toBeInTheDocument();
  });

  it("shows the Buscador panel by default", () => {
    renderBox();

    expect(screen.getByLabelText(SEARCH_LABEL)).toBeInTheDocument();
    expect(screen.queryByLabelText(FILTER_LABEL)).not.toBeVisible();
    expect(screen.getByRole("tab", { name: BUSCADOR_TAB })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("shows the Filtros panel and updates aria-selected when clicked", async () => {
    renderBox();
    const user = userEvent.setup();

    await user.click(screen.getByRole("tab", { name: FILTROS_TAB }));

    expect(screen.getByLabelText(FILTER_LABEL)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: FILTROS_TAB })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: BUSCADOR_TAB })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("moves selection to Filtros with ArrowRight from Buscador", async () => {
    renderBox();
    const user = userEvent.setup();

    const buscadorTab = screen.getByRole("tab", { name: BUSCADOR_TAB });
    buscadorTab.focus();
    await user.keyboard("{ArrowRight}");

    const filtrosTab = screen.getByRole("tab", { name: FILTROS_TAB });
    expect(filtrosTab).toHaveAttribute("aria-selected", "true");
    expect(filtrosTab).toHaveFocus();
    expect(buscadorTab).toHaveAttribute("tabIndex", "-1");
  });

  it("restores the search panel content after switching back from Filtros", async () => {
    renderBox();
    const user = userEvent.setup();

    await user.click(screen.getByRole("tab", { name: FILTROS_TAB }));
    await user.click(screen.getByRole("tab", { name: BUSCADOR_TAB }));

    expect(screen.getByLabelText(SEARCH_LABEL)).toBeVisible();
  });
});

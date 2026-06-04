import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SiteFooter } from "./SiteFooter";

describe("SiteFooter", () => {
  // foot-1: footer renders as semantic <footer> element
  describe("semantic element (foot-1)", () => {
    it("renders a <footer> element", () => {
      const { container } = render(<SiteFooter />);
      const footer = container.querySelector("footer");
      expect(footer).not.toBeNull();
    });
  });

  describe("social links", () => {
    it("renders the WhatsApp social link", () => {
      render(<SiteFooter />);
      const whatsapp = screen.getByRole("link", { name: "WhatsApp" });
      expect(whatsapp.getAttribute("href")).toEqual(
        "https://chat.whatsapp.com/LjAN8Lhau4aCnWKA3dMkmM"
      );
    });

    it("renders the Instagram social link", () => {
      render(<SiteFooter />);
      const instagram = screen.getByRole("link", { name: "Instagram" });
      expect(instagram.getAttribute("href")).toEqual(
        "https://www.instagram.com/refugiosatiro/"
      );
    });

    it("renders the Facebook social link", () => {
      render(<SiteFooter />);
      const facebook = screen.getByRole("link", { name: "Facebook" });
      expect(facebook.getAttribute("href")).toEqual(
        "https://www.facebook.com/refugiosatiro"
      );
    });

    it("renders the Discord social link", () => {
      render(<SiteFooter />);
      const discord = screen.getByRole("link", { name: "Discord" });
      expect(discord.getAttribute("href")).toEqual(
        "https://discord.gg/XAQ8TvtS3y"
      );
    });
  });

  describe("language selector absence", () => {
    it("does not render a combobox or listbox (language selector controls)", () => {
      render(<SiteFooter />);
      expect(screen.queryByRole("combobox")).toBeNull();
      expect(screen.queryByRole("listbox")).toBeNull();
    });

    it("does not render a button with language-related label", () => {
      render(<SiteFooter />);
      const buttons = screen.queryAllByRole("button");
      const langButton = buttons.find(
        (el) =>
          el.textContent?.toLowerCase().includes("language") ||
          el.textContent?.toLowerCase().includes("idioma") ||
          el.textContent?.toLowerCase().includes("español") ||
          el.textContent?.toLowerCase().includes("català")
      );
      expect(langButton).toBeUndefined();
    });
  });

  describe("accessibility", () => {
    it("social links open in a new tab with rel noopener", () => {
      render(<SiteFooter />);
      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link.getAttribute("target")).toEqual("_blank");
        expect(link.getAttribute("rel")).toContain("noopener");
      });
    });
  });
});

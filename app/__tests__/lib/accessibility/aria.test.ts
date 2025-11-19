import {
  createAriaLabel,
  createAriaLabelledBy,
  createAriaDescribedBy,
  createExpandableProps,
  createLiveRegionProps,
  createVisuallyHidden,
} from "@/lib/accessibility/aria";

describe("ARIA Utilities", () => {
  describe("createAriaLabel", () => {
    it("creates aria-label prop", () => {
      const props = createAriaLabel("Button label");
      expect(props).toEqual({ "aria-label": "Button label" });
    });
  });

  describe("createAriaLabelledBy", () => {
    it("creates aria-labelledby prop", () => {
      const props = createAriaLabelledBy("label-id");
      expect(props).toEqual({ "aria-labelledby": "label-id" });
    });
  });

  describe("createAriaDescribedBy", () => {
    it("creates aria-describedby prop", () => {
      const props = createAriaDescribedBy("description-id");
      expect(props).toEqual({ "aria-describedby": "description-id" });
    });
  });

  describe("createExpandableProps", () => {
    it("creates aria-expanded prop when expanded", () => {
      const props = createExpandableProps(true);
      expect(props).toEqual({ "aria-expanded": true });
    });

    it("creates aria-expanded prop when collapsed", () => {
      const props = createExpandableProps(false);
      expect(props).toEqual({ "aria-expanded": false });
    });
  });

  describe("createLiveRegionProps", () => {
    it("creates aria-live props with default values", () => {
      const props = createLiveRegionProps();
      expect(props).toEqual({
        "aria-live": "polite",
        "aria-atomic": false,
      });
    });

    it("creates aria-live props with assertive level", () => {
      const props = createLiveRegionProps("assertive", true);
      expect(props).toEqual({
        "aria-live": "assertive",
        "aria-atomic": true,
      });
    });
  });

  describe("createVisuallyHidden", () => {
    it("creates visually hidden props", () => {
      const props = createVisuallyHidden("Hidden text");
      expect(props).toEqual({
        children: "Hidden text",
        className: "sr-only",
      });
    });
  });
});


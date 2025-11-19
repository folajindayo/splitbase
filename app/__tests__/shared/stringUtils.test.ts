import {
  capitalize,
  capitalizeWords,
  camelCase,
  pascalCase,
  snakeCase,
  kebabCase,
  truncate,
  truncateMiddle,
  trim,
  removeWhitespace,
  contains,
  startsWith,
  endsWith,
  replaceAll,
  wordCount,
  charCount,
  slugify,
  getInitials,
  maskString,
  isEmpty,
  isBlank,
  pluralize,
  ordinalize,
} from "../../lib/shared/stringUtils";

describe("stringUtils", () => {
  describe("capitalize", () => {
    it("should capitalize first letter", () => {
      expect(capitalize("hello")).toBe("Hello");
      expect(capitalize("world")).toBe("World");
    });
  });

  describe("capitalizeWords", () => {
    it("should capitalize all words", () => {
      expect(capitalizeWords("hello world")).toBe("Hello World");
      expect(capitalizeWords("foo bar baz")).toBe("Foo Bar Baz");
    });
  });

  describe("case conversions", () => {
    it("should convert to camelCase", () => {
      expect(camelCase("hello world")).toBe("helloWorld");
      expect(camelCase("foo-bar-baz")).toBe("fooBarBaz");
      expect(camelCase("foo_bar_baz")).toBe("fooBarBaz");
    });

    it("should convert to PascalCase", () => {
      expect(pascalCase("hello world")).toBe("HelloWorld");
      expect(pascalCase("foo-bar-baz")).toBe("FooBarBaz");
    });

    it("should convert to snake_case", () => {
      expect(snakeCase("HelloWorld")).toBe("hello_world");
      expect(snakeCase("fooBarBaz")).toBe("foo_bar_baz");
      expect(snakeCase("foo bar")).toBe("foo_bar");
    });

    it("should convert to kebab-case", () => {
      expect(kebabCase("HelloWorld")).toBe("hello-world");
      expect(kebabCase("fooBarBaz")).toBe("foo-bar-baz");
      expect(kebabCase("foo bar")).toBe("foo-bar");
    });
  });

  describe("truncate", () => {
    it("should truncate string", () => {
      expect(truncate("hello world", 8)).toBe("hello...");
      expect(truncate("short", 10)).toBe("short");
    });

    it("should use custom suffix", () => {
      expect(truncate("hello world", 8, "…")).toBe("hello w…");
    });
  });

  describe("truncateMiddle", () => {
    it("should truncate in the middle", () => {
      const result = truncateMiddle("0x1234567890abcdef", 12);
      expect(result).toMatch(/^0x123\.\.\.cdef$/);
    });

    it("should not truncate short strings", () => {
      expect(truncateMiddle("short", 10)).toBe("short");
    });
  });

  describe("whitespace operations", () => {
    it("should trim whitespace", () => {
      expect(trim("  hello  ")).toBe("hello");
    });

    it("should remove all whitespace", () => {
      expect(removeWhitespace("hello world")).toBe("helloworld");
      expect(removeWhitespace(" h e l l o ")).toBe("hello");
    });
  });

  describe("string checks", () => {
    it("should check if contains substring", () => {
      expect(contains("hello world", "world")).toBe(true);
      expect(contains("hello world", "foo")).toBe(false);
    });

    it("should check case insensitive", () => {
      expect(contains("Hello World", "world", false)).toBe(true);
    });

    it("should check if starts with", () => {
      expect(startsWith("hello world", "hello")).toBe(true);
      expect(startsWith("hello world", "world")).toBe(false);
    });

    it("should check if ends with", () => {
      expect(endsWith("hello world", "world")).toBe(true);
      expect(endsWith("hello world", "hello")).toBe(false);
    });
  });

  describe("replaceAll", () => {
    it("should replace all occurrences", () => {
      expect(replaceAll("foo bar foo", "foo", "baz")).toBe("baz bar baz");
    });
  });

  describe("counting", () => {
    it("should count words", () => {
      expect(wordCount("hello world")).toBe(2);
      expect(wordCount("foo  bar  baz")).toBe(3);
      expect(wordCount("")).toBe(0);
    });

    it("should count characters", () => {
      expect(charCount("hello world")).toBe(10);
      expect(charCount("hello  world")).toBe(10);
    });
  });

  describe("slugify", () => {
    it("should create URL-friendly slug", () => {
      expect(slugify("Hello World!")).toBe("hello-world");
      expect(slugify("Foo & Bar")).toBe("foo-bar");
      expect(slugify("  spaces  ")).toBe("spaces");
    });
  });

  describe("getInitials", () => {
    it("should extract initials", () => {
      expect(getInitials("John Doe")).toBe("JD");
      expect(getInitials("Alice Bob Charlie")).toBe("AB");
      expect(getInitials("Alice Bob Charlie", 3)).toBe("ABC");
    });
  });

  describe("maskString", () => {
    it("should mask string", () => {
      expect(maskString("1234567890", 2, 2)).toBe("12******90");
      expect(maskString("secret", 1, 1)).toBe("s****t");
    });

    it("should not mask short strings", () => {
      expect(maskString("abc", 2, 2)).toBe("abc");
    });
  });

  describe("isEmpty and isBlank", () => {
    it("should check if empty", () => {
      expect(isEmpty("")).toBe(true);
      expect(isEmpty("   ")).toBe(true);
      expect(isEmpty("hello")).toBe(false);
    });

    it("should check if blank", () => {
      expect(isBlank("")).toBe(true);
      expect(isBlank("   ")).toBe(true);
      expect(isBlank("hello")).toBe(false);
    });
  });

  describe("pluralize", () => {
    it("should pluralize words", () => {
      expect(pluralize(1, "item")).toBe("item");
      expect(pluralize(2, "item")).toBe("items");
      expect(pluralize(5, "person", "people")).toBe("people");
    });
  });

  describe("ordinalize", () => {
    it("should convert to ordinal", () => {
      expect(ordinalize(1)).toBe("1st");
      expect(ordinalize(2)).toBe("2nd");
      expect(ordinalize(3)).toBe("3rd");
      expect(ordinalize(4)).toBe("4th");
      expect(ordinalize(11)).toBe("11th");
      expect(ordinalize(21)).toBe("21st");
    });
  });
});


import { EventEmitter } from "@/lib/events/eventEmitter";

describe("EventEmitter", () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe("on and emit", () => {
    it("calls listener when event is emitted", () => {
      const listener = jest.fn();

      emitter.on("test", listener);
      emitter.emit("test", "arg1", "arg2");

      expect(listener).toHaveBeenCalledWith("arg1", "arg2");
    });

    it("calls multiple listeners", () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on("test", listener1);
      emitter.on("test", listener2);
      emitter.emit("test");

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it("does not throw if no listeners", () => {
      expect(() => emitter.emit("test")).not.toThrow();
    });
  });

  describe("off", () => {
    it("removes listener", () => {
      const listener = jest.fn();

      emitter.on("test", listener);
      emitter.off("test", listener);
      emitter.emit("test");

      expect(listener).not.toHaveBeenCalled();
    });

    it("removes only specified listener", () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on("test", listener1);
      emitter.on("test", listener2);
      emitter.off("test", listener1);
      emitter.emit("test");

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe("once", () => {
    it("calls listener only once", () => {
      const listener = jest.fn();

      emitter.once("test", listener);
      emitter.emit("test");
      emitter.emit("test");

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe("removeAllListeners", () => {
    it("removes all listeners for event", () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on("test", listener1);
      emitter.on("test", listener2);
      emitter.removeAllListeners("test");
      emitter.emit("test");

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it("removes all listeners for all events", () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on("event1", listener1);
      emitter.on("event2", listener2);
      emitter.removeAllListeners();
      emitter.emit("event1");
      emitter.emit("event2");

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });
  });

  describe("listenerCount", () => {
    it("returns listener count", () => {
      emitter.on("test", () => {});
      emitter.on("test", () => {});

      expect(emitter.listenerCount("test")).toBe(2);
    });

    it("returns 0 for no listeners", () => {
      expect(emitter.listenerCount("test")).toBe(0);
    });
  });

  describe("eventNames", () => {
    it("returns event names", () => {
      emitter.on("event1", () => {});
      emitter.on("event2", () => {});

      const names = emitter.eventNames();

      expect(names).toContain("event1");
      expect(names).toContain("event2");
      expect(names.length).toBe(2);
    });
  });

  describe("error handling", () => {
    it("catches errors in listeners", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const throwingListener = () => {
        throw new Error("Test error");
      };
      const normalListener = jest.fn();

      emitter.on("test", throwingListener);
      emitter.on("test", normalListener);
      emitter.emit("test");

      expect(consoleSpy).toHaveBeenCalled();
      expect(normalListener).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});


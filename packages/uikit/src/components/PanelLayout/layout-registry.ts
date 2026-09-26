import { validateLayoutRequest } from "./layout-controller";
import type { LayoutController } from "./layout-controller.types";

/** Transport-neutral registry. Hosts may expose it to a trusted browser automation session.
 * It installs no listener, remote endpoint, credential handling, or cross-origin bridge.
 */
export function createLayoutRegistry() {
  const controllers = new Map<
    string,
    { controller: LayoutController; label: string }
  >();
  return {
    version: 1 as const,
    register(id: string, controller: LayoutController, label = id) {
      if (controllers.has(id))
        throw new Error(`Layout already registered: ${id}`);
      controllers.set(id, { controller, label });
      return () => {
        if (controllers.get(id)?.controller === controller)
          controllers.delete(id);
      };
    },
    list() {
      return [...controllers.entries()].map(([id, { label }]) => ({
        id,
        label,
      }));
    },
    async dispatch(id: string, operation: string, request?: unknown) {
      const entry = controllers.get(id);
      if (!entry)
        throw new Error(
          "Layout session is no longer available; list layouts again",
        );
      if (operation === "inspect") return entry.controller.inspect();
      if (operation === "resolve")
        return entry.controller.resolve(validateLayoutRequest(request));
      if (operation === "apply")
        return entry.controller.apply(validateLayoutRequest(request));
      throw new Error("Unknown layout protocol operation");
    },
  };
}
export type LayoutRegistry = ReturnType<typeof createLayoutRegistry>;

import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  window.localStorage.clear();
});

// O jsdom não implementa ResizeObserver, que componentes do Radix (tooltip, popper) usam.
// Sem este stub, abrir um tooltip durante um teste derruba a árvore de forma intermitente.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

// O jsdom também não implementa document.elementFromPoint, usado pela biblioteca `input-otp`
// (campo de código do 2FA) ao detectar a posição do cursor.
if (typeof document.elementFromPoint !== "function") {
  document.elementFromPoint = () => null;
}

// O jsdom não implementa estas APIs de ponteiro/rolagem, que o Radix Select usa ao abrir a lista.
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

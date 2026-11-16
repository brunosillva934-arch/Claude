/// <reference types="vite/client" />

/** Verdadeiro quando o pacote é montado para o APK (`vite build --mode android`). */
declare const __ANDROID__: boolean;

declare module '*.wasm?url' {
  const url: string;
  export default url;
}

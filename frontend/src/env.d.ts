declare module "*?url" {
  const url: string;
  export default url;
}

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly SSR: boolean;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
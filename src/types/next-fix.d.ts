declare module "next" {
  export type Metadata = any;
  export type Viewport = any;
  export type NextConfig = any;
}

declare module "next/script" {
  import { ScriptHTMLAttributes } from "react";
  interface ScriptProps extends ScriptHTMLAttributes<HTMLScriptElement> {
    strategy?: "beforeInteractive" | "afterInteractive" | "lazyOnload" | "worker";
    id?: string;
    onLoad?: () => void;
    onError?: (e: any) => void;
  }
  const Script: (props: ScriptProps) => JSX.Element;
  export default Script;
}

declare module "next/navigation" {
  export function usePathname(): string;
  export function useRouter(): any;
  export function useSearchParams(): any;
  export function useParams(): any;
  export function useSelectedLayoutSegment(): string | null;
  export function useSelectedLayoutSegments(): string[];
  export function redirect(url: string): never;
  export function notFound(): never;
}

declare module "next/font/google" {
  export type FontOptions = {
    subsets?: string[];
    variable?: string;
    display?: string;
    weight?: string | string[];
    style?: string | string[];
  };
  export type FontObject = {
    className: string;
    variable: string;
    style: { fontFamily: string };
  };
  export function Inter(options: FontOptions): FontObject;
  export function Montserrat(options: FontOptions): FontObject;
}

declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

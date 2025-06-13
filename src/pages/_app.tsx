import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import Head from "next/head";
import "@/styles/globals.css";
import { AvatarProvider } from "@/context/AvatarContext";

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <Head>
        <title>SnapShare</title>
        <meta name="description" content="SnapShare - Share your moments with the world!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AvatarProvider>
        <Component {...pageProps} />
      </AvatarProvider>
    </SessionProvider>
  );
}
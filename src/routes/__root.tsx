import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel-strong max-w-md rounded-2xl p-10 text-center">
        <h1 className="font-display text-7xl font-bold gradient-text">404</h1>
        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
          Trang không tồn tại
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Đường dẫn bạn truy cập không có hoặc đã được di chuyển.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="btn-gradient inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "NoteKeep — Quản lý ghi chú" },
      { name: "description", content: "Hệ thống ghi chú tối giản, premium, hỗ trợ nhãn và chia sẻ." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:title", content: "NoteKeep — Quản lý ghi chú" },
      { name: "twitter:title", content: "NoteKeep — Quản lý ghi chú" },
      { property: "og:description", content: "Hệ thống ghi chú tối giản, premium, hỗ trợ nhãn và chia sẻ." },
      { name: "twitter:description", content: "Hệ thống ghi chú tối giản, premium, hỗ trợ nhãn và chia sẻ." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0aed6287-1e37-4c37-9b06-e0fc59b7331d/id-preview-a6979f6f--edc126d0-4446-4cf7-8309-6a4ea376ba4c.lovable.app-1776769454300.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0aed6287-1e37-4c37-9b06-e0fc59b7331d/id-preview-a6979f6f--edc126d0-4446-4cf7-8309-6a4ea376ba4c.lovable.app-1776769454300.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}

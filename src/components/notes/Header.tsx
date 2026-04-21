import { Menu, LayoutGrid, List, Sun, Moon, Settings, LogOut, StickyNote } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SearchBar } from "@/components/notes/SearchBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ViewMode } from "@/types/note";

interface HeaderProps {
  search: string;
  onSearchChange: (v: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  userName: string;
  isVerified: boolean;
  isDark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  onToggleMobileSidebar: () => void;
}

export function Header({
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  userName,
  isVerified,
  isDark,
  onToggleTheme,
  onLogout,
  onOpenSettings,
  onToggleMobileSidebar,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 glass-panel-strong border-x-0 border-t-0 rounded-none">
      {!isVerified && (
        <div className="bg-gradient-to-r from-primary/15 via-primary-glow/15 to-primary/15 px-4 py-2 text-center text-xs font-medium text-foreground/90">
          ⚠️ Tài khoản chưa được xác minh. Vui lòng kiểm tra email để kích hoạt.
        </div>
      )}
      <div className="flex h-16 items-center gap-3 px-3 lg:px-6">
        <button
          onClick={onToggleMobileSidebar}
          className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
          aria-label="Mở menu"
        >
          <Menu className="size-5" />
        </button>

        <Link to="/" className="flex flex-shrink-0 items-center gap-2">
          <div className="btn-gradient flex size-9 items-center justify-center rounded-lg">
            <StickyNote className="size-4 text-white" />
          </div>
          <span className="hidden font-display text-base font-bold tracking-tight sm:inline">
            NoteKeep
          </span>
        </Link>

        <div className="flex flex-1 justify-center px-2">
          <SearchBar value={search} onChange={onSearchChange} />
        </div>

        <div className="flex flex-shrink-0 items-center gap-1">
          <button
            onClick={() => onViewModeChange(viewMode === "grid" ? "list" : "grid")}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            title={viewMode === "grid" ? "Chế độ danh sách" : "Chế độ lưới"}
          >
            {viewMode === "grid" ? <List className="size-4" /> : <LayoutGrid className="size-4" />}
          </button>

          <button
            onClick={onToggleTheme}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            title={isDark ? "Chế độ sáng" : "Chế độ tối"}
            aria-label="Đổi giao diện"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="ml-1 flex size-9 items-center justify-center rounded-full text-sm font-semibold text-white btn-gradient"
                aria-label="Tài khoản"
              >
                {userName.charAt(0).toUpperCase()}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[200px]">
              <DropdownMenuLabel className="font-medium">{userName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onToggleTheme}>
                {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                {isDark ? "Chế độ sáng" : "Chế độ tối"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenSettings}>
                <Settings className="size-4" />
                Cài đặt
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                <LogOut className="size-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

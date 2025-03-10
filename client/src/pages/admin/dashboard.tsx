import { Link, Route, Switch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import QuestCreator from "./quest-creator";
import {
  LayoutDashboard,
  Trophy,
  Users,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

function AdminNav() {
  return (
    <nav className="space-y-2">
      <Link href="/admin">
        <a className="flex items-center gap-2 p-2 hover:bg-accent rounded-lg">
          <LayoutDashboard className="h-4 w-4" />
          <span>Dashboard</span>
        </a>
      </Link>
      <Link href="/admin/quests">
        <a className="flex items-center gap-2 p-2 hover:bg-accent rounded-lg">
          <Trophy className="h-4 w-4" />
          <span>Quest Management</span>
        </a>
      </Link>
      <Link href="/admin/users">
        <a className="flex items-center gap-2 p-2 hover:bg-accent rounded-lg">
          <Users className="h-4 w-4" />
          <span>User Management</span>
        </a>
      </Link>
      <Link href="/admin/settings">
        <a className="flex items-center gap-2 p-2 hover:bg-accent rounded-lg">
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </a>
      </Link>
    </nav>
  );
}

function Overview() {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Active Quests</h3>
          <p className="text-3xl font-bold">12</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Total Users</h3>
          <p className="text-3xl font-bold">156</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Completed Quests</h3>
          <p className="text-3xl font-bold">89</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-red-500">Access denied. Admin only.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <aside className="w-64 min-h-screen p-4 border-r">
          <AdminNav />
        </aside>
        
        <main className="flex-1 p-8">
          <Switch>
            <Route path="/admin" component={Overview} />
            <Route path="/admin/quests" component={QuestCreator} />
            {/* Add more routes as we implement them */}
          </Switch>
        </main>
      </div>
    </div>
  );
}

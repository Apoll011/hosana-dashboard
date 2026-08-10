import { Button, Input } from "@hosanna/shared";
import { Building2, Search, ArrowRight, ShieldCheck, CheckCircle2, User, LogOut } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "../lib/authClient";
import { useAuth } from "../contexts/AuthContext";

export const OnboardingPage: React.FC = () => {
  const { user, logout, refetch } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"choose" | "create" | "join" | "pending">("choose");
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [searchSlug, setSearchSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [pendingOrgName, setPendingOrgName] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    const { error } = await authClient.organization.create({
      name: orgName.trim(),
      slug: orgSlug.trim(),
    });

    setIsLoading(false);

    if (error) {
      setErrorMsg(error.message || "Failed to create organization.");
      return;
    }

    await refetch();
    navigate("/folders");
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    // In a real app we'd search and request access. For this assignment,
    // we mock the pending state.
    setTimeout(() => {
      setIsLoading(false);
      setPendingOrgName(searchSlug);
      setMode("pending");
    }, 1000);
  };

  if (mode === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-m3-bg p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center animate-in zoom-in-95">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Pending Approval</h2>
          <p className="text-slate-500 mb-6">
            Your request to join <span className="font-bold text-slate-700">{pendingOrgName}</span> is pending administrator approval.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>
            <div className="text-xs text-amber-600 font-semibold bg-amber-100 rounded-md py-1 px-2 inline-block">
              Status: Pending
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full h-11"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-m3-bg p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 md:p-8 animate-in zoom-in-95">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-900">Welcome to Hosanna</h1>
          <p className="text-slate-500 text-sm mt-1">
            To get started, you need to join an organization or create a new one.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
            {errorMsg}
          </div>
        )}

        {mode === "choose" && (
          <div className="space-y-4">
            <button
              onClick={() => setMode("create")}
              className="w-full flex items-center p-4 border-2 border-slate-100 hover:border-m3-primary rounded-xl transition-all group text-left"
            >
              <div className="w-12 h-12 bg-m3-primary-light text-m3-primary rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 group-hover:text-m3-primary transition-colors">Create Organization</h3>
                <p className="text-xs text-slate-500">I want to set up a new church or team.</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-m3-primary transition-colors" />
            </button>
            
            <button
              onClick={() => setMode("join")}
              className="w-full flex items-center p-4 border-2 border-slate-100 hover:border-m3-primary rounded-xl transition-all group text-left"
            >
              <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform group-hover:bg-m3-primary-light group-hover:text-m3-primary">
                <Search className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 group-hover:text-m3-primary transition-colors">Join Organization</h3>
                <p className="text-xs text-slate-500">I have an invite or want to find my church.</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-m3-primary transition-colors" />
            </button>
            
            <div className="pt-4 text-center">
              <button onClick={() => logout()} className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
                Logout
              </button>
            </div>
          </div>
        )}

        {mode === "create" && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="flex items-center mb-4">
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="text-slate-400 hover:text-slate-800 transition-colors mr-2"
              >
                ← Back
              </button>
              <h3 className="text-lg font-bold">Create Organization</h3>
            </div>
            
            <Input
              label="Organization Name"
              placeholder="e.g. Hosanna Church"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />
            <Input
              label="Organization Slug"
              placeholder="e.g. hosanna-church"
              value={orgSlug}
              onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              required
            />
            <Button
              type="submit"
              variant="primary"
              className="w-full h-11"
              disabled={isLoading || !orgName || !orgSlug}
              isLoading={isLoading}
            >
              Create
            </Button>
          </form>
        )}

        {mode === "join" && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="flex items-center mb-4">
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="text-slate-400 hover:text-slate-800 transition-colors mr-2"
              >
                ← Back
              </button>
              <h3 className="text-lg font-bold">Join Organization</h3>
            </div>
            
            <Input
              label="Organization Slug"
              placeholder="e.g. hosanna-church"
              value={searchSlug}
              onChange={(e) => setSearchSlug(e.target.value)}
              required
            />
            <Button
              type="submit"
              variant="primary"
              className="w-full h-11"
              disabled={isLoading || !searchSlug}
              isLoading={isLoading}
            >
              Request Access
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

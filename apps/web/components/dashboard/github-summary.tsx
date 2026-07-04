"use client";
import { Github, Star, GitFork, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GitHubData } from "@/types/api";

interface GitHubSummaryProps {
  githubData: GitHubData;
}

export function GitHubSummary({ githubData }: GitHubSummaryProps) {
  const { profile, projects = [], open_source_projects = [], self_projects = [] } = githubData;

  if (!profile) return null;

  return (
    <div className="space-y-4">
      {/* Profile */}
      <div className="flex items-center gap-3">
        {profile.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={profile.login}
            className="h-12 w-12 rounded-full"
          />
        )}
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <Github className="h-4 w-4" />
            {profile.login}
          </div>
          {profile.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Repos" value={profile.public_repos ?? 0} />
        <Stat label="Followers" value={profile.followers ?? 0} icon={<Users className="h-3 w-3" />} />
        <Stat label="Following" value={profile.following ?? 0} />
      </div>

      {/* Top Projects */}
      {projects.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Selected Projects ({projects.length})
          </h4>
          <div className="space-y-2">
            {projects.slice(0, 5).map((repo, i) => (
              <div key={i} className="flex items-start justify-between gap-2 rounded-lg bg-muted/50 p-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{repo.name}</span>
                    {repo.is_open_source && (
                      <Badge variant="success" className="text-[10px] py-0 px-1.5">Open Source</Badge>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{repo.description}</p>
                  )}
                  {repo.language && (
                    <span className="text-xs text-muted-foreground">{repo.language}</span>
                  )}
                </div>
                {repo.stargazers_count !== undefined && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Star className="h-3 w-3" />
                    {repo.stargazers_count}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-lg font-bold">
        {icon}
        {value.toLocaleString()}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

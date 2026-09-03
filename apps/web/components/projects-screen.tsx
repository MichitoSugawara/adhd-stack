"use client";

import { Button } from "@cloudflare/kumo";
import { ArrowLeftIcon, FolderIcon, StackIcon } from "@phosphor-icons/react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";

import { api } from "../../../convex/_generated/api";

export const ProjectsScreen = () => {
  const workspace = useQuery(api.workspaces.getMine);
  const router = useRouter();

  return (
    <main className="projects-shell desktop-experience">
      <header className="product-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            <StackIcon size={19} weight="bold" />
          </span>
          <span>ADHD Stack</span>
        </div>
      </header>
      <section className="projects-page" aria-labelledby="projects-title">
        <div className="projects-heading">
          <div>
            <p className="eyebrow">WORKSPACES</p>
            <h1 id="projects-title">プロジェクト</h1>
            <p>つながったアカウント側に用意された作業場です。</p>
          </div>
        </div>
        {workspace ? (
          <button
            className="desktop-project-row"
            onClick={() => router.push("/editor")}
            type="button"
          >
            <span className="project-folder project-folder--orange">
              <FolderIcon size={22} weight="duotone" />
            </span>
            <span className="desktop-project-copy">
              <strong>{workspace.name}</strong>
              <small>{workspace.githubRepoFullName ?? "準備中"}</small>
            </span>
          </button>
        ) : (
          <p>先に4つ接続すると、ここに作業場が出ます。</p>
        )}
        <Button
          className="projects-back"
          icon={ArrowLeftIcon}
          onClick={() => router.push("/")}
          variant="ghost"
        >
          接続を管理
        </Button>
      </section>
    </main>
  );
};

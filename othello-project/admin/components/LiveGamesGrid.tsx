"use client";

import { useMemo, useState } from "react";

import { LiveGameCard } from "@/components/LiveGameCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { GameSummary } from "@/lib/types";

type Props = {
  games: GameSummary[];
};

export function LiveGamesGrid({ games }: Props) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [roundFilter, setRoundFilter] = useState("");
  const [tournamentFilter, setTournamentFilter] = useState("");
  const [sortBy, setSortBy] = useState("fixed");
  const [mode, setMode] = useState<"compact" | "expanded">("compact");

  const filtered = useMemo(() => {
    const result = games.filter((game) => {
      if (statusFilter !== "all" && game.status !== statusFilter) {
        return false;
      }
      if (roundFilter && `${game.roundNumber ?? ""}` !== roundFilter) {
        return false;
      }
      if (tournamentFilter && `${game.tournamentId ?? ""}` !== tournamentFilter) {
        return false;
      }
      return true;
    });

    const compareFixedOrder = (left: GameSummary, right: GameSummary) => {
      const tournamentOrder = (left.tournamentId ?? 0).toString().localeCompare((right.tournamentId ?? 0).toString(), undefined, { numeric: true });
      if (tournamentOrder !== 0) {
        return tournamentOrder;
      }

      const roundOrder = (left.roundNumber ?? 0) - (right.roundNumber ?? 0);
      if (roundOrder !== 0) {
        return roundOrder;
      }

      return left.id.localeCompare(right.id, undefined, { numeric: true });
    };

    result.sort((left, right) => {
      if (sortBy === "timer") {
        const timerOrder = (left.countdownMs ?? Number.MAX_SAFE_INTEGER) - (right.countdownMs ?? Number.MAX_SAFE_INTEGER);
        return timerOrder !== 0 ? timerOrder : compareFixedOrder(left, right);
      }
      if (sortBy === "score_diff") {
        const leftDiff = Math.abs((left.blackScore ?? 0) - (left.whiteScore ?? 0));
        const rightDiff = Math.abs((right.blackScore ?? 0) - (right.whiteScore ?? 0));
        const diffOrder = rightDiff - leftDiff;
        return diffOrder !== 0 ? diffOrder : compareFixedOrder(left, right);
      }
      if (sortBy === "round") {
        const roundOrder = (left.roundNumber ?? 0) - (right.roundNumber ?? 0);
        return roundOrder !== 0 ? roundOrder : compareFixedOrder(left, right);
      }
      return compareFixedOrder(left, right);
    });

    return result;
  }, [games, roundFilter, sortBy, statusFilter, tournamentFilter]);

  if (games.length === 0) {
    return (
      <Alert>
        <AlertTitle>No active games</AlertTitle>
        <AlertDescription>The live view will populate as soon as the backend reports active games.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-5">
        <select className="h-10 rounded-md border bg-card px-3 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">active</option>
          <option value="completed">completed</option>
          <option value="forfeit">forfeit</option>
          <option value="timeout">timeout</option>
          <option value="illegal_move">illegal move</option>
        </select>
        <Input placeholder="Tournament ID" value={tournamentFilter} onChange={(e) => setTournamentFilter(e.target.value)} />
        <Input placeholder="Round" value={roundFilter} onChange={(e) => setRoundFilter(e.target.value)} />
        <select className="h-10 rounded-md border bg-card px-3 text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="fixed">Fixed board order</option>
          <option value="timer">Lowest remaining time</option>
          <option value="score_diff">Board score difference</option>
          <option value="round">Round number</option>
        </select>
        <select className="h-10 rounded-md border bg-card px-3 text-sm" value={mode} onChange={(e) => setMode(e.target.value as "compact" | "expanded")}>
          <option value="compact">Compact</option>
          <option value="expanded">Expanded</option>
        </select>
      </div>
      <div className={mode === "compact" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "grid gap-4 lg:grid-cols-2"}>
        {filtered.map((game) => (
          <LiveGameCard key={game.id} game={game} mode={mode} />
        ))}
      </div>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";

interface ScorePillProps {
  score: number;
}

export function ScorePill({ score }: ScorePillProps) {
  const variant = score >= 75 ? "success" : score >= 55 ? "warning" : "destructive";

  return <Badge variant={variant}>Signal {score}</Badge>;
}

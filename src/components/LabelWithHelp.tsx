import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface Props {
  label: string;
  help: string;
}

export default function LabelWithHelp({ label, help }: Props) {
  return (
    <span className="inline-flex items-center gap-1">
      <span>{label}</span>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground cursor-help shrink-0" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[220px] text-xs">
            {help}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  );
}

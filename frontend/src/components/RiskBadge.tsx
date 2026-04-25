interface Props {
  taxDue: number;
  confidenceScore: number;
}

type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

function getSeverity(taxDue: number, confidenceScore: number): Severity {
  if (taxDue > 10000 && confidenceScore >= 0.8) return 'HIGH';
  if (taxDue > 1000 || confidenceScore >= 0.5) return 'MEDIUM';
  return 'LOW';
}

const severityStyles: Record<Severity, string> = {
  HIGH: 'bg-red-100 text-[#e0301e]',
  MEDIUM: 'bg-orange-100 text-[#eb8c00]',
  LOW: 'bg-green-100 text-green-700',
};

export default function RiskBadge({ taxDue, confidenceScore }: Props) {
  const severity = getSeverity(taxDue, confidenceScore);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${severityStyles[severity]}`}
    >
      {severity}
    </span>
  );
}

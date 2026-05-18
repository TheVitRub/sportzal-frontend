interface NoticeProps {
  text: string;
  tone?: 'neutral' | 'danger';
}

export function Notice({ text, tone = 'neutral' }: NoticeProps) {
  return <div className={`notice ${tone}`}>{text}</div>;
}


interface FullScreenMessageProps {
  title: string;
  text: string;
}

export function FullScreenMessage({ title, text }: FullScreenMessageProps) {
  return (
    <div className="authLayout">
      <section className="authPanel">
        <h1>{title}</h1>
        <p>{text}</p>
      </section>
    </div>
  );
}


import { Reveal } from "./Reveal";

/**
 * Shared section header — pill label + headline + optional sub. Keeps the
 * landing's section rhythm consistent (Clause-style pill, centered stack).
 */
export function SectionHeading({
  pill,
  title,
  sub,
}: {
  pill: string;
  title: React.ReactNode;
  sub?: string;
}) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <span className="section-pill">{pill}</span>
      <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-[2.6rem] md:leading-[1.1]">
        {title}
      </h2>
      {sub && <p className="mt-4 text-lg text-mid">{sub}</p>}
    </Reveal>
  );
}

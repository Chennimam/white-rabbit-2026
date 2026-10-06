type EditorialImageProps = {
  name: "hero-rabbit-alice" | "antique-key" | "final-door" | "registration-rabbit" | "alice-threshold";
  alt?: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
};

export function EditorialImage({
  name,
  alt = "",
  width,
  height,
  className = "",
  priority = false,
}: EditorialImageProps) {
  return (
    <picture className={className}>
      <source
        media="(max-width: 680px)"
        srcSet={`/images/${name}-small.webp`}
      />
      <img
        src={`/images/${name}.webp`}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
      />
    </picture>
  );
}

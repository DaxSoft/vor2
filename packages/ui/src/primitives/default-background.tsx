export default function DefaultBackground() {
  return (
    <div
      style={{
        zIndex: 0,
        backgroundImage: `radial-gradient(circle, rgba(10, 25, 41, 0.01) 11%, rgba(10, 25, 41, 0.05) 47%, rgba(10, 25, 41, 0.5) 100%), url("/bg/typewriter-bg-candle-blur.jpg")`,
        backgroundSize: "cover",
      }}
      className="fixed w-full h-full pointer-events-none"
    />
  );
}

export function DefaultBackgroundPreview() {
  return (
    <div
      style={{
        zIndex: 0,
        backgroundImage: `radial-gradient(circle, rgba(10, 25, 41, 0.01) 11%, rgba(10, 25, 41, 0.05) 47%, rgba(10, 25, 41, 0.5) 100%), url("/bg/typewriter-bg-candle-blur.jpg")`,
        backgroundSize: "cover",
      }}
      className="absolute w-full h-full pointer-events-none overflow-x-hidden top-0 left-0"
    />
  );
}

interface DashboardBackgroundImageProps {
  url: string;
  radial?: string;
  opacity?: number;
}

/**
 * Renders a non-interactive, full-viewport background image.
 * It uses a fixed position and a negative z-index to ensure it stays behind all other content.
 *
 * @param {string} url - The URL of the background image to display.
 */
export function DashboardBackgroundImage({
  url,
  radial = `radial-gradient(
            circle,
            rgba(10, 25, 41, 0.01) 11%,
            rgba(10, 25, 41, 0.05) 47%,
            rgba(10, 25, 41, 0.5) 100%
          ),`,
  opacity,
}: DashboardBackgroundImageProps) {
  return (
    <div
      style={{
        backgroundImage: `
          ${radial}
          url("${url}")
        `,
        backgroundSize: "cover",
        backgroundPosition: "center", // Ensures the image is centered
        opacity: opacity !== undefined ? opacity : 1, // Allow dimming the actual image
      }}
      // Key changes for correct background behavior:
      // - `fixed`: Positions the element relative to the viewport, not its parent.
      // - `inset-0`: A shorthand for top-0, right-0, bottom-0, left-0 to fill the entire viewport.
      // - `z-[-1]`: Sets a negative z-index to place it behind other page content.
      className="fixed inset-0 z-[-1] pointer-events-none"
    />
  );
}

interface CardBackgroundImageProps {
  url: string;
  /** Optional className to adjust things like border-radius (e.g., 'rounded-xl') */
  className?: string;
  /** Optional opacity override if needed for smaller cards */
  opacity?: number;

  radial?: string;

  blur?: number;
}

/**
 * Renders a non-interactive background image tailored for cards/containers.
 * It fills the parent container absolutely.
 *
 * REQUIREMENTS FOR PARENT CONTAINER:
 * 1. Must have `position: relative` (className="relative ...")
 * 2. Should have `overflow: hidden` if it has rounded corners.
 * 3. Content inside the card must be positioned on top (e.g., `relative z-10`).
 */
export function CardBackgroundImage({
  url,
  className = "",
  opacity = 1,
  radial = `radial-gradient(
            circle,
            rgba(10, 25, 41, 0.01) 11%,
            rgba(10, 25, 41, 0.05) 47%,
            rgba(10, 25, 41, 0.5) 100%
          ),`,
  blur = 3,
}: CardBackgroundImageProps) {
  return (
    <>
      {/* The image layer */}
      <div
        style={{
          backgroundImage: `
          ${radial}
          url("${url}")
        `,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: opacity !== undefined ? opacity : 1, // Allow dimming the actual image
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
        }}
        // absolute inset-0: Fills the 'relative' parent completely
        // z-0: Sits at the base level of the card
        // pointer-events-none: Non-interactive
        className={`absolute inset-0 !z-0 pointer-events-none transition-opacity ${className}`}
      />
    </>
  );
}

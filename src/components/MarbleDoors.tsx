import { useCallback, useRef } from "react";
import styles from "./MarbleDoors.module.css";

type Door = { label: string; roomKey: string };
const DOORS: Door[] = [
  { label: "Alumni · Class Composites", roomKey: "Alumni/Class Composites" },
  { label: "Publications", roomKey: "Publications (Amicus, Legal Eye, Law Review, Directory)" },
  { label: "Historical Photos · Archives", roomKey: "Historical Photos/Archives" },
  { label: "Faculty & Staff", roomKey: "Faculty & Staff" },
];

interface MarbleDoorsProps {
  onDoorClick: (roomKey: string) => void;
}

export default function MarbleDoors({ onDoorClick }: MarbleDoorsProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>, roomKey: string) => {
    e.preventDefault();
    const w = wrapperRef.current;
    if (!w) return onDoorClick(roomKey);
    
    w.classList.add(styles.exiting);
    // Trigger room transition after animation
    const t = window.setTimeout(() => onDoorClick(roomKey), 520);
    w.addEventListener(
      "animationend",
      () => {
        window.clearTimeout(t);
        onDoorClick(roomKey);
      },
      { once: true }
    );
  }, [onDoorClick]);

  return (
    <section className={styles.hall} aria-label="Museum Entrances" ref={wrapperRef}>
      <div className={styles.row}>
        {DOORS.map((d) => (
          <div 
            key={d.roomKey} 
            className={styles.door} 
            onClick={(e) => handleClick(e, d.roomKey)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleClick(e as any, d.roomKey);
              }
            }}
          >
            <span className={`${styles.face} ${styles.marble}`} aria-hidden="true" />
            <span className={styles.void} aria-hidden="true" />
            <span className={styles.label}>{d.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

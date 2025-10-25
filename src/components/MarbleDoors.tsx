import { useCallback, useRef } from "react";
import styles from "./MarbleDoors.module.css";

type Door = { label: string; key: string };

const DOORS: Door[] = [
  { label: "Alumni · Class Composites", key: "Alumni/Class Composites" },
  { label: "Publications", key: "Publications (Amicus, Legal Eye, Law Review, Directory)" },
  { label: "Historical Photos · Archives", key: "Historical Photos/Archives" },
  { label: "Faculty & Staff", key: "Faculty & Staff" },
];

interface MarbleDoorsProps {
  onDoorClick: (key: string) => void;
}

export default function MarbleDoors({ onDoorClick }: MarbleDoorsProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const onClick = useCallback((e: React.MouseEvent<HTMLButtonElement>, key: string) => {
    e.preventDefault();
    onDoorClick(key);
  }, [onDoorClick]);

  return (
    <section className={styles.hall} aria-label="Museum Entrances" ref={wrapperRef}>
      <div className={styles.row}>
        {DOORS.map((d) => (
          <button 
            key={d.key} 
            className={styles.door} 
            onClick={(e) => onClick(e, d.key)}
            type="button"
          >
            <span className={`${styles.face} ${styles.marble}`} aria-hidden="true" />
            <span className={styles.void} aria-hidden="true" />
            <span className={styles.label}>{d.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

import { DoorwayLanding } from '@/components/doorways/DoorwayLanding';
import { DOOR_CONTENT } from '@/data/roomContent';

const Alumni = () => (
  <DoorwayLanding
    title="Alumni & Class Composites"
    description="Celebrate generations of MC Law graduates and explore class composites, milestone reunions, and alumni achievements."
    highlights={DOOR_CONTENT.Alumni.items}
  />
);

export default Alumni;

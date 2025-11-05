import { DoorwayLanding } from '@/components/doorways/DoorwayLanding';
import { DOOR_CONTENT } from '@/data/roomContent';

const Publications = () => (
  <DoorwayLanding
    title="Publications & Journals"
    description="Browse the scholarship and storytelling produced by MC Law students, faculty, and alumni across our flagship publications."
    highlights={DOOR_CONTENT.Publications.items}
  />
);

export default Publications;

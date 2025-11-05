import { DoorwayLanding } from '@/components/doorways/DoorwayLanding';
import { DOOR_CONTENT } from '@/data/roomContent';

const Faculty = () => (
  <DoorwayLanding
    title="Faculty & Staff"
    description="Meet the educators, scholars, and professionals who lead and support the MC Law community."
    highlights={DOOR_CONTENT.Faculty.items}
  />
);

export default Faculty;

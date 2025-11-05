import { DoorwayLanding } from '@/components/doorways/DoorwayLanding';
import { DOOR_CONTENT } from '@/data/roomContent';

const Archives = () => (
  <DoorwayLanding
    title="Historical Photos & Archives"
    description="Discover the moments that shaped MC Law through curated photographs, artifacts, and archival records."
    highlights={DOOR_CONTENT.Archives.items}
  />
);

export default Archives;

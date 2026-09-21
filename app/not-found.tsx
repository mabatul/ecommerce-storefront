import { ButtonLink } from "@/components/Button";
import { EmptyState } from "@/components/states";

export default function NotFound() {
  return (
    <EmptyState
      title="We couldn't find that"
      message="The page or product you're looking for doesn't exist, or it's no longer available."
      action={<ButtonLink href="/products">Browse products</ButtonLink>}
    />
  );
}
